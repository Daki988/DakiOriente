import { espaces, exigerSession } from '@/lib/espaces';
import { periode } from '@/lib/comptabilite';

/** Export CSV des paiements de la période, pour la comptabilité publique (journalisé par le service). */
export async function GET(requete: Request) {
  const s = await exigerSession('R10');
  const url = new URL(requete.url);
  const { du, au } = periode(url.searchParams.get('du') ?? undefined, url.searchParams.get('au') ?? undefined);
  const csv = await espaces.exporterPaiements(s, du, au);
  return new Response('﻿' + csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="paiements-${du}-${au}.csv"`, 'Cache-Control': 'no-store' },
  });
}
