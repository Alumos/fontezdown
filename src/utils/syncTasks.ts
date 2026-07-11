import config from "../config/config.js";
import {
  type ArticleCacheEntry,
  syncWechatRssArticles,
} from "./articleCache.js";
import { type FontCacheEntry, writeFontCache } from "./fontCache.js";
import { type ManagedSettings, getManagedSettings } from "./settingsStore.js";
import { syncTencentDocFonts } from "./tencentDocs.js";

export interface SyncPhaseResult {
  success: boolean;
  error?: string;
}

export interface SequentialSyncResult {
  startedAt: string;
  finishedAt: string;
  fonts: SyncPhaseResult;
  articles: SyncPhaseResult;
}

export interface SequentialSyncTasks {
  syncFonts: () => Promise<unknown>;
  syncArticles: () => Promise<unknown>;
}

let fontSyncInFlight: Promise<FontCacheEntry> | null = null;
let articleSyncInFlight: Promise<ArticleCacheEntry> | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function syncConfiguredFonts(
  settings: ManagedSettings = getManagedSettings(),
): Promise<FontCacheEntry> {
  if (fontSyncInFlight) return fontSyncInFlight;

  const operation = (async () => {
    const result = await syncTencentDocFonts({
      docUrl: settings.docUrl || config.tencentDocs.docUrl,
      credentials: {
        clientId: settings.clientId,
        accessToken: settings.accessToken,
        openId: settings.openId,
      },
    });
    return writeFontCache(result);
  })();
  fontSyncInFlight = operation;
  const clearFontSync = () => {
    if (fontSyncInFlight === operation) fontSyncInFlight = null;
  };
  void operation.then(clearFontSync, clearFontSync);
  return operation;
}

export function syncConfiguredArticles(
  settings: ManagedSettings = getManagedSettings(),
): Promise<ArticleCacheEntry> {
  if (articleSyncInFlight) return articleSyncInFlight;

  const operation = syncWechatRssArticles(settings.wechatRssUrls);
  articleSyncInFlight = operation;
  const clearArticleSync = () => {
    if (articleSyncInFlight === operation) articleSyncInFlight = null;
  };
  void operation.then(clearArticleSync, clearArticleSync);
  return operation;
}

export async function runSequentialSync(
  tasks: SequentialSyncTasks,
): Promise<SequentialSyncResult> {
  const startedAt = new Date().toISOString();
  let fonts: SyncPhaseResult;
  let articles: SyncPhaseResult;

  try {
    await tasks.syncFonts();
    fonts = { success: true };
  } catch (error) {
    fonts = { success: false, error: errorMessage(error) };
  }

  try {
    await tasks.syncArticles();
    articles = { success: true };
  } catch (error) {
    articles = { success: false, error: errorMessage(error) };
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    fonts,
    articles,
  };
}

export function runConfiguredSyncSequence(
  settings: ManagedSettings = getManagedSettings(),
): Promise<SequentialSyncResult> {
  return runSequentialSync({
    syncFonts: () => syncConfiguredFonts(settings),
    syncArticles: async () => {
      const cache = await syncConfiguredArticles(settings);
      const failedSourceCount = (cache.sourceResults || []).filter(
        (result) => !result.success,
      ).length;
      if (failedSourceCount > 0) {
        throw new Error(`${failedSourceCount} 个 RSS 源同步失败`);
      }
    },
  });
}
