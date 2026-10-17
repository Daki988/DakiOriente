import type { Metadata } from 'next';
import { Alerte, Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { FormulairePaiementTresor } from '@/components/FormulairePaiementTresor';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Payer au Trésor public',
  description: 'Vous avez payé votre bulletin n°3 au Trésor public : saisissez l’identifiant de paiement pour obtenir votre bulletin.',
};
export const dynamic = 'force-dynamic';

/** Paiement au Trésor public : saisie de l'identifiant de paiement (quittance) pour obtenir le bulletin. */
export default async function PaiementTresor({ searchParams }: { searchParams: Promise<{ numero?: string }> }) {
  const numero = String((await searchParams).numero ?? '').slice(0, 20);
  return (
    <>
      <EntetePage fil={[{ libelle: 'Payer au Trésor public' }]} surtitre="Paiement au guichet"
        titre="J’ai payé au Trésor public"
        chapo="Saisissez l’identifiant de paiement figurant sur votre quittance pour obtenir votre bulletin n°3." />
      <div className="cj-conteneur p-parcours">
        <div className="cj-pile">
          <FormulairePaiementTresor numeroInitial={numero} />
          {config.comptesDemo && (
            <Alerte type="info" titre="Dossier de démonstration">
              Numéro CJ-2026-000140, code 654321, identifiant de paiement au choix (par exemple TP-2026-104512). Données fictives.
            </Alerte>
          )}
        </div>
        <aside className="p-encadre cj-pile" aria-label="Comment payer au Trésor">
          <h2 className="p-titre-encadre">Comment ça marche</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="file-text" />Faites votre demande en ligne et choisissez « Au Trésor public » : vous recevez un avis de paiement.</li>
            <li><Icone nom="landmark" />Payez au guichet du Trésor avec votre numéro de dossier. Gardez la quittance.</li>
            <li><Icone nom="check" />Saisissez ici l’identifiant de paiement : votre bulletin est délivré.</li>
            <li><Icone nom="lock" />Un identifiant de paiement ne sert qu’une seule fois.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
