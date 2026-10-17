import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { createOrder, validateOrderInput } from "@/lib/orders";
import { hasSupabase } from "@/lib/supabase";

// Limite simple contre les envois en rafale (par instance serveur).
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

export async function POST(req: Request) {
  if (!hasSupabase) {
    return NextResponse.json({ error: "Commande en ligne pas encore activée.", fallback: "whatsapp" }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooMany(ip)) return NextResponse.json({ error: "Trop de commandes envoyées. Réessayez dans quelques minutes." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ error: "Requête refusée." }, { status: 400 }); // champ piège anti-robots

  const input = validateOrderInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  const product = await getProduct(input.value.slug);
  if (!product) return NextResponse.json({ error: "Ce produit n’est plus disponible." }, { status: 404 });

  const res = await createOrder(product, input.value);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json(res, { status: 201 });
}
