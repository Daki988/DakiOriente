import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { config } from '@/lib/config';

/** Tant que la fédération d'identité n'est pas raccordée (lot L1), le bouton est affiché inactif. */
function BoutonConnexion({ href, actif, variante, children }: { href: string; actif: boolean; variante?: 'secondaire'; children: ReactNode }) {
  const classe = classesBouton({ variante });
  return actif
    ? <a href={href} className={classe} style={{ alignSelf: 'flex-start' }}>{children}</a>
    : <button type="button" className={classe} style={{ alignSelf: 'flex-start' }} disabled>{children}</button>;
}

export const metadata: Metadata = { title: 'Connexion', description: 'Accéder à votre espace usager ou à l’espace administration.' };

/**
 * PUB-14 : connexion usager (identité numérique nationale) et administrations (double facteur).
 * Le personnel judiciaire se connecte sur un accès séparé, non référencé ici (section 18).
 */
export default function Connexion() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Connexion' }]} surtitre="Espaces sécurisés" titre="Se connecter"
        chapo="Retrouvez vos demandes, téléchargez vos bulletins et déposez une pièce depuis votre espace." />
      <div className="cj-conteneur p-contenu">
        {config.modeDemo && (
          <Alerte type="info" titre="Démonstration">
            Les connexions sont simulées. Les comptes de démonstration de chaque profil sont remis lors des présentations encadrées.
          </Alerte>
        )}
        <div className="cj-grille cj-grille--2">
          <section className="p-encadre cj-pile" aria-labelledby="titre-usager" id="usager">
            <span className="cj-carte__icone"><Icone nom="user" /></span>
            <h2 id="titre-usager" className="p-titre-encadre">Particuliers</h2>
            <p>Connectez-vous avec l’identité numérique nationale. Vos informations d’état civil sont transmises de façon sécurisée et vérifiées automatiquement.</p>
            <BoutonConnexion href="/connexion/usager" actif={!config.modeDemo}>
              <Icone nom="fingerprint" taille={20} /><span>Se connecter avec l’identité numérique</span>
            </BoutonConnexion>
            <p className="p-note"><Icone nom="info" taille={18} /><span>Pas encore d’identité numérique ? Vous pouvez faire votre demande et déposer vos pièces : <Link href="/demande">commencer</Link>.</span></p>
          </section>
          <section className="p-encadre cj-pile" aria-labelledby="titre-administrations" id="administrations">
            <span className="cj-carte__icone"><Icone nom="building-2" /></span>
            <h2 id="titre-administrations" className="p-titre-encadre">Administrations habilitées</h2>
            <p>Agents et gestionnaires des organismes habilités : connexion par identifiant et double facteur d’authentification.</p>
            <BoutonConnexion href="/connexion/administration" actif={!config.modeDemo} variante="secondaire">
              <Icone nom="lock" taille={20} /><span>Accéder à l’espace administration</span>
            </BoutonConnexion>
          </section>
        </div>
        <Alerte type="avertissement" titre="Protégez votre compte">
          Le service ne vous demandera jamais votre mot de passe ni un code reçu par SMS, ni par téléphone, ni par e-mail.
        </Alerte>
        <p className="p-note"><Icone nom="scale" taille={18} /><span>Magistrats, greffiers et agents du casier : utilisez l’accès réservé communiqué par votre juridiction.</span></p>
      </div>
    </>
  );
}
