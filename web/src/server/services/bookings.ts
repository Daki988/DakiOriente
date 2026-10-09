import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { nextNumber } from "../lib/counters";
import { AppError, forbidden, notFound } from "../lib/errors";
import { isMinor } from "./accounts";
import { assertConsentIfMinor, isGuardianOf } from "./guardians";
import { findOrCreateConversation } from "./messaging";
import { notify } from "./notifications";
import { initiatePayment, setEscrow } from "./payments";
import { leasePdf, rentReceiptPdf } from "./pdf";

type User = typeof schema.users.$inferSelect;
type Booking = typeof schema.bookings.$inferSelect;
type Status = (typeof schema.bookingStatusEnum.enumValues)[number];

export const SERVICE_FEE_RATE = 0.05; // frais de service Navilease, sur le premier loyer
export const BOOKING_LABEL: Record<Status, string> = {
  demande: "Demande envoyée", acceptee: "Acceptée par le bailleur", attente_garant: "En attente du garant", paiement_sequestre: "Paiement en séquestre", contrat_signe: "Contrat signé",
  entree: "Entrée dans les lieux", fonds_verses: "Fonds versés au bailleur", en_cours: "Location en cours", preavis: "Préavis", sortie: "Sortie (état des lieux)",
  caution_restituee: "Caution restituée", refusee: "Refusée", annulee: "Annulée", litige: "Litige",
};

async function event(b: Booking, status: Status, authorId: string | null, note?: string) {
  await db.update(schema.bookings).set({ status }).where(eq(schema.bookings.id, b.id));
  await db.insert(schema.bookingEvents).values({ bookingId: b.id, status, authorId, note: note ?? null });
}

async function load(id: string) {
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
  if (!b) throw notFound("Réservation");
  return b;
}

async function canView(user: User, b: Booking) {
  return user.role === "admin" || user.id === b.tenantId || user.id === b.landlordId || user.id === b.guarantorId || (user.role === "parent" && (await isGuardianOf(user.id, b.tenantId)));
}

export const requestSchema = z.object({
  housingId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'entrée invalide"),
  months: z.coerce.number().int().min(1).max(24),
  message: z.string().max(2000).optional(),
  documentIds: z.array(z.string()).max(10).default([]),
});

export async function requestBooking(tenant: User, raw: z.input<typeof requestSchema>) {
  if (!["eleve", "etudiant"].includes(tenant.role)) throw forbidden();
  const i = requestSchema.parse(raw);
  const [h] = await db.select().from(schema.housings).where(and(eq(schema.housings.id, i.housingId), eq(schema.housings.status, "publie")));
  if (!h) throw notFound("Logement");
  if (i.months < h.minMonths) throw new AppError(`Durée minimum : ${h.minMonths} mois.`);
  if (new Date(i.startDate) < new Date(new Date().toDateString())) throw new AppError("La date d'entrée est passée.");
  // Règle Navilease : les mineurs ne voient ni ne réservent les annonces de bailleurs non vérifiés.
  if (isMinor(tenant.birthYear) && h.verification === "non_verifie") throw new AppError("Ce logement n'est pas encore vérifié.");
  if (i.documentIds.length) {
    const owned = await db.select({ id: schema.documents.id }).from(schema.documents).where(and(eq(schema.documents.ownerId, tenant.id), inArray(schema.documents.id, i.documentIds)));
    if (owned.length !== new Set(i.documentIds).size) throw forbidden();
  }
  const open = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(and(eq(schema.bookings.tenantId, tenant.id), eq(schema.bookings.housingId, h.id), inArray(schema.bookings.status, ["demande", "acceptee", "attente_garant", "paiement_sequestre"])));
  if (open.length) throw new AppError("Vous avez déjà une demande en cours pour ce logement.");
  const number = await nextNumber("NL");
  const [b] = await db.insert(schema.bookings).values({
    number, housingId: h.id, tenantId: tenant.id, landlordId: h.landlordId, startDate: i.startDate, months: i.months, rent: h.rent, charges: h.charges, deposit: h.deposit,
    serviceFee: Math.round(h.rent * SERVICE_FEE_RATE), currency: h.currency, message: i.message ?? null, documentIds: i.documentIds,
  }).returning();
  await db.insert(schema.bookingEvents).values({ bookingId: b.id, status: "demande", authorId: tenant.id, note: i.message ?? null });
  const conv = await findOrCreateConversation(`Réservation ${number} · ${h.title}`, [tenant.id, h.landlordId], { kind: "booking", id: b.id });
  if (i.message) await db.insert(schema.messages).values({ conversationId: conv.id, authorId: tenant.id, body: (await import("./messaging")).maskContacts(i.message), masked: true });
  await notify(h.landlordId, { kind: "reservation_demande", title: `Nouvelle demande de réservation ${number}`, body: `${tenant.firstName} · entrée le ${i.startDate} · ${i.months} mois`, link: `/bailleur/reservations/${b.id}`, channels: ["app", "email", "sms"] });
  await audit(tenant.id, "reservation_demande", "booking", b.id);
  return b;
}

