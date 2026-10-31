// Suivi public d'une commande : numéro + 4 derniers chiffres du téléphone.
// Ne renvoie aucune donnée personnelle (ni nom complet, ni téléphone, ni adresse).
import type { Config } from "@netlify/functions";
import { store, json, fail, REF_RE } from "../lib/common.mts";

export default async (req: Request) => {
  const url = new URL(req.url);
  const ref = (url.searchParams.get("ref") || "").trim().toUpperCase();
  const code = (url.searchParams.get("code") || "").trim();
  if (!REF_RE.test(ref) || !/^\d{4}$/.test(code)) return fail("Numéro ou code invalide.");
  const o = (await store("orders").get(ref, { type: "json" })) as Record<string, any> | null;
  if (!o || o.code !== code) return fail("Commande introuvable.", 404);
  const area = String(o.customer?.address || "").split(",")[0].split(" ").slice(0, 3).join(" ");
  return json({
    ref: o.ref,
    status: o.status,
    createdAt: o.createdAt,
    items: (o.items || []).map((l: any) => [l.id, l.qty]),
    total: o.total,
    pay: o.customer?.pay || "",
    slot: o.customer?.slot || "",
    area,
    stopsBefore: o.stopsBefore || 0,
    windowStart: o.windowStart,
    windowEnd: o.windowEnd,
    deliveredAt: o.deliveredAt || null,
    note: o.note || "",
    events: o.events || [],
    updatedAt: o.updatedAt || o.createdAt,
  });
};

export const config: Config = {
  path: "/api/track",
  method: "GET",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 },
};
