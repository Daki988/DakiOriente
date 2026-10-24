import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alerte, Icone, ListeDescription, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { config } from '@/lib/config';
import { donnees } from '@/lib/donnees';
import { TYPES_ETABLISSEMENT } from '@/lib/libelles';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const e = (await donnees.etablissements()).find((x) => x.code === code);
  return { title: e?.nom ?? 'Établissement' };
}

export default async function FicheEtablissement({ params }: Params) {
  const { code } = await params;
  const e = (await donnees.etablissements()).find((x) => x.code === code);
  if (!e) notFound();
  return (
    <>
      <EntetePage fil={[{ libelle: 'Établissements', href: '/etablissements' }, { libelle: e.nom }]} surtitre={TYPES_ETABLISSEMENT[e.type]} titre={e.nom}
        chapo={`${e.ville} · province : ${e.province}`} />
      <div className="cj-conteneur p-contenu">
        <div className="cj-grille cj-grille--2">
          <section className="p-encadre cj-pile" aria-labelledby="titre-infos">
            <h2 id="titre-infos" className="p-titre-encadre">Informations</h2>
            <ListeDescription elements={[
              { terme: 'Type', valeur: TYPES_ETABLISSEMENT[e.type] },
              { terme: 'Ville', valeur: e.ville },
              { terme: 'Province', valeur: e.province },
              { terme: 'Capacité', valeur: `${e.capacite.toLocaleString('fr-FR')} places${config.modeDemo ? ' (indicative)' : ''}` },
              { terme: 'Code', valeur: <span className="p-code">{e.code}</span> },
            ]} />
          </section>
          <section className="p-encadre cj-pile" aria-labelledby="titre-visites">
            <h2 id="titre-visites" className="p-titre-encadre">Visites</h2>
            <p>Les visites ont lieu sur présentation d’un permis de visite et d’une pièce d’identité. Les jours et horaires sont affichés à l’entrée de l’établissement.</p>
            <ul className="p-liste-coches">
              <li><Icone nom="check" taille={20} /><span>Personne prévenue : permis délivré par le magistrat saisi du dossier.</span></li>
              <li><Icone nom="check" taille={20} /><span>Personne condamnée : permis délivré par le chef d’établissement.</span></li>
            </ul>
          </section>
        </div>
        <Alerte type="avertissement" titre="Attention aux escroqueries">
          Aucun agent ne vous demandera d’argent par téléphone pour obtenir une visite, une libération ou un transfert.
        </Alerte>
        <Link href="/etablissements" className={classesBouton({ variante: 'secondaire' })} style={{ justifySelf: 'start' }}>
          <Icone nom="arrow-left" taille={18} /><span>Tous les établissements</span>
        </Link>
      </div>
    </>
  );
}
