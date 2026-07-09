import { renderAdminPage } from '../src/ui/adminPage.js';
import { renderIndexPage } from '../src/ui/indexPage.js';
import type {
  FontLinkItem,
  TencentCredentials,
  TencentDocSyncResult,
} from '../src/utils/tencentDocs.js';
import type { ParseSuccessData } from '../src/utils/types.js';

interface EdgeEnv {
  ADMIN_PASSCODE?: string;
  ACCESS_PASSCODE?: string;
  ACCESS_PASSCODES?: string;
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

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function envValue(env: EdgeEnv | undefined, ...keys: (keyof EdgeEnv)[]): string {
  const source = env || {};
  for (const key of keys) {
    const value = source[key];
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

async function getBlobStore() {
  const { getStore } = await import('@edgeone/pages-blob');
  return getStore(BLOB_STORE_NAME);
}

async function parseLanzouUrlDynamic(
  options: Parameters<
    typeof import('../src/utils/lanzou/lanzouParser.js').parseLanzouUrl
  >[0],
) {
  const { parseLanzouUrl } = await import(
    '../src/utils/lanzou/lanzouParser.js'
  );
  return parseLanzouUrl(options);
}

async function syncTencentDocFontsDynamic(
  options: Parameters<
    typeof import('../src/utils/tencentDocs.js').syncTencentDocFonts
  >[0],
) {
  const { syncTencentDocFonts } = await import('../src/utils/tencentDocs.js');
  return syncTencentDocFonts(options);
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
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(data);
  } else {
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.floor(Math.random() * 256);
    }
  }
  return [...data].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomReadablePasscode(): string {
  return randomHex(4).toUpperCase();
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
  0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
  0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
  0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
  0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
  0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) || 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function itemAt(items: number[], index: number): number {
  return items[index] ?? 0;
}

function sha256Hex(value: string): string {
  const bytes = utf8Bytes(value);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);

  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) {
    bytes.push((high >>> shift) & 0xff);
  }
  for (let shift = 24; shift >= 0; shift -= 8) {
    bytes.push((low >>> shift) & 0xff);
  }

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
    0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const words = new Array<number>(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const wordOffset = offset + index * 4;
      words[index] =
        ((itemAt(bytes, wordOffset) << 24) |
          (itemAt(bytes, wordOffset + 1) << 16) |
          (itemAt(bytes, wordOffset + 2) << 8) |
          itemAt(bytes, wordOffset + 3)) >>>
        0;
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rotateRight(itemAt(words, index - 15), 7) ^
        rotateRight(itemAt(words, index - 15), 18) ^
        (itemAt(words, index - 15) >>> 3);
      const s1 =
        rotateRight(itemAt(words, index - 2), 17) ^
        rotateRight(itemAt(words, index - 2), 19) ^
        (itemAt(words, index - 2) >>> 10);
      words[index] =
        (itemAt(words, index - 16) + s0 + itemAt(words, index - 7) + s1) >>>
        0;
    }

    let a = itemAt(hash, 0);
    let b = itemAt(hash, 1);
    let c = itemAt(hash, 2);
    let d = itemAt(hash, 3);
    let e = itemAt(hash, 4);
    let f = itemAt(hash, 5);
    let g = itemAt(hash, 6);
    let h = itemAt(hash, 7);
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 =
        (h + s1 + ch + itemAt(SHA256_K, index) + itemAt(words, index)) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (itemAt(hash, 0) + a) >>> 0;
    hash[1] = (itemAt(hash, 1) + b) >>> 0;
    hash[2] = (itemAt(hash, 2) + c) >>> 0;
    hash[3] = (itemAt(hash, 3) + d) >>> 0;
    hash[4] = (itemAt(hash, 4) + e) >>> 0;
    hash[5] = (itemAt(hash, 5) + f) >>> 0;
    hash[6] = (itemAt(hash, 6) + g) >>> 0;
    hash[7] = (itemAt(hash, 7) + h) >>> 0;
  }

  return hash.map((item) => item.toString(16).padStart(8, '0')).join('');
}

