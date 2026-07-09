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

interface AccessPasscode {
  id: string;
  label: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

interface AccessState {
  passcodes: AccessPasscode[];
  sessionSecret: string;
}

interface SettingsFile {
  settings: ManagedSettings;
  admin: AdminState;
  access?: AccessState;
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

interface AccessPasscodeRequest {
  id?: unknown;
  label?: unknown;
  passcode?: unknown;
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
const ADMIN_SESSION_COOKIE = 'fontsez_admin';
const ACCESS_SESSION_COOKIE = 'fontsez_access';
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function randomHex(bytes: number): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomReadablePasscode(): string {
  return randomHex(4).toUpperCase();
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

function emptyAdmin(): AdminState {
  return {
    passwordHash: '',
    passwordSalt: '',
    sessionSecret: randomHex(32),
  };
}

function emptyAccess(): AccessState {
  return {
    passcodes: [],
    sessionSecret: randomHex(32),
  };
}

async function readJsonFromBlob<T>(key: string): Promise<T | null> {
  return (await getBlobStore().get(key, {
    type: 'json',
    consistency: 'strong',
  })) as T | null;
}

async function readOptionalJsonFromBlob<T>(key: string): Promise<T | null> {
  try {
    return await readJsonFromBlob<T>(key);
  } catch (error) {
    console.error('EdgeOne Blob 读取失败:', errorMessage(error));
    return null;
  }
}

async function writeJsonToBlob(key: string, value: unknown): Promise<void> {
  try {
    await getBlobStore().setJSON(key, value, {
      cacheControl: 'no-store',
    });
  } catch (error) {
    throw new Error(`EdgeOne Blob 写入失败：${errorMessage(error)}`);
  }
}

async function readStore(env: EdgeEnv): Promise<SettingsFile> {
  const envAdmin = await envAdminState(env);
  const parsed = await readOptionalJsonFromBlob<Partial<SettingsFile>>(
    STORE_KEY,
  );

  return {
    settings: {
      ...defaultSettings(env),
      ...parsed?.settings,
    },
    admin: envAdmin || {
      ...emptyAdmin(),
      ...parsed?.admin,
    },
    access: {
      ...emptyAccess(),
      ...parsed?.access,
      passcodes: parsed?.access?.passcodes || [],
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

async function listAccessPasscodes(env: EdgeEnv): Promise<
  { id: string; label: string; createdAt: string }[]
> {
  const store = await readStore(env);
  return (store.access?.passcodes || []).map((item) => ({
    id: item.id,
    label: item.label,
    createdAt: item.createdAt,
  }));
}

async function addAccessPasscode(
  env: EdgeEnv,
  { label, passcode }: { label: string; passcode: string },
): Promise<{ id: string; label: string; createdAt: string }> {
  validatePasscode(passcode);

  const store = await readStore(env);
  const access = store.access || emptyAccess();
  const salt = randomHex(16);
  const createdAt = new Date().toISOString();
  const item: AccessPasscode = {
    id: randomHex(8),
    label: label || `访问口令 ${access.passcodes.length + 1}`,
    passwordHash: await hashPasscode(passcode, salt),
    passwordSalt: salt,
    createdAt,
  };

  access.passcodes = [...access.passcodes, item];
  store.access = access;
  await writeStore(env, store);

  return {
    id: item.id,
    label: item.label,
    createdAt: item.createdAt,
  };
}

async function deleteAccessPasscode(env: EdgeEnv, id: string): Promise<void> {
  const store = await readStore(env);
  const access = store.access || emptyAccess();
  const nextPasscodes = access.passcodes.filter((item) => item.id !== id);
  if (nextPasscodes.length === access.passcodes.length) {
    throw new Error('访问口令不存在');
  }

  access.passcodes = nextPasscodes;
  access.sessionSecret = randomHex(32);
  store.access = access;
  await writeStore(env, store);
}

async function hasAccessPasscodes(env: EdgeEnv): Promise<boolean> {
  const store = await readStore(env);
  return Boolean(store.access?.passcodes.length);
}

async function verifyAccessPasscode(
  env: EdgeEnv,
  passcode: string,
): Promise<boolean> {
  const store = await readStore(env);
  const passcodes = store.access?.passcodes || [];

  for (const item of passcodes) {
    const hash = await hashPasscode(passcode, item.passwordSalt);
    if (safeEqual(hash, item.passwordHash)) return true;
  }

  return false;
}

async function createAdminSessionCookie(env: EdgeEnv): Promise<string> {
  const store = await readStore(env);
  return createSessionCookie(ADMIN_SESSION_COOKIE, store.admin.sessionSecret);
}

async function createAccessSessionCookie(env: EdgeEnv): Promise<string> {
  const store = await readStore(env);
  return createSessionCookie(
    ACCESS_SESSION_COOKIE,
    store.access?.sessionSecret || emptyAccess().sessionSecret,
  );
}

async function createSessionCookie(
  name: string,
  secret: string,
): Promise<string> {
  const now = Date.now();
  const token = await encodeSession(
    {
      iat: now,
      exp: now + SESSION_TTL_MS,
    },
    secret,
  );

  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${
    SESSION_TTL_MS / 1000
  }`;
}

function clearSessionCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

async function isAdminRequest(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<boolean> {
  const store = await readStore(env);
  if (!store.admin.passwordHash) return false;
  return isSessionCookieValid(
    cookieHeader,
    ADMIN_SESSION_COOKIE,
    store.admin.sessionSecret,
  );
}

async function isAccessRequest(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<boolean> {
  const store = await readStore(env);
  const secret = store.access?.sessionSecret;
  if (!secret || !store.access?.passcodes.length) {
    return false;
  }
  return isSessionCookieValid(cookieHeader, ACCESS_SESSION_COOKIE, secret);
}

async function isSessionCookieValid(
  cookieHeader: string | undefined,
  cookieName: string,
  secret: string,
): Promise<boolean> {
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

  const token = cookies[cookieName];
  return Boolean(token && (await decodeSession(token, secret)));
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
  const cache = await readOptionalJsonFromBlob<FontCacheEntry>(CACHE_KEY);
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

async function requireAccess(c: Context<{ Bindings: EdgeEnv }>): Promise<Response | null> {
  const cookieHeader = c.req.header('cookie');
  if (
    (await isAdminRequest(c.env, cookieHeader)) ||
    (await isAccessRequest(c.env, cookieHeader))
  ) {
    return null;
  }
  return c.json({ code: 401, msg: '需要访问口令' }, 401);
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
      hasAccessPasscodes: await hasAccessPasscodes(c.env),
      isReady: status.hasDocUrl && status.hasTencentCredentials,
    },
  });
});

app.get('/api/access/status', async (c) => {
  const cookieHeader = c.req.header('cookie');
  return c.json({
    code: 0,
    data: {
      hasAccessPasscodes: await hasAccessPasscodes(c.env),
      isAuthenticated:
        (await isAdminRequest(c.env, cookieHeader)) ||
        (await isAccessRequest(c.env, cookieHeader)),
    },
  });
});

app.post('/api/access/login', async (c) => {
  const body = await readJson<AdminPasscodeRequest>(c.req.raw);
  const passcode = stringValue(body.passcode);

  if (!(await verifyAccessPasscode(c.env, passcode))) {
    return c.json({ code: 1, msg: '访问口令不正确' }, 401);
  }

  c.header('Set-Cookie', await createAccessSessionCookie(c.env));
  return c.json({ code: 0, msg: '登录成功' });
});

app.post('/api/access/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie(ACCESS_SESSION_COOKIE));
  return c.json({ code: 0, msg: '已退出' });
});

app.get('/api/admin/status', async (c) => {
  return c.json({
    code: 0,
    data: {
      hasAdminPasscode: await hasAdminPasscode(c.env),
      hasAccessPasscodes: await hasAccessPasscodes(c.env),
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
  c.header('Set-Cookie', clearSessionCookie(ADMIN_SESSION_COOKIE));
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
    c.header('Set-Cookie', clearSessionCookie(ADMIN_SESSION_COOKIE));
    return c.json({ code: 0, msg: '口令已更新，请重新登录' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

app.get('/api/admin/access-passcodes', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  return c.json({
    code: 0,
    data: {
      passcodes: await listAccessPasscodes(c.env),
    },
  });
});

app.post('/api/admin/access-passcodes', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AccessPasscodeRequest>(c.req.raw);
    const passcode = stringValue(body.passcode) || randomReadablePasscode();
    const item = await addAccessPasscode(c.env, {
      label: stringValue(body.label),
      passcode,
    });
    return c.json({
      code: 0,
      msg: '访问口令已添加',
      data: {
        passcode,
        item,
      },
    });
  } catch (error) {
    return c.json({ code: 1, msg: errorMessage(error) }, 400);
  }
});

app.delete('/api/admin/access-passcodes/:id', async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;

  try {
    await deleteAccessPasscode(c.env, c.req.param('id'));
    c.header('Set-Cookie', clearSessionCookie(ACCESS_SESSION_COOKIE));
    return c.json({ code: 0, msg: '访问口令已删除' });
  } catch (error) {
    return c.json({ code: 1, msg: errorMessage(error) }, 400);
  }
});

app.post('/api/fonts/sync', async (c) => {
  const denied = await requireAccess(c);
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
  const denied = await requireAccess(c);
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
  const denied = await requireAccess(c);
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
  const denied = await requireAccess(c);
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
  return Promise.resolve(app.fetch(context.request, context.env)).catch(
    (error: unknown) => {
      console.error('EdgeOne 函数未捕获错误:', errorMessage(error));
      return jsonResponse(
        {
          code: 1,
          msg: 'EdgeOne 函数执行失败',
          error: errorMessage(error),
        },
        500,
      );
    },
  );
}
