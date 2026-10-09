import { and, asc, avg, count, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { audit } from "../lib/audit";
import { AppError, forbidden, notFound } from "../lib/errors";
import { putFile, sniffMime, MAX_SIZE } from "../lib/storage";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;

export const AMENITIES = ["wifi", "eau", "electricite", "groupe_electrogene", "climatisation", "cuisine", "machine_a_laver", "gardiennage", "parking", "meuble", "bureau", "eau_chaude"] as const;
export const HOUSING_TYPES = ["studio", "chambre", "colocation", "appartement", "residence", "chez_habitant"] as const;
export const CURRENCY_BY_COUNTRY: Record<string, string> = { GA: "XAF", MA: "MAD", SN: "XOF" };

export const housingSchema = z.object({
  title: z.string().trim().min(5).max(120),
  type: z.enum(HOUSING_TYPES),
  description: z.string().trim().min(30, "Décrivez le logement (30 caractères minimum).").max(5000),
  pays: z.enum(["GA", "MA", "SN"]),
  ville: z.string().trim().min(2).max(80),
  quartier: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  rent: z.coerce.number().int().positive(),
  charges: z.coerce.number().int().min(0).default(0),
  deposit: z.coerce.number().int().min(0).default(0),
  surface: z.coerce.number().int().min(5).max(500).optional(),
  rooms: z.coerce.number().int().min(1).max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(20).default(1),
  gender: z.enum(["mixte", "filles", "garcons"]).default("mixte"),
  furnished: z.boolean().default(true),
  amenities: z.array(z.enum(AMENITIES)).default([]),
  rules: z.string().max(2000).optional(),
  minMonths: z.coerce.number().int().min(1).max(24).default(1),
  availableFrom: z.string().max(20).optional(),
  nearEstablishments: z.array(z.object({ id: z.string(), minutes: z.number().int().min(0).max(240), mode: z.enum(["pied", "transport", "voiture"]) })).max(10).default([]),
});

async function assertLandlord(user: User) {
  if (user.role !== "bailleur" && user.role !== "admin") throw forbidden();
}

async function ownHousing(user: User, id: string) {
  const [h] = await db.select().from(schema.housings).where(eq(schema.housings.id, id));
  if (!h) throw notFound("Logement");
  if (user.role !== "admin" && h.landlordId !== user.id) throw forbidden();
  return h;
}

/** Contrôles anti-fraude simples : prix anormal par rapport aux annonces publiées de la ville. */
async function priceAlert(pays: string, ville: string, rent: number) {
  const [r] = await db.select({ m: avg(schema.housings.rent), n: count() }).from(schema.housings).where(and(eq(schema.housings.pays, pays), ilike(schema.housings.ville, ville), eq(schema.housings.status, "publie")));
  const m = Number(r.m);
  if (r.n >= 5 && m && (rent < m * 0.35 || rent > m * 3)) return `Loyer atypique (moyenne locale ≈ ${Math.round(m)}).`;
  return null;
}

export async function saveHousing(user: User, raw: z.input<typeof housingSchema>, id?: string) {
  await assertLandlord(user);
  const i = housingSchema.parse(raw);
  const values = { ...i, currency: CURRENCY_BY_COUNTRY[i.pays] };
  if (id) {
    const h = await ownHousing(user, id);
    // Toute modification d'une annonce publiée repasse en modération.
    const status = h.status === "publie" || h.status === "refuse" ? "en_moderation" : h.status;
    const [u] = await db.update(schema.housings).set({ ...values, status }).where(eq(schema.housings.id, id)).returning();
    return u;
  }
  const [h] = await db.insert(schema.housings).values({ ...values, landlordId: user.id }).returning();
  await audit(user.id, "creation_annonce", "housing", h.id);
  return h;
}

export async function addHousingPhoto(user: User, id: string, file: { bytes: Uint8Array }) {
  const h = await ownHousing(user, id);
  if (h.photos.length >= 15) throw new AppError("15 photos maximum.");
  if (file.bytes.byteLength > MAX_SIZE) throw new AppError("Photo trop volumineuse (8 Mo maximum).");
  const mime = sniffMime(file.bytes);
  if (!mime?.startsWith("image/")) throw new AppError("Format d'image non accepté (JPG, PNG, WebP).");
  const key = `housings/${id}/${crypto.randomUUID()}`;
  await putFile(key, file.bytes, mime);
  await db.update(schema.housings).set({ photos: [...h.photos, key] }).where(eq(schema.housings.id, id));
  return key;
}

export async function removeHousingPhoto(user: User, id: string, key: string) {
  const h = await ownHousing(user, id);
  await db.update(schema.housings).set({ photos: h.photos.filter((p) => p !== key) }).where(eq(schema.housings.id, id));
}

export async function submitForModeration(user: User, id: string) {
  const h = await ownHousing(user, id);
  if (h.photos.length < 3) throw new AppError("Ajoutez au moins 3 photos réelles du logement.");
  const alert = await priceAlert(h.pays, h.ville, h.rent);
  await db.update(schema.housings).set({ status: "en_moderation", moderationNote: alert }).where(eq(schema.housings.id, id));
}

export async function archiveHousing(user: User, id: string) {
  await ownHousing(user, id);
  await db.update(schema.housings).set({ status: "archive" }).where(eq(schema.housings.id, id));
}

export async function moderateHousing(admin: User, id: string, decision: { approve: boolean; note?: string; verification?: (typeof schema.verificationEnum.enumValues)[number] }) {
  if (admin.role !== "admin") throw forbidden();
  const [h] = await db.update(schema.housings).set({ status: decision.approve ? "publie" : "refuse", moderationNote: decision.note ?? null, ...(decision.verification ? { verification: decision.verification } : {}) }).where(eq(schema.housings.id, id)).returning();
  if (!h) throw notFound("Logement");
  await audit(admin.id, decision.approve ? "annonce_publiee" : "annonce_refusee", "housing", id, { note: decision.note });
  await notify(h.landlordId, { kind: "moderation", title: decision.approve ? `Annonce publiée : ${h.title}` : `Annonce à corriger : ${h.title}`, body: decision.note, link: `/bailleur/annonces/${id}` });
  if (decision.approve) await matchAlerts(h);
  return h;
}

/** Recherche publique : seules les annonces publiées ; les mineurs ne voient pas les bailleurs non vérifiés. */
export async function searchHousings(f: { pays?: string; ville?: string; etablissement?: string; budgetMax?: number; type?: string; gender?: string; amenities?: string[]; verifiedOnly?: boolean; page?: number }) {
  const where = and(
    eq(schema.housings.status, "publie"),
    f.pays ? eq(schema.housings.pays, f.pays) : undefined,
    f.ville ? ilike(schema.housings.ville, `%${f.ville}%`) : undefined,
    f.budgetMax ? lte(schema.housings.rent, f.budgetMax) : undefined,
    f.type ? eq(schema.housings.type, f.type) : undefined,
    f.gender && f.gender !== "mixte" ? or(eq(schema.housings.gender, f.gender), eq(schema.housings.gender, "mixte")) : undefined,
    f.amenities?.length ? sql`${schema.housings.amenities} @> ${JSON.stringify(f.amenities)}::jsonb` : undefined,
    f.etablissement ? sql`${schema.housings.nearEstablishments} @> ${JSON.stringify([{ id: f.etablissement }])}::jsonb` : undefined,
    f.verifiedOnly ? inArray(schema.housings.verification, ["identite", "visite", "partenaire"]) : undefined,
  );
  const page = Math.max(1, f.page ?? 1);
  const rows = await db.select().from(schema.housings).where(where)
    .orderBy(desc(sql`case ${schema.housings.verification} when 'partenaire' then 3 when 'visite' then 2 when 'identite' then 1 else 0 end`), asc(schema.housings.rent)).limit(24).offset((page - 1) * 24);
  const ratings = rows.length ? await db.select({ h: schema.reviews.housingId, r: avg(schema.reviews.rating), n: count() }).from(schema.reviews).where(and(inArray(schema.reviews.housingId, rows.map((r) => r.id)), eq(schema.reviews.published, true))).groupBy(schema.reviews.housingId) : [];
  return rows.map(({ address: _a, lat, lng, ...h }) => ({ ...h, lat: lat ? Math.round(lat * 200) / 200 : null, lng: lng ? Math.round(lng * 200) / 200 : null, rating: Number(ratings.find((x) => x.h === h.id)?.r ?? 0) || null, reviews: ratings.find((x) => x.h === h.id)?.n ?? 0 }));
}

/** Fiche publique : adresse exacte masquée (position arrondie ~500 m) ; bailleur sans coordonnées. */
export async function getHousingPublic(id: string) {
  const [row] = await db.select({ h: schema.housings, l: { firstName: schema.users.firstName, kycStatus: schema.landlords.kycStatus, partner: schema.landlords.partner, kind: schema.landlords.kind, company: schema.landlords.company, since: schema.users.createdAt } })
    .from(schema.housings).innerJoin(schema.users, eq(schema.users.id, schema.housings.landlordId)).leftJoin(schema.landlords, eq(schema.landlords.userId, schema.housings.landlordId))
    .where(and(eq(schema.housings.id, id), eq(schema.housings.status, "publie")));
  if (!row) throw notFound("Logement");
  const rv = await db.select({ r: schema.reviews, a: { firstName: schema.users.firstName } }).from(schema.reviews).innerJoin(schema.users, eq(schema.users.id, schema.reviews.authorId)).where(and(eq(schema.reviews.housingId, id), eq(schema.reviews.published, true))).orderBy(desc(schema.reviews.createdAt));
  const { address: _a, lat, lng, ...h } = row.h;
  return { housing: { ...h, lat: lat ? Math.round(lat * 200) / 200 : null, lng: lng ? Math.round(lng * 200) / 200 : null }, landlord: row.l, reviews: rv };
}

export const myHousings = (landlordId: string) => db.select().from(schema.housings).where(eq(schema.housings.landlordId, landlordId)).orderBy(desc(schema.housings.updatedAt));
export const getOwnHousing = ownHousing;

// ---------------------------------------------------------------- KYC bailleur
export async function submitKyc(user: User, documentIds: string[], payout?: { method: string; account: string }) {
  if (user.role !== "bailleur") throw forbidden();
  const docs = await db.select().from(schema.documents).where(and(eq(schema.documents.ownerId, user.id), inArray(schema.documents.id, documentIds)));
  const types = new Set(docs.map((d) => d.type));
  if (!types.has("kyc_identite") || !types.has("kyc_propriete")) throw new AppError("Joignez une pièce d'identité et un titre de propriété ou un mandat de gestion.");
  await db.update(schema.landlords).set({ kycStatus: "en_revue", kycDocumentIds: documentIds, payoutMethod: payout?.method, payoutAccount: payout?.account }).where(eq(schema.landlords.userId, user.id));
}

export async function reviewKyc(admin: User, landlordId: string, ok: boolean, note?: string) {
  if (admin.role !== "admin") throw forbidden();
  await db.update(schema.landlords).set({ kycStatus: ok ? "valide" : "refuse", kycNote: note ?? null }).where(eq(schema.landlords.userId, landlordId));
  // Une identité validée fait passer les annonces non vérifiées au niveau « identité vérifiée ».
  if (ok) await db.update(schema.housings).set({ verification: "identite" }).where(and(eq(schema.housings.landlordId, landlordId), eq(schema.housings.verification, "non_verifie")));
  await audit(admin.id, ok ? "kyc_valide" : "kyc_refuse", "landlord", landlordId, { note });
  await notify(landlordId, { kind: "kyc", title: ok ? "Votre identité est vérifiée" : "Vérification d'identité refusée", body: note, link: "/bailleur/profil" });
}

// ---------------------------------------------------------------- Alertes
export async function createAlert(user: User, criteria: { pays?: string; ville?: string; etablissement?: string; budgetMax?: number; type?: string }) {
  const [a] = await db.insert(schema.housingAlerts).values({ userId: user.id, criteria }).returning();
  return a;
}

async function matchAlerts(h: typeof schema.housings.$inferSelect) {
  const alerts = await db.select().from(schema.housingAlerts).where(eq(schema.housingAlerts.active, true));
  for (const a of alerts) {
    const c = a.criteria;
    const ok = (!c.pays || c.pays === h.pays) && (!c.ville || h.ville.toLowerCase().includes(c.ville.toLowerCase())) && (!c.budgetMax || h.rent <= c.budgetMax) && (!c.type || c.type === h.type) && (!c.etablissement || h.nearEstablishments.some((n) => n.id === c.etablissement));
    if (ok) await notify(a.userId, { kind: "alerte_logement", title: `Nouveau logement : ${h.title}`, body: `${h.ville} · ${h.rent} ${h.currency}/mois`, link: `/navilease/logements/${h.id}` });
  }
}

export const listAlerts = (userId: string) => db.select().from(schema.housingAlerts).where(eq(schema.housingAlerts.userId, userId));
export const deleteAlert = (userId: string, id: string) => db.delete(schema.housingAlerts).where(and(eq(schema.housingAlerts.id, id), eq(schema.housingAlerts.userId, userId)));
