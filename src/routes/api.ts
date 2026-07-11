import config from "../config/config.js";
import {
  type ArticleCacheEntry,
  articleCacheSummary,
  readArticleCache,
  readArticleMatchesForItems,
} from "../utils/articleCache.js";
import {
  dailySyncStatus,
  rescheduleDailySync,
} from "../utils/dailySync.js";
import { readFontCache } from "../utils/fontCache.js";
import { parseLanzouUrl } from "../utils/lanzou/lanzouParser.js";
import {
  readParsedCacheForItems,
  writeParsedCacheRecord,
} from "../utils/parsedCache.js";
import {
  type ManagedSettings,
  addAccessPasscode,
  changeAdminPasscode,
  clearAccessSessionCookie,
  clearAdminSessionCookie,
  createAccessSessionCookie,
  createAdminSessionCookie,
  deleteAccessPasscode,
  getManagedSettings,
  hasAccessPasscodes,
  hasAdminPasscode,
  isAccessRequest,
  isAdminRequest,
  listAccessPasscodes,
  publicConfigStatus,
  saveManagedSettings,
  setupAdminPasscode,
  verifyAccessPasscode,
  verifyAdminPasscode,
} from "../utils/settingsStore.js";
import {
  syncConfiguredArticles,
  syncConfiguredFonts,
} from "../utils/syncTasks.js";
import { type FontLinkItem } from "../utils/tencentDocs.js";
import type { ParseSuccessData } from "../utils/types.js";
import { type Context, Hono } from "hono";

const router = new Hono();

interface LanzouParseRequest {
  itemId?: unknown;
  fontName?: unknown;
  url?: unknown;
  pwd?: unknown;
}

interface AdminPasscodeRequest {
  passcode?: unknown;
  currentPasscode?: unknown;
  nextPasscode?: unknown;
}

interface AccessPasscodeRequest {
  label?: unknown;
  passcode?: unknown;
}

interface AdminSettingsRequest {
  docUrl?: unknown;
  clientId?: unknown;
  accessToken?: unknown;
  openId?: unknown;
  lanzouPwd?: unknown;
  wechatRssUrls?: unknown;
  wechatRssUrl?: unknown;
  dailySyncEnabled?: unknown;
  dailySyncTime?: unknown;
}

interface AdminConfigImportRequest {
  config?: unknown;
  overwrite?: unknown;
}

const CONFIG_EXPORT_VERSION = 2;
const ADMIN_CONFIG_KEYS = [
  "docUrl",
  "clientId",
  "accessToken",
  "openId",
  "lanzouPwd",
  "wechatRssUrls",
  "wechatRssUrl",
  "dailySyncEnabled",
  "dailySyncTime",
] as const;

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function randomReadablePasscode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

function requireAdmin(c: Context): Response | null {
  if (isAdminRequest(c.req.header("cookie"))) return null;
  return c.json({ code: 401, msg: "需要登录后访问" }, 401);
}

function requireAccess(c: Context): Response | null {
  const cookieHeader = c.req.header("cookie");
  if (isAdminRequest(cookieHeader) || isAccessRequest(cookieHeader))
    return null;
  return c.json({ code: 401, msg: "需要访问口令" }, 401);
}

function validatePasscode(passcode: string): void {
  if (passcode.length < 4) throw new Error("口令至少需要 4 位");
}

function rssUrlsValue(body: AdminSettingsRequest): string[] {
  const rawValues = Array.isArray(body.wechatRssUrls)
    ? body.wechatRssUrls
    : typeof body.wechatRssUrls === "string"
      ? body.wechatRssUrls.split(/[\r\n,]+/)
      : [body.wechatRssUrl];
  const urls = Array.from(
    new Set(rawValues.map((value) => stringValue(value)).filter(Boolean)),
  );

  for (const value of urls) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`公众号 RSS 地址格式不正确：${value}`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("公众号 RSS 地址必须是 http 或 https");
    }
  }
  return urls;
}

