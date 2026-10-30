import { NextResponse } from "next/server";
import { tauxDuJour } from "@/server/lib/taux";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await tauxDuJour(), { headers: { "Cache-Control": "public, max-age=3600" } });
}
