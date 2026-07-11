import type { FontLinkItem } from "./tencentDocs.js";
import { getCacheDb, runInCacheTransaction } from "./cacheDb.js";
import axios from "axios";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

export interface ArticleItem {
  id: string;
  title: string;
  topic: string;
  link: string;
  publishedAt: string;
  images: string[];
}

export interface ArticleCacheEntry {
  rssUrls: string[];
  fetchedAt: string;
  items: ArticleItem[];
  sourceResults?: ArticleSourceSyncResult[];
}

export interface ArticleSourceSyncResult {
  rssUrl: string;
  success: boolean;
  fetchedAt?: string;
  articleCount?: number;
  imageCount?: number;
  error?: string;
}

export interface ArticleMatchPayload {
  articleId: string;
  title: string;
  topic: string;
  link: string;
  publishedAt: string;
  images: string[];
  score: number;
}

const MIN_LONG_MATCH_SCORE = 0.74;
const MIN_SHORT_MATCH_SCORE = 0.9;
const GENERIC_WORD_RE =
  /(?:美轮美奂|漂亮字样|工整有余|棱角分明|全优字型|超好看宋|原创造字|part\s*\d+)/gi;
const DESCRIPTOR_RE =
  /(?:自用版|多字重|动态|国标|大陆版?|台湾版?|日版?|韩版?|香港版?|澳门版?|含\s*1260\s*大行距|大行距|开源版|精修版)/gi;
const WEIGHT_RE = /(?:100|95|90|85|80|75|70|65|60)\s*%?/g;
const FONT_WEIGHT_TEXT_RE = /(?:[三四五六七八九十]|\d+)\s*字重/g;
const VERSION_RE = /\b(?:v|version|pro)\s*\d*(?:\.\d+)*\b/gi;
const PUNCTUATION_RE = /[「」『』【】[\]()（）{}<>《》,，.。;；:：/\\|｜+＋·•_\-\s]/g;

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function rowString(
  row: Record<string, unknown> | undefined,
  key: string,
): string {
  return stringValue(row?.[key]);
}

