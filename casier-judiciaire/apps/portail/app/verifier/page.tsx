import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Alerte, Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { FormulaireVerification } from '@/components/FormulaireVerification';
import { ResultatVerification } from '@/components/ResultatVerification';
import { RefusMetier, ServiceIndisponible, verifierCode } from '@/lib/api';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Vérifier un bulletin',
  description: 'Vérifiez gratuitement et sans compte l’authenticité d’un bulletin du casier judiciaire, avec son QR code ou son code de vérification.',
};

export const dynamic = 'force-dynamic';

/** Code court : 12 caractères Crockford base32 (ADR 0004), tirets et espaces tolérés. */
function codeValide(code: string) {
  return /^[0-9A-Za-z]{12}$/.test(code.replace(/[\s-]/g, ''));
}

/** PUB-08, BUL-03, BUL-07, BUL-09 : vérification par le code court imprimé en clair. */
export default async function Verifier({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const brut = (await searchParams).code;
  const code = (Array.isArray(brut) ? brut[0] : brut ?? '').trim().slice(0, 20);

  let contenu: ReactNode = null;
  let erreur: string | undefined;
  if (code !== '') {
    if (!codeValide(code)) {
      erreur = 'Le code doit compter 12 lettres ou chiffres, par exemple DEMO-VALI-DE26. Vérifiez la saisie.';
    } else {
      try {
        contenu = <ResultatVerification resultat={await verifierCode(code)} />;
      } catch (e) {
        if (e instanceof RefusMetier) {
          contenu = <Alerte type="avertissement" titre="Trop de vérifications">{e.message}</Alerte>;
        } else if (e instanceof ServiceIndisponible) {
          contenu = (
            <Alerte type="erreur" titre="La vérification est momentanément indisponible">
              Réessayez dans quelques minutes. Si le problème persiste, appelez le {config.supportTelephone}.
            </Alerte>
          );
        } else {
          throw e;
        }
      }
    }
  }

  return (
    <>
      <EntetePage fil={[{ libelle: 'Vérifier un bulletin' }]} surtitre="Gratuit, sans compte"
        titre="Vérifier l’authenticité d’un bulletin"
        chapo="Employeur, administration ou particulier : contrôlez en quelques secondes qu’un bulletin remis est authentique et toujours valable." />
      <div className="cj-conteneur p-contenu p-contenu--colonnes">
        <div className="cj-pile" aria-live="polite">
          {contenu ?? <FormulaireVerification valeur={code} erreur={erreur} />}
          {config.modeDemo && !contenu && (
            <Alerte type="info" titre="Codes de démonstration">
              DEMO-VALI-DE26 (valide), DEMO-REVO-QUE1 (révoqué), DEMO-EXPI-RE01 (expiré). Bulletins fictifs.
            </Alerte>
          )}
        </div>
        <aside className="p-encadre cj-pile" aria-label="Ce que la vérification indique">
          <h2 className="p-titre-encadre">Ce que la vérification indique</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="badge-check" />Si le bulletin a bien été émis par le casier judiciaire national.</li>
            <li><Icone nom="clock" />S’il est valide, expiré ou révoqué.</li>
            <li><Icone nom="user-check" />Le nom, les prénoms et la date de naissance, pour rapprocher le document de la personne.</li>
            <li><Icone nom="lock" />Jamais le contenu du casier : les condamnations ne s’affichent pas.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
