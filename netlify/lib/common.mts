// Outils partagés par les fonctions de Secret by N.
import { getStore } from "@netlify/blobs";

// Les données clients sont stockées dans l'Union européenne (Francfort), et non aux États-Unis
// (région par défaut) : c'est la région de stockage la plus proche du Gabon. La région doit être
// passée à CHAQUE appel, sinon le magasin par défaut (us-east-2) est utilisé et paraît vide.
const REGION = "eu-central-1";
export const store = (name: string) => getStore({ name, region: REGION, consistency: "strong" });

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export const fail = (message: string, status = 400) => json({ error: message }, status);

// ---------- Réglages par défaut (modifiables dans le back-office) ----------
export const DEFAULT_SETTINGS = {
  whatsapp: "",
  phone: "",
  shippingFee: 2000,
  freeShippingFrom: 30000,
  cutoffHour: 16,
  legal: {
    name: "",
    form: "",
    rccm: "",
    nif: "",
    address: "",
    email: "",
    phone: "",
    director: "",
  },
};

export async function getSettings() {
  const saved = (await store("config").get("settings", { type: "json" })) as Record<string, unknown> | null;
  return {
    ...DEFAULT_SETTINGS,
    ...(saved || {}),
    legal: { ...DEFAULT_SETTINGS.legal, ...((saved?.legal as object) || {}) },
  };
}

// ---------- Authentification du back-office ----------
// Mot de passe : variable d'environnement ADMIN_PASSWORD. Jeton signé par HMAC avec AUTH_SECRET.
const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(data: string) {
  const secret = Netlify.env.get("AUTH_SECRET");
  if (!secret) throw new Error("AUTH_SECRET manquant");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(password: string) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected || typeof password !== "string") return false;
  // Comparaison des empreintes pour ne pas révéler la longueur du mot de passe
  return safeEqual(await hmac("pw:" + password), await hmac("pw:" + expected));
}

export async function createToken(hours = 12) {
  const exp = String(Date.now() + hours * 3600 * 1000);
  return exp + "." + (await hmac("tok:" + exp));
}

export async function isAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac("tok:" + exp));
}

// ---------- Petites validations ----------
export const clean = (v: unknown, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
export const REF_RE = /^SN-[A-Z0-9]{4,10}$/;
export const STATUSES = ["commandee", "preparee", "en_route", "tentative", "livree", "annulee"];
export const STATUS_LABELS: Record<string, string> = {
  commandee: "Commande reçue",
  preparee: "Colis neutre préparé et scellé",
  en_route: "Le livreur a pris en charge votre colis",
  tentative: "Tentative de livraison sans succès",
  livree: "Colis remis en main propre",
  annulee: "Commande annulée",
};
