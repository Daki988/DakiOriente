// Lecture serveur du profil bailleur (statut KYC, versements) : aucune route API ne l'expose.
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSessionUser } from "@/server/session-ui";

export type LandlordInfo = { kycStatus: string; kycNote: string | null; payoutMethod: string | null; payoutAccount: string | null; partner: boolean; kind: string; company: string | null; kycDocs: number };

export async function getLandlordInfo(): Promise<LandlordInfo | null> {
  const u = await getSessionUser();
  if (!u) return null;
  try {
    const [l] = await db.select().from(schema.landlords).where(eq(schema.landlords.userId, u.id));
    if (!l) return null;
    const acct = l.payoutAccount ? l.payoutAccount.replace(/.(?=.{4})/g, "•") : null; // masqué côté client
    return { kycStatus: l.kycStatus, kycNote: l.kycNote, payoutMethod: l.payoutMethod, payoutAccount: acct, partner: l.partner, kind: l.kind, company: l.company, kycDocs: l.kycDocumentIds.length };
  } catch {
    return null;
  }
}
