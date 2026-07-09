import { parseLanzouUrl } from '../src/utils/lanzou/lanzouParser.js';
import { renderAdminPage } from '../src/ui/adminPage.js';
import { renderIndexPage } from '../src/ui/indexPage.js';
import {
  type FontLinkItem,
  type TencentCredentials,
  type TencentDocSyncResult,
  syncTencentDocFonts,
} from '../src/utils/tencentDocs.js';
import { getStore } from '@edgeone/pages-blob';
import type { ParseSuccessData } from '../src/utils/types.js';
import { Hono, type Context } from 'hono';

interface EdgeEnv {
  ADMIN_PASSCODE?: string;
  TENCENT_DOC_URL?: string;
  QQ_DOC_URL?: string;
  TENCENT_DOC_CLIENT_ID?: string;
  QQ_DOC_CLIENT_ID?: string;
  TENCENT_DOC_ACCESS_TOKEN?: string;
  QQ_DOC_ACCESS_TOKEN?: string;
  TENCENT_DOC_OPEN_ID?: string;
  QQ_DOC_OPEN_ID?: string;
  LANZOU_PWD?: string;
}

interface ManagedSettings {
  docUrl: string;
  clientId: string;
  accessToken: string;
  openId: string;
  lanzouPwd: string;
}

interface AdminState {
  passwordHash: string;
  passwordSalt: string;
  sessionSecret: string;
  envManaged?: boolean;
}

interface SettingsFile {
  settings: ManagedSettings;
  admin: AdminState;
}

interface SessionPayload {
  exp: number;
  iat: number;
}

interface FontCacheEntry extends TencentDocSyncResult {
  cachedAt: string;
}

interface LanzouParseRequest {
  url?: unknown;
  pwd?: unknown;
}

interface AdminPasscodeRequest {
  passcode?: unknown;
  currentPasscode?: unknown;
  nextPasscode?: unknown;
}

interface AdminSettingsRequest {
  docUrl?: unknown;
  clientId?: unknown;
  accessToken?: unknown;
  openId?: unknown;
  lanzouPwd?: unknown;
}

const BLOB_STORE_NAME = 'fontezdown';
const STORE_KEY = 'config/settings.json';
const CACHE_KEY = 'cache/fonts.json';
const SESSION_COOKIE = 'fontsez_admin';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const PBKDF2_ITERATIONS = 100000;

const app = new Hono<{ Bindings: EdgeEnv }>();

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function envValue(env: EdgeEnv, ...keys: (keyof EdgeEnv)[]): string {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function defaultSettings(env: EdgeEnv): ManagedSettings {
  return {
    docUrl: envValue(env, 'TENCENT_DOC_URL', 'QQ_DOC_URL'),
    clientId: envValue(env, 'TENCENT_DOC_CLIENT_ID', 'QQ_DOC_CLIENT_ID'),
    accessToken: envValue(
      env,
      'TENCENT_DOC_ACCESS_TOKEN',
      'QQ_DOC_ACCESS_TOKEN',
    ),
    openId: envValue(env, 'TENCENT_DOC_OPEN_ID', 'QQ_DOC_OPEN_ID'),
    lanzouPwd: envValue(env, 'LANZOU_PWD'),
  };
}

function getBlobStore() {
  return getStore(BLOB_STORE_NAME);
}

function randomHex(bytes: number): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function digestHex(
  algorithm: AlgorithmIdentifier,
  value: string,
): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest(algorithm, data);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256,
  );
  return [...new Uint8Array(bits)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncode(value: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(value));
}

function base64UrlDecode(value: string): string {
  const padded = `${value.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat(
    (4 - (value.length % 4)) % 4,
  )}`;
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlFromBytes(new Uint8Array(signature));
}

