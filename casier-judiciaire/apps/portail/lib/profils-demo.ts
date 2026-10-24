/**
 * ENV-04 : comptes de démonstration, un par profil. Identités FICTIVES (DON-06).
 * Les trois comptes « principaux » sont proposés en premier ; les autres restent accessibles pour une démonstration complète.
 */
export const PROFILS_DEMO = [
  { id: 'usager', sujet: 'demo-usager', nom: 'Jean-Pierre NDONG MBA', roles: ['R01'], libelle: 'Demandeur', detail: 'Demande, paiement, bulletin, réclamations', principal: true },
  { id: 'agent', sujet: 'demo-agent', nom: 'Clarisse MOUSSAVOU', roles: ['R06'], juridiction: 'TPI-LIBREVILLE', libelle: 'Agent du casier (greffe)', detail: 'File de travail, saisie des condamnations' },
  { id: 'greffier', sujet: 'demo-greffier', nom: 'Hervé OBAME', roles: ['R07'], juridiction: 'TPI-LIBREVILLE', libelle: 'Greffier en chef', detail: 'Validations à deux personnes, révocations', principal: true },
  { id: 'validateur', sujet: 'demo-validateur', nom: 'Jeanne-Marie NDONG', roles: ['R07'], juridiction: 'TPI-LIBREVILLE', libelle: 'Validateur — impression', detail: 'Validation et impression des bulletins au guichet' },
  { id: 'magistrat', sujet: 'demo-magistrat', nom: 'Sylvie NZE', roles: ['R05'], juridiction: 'TPI-LIBREVILLE', libelle: 'Magistrat', detail: 'Validation des paramètres juridiques' },
  { id: 'direction', sujet: 'demo-direction', nom: 'Paul MBADINGA', roles: ['R08'], libelle: 'Direction centrale', detail: 'Pilotage national, suivi d’un dossier de A à Z, tarifs, règles' },
  { id: 'decideur', sujet: 'demo-decideur', nom: 'Marie KOUMBA', roles: ['R09'], libelle: 'Décideur', detail: 'Tableau de bord stratégique' },
  { id: 'comptable', sujet: 'demo-comptable', nom: 'Gisèle NZIENGUI', roles: ['R10'], libelle: 'Comptable', detail: 'Recettes, rapprochement avec le Trésor, export' },
  { id: 'support', sujet: 'demo-support', nom: 'Patrick MOUELE', roles: ['R11'], libelle: 'Support usagers', detail: 'Réclamations des usagers' },
  { id: 'administrateur', sujet: 'demo-admin', nom: 'Rose KOUMBA', roles: ['R13'], libelle: 'Super administrateur', detail: 'Comptes des agents, tarifs', principal: true },
  { id: 'auditeur', sujet: 'demo-auditeur', nom: 'Marc ESSONO', roles: ['R12'], libelle: 'Auditeur', detail: 'Journal d’audit, suivi d’un dossier de A à Z' },
] as const;

export type ProfilDemo = (typeof PROFILS_DEMO)[number];
