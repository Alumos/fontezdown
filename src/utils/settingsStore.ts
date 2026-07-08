import config from '../config/config.js';
import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface ManagedSettings {
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
}

interface SettingsFile {
  settings: ManagedSettings;
  admin: AdminState;
}

interface SessionPayload {
  exp: number;
  iat: number;
}

const STORE_PATH = resolve(process.cwd(), 'data', 'settings.local');
const SESSION_COOKIE = 'fontsez_admin';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const PBKDF2_ITERATIONS = 100000;
const LEGACY_PBKDF2_ITERATIONS = 120000;

function defaultSettings(): ManagedSettings {
  return {
    docUrl: config.tencentDocs.docUrl,
    clientId: config.tencentDocs.clientId,
    accessToken: config.tencentDocs.accessToken,
    openId: config.tencentDocs.openId,
    lanzouPwd: '',
  };
}

function emptyAdmin(): AdminState {
  return {
    passwordHash: '',
    passwordSalt: '',
    sessionSecret: randomBytes(32).toString('hex'),
  };
}

function readStore(): SettingsFile {
  if (!existsSync(STORE_PATH)) {
    return {
      settings: defaultSettings(),
      admin: emptyAdmin(),
    };
  }

  const raw = readFileSync(STORE_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<SettingsFile>;

  return {
    settings: {
      ...defaultSettings(),
      ...parsed.settings,
    },
    admin: {
      ...emptyAdmin(),
      ...parsed.admin,
    },
  };
}

function writeStore(store: SettingsFile): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
}

function hashPasscode(
  passcode: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): string {
  return pbkdf2Sync(passcode, salt, iterations, 32, 'sha256').toString('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;

  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signPayload(body, secret)}`;
}

function decodeSession(token: string, secret: string): SessionPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  if (signPayload(body, secret) !== signature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8'),
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getManagedSettings(): ManagedSettings {
  return readStore().settings;
}

export function hasAdminPasscode(): boolean {
  return Boolean(readStore().admin.passwordHash);
}

export function saveManagedSettings(
  settings: ManagedSettings,
): ManagedSettings {
  const store = readStore();
  store.settings = settings;
  writeStore(store);
  return settings;
}

export function setupAdminPasscode(passcode: string): void {
  const store = readStore();
  if (store.admin.passwordHash) throw new Error('后台口令已经设置');

  const salt = randomBytes(16).toString('hex');
  store.admin = {
    passwordHash: hashPasscode(passcode, salt),
    passwordSalt: salt,
    sessionSecret: store.admin.sessionSecret || randomBytes(32).toString('hex'),
  };
  writeStore(store);
}

export function verifyAdminPasscode(passcode: string): boolean {
  const store = readStore();
  if (!store.admin.passwordHash || !store.admin.passwordSalt) return false;
  const hash = hashPasscode(passcode, store.admin.passwordSalt);
  if (safeEqualHex(hash, store.admin.passwordHash)) return true;

  const legacyHash = hashPasscode(
    passcode,
    store.admin.passwordSalt,
    LEGACY_PBKDF2_ITERATIONS,
  );
  return safeEqualHex(legacyHash, store.admin.passwordHash);
}

export function changeAdminPasscode(
  currentPasscode: string,
  nextPasscode: string,
): void {
  if (!verifyAdminPasscode(currentPasscode)) {
    throw new Error('当前口令不正确');
  }

  const store = readStore();
  const salt = randomBytes(16).toString('hex');
  store.admin.passwordSalt = salt;
  store.admin.passwordHash = hashPasscode(nextPasscode, salt);
  store.admin.sessionSecret = randomBytes(32).toString('hex');
  writeStore(store);
}

export function createAdminSessionCookie(): string {
  const store = readStore();
  const now = Date.now();
  const token = encodeSession(
    {
      iat: now,
      exp: now + SESSION_TTL_MS,
    },
    store.admin.sessionSecret,
  );

  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    SESSION_TTL_MS / 1000
  }`;
}

export function clearAdminSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAdminRequest(cookieHeader: string | undefined): boolean {
  const store = readStore();
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
  return Boolean(token && decodeSession(token, store.admin.sessionSecret));
}

export function publicConfigStatus(): {
  hasAdminPasscode: boolean;
  hasDocUrl: boolean;
  hasTencentCredentials: boolean;
  hasLanzouPassword: boolean;
} {
  const store = readStore();
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