async function encodeSession(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${await signPayload(body, secret)}`;
}

async function decodeSession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  if (!safeEqual(await signPayload(body, secret), signature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function envAdminState(env: EdgeEnv): Promise<AdminState | null> {
  const passcode = envValue(env, 'ADMIN_PASSCODE');
  if (!passcode) return null;

  const salt = await digestHex('SHA-256', `fontsez:${passcode}:salt`);
  const secret = await digestHex('SHA-256', `fontsez:${passcode}:session`);
  return {
    passwordHash: await hashPasscode(passcode, salt),
    passwordSalt: salt,
    sessionSecret: secret,
    envManaged: true,
  };
}

async function emptyAdmin(env: EdgeEnv): Promise<AdminState> {
  const envAdmin = await envAdminState(env);
  if (envAdmin) return envAdmin;

  return {
    passwordHash: '',
    passwordSalt: '',
    sessionSecret: randomHex(32),
  };
}

async function readJsonFromBlob<T>(key: string): Promise<T | null> {
  return (await getBlobStore().get(key, {
    type: 'json',
    consistency: 'strong',
  })) as T | null;
}

async function writeJsonToBlob(key: string, value: unknown): Promise<void> {
  await getBlobStore().setJSON(key, value, {
    cacheControl: 'no-store',
  });
}

async function readStore(env: EdgeEnv): Promise<SettingsFile> {
  const parsed = await readJsonFromBlob<Partial<SettingsFile>>(STORE_KEY);

  return {
    settings: {
      ...defaultSettings(env),
      ...parsed?.settings,
    },
    admin: {
      ...(await emptyAdmin(env)),
      ...parsed?.admin,
    },
  };
}

async function writeStore(env: EdgeEnv, store: SettingsFile): Promise<void> {
  await writeJsonToBlob(STORE_KEY, store);
}

async function getManagedSettings(env: EdgeEnv): Promise<ManagedSettings> {
  return (await readStore(env)).settings;
}

async function hasAdminPasscode(env: EdgeEnv): Promise<boolean> {
  return Boolean((await readStore(env)).admin.passwordHash);
}

async function setupAdminPasscode(env: EdgeEnv, passcode: string): Promise<void> {
  const store = await readStore(env);
  if (store.admin.passwordHash) throw new Error('后台口令已经设置');

  const salt = randomHex(16);
  store.admin = {
    passwordHash: await hashPasscode(passcode, salt),
    passwordSalt: salt,
    sessionSecret: store.admin.sessionSecret || randomHex(32),
  };
  await writeStore(env, store);
}

async function verifyAdminPasscode(
  env: EdgeEnv,
  passcode: string,
): Promise<boolean> {
  const store = await readStore(env);
  if (!store.admin.passwordHash || !store.admin.passwordSalt) return false;
  const hash = await hashPasscode(passcode, store.admin.passwordSalt);
  return safeEqual(hash, store.admin.passwordHash);
}

async function changeAdminPasscode(
  env: EdgeEnv,
  currentPasscode: string,
  nextPasscode: string,
): Promise<void> {
  const store = await readStore(env);
  if (store.admin.envManaged) {
    throw new Error('当前口令由 EdgeOne 环境变量 ADMIN_PASSCODE 管理');
  }
  if (!(await verifyAdminPasscode(env, currentPasscode))) {
    throw new Error('当前口令不正确');
  }

  const salt = randomHex(16);
  store.admin.passwordSalt = salt;
  store.admin.passwordHash = await hashPasscode(nextPasscode, salt);
  store.admin.sessionSecret = randomHex(32);
  await writeStore(env, store);
}

async function createAdminSessionCookie(env: EdgeEnv): Promise<string> {
  const store = await readStore(env);
  const now = Date.now();
  const token = await encodeSession(
    {
      iat: now,
      exp: now + SESSION_TTL_MS,
    },
    store.admin.sessionSecret,
  );

  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${
    SESSION_TTL_MS / 1000
  }`;
}

function clearAdminSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

async function isAdminRequest(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<boolean> {
  const store = await readStore(env);
  if (!store.admin.passwordHash) return false;

  const cookies = Object.fromEntries(
    (cookieHeader ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1
          ? [part, '']
          : [part.slice(0, index), part.slice(index + 1)];
      }),
  );

  const token = cookies[SESSION_COOKIE];
  return Boolean(
    token && (await decodeSession(token, store.admin.sessionSecret)),
  );
}

