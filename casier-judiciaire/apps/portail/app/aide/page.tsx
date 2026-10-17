import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Champ, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { glossaire, rechercher } from '@/lib/aide';

export const metadata: Metadata = { title: 'Aide et questions fréquentes', description: 'Questions fréquentes, glossaire et contact du support du casier judiciaire numérique.' };

/** PUB-10 : FAQ avec recherche (formulaire GET, sans JavaScript), glossaire (ERG-03). */
export default async function Aide({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const brut = (await searchParams).q;
  const q = (Array.isArray(brut) ? brut[0] : brut ?? '').slice(0, 100);
  const resultats = rechercher(q);
  const themes = [...new Set(resultats.map((x) => x.theme))];
  return (
    <>
      <EntetePage fil={[{ libelle: 'Aide' }]} surtitre="Aide" titre="Comment pouvons-nous vous aider ?"
        chapo="Trouvez une réponse en quelques mots, ou contactez le support." />
      <div className="cj-conteneur p-contenu p-contenu--colonnes">
        <div className="cj-pile">
          <form action="/aide" method="get" role="search" className="p-recherche">
            <Champ id="q" name="q" type="search" libelle="Rechercher dans l’aide" defaultValue={q} aide="Par exemple : délai, paiement, code perdu" />
            <button type="submit" className={classesBouton()}><Icone nom="search" taille={20} /><span>Rechercher</span></button>
          </form>
          <p aria-live="polite" className="p-note"><span>
            {q ? `${resultats.length} réponse${resultats.length > 1 ? 's' : ''} pour « ${q} ».` : `${resultats.length} questions fréquentes.`}
            {q && <> <Link href="/aide">Tout afficher</Link></>}
          </span></p>
          {resultats.length === 0 && (
            <Alerte type="info" titre="Aucune réponse trouvée">Essayez d’autres mots, ou <Link href="/contact">posez votre question au support</Link>.</Alerte>
          )}
          {themes.map((theme) => (
            <section key={theme} aria-labelledby={`theme-${theme}`} className="cj-pile">
              <h2 id={`theme-${theme}`} className="p-titre-encadre">{theme}</h2>
              <div className="cj-faq">
                {resultats.filter((x) => x.theme === theme).map((x) => (
                  <details key={x.id} id={x.id} open={q !== '' || undefined}>
                    <summary>{x.q}<Icone nom="chevron-down" /></summary>
                    <div><p>{x.r}</p></div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <section aria-labelledby="titre-glossaire" className="cj-pile" id="glossaire">
            <h2 id="titre-glossaire" className="p-titre-section">Glossaire</h2>
            <dl className="p-glossaire">
              {glossaire.map((g) => <div key={g.terme}><dt>{g.terme}</dt><dd>{g.definition}</dd></div>)}
            </dl>
          </section>
        </div>
        <aside className="p-encadre cj-pile" aria-label="Contacter le support">
          <h2 className="p-titre-encadre">Vous n’avez pas trouvé ?</h2>
          <p>Le support répond à vos questions et traite vos réclamations.</p>
          <Link href="/contact" className={classesBouton()}><Icone nom="mail" taille={20} /><span>Contacter le support</span></Link>
          <Alerte type="avertissement">Le service ne vous demandera jamais de code ni de paiement par téléphone.</Alerte>
        </aside>
      </div>
    </>
  );
}
