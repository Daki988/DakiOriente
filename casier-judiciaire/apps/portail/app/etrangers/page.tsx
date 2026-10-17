import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { TableauTarifs } from '@/components/TableauTarifs';
import { tarifs } from '@/lib/api';

export const metadata: Metadata = { title: 'Étrangers résidant au Gabon', description: 'Bulletin n°3 pour les étrangers résidant au Gabon : pièces, traitement et tarif.' };
export const dynamic = 'force-dynamic';

/** PUB-04 : pièces, traitement par l'administration centrale, tarif. */
export default async function Etrangers() {
  const liste = await tarifs().catch(() => []);
  return (
    <>
      <EntetePage fil={[{ libelle: 'Étrangers résidant au Gabon' }]} surtitre="Résidents étrangers" titre="Vous êtes étranger et résidez au Gabon"
        chapo="Votre demande de bulletin n°3 est traitée par l’administration centrale du casier judiciaire."
        actions={<Link href="/demande" className={classesBouton({ taille: 'l' })}><Icone nom="file-text" taille={20} /><span>Faire ma demande</span></Link>} />
      <div className="cj-conteneur p-contenu p-contenu--colonnes">
        <div className="p-prose">
          <h2>Les pièces à prévoir</h2>
          <ul>
            <li>Votre passeport ou votre titre de séjour en cours de validité.</li>
            <li>Votre acte de naissance.</li>
            <li>Une photo de vous prise pendant la demande, pour confirmer votre présence.</li>
          </ul>
          <h2>Le traitement</h2>
          <p>
            Un agent de l’administration centrale vérifie votre identité. Le bulletin est ensuite déposé dans votre espace personnel,
            sous 24 heures au plus après le paiement confirmé et le dossier complet.
          </p>
          <h2>Le tarif</h2>
          <TableauTarifs tarifs={liste} acte="BULLETIN_N3" />
          <Alerte type="avertissement" titre="Tarif en attente">
            Tant que le Ministère n’a pas fixé ce tarif, la demande en ligne n’est pas ouverte pour les résidents étrangers.
            Vous pouvez vous adresser au service central du casier judiciaire.
          </Alerte>
        </div>
        <aside className="p-encadre cj-pile" aria-label="Besoin d’aide">
          <h2 className="p-titre-encadre">Besoin d’aide ?</h2>
          <p>Le support répond à vos questions sur la démarche, les pièces et le paiement.</p>
          <Link href="/contact" className={classesBouton({ variante: 'secondaire' })}><Icone nom="mail" taille={20} /><span>Nous contacter</span></Link>
        </aside>
      </div>
    </>
  );
}