async function digestHex(
  _algorithm: AlgorithmIdentifier,
  value: string,
): Promise<string> {
  return sha256Hex(value);
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  return digestHex('SHA-256', `fontsez-passcode:${salt}:${passcode}`);
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function envAdminState(env: EdgeEnv): Promise<AdminState | null> {
  const passcode = envValue(env, 'ADMIN_PASSCODE');
  if (!passcode) return null;

  const secret = await digestHex('SHA-256', `fontsez:${passcode}:admin-session`);
  return {
    passwordHash: passcode,
    passwordSalt: 'env',
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
  const store = await getBlobStore();
  return (await store.get(key, {
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
    const store = await getBlobStore();
    await store.setJSON(key, value, {
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

async function getAdminState(env: EdgeEnv): Promise<AdminState> {
  const envAdmin = await envAdminState(env);
  if (envAdmin) return envAdmin;
  return (await readStore(env)).admin;
}

async function getManagedSettings(env: EdgeEnv): Promise<ManagedSettings> {
  const settings = defaultSettings(env);
  if (settings.docUrl && settings.clientId && settings.accessToken && settings.openId) {
    return settings;
  }
  return (await readStore(env)).settings;
}

async function hasAdminPasscode(env: EdgeEnv): Promise<boolean> {
  return Boolean((await getAdminState(env)).passwordHash);
}

async function setupAdminPasscode(env: EdgeEnv, passcode: string): Promise<void> {
  if (await envAdminState(env)) {
    throw new Error('后台口令由 EdgeOne 环境变量 ADMIN_PASSCODE 管理');
  }

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
  const admin = await getAdminState(env);
  if (!admin.passwordHash || !admin.passwordSalt) return false;
  if (admin.envManaged) return safeEqual(passcode, admin.passwordHash);
  const hash = await hashPasscode(passcode, admin.passwordSalt);
  return safeEqual(hash, admin.passwordHash);
}

async function changeAdminPasscode(
  env: EdgeEnv,
  currentPasscode: string,
  nextPasscode: string,
): Promise<void> {
  if (await envAdminState(env)) {
    throw new Error('当前口令由 EdgeOne 环境变量 ADMIN_PASSCODE 管理');
  }

  const store = await readStore(env);
  if (!(await verifyAdminPasscode(env, currentPasscode))) {
    throw new Error('当前口令不正确');
  }

  const salt = randomHex(16);
  store.admin.passwordSalt = salt;
  store.admin.passwordHash = await hashPasscode(nextPasscode, salt);
  store.admin.sessionSecret = randomHex(32);
  await writeStore(env, store);
}

function envAccessPasscodes(env: EdgeEnv): string[] {
  return envValue(env, 'ACCESS_PASSCODES', 'ACCESS_PASSCODE')
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function envAccessSessionSecret(env: EdgeEnv): Promise<string> {
  return digestHex(
    'SHA-256',
    `fontsez:${envAccessPasscodes(env).join('\n')}:access-session`,
  );
}

async function listAccessPasscodes(env: EdgeEnv): Promise<
  { id: string; label: string; createdAt: string; readonly?: boolean }[]
> {
  const envItems = envAccessPasscodes(env).map((_, index) => ({
    id: `env-${index}`,
    label: `环境变量访问口令 ${index + 1}`,
    createdAt: '',
    readonly: true,
  }));
  const store = await readStore(env);
  return [
    ...envItems,
    ...(store.access?.passcodes || []).map((item) => ({
      id: item.id,
      label: item.label,
      createdAt: item.createdAt,
    })),
  ];
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
  if (envAccessPasscodes(env).length) return true;
  const store = await readStore(env);
  return Boolean(store.access?.passcodes.length);
}

async function verifyAccessPasscode(
  env: EdgeEnv,
  passcode: string,
): Promise<boolean> {
  if (envAccessPasscodes(env).includes(passcode)) return true;

  const store = await readStore(env);
  const passcodes = store.access?.passcodes || [];

  for (const item of passcodes) {
    const hash = await hashPasscode(passcode, item.passwordSalt);
    if (safeEqual(hash, item.passwordHash)) return true;
  }

  return false;
}

async function createAdminSessionCookie(env: EdgeEnv): Promise<string> {
  const admin = await getAdminState(env);
  return createSessionCookie(ADMIN_SESSION_COOKIE, admin.sessionSecret);
}

async function createAccessSessionCookie(
  env: EdgeEnv,
  passcode: string,
): Promise<string> {
  if (envAccessPasscodes(env).includes(passcode)) {
    return createSessionCookie(
      ACCESS_SESSION_COOKIE,
      await envAccessSessionSecret(env),
    );
  }

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
  const expiresAt = now + SESSION_TTL_MS;
  const signature = await digestHex('SHA-256', `${secret}:${expiresAt}`);
  const token = `${expiresAt.toString(36)}.${signature}`;

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
  if (!cookieHeader?.includes(`${ADMIN_SESSION_COOKIE}=`)) return false;

  const admin = await getAdminState(env);
  if (!admin.passwordHash) return false;
  return isSessionCookieValid(
    cookieHeader,
    ADMIN_SESSION_COOKIE,
    admin.sessionSecret,
  );
}

async function isAccessRequest(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<boolean> {
  if (!cookieHeader?.includes(`${ACCESS_SESSION_COOKIE}=`)) return false;

  if (envAccessPasscodes(env).length) {
    return isSessionCookieValid(
      cookieHeader,
      ACCESS_SESSION_COOKIE,
      await envAccessSessionSecret(env),
    );
  }

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
  if (!token) return false;

  const [expiresAtText, signature] = token.split('.');
  const expiresAt = Number.parseInt(expiresAtText || '', 36);
  if (!expiresAt || expiresAt < Date.now() || !signature) return false;

  return safeEqual(
    await digestHex('SHA-256', `${secret}:${expiresAt}`),
    signature,
  );
}

async function publicConfigStatus(env: EdgeEnv): Promise<{
  hasAdminPasscode: boolean;
  hasDocUrl: boolean;
  hasTencentCredentials: boolean;
  hasLanzouPassword: boolean;
}> {
  const settings = defaultSettings(env);
  const hasEnvSettings = Boolean(
    settings.docUrl && settings.clientId && settings.accessToken && settings.openId,
  );
  if (hasEnvSettings) {
    return {
      hasAdminPasscode: await hasAdminPasscode(env),
      hasDocUrl: true,
      hasTencentCredentials: true,
      hasLanzouPassword: Boolean(settings.lanzouPwd),
    };
  }

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

async function requireAdmin(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<Response | null> {
  if (await isAdminRequest(env, cookieHeader)) return null;
  return jsonResponse({ code: 401, msg: '需要登录后访问' }, 401);
}

async function requireAccess(
  env: EdgeEnv,
  cookieHeader: string | undefined,
): Promise<Response | null> {
  if (
    (await isAdminRequest(env, cookieHeader)) ||
    (await isAccessRequest(env, cookieHeader))
  ) {
    return null;
  }
  return jsonResponse({ code: 401, msg: '需要访问口令' }, 401);
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

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

function responseWithCookie(response: Response, cookie: string): Response {
  response.headers.set('Set-Cookie', cookie);
  return response;
}

async function handleRequest(request: Request, env: EdgeEnv): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();
  const cookieHeader = request.headers.get('cookie') || undefined;

  if (method === 'GET' && pathname === '/') return htmlResponse(renderIndexPage());
  if (method === 'GET' && pathname === '/admin') return htmlResponse(renderAdminPage());

  if (method === 'GET' && pathname === '/api/config') {
    const status = await publicConfigStatus(env);
    const hasEnvAccessPasscodes = Boolean(envAccessPasscodes(env).length);
    return jsonResponse({
      code: 0,
      data: {
        ...status,
        hasAccessPasscodes:
          hasEnvAccessPasscodes || (await hasAccessPasscodes(env)),
        isReady: status.hasDocUrl && status.hasTencentCredentials,
      },
    });
  }

  if (method === 'GET' && pathname === '/api/access/status') {
    const hasEnvAccessPasscodes = Boolean(envAccessPasscodes(env).length);
    return jsonResponse({
      code: 0,
      data: {
        hasAccessPasscodes:
          hasEnvAccessPasscodes || (await hasAccessPasscodes(env)),
        isAuthenticated:
          (await isAdminRequest(env, cookieHeader)) ||
          (await isAccessRequest(env, cookieHeader)),
      },
    });
  }

  if (method === 'POST' && pathname === '/api/access/login') {
    const body = await readJson<AdminPasscodeRequest>(request);
    const passcode = stringValue(body.passcode);

    if (!(await verifyAccessPasscode(env, passcode))) {
      return jsonResponse({ code: 1, msg: '访问口令不正确' }, 401);
    }

    return responseWithCookie(
      jsonResponse({ code: 0, msg: '登录成功' }),
      await createAccessSessionCookie(env, passcode),
    );
  }

  if (method === 'POST' && pathname === '/api/access/logout') {
    return responseWithCookie(
      jsonResponse({ code: 0, msg: '已退出' }),
      clearSessionCookie(ACCESS_SESSION_COOKIE),
    );
  }

  if (method === 'GET' && pathname === '/api/admin/status') {
    return jsonResponse({
      code: 0,
      data: {
        hasAdminPasscode: await hasAdminPasscode(env),
        isAuthenticated: await isAdminRequest(env, cookieHeader),
      },
    });
  }

  if (method === 'POST' && pathname === '/api/admin/setup') {
    try {
      const body = await readJson<AdminPasscodeRequest>(request);
      const passcode = stringValue(body.passcode);
      validatePasscode(passcode);
      await setupAdminPasscode(env, passcode);
      return responseWithCookie(
        jsonResponse({ code: 0, msg: '后台口令已设置' }),
        await createAdminSessionCookie(env),
      );
    } catch (error) {
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 400);
    }
  }

  if (method === 'POST' && pathname === '/api/admin/login') {
    const body = await readJson<AdminPasscodeRequest>(request);
    const passcode = stringValue(body.passcode);

    if (!(await verifyAdminPasscode(env, passcode))) {
      return jsonResponse({ code: 1, msg: '口令不正确' }, 401);
    }

    return responseWithCookie(
      jsonResponse({ code: 0, msg: '登录成功' }),
      await createAdminSessionCookie(env),
    );
  }

  if (method === 'POST' && pathname === '/api/admin/logout') {
    return responseWithCookie(
      jsonResponse({ code: 0, msg: '已退出' }),
      clearSessionCookie(ADMIN_SESSION_COOKIE),
    );
  }

  if (method === 'GET' && pathname === '/api/admin/settings') {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    return jsonResponse({
      code: 0,
      data: await getManagedSettings(env),
    });
  }

  if (method === 'POST' && pathname === '/api/admin/settings') {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    try {
      const body = await readJson<AdminSettingsRequest>(request);
      const settings = settingsFromBody(body);
      const store = await readStore(env);
      store.settings = settings;
      await writeStore(env, store);
      return jsonResponse({
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
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 400);
    }
  }

  if (method === 'POST' && pathname === '/api/admin/passcode') {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    try {
      const body = await readJson<AdminPasscodeRequest>(request);
      const currentPasscode = stringValue(body.currentPasscode);
      const nextPasscode = stringValue(body.nextPasscode);
      validatePasscode(nextPasscode);
      await changeAdminPasscode(env, currentPasscode, nextPasscode);
      return responseWithCookie(
        jsonResponse({ code: 0, msg: '口令已更新，请重新登录' }),
        clearSessionCookie(ADMIN_SESSION_COOKIE),
      );
    } catch (error) {
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 400);
    }
  }

  if (method === 'GET' && pathname === '/api/admin/access-passcodes') {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    return jsonResponse({
      code: 0,
      data: {
        passcodes: await listAccessPasscodes(env),
      },
    });
  }

  if (method === 'POST' && pathname === '/api/admin/access-passcodes') {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    try {
      const body = await readJson<AccessPasscodeRequest>(request);
      const passcode = stringValue(body.passcode) || randomReadablePasscode();
      const item = await addAccessPasscode(env, {
        label: stringValue(body.label),
        passcode,
      });
      return jsonResponse({
        code: 0,
        msg: '访问口令已添加',
        data: {
          passcode,
          item,
        },
      });
    } catch (error) {
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 400);
    }
  }

  const accessPasscodeMatch = pathname.match(
    /^\/api\/admin\/access-passcodes\/([^/]+)$/,
  );
  if (method === 'DELETE' && accessPasscodeMatch) {
    const denied = await requireAdmin(env, cookieHeader);
    if (denied) return denied;

    try {
      await deleteAccessPasscode(env, decodeURIComponent(accessPasscodeMatch[1] || ''));
      return responseWithCookie(
        jsonResponse({ code: 0, msg: '访问口令已删除' }),
        clearSessionCookie(ACCESS_SESSION_COOKIE),
      );
    } catch (error) {
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 400);
    }
  }

  if (method === 'POST' && pathname === '/api/fonts/sync') {
    const denied = await requireAccess(env, cookieHeader);
    if (denied) return denied;

    const settings = await getManagedSettings(env);
    const docUrl = settings.docUrl;

    try {
      const data = await syncTencentDocFontsDynamic({
        docUrl,
        credentials: settingsCredentials(settings),
      });
      const cache = await writeFontCache(env, data);

      return jsonResponse({
        code: 0,
        msg: '同步成功',
        data: {
          ...cache,
          fromCache: false,
        },
      });
    } catch (error) {
      const message = errorMessage(error);
      const cache = await readFontCache(env, docUrl);
      if (cache) {
        return jsonResponse({
          code: 0,
          msg: `同步失败，已使用上次缓存：${message}`,
          data: {
            ...cache,
            fromCache: true,
            syncError: message,
          },
        });
      }

      return jsonResponse({ code: 1, msg: `同步失败：${message}` }, 400);
    }
  }

  if (method === 'GET' && pathname === '/api/fonts/cache') {
    const denied = await requireAccess(env, cookieHeader);
    if (denied) return denied;

    const settings = await getManagedSettings(env);
    const docUrl = settings.docUrl;
    const cache = await readFontCache(env, docUrl);

    return jsonResponse({
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
  }

  if (method === 'POST' && pathname === '/api/lanzou/parse') {
    const denied = await requireAccess(env, cookieHeader);
    if (denied) return denied;

    const body = await readJson<LanzouParseRequest>(request);
    const urlValue = stringValue(body.url);
    const pwd = stringValue(body.pwd) || (await getManagedSettings(env)).lanzouPwd;

    if (!urlValue) {
      return jsonResponse({ code: 1, msg: '缺少蓝奏云链接' }, 400);
    }

    try {
      const result = await parseLanzouUrlDynamic({
        url: urlValue,
        pwd,
        type: 'json',
      });

      if (result.code !== 0) return jsonResponse(result, 400);

      if ('files' in result.data) {
        return jsonResponse({
          code: 0,
          msg: result.msg,
          data: {
            files: result.data.files,
          },
        });
      }

      const parsedData = result.data as ParseSuccessData;
      return jsonResponse({
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
      return jsonResponse({ code: 1, msg: errorMessage(error) }, 500);
    }
  }

  if (pathname === '/lanzou') {
    const denied = await requireAccess(env, cookieHeader);
    if (denied) return denied;

    try {
      const urlValue = url.searchParams.get('url') || '';
      if (!urlValue) return jsonResponse({ code: 1, msg: '缺少 url 参数' });
      const pwd =
        url.searchParams.get('pwd') || (await getManagedSettings(env)).lanzouPwd;
      const type = url.searchParams.get('type') || 'json';

      const data = await parseLanzouUrlDynamic({
        url: urlValue,
        pwd,
        type,
      });

      if (data.code === 0 && data.data && 'redirect' in data.data) {
        return Response.redirect(data.data.redirect);
      }
      return jsonResponse(data);
    } catch (error) {
      return jsonResponse({
        code: 1,
        msg: '获取信息失败',
        data: errorMessage(error),
      });
    }
  }

  return jsonResponse({ success: false, message: '接口不存在' }, 404);
}

export async function onRequest(context: {
  request: Request;
  env?: EdgeEnv;
}): Promise<Response> {
  try {
    return await handleRequest(context.request, context.env || {});
  } catch (error: unknown) {
    console.error('EdgeOne 函数未捕获错误:', errorMessage(error));
    return jsonResponse(
      {
        code: 1,
        msg: 'EdgeOne 函数执行失败',
        error: errorMessage(error),
      },
      500,
    );
  }
}
