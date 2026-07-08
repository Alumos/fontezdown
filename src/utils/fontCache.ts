import type { FontLinkItem, TencentDocSyncResult } from './tencentDocs.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface FontCacheEntry extends TencentDocSyncResult {
  cachedAt: string;
}

const CACHE_PATH = resolve(process.cwd(), 'data', 'fonts.cache.json');

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeItem(value: unknown): FontLinkItem | null {
  if (typeof value !== 'object' || value === null) return null;

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
  if (typeof value !== 'object' || value === null) return null;

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

export function readFontCache(docUrl?: string): FontCacheEntry | null {
  if (!existsSync(CACHE_PATH)) return null;

  try {
    const cache = normalizeCache(
      JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as unknown,
    );
    if (!cache) return null;
    if (docUrl && cache.docUrl !== docUrl) return null;
    return cache;
  } catch {
    return null;
  }
}

export function writeFontCache(result: TencentDocSyncResult): FontCacheEntry {
  const entry: FontCacheEntry = {
    ...result,
    cachedAt: new Date().toISOString(),
  };

  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(entry, null, 2)}\n`, 'utf-8');
  return entry;
}
