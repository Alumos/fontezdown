import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const CACHE_DATA_DIR = resolve(
  process.env.FONTEZDOWN_DATA_DIR || resolve(process.cwd(), "data"),
);
const DB_PATH = cacheDataPath("fontezdown.sqlite");

let db: DatabaseSync | null = null;

export function cacheDataPath(fileName: string): string {
  return resolve(CACHE_DATA_DIR, fileName);
}

function initializeDatabase(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS cache_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS font_cache_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      doc_url TEXT NOT NULL,
      encoded_id TEXT NOT NULL,
      file_id TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fonts (
      id TEXT PRIMARY KEY,
      font_name TEXT NOT NULL,
      lanzou_url TEXT NOT NULL,
      source_line TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parse_records (
      cache_key TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      font_name TEXT NOT NULL,
      lanzou_url TEXT NOT NULL,
      parsed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parse_files (
      cache_key TEXT NOT NULL,
      file_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      date TEXT NOT NULL,
      download_url TEXT NOT NULL,
      error TEXT NOT NULL,
      PRIMARY KEY (cache_key, file_index),
      FOREIGN KEY (cache_key) REFERENCES parse_records(cache_key) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_cache_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      rss_url TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_source_meta (
      rss_url TEXT PRIMARY KEY,
      fetched_at TEXT NOT NULL,
      article_count INTEGER NOT NULL,
      image_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      link TEXT NOT NULL,
      published_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_images (
      article_id TEXT NOT NULL,
      image_index INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      PRIMARY KEY (article_id, image_index),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_sources (
      article_id TEXT NOT NULL,
      rss_url TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (article_id, rss_url),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_fonts_sort_order
      ON fonts(sort_order);

    CREATE INDEX IF NOT EXISTS idx_parse_records_item_url
      ON parse_records(item_id, lanzou_url);

    CREATE INDEX IF NOT EXISTS idx_parse_files_cache_key
      ON parse_files(cache_key, file_index);

    CREATE INDEX IF NOT EXISTS idx_articles_sort_order
      ON articles(sort_order);

    CREATE INDEX IF NOT EXISTS idx_article_images_article_id
      ON article_images(article_id, image_index);

    CREATE INDEX IF NOT EXISTS idx_article_sources_rss_url
      ON article_sources(rss_url, article_id);

    INSERT OR IGNORE INTO article_source_meta
      (rss_url, fetched_at, article_count, image_count)
    SELECT meta.rss_url,
           meta.fetched_at,
           COUNT(DISTINCT articles.id),
           COUNT(article_images.image_url)
      FROM article_cache_meta AS meta
      LEFT JOIN articles ON 1 = 1
      LEFT JOIN article_images ON article_images.article_id = articles.id
     WHERE meta.rss_url <> ''
     GROUP BY meta.rss_url, meta.fetched_at;

    INSERT OR IGNORE INTO article_sources
      (article_id, rss_url, first_seen_at, last_seen_at)
    SELECT articles.id, meta.rss_url, meta.fetched_at, meta.fetched_at
      FROM articles
      CROSS JOIN article_cache_meta AS meta
     WHERE meta.rss_url <> '';
  `);
}

export function getCacheDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH, { timeout: 5000 });
  initializeDatabase(db);
  return db;
}

export function getCacheMeta(key: string): string {
  const row = getCacheDb()
    .prepare("SELECT value FROM cache_meta WHERE key = ?")
    .get(key);
  const value = row?.value;
  return typeof value === "string" ? value : "";
}

export function setCacheMeta(key: string, value: string): void {
  getCacheDb()
    .prepare(
      `INSERT INTO cache_meta (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function tableCount(tableName: string): number {
  const row = getCacheDb()
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get();
  const count = row?.count;
  return typeof count === "number" ? count : 0;
}

export function runInCacheTransaction<T>(operation: () => T): T {
  const database = getCacheDb();
  database.exec("BEGIN IMMEDIATE");

  try {
    const result = operation();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
