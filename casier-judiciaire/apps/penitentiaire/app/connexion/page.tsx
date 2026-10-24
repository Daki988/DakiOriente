import type { Metadata } from 'next';
import { Alerte, Icone, classesBouton, type NomIcone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { config } from '@/lib/config';
import { connexionReelle } from '@/lib/oidc';
import { PROFILS_DEMO } from '@/lib/profils-demo';
import { connexionDemo } from './actions';

export const metadata: Metadata = { title: 'Accès professionnel', description: 'Connexion des personnels de l’administration pénitentiaire.' };
export const dynamic = 'force-dynamic';

const ICONES: Record<string, NomIcone> = { greffe: 'list-checks', chef: 'shield-check', direction: 'chart-column' };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ expiree?: string; erreur?: string }> }) {
  const { expiree, erreur } = await searchParams;
  const reelle = connexionReelle();
  const comptesDemo = !reelle && config.comptesDemo;
  return (
    <>
      <EntetePage fil={[{ libelle: 'Accès professionnel' }]} surtitre="Espace sécurisé" titre="Accès professionnel"
        chapo="Réservé aux personnels de l’administration pénitentiaire : greffe, chefs d’établissement et direction." />
      <div className="cj-conteneur p-contenu">
        {expiree && <Alerte type="info" titre="Connexion requise">Connectez-vous pour accéder à l’espace professionnel.</Alerte>}
        {erreur && <Alerte type="erreur" titre="Connexion impossible">La connexion n’a pas abouti. Réessayez.</Alerte>}
        <section className="p-encadre cj-pile" aria-labelledby="titre-agents">
          <span className="cj-carte__icone"><Icone nom="building-2" /></span>
          <h2 id="titre-agents" className="p-titre-encadre">Personnels pénitentiaires</h2>
          <p>Connexion par identifiant et double facteur d’authentification. Votre compte est rattaché à votre établissement.</p>
          <a href={comptesDemo ? '#demonstration' : '/auth/connexion'} className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
            <Icone nom="lock" taille={20} /><span>Se connecter</span>
          </a>
        </section>
        {comptesDemo && (
          <section className="p-encadre cj-pile" aria-labelledby="titre-demo" id="demonstration">
            <h2 id="titre-demo" className="p-titre-encadre">Comptes de démonstration</h2>
            <p>Identités et détenus fictifs. Choisissez un profil : les données sont simulées et réinitialisées toutes les heures.</p>
            <form action={connexionDemo}>
              <div className="cj-grille cj-grille--3">
                {PROFILS_DEMO.map((p) => (
                  <button key={p.id} type="submit" name="profil" value={p.id} className="cj-choix-carte">
                    <span className="cj-choix-carte__icone"><Icone nom={ICONES[p.id] ?? 'user'} /></span>
                    <span>
                      <span className="cj-choix-carte__titre">{p.libelle}</span>
                      <span className="cj-choix-carte__description">{p.nom} — {p.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </form>
          </section>
        )}
        <Alerte type="avertissement" titre="Protégez votre compte">
          Ne communiquez jamais votre mot de passe ni un code reçu par SMS. Toutes les actions sont tracées à votre nom.
        </Alerte>
      </div>
    </>
  );
}
