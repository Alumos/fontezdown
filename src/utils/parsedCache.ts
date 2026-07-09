import type { FontLinkItem } from './tencentDocs.js';
import type { ParseFileItem } from './types.js';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

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

const CACHE_PATH = resolve(process.cwd(), 'data', 'parsed.cache.json');

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeFile(value: unknown): ParseFileItem | null {
  if (typeof value !== 'object' || value === null) return null;

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
  if (typeof value !== 'object' || value === null) return null;

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

function parsedCacheKey(itemId: string, lanzouUrl: string): string {
  if (itemId) return itemId;
  return `url:${createHash('sha256').update(lanzouUrl).digest('hex').slice(0, 24)}`;
}

function emptyCache(): ParsedCacheFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: {},
  };
}

function readParsedCacheFile(): ParsedCacheFile {
  if (!existsSync(CACHE_PATH)) return emptyCache();

  try {
    const parsed = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as Record<
      string,
      unknown
    >;
    const entriesValue = parsed.entries;
    const entries =
      typeof entriesValue === 'object' && entriesValue !== null
        ? Object.entries(entriesValue as Record<string, unknown>).reduce<
            Record<string, ParsedCacheRecord>
          >((result, [key, value]) => {
            const record = normalizeRecord(value);
            if (record) result[key] = record;
            return result;
          }, {})
        : {};

    return {
      version: 1,
      updatedAt: stringValue(parsed.updatedAt) || new Date().toISOString(),
      entries,
    };
  } catch {
    return emptyCache();
  }
}

function writeParsedCacheFile(cache: ParsedCacheFile): void {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf-8');
}

export function readParsedCacheForItems(
  items: FontLinkItem[],
): Record<string, ParsedCachePayload> {
  const cache = readParsedCacheFile();

  return items.reduce<Record<string, ParsedCachePayload>>((result, item) => {
    const record = cache.entries[parsedCacheKey(item.id, item.lanzouUrl)];
    if (!record || record.lanzouUrl !== item.lanzouUrl) return result;

    result[item.id] = {
      files: record.files,
      parsedAt: record.parsedAt,
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
  const cache = readParsedCacheFile();
  const record: ParsedCacheRecord = {
    itemId,
    fontName,
    lanzouUrl,
    files,
    parsedAt: new Date().toISOString(),
  };

  cache.entries[parsedCacheKey(itemId, lanzouUrl)] = record;
  cache.updatedAt = record.parsedAt;
  writeParsedCacheFile(cache);
  return record;
}
