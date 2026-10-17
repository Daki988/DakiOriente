import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Faux tant que Supabase n'est pas configuré : le site tourne alors en mode démo (catalogue local). */
export const hasSupabase = Boolean(URL && ANON && SERVICE);
export const FILES_BUCKET = "print-files";

/** Client lié à la session de l'utilisateur connecté (back-office). Respecte les règles RLS. */
export async function supabaseSession() {
  const store = await cookies();
  return createServerClient(URL!, ANON!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // appelé depuis un Server Component : le middleware rafraîchit la session
        }
      },
    },
  });
}

/** Client « service » : contourne RLS. Serveur uniquement, jamais exposé au navigateur. */
export function supabaseService() {
  return createClient(URL!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } });
}
