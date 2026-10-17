import type { CodeProfil } from './contenu';

/**
 * Règles de saisie de la demande de bulletin n°3, partagées par le navigateur et le serveur (le serveur revalide toujours).
 * Messages qui disent quoi corriger (ERG-05). Aucune règle juridique ici : seulement la forme des données.
 */
export type DonneesDemande = {
  profil: CodeProfil | '';
  nom: string; prenoms: string; dateNaissance: string; lieuNaissance: string; paysNaissance: string;
  nomPere: string; nomMere: string; nationalite: string; numeroCnie: string; numeroPasseport: string;
  telephone: string; email: string;
  consentement: boolean;
  modePaiement: 'AIRTEL_MONEY' | 'MOOV_MONEY' | 'CARTE' | '';
};

export type Erreurs = Partial<Record<keyof DonneesDemande, string>>;

export const DONNEES_VIDES: DonneesDemande = {
  profil: '', nom: '', prenoms: '', dateNaissance: '', lieuNaissance: '', paysNaissance: '', nomPere: '', nomMere: '',
  nationalite: '', numeroCnie: '', numeroPasseport: '', telephone: '+241 ', email: '', consentement: false, modePaiement: '',
};

export const PROFILS_VALIDES: CodeProfil[] = ['GABONAIS_NE_AU_GABON', 'GABONAIS_NE_A_L_ETRANGER', 'ETRANGER_RESIDENT'];

const NOM = /^\p{L}[\p{L}'’ .-]{0,79}$/u;
const LIEU = /^\p{L}[\p{L}0-9'’ ().,-]{0,99}$/u;
const PIECE = /^[A-Za-z0-9-]{5,20}$/;
const TELEPHONE = /^\+?[0-9]{8,15}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** « AAAA-M-J » saisi en trois champs → « AAAA-MM-JJ », ou null si la date n'existe pas (31 février, etc.). */
export function normaliserDate(v: string): string | null {
  const [a, m, j] = v.split('-');
  if (!/^\d{4}$/.test(a ?? '') || !/^\d{1,2}$/.test(m ?? '') || !/^\d{1,2}$/.test(j ?? '')) return null;
  const iso = `${a}-${m.padStart(2, '0')}-${j.padStart(2, '0')}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}

export const neAilleurs = (p: DonneesDemande['profil']) => p === 'GABONAIS_NE_A_L_ETRANGER' || p === 'ETRANGER_RESIDENT';

export function verifierProfil(d: DonneesDemande): Erreurs {
  return PROFILS_VALIDES.includes(d.profil as CodeProfil) ? {} : { profil: 'Choisissez la situation qui vous correspond.' };
}

export function verifierIdentite(d: DonneesDemande, aujourdHui = new Date()): Erreurs {
  const e: Erreurs = {};
  if (!d.nom.trim()) e.nom = 'Saisissez votre nom de famille, tel qu’il figure sur votre acte de naissance.';
  else if (!NOM.test(d.nom.trim())) e.nom = 'Le nom ne peut contenir que des lettres, des espaces, des tirets et des apostrophes.';
  if (!d.prenoms.trim()) e.prenoms = 'Saisissez tous vos prénoms, dans l’ordre de l’acte de naissance.';
  else if (!NOM.test(d.prenoms.trim())) e.prenoms = 'Les prénoms ne peuvent contenir que des lettres, des espaces, des tirets et des apostrophes.';
  const date = normaliserDate(d.dateNaissance);
  if (!d.dateNaissance.split('-').every(Boolean)) e.dateNaissance = 'Saisissez le jour, le mois et l’année de naissance, par exemple 14 03 1990.';
  else if (!date) e.dateNaissance = 'Cette date n’existe pas. Vérifiez le jour et le mois.';
  else {
    const jour = new Date(`${date}T00:00:00Z`);
    if (jour > aujourdHui || jour.getUTCFullYear() < 1900) e.dateNaissance = 'La date de naissance doit être une date passée, postérieure à 1900.';
  }
  if (!d.lieuNaissance.trim()) e.lieuNaissance = 'Saisissez la ville ou la commune de naissance.';
  else if (!LIEU.test(d.lieuNaissance.trim())) e.lieuNaissance = 'Le lieu de naissance contient des caractères non autorisés.';
  if (neAilleurs(d.profil) && !d.paysNaissance.trim()) e.paysNaissance = 'Saisissez le pays de naissance.';
  for (const champ of ['nomPere', 'nomMere'] as const) {
    if (d[champ].trim() && !NOM.test(d[champ].trim())) e[champ] = 'Ce nom ne peut contenir que des lettres, des espaces, des tirets et des apostrophes.';
  }
  if (d.profil === 'ETRANGER_RESIDENT') {
    if (!d.nationalite.trim()) e.nationalite = 'Saisissez votre nationalité.';
    if (!PIECE.test(d.numeroPasseport.trim())) e.numeroPasseport = 'Saisissez le numéro de votre passeport ou de votre titre de séjour (5 à 20 lettres ou chiffres).';
  } else if (d.numeroCnie.trim() && !PIECE.test(d.numeroCnie.trim())) {
    e.numeroCnie = 'Le numéro de CNIE compte 5 à 20 lettres ou chiffres, sans espace.';
  }
  return e;
}

export function verifierCoordonnees(d: DonneesDemande): Erreurs {
  const e: Erreurs = {};
  const tel = d.telephone.replace(/[\s.-]/g, '');
  if (!TELEPHONE.test(tel) || tel === '+241') e.telephone = 'Saisissez un numéro de téléphone mobile, par exemple +241 77 00 00 00. Le code de suivi y sera envoyé.';
  if (d.email.trim() && !EMAIL.test(d.email.trim())) e.email = 'L’adresse e-mail doit avoir la forme nom@exemple.ga, ou laissez ce champ vide.';
  return e;
}

export function verifierAttestation(d: DonneesDemande): Erreurs {
  return d.consentement ? {} : { consentement: 'Cochez la case pour attester que ces informations vous concernent et sont exactes.' };
}

export function verifierPaiement(d: DonneesDemande): Erreurs {
  return ['AIRTEL_MONEY', 'MOOV_MONEY', 'CARTE'].includes(d.modePaiement) ? {} : { modePaiement: 'Choisissez un moyen de paiement.' };
}

/** Contrôle complet, appelé par le serveur avant tout dépôt. */
export function verifierTout(d: DonneesDemande): Erreurs {
  return { ...verifierProfil(d), ...verifierIdentite(d), ...verifierCoordonnees(d), ...verifierAttestation(d), ...verifierPaiement(d) };
}
