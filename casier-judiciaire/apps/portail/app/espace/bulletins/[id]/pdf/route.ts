import { NextResponse, type NextRequest } from 'next/server';

import { espaces } from '@/lib/espaces';
import { session } from '@/lib/session';
import { SPECIMEN_B3 } from '@/lib/specimen-b3';

/** BUL-01 : téléchargement du bulletin scellé par son destinataire. En démonstration : spécimen fictif scellé. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await session();
  if (!s) return NextResponse.redirect(new URL('/connexion?expiree=1', req.url));
  if (!s.roles.includes('R01')) return new NextResponse('Accès refusé', { status: 403 });
  const { id } = await params;
  const entetes = { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  if (s.demo) {
    if (id !== 'demo-b3-412') return new NextResponse('Bulletin introuvable', { status: 404 });
    return new NextResponse(Buffer.from(SPECIMEN_B3, 'base64'), {
      headers: { ...entetes, 'Content-Disposition': 'attachment; filename="bulletin-n3-DEMONSTRATION.pdf"' },
    });
  }
  const r = await espaces.telecharger(s, id);
  if (!r) return new NextResponse('Bulletin introuvable', { status: 404 });
  return new NextResponse(r.body, {
    headers: { ...entetes, 'Content-Disposition': r.headers.get('Content-Disposition') ?? `attachment; filename="bulletin-${id}.pdf"` },
  });
}
