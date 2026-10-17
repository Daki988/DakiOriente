import { NextResponse, type NextRequest } from 'next/server';

import { config } from '@/lib/config';
import { payerTresorDemo } from '@/lib/demo';
import { SPECIMEN_B3 } from '@/lib/specimen-b3';

/**
 * Démonstration : bulletin spécimen remis après paiement au Trésor. Le paiement est rejoué (sans effet s'il est déjà
 * enregistré) pour fonctionner sur un hébergement à plusieurs instances. Avec le service réel, le bulletin se
 * télécharge depuis l'espace de l'usager.
 */
export async function POST(req: NextRequest) {
  if (config.apiCasier !== '') return NextResponse.redirect(new URL('/espace/demandes', req.url), 303);
  const f = await req.formData();
  const numero = String(f.get('numero') ?? '').trim().toUpperCase().slice(0, 20);
  const code = String(f.get('code') ?? '').trim().slice(0, 6);
  const quittance = String(f.get('quittance') ?? '').trim().toUpperCase().slice(0, 30);
  let delivre = false;
  try {
    delivre = payerTresorDemo(numero, code, quittance)?.statut === 'DELIVREE';
  } catch {
    delivre = false;
  }
  if (!delivre) return new NextResponse('Bulletin introuvable', { status: 404 });
  return new NextResponse(Buffer.from(SPECIMEN_B3, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'attachment; filename="bulletin-n3.pdf"',
    },
  });
}
