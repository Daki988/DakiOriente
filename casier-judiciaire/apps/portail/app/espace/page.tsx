import { Alerte, Carte } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { exigerSession } from '@/lib/espaces';
import { liensEspace } from '@/lib/navigation-espace';

const DESCRIPTIONS: Record<string, string> = {
  '/espace/demandes': 'Suivez vos demandes, téléchargez vos bulletins scellés et déposez une pièce demandée.',
  '/espace/acces': 'Qui a consulté ou traité vos données, quand et pourquoi. Chaque accès est tracé.',
  '/espace/file': 'Demandes à vérifier : homonymies, pièces, identités non certaines. Délai de 24 heures.',
  '/espace/saisie': 'Enregistrer une décision de condamnation, validée ensuite par le greffier en chef.',
  '/espace/validations': 'Inscriptions saisies par les agents, à valider par une seconde personne (quatre yeux).',
  '/espace/impression': 'Bulletins à valider puis imprimer sur papier sécurisé au guichet, réimpressions motivées.',
  '/espace/pilotage': 'Volumes, délais, délivrance automatique, recettes et vérifications.',
  '/espace/tarifs': 'Historique des tarifs, propositions et validations à date d’effet.',
  '/espace/regles': 'Versions des règles de contenu des bulletins, cas de test et validation.',
  '/espace/audit': 'Journal chaîné de toutes les actions, contrôle d’intégrité.',
  '/espace/reclamations': 'Signaler un problème (paiement, bulletin non reçu, erreur) et suivre la réponse.',
  '/espace/suivi': 'Un dossier de la demande à la vérification par l’employeur : chaque étape, son auteur et son délai.',
  '/espace/comptabilite': 'Recettes par moyen de paiement, rapprochement avec les relevés du Trésor et des opérateurs, export.',
  '/espace/agents': 'Créer les comptes des agents, changer leur rôle, désactiver un compte.',
};

/** DSH-01 : accueil de l'espace connecté, selon le profil. */
export default async function TableauDeBord({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const s = await exigerSession();
  const { refus } = await searchParams;
  const liens = liensEspace(s.roles).filter((l) => l.href !== '/espace');
  return (
    <>
      <TitreEspace titre={`Bonjour ${s.nom.split(' ')[0]}`} chapo="Que souhaitez-vous faire aujourd’hui ?" />
      <MessageAction session={s} />
      {refus && <Alerte type="avertissement" titre="Accès non autorisé">Votre profil ne permet pas d’ouvrir cette page.</Alerte>}
      {s.demo && (
        <Alerte type="info" titre="Session de démonstration">
          Les données affichées sont fictives et réinitialisées régulièrement. Vos actions sont tracées dans un journal simulé.
        </Alerte>
      )}
      {liens.length === 0
        ? <Alerte type="avertissement" titre="Aucun accès">Votre compte n’a pas encore de profil. Contactez l’administrateur de votre organisme.</Alerte>
        : (
          <div className="cj-grille cj-grille--2">
            {liens.map((l) => <Carte key={l.href} titre={l.libelle} href={l.href} icone={l.icone} suite="Ouvrir">{DESCRIPTIONS[l.href]}</Carte>)}
          </div>
        )}
    </>
  );
}
