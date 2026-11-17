import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";
import { getDocument } from "@/lib/queries";

/** Documents justificatifs : accessibles uniquement à l'administrateur. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "admin") return new NextResponse("Accès refusé", { status: 403 });
  const doc = getDocument(Number((await params).id));
  if (!doc) return new NextResponse("Introuvable", { status: 404 });
  const fichier = path.join(UPLOAD_DIR, path.basename(doc.fichier));
  const data = await fs.readFile(fichier).catch(() => null);
  if (!data) return new NextResponse("Fichier manquant", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": doc.mime,
      "content-disposition": `inline; filename="${encodeURIComponent(doc.nom_original)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
