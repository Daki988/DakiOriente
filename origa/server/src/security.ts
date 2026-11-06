import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/curves/abstract/utils';

// --- Jetons d'accès (JWT HS256) ---
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export interface Claims {
  sub: number;
  role: string;
  name: string;
  farmId?: string | null;
  farmIds?: string[];
  operatorId?: string | null;
  exp: number;
}

export function signToken(claims: Omit<Claims, 'exp'>, secret: string, ttlSeconds: number): string {
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

export function verifyToken(token: string, secret: string): Claims | null {
  const [head, body, sig] = token.split('.');
  if (!head || !body || !sig) return null;
  const expected = createHmac('sha256', secret).update(`${head}.${body}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString()) as Claims;
    return claims.exp > Date.now() / 1000 ? claims : null;
  } catch {
    return null;
  }
}

// --- Codes à usage unique (SMS) ---
export const newOtp = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const hashOtp = (phone: string, code: string, secret: string) => createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
export function sameHash(a: string, b: string) {
  const x = Buffer.from(a, 'hex'); const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Normalise un numéro gabonais au format E.164 (+241…). */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (!d.startsWith('+')) d = '+241' + d;
  return /^\+\d{9,15}$/.test(d) ? d : null;
}

// --- Signature des lots (Ed25519) : la clé privée ne quitte jamais le serveur ---
export function lotSigner(privateHex: string) {
  const priv = hexToBytes(privateHex);
  const publicKey = bytesToHex(ed25519.getPublicKey(priv));
  return {
    publicKey,
    sign: (lotId: string) => Buffer.from(ed25519.sign(utf8ToBytes(lotId), priv)).toString('base64url'),
    verify: (lotId: string, sig: string) => {
      try { return ed25519.verify(new Uint8Array(Buffer.from(sig, 'base64url')), utf8ToBytes(lotId), hexToBytes(publicKey)); } catch { return false; }
    },
  };
}

export const sha256hex = (s: string) => createHash('sha256').update(s).digest('hex');