export async function respond(landlord: User, id: string, accept: boolean, note?: string) {
  const b = await load(id);
  if (b.landlordId !== landlord.id && landlord.role !== "admin") throw forbidden();
  if (b.status !== "demande") throw new AppError("Cette demande a déjà été traitée.");
  const [tenant] = await db.select().from(schema.users).where(eq(schema.users.id, b.tenantId));
  const next: Status = !accept ? "refusee" : isMinor(tenant.birthYear) && !b.guarantorApprovedAt ? "attente_garant" : "acceptee";
  await event(b, next, landlord.id, note);
  await notify(b.tenantId, { kind: "reservation_reponse", title: `Réservation ${b.number} : ${BOOKING_LABEL[next]}`, body: next === "attente_garant" ? "Votre parent ou tuteur doit se porter garant avant le paiement." : note, link: `/navilease/reservations/${b.id}`, channels: ["app", "email", "sms"] });
  if (next === "attente_garant") {
    const parents = await db.select({ p: schema.guardianships.parentId }).from(schema.guardianships).where(and(eq(schema.guardianships.childId, b.tenantId), eq(schema.guardianships.status, "actif")));
    for (const p of parents) if (p.p) await notify(p.p, { kind: "garant", title: `Validation requise : réservation ${b.number}`, body: `${tenant.firstName} a besoin de votre accord comme garant.`, link: `/navilease/reservations/${b.id}`, channels: ["app", "email", "sms"] });
  }
  return next;
}

/** Le parent/tuteur valide la réservation d'un mineur et se porte garant. */
export async function approveAsGuarantor(parent: User, id: string) {
  const b = await load(id);
  if (parent.role !== "parent" || !(await isGuardianOf(parent.id, b.tenantId))) throw forbidden();
  if (!["demande", "attente_garant", "acceptee"].includes(b.status)) throw new AppError("Étape déjà dépassée.");
  await db.update(schema.bookings).set({ guarantorId: parent.id, guarantorApprovedAt: new Date() }).where(eq(schema.bookings.id, id));
  if (b.status === "attente_garant") await event(b, "acceptee", parent.id, "Garant validé");
  await notify(b.tenantId, { kind: "garant", title: `Votre garant a validé la réservation ${b.number}`, link: `/navilease/reservations/${b.id}` });
  const conv = await findOrCreateConversation("", [parent.id], { kind: "booking", id: b.id });
  return conv.id;
}

/** Paiement du premier loyer + charges + caution + frais de service, conservé en séquestre. */
export async function payBooking(payer: User, id: string, method: string) {
  const b = await load(id);
  if (payer.id !== b.tenantId && payer.id !== b.guarantorId && !(payer.role === "parent" && (await isGuardianOf(payer.id, b.tenantId)))) throw forbidden();
  if (b.status !== "acceptee") throw new AppError(b.status === "attente_garant" ? "En attente de la validation du garant." : "Le bailleur doit d'abord accepter la demande.");
  const [tenant] = await db.select().from(schema.users).where(eq(schema.users.id, b.tenantId));
  await assertConsentIfMinor(tenant);
  const amount = b.rent + b.charges + b.deposit + b.serviceFee;
  return initiatePayment(payer, { kind: "reservation", amount, currency: b.currency, method, description: `Réservation ${b.number} (1er loyer, charges, caution, frais de service)`, bookingId: b.id, beneficiaryId: b.tenantId, escrow: true, meta: { rent: b.rent, charges: b.charges, deposit: b.deposit, serviceFee: b.serviceFee } });
}

