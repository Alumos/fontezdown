import axios, { type AxiosRequestConfig } from 'axios';

export interface TencentCredentials {
  clientId: string;
  accessToken: string;
  openId: string;
}

export interface TencentDocSyncInput {
  docUrl: string;
  credentials: TencentCredentials;
}

export interface FontLinkItem {
  id: string;
  fontName: string;
  lanzouUrl: string;
  sourceLine: string;
}

export interface TencentDocSyncResult {
  docUrl: string;
  encodedId: string;
  fileId: string;
  fetchedAt: string;
  items: FontLinkItem[];
}

type JsonObject = Record<string, unknown>;

const LANZOU_URL_RE =
  new RegExp(
    String.raw`\b(?:https?:\/\/)?(?:[\w-]+\.)?(?:lanzou[a-z0-9]*|lanzn)\.com\/[^\u0000-\u001f\s"'<>，。；、\])）]+`,
    'gi',
  );
const TRAILING_URL_PUNCTUATION_RE = new RegExp(
  String.raw`[\u0000-\u001f)\]）】。；;，,]+$`,
  'g',
);
const TENCENT_SYNC_RETRY_ATTEMPTS = 3;
const TENCENT_SYNC_RETRY_BASE_MS = 700;
const TRANSIENT_TENCENT_ERROR_RE =
  /file service timeout|timeout|timed out|etimedout|econnreset|eai_again|socket hang up|network error/i;
const BASE64URL_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const PARAGRAPH_TEXT_KEYS = new Set([
  'caption',
  'content',
  'insert',
  'plaintext',
  'text',
  'value',
]);

function isParagraphTextKey(key: string): boolean {
  return PARAGRAPH_TEXT_KEYS.has(key.replace(/[-_]/g, '').toLowerCase());
}

function matchLanzouUrls(text: string): string[] {
  LANZOU_URL_RE.lastIndex = 0;
  return text.match(LANZOU_URL_RE) ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function retryableStatus(status: number | undefined): boolean {
  return Boolean(
    status &&
      (status === 408 || status === 409 || status === 429 || status >= 500),
  );
}

function errorText(error: unknown): string {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.message);
  }

  if (axios.isAxiosError(error)) {
    if (error.code) parts.push(error.code);
    if (error.response?.status) parts.push(String(error.response.status));

    const data = error.response?.data;
    if (typeof data === 'string') {
      parts.push(data);
    } else if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      for (const key of ['msg', 'message', 'errmsg']) {
        const value = record[key];
        if (typeof value === 'string') parts.push(value);
      }
    }
  }

  return parts.join(' ');
}

function isTransientTencentError(error: unknown): boolean {
  if (axios.isAxiosError(error) && retryableStatus(error.response?.status)) {
    return true;
  }

  return TRANSIENT_TENCENT_ERROR_RE.test(errorText(error));
}

async function withTencentRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= TENCENT_SYNC_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        attempt >= TENCENT_SYNC_RETRY_ATTEMPTS ||
        !isTransientTencentError(error)
      ) {
        throw error;
      }

      await sleep(TENCENT_SYNC_RETRY_BASE_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isHyperlinkFieldText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return (
    /^HYPERLINK\b/i.test(normalized) ||
    /(?:\\t|\s)d(?:key|fe|fn|fu|lt)\b/i.test(normalized)
  );
}

function authHeaders(credentials: TencentCredentials): Record<string, string> {
  return {
    'Access-Token': credentials.accessToken,
    'Client-Id': credentials.clientId,
    'Open-Id': credentials.openId,
  };
}

function assertCredentials(credentials: TencentCredentials): void {
  const missing = [
    ['TENCENT_DOC_CLIENT_ID', credentials.clientId],
    ['TENCENT_DOC_ACCESS_TOKEN', credentials.accessToken],
    ['TENCENT_DOC_OPEN_ID', credentials.openId],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`缺少腾讯文档凭据：${missing.join(', ')}`);
  }
}

export function extractEncodedId(docUrlOrId: string): string {
  const trimmed = docUrlOrId.trim();
  if (!trimmed) throw new Error('缺少腾讯文档地址');

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/(?:doc|sheet|slide)\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);

    const parts = url.pathname.split('/').filter(Boolean);
    const lastPart = parts.at(-1);
    if (lastPart) return decodeURIComponent(lastPart);
  } catch {
    return trimmed;
  }

  return trimmed;
}

