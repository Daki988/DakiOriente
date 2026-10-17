import { NextResponse } from "next/server";
import { supabaseSession } from "@/lib/supabase";

/** Retour du lien « mot de passe oublié » : échange le code contre une session. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  if (code) {
    const sb = await supabaseSession();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/admin/connexion?lien=expire", url.origin));
}