/** Appelé quand un paiement lié à la réservation réussit. */
export async function onBookingPaid(bookingId: string, p: typeof schema.payments.$inferSelect) {
  const b = await load(bookingId);
  if (p.kind === "reservation" && b.status === "acceptee") {
    await event(b, "paiement_sequestre", p.payerId, `Paiement ${p.reference}`);
    await notify(b.landlordId, { kind: "reservation_payee", title: `Réservation ${b.number} payée (séquestre)`, body: "Signez le contrat de location pour finaliser.", link: `/bailleur/reservations/${b.id}`, channels: ["app", "email", "sms"] });
    await notify(b.tenantId, { kind: "contrat", title: `Contrat à signer · ${b.number}`, link: `/navilease/reservations/${b.id}` });
  }
}

export async function signContract(user: User, id: string) {
  const b = await load(id);
  if (user.id !== b.tenantId && user.id !== b.landlordId) throw forbidden();
  if (b.status !== "paiement_sequestre") throw new AppError("Le contrat se signe après le paiement en séquestre.");
  const now = new Date().toISOString();
  const c = { ...(b.contract ?? {}), ...(user.id === b.tenantId ? { tenantSignedAt: now } : { landlordSignedAt: now }) };
  await db.update(schema.bookings).set({ contract: c }).where(eq(schema.bookings.id, id));
  await audit(user.id, "signature_contrat", "booking", id);
  if (c.tenantSignedAt && c.landlordSignedAt) {
    await event({ ...b, contract: c }, "contrat_signe", user.id);
    for (const u of [b.tenantId, b.landlordId]) await notify(u, { kind: "contrat", title: `Contrat ${b.number} signé par les deux parties`, link: u === b.tenantId ? `/navilease/reservations/${b.id}` : `/bailleur/reservations/${b.id}` });
  }
  return c;
}

/** Entrée dans les lieux avec état des lieux : déclenche le versement au bailleur (hors caution). */
export async function checkIn(tenant: User, id: string, report: { photos: string[]; notes?: string }) {
  const b = await load(id);
  if (tenant.id !== b.tenantId) throw forbidden();
  if (b.status !== "contrat_signe") throw new AppError("L'entrée se déclare après la signature du contrat.");
  await db.update(schema.bookings).set({ checkIn: { at: new Date().toISOString(), photos: report.photos, notes: report.notes } }).where(eq(schema.bookings.id, id));
  await event(b, "entree", tenant.id, report.notes);
  await setEscrow(tenant.id, id, "libere");
  await event(b, "fonds_verses", null, `Loyer et charges versés au bailleur ; caution de ${b.deposit} ${b.currency} conservée jusqu'à la sortie.`);
  await event(b, "en_cours", null);
  await notify(b.landlordId, { kind: "fonds_verses", title: `Fonds versés · ${b.number}`, body: `Premier loyer versé. La caution reste en séquestre jusqu'à la sortie.`, link: `/bailleur/reservations/${b.id}` });
}

export async function payRent(payer: User, id: string, method: string, period: string) {
  const b = await load(id);
  if (payer.id !== b.tenantId && payer.id !== b.guarantorId && !(payer.role === "parent" && (await isGuardianOf(payer.id, b.tenantId)))) throw forbidden();
  if (!["en_cours", "preavis"].includes(b.status)) throw new AppError("Aucun loyer à payer pour cette réservation.");
  if (!/^\d{4}-\d{2}$/.test(period)) throw new AppError("Période invalide.");
  const paid = await db.select().from(schema.payments).where(and(eq(schema.payments.bookingId, id), eq(schema.payments.kind, "loyer"), eq(schema.payments.status, "reussi")));
  if (paid.some((p) => (p.meta as { period?: string }).period === period)) throw new AppError("Ce mois est déjà payé.");
  return initiatePayment(payer, { kind: "loyer", amount: b.rent + b.charges, currency: b.currency, method, description: `Loyer ${period} · ${b.number}`, bookingId: id, beneficiaryId: b.tenantId, meta: { period } });
}

export async function giveNotice(user: User, id: string, note?: string) {
  const b = await load(id);
  if (user.id !== b.tenantId && user.id !== b.landlordId) throw forbidden();
  if (b.status !== "en_cours") throw new AppError("Préavis impossible à ce stade.");
  await event(b, "preavis", user.id, note);
  await notify(user.id === b.tenantId ? b.landlordId : b.tenantId, { kind: "preavis", title: `Préavis donné · ${b.number}`, body: note, link: `/navilease/reservations/${b.id}` });
}

