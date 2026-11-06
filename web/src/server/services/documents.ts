import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { ALLOWED_MIME, MAX_SIZE, deleteFile, getFile, putFile, sniffMime } from "../lib/storage";
import { isGuardianOf } from "./guardians";

type User = typeof schema.users.$inferSelect;
type DocType = (typeof schema.documentTypeEnum.enumValues)[number];

export const DOC_LABEL: Record<DocType, string> = {
  identite: "Pièce d'identité", acte_naissance: "Acte de naissance", diplome: "Diplôme (bac ou équivalent)", releve_notes: "Relevés de notes", certificat: "Certificat",
  photo: "Photo d'identité", attestation_admission: "Attestation d'admission", attestation_scolarite: "Attestation de scolarité", piece_garant: "Pièce d'identité du garant",
  justificatif_ressources: "Justificatif de ressources", kyc_identite: "Pièce d'identité (bailleur)", kyc_propriete: "Titre de propriété ou mandat", autre: "Autre document",
  fiche_candidature: "Fiche de candidature de l'école", releve_bac: "Relevé de notes du bac", cv: "CV", lettre_motivation: "Lettre de motivation",
  prise_en_charge: "Engagement de prise en charge (parent ou tuteur)", equivalence_bac: "Équivalence du bac", certificat_medical: "Certificat médical", test_langue: "Test de langue (TOEFL, DELF…)",
};
const SCOPE = /^(etab:[\w-]{1,80}|piece:[\w-]{1,80}:[a-z0-9-]{1,40})$/;

/** Plusieurs photos (pages d'une fiche, recto-verso…) réunies en un seul PDF. */
export async function imagesEnPdf(pages: Uint8Array[]) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const b of pages) {
    const mime = sniffMime(b);
    if (mime !== "image/jpeg" && mime !== "image/png") throw new AppError("Pour réunir plusieurs pages, envoie des photos JPG ou PNG.");
    const img = mime === "image/jpeg" ? await pdf.embedJpg(b) : await pdf.embedPng(b);
    const w = 595, h = 842, k = Math.min(w / img.width, h / img.height);
    const page = pdf.addPage([w, h]);
    page.drawImage(img, { x: (w - img.width * k) / 2, y: (h - img.height * k) / 2, width: img.width * k, height: img.height * k });
  }
  return new Uint8Array(await pdf.save());
}

export async function uploadDocument(owner: User, type: DocType, file: { name: string; bytes: Uint8Array; label?: string; scope?: string | null }) {
  if (!(schema.documentTypeEnum.enumValues as readonly string[]).includes(type)) type = "autre";
  if (file.scope && !SCOPE.test(file.scope)) throw new AppError("Rattachement invalide.");
  if (file.bytes.byteLength > MAX_SIZE) throw new AppError("Fichier trop volumineux (8 Mo maximum).");
  const mime = sniffMime(file.bytes);
  if (!mime || !ALLOWED_MIME.includes(mime)) throw new AppError("Format non accepté : PDF, JPG, PNG ou WebP uniquement.");
  const key = `documents/${owner.id}/${crypto.randomUUID()}`;
  await putFile(key, file.bytes, mime);
  const [d] = await db.insert(schema.documents).values({ ownerId: owner.id, type, label: file.label?.slice(0, 160) ?? null, scope: file.scope ?? null, fileName: file.name.slice(0, 160), mime, size: file.bytes.byteLength, storageKey: key }).returning();
  return d;
}

export const listDocuments = (ownerId: string) => db.select().from(schema.documents).where(eq(schema.documents.ownerId, ownerId)).orderBy(desc(schema.documents.createdAt));

/** Accès : propriétaire, parent lié, établissement destinataire d'une candidature qui le contient, bailleur d'une réservation, admin. */
export async function readDocument(viewer: User, id: string) {
  const [d] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
  if (!d) throw notFound("Document");
  let ok = viewer.id === d.ownerId || viewer.role === "admin" || (viewer.role === "parent" && (await isGuardianOf(viewer.id, d.ownerId)));
  if (!ok && viewer.role === "etablissement") {
    const etabs = (await db.select({ e: schema.establishmentMembers.establishmentId }).from(schema.establishmentMembers).where(eq(schema.establishmentMembers.userId, viewer.id))).map((x) => x.e);
    if (etabs.length) {
      const apps = await db.select({ ids: schema.applications.documentIds }).from(schema.applications).where(and(eq(schema.applications.studentId, d.ownerId), inArray(schema.applications.establishmentId, etabs)));
      ok = apps.some((a) => a.ids.includes(d.id));
    }
  }
  if (!ok && viewer.role === "bailleur") {
    const bs = await db.select({ ids: schema.bookings.documentIds }).from(schema.bookings).where(and(eq(schema.bookings.landlordId, viewer.id), eq(schema.bookings.tenantId, d.ownerId)));
    ok = bs.some((b) => b.ids.includes(d.id));
  }
  if (!ok) throw forbidden();
  const f = await getFile(d.storageKey);
  if (!f) throw notFound("Fichier");
  return { doc: d, ...f };
}

export async function removeDocument(owner: User, id: string) {
  const [d] = await db.select().from(schema.documents).where(and(eq(schema.documents.id, id), eq(schema.documents.ownerId, owner.id)));
  if (!d) throw notFound("Document");
  const used = await db.select({ id: schema.applications.id, ids: schema.applications.documentIds, st: schema.applications.status }).from(schema.applications).where(eq(schema.applications.studentId, owner.id));
  if (used.some((a) => a.st !== "brouillon" && a.ids.includes(id))) throw new AppError("Ce document est joint à une candidature envoyée : il ne peut pas être supprimé.");
  await deleteFile(d.storageKey);
  await db.delete(schema.documents).where(eq(schema.documents.id, id));
}
