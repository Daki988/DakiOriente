import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { config } from '@/lib/config';
import { connexionReelle } from '@/lib/oidc';
import { PROFILS_DEMO } from '@/lib/profils-demo';
import { connexionDemo } from './actions';

/** Sans fournisseur d'identité configuré, le bouton renvoie vers les comptes de démonstration (ENV-04). */
function BoutonConnexion({ href, variante, children }: { href: string; variante?: 'secondaire'; children: ReactNode }) {
  return <a href={href} className={classesBouton({ variante })} style={{ alignSelf: 'flex-start' }}>{children}</a>;
}

export const metadata: Metadata = { title: 'Connexion', description: 'Accéder à votre espace usager ou à l’espace administration.' };

/**
 * PUB-14 : connexion usager (identité numérique nationale) et administrations (double facteur).
 * Le personnel judiciaire se connecte sur un accès séparé, non référencé ici (section 18).
 */
export const dynamic = 'force-dynamic';

export default async function Connexion({ searchParams }: { searchParams: Promise<{ expiree?: string; erreur?: string; indisponible?: string }> }) {
  const { expiree, erreur, indisponible } = await searchParams;
  const reelle = connexionReelle();
  const comptesDemo = !reelle && config.comptesDemo;
  const lien = reelle ? '/auth/connexion' : comptesDemo ? '#demonstration' : '/auth/connexion';
  return (
    <>
      <EntetePage fil={[{ libelle: 'Connexion' }]} surtitre="Espaces sécurisés" titre="Se connecter"
        chapo="Retrouvez vos demandes, téléchargez vos bulletins et déposez une pièce depuis votre espace." />
      <div className="cj-conteneur p-contenu">
        {expiree && <Alerte type="info" titre="Connexion requise">Connectez-vous pour accéder à votre espace.</Alerte>}
        {indisponible && <Alerte type="info" titre="Connexion bientôt disponible">La connexion aux espaces sera ouverte à la mise en service. Vous pouvez dès maintenant faire une demande, la suivre et vérifier un bulletin.</Alerte>}
        {erreur && <Alerte type="erreur" titre="Connexion impossible">La connexion n’a pas abouti. Réessayez.</Alerte>}
        <div className="cj-grille cj-grille--2">
          <section className="p-encadre cj-pile" aria-labelledby="titre-usager" id="usager">
            <span className="cj-carte__icone"><Icone nom="user" /></span>
            <h2 id="titre-usager" className="p-titre-encadre">Particuliers</h2>
            <p>Connectez-vous avec l’identité numérique nationale. Vos informations d’état civil sont transmises de façon sécurisée et vérifiées automatiquement.</p>
            <BoutonConnexion href={lien}>
              <Icone nom="fingerprint" taille={20} /><span>Se connecter avec l’identité numérique</span>
            </BoutonConnexion>
            <p className="p-note"><Icone nom="info" taille={18} /><span>Pas encore d’identité numérique ? Vous pouvez faire votre demande et déposer vos pièces : <Link href="/demande">commencer</Link>.</span></p>
          </section>
          <section className="p-encadre cj-pile" aria-labelledby="titre-administrations" id="administrations">
            <span className="cj-carte__icone"><Icone nom="building-2" /></span>
            <h2 id="titre-administrations" className="p-titre-encadre">Administrations habilitées</h2>
            <p>Agents et gestionnaires des organismes habilités : connexion par identifiant et double facteur d’authentification.</p>
            <BoutonConnexion href={lien} variante="secondaire">
              <Icone nom="lock" taille={20} /><span>Accéder à l’espace administration</span>
            </BoutonConnexion>
          </section>
        </div>
        {comptesDemo && (
          <section className="p-encadre cj-pile" aria-labelledby="titre-demo" id="demonstration">
            <h2 id="titre-demo" className="p-titre-encadre">Comptes de démonstration</h2>
            <p>Identités fictives, une par profil. Choisissez un profil pour découvrir son espace : les données sont simulées et réinitialisées régulièrement.</p>
            <form action={connexionDemo} className="cj-grille cj-grille--2">
              {PROFILS_DEMO.map((p) => (
                <button key={p.id} type="submit" name="profil" value={p.id} className="cj-choix-carte">
                  <span className="cj-choix-carte__icone"><Icone nom={p.id === 'usager' ? 'user' : p.id === 'auditeur' ? 'shield-check' : p.id === 'decideur' || p.id === 'direction' ? 'chart-column' : 'scale'} /></span>
                  <span>
                    <span className="cj-choix-carte__titre">{p.libelle}</span>
                    <span className="cj-choix-carte__description">{p.nom} — {p.detail}</span>
                  </span>
                </button>
              ))}
            </form>
          </section>
        )}
        <Alerte type="avertissement" titre="Protégez votre compte">
          Le service ne vous demandera jamais votre mot de passe ni un code reçu par SMS, ni par téléphone, ni par e-mail.
        </Alerte>
        <p className="p-note"><Icone nom="scale" taille={18} /><span>Magistrats, greffiers et agents du casier : utilisez l’accès réservé communiqué par votre juridiction.</span></p>
      </div>
    </>
  );
}