export async function checkOut(landlord: User, id: string, report: { photos: string[]; notes?: string; retenue?: number }) {
  const b = await load(id);
  if (landlord.id !== b.landlordId && landlord.role !== "admin") throw forbidden();
  if (!["en_cours", "preavis"].includes(b.status)) throw new AppError("Sortie impossible à ce stade.");
  const retenue = Math.max(0, Math.min(report.retenue ?? 0, b.deposit));
  await db.update(schema.bookings).set({ checkOut: { at: new Date().toISOString(), photos: report.photos, notes: report.notes, retenue } }).where(eq(schema.bookings.id, id));
  await event(b, "sortie", landlord.id, report.notes);
  await event(b, "caution_restituee", null, retenue ? `Caution restituée avec une retenue de ${retenue} ${b.currency}.` : "Caution restituée intégralement.");
  await notify(b.tenantId, { kind: "caution", title: `Caution restituée · ${b.number}`, body: retenue ? `Retenue : ${retenue} ${b.currency}. Vous pouvez la contester sous 15 jours.` : "Restitution intégrale.", link: `/navilease/reservations/${b.id}` });
}

export async function cancelBooking(user: User, id: string, reason?: string) {
  const b = await load(id);
  if (user.id !== b.tenantId && user.id !== b.landlordId && user.role !== "admin") throw forbidden();
  if (!["demande", "acceptee", "attente_garant", "paiement_sequestre"].includes(b.status)) throw new AppError("Annulation impossible après la signature du contrat : ouvrez un litige.");
  if (b.status === "paiement_sequestre") await setEscrow(user.id, id, "rembourse");
  await event(b, "annulee", user.id, reason);
  for (const u of [b.tenantId, b.landlordId].filter((u) => u !== user.id)) await notify(u, { kind: "annulation", title: `Réservation ${b.number} annulée`, body: reason, link: `/navilease/reservations/${b.id}` });
}

export async function openDispute(user: User, id: string, reason: string, description: string) {
  const b = await load(id);
  if (user.id !== b.tenantId && user.id !== b.landlordId && user.id !== b.guarantorId) throw forbidden();
  if (["demande", "refusee", "annulee"].includes(b.status)) throw new AppError("Rien à contester à ce stade.");
  const [d] = await db.insert(schema.disputes).values({ bookingId: id, openedById: user.id, reason, description }).returning();
  await db.update(schema.payments).set({ escrow: "litige" }).where(and(eq(schema.payments.bookingId, id), eq(schema.payments.escrow, "bloque")));
  await event(b, "litige", user.id, reason);
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "admin"));
  for (const a of admins) await notify(a.id, { kind: "litige", title: `Litige ouvert · ${b.number}`, body: reason, link: `/admin/navilease/litiges/${d.id}` });
  return d;
}

export async function resolveDispute(admin: User, disputeId: string, resolution: string, escrow?: "libere" | "rembourse", restore?: Status) {
  if (admin.role !== "admin") throw forbidden();
  const [d] = await db.update(schema.disputes).set({ status: "resolu", resolution }).where(eq(schema.disputes.id, disputeId)).returning();
  if (!d) throw notFound("Litige");
  if (escrow) {
    await db.update(schema.payments).set({ escrow: "bloque" }).where(and(eq(schema.payments.bookingId, d.bookingId), eq(schema.payments.escrow, "litige")));
    await setEscrow(admin.id, d.bookingId, escrow);
  }
  const b = await load(d.bookingId);
  await event(b, restore ?? (escrow === "rembourse" ? "annulee" : "en_cours"), admin.id, `Médiation : ${resolution}`);
  for (const u of [b.tenantId, b.landlordId]) await notify(u, { kind: "litige", title: `Litige résolu · ${b.number}`, body: resolution, link: `/navilease/reservations/${b.id}` });
}

export async function reviewHousing(tenant: User, id: string, rating: number, comment?: string) {
  const b = await load(id);
  if (tenant.id !== b.tenantId) throw forbidden();
  if (!["en_cours", "preavis", "sortie", "caution_restituee"].includes(b.status)) throw new AppError("Les avis sont réservés aux locataires ayant séjourné dans le logement.");
  if (rating < 1 || rating > 5) throw new AppError("Note entre 1 et 5.");
  const [r] = await db.insert(schema.reviews).values({ housingId: b.housingId, bookingId: b.id, authorId: tenant.id, rating, comment: comment?.slice(0, 2000) ?? null }).onConflictDoUpdate({ target: schema.reviews.bookingId, set: { rating, comment: comment ?? null } }).returning();
  return r;
}

