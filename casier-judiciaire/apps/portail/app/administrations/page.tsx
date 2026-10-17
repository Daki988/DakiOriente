import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Carte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Administrations et employeurs', description: 'Bulletin n°2 pour les organismes habilités ; vérification d’un bulletin remis par un candidat.' };

/** PUB-05 : bulletin n°2 et habilitation ; un employeur vérifie un bulletin remis, il ne le demande pas. */
export default function Administrations() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Administrations et employeurs' }]} surtitre="Professionnels" titre="Administrations et employeurs"
        chapo="Les organismes habilités demandent le bulletin n°2 dans leur espace sécurisé. Les employeurs vérifient le bulletin n°3 que leur remet un candidat." />
      <div className="cj-conteneur p-contenu">
        <div className="cj-grille cj-grille--2">
          <section className="p-encadre cj-pile" aria-labelledby="titre-employeurs">
            <span className="cj-carte__icone"><Icone nom="building-2" /></span>
            <h2 id="titre-employeurs" className="p-titre-encadre">Vous êtes employeur</h2>
            <p>
              Vous ne demandez pas le bulletin de votre candidat : c’est lui qui le demande et vous le remet. Vous vérifiez ensuite qu’il est authentique
              et valable, gratuitement et sans compte.
            </p>
            <Link href="/verifier" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
              <Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span>
            </Link>
          </section>
          <section className="p-encadre cj-pile" aria-labelledby="titre-administrations">
            <span className="cj-carte__icone"><Icone nom="landmark" /></span>
            <h2 id="titre-administrations" className="p-titre-encadre">Vous êtes une administration habilitée</h2>
            <p>
              Le bulletin n°2 est réservé aux administrations et organismes que la loi autorise, pour des finalités précises
              (recrutement dans la fonction publique, autorisations, etc.).
            </p>
            <Link href="/connexion#administrations" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
              <Icone nom="log-in" taille={20} /><span>Accéder à l’espace administration</span>
            </Link>
          </section>
        </div>
        <section aria-labelledby="titre-b2" className="cj-pile">
          <h2 id="titre-b2" className="p-titre-section">Le bulletin n°2, en trois étapes</h2>
          <div className="cj-grille cj-grille--3">
            <Carte titre="1. Connexion sécurisée" icone="lock">L’agent habilité se connecte avec son double facteur et choisit la finalité autorisée à son organisme.</Carte>
            <Carte titre="2. Identité de la personne" icone="user-check">Il saisit l’identité de la personne ; le rapprochement suit les mêmes règles que pour le bulletin n°3.</Carte>
            <Carte titre="3. Bulletin scellé" icone="file-check">Le bulletin est déposé dans l’espace de l’administration. Chaque consultation est journalisée avec sa finalité.</Carte>
          </div>
        </section>
        <Alerte type="info" titre="Obtenir l’habilitation de votre organisme">
          La demande d’habilitation est instruite par le Ministère de la Justice, Garde des Sceaux, chargé des Droits humains, qui fixe les finalités autorisées et désigne le gestionnaire des comptes de l’organisme.{' '}
          <Link href="/contact">Prendre contact</Link>
        </Alerte>
      </div>
    </>
  );
}
