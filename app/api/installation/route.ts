import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPER_ADMIN = "daki.liaison@gmail.com";

function allowed(given: string | null) {
  const expected = process.env.SETUP_TOKEN ?? "";
  if (expected.length < 24 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Installation en une fois, quand Supabase est créé depuis Vercel :
 * crée les tables et le catalogue, puis le compte super administrateur sans mot de passe.
 * Renvoie un lien à usage unique pour qu'il choisisse lui-même son mot de passe.
 * Protégé par SETUP_TOKEN (variable Vercel, à supprimer ensuite). Relançable sans risque.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!allowed(url.searchParams.get("cle"))) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const dbUrl = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "POSTGRES_URL absente : Supabase n'est pas relié au projet Vercel" }, { status: 500 });

  const steps: string[] = [];
  const sql = postgres(dbUrl, { ssl: "require", max: 1, prepare: false, onnotice: () => {} });
  try {
    for (const file of ["schema.sql", "seed.sql"]) {
      const text = await readFile(path.join(process.cwd(), "supabase", file), "utf8");
      await sql.unsafe(text);
      steps.push(`${file} appliqué`);
    }
    const [{ n }] = await sql`select count(*)::int as n from public.products`;
    steps.push(`${n} produits en base`);
  } catch (e) {
    return NextResponse.json({ error: `Base : ${(e as Error).message}`, steps }, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }

  const sb = supabaseService();
  const { data: list, error: listError } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return NextResponse.json({ error: `Comptes : ${listError.message}`, steps }, { status: 500 });
  if (!list.users.some((u) => u.email?.toLowerCase() === SUPER_ADMIN)) {
    const { error } = await sb.auth.admin.createUser({ email: SUPER_ADMIN, email_confirm: true });
    if (error) return NextResponse.json({ error: `Création du compte : ${error.message}`, steps }, { status: 500 });
    steps.push("compte super administrateur créé");
  } else steps.push("compte super administrateur déjà présent");

  const { data: link, error: linkError } = await sb.auth.admin.generateLink({ type: "recovery", email: SUPER_ADMIN });
  if (linkError) return NextResponse.json({ error: `Lien : ${linkError.message}`, steps }, { status: 500 });
  const lien = `${url.origin}/auth/confirm?type=recovery&token_hash=${encodeURIComponent(link.properties.hashed_token)}`;

  return NextResponse.json({ ok: true, steps, lien_mot_de_passe: lien, valable: "1 heure, une seule fois" });
}
