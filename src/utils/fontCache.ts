import type { FontLinkItem, TencentDocSyncResult } from "./tencentDocs.js";
import {
  cacheDataPath,
  getCacheDb,
  getCacheMeta,
  runInCacheTransaction,
  setCacheMeta,
  tableCount,
} from "./cacheDb.js";
import { existsSync, readFileSync } from "node:fs";

export interface FontCacheEntry extends TencentDocSyncResult {
  cachedAt: string;
}

const LEGACY_CACHE_PATH = cacheDataPath("fonts.cache.json");
const LEGACY_MIGRATION_KEY = "legacy.fonts.cache.json.migrated";

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

function normalizeItem(value: unknown): FontLinkItem | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const id = stringValue(record.id);
  const fontName = stringValue(record.fontName);
  const lanzouUrl = stringValue(record.lanzouUrl);
  const sourceLine = stringValue(record.sourceLine);

  if (!id || !fontName || !lanzouUrl) return null;
  return {
    id,
    fontName,
    lanzouUrl,
    sourceLine,
  };
}

function normalizeCache(value: unknown): FontCacheEntry | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const items = Array.isArray(record.items)
    ? record.items.map(normalizeItem).filter((item) => item !== null)
    : [];
  const docUrl = stringValue(record.docUrl);
  const encodedId = stringValue(record.encodedId);
  const fileId = stringValue(record.fileId);
  const fetchedAt = stringValue(record.fetchedAt);
  const cachedAt = stringValue(record.cachedAt) || fetchedAt;

  if (!docUrl || !encodedId || !fileId || !fetchedAt) return null;
  return {
    docUrl,
    encodedId,
    fileId,
    fetchedAt,
    cachedAt,
    items,
  };
}

function replaceFontCache(entry: FontCacheEntry): void {
  const db = getCacheDb();

  runInCacheTransaction(() => {
    db.prepare("DELETE FROM fonts").run();
    db.prepare("DELETE FROM font_cache_meta").run();
    db.prepare(
      `INSERT INTO font_cache_meta
        (id, doc_url, encoded_id, file_id, fetched_at, cached_at)
       VALUES (1, ?, ?, ?, ?, ?)`,
    ).run(
      entry.docUrl,
      entry.encodedId,
      entry.fileId,
      entry.fetchedAt,
      entry.cachedAt,
    );

    const insertItem = db.prepare(
      `INSERT INTO fonts
        (id, font_name, lanzou_url, source_line, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
    );
    entry.items.forEach((item, index) => {
      insertItem.run(
        item.id,
        item.fontName,
        item.lanzouUrl,
        item.sourceLine,
        index,
      );
    });
  });
}

function migrateLegacyFontCache(): void {
  if (legacyMigrationChecked) return;
  legacyMigrationChecked = true;

  if (getCacheMeta(LEGACY_MIGRATION_KEY) === "1") return;

  if (tableCount("fonts") === 0 && existsSync(LEGACY_CACHE_PATH)) {
    try {
      const cache = normalizeCache(
        JSON.parse(readFileSync(LEGACY_CACHE_PATH, "utf-8")) as unknown,
      );
      if (cache) replaceFontCache(cache);
    } catch {
      // Ignore corrupt legacy cache; SQLite will be populated on the next sync.
    }
  }

  setCacheMeta(LEGACY_MIGRATION_KEY, "1");
}

export function readFontCache(docUrl?: string): FontCacheEntry | null {
  migrateLegacyFontCache();

  const db = getCacheDb();
  const meta = db
    .prepare(
      `SELECT doc_url, encoded_id, file_id, fetched_at, cached_at
       FROM font_cache_meta
       WHERE id = 1`,
    )
    .get();

  if (!meta) return null;

  const cacheDocUrl = rowString(meta, "doc_url");
  if (docUrl && cacheDocUrl !== docUrl) return null;

  const items = db
    .prepare(
      `SELECT id, font_name, lanzou_url, source_line
       FROM fonts
       ORDER BY sort_order ASC`,
    )
    .all()
    .map((row) =>
      normalizeItem({
        id: row.id,
        fontName: row.font_name,
        lanzouUrl: row.lanzou_url,
        sourceLine: row.source_line,
      }),
    )
    .filter((item) => item !== null);

  return {
    docUrl: cacheDocUrl,
    encodedId: rowString(meta, "encoded_id"),
    fileId: rowString(meta, "file_id"),
    fetchedAt: rowString(meta, "fetched_at"),
    cachedAt: rowString(meta, "cached_at") || rowString(meta, "fetched_at"),
    items,
  };
}

export function writeFontCache(result: TencentDocSyncResult): FontCacheEntry {
  migrateLegacyFontCache();

  const entry: FontCacheEntry = {
    ...result,
    cachedAt: new Date().toISOString(),
  };
  replaceFontCache(entry);
  return entry;
}
