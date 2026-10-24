import type { Metadata } from 'next';
import { Carte } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { config } from '@/lib/config';
import { donnees } from '@/lib/donnees';
import { TYPES_ETABLISSEMENT } from '@/lib/libelles';

export const metadata: Metadata = { title: 'Établissements', description: 'Les établissements pénitentiaires du Gabon : maisons d’arrêt, centres pénitentiaires et prison centrale.' };
export const dynamic = 'force-dynamic';

export default async function Etablissements() {
  const liste = await donnees.etablissements();
  const provinces = [...new Set(liste.map((e) => e.province))].sort((a, b) => a.localeCompare(b, 'fr'));
  return (
    <>
      <EntetePage fil={[{ libelle: 'Établissements' }]} surtitre="Le réseau" titre="Les établissements pénitentiaires"
        chapo="Maisons d’arrêt pour les personnes prévenues et les courtes peines, centres pénitentiaires et prison centrale pour les condamnés." />
      <div className="cj-conteneur p-contenu">
        {provinces.map((p) => (
          <section key={p} aria-labelledby={`province-${p}`} className="cj-pile">
            <h2 id={`province-${p}`} className="p-titre-encadre">{p}</h2>
            <div className="cj-grille cj-grille--3">
              {liste.filter((e) => e.province === p).map((e) => (
                <Carte key={e.code} titre={e.nom} href={`/etablissements/${e.code}`} icone="building-2" suite="Voir la fiche">
                  {TYPES_ETABLISSEMENT[e.type]} · {e.ville}
                </Carte>
              ))}
            </div>
          </section>
        ))}
        {config.modeDemo && <p className="p-note p-note--discrete">Liste et capacités indicatives, à confirmer par la direction de l’administration pénitentiaire.</p>}
      </div>
    </>
  );
}
