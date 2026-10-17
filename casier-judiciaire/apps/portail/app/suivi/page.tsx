import type { Metadata } from 'next';
import { Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { FormulaireSuivi } from '@/components/FormulaireSuivi';

export const metadata: Metadata = { title: 'Suivre une demande', description: 'Suivez l’état de votre demande de bulletin n°3 avec votre numéro de dossier et le code reçu par SMS.' };

/** PUB-07 : suivi d'une demande, frise d'état. */
export default function Suivi() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Suivre une demande' }]} surtitre="Sans compte" titre="Suivre ma demande"
        chapo="Saisissez votre numéro de dossier et le code reçu par SMS pour voir où en est votre demande." />
      <div className="cj-conteneur p-parcours">
        <div className="cj-pile">
          <FormulaireSuivi />
        </div>
        <aside className="p-encadre cj-pile" aria-label="Bon à savoir">
          <h2 className="p-titre-encadre">Bon à savoir</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="timer" />Le bulletin est délivré en 24 heures au plus après le paiement confirmé.</li>
            <li><Icone nom="bell" />Vous êtes prévenu par SMS ou e-mail à chaque étape. Le message ne contient jamais le bulletin.</li>
            <li><Icone nom="shield-alert" />Le service ne vous demandera jamais de code ni de paiement par téléphone.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
