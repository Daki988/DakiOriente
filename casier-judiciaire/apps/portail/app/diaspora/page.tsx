import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Carte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Gabonais de l’étranger', description: 'Demander son bulletin n°3 depuis l’étranger : en ligne ou au consulat.' };

/** PUB-03 et parcours « Gabonais de l'étranger » (section 8). */
export default function Diaspora() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Gabonais de l’étranger' }]} surtitre="Diaspora" titre="Vous vivez à l’étranger ? Demandez votre bulletin sans revenir au Gabon"
        chapo="Faites votre demande en ligne ou auprès de votre consulat. Le bulletin vous est remis dans votre espace personnel, comme au Gabon."
        actions={<Link href="/demande" className={classesBouton({ taille: 'l' })}><Icone nom="file-text" taille={20} /><span>Faire ma demande en ligne</span></Link>}
        visuel={<img src="/cartes/gabon-provinces.svg" alt="Carte du Gabon et de ses neuf provinces" className="p-visuel-carte" width={340} height={340} />} />
      <div className="cj-conteneur p-contenu">
        <section aria-labelledby="titre-deux-voies" className="cj-pile">
          <h2 id="titre-deux-voies" className="p-titre-section">Deux façons de faire votre demande</h2>
          <div className="cj-grille cj-grille--2">
            <Carte titre="En ligne, depuis chez vous" icone="globe">
              Vous remplissez la demande sur ce portail et payez en ligne. Si votre identité doit être confirmée, vous déposez vos pièces en photo.
            </Carte>
            <Carte titre="Au consulat" icone="landmark">
              L’agent consulaire vérifie votre identité sur pièces et transmet votre demande. Le paiement au guichet consulaire est à l’étude.
            </Carte>
          </div>
        </section>
        <section aria-labelledby="titre-suite" className="p-prose">
          <h2 id="titre-suite">Ce qui se passe ensuite</h2>
          <ol>
            <li>Votre demande est traitée par l’administration centrale du casier judiciaire, à Libreville.</li>
            <li>Vous recevez un code de suivi par SMS ou e-mail et pouvez suivre l’avancement en ligne.</li>
            <li>Le bulletin scellé est déposé dans votre espace personnel, sous 24 heures au plus après le paiement confirmé.</li>
          </ol>
        </section>
        <section aria-labelledby="titre-representations" className="cj-pile">
          <h2 id="titre-representations" className="p-titre-section">Les représentations diplomatiques et consulaires</h2>
          <Alerte type="info" titre="Liste en cours de publication">
            La liste des ambassades et consulats qui reçoivent les demandes, avec leurs adresses et horaires, sera publiée ici par le Ministère.
          </Alerte>
        </section>
      </div>
    </>
  );
}
