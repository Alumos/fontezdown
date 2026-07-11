import type { Context } from 'hono';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocalEnv(fileName: string): void {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv('.env');
loadLocalEnv('.env.local');

function envValue(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return '';
}

function envNumber(key: string, defaultValue: number): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function envList(...keys: string[]): string[] {
  const value = envValue(...keys);
  if (!value) return [];

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .filter((item): item is string => typeof item === 'string')
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        );
      }
    } catch {
      // Fall through to the comma/newline separated format.
    }
  }

  return Array.from(
    new Set(
      value
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export const PORT = envNumber('PORT', 1103);
export const rateLimit = {
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (c: Context) => c.req.header('x-forwarded-for') ?? '',
};

export const tencentDocs = {
  docUrl: envValue('TENCENT_DOC_URL', 'QQ_DOC_URL'),
  clientId: envValue('TENCENT_DOC_CLIENT_ID', 'QQ_DOC_CLIENT_ID'),
  accessToken: envValue('TENCENT_DOC_ACCESS_TOKEN', 'QQ_DOC_ACCESS_TOKEN'),
  openId: envValue('TENCENT_DOC_OPEN_ID', 'QQ_DOC_OPEN_ID'),
};

const wechatRssUrls = envList(
  'WECHAT_RSS_URLS',
  'WECHAT_RSS_URL',
  'WECHAT_ARTICLE_RSS_URL',
);

export const wechatRss = {
  rssUrls: wechatRssUrls,
  rssUrl: wechatRssUrls[0] || '',
};

const config = {
  PORT,
  rateLimit,
  tencentDocs,
  wechatRss,
};

export default config;
