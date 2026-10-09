import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { nextNumber } from "../lib/counters";
import { AppError, forbidden, notFound } from "../lib/errors";
import { putFile } from "../lib/storage";
import { CURRENCY, METHODS, providerById, providerFor } from "../payments/providers";
import { notify } from "./notifications";
import { receiptPdf } from "./pdf";
import { isGuardianOf } from "./guardians";

type User = typeof schema.users.$inferSelect;
type Kind = (typeof schema.paymentKindEnum.enumValues)[number];
const APP_URL = () => process.env.APP_URL || process.env.URL || "http://localhost:3000";
export const KIND_LABEL: Record<Kind, string> = { frais_candidature: "Frais de dossier", reservation: "Réservation de logement (1er loyer)", caution: "Dépôt de garantie", loyer: "Loyer", service: "Frais de service Navilease" };

/** Crée un paiement et renvoie l'URL de paiement chez l'agrégateur (ou la page bac à sable). */
export async function initiatePayment(payer: User, p: { kind: Kind; amount: number; currency: string; method: string; description: string; applicationId?: string; bookingId?: string; beneficiaryId?: string; escrow?: boolean; meta?: Record<string, unknown> }) {
  if (p.amount <= 0) throw new AppError("Montant invalide.");
  const country = Object.entries(CURRENCY).find(([, c]) => c === p.currency)?.[0] ?? "SN";
  if (!METHODS[country].some((m) => m.id === p.method)) throw new AppError("Moyen de paiement non disponible pour ce pays.");
  if (p.beneficiaryId && p.beneficiaryId !== payer.id && !(payer.role === "parent" && (await isGuardianOf(payer.id, p.beneficiaryId)))) throw forbidden();
  const provider = providerFor(p.currency);
  const reference = await nextNumber("NG-PAY", 6);
  const [pay] = await db.insert(schema.payments).values({
    reference, payerId: payer.id, beneficiaryId: p.beneficiaryId ?? null, kind: p.kind, amount: p.amount, currency: p.currency, provider: provider.id, method: p.method,
    status: "en_attente", applicationId: p.applicationId ?? null, bookingId: p.bookingId ?? null, meta: { ...p.meta, description: p.description, escrow: !!p.escrow },
  }).returning();
  const co = await provider.createCheckout({
    reference, amount: p.amount, currency: p.currency, method: p.method, description: p.description,
    customer: { name: `${payer.firstName} ${payer.lastName}`, email: payer.email, phone: payer.phone },
    returnUrl: `${APP_URL()}/paiement/${reference}`, notifyUrl: `${APP_URL()}/api/paiements/webhook/${provider.id}`,
  });
  await db.update(schema.payments).set({ providerRef: co.providerRef }).where(eq(schema.payments.id, pay.id));
  return { payment: { ...pay, providerRef: co.providerRef }, redirectUrl: co.redirectUrl };
}

export async function getPayment(viewer: User, reference: string) {
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference));
  if (!p) throw notFound("Paiement");
  if (viewer.role !== "admin" && p.payerId !== viewer.id && p.beneficiaryId !== viewer.id) throw forbidden();
  return p;
}

/** Interroge l'agrégateur (webhook ou retour) puis applique le résultat. */
export async function syncPayment(reference: string) {
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference));
  if (!p) throw notFound("Paiement");
  if (p.status !== "en_attente") return p;
  const st = await providerById(p.provider).check(p.reference, p.providerRef);
  if (st === "en_attente") return p;
  return settlePayment(reference, st === "reussi");
}

/** Bac à sable : le payeur confirme ou refuse la transaction simulée. */
export async function sandboxConfirm(viewer: User, reference: string, success: boolean) {
  const p = await getPayment(viewer, reference);
  if (p.provider !== "sandbox" || p.payerId !== viewer.id) throw forbidden();
  if (process.env.NODE_ENV === "production" && process.env.PAYMENTS_MODE !== "sandbox" && !process.env.ALLOW_SANDBOX_PAYMENTS) throw new AppError("Le paiement simulé est désactivé en production.");
  return settlePayment(reference, success);
}

