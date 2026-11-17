import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { lireDocument, pret } from "@/lib/stockage";
import { getDocument } from "@/lib/queries";

/** Documents justificatifs : accessibles uniquement à l'administrateur. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "admin") return new NextResponse("Accès refusé", { status: 403 });
  await pret();
  const doc = getDocument(Number((await params).id));
  if (!doc) return new NextResponse("Introuvable", { status: 404 });
  const data = await lireDocument(doc.fichier);
  if (!data) return new NextResponse("Fichier manquant", { status: 404 });
  return new NextResponse(new Blob([new Uint8Array(data)], { type: doc.mime }), {
    headers: {
      "content-type": doc.mime,
      "content-disposition": `inline; filename="${encodeURIComponent(doc.nom_original)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
