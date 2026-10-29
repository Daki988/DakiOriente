import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { signalerErreur } from "../lib/alertes";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

/** En-tête Content-Disposition sans injection : nom ASCII épuré + nom complet encodé (RFC 5987). */
const disposition = (name: string, inline: boolean) => {
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\;\r\n]/g, "_").slice(0, 150) || "fichier";
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name.slice(0, 150)).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())}`;
};

export const file = (bytes: Uint8Array, type: string, name?: string, inline = true) =>
  new Response(bytes as BodyInit, { headers: { "Content-Type": type, "Cache-Control": "private, no-store", ...(name ? { "Content-Disposition": disposition(name, inline) } : {}) } });

export function errorResponse(e: unknown) {
  if (e instanceof AppError) return json({ error: { code: e.code, message: e.message } }, e.status);
  if (e instanceof ZodError) return json({ error: { code: "validation", message: e.issues[0]?.message ?? "Données invalides.", fields: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } }, 422);
  if (e instanceof SyntaxError) return json({ error: { code: "json", message: "Corps de requête invalide." } }, 400);
  if (e instanceof TypeError && /multipart\/form-data/.test(e.message)) return json({ error: { code: "fichier", message: "Fichier manquant : envoyez le formulaire en multipart/form-data." } }, 400);
  // Valeur refusée par PostgreSQL (enum, type, contrainte) : erreur de saisie, pas une panne.
  const pg = (e as { cause?: { code?: string }; code?: string })?.cause?.code ?? (e as { code?: string })?.code;
  if (typeof pg === "string" && /^(22|23)/.test(pg)) return json({ error: { code: pg === "23505" ? "doublon" : "validation", message: pg === "23505" ? "Cet élément existe déjà." : "Données invalides." } }, pg === "23505" ? 409 : 400);
  console.error(e);
  signalerErreur(e);
  return json({ error: { code: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." } }, 500);
}
