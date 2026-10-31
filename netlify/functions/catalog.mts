// Catalogue public et réglages publics (lus par toutes les pages du site).
import type { Config } from "@netlify/functions";
import { store, json, getSettings } from "../lib/common.mts";

export default async () => {
  const catalog = (await store("catalog").get("current", { type: "json" })) as { products?: unknown[]; categories?: unknown[] } | null;
  const s = await getSettings();
  return json({
    products: catalog?.products || null, // null = le site garde son catalogue par défaut (products.js)
    categories: catalog?.categories || null,
    settings: {
      whatsapp: s.whatsapp,
      phone: s.phone,
      shippingFee: s.shippingFee,
      freeShippingFrom: s.freeShippingFrom,
      cutoffHour: s.cutoffHour,
      legal: s.legal,
    },
  });
};

export const config: Config = { path: "/api/catalog", method: "GET" };
