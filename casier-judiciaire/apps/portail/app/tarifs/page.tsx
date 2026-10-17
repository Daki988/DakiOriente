import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { TableauTarifs } from '@/components/TableauTarifs';
import { tarifs } from '@/lib/api';

export const metadata: Metadata = { title: 'Tarifs', description: 'Tarifs des bulletins et relevés du casier judiciaire, lus dans le référentiel en vigueur.' };
export const dynamic = 'force-dynamic';

/** PUB-09, RG-10 : tarifs lus dans le référentiel, bandeau « provisoire ». */
export default async function Tarifs() {
  const liste = await tarifs().catch(() => null);
  const source = liste?.[0]?.source;
  return (
    <>
      <EntetePage fil={[{ libelle: 'Tarifs' }]} surtitre="Tarifs" titre="Combien coûtent les actes du casier judiciaire ?"
        chapo="Le montant payé est celui du référentiel en vigueur à la date de votre paiement. Il est affiché avant toute validation." />
      <div className="cj-conteneur p-contenu">
        {liste === null && (
          <Alerte type="erreur" titre="Les tarifs sont momentanément indisponibles">Réessayez dans quelques minutes.</Alerte>
        )}
        {liste?.some((t) => t.provisoire) && (
          <Alerte type="avertissement" titre="Tarifs provisoires">
            Le barème n’est pas encore fixé par un texte. Les montants peuvent évoluer ; un changement ne s’applique jamais à une demande déjà payée.
          </Alerte>
        )}
        {liste && <TableauTarifs tarifs={liste} />}
        {source && <p className="p-note"><Icone nom="info" taille={18} /><span>Source : {source}.</span></p>}
        <div className="cj-grille cj-grille--2">
          <div className="p-encadre cj-pile">
            <h2 className="p-titre-encadre">Comment payer ?</h2>
            <p>Par Mobile Money ou carte bancaire, au moment de la demande. Vous recevez un reçu numéroté par SMS ou e-mail.</p>
            <Link href="/demande" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
              <Icone nom="file-text" taille={20} /><span>Demander mon bulletin</span>
            </Link>
          </div>
          <div className="p-encadre cj-pile">
            <h2 className="p-titre-encadre">Et si ma demande est rejetée ?</h2>
            <p>Le remboursement suit la politique fixée par le Ministère selon le motif du rejet. Vous êtes informé du motif et des suites.</p>
            <Link href="/aide" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}><span>Questions fréquentes</span></Link>
          </div>
        </div>
      </div>
    </>
  );
}
