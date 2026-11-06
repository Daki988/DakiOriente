import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { nextNumber } from "../lib/counters";
import { AppError, forbidden, notFound } from "../lib/errors";
import { putFile } from "../lib/storage";
import { libelleMoyen, moyensDisponibles, msisdnGabon, providerById, providerFor, pousserUssd } from "../payments/providers";
import { reglages } from "./reglages-paiement";
import { tauxDuJour } from "../lib/taux";
import { convertirDe, devisePays } from "@/lib/devises";
import { notify } from "./notifications";
import { receiptPdf } from "./pdf";
import { isGuardianOf } from "./guardians";

type User = typeof schema.users.$inferSelect;
type Kind = (typeof schema.paymentKindEnum.enumValues)[number];
const APP_URL = () => process.env.APP_URL || process.env.URL || "http://localhost:3000";
export const KIND_LABEL: Record<Kind, string> = { frais_candidature: "Frais de dossier", reservation: "Réservation de logement (1er loyer)", caution: "Dépôt de garantie", loyer: "Loyer", service: "Frais de service Navilease" };

/** Crée un paiement et renvoie l'URL de paiement chez l'agrégateur (ou la page bac à sable). */
export async function initiatePayment(payer: User, p: { kind: Kind; amount: number; currency: string; method: string; description: string; applicationId?: string; bookingId?: string; beneficiaryId?: string; escrow?: boolean; meta?: Record<string, unknown>; telephone?: string | null }) {
  if (p.amount <= 0) throw new AppError("Montant invalide.");
  if (!(await moyensDisponibles(p.currency)).some((m) => m.id === p.method)) throw new AppError("Choisissez un moyen de paiement proposé (mobile money, carte ou espèces).");
  const telephone = p.telephone || payer.phone;
  if ((p.method === "airtel_money" || p.method === "moov_money") && !msisdnGabon(telephone)) throw new AppError("Indiquez un numéro Airtel Money ou Moov Money valide (ex. 077 12 34 56).", 400, "telephone");
  if (p.beneficiaryId && p.beneficiaryId !== payer.id && !(payer.role === "parent" && (await isGuardianOf(payer.id, p.beneficiaryId)))) throw forbidden();
  const provider = providerFor(p.method);
  const delai = (await reglages()).especes.delaiJours;
  const reference = await nextNumber("NG-PAY", 6);
  const [pay] = await db.insert(schema.payments).values({
    reference, payerId: payer.id, beneficiaryId: p.beneficiaryId ?? null, kind: p.kind, amount: p.amount, currency: p.currency, provider: provider.id, method: p.method,
    status: "en_attente", applicationId: p.applicationId ?? null, bookingId: p.bookingId ?? null,
    meta: { ...p.meta, description: p.description, escrow: !!p.escrow, ...(telephone ? { telephone: msisdnGabon(telephone) ?? telephone } : {}), ...(p.method === "especes" ? { expireLe: new Date(Date.now() + delai * 864e5).toISOString() } : {}) },
  }).returning();
  let co;
  try {
    co = await provider.createCheckout({
      reference, amount: p.amount, currency: p.currency, method: p.method, description: p.description,
      customer: { name: `${payer.firstName} ${payer.lastName}`, email: payer.email, phone: telephone },
      returnUrl: `${APP_URL()}/paiement/${reference}`, notifyUrl: `${APP_URL()}/api/paiements/webhook/${provider.id}`,
    });
  } catch (e) {
    console.error("Paiement", provider.id, e);
    await db.update(schema.payments).set({ status: "echoue", meta: { ...(pay.meta as object), erreur: String(e instanceof Error ? e.message : e).slice(0, 200) } }).where(eq(schema.payments.id, pay.id));
    throw new AppError("La passerelle de paiement n'a pas pu lancer le paiement. Réessayez ou choisissez un autre moyen.", 502, "passerelle");
  }
  // Page externe (Stripe) : lien gardé pour reprendre le paiement depuis /paiement/<référence> (ex. parent prévenu par e-mail).
  const meta = co.redirectUrl.startsWith("/") ? pay.meta : { ...(pay.meta as object), lienPaiement: co.redirectUrl };
  await db.update(schema.payments).set({ providerRef: co.providerRef, meta }).where(eq(schema.payments.id, pay.id));
  return { payment: { ...pay, meta, providerRef: co.providerRef }, redirectUrl: co.redirectUrl };
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

/**
 * Paiement sans agrégateur (bac à sable) : qui peut le déclarer réglé ou refusé ?
 * - l'administrateur, toujours (après réception d'un virement ou d'un mobile money, ou pour un test) ;
 * - le payeur lui-même seulement hors production, ou si ALLOW_SANDBOX_PAYMENTS=1 (environnement de recette fermé).
 * Sans cette règle, n'importe quel utilisateur validerait ses frais ou son séquestre sans payer.
 */
export function simulationAutorisee(viewer: User, p: { provider: string; payerId: string | null }) {
  if (p.provider !== "sandbox") return false;
  if (viewer.role === "admin") return true;
  return p.payerId === viewer.id && (process.env.NODE_ENV !== "production" || process.env.ALLOW_SANDBOX_PAYMENTS === "1");
}

export async function sandboxConfirm(viewer: User, reference: string, success: boolean) {
  const p = await getPayment(viewer, reference);
  if (p.provider !== "sandbox" || (viewer.role !== "admin" && p.payerId !== viewer.id)) throw forbidden();
  if (!simulationAutorisee(viewer, p)) throw new AppError("Paiement en attente de confirmation par l'équipe Navigoal.", 403, "interdit");
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
  await notify(p.payerId, { kind: "paiement_confirme", title: "Paiement confirmé", body: `${KIND_LABEL[p.kind]} : ${p.amount.toLocaleString("fr-FR")} ${p.currency}. Reçu disponible.`, link: `/paiement/${p.reference}`, channels: ["app", "email", "sms"] });
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
    method: libelleMoyen(p.method), paidAt: p.paidAt ?? new Date(), escrow: p.escrow !== "aucun",
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

/** Frais de candidature dans la monnaie du payeur, plafonnés (réglable dans le back-office : 10 000 F CFA / 15 € par défaut). */
export async function fraisCandidature(feeMad: number, payer: Pick<User, "country">) {
  if (feeMad <= 0) return { montant: 0, devise: "MAD", plafonne: false, ecole: 0 };
  const devise = payer.country === "MA" ? "MAD" : devisePays(payer.country) ?? "EUR";
  const [taux, r] = await Promise.all([tauxDuJour(), reglages()]);
  const cfa = devise === "XAF" || devise === "XOF";
  const brut = devise === "MAD" ? feeMad : convertirDe(feeMad, "MAD", devise, taux) ?? feeMad;
  const plafond = cfa ? r.frais.plafondXaf : devise === "EUR" ? r.frais.plafondEur : convertirDe(r.frais.plafondEur, "EUR", devise, taux) ?? r.frais.plafondEur;
  const arrondi = (n: number) => (cfa ? Math.round(n / 50) * 50 : devise === "EUR" ? Math.round(n * 100) / 100 : Math.round(n));
  const montant = plafond > 0 ? Math.min(arrondi(brut), arrondi(plafond)) : arrondi(brut);
  return { montant, devise, plafonne: plafond > 0 && arrondi(brut) > arrondi(plafond), ecole: feeMad };
}

/** Espèces : l'administrateur confirme (ou refuse) la réception du paiement. */
export async function validerEspeces(admin: User, reference: string, i: { recu: boolean; numeroRecu?: string | null; montantRecu?: number | null; note?: string | null }) {
  if (admin.role !== "admin") throw forbidden();
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference));
  if (!p) throw notFound("Paiement");
  if (p.status !== "en_attente" || !["especes", "sandbox"].includes(p.provider)) throw new AppError("Ce paiement n'est pas en attente de validation.");
  await db.update(schema.payments).set({ meta: { ...(p.meta as object), validation: { par: admin.id, le: new Date().toISOString(), numeroRecu: i.numeroRecu ?? null, montantRecu: i.montantRecu ?? null, note: i.note ?? null } } }).where(eq(schema.payments.id, p.id));
  await audit(admin.id, i.recu ? "especes_recues" : "especes_refusees", "payment", p.id, { reference, numeroRecu: i.numeroRecu, montantRecu: i.montantRecu });
  return settlePayment(reference, i.recu);
}

/** Mobile money : renvoyer la demande de paiement sur le téléphone. */
export async function relancerMobile(viewer: User, reference: string) {
  const p = await getPayment(viewer, reference);
  if (p.provider !== "ebilling" || p.status !== "en_attente" || !p.providerRef) throw new AppError("Rien à relancer pour ce paiement.");
  const tel = (p.meta as { telephone?: string }).telephone;
  if (!tel) throw new AppError("Numéro de téléphone manquant.");
  await pousserUssd(p.providerRef, tel, p.method);
  return { ok: true };
}

/** Instructions de paiement en espèces (page de paiement). */
export async function instructionsEspeces() {
  const r = await reglages();
  return { instructions: r.especes.instructions, delaiJours: r.especes.delaiJours };
}

export async function referenceParFacture(billId: string) {
  const [p] = await db.select({ r: schema.payments.reference }).from(schema.payments).where(and(eq(schema.payments.providerRef, billId.slice(0, 100)), eq(schema.payments.provider, "ebilling")));
  return p?.r ?? null;
}
