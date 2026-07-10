import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

const dataDir = mkdtempSync(join(tmpdir(), "fontezdown-cache-"));
process.env.FONTEZDOWN_DATA_DIR = dataDir;

const legacyFontCache = {
  docUrl: "https://docs.qq.com/doc/test",
  encodedId: "encoded-test",
  fileId: "file-test",
  fetchedAt: "2026-07-10T00:00:00.000Z",
  cachedAt: "2026-07-10T00:01:00.000Z",
  items: [
    {
      id: "font-1",
      fontName: "测试字体",
      lanzouUrl: "https://shiluwords.lanzouo.com/test",
      sourceLine: "HYPERLINK https://shiluwords.lanzouo.com/test",
    },
  ],
};
const legacyParsedCache = {
  version: 1,
  updatedAt: "2026-07-10T00:02:00.000Z",
  entries: {
    "font-1": {
      itemId: "font-1",
      fontName: "测试字体",
      lanzouUrl: "https://shiluwords.lanzouo.com/test",
      parsedAt: "2026-07-10T00:03:00.000Z",
      files: [
        {
          name: "测试字体.ttf",
          size: "1 MB",
          date: "2026-07-10",
          downloadUrl: "https://download.example/test.ttf",
        },
      ],
    },
  },
};

writeFileSync(
  join(dataDir, "fonts.cache.json"),
  `${JSON.stringify(legacyFontCache, null, 2)}\n`,
);
writeFileSync(
  join(dataDir, "parsed.cache.json"),
  `${JSON.stringify(legacyParsedCache, null, 2)}\n`,
);

const fontCache = await import("../src/utils/fontCache.js");
const parsedCache = await import("../src/utils/parsedCache.js");

test("migrates legacy json cache into sqlite with the existing API shape", () => {
  const cache = fontCache.readFontCache("https://docs.qq.com/doc/test");
  assert.ok(cache);
  assert.equal(cache.items.length, 1);
  assert.equal(cache.items[0]?.fontName, "测试字体");
  assert.ok(existsSync(join(dataDir, "fontezdown.sqlite")));

  const parsed = parsedCache.readParsedCacheForItems(cache.items);
  assert.equal(parsed["font-1"]?.files.length, 1);
  assert.equal(parsed["font-1"]?.files[0]?.name, "测试字体.ttf");
});

test("writes parsed records to sqlite without rewriting the legacy json file", () => {
  const before = readFileSync(join(dataDir, "parsed.cache.json"), "utf-8");

  parsedCache.writeParsedCacheRecord({
    itemId: "font-2",
    fontName: "新解析字体",
    lanzouUrl: "https://shiluwords.lanzouo.com/next",
    files: [
      {
        name: "新解析字体.otf",
        size: "2 MB",
        date: "2026-07-10",
        downloadUrl: "https://download.example/next.otf",
      },
    ],
  });

  const parsed = parsedCache.readParsedCacheForItems([
    {
      id: "font-2",
      fontName: "新解析字体",
      lanzouUrl: "https://shiluwords.lanzouo.com/next",
      sourceLine: "",
    },
  ]);

  assert.equal(
    parsed["font-2"]?.files[0]?.downloadUrl,
    "https://download.example/next.otf",
  );
  assert.equal(
    readFileSync(join(dataDir, "parsed.cache.json"), "utf-8"),
    before,
  );
});
