import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PRODUCT_PHOTOS } from "./product-photos.ts";

test("photos produits : fichiers présents et slugs du catalogue", () => {
  const slugs = new Set((JSON.parse(readFileSync("content/catalogue.json", "utf8")) as { slug: string }[]).map((p) => p.slug));
  for (const [slug, photos] of Object.entries(PRODUCT_PHOTOS)) {
    assert.ok(slugs.has(slug), `${slug} absent du catalogue`);
    for (const ph of photos) assert.ok(existsSync(`public${ph.src}`), `${ph.src} manquante`);
  }
});
