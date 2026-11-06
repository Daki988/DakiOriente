// Chiffrement des secrets stockés en base (clés d'API des passerelles de paiement) : AES-256-GCM.
// Clé : PAIEMENTS_CLE (.env du serveur, 64 caractères hexadécimaux), à défaut dérivée de DATABASE_URL.
import crypto from "node:crypto";

const cle = () => {
  const k = process.env.PAIEMENTS_CLE;
  if (k && /^[0-9a-f]{64}$/i.test(k)) return Buffer.from(k, "hex");
  return crypto.createHash("sha256").update(`navigoal-secrets|${process.env.DATABASE_URL ?? ""}`).digest();
};

export function chiffrer(clair: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", cle(), iv);
  const data = Buffer.concat([c.update(clair, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

export function dechiffrer(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    const [ver, iv, tag, data] = v.split(":");
    if (ver !== "v1") return null;
    const d = crypto.createDecipheriv("aes-256-gcm", cle(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch { return null; }
}

/** Quatre derniers caractères, pour afficher une clé masquée. */
export const fin = (s: string | null) => (s ? `…${s.slice(-4)}` : null);
