import type { LienEspace } from '@casier/design-system';

/** Entrées de l'espace selon les rôles (HAB-01) ; le service refuse de toute façon ce que le rôle n'autorise pas. */
const ENTREES: (LienEspace & { roles: string[] })[] = [
  { href: '/espace', libelle: 'Tableau de bord', icone: 'layout-dashboard', roles: [] },
  { href: '/espace/demandes', libelle: 'Mes demandes', icone: 'file-text', roles: ['R01'] },
  { href: '/espace/acces', libelle: 'Accès à mes données', icone: 'eye', roles: ['R01'] },
  { href: '/espace/reclamations', libelle: 'Réclamations', icone: 'mail', roles: ['R01', 'R11'] },
  { href: '/espace/file', libelle: 'File de travail', icone: 'inbox', roles: ['R06'] },
  { href: '/espace/saisie', libelle: 'Saisir une condamnation', icone: 'gavel', roles: ['R06'] },
  { href: '/espace/validations', libelle: 'Validations', icone: 'list-checks', roles: ['R07'] },
  { href: '/espace/impression', libelle: 'Impression des bulletins', icone: 'printer', roles: ['R07'] },
  { href: '/espace/pilotage', libelle: 'Pilotage', icone: 'chart-column', roles: ['R08', 'R09'] },
  { href: '/espace/suivi', libelle: 'Suivi d’un dossier', icone: 'history', roles: ['R08', 'R12'] },
  { href: '/espace/comptabilite', libelle: 'Comptabilité', icone: 'banknote', roles: ['R10'] },
  { href: '/espace/agents', libelle: 'Comptes des agents', icone: 'users', roles: ['R13'] },
  { href: '/espace/tarifs', libelle: 'Tarifs', icone: 'banknote', roles: ['R08', 'R13'] },
  { href: '/espace/regles', libelle: 'Paramètres juridiques', icone: 'scale', roles: ['R05', 'R08'] },
  { href: '/espace/audit', libelle: 'Journal d’audit', icone: 'shield-check', roles: ['R12'] },
];

export const liensEspace = (roles: string[]): LienEspace[] =>
  ENTREES.filter((e) => e.roles.length === 0 || e.roles.some((r) => roles.includes(r))).map(({ roles: _r, ...l }) => l);

export const LIBELLES_ROLES: Record<string, string> = {
  R01: 'Usager', R05: 'Magistrat', R06: 'Agent du casier', R07: 'Greffier en chef', R08: 'Direction centrale',
  R09: 'Décideur', R10: 'Comptable', R11: 'Support usagers', R12: 'Auditeur', R13: 'Super administrateur',
};

export const libelleProfil = (roles: string[]) => roles.map((r) => LIBELLES_ROLES[r] ?? r).join(', ') || 'Sans profil';