function dailySyncTimeValue(value: unknown): string {
  const time = stringValue(value) || "03:00";
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("每日同步时间格式应为 HH:mm");
  }
  return time;
}

function settingsFromBody(body: AdminSettingsRequest): ManagedSettings {
  return {
    docUrl: stringValue(body.docUrl),
    clientId: stringValue(body.clientId),
    accessToken: stringValue(body.accessToken),
    openId: stringValue(body.openId),
    lanzouPwd: stringValue(body.lanzouPwd),
    wechatRssUrls: rssUrlsValue(body),
    dailySyncEnabled:
      typeof body.dailySyncEnabled === "boolean"
        ? body.dailySyncEnabled
        : true,
    dailySyncTime: dailySyncTimeValue(body.dailySyncTime),
  };
}

interface FontItemsPayload {
  items: FontLinkItem[];
}

function publicArticleCacheSummary(
  cache: ReturnType<typeof readArticleCache>,
): {
  fetchedAt: string;
  articleCount: number;
  imageCount: number;
  sourceCount: number;
} | null {
  const summary = articleCacheSummary(cache);
  if (!summary) return null;
  return {
    fetchedAt: summary.fetchedAt,
    articleCount: summary.articleCount,
    imageCount: summary.imageCount,
    sourceCount: summary.sourceCount,
  };
}

function articleSyncPayload(cache: ArticleCacheEntry): {
  cache: ReturnType<typeof articleCacheSummary>;
  syncedSourceCount: number;
  failedSourceCount: number;
} {
  const results = cache.sourceResults || [];
  return {
    cache: articleCacheSummary(cache),
    syncedSourceCount: results.filter((result) => result.success).length,
    failedSourceCount: results.filter((result) => !result.success).length,
  };
}

function fontPayload<T extends FontItemsPayload>(cache: T): T & {
  parsedCache: ReturnType<typeof readParsedCacheForItems>;
  articleMatches: ReturnType<typeof readArticleMatchesForItems>;
  articleCache: ReturnType<typeof publicArticleCacheSummary>;
} {
  const articleCache = readArticleCache();

  return {
    ...cache,
    parsedCache: readParsedCacheForItems(cache.items),
    articleMatches: articleCache
      ? readArticleMatchesForItems(cache.items)
      : {},
    articleCache: publicArticleCacheSummary(articleCache),
  };
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function settingsFromImport(value: unknown): ManagedSettings {
  const root = objectValue(value);
  if (!root) throw new Error("配置文件格式不正确");

  const settings = objectValue(root.settings) ?? root;
  if (!ADMIN_CONFIG_KEYS.some((key) => key in settings)) {
    throw new Error("配置文件缺少可导入的下载配置");
  }

  return settingsFromBody(settings);
}

function exportedConfig(settings: ManagedSettings): Record<string, unknown> {
  return {
    app: "fontezdown",
    type: "managed-settings",
    version: CONFIG_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
  };
}

function configExportFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `fontezdown-settings-${stamp}.json`;
}

router.get("/config", (c) => {
  const status = publicConfigStatus();
  return c.json({
    code: 0,
    data: {
      ...status,
      isReady: status.hasDocUrl && status.hasTencentCredentials,
    },
  });
});

router.get("/access/status", (c) => {
  const cookieHeader = c.req.header("cookie");
  return c.json({
    code: 0,
    data: {
      hasAccessPasscodes: hasAccessPasscodes(),
      isAuthenticated:
        isAdminRequest(cookieHeader) || isAccessRequest(cookieHeader),
    },
  });
});

router.post("/access/login", async (c) => {
  const body = await readJson<AdminPasscodeRequest>(c.req.raw);
  const passcode = stringValue(body.passcode);

  if (!verifyAccessPasscode(passcode)) {
    return c.json({ code: 1, msg: "访问口令不正确" }, 401);
  }

  c.header("Set-Cookie", createAccessSessionCookie());
  return c.json({ code: 0, msg: "登录成功" });
});

