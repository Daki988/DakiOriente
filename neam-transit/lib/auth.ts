import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

/** Sessions sans état : cookie signé HMAC-SHA256 (rôle + identifiant + expiration). */

type Session = { role: "admin"; exp: number } | { role: "pro"; id: number; exp: number };
const COOKIE = "neam_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (32 caractères minimum) doit être défini en production.");
  return "dev-only-secret-ne-pas-utiliser-en-production-0000";
}

const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export async function ouvrirSession(s: { role: "admin" } | { role: "pro"; id: number }, heures: number) {
  const payload: Session = { ...s, exp: Date.now() + heures * 3600_000 } as Session;
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: heures * 3600,
  });
}

export async function fermerSession() {
  (await cookies()).delete(COOKIE);
}

export async function exigerAdmin() {
  const s = await getSession();
  if (s?.role !== "admin") redirect("/admin/connexion");
}

export async function exigerPro(): Promise<number> {
  const s = await getSession();
  if (s?.role !== "pro") redirect("/pro/connexion");
  return s.id;
}

export function verifierMotDePasseAdmin(saisi: string): boolean {
  let attendu = process.env.ADMIN_PASSWORD;
  if (!attendu) {
    if (process.env.NODE_ENV === "production") return false;
    attendu = "admin"; // développement uniquement
  }
  const a = crypto.createHash("sha256").update(saisi).digest();
  const b = crypto.createHash("sha256").update(attendu).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ───────── Codes de connexion à usage unique (OTP) pour les transitaires ───────── */

const hash = (code: string) => crypto.createHash("sha256").update(code + secret()).digest("hex");

export type EnvoiOtp = { ok: true; codeDev?: string } | { ok: false; erreur: string };

export async function envoyerOtp(telephone: string): Promise<EnvoiOtp> {
  const db = getDb();
  const prev = db.prepare("SELECT envoye_at FROM otp WHERE telephone = ?").get(telephone) as { envoye_at: number } | undefined;
  if (prev && Date.now() - prev.envoye_at < 60_000) return { ok: false, erreur: "Un code vient d'être envoyé. Patientez une minute avant d'en demander un autre." };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(
    "INSERT INTO otp (telephone, code_hash, expires_at, tentatives, envoye_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(telephone) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, tentatives = 0, envoye_at = excluded.envoye_at",
  ).run(telephone, hash(code), Date.now() + 10 * 60_000, Date.now());

  const message = `Neam Transit : votre code de connexion est ${code}. Il expire dans 10 minutes. Ne le communiquez à personne.`;
  const url = process.env.OTP_WEBHOOK_URL;
  if (url) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...(process.env.OTP_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify({ to: telephone, message }),
      });
      if (!r.ok) return { ok: false, erreur: "L'envoi du code a échoué. Réessayez plus tard." };
      return { ok: true };
    } catch {
      return { ok: false, erreur: "L'envoi du code a échoué. Réessayez plus tard." };
    }
  }
  console.info(`[OTP] ${telephone} → ${code}`);
  if (process.env.NODE_ENV === "production") return { ok: true };
  return { ok: true, codeDev: code };
}

export function verifierOtp(telephone: string, code: string): boolean {
  const db = getDb();
  const r = db.prepare("SELECT * FROM otp WHERE telephone = ?").get(telephone) as
    | { code_hash: string; expires_at: number; tentatives: number }
    | undefined;
  if (!r || r.expires_at < Date.now() || r.tentatives >= 5) return false;
  if (r.code_hash !== hash(code.trim())) {
    db.prepare("UPDATE otp SET tentatives = tentatives + 1 WHERE telephone = ?").run(telephone);
    return false;
  }
  db.prepare("DELETE FROM otp WHERE telephone = ?").run(telephone);
  return true;
}