function parseTencentPayload(payload: unknown): JsonObject {
  if (typeof payload === 'object' && payload !== null) {
    return payload as JsonObject;
  }
  if (typeof payload !== 'string') {
    throw new Error('腾讯文档接口返回了无法识别的数据');
  }

  const candidates = [payload, payload.replaceAll("'", '"')];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as JsonObject;
      }
    } catch {
      // Try the next representation.
    }
  }

  throw new Error('腾讯文档接口返回的 JSON 解析失败');
}

function responseRet(payload: JsonObject): number | undefined {
  const ret = payload.ret ?? payload.code;
  return typeof ret === 'number' ? ret : undefined;
}

function responseMessage(payload: JsonObject): string {
  const message = payload.msg ?? payload.message ?? payload.errmsg;
  if (typeof message === 'string' && message) {
    return /oversize/i.test(message)
      ? '腾讯文档内容过大（OverSize）'
      : message;
  }

  return '腾讯文档接口请求失败';
}

function objectValue(payload: JsonObject, key: string): JsonObject | undefined {
  const value = payload[key];
  return typeof value === 'object' && value !== null
    ? (value as JsonObject)
    : undefined;
}

function findStringValue(value: unknown, keys: string[]): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringValue(item, keys);
      if (found) return found;
    }
    return undefined;
  }

  const record = value as JsonObject;
  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === 'string' && direct) return direct;
  }

  for (const item of Object.values(record)) {
    const found = findStringValue(item, keys);
    if (found) return found;
  }

  return undefined;
}

async function getFileId(
  encodedId: string,
  credentials: TencentCredentials,
): Promise<string> {
  const requestConfig: AxiosRequestConfig = {
    headers: authHeaders(credentials),
    responseType: 'text',
    timeout: 15000,
    validateStatus: () => true,
  };

  const response = await axios.get(
    'https://docs.qq.com/openapi/drive/v2/util/converter',
    {
      ...requestConfig,
      params: {
        type: 2,
        value: encodedId,
      },
    },
  );
  const payload = parseTencentPayload(response.data);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(responseMessage(payload));
  }

  const ret = responseRet(payload);
  if (ret !== undefined && ret !== 0) throw new Error(responseMessage(payload));

  const fileId = findStringValue(payload, ['fileID', 'fileId', 'id']);
  if (!fileId) throw new Error('腾讯文档接口未返回 fileID');

  return fileId;
}

async function getDocument(
  fileId: string,
  credentials: TencentCredentials,
): Promise<JsonObject> {
  const response = await axios.get(
    `https://docs.qq.com/openapi/doc/v3/${encodeURIComponent(fileId)}`,
    {
      headers: authHeaders(credentials),
      responseType: 'json',
      timeout: 20000,
      validateStatus: () => true,
    },
  );
  const payload = parseTencentPayload(response.data);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(responseMessage(payload));
  }

  const ret = responseRet(payload);
  if (ret !== undefined && ret !== 0) throw new Error(responseMessage(payload));
  return payload;
}

function isParagraphNode(value: unknown): value is JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const type = (value as JsonObject).type;
  return typeof type === 'string' && type.toLowerCase() === 'paragraph';
}

function textAndUrlsFromParagraph(value: unknown): {
  textParts: string[];
  urls: string[];
} {
  const result = {
    textParts: [] as string[],
    urls: [] as string[],
  };

  function walk(current: unknown, key = ''): void {
    if (typeof current === 'string') {
      const urls = matchLanzouUrls(current);
      result.urls.push(...urls);

      if (isParagraphTextKey(key)) {
        result.textParts.push(current);
      }
      return;
    }

    if (Array.isArray(current)) {
      for (const item of current) walk(item);
      return;
    }

    if (typeof current === 'object' && current !== null) {
      for (const [childKey, childValue] of Object.entries(current)) {
        walk(childValue, childKey);
      }
    }
  }

  walk(value);
  return result;
}

function uniqueNormalizedUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const normalized = normalizeLanzouUrl(url);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function paragraphLines(paragraph: JsonObject): string[] {
  const { textParts, urls } = textAndUrlsFromParagraph(paragraph);
  let text = textParts.join('');
  const linkUrls = uniqueNormalizedUrls(urls);

  if (linkUrls.length > 0 && matchLanzouUrls(text).length === 0) {
    text = [text, ...linkUrls].filter(Boolean).join(' ');
  }

  return text
    .split(/\r\n?|\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function collectParagraphLines(payload: unknown): string[] {
  const lines: string[] = [];

  function walk(current: unknown): void {
    if (Array.isArray(current)) {
      for (const item of current) walk(item);
    } else if (isParagraphNode(current)) {
      lines.push(...paragraphLines(current));
    } else if (typeof current === 'object' && current !== null) {
      for (const value of Object.values(current)) walk(value);
    }
  }

  walk(payload);

  return lines;
}

function cleanFontName(text: string): string {
  if (isHyperlinkFieldText(text)) return '';

  return text
    .replace(/\[[^\]]*lanzou[^\]]*\]\([^)]*\)/gi, ' ')
    .replace(LANZOU_URL_RE, ' ')
    .replace(/HYPERLINK\b.*$/i, ' ')
    .replace(
      /(?:蓝奏云?|下载|链接|地址|提取码|访问码|密码|pwd|pass)\s*[:：]?\s*/gi,
      ' ',
    )
    .replace(/\[/g, ' ')
    .replace(/\]/g, ' ')
    .replace(/[()（）【】]+/g, ' ')
    .replace(/[|｜,，;；、\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-:：\s]+|[-:：\s]+$/g, '')
    .trim();
}

function normalizeLanzouUrl(url: string): string {
  const cleanUrl = url.replace(TRAILING_URL_PUNCTUATION_RE, '');
  return /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;
}

function base64UrlEncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;

    output += BASE64URL_CHARS.charAt(first >> 2);
    output += BASE64URL_CHARS.charAt(((first & 0x03) << 4) | (second >> 4));
    if (index + 1 < bytes.length) {
      output += BASE64URL_CHARS.charAt(
        ((second & 0x0f) << 2) | (third >> 6),
      );
    }
    if (index + 2 < bytes.length) {
      output += BASE64URL_CHARS.charAt(third & 0x3f);
    }
  }

  return output;
}

export function extractFontLinks(lines: string[]): FontLinkItem[] {
  const items: FontLinkItem[] = [];
  const seen = new Set<string>();
  let pendingFontName = '';

  for (const line of lines) {
    const urls = matchLanzouUrls(line);
    if (!urls || urls.length === 0) {
      const cleanLine = cleanFontName(line);
      if (cleanLine) pendingFontName = cleanLine;
      continue;
    }

    const inlineFontName = cleanFontName(line);
    const canUsePendingFontName = isHyperlinkFieldText(line);
    if (!inlineFontName && !canUsePendingFontName) {
      pendingFontName = '';
      continue;
    }

    for (const rawUrl of urls) {
      const lanzouUrl = normalizeLanzouUrl(rawUrl);
      const fontName =
        inlineFontName ||
        (canUsePendingFontName ? pendingFontName : '') ||
        `未命名字体 ${items.length + 1}`;
      const key = `${fontName}|${lanzouUrl}`;
      if (seen.has(key)) continue;

      seen.add(key);
      items.push({
        id: base64UrlEncodeUtf8(key),
        fontName,
        lanzouUrl,
        sourceLine: line,
      });
    }

    pendingFontName = '';
  }

  return items;
}

export function extractFontLinksFromDocument(payload: unknown): FontLinkItem[] {
  const lines = collectParagraphLines(payload);
  if (lines.length === 0) {
    throw new Error('腾讯文档接口未返回可识别的正文段落');
  }

  return extractFontLinks(lines);
}

export async function syncTencentDocFonts({
  docUrl,
  credentials,
}: TencentDocSyncInput): Promise<TencentDocSyncResult> {
  assertCredentials(credentials);

  const encodedId = extractEncodedId(docUrl);
  const fileId = await withTencentRetry(() => getFileId(encodedId, credentials));
  const document = await withTencentRetry(() =>
    getDocument(fileId, credentials),
  );
  const items = extractFontLinksFromDocument(
    objectValue(document, 'data') ?? document,
  );

  return {
    docUrl,
    encodedId,
    fileId,
    fetchedAt: new Date().toISOString(),
    items,
  };
}
