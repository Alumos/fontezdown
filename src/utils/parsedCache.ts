import type { FontLinkItem } from "./tencentDocs.js";
import type { ParseFileItem } from "./types.js";
import {
  cacheDataPath,
  getCacheDb,
  getCacheMeta,
  runInCacheTransaction,
  setCacheMeta,
  tableCount,
} from "./cacheDb.js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export interface ParsedCacheRecord {
  itemId: string;
  fontName: string;
  lanzouUrl: string;
  parsedAt: string;
  files: ParseFileItem[];
}

export interface ParsedCachePayload {
  files: ParseFileItem[];
  parsedAt: string;
  fromParsedCache: true;
}

interface ParsedCacheFile {
  version: 1;
  updatedAt: string;
  entries: Record<string, ParsedCacheRecord>;
}

const LEGACY_CACHE_PATH = cacheDataPath("parsed.cache.json");
const LEGACY_MIGRATION_KEY = "legacy.parsed.cache.json.migrated";

let legacyMigrationChecked = false;

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function rowString(
  row: Record<string, unknown> | undefined,
  key: string,
): string {
  return stringValue(row?.[key]);
}

function normalizeFile(value: unknown): ParseFileItem | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const name = stringValue(record.name);
  const size = stringValue(record.size);
  const date = stringValue(record.date);
  const downloadUrl = stringValue(record.downloadUrl);
  const error = stringValue(record.error);

  if (!name && !downloadUrl && !error) return null;
  return {
    name,
    size,
    date,
    downloadUrl,
    ...(error ? { error } : {}),
  };
}

function normalizeRecord(value: unknown): ParsedCacheRecord | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const itemId = stringValue(record.itemId);
  const fontName = stringValue(record.fontName);
  const lanzouUrl = stringValue(record.lanzouUrl);
  const parsedAt = stringValue(record.parsedAt);
  const files = Array.isArray(record.files)
    ? record.files.map(normalizeFile).filter((file) => file !== null)
    : [];

  if (!itemId || !lanzouUrl || !parsedAt || files.length === 0) return null;
  return {
    itemId,
    fontName,
    lanzouUrl,
    parsedAt,
    files,
  };
}

function normalizeLegacyCache(value: unknown): ParsedCacheFile {
  if (typeof value !== "object" || value === null) {
    return emptyCache();
  }

  const record = value as Record<string, unknown>;
  const entriesValue = record.entries;
  const entries =
    typeof entriesValue === "object" && entriesValue !== null
      ? Object.entries(entriesValue as Record<string, unknown>).reduce<
          Record<string, ParsedCacheRecord>
        >((result, [key, entryValue]) => {
          const parsed = normalizeRecord(entryValue);
          if (parsed) result[key] = parsed;
          return result;
        }, {})
      : {};

  return {
    version: 1,
    updatedAt: stringValue(record.updatedAt) || new Date().toISOString(),
    entries,
  };
}

function parsedCacheKey(itemId: string, lanzouUrl: string): string {
  if (itemId) return itemId;
  return `url:${createHash("sha256").update(lanzouUrl).digest("hex").slice(0, 24)}`;
}

function emptyCache(): ParsedCacheFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: {},
  };
}

function filesForCacheKey(cacheKey: string): ParseFileItem[] {
  return getCacheDb()
    .prepare(
      `SELECT name, size, date, download_url, error
       FROM parse_files
       WHERE cache_key = ?
       ORDER BY file_index ASC`,
    )
    .all(cacheKey)
    .map((row) =>
      normalizeFile({
        name: row.name,
        size: row.size,
        date: row.date,
        downloadUrl: row.download_url,
        error: row.error,
      }),
    )
    .filter((file) => file !== null);
}

function upsertParsedCacheRecord(
  cacheKey: string,
  record: ParsedCacheRecord,
): void {
  const db = getCacheDb();

  db.prepare(
    `INSERT INTO parse_records
      (cache_key, item_id, font_name, lanzou_url, parsed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
      item_id = excluded.item_id,
      font_name = excluded.font_name,
      lanzou_url = excluded.lanzou_url,
      parsed_at = excluded.parsed_at`,
  ).run(
    cacheKey,
    record.itemId,
    record.fontName,
    record.lanzouUrl,
    record.parsedAt,
  );

  db.prepare("DELETE FROM parse_files WHERE cache_key = ?").run(cacheKey);
  const insertFile = db.prepare(
    `INSERT INTO parse_files
      (cache_key, file_index, name, size, date, download_url, error)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  record.files.forEach((file, index) => {
    insertFile.run(
      cacheKey,
      index,
      file.name,
      file.size,
      file.date,
      file.downloadUrl,
      file.error || "",
    );
  });
}

function migrateLegacyParsedCache(): void {
  if (legacyMigrationChecked) return;
  legacyMigrationChecked = true;

  if (getCacheMeta(LEGACY_MIGRATION_KEY) === "1") return;

  if (tableCount("parse_records") === 0 && existsSync(LEGACY_CACHE_PATH)) {
    try {
      const cache = normalizeLegacyCache(
        JSON.parse(readFileSync(LEGACY_CACHE_PATH, "utf-8")) as unknown,
      );
      runInCacheTransaction(() => {
        for (const [cacheKey, record] of Object.entries(cache.entries)) {
          upsertParsedCacheRecord(cacheKey, record);
        }
      });
    } catch {
      // Ignore corrupt legacy cache; SQLite will be populated by future parses.
    }
  }

  setCacheMeta(LEGACY_MIGRATION_KEY, "1");
}

export function readParsedCacheForItems(
  items: FontLinkItem[],
): Record<string, ParsedCachePayload> {
  migrateLegacyParsedCache();

  const selectRecord = getCacheDb().prepare(
    `SELECT cache_key, item_id, lanzou_url, parsed_at
     FROM parse_records
     WHERE cache_key = ? AND lanzou_url = ?`,
  );

  return items.reduce<Record<string, ParsedCachePayload>>((result, item) => {
    const key = parsedCacheKey(item.id, item.lanzouUrl);
    const row = selectRecord.get(key, item.lanzouUrl);
    if (!row) return result;

    const files = filesForCacheKey(rowString(row, "cache_key"));
    if (files.length === 0) return result;

    result[item.id] = {
      files,
      parsedAt: rowString(row, "parsed_at"),
      fromParsedCache: true,
    };
    return result;
  }, {});
}

export function writeParsedCacheRecord({
  itemId,
  fontName,
  lanzouUrl,
  files,
}: {
  itemId: string;
  fontName: string;
  lanzouUrl: string;
  files: ParseFileItem[];
}): ParsedCacheRecord {
  migrateLegacyParsedCache();

  const record: ParsedCacheRecord = {
    itemId,
    fontName,
    lanzouUrl,
    files,
    parsedAt: new Date().toISOString(),
  };
  runInCacheTransaction(() => {
    upsertParsedCacheRecord(parsedCacheKey(itemId, lanzouUrl), record);
  });
  return record;
}