async function settlePayment(reference: string, success: boolean) {
  const [cur] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference));
  if (!cur) throw notFound("Paiement");
  const escrow = !!(cur.meta as { escrow?: boolean }).escrow;
  // Mise à jour conditionnelle : un paiement n'est réglé qu'une fois (webhook et retour peuvent arriver en double).
  const [p] = await db.update(schema.payments)
    .set(success ? { status: "reussi", paidAt: new Date(), escrow: escrow ? "bloque" : "aucun" } : { status: "echoue" })
    .where(and(eq(schema.payments.id, cur.id), eq(schema.payments.status, "en_attente"))).returning();
  if (!p) return cur;
  if (!success) {
    await notify(p.payerId, { kind: "paiement_echoue", title: "Paiement non abouti", body: `Le paiement ${p.reference} n'a pas abouti. Vous pouvez réessayer.`, link: `/paiement/${p.reference}` });
    return p;
  }
  await audit(p.payerId, "paiement_reussi", "payment", p.id, { amount: p.amount, currency: p.currency });
  await notify(p.payerId, { kind: "paiement_confirme", title: "Paiement confirmé", body: `${KIND_LABEL[p.kind]} : ${p.amount} ${p.currency}. Reçu disponible.`, link: `/paiement/${p.reference}`, channels: ["app", "email", "sms"] });
  if (p.applicationId) await (await import("./applications")).onApplicationFeePaid(p.applicationId);
  if (p.bookingId) await (await import("./bookings")).onBookingPaid(p.bookingId, p);
  return p;
}

export async function receipt(viewer: User, reference: string) {
  const p = await getPayment(viewer, reference);
  if (p.status !== "reussi") throw new AppError("Reçu disponible après confirmation du paiement.");
  const [payer] = await db.select().from(schema.users).where(eq(schema.users.id, p.payerId));
  const benef = p.beneficiaryId ? (await db.select().from(schema.users).where(eq(schema.users.id, p.beneficiaryId)))[0] : null;
  const bytes = await receiptPdf({
    reference: p.reference, payer: `${payer.firstName} ${payer.lastName}`, beneficiary: benef ? `${benef.firstName} ${benef.lastName}` : undefined,
    label: String((p.meta as { description?: string }).description ?? KIND_LABEL[p.kind]), amount: p.amount, currency: p.currency,
    method: Object.values(METHODS).flat().find((m) => m.id === p.method)?.label ?? p.method, paidAt: p.paidAt ?? new Date(), escrow: p.escrow !== "aucun",
  });
  return bytes;
}

export async function listPaymentsFor(user: User) {
  const ids = [user.id];
  if (user.role === "parent") {
    const kids = await db.select({ c: schema.guardianships.childId }).from(schema.guardianships).where(and(eq(schema.guardianships.parentId, user.id), eq(schema.guardianships.status, "actif")));
    ids.push(...kids.map((k) => k.c));
  }
  return db.select().from(schema.payments).where(inArray(schema.payments.payerId, ids)).orderBy(desc(schema.payments.createdAt));
}

/** Libère les fonds bloqués en séquestre vers le bailleur (après l'entrée dans les lieux) ou les rembourse. */
export async function setEscrow(actorId: string | null, bookingId: string, to: "libere" | "rembourse") {
  const r = await db.update(schema.payments).set({ escrow: to, releasedAt: new Date(), ...(to === "rembourse" ? { status: "rembourse" as const } : {}) })
    .where(and(eq(schema.payments.bookingId, bookingId), eq(schema.payments.escrow, "bloque"))).returning();
  await audit(actorId, `sequestre_${to}`, "booking", bookingId, { payments: r.map((x) => x.reference) });
  return r;
}

export async function storeReceipt(reference: string, bytes: Uint8Array) {
  return putFile(`receipts/${reference}.pdf`, bytes, "application/pdf");
}
