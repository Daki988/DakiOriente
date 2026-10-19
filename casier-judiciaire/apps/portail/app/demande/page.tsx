import type { Metadata } from 'next';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { ParcoursDemande, type TarifProfil } from '@/components/ParcoursDemande';
import { tarifs } from '@/lib/api';
import { config } from '@/lib/config';
import type { CodeProfil } from '@/lib/contenu';
import { connexionReelle } from '@/lib/oidc';
import { session } from '@/lib/session';

export const metadata: Metadata = { title: 'Demander un bulletin n°3', description: 'Demandez votre bulletin n°3 en ligne, en cinq étapes.' };
export const dynamic = 'force-dynamic';

/** PUB-06 : entrée du parcours de demande (section 8), cinq étapes au plus (ERG-04). Tarifs lus dans le référentiel (RG-10). */
export default async function Demande() {
  const liste = await tarifs().catch(() => []);
  const s = await session();
  const connexionRequise = config.apiCasier !== '' && (!s || s.demo || !s.roles.includes('R01'));
  const simulateur = config.apiCasier === '' || process.env.PAIEMENT_SIMULE === 'true';
  const parProfil: Partial<Record<CodeProfil, TarifProfil>> = {};
  for (const t of liste.filter((x) => x.acte === 'BULLETIN_N3')) {
    parProfil[t.profil as CodeProfil] = { montantFcfa: t.montantFcfa, provisoire: t.provisoire };
  }
  return (
    <>
      <EntetePage fil={[{ libelle: 'Demander un bulletin n°3' }]} surtitre="Bulletin n°3" titre="Demander mon bulletin n°3"
        chapo="Cinq étapes, environ cinq minutes. Gardez à portée de main votre acte de naissance et votre téléphone." />
      <div className="cj-conteneur p-parcours">
        <div className="cj-pile">
          <noscript>
            <Alerte type="avertissement" titre="JavaScript est désactivé">
              Le formulaire de demande a besoin de JavaScript. Vous pouvez aussi vous présenter au greffe de votre lieu de naissance.
            </Alerte>
          </noscript>
          {liste.length === 0 && (
            <Alerte type="erreur" titre="Le service est momentanément indisponible">
              Les tarifs n’ont pas pu être chargés. Réessayez dans quelques minutes ou appelez le {config.supportTelephone}.
            </Alerte>
          )}
          {connexionRequise && (
            <Alerte type="info" titre="Connectez-vous pour déposer votre demande">
              <p>Votre identité est vérifiée par l’identité numérique nationale avant le dépôt.</p>
              {connexionReelle() && (
                <p><a href="/auth/connexion?retour=/demande" className={classesBouton()}><Icone nom="log-in" taille={20} /><span>Se connecter</span></a></p>
              )}
            </Alerte>
          )}
          <ParcoursDemande tarifs={parProfil} demo={config.modeDemo && simulateur} />
        </div>
        <aside className="p-encadre cj-pile" aria-label="Avant de commencer">
          <h2 className="p-titre-encadre">Avant de commencer</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="file-text" />Votre acte de naissance, pour recopier exactement votre état civil.</li>
            <li><Icone nom="smartphone" />Un téléphone mobile pour recevoir le code de suivi et payer.</li>
            <li><Icone nom="timer" />Bulletin en 24 heures au plus, souvent immédiatement.</li>
            <li><Icone nom="user-check" />Si votre identité doit être vérifiée, un agent peut vous demander une pièce.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
