// API du back-office. Toutes les routes, sauf la connexion, exigent un jeton valide.
import type { Config, Context } from "@netlify/functions";
import {
  store, json, fail, clean, getSettings, DEFAULT_SETTINGS,
  isAdmin, REF_RE, STATUSES, STATUS_LABELS,
} from "../lib/common.mts";

const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : dflt;
};

// ---------- Produits ----------
function cleanProduct(p: Record<string, any>) {
  return {
    id: clean(p.id, 10).toUpperCase().replace(/[^A-Z0-9]/g, ""),
    cat: clean(p.cat, 30),
    name: clean(p.name, 80),
    price: num(p.price, 0, 10_000_000, 0),
    ...(p.old ? { old: num(p.old, 0, 10_000_000, 0) } : {}),
    ...(p.badge ? { badge: clean(p.badge, 30) } : {}),
    desc: clean(p.desc, 600),
    points: (Array.isArray(p.points) ? p.points : []).map((x: unknown) => clean(x, 80)).filter(Boolean).slice(0, 6),
    tags: (Array.isArray(p.tags) ? p.tags : []).map((x: unknown) => clean(x, 20)).filter(Boolean).slice(0, 10),
    ...(p.img ? { img: clean(p.img, 200) } : {}),
    ...(Array.isArray(p.contents) && p.contents.length
      ? { contents: p.contents.map((x: unknown) => clean(x, 10).toUpperCase()).filter(Boolean).slice(0, 8) } : {}),
    ...(p.pos ? { pos: clean(p.pos, 20) } : {}),
    art: clean(p.art || "kit", 20),
    hue: num(p.hue, 0, 360, 330),
    stock: p.stock === null || p.stock === "" || p.stock === undefined ? null : num(p.stock, 0, 100000, 0),
    hidden: p.hidden === true,
    discreet: p.discreet === true,
  };
}

async function handleCatalog(req: Request) {
  const catalog = store("catalog");
  if (req.method === "GET") return json((await catalog.get("current", { type: "json" })) || { products: null, categories: null });
  if (req.method !== "PUT") return fail("Méthode non permise.", 405);
  const b = await req.json();
  const products = (Array.isArray(b.products) ? b.products : []).map(cleanProduct).filter((p: { id: string; name: string }) => p.id && p.name);
  const ids = new Set();
  for (const p of products) { if (ids.has(p.id)) return fail(`Référence en double : ${p.id}`); ids.add(p.id); }
  const categories = (Array.isArray(b.categories) ? b.categories : []).map((c: Record<string, any>) => ({
    id: clean(c.id, 30), label: clean(c.label, 60), short: clean(c.short, 30), hint: clean(c.hint, 80),
    art: clean(c.art || "kit", 20), hue: num(c.hue, 0, 360, 330),
  })).filter((c: { id: string }) => c.id);
  await catalog.setJSON("current", { products, categories, updatedAt: new Date().toISOString() });
  return json({ ok: true, count: products.length });
}

// ---------- Commandes ----------
async function handleOrders(req: Request, ref?: string) {
  const orders = store("orders");
  if (!ref) {
    if (req.method !== "GET") return fail("Méthode non permise.", 405);
    const { blobs } = await orders.list();
    const all = await Promise.all(blobs.map((b) => orders.get(b.key, { type: "json" })));
    const list = all.filter(Boolean).sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json({ orders: list });
  }
  if (!REF_RE.test(ref)) return fail("Référence invalide.");
  const o = (await orders.get(ref, { type: "json" })) as Record<string, any> | null;
  if (!o) return fail("Commande introuvable.", 404);

  if (req.method === "DELETE") { await orders.delete(ref); return json({ ok: true }); }
  if (req.method !== "PATCH") return fail("Méthode non permise.", 405);

  const b = await req.json();
  const now = new Date().toISOString();
  o.events = Array.isArray(o.events) ? o.events : [];
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return fail("Statut inconnu.");
    if (b.status !== o.status) {
      o.status = b.status;
      o.events.push({ t: now, label: STATUS_LABELS[b.status], place: clean(b.place, 60) || "Libreville" });
      if (b.status === "livree") o.deliveredAt = now;
    }
  }
  if (b.windowStart !== undefined) o.windowStart = b.windowStart ? new Date(b.windowStart).toISOString() : null;
  if (b.windowEnd !== undefined) o.windowEnd = b.windowEnd ? new Date(b.windowEnd).toISOString() : null;
  if (b.stopsBefore !== undefined) o.stopsBefore = num(b.stopsBefore, 0, 50, 0);
  if (b.note !== undefined) o.note = clean(b.note, 300);
  if (b.internal !== undefined) o.internal = clean(b.internal, 500);
  if (b.event && clean(b.event.label, 120)) o.events.push({ t: now, label: clean(b.event.label, 120), place: clean(b.event.place, 60) });
  o.updatedAt = now;
  await orders.setJSON(ref, o);
  return json({ ok: true, order: o });
}

