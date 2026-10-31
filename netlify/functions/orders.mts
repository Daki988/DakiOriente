// Enregistrement d'une commande passée sur le site.
import type { Config } from "@netlify/functions";
import { store, json, fail, clean, getSettings, REF_RE } from "../lib/common.mts";

export default async (req: Request) => {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return fail("Commande illisible."); }

  const ref = clean(b.ref, 12).toUpperCase();
  const phone = clean(b.phone, 30);
  const digits = phone.replace(/\D/g, "");
  const items = Array.isArray(b.items) ? b.items : [];
  if (!REF_RE.test(ref)) return fail("Référence de commande invalide.");
  if (digits.length < 8) return fail("Numéro de téléphone invalide.");
  if (!items.length || items.length > 40) return fail("Panier vide ou trop grand.");
  if (b.cgv !== true) return fail("Les conditions générales de vente doivent être acceptées.");

  // Prix recalculés à partir du catalogue en ligne quand il existe (le navigateur n'a pas le dernier mot)
  const catalog = (await store("catalog").get("current", { type: "json" })) as { products?: { id: string; price: number; name: string }[] } | null;
  const byId = new Map((catalog?.products || []).map((p) => [p.id, p]));
  const lines = items.slice(0, 40).map((it: unknown) => {
    const [id, qty] = Array.isArray(it) ? it : [];
    const q = Math.max(1, Math.min(10, Number(qty) || 1));
    const p = byId.get(String(id));
    const sent = (b.prices as Record<string, number> | undefined)?.[String(id)];
    return { id: clean(id, 10), qty: q, name: p?.name || clean((b.names as Record<string, string> | undefined)?.[String(id)], 80), price: p ? p.price : Math.max(0, Number(sent) || 0) };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const settings = await getSettings();
  const ship = subtotal >= settings.freeShippingFrom ? 0 : settings.shippingFee;

  const now = new Date().toISOString();
  const order = {
    ref,
    code: digits.slice(-4),
    createdAt: now,
    status: "commandee",
    items: lines,
    subtotal,
    ship,
    total: subtotal + ship,
    // Données personnelles : uniquement ce qu'il faut pour livrer. Effacées 30 jours après la livraison.
    customer: {
      name: clean(b.name, 60),
      phone,
      address: clean(b.address, 200),
      slot: clean(b.slot, 40),
      pay: clean(b.pay, 30),
      call: b.call === true,
    },
    stopsBefore: 0,
    windowStart: null,
    windowEnd: null,
    note: "",
    events: [{ t: now, label: "Commande reçue", place: "Boutique en ligne" }],
  };

  const res = await store("orders").setJSON(ref, order, { onlyIfNew: true });
  if (!res.modified) return fail("Cette référence existe déjà, réessayez.", 409);
  return json({ ok: true, ref, code: order.code, total: order.total }, 201);
};

export const config: Config = {
  path: "/api/orders",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
