import { NextResponse, type NextRequest } from 'next/server';

import { RefusMetier, ServiceIndisponible } from '@/lib/api';
import { espaces } from '@/lib/espaces';
import { poserFlash, session } from '@/lib/session';

/**
 * Impression d'un bulletin validé : enregistre le feuillet sécurisé (et le motif d'une réimpression), puis ouvre le PDF
 * scellé dans un nouvel onglet pour l'imprimer. En cas de refus, retour au tableau de bord avec le message.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await session();
  if (!s) return NextResponse.redirect(new URL('/connexion?expiree=1', req.url), 303);
  if (!s.roles.includes('R07')) return new NextResponse('Accès refusé', { status: 403 });
  const { id } = await params;
  const f = await req.formData();
  const feuillet = String(f.get('feuillet') ?? '').trim().slice(0, 40);
  const motif = String(f.get('motif') ?? '').trim().slice(0, 500) || null;
  try {
    const pdf = await espaces.imprimer(s, id, feuillet, motif);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="bulletin-${encodeURIComponent(id)}.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof RefusMetier) await poserFlash({ type: 'erreur', texte: e.message });
    else if (e instanceof ServiceIndisponible) await poserFlash({ type: 'erreur', texte: 'Le service est momentanément indisponible.' });
    else throw e;
    return NextResponse.redirect(new URL('/espace/impression', req.url), 303);
  }
}
