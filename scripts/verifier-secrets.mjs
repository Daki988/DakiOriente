// Cherche des secrets dans les fichiers suivis par Git (clés d'API, clés privées, mots de passe dans une adresse de base,
// fichiers .env). Échoue (code 1) si l'un d'eux est trouvé. Usage : node scripts/verifier-secrets.mjs
// Les valeurs ne sont jamais affichées : seulement le fichier, la ligne et le type de secret.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const MOTIFS = [
  ["clé Anthropic", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["clé Stripe", /\b(?:sk|rk)_live_[A-Za-z0-9]{10,}/],
  ["secret de webhook Stripe", /\bwhsec_[A-Za-z0-9]{20,}/],
  ["clé privée", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["clé AWS", /\bAKIA[0-9A-Z]{16}\b/],
  ["jeton GitHub", /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ["jeton Slack", /\bxox[abpr]-[A-Za-z0-9-]{10,}/],
  ["clé Google", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["mot de passe dans une adresse de base", /postgres(?:ql)?:\/\/[^:\s/@]+:(?!MOT_DE_PASSE|postgres@|pg@|\$\{|\*+|password@|motdepasse)[^@\s'"`]{6,}@/i],
];
const fichiers = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const trouves = [];
for (const f of fichiers) {
  if (/(^|\/)\.env(\.[\w-]+)?$/.test(f) && !/\.example$/.test(f)) { trouves.push(`${f} : fichier .env suivi par Git`); continue; }
  if (/\.(png|jpe?g|webp|gif|pdf|zip|ico|woff2?|ttf|bin|mp4|lock)$/i.test(f) || f.endsWith("package-lock.json")) continue;
  let texte; try { texte = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (texte.length > 5_000_000) continue;
  texte.split("\n").forEach((l, i) => { for (const [nom, re] of MOTIFS) if (re.test(l)) trouves.push(`${f}:${i + 1} : ${nom}`); });
}
if (trouves.length) { console.error(`Secrets possibles (${trouves.length}) :\n` + trouves.map((t) => `  ✗ ${t}`).join("\n")); process.exit(1); }
console.log(`Aucun secret trouvé dans ${fichiers.length} fichiers suivis.`);
