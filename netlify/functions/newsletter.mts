// Inscription au « cahier secret » (lettre d'information) avec preuve du consentement
// (loi n°025/2021, art. 37 : la preuve du consentement préalable incombe à l'expéditeur).
import type { Config } from "@netlify/functions";
import { store, json, fail, clean } from "../lib/common.mts";

export default async (req: Request) => {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return fail("Demande illisible."); }
  const email = clean(b.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Adresse e-mail invalide.");
  if (b.consent !== true) return fail("Le consentement est nécessaire.");
  await store("newsletter").setJSON(encodeURIComponent(email), {
    email,
    consentAt: new Date().toISOString(),
    consentText: clean(b.consentText, 300),
    adult: b.adult === true,
  });
  return json({ ok: true }, 201);
};

export const config: Config = {
  path: "/api/newsletter",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 5 },
};
