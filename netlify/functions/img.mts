// Sert les photos produits envoyées depuis le back-office.
import type { Config, Context } from "@netlify/functions";
import { store } from "../lib/common.mts";

export default async (req: Request, context: Context) => {
  const key = context.params.key || "";
  if (!/^[a-z0-9-]{6,80}\.(jpg|png|webp)$/.test(key)) return new Response("Introuvable", { status: 404 });
  const r = await store("images").getWithMetadata(key, { type: "arrayBuffer" });
  if (!r) return new Response("Introuvable", { status: 404 });
  return new Response(r.data as ArrayBuffer, {
    headers: {
      "content-type": String(r.metadata?.type || "image/jpeg"),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = { path: "/img/:key", method: "GET" };
