import { randomBytes } from "node:crypto";
import type { Product } from "@/lib/catalog";
import { quote, type Selection } from "@/lib/pricing";
import { settings } from "@/lib/site";
import { FILES_BUCKET, supabaseService } from "@/lib/supabase";

export const FILE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "ai", "eps", "svg", "psd", "tif", "tiff", "zip"];
export const MAX_FILE_MB = 100;

export type OrderInput = {
  slug: string;
  selection: Selection;
  customer: { name: string; phone: string; email?: string };
  delivery: { mode: "pickup" | "libreville"; address?: string };
  notes?: string;
  file?: { name: string; size: number } | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Numéro gabonais ou international → +XXXXXXXX. Accepte « 077 45 31 67 », « 77453167 », « +241 77 45 31 67 ». */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 8) d = "241" + d;
  return d.length >= 10 && d.length <= 15 ? `+${d}` : null;
}

export function validateOrderInput(body: unknown): Result<OrderInput> {
  if (!body || typeof body !== "object") return { ok: false, error: "Requête invalide." };
  const b = body as Record<string, any>;
  const slug = str(b.slug, 120);
  const name = str(b.customer?.name, 80);
  const phone = normalizePhone(str(b.customer?.phone, 30));
  const email = str(b.customer?.email, 120);
  const mode = b.delivery?.mode === "libreville" ? "libreville" : "pickup";
  const address = str(b.delivery?.address, 300);
  const sel = b.selection ?? {};

  if (!slug) return { ok: false, error: "Produit manquant." };
  if (name.length < 2) return { ok: false, error: "Indiquez votre nom." };
  if (!phone) return { ok: false, error: "Numéro WhatsApp invalide. Exemple : 077 45 31 67." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Adresse e-mail invalide." };
  if (mode === "libreville" && address.length < 5) return { ok: false, error: "Indiquez l’adresse de livraison (quartier, repère)." };

  let file: OrderInput["file"] = null;
  if (b.file) {
    const fname = str(b.file.name, 200);
    const ext = fname.split(".").pop()?.toLowerCase() ?? "";
    const size = Number(b.file.size);
    if (!FILE_EXTENSIONS.includes(ext)) return { ok: false, error: `Format de fichier non accepté. Formats : ${FILE_EXTENSIONS.join(", ")}.` };
    if (!(size > 0 && size <= MAX_FILE_MB * 1024 * 1024)) return { ok: false, error: `Fichier trop lourd (${MAX_FILE_MB} Mo maximum).` };
    file = { name: fname, size };
  }
  if (!file && !sel.design) return { ok: false, error: "Ajoutez votre fichier ou demandez la création par un graphiste." };

  const choices: Record<string, string> = {};
  if (sel.choices && typeof sel.choices === "object") {
    for (const [k, v] of Object.entries(sel.choices)) if (typeof v === "string") choices[str(k, 60)] = str(v, 60);
  }

  return {
    ok: true,
    value: {
      slug,
      selection: { qty: Number(sel.qty), widthCm: sel.widthCm == null ? undefined : Number(sel.widthCm), heightCm: sel.heightCm == null ? undefined : Number(sel.heightCm), choices, design: Boolean(sel.design) },
      customer: { name, phone, email: email || undefined },
      delivery: { mode, address: mode === "libreville" ? address : undefined },
      notes: str(b.notes, 1000) || undefined,
      file,
    },
  };
}

/** Total facturé : prix du produit + options + graphiste + livraison. */
export function priceOrder(product: Product, input: OrderInput) {
  const q = quote(product, input.selection, settings.designFee);
  if (!q.ok) return q;
  const deliveryFee = input.delivery.mode === "libreville" ? settings.delivery.libreville_fee : 0;
  return { ...q, deliveryFee, total: q.total + deliveryFee };
}

const safeName = (n: string) =>
  n.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80);

export async function createOrder(product: Product, input: OrderInput) {
  const priced = priceOrder(product, input);
  if (!priced.ok) return priced;
  const db = supabaseService();
  const token = randomBytes(18).toString("base64url");

  const { data: order, error } = await db
    .from("orders")
    .insert({
      token,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email ?? null,
      product_id: product.id ?? null,
      product_slug: product.slug,
      product_name: product.name,
      selection: { ...input.selection, choices: priced.choices, unit: product.unit, pricing: product.pricing, area: priced.area, breakdown: { base: priced.base, options: priced.optionsDelta, design: priced.design, delivery: priced.deliveryFee } },
      amount: priced.total,
      delivery: input.delivery.mode,
      delivery_address: input.delivery.address ?? null,
      notes: input.notes ?? null,
      design_service: Boolean(input.selection.design),
    })
    .select("id, code")
    .single();
  if (error || !order) return { ok: false as const, error: "La commande n’a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp." };

  let upload: { path: string; token: string } | undefined;
  if (input.file) {
    const path = `${order.code}/${Date.now()}-${safeName(input.file.name)}`;
    const { data: signed } = await db.storage.from(FILES_BUCKET).createSignedUploadUrl(path);
    if (signed) {
      upload = { path, token: signed.token };
      await db.from("orders").update({ file_path: path, file_name: input.file.name }).eq("id", order.id);
    }
  }
  await db.from("order_events").insert({ order_id: order.id, kind: "created", detail: "Commande passée sur le site", actor: "client" });

  return { ok: true as const, code: order.code as string, token, total: priced.total, upload };
}

export type TrackedOrder = {
  code: string; created_at: string; product_name: string; amount: number; status: number;
  cancelled: boolean; delivery: string; paid_at: string | null; selection: Record<string, any>; customer_name: string;
};

export async function getOrderByToken(token: string): Promise<TrackedOrder | null> {
  if (!/^[\w-]{20,40}$/.test(token)) return null;
  const { data } = await supabaseService()
    .from("orders")
    .select("code, created_at, product_name, amount, status, cancelled, delivery, paid_at, selection, customer_name")
    .eq("token", token)
    .maybeSingle();
  return (data as TrackedOrder) ?? null;
}
