import type { Metadata } from 'next';
import Link from 'next/link';
import { Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { FormulairePreplainte } from '@/components/FormulairePreplainte';

export const metadata: Metadata = {
  title: 'Pré-plainte en ligne',
  description: 'Victime d’un vol, d’un cambriolage, d’une dégradation ou d’une arnaque : déclarez les faits en ligne, puis signez votre plainte au rendez-vous.',
};

/** Pré-plainte en ligne pour les atteintes aux biens : déclaration, puis signature de la plainte lors d'un rendez-vous. */
export default function PrePlainte() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Pré-plainte en ligne' }]} surtitre="Victime d’une atteinte à vos biens"
        titre="Pré-plainte en ligne"
        chapo="Vol, cambriolage, dégradation ou arnaque : déclarez les faits en quelques minutes, puis signez votre plainte lors d’un rendez-vous, sans attente au guichet." />
      <div className="cj-conteneur p-parcours">
        <FormulairePreplainte />
        <aside className="p-encadre cj-pile" aria-label="Comment ça marche">
          <h2 className="p-titre-encadre">Comment ça marche</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="pencil" />Vous décrivez les faits en ligne, en 10 minutes environ.</li>
            <li><Icone nom="badge-check" />Vous recevez un numéro et un code de suivi.</li>
            <li><Icone nom="calendar" />Un officier de police judiciaire vous propose un rendez-vous.</li>
            <li><Icone nom="file-check" />Vous signez votre plainte : elle est enregistrée. Délai : 30 jours.</li>
          </ul>
          <h2 className="p-titre-encadre">À préparer</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="id-card" />Votre pièce d’identité.</li>
            <li><Icone nom="smartphone" />Le numéro IMEI d’un téléphone volé (inscrit sur la boîte ou la facture).</li>
            <li><Icone nom="file-text" />Factures, photos, captures d’écran, relevé de mobile money.</li>
          </ul>
          <p><Link href="/pre-plainte/suivi">Suivre une pré-plainte</Link></p>
        </aside>
      </div>
    </>
  );
}
