// Réglages des paiements (back-office) : passerelle mobile money E-Billing (Gabon), Stripe (carte), espèces.
// Les clés secrètes sont chiffrées en base et ne sont jamais renvoyées en clair.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { chiffrer, dechiffrer, fin } from "../lib/chiffre";
import { AppError, forbidden } from "../lib/errors";

type User = typeof schema.users.$inferSelect;
export type Reglages = {
  ebilling: { actif: boolean; env: "lab" | "production"; apiUrl: string; portailUrl: string; username: string; sharedKey: string | null };
  stripe: { actif: boolean; publishableKey: string; secretKey: string | null; webhookSecret: string | null };
  especes: { actif: boolean; instructions: string; delaiJours: number };
};
const CLE = "paiements";
export const DEFAUT: Reglages = {
  ebilling: { actif: false, env: "lab", apiUrl: "https://lab.billing-easy.net/api/v1", portailUrl: "https://test.billing-easy.net", username: "", sharedKey: null },
  stripe: { actif: false, publishableKey: "", secretKey: null, webhookSecret: null },
  especes: { actif: true, instructions: "Bureau OAPS Consulting Group, quartier Glass, Libreville. Du lundi au vendredi, de 9 h à 17 h. Indiquez la référence du paiement.", delaiJours: 7 },
};

let cache: { at: number; r: Reglages } | null = null;
/** Réglages en clair (secrets déchiffrés) pour le serveur uniquement. */
export async function reglages(): Promise<Reglages> {
  if (cache && Date.now() - cache.at < 30_000) return cache.r;
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, CLE));
  const v = (row?.value ?? {}) as Partial<Reglages>;
  const r: Reglages = {
    ebilling: { ...DEFAUT.ebilling, ...v.ebilling, sharedKey: dechiffrer(v.ebilling?.sharedKey) },
    stripe: { ...DEFAUT.stripe, ...v.stripe, secretKey: dechiffrer(v.stripe?.secretKey), webhookSecret: dechiffrer(v.stripe?.webhookSecret) },
    especes: { ...DEFAUT.especes, ...v.especes },
  };
  cache = { at: Date.now(), r };
  return r;
}

/** Vue du back-office : secrets masqués (4 derniers caractères). */
export async function vueAdmin(admin: User) {
  if (admin.role !== "admin") throw forbidden();
  const r = await reglages();
  const app = process.env.APP_URL || process.env.URL || "https://navigoal.net";
  return {
    ebilling: { ...r.ebilling, sharedKey: fin(r.ebilling.sharedKey) },
    stripe: { ...r.stripe, secretKey: fin(r.stripe.secretKey), webhookSecret: fin(r.stripe.webhookSecret) },
    especes: r.especes,
    webhooks: { ebilling: `${app}/api/paiements/webhook/ebilling`, stripe: `${app}/api/paiements/webhook/stripe` },
    recette: process.env.PAYMENTS_MODE === "sandbox",
  };
}

const url = z.string().trim().url().max(200).refine((u) => u.startsWith("https://"), "Adresse en https:// attendue.");
const secret = z.string().trim().max(300).optional(); // vide ou absent : clé inchangée
export const reglagesSchema = z.object({
  ebilling: z.object({ actif: z.boolean(), env: z.enum(["lab", "production"]), apiUrl: url, portailUrl: url, username: z.string().trim().max(120), sharedKey: secret }),
  stripe: z.object({ actif: z.boolean(), publishableKey: z.string().trim().max(200).refine((k) => !k || /^pk_(live|test)_/.test(k), "Clé publique Stripe attendue (pk_live_… ou pk_test_…)."), secretKey: secret.refine((k) => !k || /^(sk|rk)_(live|test)_/.test(k), "Clé secrète Stripe attendue (sk_live_… ou sk_test_…)."), webhookSecret: secret.refine((k) => !k || k.startsWith("whsec_"), "Secret de webhook Stripe attendu (whsec_…).") }),
  especes: z.object({ actif: z.boolean(), instructions: z.string().trim().min(10).max(800), delaiJours: z.coerce.number().int().min(1).max(60) }),
});

export async function enregistrer(admin: User, raw: unknown) {
  if (admin.role !== "admin") throw forbidden();
  const i = reglagesSchema.parse(raw);
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, CLE));
  const ancien = (row?.value ?? {}) as Record<string, Record<string, unknown>>;
  const garde = (nouveau: string | undefined, prec: unknown) => (nouveau ? chiffrer(nouveau) : (prec as string | null) ?? null);
  const value = {
    ebilling: { ...i.ebilling, sharedKey: garde(i.ebilling.sharedKey, ancien.ebilling?.sharedKey) },
    stripe: { ...i.stripe, secretKey: garde(i.stripe.secretKey, ancien.stripe?.secretKey), webhookSecret: garde(i.stripe.webhookSecret, ancien.stripe?.webhookSecret) },
    especes: i.especes,
  };
  if (value.ebilling.actif && (!value.ebilling.username || !value.ebilling.sharedKey)) throw new AppError("Pour activer le mobile money, renseignez l'identifiant et la clé partagée E-Billing.");
  if (value.stripe.actif && (!value.stripe.publishableKey || !value.stripe.secretKey)) throw new AppError("Pour activer la carte bancaire, renseignez les clés Stripe.");
  await db.insert(schema.appSettings).values({ key: CLE, value, updatedBy: admin.id }).onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedBy: admin.id, updatedAt: new Date() } });
  cache = null;
  await audit(admin.id, "reglages_paiement", "settings", CLE, { ebilling: value.ebilling.actif, stripe: value.stripe.actif, especes: value.especes.actif });
  return vueAdmin(admin);
}

/** Test de connexion : E-Billing (liste des factures) ou Stripe (solde du compte), sans créer de paiement. */
export async function tester(admin: User, quoi: "ebilling" | "stripe") {
  if (admin.role !== "admin") throw forbidden();
  const r = await reglages();
  try {
    if (quoi === "ebilling") {
      if (!r.ebilling.username || !r.ebilling.sharedKey) return { ok: false, message: "Identifiant ou clé partagée manquant." };
      const res = await fetch(`${r.ebilling.apiUrl.replace(/\/$/, "")}/merchant/e_bills.json`, { headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${r.ebilling.username}:${r.ebilling.sharedKey}`).toString("base64")}` }, signal: AbortSignal.timeout(15000) });
      return res.ok ? { ok: true, message: "Connexion à E-Billing réussie." } : { ok: false, message: res.status === 401 ? "Identifiant ou clé partagée refusés par E-Billing." : `E-Billing a répondu ${res.status}.` };
    }
    if (!r.stripe.secretKey) return { ok: false, message: "Clé secrète Stripe manquante." };
    const res = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${r.stripe.secretKey}` }, signal: AbortSignal.timeout(15000) });
    return res.ok ? { ok: true, message: `Connexion à Stripe réussie (${r.stripe.secretKey.includes("_live_") ? "mode réel" : "mode test"}).` } : { ok: false, message: res.status === 401 ? "Clé secrète refusée par Stripe." : `Stripe a répondu ${res.status}.` };
  } catch {
    return { ok: false, message: "Passerelle injoignable depuis le serveur." };
  }
}
