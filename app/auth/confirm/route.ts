import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseSession } from "@/lib/supabase";

/** Lien à usage unique (première connexion, mot de passe oublié) : ouvre la session puis fait choisir le mot de passe. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "recovery") as EmailOtpType;
  if (token_hash) {
    const sb = await supabaseSession();
    const { error } = await sb.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL("/admin/mot-de-passe", url.origin));
  }
  return NextResponse.redirect(new URL("/admin/connexion?lien=expire", url.origin));
}
