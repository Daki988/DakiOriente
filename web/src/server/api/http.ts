import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

export const file = (bytes: Uint8Array, type: string, name?: string, inline = true) =>
  new Response(bytes as BodyInit, { headers: { "Content-Type": type, "Cache-Control": "private, no-store", ...(name ? { "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"` } : {}) } });

export function errorResponse(e: unknown) {
  if (e instanceof AppError) return json({ error: { code: e.code, message: e.message } }, e.status);
  if (e instanceof ZodError) return json({ error: { code: "validation", message: e.issues[0]?.message ?? "Données invalides.", fields: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } }, 422);
  if (e instanceof SyntaxError) return json({ error: { code: "json", message: "Corps de requête invalide." } }, 400);
  console.error(e);
  return json({ error: { code: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." } }, 500);
}
