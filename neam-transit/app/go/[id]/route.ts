import { NextResponse, type NextRequest } from "next/server";
import { enregistrerContact, getTransitaire } from "@/lib/queries";
import { lienWhatsApp } from "@/lib/format";

/** Redirige vers WhatsApp ou l'appel téléphonique en enregistrant la mise en relation. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = getTransitaire(Number(id));
  if (!t || t.statut !== "verifie") return NextResponse.redirect(new URL("/transitaires", req.url));
  const canal = req.nextUrl.searchParams.get("canal") === "appel" ? "appel" : "whatsapp";
  enregistrerContact(t.id, canal);
  if (canal === "appel") return NextResponse.redirect(`tel:+${t.telephone}`);
  const message = (req.nextUrl.searchParams.get("m") ?? "Bonjour, je vous ai trouvé sur Neam Transit.").slice(0, 1200);
  return NextResponse.redirect(lienWhatsApp(t.whatsapp || t.telephone, message));
}
