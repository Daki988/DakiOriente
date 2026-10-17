"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOG_ROLES, requireAdmin, type Role } from "@/lib/admin";
import { getProduct, toRow, type Product } from "@/lib/catalog";
import { textToOptions } from "@/lib/options-text";
import type { PricingMode, Tier } from "@/lib/pricing";
import { LAST_STEP, PAYMENT_METHODS, STEPS } from "@/lib/status";
import { supabaseService } from "@/lib/supabase";

async function orderByCode(code: string) {
  const { data } = await supabaseService().from("orders").select("id, status, cancelled").eq("code", code).maybeSingle();
  if (!data) throw new Error("Commande introuvable.");
  return data as { id: string; status: number; cancelled: boolean };
}

async function log(orderId: string, kind: string, detail: string, actor: string) {
  await supabaseService().from("order_events").insert({ order_id: orderId, kind, detail, actor });
}

const refresh = (code: string) => {
  revalidatePath("/admin");
  revalidatePath(`/admin/commandes/${code}`);
};

export async function advanceOrder(code: string) {
  const me = await requireAdmin();
  const o = await orderByCode(code);
  if (o.cancelled || o.status >= LAST_STEP) return;
  const next = o.status + 1;
  await supabaseService().from("orders").update({ status: next, updated_at: new Date().toISOString() }).eq("id", o.id);
  await log(o.id, "status", `Étape : ${STEPS[next]}`, me.email);
  refresh(code);
}

export async function backOrder(code: string) {
  const me = await requireAdmin();
  const o = await orderByCode(code);
  if (o.status <= 0) return;
  await supabaseService().from("orders").update({ status: o.status - 1, updated_at: new Date().toISOString() }).eq("id", o.id);
  await log(o.id, "status", `Retour à l’étape : ${STEPS[o.status - 1]}`, me.email);
  refresh(code);
}

export async function markPaid(code: string, form: FormData) {
  const me = await requireAdmin();
  const method = String(form.get("method"));
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) throw new Error("Moyen de paiement inconnu.");
  const o = await orderByCode(code);
  await supabaseService().from("orders").update({ payment_method: method, paid_at: new Date().toISOString() }).eq("id", o.id);
  await log(o.id, "payment", `Paiement reçu : ${method}`, me.email);
  refresh(code);
}

export async function unmarkPaid(code: string) {
  const me = await requireAdmin();
  const o = await orderByCode(code);
  await supabaseService().from("orders").update({ payment_method: null, paid_at: null }).eq("id", o.id);
  await log(o.id, "payment", "Paiement annulé", me.email);
  refresh(code);
}

export async function toggleCancel(code: string) {
  const me = await requireAdmin();
  const o = await orderByCode(code);
  await supabaseService().from("orders").update({ cancelled: !o.cancelled }).eq("id", o.id);
  await log(o.id, "cancel", o.cancelled ? "Commande réactivée" : "Commande annulée", me.email);
  refresh(code);
}

export async function addNote(code: string, form: FormData) {
  const me = await requireAdmin();
  const text = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (!text) return;
  const o = await orderByCode(code);
  await log(o.id, "note", text, me.email);
  refresh(code);
}

// ───────── Catalogue ─────────

export type SaveState = { error?: string; ok?: string };

const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function saveProduct(originalSlug: string | null, _prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin(CATALOG_ROLES);
  const get = (k: string) => String(form.get(k) ?? "").trim();

  const name = get("name");
  const category = get("category");
  if (name.length < 2) return { error: "Indiquez le nom du produit." };
  if (category.length < 2) return { error: "Indiquez la catégorie." };
  const slug = originalSlug ?? slugify(get("slug") || name);
  if (!slug) return { error: "Adresse de page invalide." };

  const qtys = form.getAll("tier_qty").map((v) => Number(String(v).replace(/\s/g, "").replace(",", ".")));
  const prices = form.getAll("tier_price").map((v) => Number(String(v).replace(/\s/g, "")));
  const tiers: Tier[] = [];
  for (let i = 0; i < qtys.length; i++) {
    if (!qtys[i] && !prices[i]) continue;
    if (!(qtys[i] > 0) || !(prices[i] >= 0)) return { error: `Palier ${i + 1} : quantité et prix doivent être des nombres positifs.` };
    tiers.push({ qty: qtys[i], price: Math.round(prices[i]) });
  }
  if (!tiers.length) return { error: "Ajoutez au moins un palier de prix." };
  tiers.sort((a, b) => a.qty - b.qty);
  if (new Set(tiers.map((t) => t.qty)).size !== tiers.length) return { error: "Deux paliers ont la même quantité." };

  const options = textToOptions(get("options"));
  if (typeof options === "string") return { error: `Options : ${options}` };

  const pricing = get("pricing") as PricingMode;
  if (!["pack", "unit", "area"].includes(pricing)) return { error: "Mode de prix invalide." };
  const fw = Number(get("format_w")), fh = Number(get("format_h"));

  const product: Product = {
    slug, name, category, categorySlug: slugify(category), color: get("color") || "yellow",
    description: get("description").slice(0, 600), unit: get("unit") || "ex.", pricing, tiers, options,
    formatMm: fw > 0 && fh > 0 ? [Math.round(fw), Math.round(fh)] : null,
    customizable: form.get("customizable") === "on", visible: form.get("visible") === "on", featured: form.get("featured") === "on",
    sort: Number(get("sort")) || 0,
  };

  const db = supabaseService();
  const { error } = originalSlug
    ? await db.from("products").update({ ...toRow(product), updated_at: new Date().toISOString() }).eq("slug", originalSlug)
    : await db.from("products").insert(toRow(product));
  if (error) return { error: error.code === "23505" ? "Un produit porte déjà cette adresse." : "Enregistrement impossible. Réessayez." };

  revalidatePath("/", "layout");
  if (!originalSlug) redirect(`/admin/catalogue/${slug}?cree=1`);
  return { ok: "Enregistré. Le site affiche déjà les nouveaux prix." };
}

export async function toggleVisible(slug: string) {
  await requireAdmin(CATALOG_ROLES);
  const p = await getProduct(slug, { includeHidden: true });
  if (!p) return;
  await supabaseService().from("products").update({ visible: !p.visible }).eq("slug", slug);
  revalidatePath("/", "layout");
}

// ───────── Équipe (super administrateur) ─────────

export async function addMember(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin(["super_admin"]);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role")) as Role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse e-mail invalide." };
  if (!["admin", "atelier"].includes(role)) return { error: "Rôle invalide." };
  const db = supabaseService();
  // Crée le compte de connexion s'il n'existe pas ; la personne choisit son mot de passe via « Mot de passe oublié ».
  const { error: authErr } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (authErr && !/already|registered|exists/i.test(authErr.message)) return { error: "Compte impossible à créer. Réessayez." };
  const { error } = await db.from("admins").upsert({ email, role });
  if (error) return { error: "Ajout impossible. Réessayez." };
  revalidatePath("/admin/equipe");
  return { ok: `${email} ajouté. Il se connecte via « Mot de passe oublié ou première connexion ».` };
}

export async function removeMember(email: string) {
  const me = await requireAdmin(["super_admin"]);
  if (email === me.email) throw new Error("Vous ne pouvez pas retirer votre propre accès.");
  await supabaseService().from("admins").delete().eq("email", email).neq("role", "super_admin");
  revalidatePath("/admin/equipe");
}