async function publicConfigStatus(env: EdgeEnv): Promise<{
  hasAdminPasscode: boolean;
  hasDocUrl: boolean;
  hasTencentCredentials: boolean;
  hasLanzouPassword: boolean;
}> {
  const store = await readStore(env);
  return {
    hasAdminPasscode: Boolean(store.admin.passwordHash),
    hasDocUrl: Boolean(store.settings.docUrl),
    hasTencentCredentials: Boolean(
      store.settings.clientId &&
        store.settings.accessToken &&
        store.settings.openId,
    ),
    hasLanzouPassword: Boolean(store.settings.lanzouPwd),
  };
}

async function readFontCache(
  env: EdgeEnv,
  docUrl?: string,
): Promise<FontCacheEntry | null> {
  const cache = await readJsonFromBlob<FontCacheEntry>(CACHE_KEY);
  if (!cache) return null;
  if (docUrl && cache.docUrl !== docUrl) return null;
  return cache;
}

async function writeFontCache(
  env: EdgeEnv,
  result: TencentDocSyncResult,
): Promise<FontCacheEntry> {
  const entry = {
    ...result,
    cachedAt: new Date().toISOString(),
  };
  await writeJsonToBlob(CACHE_KEY, entry);
  return entry;
}

function settingsCredentials(settings: ManagedSettings): TencentCredentials {
  return {
    clientId: settings.clientId,
    accessToken: settings.accessToken,
    openId: settings.openId,
  };
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

async function requireAdmin(c: Context<{ Bindings: EdgeEnv }>): Promise<Response | null> {
  if (await isAdminRequest(c.env, c.req.header('cookie'))) return null;
  return c.json({ code: 401, msg: '需要登录后访问' }, 401);
}

function validatePasscode(passcode: string): void {
  if (passcode.length < 4) throw new Error('口令至少需要 4 位');
}

function settingsFromBody(body: AdminSettingsRequest): ManagedSettings {
  return {
    docUrl: stringValue(body.docUrl),
    clientId: stringValue(body.clientId),
    accessToken: stringValue(body.accessToken),
    openId: stringValue(body.openId),
    lanzouPwd: stringValue(body.lanzouPwd),
  };
}

app.get('/', (c) => c.html(renderIndexPage()));
app.get('/admin', (c) => c.html(renderAdminPage()));

app.get('/api/config', async (c) => {
  const status = await publicConfigStatus(c.env);
  return c.json({
    code: 0,
    data: {
      ...status,
      isReady: status.hasDocUrl && status.hasTencentCredentials,
    },
  });
});

app.get('/api/admin/status', async (c) => {
  return c.json({
    code: 0,
    data: {
      hasAdminPasscode: await hasAdminPasscode(c.env),
      isAuthenticated: await isAdminRequest(c.env, c.req.header('cookie')),
    },
  });
});

app.post('/api/admin/setup', async (c) => {
  try {
    const body = await readJson<AdminPasscodeRequest>(c.req.raw);
    const passcode = stringValue(body.passcode);
    validatePasscode(passcode);
    await setupAdminPasscode(c.env, passcode);
    c.header('Set-Cookie', await createAdminSessionCookie(c.env));
    return c.json({ code: 0, msg: '后台口令已设置' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

app.post('/api/admin/login', async (c) => {
  const body = await readJson<AdminPasscodeRequest>(c.req.raw);
  const passcode = stringValue(body.passcode);

  if (!(await verifyAdminPasscode(c.env, passcode))) {
    return c.json({ code: 1, msg: '口令不正确' }, 401);
  }

  c.header('Set-Cookie', await createAdminSessionCookie(c.env));
  return c.json({ code: 0, msg: '登录成功' });
});

app.post('/api/admin/logout', (c) => {
  c.header('Set-Cookie', clearAdminSessionCookie());
  return c.json({ code: 0, msg: '已退出' });
});

app.get('/api/admin/settings', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  return c.json({
    code: 0,
    data: await getManagedSettings(c.env),
  });
});

app.post('/api/admin/settings', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AdminSettingsRequest>(c.req.raw);
    const settings = settingsFromBody(body);
    const store = await readStore(c.env);
    store.settings = settings;
    await writeStore(c.env, store);
    return c.json({
      code: 0,
      msg: '保存成功',
      data: {
        hasDocUrl: Boolean(settings.docUrl),
        hasTencentCredentials: Boolean(
          settings.clientId && settings.accessToken && settings.openId,
        ),
        hasLanzouPassword: Boolean(settings.lanzouPwd),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

app.post('/api/admin/passcode', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AdminPasscodeRequest>(c.req.raw);
    const currentPasscode = stringValue(body.currentPasscode);
    const nextPasscode = stringValue(body.nextPasscode);
    validatePasscode(nextPasscode);
    await changeAdminPasscode(c.env, currentPasscode, nextPasscode);
    c.header('Set-Cookie', clearAdminSessionCookie());
    return c.json({ code: 0, msg: '口令已更新，请重新登录' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

app.post('/api/fonts/sync', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const settings = await getManagedSettings(c.env);
  const docUrl = settings.docUrl;

  try {
    const data = await syncTencentDocFonts({
      docUrl,
      credentials: settingsCredentials(settings),
    });
    const cache = await writeFontCache(c.env, data);

    return c.json({
      code: 0,
      msg: '同步成功',
      data: {
        ...cache,
        fromCache: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cache = await readFontCache(c.env, docUrl);
    if (cache) {
      return c.json({
        code: 0,
        msg: `同步失败，已使用上次缓存：${message}`,
        data: {
          ...cache,
          fromCache: true,
          syncError: message,
        },
      });
    }

    return c.json(
      {
        code: 1,
        msg: `同步失败：${message}`,
      },
      400,
    );
  }
});

app.get('/api/fonts/cache', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const settings = await getManagedSettings(c.env);
  const docUrl = settings.docUrl;
  const cache = await readFontCache(c.env, docUrl);

  return c.json({
    code: 0,
    msg: cache ? '读取缓存成功' : '暂无缓存',
    data: cache
      ? {
          ...cache,
          fromCache: true,
        }
      : {
          docUrl,
          items: [] as FontLinkItem[],
          fromCache: false,
        },
  });
});

app.post('/api/lanzou/parse', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  const body = await readJson<LanzouParseRequest>(c.req.raw);
  const url = stringValue(body.url);
  const pwd = stringValue(body.pwd) || (await getManagedSettings(c.env)).lanzouPwd;

  if (!url) {
    return c.json({ code: 1, msg: '缺少蓝奏云链接' }, 400);
  }

  try {
    const result = await parseLanzouUrl({
      url,
      pwd,
      type: 'json',
    });

    if (result.code !== 0) {
      return c.json(result, 400);
    }

    if ('files' in result.data) {
      return c.json({
        code: 0,
        msg: result.msg,
        data: {
          files: result.data.files,
        },
      });
    }

    const parsedData = result.data as ParseSuccessData;
    return c.json({
      code: 0,
      msg: result.msg,
      data: {
        files: [
          {
            name: parsedData.name,
            size: parsedData.filesize,
            date: '',
            downloadUrl: parsedData.downUrl,
          },
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        code: 1,
        msg: message,
      },
      500,
    );
  }
});

app.all('/lanzou', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    const url = c.req.query('url') as string;
    if (!url) return c.json({ code: 1, msg: '缺少 url 参数' });
    const pwd = c.req.query('pwd') || (await getManagedSettings(c.env)).lanzouPwd;
    const type = c.req.query('type') || 'json';

    const data = await parseLanzouUrl({
      url,
      pwd,
      type,
    });

    if (data.code === 0 && data.data && 'redirect' in data.data) {
      return c.redirect(data.data.redirect);
    }
    return c.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: '获取信息失败', data: message });
  }
});

app.all('*', (c) => {
  return c.json({ success: false, message: '接口不存在' }, 404);
});

export function onRequest(context: {
  request: Request;
  env: EdgeEnv;
}): Response | Promise<Response> {
  return app.fetch(context.request, context.env);
}
