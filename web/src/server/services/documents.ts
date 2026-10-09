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
};

export async function uploadDocument(owner: User, type: DocType, file: { name: string; bytes: Uint8Array; label?: string }) {
  if (file.bytes.byteLength > MAX_SIZE) throw new AppError("Fichier trop volumineux (8 Mo maximum).");
  const mime = sniffMime(file.bytes);
  if (!mime || !ALLOWED_MIME.includes(mime)) throw new AppError("Format non accepté : PDF, JPG, PNG ou WebP uniquement.");
  const key = `documents/${owner.id}/${crypto.randomUUID()}`;
  await putFile(key, file.bytes, mime);
  const [d] = await db.insert(schema.documents).values({ ownerId: owner.id, type, label: file.label ?? null, fileName: file.name.slice(0, 160), mime, size: file.bytes.byteLength, storageKey: key }).returning();
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
