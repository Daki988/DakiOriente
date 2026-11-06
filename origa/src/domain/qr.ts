import { ed25519 } from '@noble/curves/ed25519';
import { utf8ToBytes, bytesToHex, hexToBytes } from '@noble/curves/abstract/utils';

// QR des lots signés (Ed25519) : un QR fabriqué hors de la plateforme est rejeté au scan.
// En production, la clé privée reste sur le serveur (HSM) et les étiquettes pré-imprimées sont pré-signées ;
// la clé de démonstration ci-dessous sert uniquement au prototype.
const DEMO_PRIVATE_KEY = hexToBytes('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60');
export const PUBLIC_KEY = bytesToHex(ed25519.getPublicKey(DEMO_PRIVATE_KEY));

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function signLot(lotId: string): string {
  return b64url(ed25519.sign(utf8ToBytes(lotId), DEMO_PRIVATE_KEY));
}

export function verifyLot(lotId: string, signature: string, publicKeyHex = PUBLIC_KEY): boolean {
  try {
    return ed25519.verify(fromB64url(signature), utf8ToBytes(lotId), hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

/** Jeton porté par le QR : « identifiant.signature ». */
export const lotToken = (lotId: string, signature: string) => `${lotId}.${signature}`;
export function parseToken(token: string): { lotId: string; signature: string } | null {
  const i = token.lastIndexOf('.');
  if (i <= 0) return null;
  return { lotId: token.slice(0, i), signature: token.slice(i + 1) };
}

/** URL publique au format inspiré de GS1 Digital Link (clé AI 10 = numéro de lot). */
export function publicUrl(base: string, lotId: string, signature: string) {
  return `${base.replace(/\/$/, '')}/#/p/${encodeURIComponent(lotToken(lotId, signature))}`;
}
