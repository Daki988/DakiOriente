// Vérification de la signature des notifications Stripe (en-tête Stripe-Signature : t=…,v1=…).
import crypto from "node:crypto";
import { reglages } from "../services/reglages-paiement";

type EvenementStripe = { type?: string; data?: { object?: { client_reference_id?: string; metadata?: { reference?: string } } } };

export async function verifierStripe(raw: string, entete: string | null): Promise<EvenementStripe | null> {
  const secret = (await reglages()).stripe.webhookSecret;
  if (!secret || !entete) return null;
  const parts = Object.fromEntries(entete.split(",").map((x) => x.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 600) return null; // rejeu au-delà de 10 minutes
  const attendu = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const signes = entete.split(",").filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  const ok = signes.some((v) => v.length === attendu.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(attendu)));
  if (!ok) return null;
  try { return JSON.parse(raw) as EvenementStripe; } catch { return null; }
}
