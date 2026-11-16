// Pays d'une adresse IP, à partir d'une base locale (DB-IP Lite, CC BY 4.0) : l'adresse n'est envoyée à aucun tiers.
// Fichier construit par scripts/build_geoip.py (data/geoip/pays-ip.bin).
import fs from "node:fs";
import path from "node:path";

type Base = { v4: Uint32Array; i4: Uint8Array; v6hi: Uint32Array; v6lo: Uint32Array; i6: Uint8Array; codes: string[] };
let base: Base | null | undefined;

function charger(): Base | null {
  const candidats = [path.join(process.cwd(), "..", "data", "geoip", "pays-ip.bin"), path.join(process.cwd(), "data", "geoip", "pays-ip.bin")];
  const f = candidats.find((c) => fs.existsSync(c));
  if (!f) return null;
  const b = fs.readFileSync(f);
  if (b.subarray(0, 5).toString() !== "NGIP1") return null;
  let o = 5;
  const n4 = b.readUInt32BE(o), n6 = b.readUInt32BE(o + 4), nc = b.readUInt16BE(o + 8); o += 10;
  const codes = Array.from({ length: nc }, (_, k) => b.subarray(o + 2 * k, o + 2 * k + 2).toString()); o += 2 * nc;
  const v4 = new Uint32Array(n4); for (let k = 0; k < n4; k++) v4[k] = b.readUInt32BE(o + 4 * k); o += 4 * n4;
  const i4 = new Uint8Array(b.subarray(o, o + n4)); o += n4;
  const v6hi = new Uint32Array(n6), v6lo = new Uint32Array(n6);
  for (let k = 0; k < n6; k++) { v6hi[k] = b.readUInt32BE(o + 8 * k); v6lo[k] = b.readUInt32BE(o + 8 * k + 4); } o += 8 * n6;
  const i6 = new Uint8Array(b.subarray(o, o + n6));
  return { v4, i4, v6hi, v6lo, i6, codes };
}

/** Dernière plage dont le début est ≤ à la valeur (recherche dichotomique). */
function cherche(n: number, inf: (k: number) => boolean) {
  let lo = 0, hi = n - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (inf(m)) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}

export function paysDeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  if (base === undefined) { try { base = charger(); } catch { base = null; } }
  if (!base) return null;
  const B = base;
  const v4 = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  let k = -1, code: string | undefined;
  if (v4) {
    const n = ((+v4[1] << 24) >>> 0) + (+v4[2] << 16) + (+v4[3] << 8) + +v4[4];
    k = cherche(B.v4.length, (m) => B.v4[m] <= n);
    code = k >= 0 ? B.codes[B.i4[k]] : undefined;
  } else if (ip.includes(":")) {
    const groupes = developper(ip.trim());
    if (!groupes) return null;
    const hi = ((groupes[0] << 16) | groupes[1]) >>> 0, lo = ((groupes[2] << 16) | groupes[3]) >>> 0;
    k = cherche(B.v6hi.length, (m) => B.v6hi[m] < hi || (B.v6hi[m] === hi && B.v6lo[m] <= lo));
    code = k >= 0 ? B.codes[B.i6[k]] : undefined;
  }
  return code && code !== "ZZ" ? code : null;
}

function developper(ip: string): number[] | null {
  const [a, b] = ip.split("::");
  const g = (s: string) => (s ? s.split(":").map((x) => parseInt(x, 16)) : []);
  const debut = g(a), fin = b !== undefined ? g(b) : [];
  const tout = b !== undefined ? [...debut, ...Array(8 - debut.length - fin.length).fill(0), ...fin] : debut;
  return tout.length === 8 && tout.every((x) => Number.isFinite(x) && x >= 0 && x <= 0xffff) ? tout : null;
}

/** Adresse privée, locale ou réservée : celle d'un relais de l'hébergeur (Varnish, Apache), jamais celle d'un visiteur. */
function privee(ip: string) {
  const s = ip.replace(/^::ffff:/i, "").toLowerCase();
  const v4 = /^(\d{1,3})\.(\d{1,3})\./.exec(s);
  if (v4) {
    const [a, b] = [+v4[1], +v4[2]];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return s === "::1" || s === "::" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe80");
}

/**
 * Adresse IP du visiteur, non falsifiable : dans X-Forwarded-For, chaque relais ajoute à DROITE l'adresse qui s'est
 * connectée à lui ; le visiteur ne maîtrise que la partie gauche. On retient donc l'adresse publique la plus à droite.
 */
export function ipClient(h: Headers): string {
  const chaine = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (let k = chaine.length - 1; k >= 0; k--) if (!privee(chaine[k])) return chaine[k];
  const reel = h.get("x-real-ip")?.trim();
  return reel && !privee(reel) ? reel : chaine[0] || reel || "";
}