// ---------- Réglages ----------
async function handleSettings(req: Request) {
  if (req.method === "GET") return json(await getSettings());
  if (req.method !== "PUT") return fail("Méthode non permise.", 405);
  const b = await req.json();
  const legal: Record<string, string> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS.legal)) legal[k] = clean(b.legal?.[k], 200);
  const settings = {
    whatsapp: clean(b.whatsapp, 20).replace(/\D/g, ""),
    phone: clean(b.phone, 30),
    shippingFee: num(b.shippingFee, 0, 100000, DEFAULT_SETTINGS.shippingFee),
    freeShippingFrom: num(b.freeShippingFrom, 0, 10_000_000, DEFAULT_SETTINGS.freeShippingFrom),
    cutoffHour: num(b.cutoffHour, 0, 23, DEFAULT_SETTINGS.cutoffHour),
    legal,
  };
  await store("config").setJSON("settings", settings);
  return json({ ok: true, settings });
}

// ---------- Lettre d'information ----------
async function handleNewsletter(req: Request, id?: string) {
  const nl = store("newsletter");
  if (req.method === "DELETE" && id) {
    // la clé est l'e-mail encodé : selon la plateforme, le paramètre d'URL arrive décodé ou non
    await nl.delete(id);
    if (id.includes("%")) await nl.delete(decodeURIComponent(id));
    return json({ ok: true });
  }
  if (req.method !== "GET") return fail("Méthode non permise.", 405);
  const { blobs } = await nl.list();
  const list = (await Promise.all(blobs.map((b) => nl.get(b.key, { type: "json" })))).filter(Boolean)
    .map((x: any, i) => ({ ...x, id: blobs[i].key }));
  return json({ subscribers: list });
}

// ---------- Photos ----------
async function handleImages(req: Request) {
  if (req.method !== "POST") return fail("Méthode non permise.", 405);
  const type = (req.headers.get("content-type") || "").split(";")[0];
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type];
  if (!ext) return fail("Format accepté : JPG, PNG ou WebP.");
  const data = await req.arrayBuffer();
  if (data.byteLength > 3 * 1024 * 1024) return fail("Photo trop lourde (3 Mo maximum).");
  const key = `${crypto.randomUUID()}.${ext}`;
  await store("images").set(key, data, { metadata: { type } });
  return json({ ok: true, url: `/img/${key}` }, 201);
}

export default async (req: Request, context: Context) => {
  const { section, id } = context.params;
  try {
    if (!(await isAdmin(req))) return fail("Session expirée, reconnectez-vous.", 401);
    if (section === "orders") return handleOrders(req, id ? decodeURIComponent(id) : undefined);
    if (section === "catalog") return handleCatalog(req);
    if (section === "settings") return handleSettings(req);
    if (section === "newsletter") return handleNewsletter(req, id);
    if (section === "images") return handleImages(req);
    return fail("Route inconnue.", 404);
  } catch (e) {
    console.error(e);
    return fail("Erreur du serveur : " + (e as Error).message, 500);
  }
};

export const config: Config = {
  path: ["/api/admin/:section", "/api/admin/:section/:id"],
  excludedPath: ["/api/admin/login"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 120 },
};