router.post("/access/logout", (c) => {
  c.header("Set-Cookie", clearAccessSessionCookie());
  return c.json({ code: 0, msg: "已退出" });
});

router.get("/admin/status", (c) => {
  return c.json({
    code: 0,
    data: {
      hasAdminPasscode: hasAdminPasscode(),
      isAuthenticated: isAdminRequest(c.req.header("cookie")),
    },
  });
});

router.post("/admin/setup", async (c) => {
  try {
    const body = await readJson<AdminPasscodeRequest>(c.req.raw);
    const passcode = stringValue(body.passcode);
    validatePasscode(passcode);
    setupAdminPasscode(passcode);
    c.header("Set-Cookie", createAdminSessionCookie());
    return c.json({ code: 0, msg: "后台口令已设置" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.post("/admin/login", async (c) => {
  const body = await readJson<AdminPasscodeRequest>(c.req.raw);
  const passcode = stringValue(body.passcode);

  if (!verifyAdminPasscode(passcode)) {
    return c.json({ code: 1, msg: "口令不正确" }, 401);
  }

  c.header("Set-Cookie", createAdminSessionCookie());
  return c.json({ code: 0, msg: "登录成功" });
});

router.post("/admin/logout", (c) => {
  c.header("Set-Cookie", clearAdminSessionCookie());
  return c.json({ code: 0, msg: "已退出" });
});

router.get("/admin/settings", (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  return c.json({
    code: 0,
    data: getManagedSettings(),
  });
});

router.post("/admin/settings", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AdminSettingsRequest>(c.req.raw);
    const settings = saveManagedSettings(settingsFromBody(body));
    rescheduleDailySync();
    return c.json({
      code: 0,
      msg: "保存成功",
      data: {
        hasDocUrl: Boolean(settings.docUrl),
        hasTencentCredentials: Boolean(
          settings.clientId && settings.accessToken && settings.openId,
        ),
        hasLanzouPassword: Boolean(settings.lanzouPwd),
        hasWechatRss: settings.wechatRssUrls.length > 0,
        dailySync: dailySyncStatus(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.get("/admin/articles/cache", (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  return c.json({
    code: 0,
    data: {
      cache: articleCacheSummary(readArticleCache()),
    },
  });
});

router.post("/admin/articles/sync", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const cache = await syncConfiguredArticles();
    const payload = articleSyncPayload(cache);
    return c.json({
      code: 0,
      msg:
        payload.failedSourceCount > 0
          ? `公众号文章部分同步成功，${payload.failedSourceCount} 个源失败`
          : "公众号文章同步成功",
      data: {
        ...payload,
        sources: cache.sourceResults || [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.get("/admin/config/export", (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  c.header(
    "Content-Disposition",
    `attachment; filename="${configExportFileName()}"`,
  );
  return c.json({
    code: 0,
    data: exportedConfig(getManagedSettings()),
  });
});

router.post("/admin/config/import", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AdminConfigImportRequest>(c.req.raw);
    if (body.overwrite !== true) {
      throw new Error("导入前需要确认覆盖当前配置");
    }

    const settings = saveManagedSettings(settingsFromImport(body.config));
    rescheduleDailySync();
    return c.json({
      code: 0,
      msg: "导入成功",
      data: settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.post("/admin/passcode", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AdminPasscodeRequest>(c.req.raw);
    const currentPasscode = stringValue(body.currentPasscode);
    const nextPasscode = stringValue(body.nextPasscode);
    validatePasscode(nextPasscode);
    changeAdminPasscode(currentPasscode, nextPasscode);
    c.header("Set-Cookie", clearAdminSessionCookie());
    return c.json({ code: 0, msg: "口令已更新，请重新登录" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.get("/admin/access-passcodes", (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  return c.json({
    code: 0,
    data: {
      passcodes: listAccessPasscodes(),
    },
  });
});

router.post("/admin/access-passcodes", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const body = await readJson<AccessPasscodeRequest>(c.req.raw);
    const passcode = stringValue(body.passcode) || randomReadablePasscode();
    validatePasscode(passcode);
    const item = addAccessPasscode({
      label: stringValue(body.label),
      passcode,
    });
    return c.json({
      code: 0,
      msg: "访问口令已添加",
      data: {
        passcode,
        item,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.delete("/admin/access-passcodes/:id", (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    deleteAccessPasscode(c.req.param("id"));
    c.header("Set-Cookie", clearAccessSessionCookie());
    return c.json({ code: 0, msg: "访问口令已删除" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.post("/articles/sync", async (c) => {
  const denied = requireAccess(c);
  if (denied) return denied;

  try {
    const cache = await syncConfiguredArticles();
    const payload = articleSyncPayload(cache);
    return c.json({
      code: 0,
      msg:
        payload.failedSourceCount > 0
          ? `公众号文章部分同步成功，${payload.failedSourceCount} 个源失败`
          : "公众号文章同步成功",
      data: payload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ code: 1, msg: message }, 400);
  }
});

router.post("/fonts/sync", async (c) => {
  const denied = requireAccess(c);
  if (denied) return denied;

  const settings = getManagedSettings();
  const docUrl = settings.docUrl || config.tencentDocs.docUrl;

  try {
    const cache = await syncConfiguredFonts(settings);

    return c.json({
      code: 0,
      msg: "同步成功",
      data: {
        ...fontPayload(cache),
        fromCache: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cache = readFontCache(docUrl);
    if (cache) {
      return c.json({
        code: 0,
        msg: `同步失败，已使用上次缓存：${message}`,
        data: {
          ...fontPayload(cache),
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

router.get("/fonts/cache", (c) => {
  const denied = requireAccess(c);
  if (denied) return denied;

  const settings = getManagedSettings();
  const docUrl = settings.docUrl || config.tencentDocs.docUrl;
  const cache = readFontCache(docUrl);

  return c.json({
    code: 0,
    msg: cache ? "读取缓存成功" : "暂无缓存",
    data: cache
      ? {
          ...fontPayload(cache),
          fromCache: true,
        }
      : {
          docUrl,
          items: [],
          fromCache: false,
          articleMatches: {},
          articleCache: publicArticleCacheSummary(readArticleCache()),
        },
  });
});

router.post("/lanzou/parse", async (c) => {
  const denied = requireAccess(c);
  if (denied) return denied;

  const body = await readJson<LanzouParseRequest>(c.req.raw);
  const itemId = stringValue(body.itemId);
  const fontName = stringValue(body.fontName);
  const url = stringValue(body.url);
  const pwd = stringValue(body.pwd) || getManagedSettings().lanzouPwd;

  if (!url) {
    return c.json({ code: 1, msg: "缺少蓝奏云链接" }, 400);
  }

  try {
    const result = await parseLanzouUrl({
      url,
      pwd,
      type: "json",
    });

    if (result.code !== 0) {
      return c.json(result, 400);
    }

    const files =
      "files" in result.data
        ? result.data.files
        : [
            {
              name: (result.data as ParseSuccessData).name,
              size: (result.data as ParseSuccessData).filesize,
              date: "",
              downloadUrl: (result.data as ParseSuccessData).downUrl,
            },
          ];
    let parsedAt = "";
    let parsedCacheError = "";
    if (itemId && files.length > 0) {
      try {
        parsedAt = writeParsedCacheRecord({
          itemId,
          fontName,
          lanzouUrl: url,
          files,
        }).parsedAt;
      } catch (error) {
        parsedCacheError =
          error instanceof Error ? error.message : String(error);
      }
    }

    if ("files" in result.data) {
      return c.json({
        code: 0,
        msg: result.msg,
        data: {
          files,
          parsedAt,
          parsedCacheError,
          fromParsedCache: false,
        },
      });
    }

    return c.json({
      code: 0,
      msg: result.msg,
      data: {
        files,
        parsedAt,
        parsedCacheError,
        fromParsedCache: false,
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

export default router;
