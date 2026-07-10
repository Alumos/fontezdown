import {
  extractFontLinks,
  extractFontLinksFromDocument,
} from "../src/utils/tencentDocs.js";
import assert from "node:assert/strict";
import test from "node:test";

test("pairs each leaf paragraph with the following hyperlink only once", () => {
  const payload = {
    type: "Document",
    content: [
      {
        type: "TableCell",
        content: [
          {
            type: "Paragraph",
            content: [{ text: "阿里妈妈·数丸 四尺寸" }],
          },
          {
            type: "Paragraph",
            content: [
              {
                text: "HYPERLINK https://shiluwords.lanzouo.com/b0hc8p9if normalLink",
                dfn: "https%3A//shiluwords.lanzouo.com/b0hc8p9if",
                dfu: "https://shiluwords.lanzouo.com/b0hc8p9if",
                dlt: "inline",
              },
            ],
          },
          {
            type: "Paragraph",
            content: [{ text: "糯米团子" }],
          },
          {
            type: "Paragraph",
            content: [
              {
                text: "HYPERLINK https://shiluwords.lanzouo.com/b0hc8mx0d normalLink",
                dfn: "https%3A//shiluwords.lanzouo.com/b0hc8mx0d",
                dfu: "https://shiluwords.lanzouo.com/b0hc8mx0d",
                dlt: "inline",
              },
            ],
          },
        ],
        text: "数丸",
        url: "https://shiluwords.lanzouo.com/b0hc8mx0d",
      },
    ],
  };

  const items = extractFontLinksFromDocument(payload);

  assert.deepEqual(
    items.map(({ fontName, lanzouUrl }) => ({ fontName, lanzouUrl })),
    [
      {
        fontName: "阿里妈妈·数丸 四尺寸",
        lanzouUrl: "https://shiluwords.lanzouo.com/b0hc8p9if",
      },
      {
        fontName: "糯米团子",
        lanzouUrl: "https://shiluwords.lanzouo.com/b0hc8mx0d",
      },
    ],
  );
});

test("allows one share URL to belong to two different document records", () => {
  const items = extractFontLinks([
    "海街圆2.0六字重",
    "HYPERLINK https://shiluwords.lanzouo.com/b0hc1m39a normalLink \u0014https://shiluwords.lanzouo.com/b0hc1m39a\u0015",
    "海街圆六字重",
    "HYPERLINK https://shiluwords.lanzouo.com/b0hc1m39a normalLink",
  ]);

  assert.equal(items.length, 2);
  assert.deepEqual(
    items.map((item) => item.fontName),
    ["海街圆2.0六字重", "海街圆六字重"],
  );
});

test("ignores bare url paragraphs that are not hyperlink field records", () => {
  const items = extractFontLinks([
    "奶香南瓜丸V1.1三字重",
    "https://shiluwords.lanzouo.com/b0hc1chza",
    "内联字体 https://shiluwords.lanzouo.com/b0inline",
  ]);

  assert.deepEqual(
    items.map(({ fontName, lanzouUrl }) => ({ fontName, lanzouUrl })),
    [
      {
        fontName: "内联字体",
        lanzouUrl: "https://shiluwords.lanzouo.com/b0inline",
      },
    ],
  );
});