function rowNumber(
  row: Record<string, unknown> | undefined,
  key: string,
): number {
  const value = row?.[key];
  return typeof value === "number" ? value : 0;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function assertRssUrl(rssUrl: string): void {
  if (!rssUrl) throw new Error("请先填写公众号 RSS 地址");

  let url: URL;
  try {
    url = new URL(rssUrl);
  } catch {
    throw new Error("公众号 RSS 地址格式不正确");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("公众号 RSS 地址必须是 http 或 https");
  }
}

function articleId(link: string, title: string): string {
  return createHash("sha256")
    .update(link || title)
    .digest("hex")
    .slice(0, 24);
}

function articleTopic(title: string): string {
  const parts = title
    .split(/[｜|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || title.trim();
}

function isoTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function htmlText(value: string): string {
  return cheerio.load(`<span>${value}</span>`)("span").text().trim();
}

function unwrapImageProxy(value: string): string {
  const cleanValue = htmlText(value);
  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue);
    const rawUrl = url.searchParams.get("url");
    if (url.pathname.endsWith("/api/image") && rawUrl) {
      return htmlText(rawUrl);
    }
  } catch {
    return cleanValue;
  }

  return cleanValue;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function imageUrlsFromDescription(descriptionHtml: string): string[] {
  const $ = cheerio.load(descriptionHtml);
  const images: string[] = [];

  $("img").each((_, element) => {
    const node = $(element);
    const imageUrl = unwrapImageProxy(
      node.attr("data-croporisrc") ||
        node.attr("data-src") ||
        node.attr("src") ||
        "",
    );
    if (isHttpUrl(imageUrl)) images.push(imageUrl);
  });

  return unique(images);
}

function parseRssItems(xml: string): ArticleItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: ArticleItem[] = [];

  $("item").each((index, element) => {
    const node = $(element);
    const title = node.children("title").first().text().trim();
    const link =
      node.children("link").first().text().trim() ||
      node.children("guid").first().text().trim();
    const description = node.children("description").first().text();
    const images = imageUrlsFromDescription(description);

    if (!title || !link || images.length === 0) return;

    items.push({
      id: articleId(link, title),
      title,
      topic: articleTopic(title),
      link,
      publishedAt: isoTime(node.children("pubDate").first().text().trim()),
      images,
    });
  });

  return items;
}

function mergeArticleSource(entry: {
  rssUrl: string;
  fetchedAt: string;
  items: ArticleItem[];
}): void {
  const db = getCacheDb();

  runInCacheTransaction(() => {
    db.prepare(
      `INSERT INTO article_source_meta
        (rss_url, fetched_at, article_count, image_count)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(rss_url) DO UPDATE SET
         fetched_at = excluded.fetched_at,
         article_count = excluded.article_count,
         image_count = excluded.image_count`,
    ).run(
      entry.rssUrl,
      entry.fetchedAt,
      entry.items.length,
      entry.items.reduce((sum, item) => sum + item.images.length, 0),
    );

    const maxSortOrder = rowNumber(
      db.prepare("SELECT MAX(sort_order) AS value FROM articles").get(),
      "value",
    );

    const insertArticle = db.prepare(
      `INSERT INTO articles
        (id, title, topic, link, published_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         topic = excluded.topic,
         link = excluded.link,
         published_at = excluded.published_at`,
    );
    const insertImage = db.prepare(
      `INSERT INTO article_images (article_id, image_index, image_url)
       VALUES (?, ?, ?)
       ON CONFLICT(article_id, image_index) DO UPDATE SET
         image_url = excluded.image_url`,
    );
    const linkSource = db.prepare(
      `INSERT INTO article_sources
        (article_id, rss_url, first_seen_at, last_seen_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(article_id, rss_url) DO UPDATE SET
         last_seen_at = excluded.last_seen_at`,
    );

    entry.items.forEach((item, articleIndex) => {
      insertArticle.run(
        item.id,
        item.title,
        item.topic,
        item.link,
        item.publishedAt,
        maxSortOrder + articleIndex + 1,
      );
      linkSource.run(item.id, entry.rssUrl, entry.fetchedAt, entry.fetchedAt);
      item.images.forEach((imageUrl, imageIndex) => {
        insertImage.run(item.id, imageIndex, imageUrl);
      });
    });
  });
}

function articleImages(articleIdValue: string): string[] {
  return getCacheDb()
    .prepare(
      `SELECT image_url
       FROM article_images
       WHERE article_id = ?
       ORDER BY image_index ASC`,
    )
    .all(articleIdValue)
    .map((row) => rowString(row, "image_url"))
    .filter(Boolean);
}

function readArticles(): ArticleItem[] {
  return getCacheDb()
    .prepare(
      `SELECT id, title, topic, link, published_at
       FROM articles
       ORDER BY
         CASE WHEN published_at = '' THEN 1 ELSE 0 END,
         published_at DESC,
         sort_order ASC,
         id ASC`,
    )
    .all()
    .map((row) => ({
      id: rowString(row, "id"),
      title: rowString(row, "title"),
      topic: rowString(row, "topic"),
      link: rowString(row, "link"),
      publishedAt: rowString(row, "published_at"),
      images: articleImages(rowString(row, "id")),
    }))
    .filter((item) => item.id && item.title && item.link && item.images.length);
}

export function readArticleCache(
  _rssUrls?: string | string[],
): ArticleCacheEntry | null {
  const meta = getCacheDb()
    .prepare(
      `SELECT rss_url, fetched_at
       FROM article_source_meta
       ORDER BY fetched_at DESC, rss_url ASC`,
    )
    .all();
  const items = readArticles();
  if (items.length === 0) return null;

  return {
    rssUrls: meta.map((row) => rowString(row, "rss_url")).filter(Boolean),
    fetchedAt: rowString(meta[0], "fetched_at"),
    items,
  };
}

async function fetchArticleSource(rssUrl: string): Promise<{
  rssUrl: string;
  fetchedAt: string;
  items: ArticleItem[];
}> {
  assertRssUrl(rssUrl);

  const response = await axios.get(rssUrl, {
    responseType: "text",
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      "user-agent": "fontezdown/1.0",
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`RSS 请求失败：HTTP ${response.status}`);
  }

  const items = parseRssItems(String(response.data));
  if (items.length === 0) {
    throw new Error("RSS 中没有识别到带预览图的文章");
  }

  return {
    rssUrl,
    fetchedAt: new Date().toISOString(),
    items,
  };
}

export async function syncWechatRssArticles(
  rssUrls: string | string[],
): Promise<ArticleCacheEntry> {
  const urls = unique(
    (Array.isArray(rssUrls) ? rssUrls : [rssUrls])
      .map((value) => stringValue(value))
      .filter(Boolean),
  );
  if (urls.length === 0) throw new Error("请先填写公众号 RSS 地址");

  const sourceResults: ArticleSourceSyncResult[] = [];
  for (const rssUrl of urls) {
    try {
      const entry = await fetchArticleSource(rssUrl);
      mergeArticleSource(entry);
      sourceResults.push({
        rssUrl,
        success: true,
        fetchedAt: entry.fetchedAt,
        articleCount: entry.items.length,
        imageCount: entry.items.reduce(
          (sum, item) => sum + item.images.length,
          0,
        ),
      });
    } catch (error) {
      sourceResults.push({
        rssUrl,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const successCount = sourceResults.filter((result) => result.success).length;
  if (successCount === 0) {
    const errors = unique(
      sourceResults.map((result) => result.error || "RSS 同步失败"),
    );
    throw new Error(errors.join("；"));
  }

  const cache = readArticleCache();
  if (!cache) throw new Error("公众号文章已获取，但缓存读取失败");
  return { ...cache, sourceResults };
}

function normalizeMatchKey(value: string): string {
  return value
    .toLowerCase()
    .replace(GENERIC_WORD_RE, " ")
    .replace(WEIGHT_RE, " ")
    .replace(FONT_WEIGHT_TEXT_RE, " ")
    .replace(DESCRIPTOR_RE, " ")
    .replace(VERSION_RE, " ")
    .replace(PUNCTUATION_RE, "")
    .trim();
}

function characterSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    return 0.94 + (Math.min(left.length, right.length) / Math.max(left.length, right.length)) * 0.06;
  }

  const counts = new Map<string, number>();
  for (const char of left) counts.set(char, (counts.get(char) || 0) + 1);

  let common = 0;
  for (const char of right) {
    const count = counts.get(char) || 0;
    if (count > 0) {
      common += 1;
      counts.set(char, count - 1);
    }
  }

  return (common * 2) / (left.length + right.length);
}

function articleScoreForFont(article: ArticleItem, item: FontLinkItem): number {
  const articleKeys = unique([
    normalizeMatchKey(article.topic),
    normalizeMatchKey(article.title),
  ]).filter((key) => key.length >= 3);
  const fontKeys = unique([normalizeMatchKey(item.fontName)]).filter(
    (key) => key.length >= 3,
  );

  let bestScore = 0;
  for (const articleKey of articleKeys) {
    for (const fontKey of fontKeys) {
      bestScore = Math.max(bestScore, characterSimilarity(articleKey, fontKey));
    }
  }

  return bestScore;
}

function minimumScoreForArticle(article: ArticleItem): number {
  const topicKey = normalizeMatchKey(article.topic);
  return topicKey.length <= 4 ? MIN_SHORT_MATCH_SCORE : MIN_LONG_MATCH_SCORE;
}

export function readArticleMatchesForItems(
  items: FontLinkItem[],
): Record<string, ArticleMatchPayload> {
  const articles = readArticles();
  if (articles.length === 0 || items.length === 0) return {};

  return items.reduce<Record<string, ArticleMatchPayload>>((result, item) => {
    let bestArticle: ArticleItem | null = null;
    let bestScore = 0;

    for (const article of articles) {
      const score = articleScoreForFont(article, item);
      if (score > bestScore) {
        bestScore = score;
        bestArticle = article;
      }
    }

    if (!bestArticle || bestScore < minimumScoreForArticle(bestArticle)) {
      return result;
    }

    result[item.id] = {
      articleId: bestArticle.id,
      title: bestArticle.title,
      topic: bestArticle.topic,
      link: bestArticle.link,
      publishedAt: bestArticle.publishedAt,
      images: bestArticle.images,
      score: Math.round(bestScore * 1000) / 1000,
    };
    return result;
  }, {});
}

export function articleCacheSummary(
  cache: ArticleCacheEntry | null,
): {
  fetchedAt: string;
  articleCount: number;
  imageCount: number;
  sourceCount: number;
} | null {
  if (!cache) return null;

  return {
    fetchedAt: cache.fetchedAt,
    articleCount: cache.items.length,
    imageCount: cache.items.reduce((sum, item) => sum + item.images.length, 0),
    sourceCount: cache.rssUrls.length,
  };
}
