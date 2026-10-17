import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Alerte } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { ResultatVerification } from '@/components/ResultatVerification';
import { ServiceIndisponible, verifierJeton } from '@/lib/api';
import { config } from '@/lib/config';
import type { ResultatVerification as Resultat } from '@/lib/types';

// Une adresse de vérification n'est jamais indexée ni mise en cache (BUL-06, BUL-09).
export const metadata: Metadata = { title: 'Résultat de la vérification', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const INCONNU: Resultat = { authentique: false, statut: 'INCONNU', type: null, numero: null, dateEmission: null,
  dateExpiration: null, nom: null, prenoms: null, dateNaissance: null };

/** PUB-08, BUL-06 : vérification ouverte par le QR code du bulletin. Un jeton mal formé n'interroge pas le service. */
export default async function VerificationParQr({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  let contenu: ReactNode;
  try {
    const resultat = /^[A-Za-z0-9_-]{22,128}$/.test(jeton) ? await verifierJeton(jeton) : INCONNU;
    contenu = <ResultatVerification resultat={resultat} />;
  } catch (e) {
    if (!(e instanceof ServiceIndisponible)) throw e;
    contenu = (
      <Alerte type="erreur" titre="La vérification est momentanément indisponible">
        Réessayez dans quelques minutes. Si le problème persiste, appelez le {config.supportTelephone}.
      </Alerte>
    );
  }
  return (
    <>
      <EntetePage fil={[{ libelle: 'Vérifier un bulletin', href: '/verifier' }, { libelle: 'Résultat' }]}
        titre="Résultat de la vérification" chapo="Vérification par le QR code imprimé sur le bulletin." />
      <div className="cj-conteneur p-contenu" style={{ maxWidth: 880 }} aria-live="polite">{contenu}</div>
    </>
  );
}
