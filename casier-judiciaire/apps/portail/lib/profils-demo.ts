/** ENV-04 : comptes de démonstration, un par profil. Identités FICTIVES (DON-06). */
export const PROFILS_DEMO = [
  { id: 'usager', sujet: 'demo-usager', nom: 'Jean-Pierre NDONG MBA', roles: ['R01'], libelle: 'Usager', detail: 'Demandes, bulletins, pièces' },
  { id: 'agent', sujet: 'demo-agent', nom: 'Clarisse MOUSSAVOU', roles: ['R06'], juridiction: 'TPI-LIBREVILLE', libelle: 'Agent du casier (greffe)', detail: 'File de travail, saisie des condamnations' },
  { id: 'greffier', sujet: 'demo-greffier', nom: 'Hervé OBAME', roles: ['R07'], juridiction: 'TPI-LIBREVILLE', libelle: 'Greffier en chef', detail: 'Validations à quatre yeux, révocations' },
  { id: 'validateur', sujet: 'demo-validateur', nom: 'Jeanne-Marie NDONG', roles: ['R07'], juridiction: 'TPI-LIBREVILLE', libelle: 'Validateur — impression', detail: 'Validation et impression des bulletins au guichet' },
  { id: 'magistrat', sujet: 'demo-magistrat', nom: 'Sylvie NZE', roles: ['R05'], juridiction: 'TPI-LIBREVILLE', libelle: 'Magistrat', detail: 'Validation des paramètres juridiques' },
  { id: 'direction', sujet: 'demo-direction', nom: 'Paul MBADINGA', roles: ['R08'], libelle: 'Direction centrale', detail: 'Pilotage national, tarifs, règles' },
  { id: 'decideur', sujet: 'demo-decideur', nom: 'Marie KOUMBA', roles: ['R09'], libelle: 'Décideur', detail: 'Tableau de bord stratégique' },
  { id: 'administrateur', sujet: 'demo-admin', nom: 'Rose KOUMBA', roles: ['R13'], libelle: 'Super administrateur', detail: 'Tarifs, paramétrage' },
  { id: 'auditeur', sujet: 'demo-auditeur', nom: 'Marc ESSONO', roles: ['R12'], libelle: 'Auditeur', detail: 'Journal d’audit, intégrité' },
] as const;

export type ProfilDemo = (typeof PROFILS_DEMO)[number];