export async function getBooking(viewer: User, id: string) {
  const b = await load(id);
  if (!(await canView(viewer, b))) throw forbidden();
  const [h] = await db.select().from(schema.housings).where(eq(schema.housings.id, b.housingId));
  const events = await db.select().from(schema.bookingEvents).where(eq(schema.bookingEvents.bookingId, id)).orderBy(schema.bookingEvents.createdAt);
  const pays = await db.select().from(schema.payments).where(eq(schema.payments.bookingId, id)).orderBy(desc(schema.payments.createdAt));
  const people = await db.select({ id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, email: schema.users.email, phone: schema.users.phone }).from(schema.users).where(inArray(schema.users.id, [b.tenantId, b.landlordId, ...(b.guarantorId ? [b.guarantorId] : [])]));
  // Coordonnées et adresse exacte révélées seulement après le paiement en séquestre.
  const revealed = !["demande", "acceptee", "attente_garant", "refusee", "annulee"].includes(b.status);
  const contact = (u?: (typeof people)[number]) => (u ? { ...u, email: revealed ? u.email : null, phone: revealed ? u.phone : null } : null);
  return {
    booking: b, events, payments: pays, revealed,
    housing: { ...h, address: revealed ? h.address : null },
    tenant: contact(people.find((p) => p.id === b.tenantId)), landlord: contact(people.find((p) => p.id === b.landlordId)), guarantor: contact(people.find((p) => p.id === b.guarantorId)),
  };
}

export async function listBookings(user: User) {
  const cond = user.role === "bailleur" ? eq(schema.bookings.landlordId, user.id)
    : user.role === "parent" ? or(eq(schema.bookings.guarantorId, user.id), inArray(schema.bookings.tenantId, (await db.select({ c: schema.guardianships.childId }).from(schema.guardianships).where(and(eq(schema.guardianships.parentId, user.id), eq(schema.guardianships.status, "actif")))).map((x) => x.c).concat(["-"])))
    : eq(schema.bookings.tenantId, user.id);
  return db.select({ b: schema.bookings, h: { id: schema.housings.id, title: schema.housings.title, ville: schema.housings.ville, quartier: schema.housings.quartier, photos: schema.housings.photos } })
    .from(schema.bookings).innerJoin(schema.housings, eq(schema.housings.id, schema.bookings.housingId)).where(cond).orderBy(desc(schema.bookings.updatedAt));
}

export async function contractPdf(viewer: User, id: string) {
  const d = await getBooking(viewer, id);
  if (!d.revealed) throw new AppError("Le contrat est disponible après le paiement en séquestre.");
  const b = d.booking;
  return leasePdf({
    number: b.number, landlord: `${d.landlord!.firstName} ${d.landlord!.lastName}`, tenant: `${d.tenant!.firstName} ${d.tenant!.lastName}`, guarantor: d.guarantor ? `${d.guarantor.firstName} ${d.guarantor.lastName}` : undefined,
    housing: d.housing.title, address: [d.housing.address, d.housing.quartier, d.housing.ville].filter(Boolean).join(", "), startDate: b.startDate, months: b.months,
    rent: b.rent, charges: b.charges, deposit: b.deposit, currency: b.currency, rules: d.housing.rules,
    signedTenant: b.contract?.tenantSignedAt ? new Date(b.contract.tenantSignedAt).toLocaleString("fr-FR") : undefined,
    signedLandlord: b.contract?.landlordSignedAt ? new Date(b.contract.landlordSignedAt).toLocaleString("fr-FR") : undefined,
  });
}

export async function rentReceipt(viewer: User, paymentReference: string) {
  const [p] = await db.select().from(schema.payments).where(and(eq(schema.payments.reference, paymentReference), eq(schema.payments.kind, "loyer"), eq(schema.payments.status, "reussi")));
  if (!p?.bookingId) throw notFound("Quittance");
  const d = await getBooking(viewer, p.bookingId);
  return rentReceiptPdf({ reference: p.reference, landlord: `${d.landlord!.firstName} ${d.landlord!.lastName}`, tenant: `${d.tenant!.firstName} ${d.tenant!.lastName}`, housing: d.housing.title, period: String((p.meta as { period?: string }).period), rent: d.booking.rent, charges: d.booking.charges, currency: d.booking.currency, paidAt: p.paidAt! });
}
