import 'server-only';
import { randomUUID } from 'node:crypto';

import type { Session } from './session';
import type { Detenu, Etablissement, MotifLiberation, Mouvement, NouvelEcrou, TableauDeBord, TitreDetention, TypeMouvement } from './types';

/**
 * Démonstration : registre pénitentiaire FICTIF en mémoire, mêmes règles que le service métier (périmètre de l'établissement,
 * mouvement autorisé par une autre personne, aucun écrou sans titre). Réinitialisé toutes les heures.
 */
export const ETABLISSEMENTS: Etablissement[] = [
  { code: 'LBV-PC-01', nom: 'Prison centrale de Libreville', ville: 'Libreville', province: 'Estuaire', type: 'PRISON_CENTRALE', capacite: 500 },
  { code: 'FCV-CP-01', nom: 'Centre pénitentiaire de Franceville', ville: 'Franceville', province: 'Haut-Ogooué', type: 'CENTRE_PENITENTIAIRE', capacite: 250 },
  { code: 'POG-MA-01', nom: 'Maison d’arrêt de Port-Gentil', ville: 'Port-Gentil', province: 'Ogooué-Maritime', type: 'MAISON_ARRET', capacite: 200 },
  { code: 'OYM-MA-01', nom: 'Maison d’arrêt d’Oyem', ville: 'Oyem', province: 'Woleu-Ntem', type: 'MAISON_ARRET', capacite: 150 },
  { code: 'MUI-CP-01', nom: 'Centre pénitentiaire de Mouila', ville: 'Mouila', province: 'Ngounié', type: 'CENTRE_PENITENTIAIRE', capacite: 150 },
  { code: 'LBQ-MA-01', nom: 'Maison d’arrêt de Lambaréné', ville: 'Lambaréné', province: 'Moyen-Ogooué', type: 'MAISON_ARRET', capacite: 120 },
];

/** Populations fictives des autres établissements (le détail n'est donné que pour Libreville). */
const POPULATION_AUTRES: Record<string, number> = { 'FCV-CP-01': 231, 'POG-MA-01': 214, 'OYM-MA-01': 118, 'MUI-CP-01': 96, 'LBQ-MA-01': 131 };
const POPULATION_LBV_HORS_DETAIL = 612;

const jour = (decalage: number) => new Date(Date.now() + decalage * 86_400_000).toISOString().slice(0, 10);
const heure = (decalageHeures: number) => new Date(Date.now() + decalageHeures * 3_600_000).toISOString();
const ajouterMois = (iso: string, mois: number, moinsJours = 0) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + mois);
  d.setUTCDate(d.getUTCDate() - moinsJours);
  return d.toISOString().slice(0, 10);
};

type Etat = { detenus: (Detenu & { ecrouePar: string })[]; mouvements: (Omit<Mouvement, 'demandeParMoi' | 'numeroEcrou' | 'nomDetenu'> & { demandePar: string })[]; creeLe: number; rang: number };

function detenu(n: number, nom: string, prenoms: string, naissance: string, lieu: string, statut: 'PREVENU' | 'CONDAMNE', titre: TitreDetention,
  ref: string, infraction: string, ecrouIlYa: number, dureeMois: number | null, quartier: string, etab = 'LBV-PC-01'): Detenu & { ecrouePar: string } {
  const dateEcrou = jour(-ecrouIlYa);
  return {
    id: `demo-det-${n}`, numeroEcrou: `${etab.slice(0, 3)}-2026-${String(n).padStart(5, '0')}`, nom, prenoms, dateNaissance: naissance, lieuNaissance: lieu,
    nationalite: 'Gabonaise', etablissement: etab, quartier, statut, titreDetention: titre, referenceTitre: ref, juridiction: 'Tribunal de première instance de Libreville',
    infraction, dateEcrou, dateDebutPeine: statut === 'CONDAMNE' ? dateEcrou : null, dureePeineMois: dureeMois, reductionJours: 0,
    dateLiberationPrevue: statut === 'CONDAMNE' && dureeMois ? ajouterMois(dateEcrou, dureeMois) : null, dateLiberation: null, motifLiberation: null,
    ecroueLe: `${dateEcrou}T09:00:00Z`, ecrouePar: 'demo-greffe-pen',
  };
}

function initial(): Etat {
  const detenus = [
    detenu(101, 'MOUNGUENGUI FICTIF', 'Rodrigue', '1991-04-12', 'Libreville', 'CONDAMNE', 'JUGEMENT', 'JUG-2025-0811', 'Vol avec effraction', 355, 12, 'Quartier A'),
    detenu(102, 'ONDO FICTIF', 'Blaise', '1986-11-02', 'Oyem', 'CONDAMNE', 'JUGEMENT', 'JUG-2025-0954', 'Abus de confiance', 170, 6, 'Quartier B'),
    detenu(103, 'NDONG FICTIF', 'Steeve', '1999-07-21', 'Libreville', 'PREVENU', 'MANDAT_DEPOT', 'MD-2026-0331', 'Trafic de stupéfiants', 46, null, 'Quartier C'),
    detenu(104, 'KOUMBA FICTIF', 'Arnaud', '1984-01-30', 'Lambaréné', 'CONDAMNE', 'ARRET', 'ARR-2024-0217', 'Homicide involontaire', 700, 36, 'Quartier A'),
    detenu(105, 'MBADINGA FICTIF', 'Cédric', '1995-03-08', 'Port-Gentil', 'PREVENU', 'MANDAT_DEPOT', 'MD-2026-0402', 'Escroquerie', 12, null, 'Quartier C'),
    detenu(106, 'OBAME FICTIF', 'Fabrice', '1979-09-15', 'Bitam', 'CONDAMNE', 'JUGEMENT', 'JUG-2026-0102', 'Coups et blessures volontaires', 160, 8, 'Quartier B'),
    detenu(107, 'BOUANGA FICTIF', 'Guy-Roger', '1990-12-24', 'Mouila', 'CONDAMNE', 'JUGEMENT', 'JUG-2025-0703', 'Recel', 290, 10, 'Quartier B'),
    detenu(108, 'NZAMBA FICTIF', 'Ludovic', '2001-05-05', 'Libreville', 'PREVENU', 'MANDAT_DEPOT', 'MD-2026-0415', 'Vol aggravé', 5, null, 'Quartier C'),
    detenu(109, 'EYI FICTIF', 'Prisca', '1993-08-19', 'Franceville', 'CONDAMNE', 'JUGEMENT', 'JUG-2025-1022', 'Faux et usage de faux', 200, 24, 'Quartier femmes'),
    detenu(110, 'MAGANGA FICTIF', 'Herman', '1988-02-14', 'Tchibanga', 'CONDAMNE', 'CONTRAINTE', 'CJ-2026-0007', 'Contrainte judiciaire (amende impayée)', 20, 2, 'Quartier B'),
  ];
  const mouvements: Etat['mouvements'] = [
    { id: 'demo-mvt-1', detenuId: 'demo-det-103', type: 'EXTRACTION_JUDICIAIRE', origine: 'LBV-PC-01', destination: 'Tribunal de première instance de Libreville',
      motif: 'Audience devant le juge d’instruction', prevuLe: heure(3), retourPrevu: heure(7), statut: 'DEMANDE', demandePar: 'demo-greffe-pen', departLe: null, retourLe: null, observation: null },
    { id: 'demo-mvt-2', detenuId: 'demo-det-106', type: 'EXTRACTION_MEDICALE', origine: 'LBV-PC-01', destination: 'CHU de Libreville',
      motif: 'Consultation spécialisée', prevuLe: heure(1), retourPrevu: heure(5), statut: 'AUTORISE', demandePar: 'demo-greffe-pen', departLe: null, retourLe: null, observation: null },
    { id: 'demo-mvt-3', detenuId: 'demo-det-109', type: 'TRANSFERT', origine: 'LBV-PC-01', destination: 'FCV-CP-01',
      motif: 'Rapprochement familial', prevuLe: heure(48), retourPrevu: null, statut: 'DEMANDE', demandePar: 'demo-greffe-pen', departLe: null, retourLe: null, observation: null },
    { id: 'demo-mvt-4', detenuId: 'demo-det-104', type: 'EXTRACTION_MEDICALE', origine: 'LBV-PC-01', destination: 'Hôpital d’instruction des armées',
      motif: 'Examens', prevuLe: heure(-2), retourPrevu: heure(2), statut: 'EN_COURS', demandePar: 'demo-greffe-pen', departLe: heure(-2), retourLe: null, observation: null },
  ];
  return { detenus, mouvements, creeLe: Date.now(), rang: 111 };
}

const etat: Etat = ((globalThis as { __penDemo?: Etat }).__penDemo ??= initial());
function rafraichir() {
  if (Date.now() - etat.creeLe > 3_600_000) Object.assign(etat, initial());
}

const peutGerer = (s: Session) => s.roles.includes('R16');
const peutDecider = (s: Session) => s.roles.includes('R17');
const national = (s: Session) => s.roles.includes('R18');
const perimetre = (s: Session) => (national(s) ? null : s.juridiction ?? '—');
const visible = (s: Session, etab: string) => perimetre(s) === null || perimetre(s) === etab;

function vueMouvement(s: Session, m: Etat['mouvements'][number]): Mouvement {
  const d = etat.detenus.find((x) => x.id === m.detenuId)!;
  const { demandePar, ...reste } = m;
  return { ...reste, numeroEcrou: d.numeroEcrou, nomDetenu: `${d.nom} ${d.prenoms}`, demandeParMoi: demandePar === s.sujet };
}
const sansAgent = ({ ecrouePar: _e, ...d }: Detenu & { ecrouePar: string }): Detenu => d;
const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Libreville' });

export const demo = {
  tableauDeBord(s: Session): TableauDeBord {
    rafraichir();
    const p = perimetre(s);
    const presents = etat.detenus.filter((d) => d.statut !== 'LIBERE' && visible(s, d.etablissement));
    const etabs = ETABLISSEMENTS.filter((e) => p === null || e.code === p).map((e) => {
      const detail = etat.detenus.filter((d) => d.statut !== 'LIBERE' && d.etablissement === e.code).length;
      const population = detail + (e.code === 'LBV-PC-01' ? POPULATION_LBV_HORS_DETAIL : POPULATION_AUTRES[e.code] ?? 0);
      return { code: e.code, nom: e.nom, ville: e.ville, capacite: e.capacite, population, tauxOccupation: Math.round((population * 100) / e.capacite) };
    });
    const dans30 = jour(30);
    const mvts = etat.mouvements.filter((m) => p === null || m.origine === p);
    const debut = aujourdhui();
    return {
      etablissements: etabs,
      prevenus: presents.filter((d) => d.statut === 'PREVENU').length, condamnes: presents.filter((d) => d.statut === 'CONDAMNE').length,
      liberationsSous30Jours: presents.filter((d) => d.statut === 'CONDAMNE' && d.dateLiberationPrevue && d.dateLiberationPrevue >= debut && d.dateLiberationPrevue <= dans30).length,
      mouvementsAAutoriser: mvts.filter((m) => m.statut === 'DEMANDE').length,
      mouvementsDuJour: mvts.filter((m) => (m.statut === 'AUTORISE' || m.statut === 'EN_COURS') && m.prevuLe.slice(0, 10) === debut).length,
      enDehors: mvts.filter((m) => m.statut === 'EN_COURS').length,
      prochainesLiberations: presents.filter((d) => d.statut === 'CONDAMNE' && d.dateLiberationPrevue && d.dateLiberationPrevue >= debut)
        .sort((a, b) => a.dateLiberationPrevue!.localeCompare(b.dateLiberationPrevue!)).slice(0, 10).map(sansAgent),
    };
  },
  registre(s: Session, recherche: string, avecLiberes: boolean): Detenu[] {
    rafraichir();
    const q = recherche.trim().toUpperCase();
    return etat.detenus.filter((d) => visible(s, d.etablissement) && (avecLiberes || d.statut !== 'LIBERE')
      && (!q || d.nom.includes(q) || d.prenoms.toUpperCase().includes(q) || d.numeroEcrou.includes(q)))
      .sort((a, b) => Number(a.statut === 'LIBERE') - Number(b.statut === 'LIBERE') || a.nom.localeCompare(b.nom)).map(sansAgent);
  },
  fiche(s: Session, id: string): { detenu: Detenu; mouvements: Mouvement[] } | null {
    const d = etat.detenus.find((x) => x.id === id);
    if (!d || !visible(s, d.etablissement)) return null;
    return { detenu: sansAgent(d), mouvements: etat.mouvements.filter((m) => m.detenuId === id).sort((a, b) => b.prevuLe.localeCompare(a.prevuLe)).map((m) => vueMouvement(s, m)) };
  },
  ecrouer(s: Session, e: NouvelEcrou): Detenu | string {
    if (!peutGerer(s) || !s.juridiction) return 'Votre profil ne permet pas cette action.';
    if (!e.nom || !e.prenoms || !e.dateNaissance || !e.lieuNaissance) return 'Nom, prénoms, date et lieu de naissance sont obligatoires.';
    if (!e.referenceTitre || !e.juridiction || !e.infraction) return 'Le titre de détention (type, référence, juridiction) et l’infraction sont obligatoires : aucun écrou sans titre.';
    const dateEcrou = e.dateEcrou || aujourdhui();
    if (dateEcrou > aujourdhui()) return 'La date d’écrou ne peut pas être dans le futur.';
    const condamne = e.titreDetention !== 'MANDAT_DEPOT';
    if (condamne && !(e.dureePeineMois && e.dureePeineMois > 0)) return 'Indiquez la durée de la peine en mois pour un écrou sur condamnation.';
    const debut = condamne ? e.dateDebutPeine || dateEcrou : null;
    const n = etat.rang++;
    const d: Detenu & { ecrouePar: string } = {
      id: `demo-det-${randomUUID().slice(0, 8)}`, numeroEcrou: `${s.juridiction.slice(0, 3)}-2026-${String(n).padStart(5, '0')}`, nom: e.nom.trim().toUpperCase(),
      prenoms: e.prenoms.trim(), dateNaissance: e.dateNaissance, lieuNaissance: e.lieuNaissance.trim(), nationalite: e.nationalite || 'Gabonaise',
      etablissement: s.juridiction, quartier: e.quartier, statut: condamne ? 'CONDAMNE' : 'PREVENU', titreDetention: e.titreDetention,
      referenceTitre: e.referenceTitre.trim(), juridiction: e.juridiction.trim(), infraction: e.infraction.trim(), dateEcrou, dateDebutPeine: debut,
      dureePeineMois: condamne ? e.dureePeineMois : null, reductionJours: 0, dateLiberationPrevue: condamne && debut ? ajouterMois(debut, e.dureePeineMois!) : null,
      dateLiberation: null, motifLiberation: null, ecroueLe: new Date().toISOString(), ecrouePar: s.sujet,
    };
    etat.detenus.push(d);
    return sansAgent(d);
  },
  condamner(s: Session, id: string, titre: TitreDetention, reference: string, juridiction: string, debut: string | null, dureeMois: number): string | null {
    if (!peutGerer(s)) return 'Votre profil ne permet pas cette action.';
    const d = etat.detenus.find((x) => x.id === id);
    if (!d || !visible(s, d.etablissement)) return 'Détenu introuvable.';
    if (d.statut !== 'PREVENU') return 'Seul un prévenu peut recevoir une condamnation.';
    if (titre === 'MANDAT_DEPOT' || !reference || !juridiction || !(dureeMois > 0)) return 'Indiquez le jugement ou l’arrêt (référence, juridiction) et la durée de la peine.';
    const depart = debut || d.dateEcrou;
    Object.assign(d, { statut: 'CONDAMNE', titreDetention: titre, referenceTitre: reference, juridiction, dateDebutPeine: depart, dureePeineMois: dureeMois,
      dateLiberationPrevue: ajouterMois(depart, dureeMois, d.reductionJours) });
    return null;
  },
  liberer(s: Session, id: string, motif: MotifLiberation, precision: string | null): string | null {
    if (!peutDecider(s)) return 'Seul le chef d’établissement prononce une libération.';
    const d = etat.detenus.find((x) => x.id === id);
    if (!d || !visible(s, d.etablissement)) return 'Détenu introuvable.';
    if (d.statut === 'LIBERE') return 'Ce détenu est déjà libéré.';
    if (etat.mouvements.some((m) => m.detenuId === id && m.statut === 'EN_COURS')) return 'Le détenu est actuellement hors de l’établissement : enregistrez d’abord son retour.';
    Object.assign(d, { statut: 'LIBERE', dateLiberation: aujourdhui(), motifLiberation: motif + (precision ? ` — ${precision}` : '') });
    etat.mouvements.filter((m) => m.detenuId === id && (m.statut === 'DEMANDE' || m.statut === 'AUTORISE'))
      .forEach((m) => Object.assign(m, { statut: 'ANNULE', observation: 'Annulé : détenu libéré' }));
    return null;
  },
  mouvements(s: Session): Mouvement[] {
    rafraichir();
    return etat.mouvements.filter((m) => ['DEMANDE', 'AUTORISE', 'EN_COURS'].includes(m.statut) && (perimetre(s) === null || m.origine === perimetre(s)))
      .sort((a, b) => a.prevuLe.localeCompare(b.prevuLe)).map((m) => vueMouvement(s, m));
  },
  demanderMouvement(s: Session, detenuId: string, type: TypeMouvement, destination: string, motif: string, prevuLe: string, retourPrevu: string | null): string | null {
    if (!peutGerer(s)) return 'Votre profil ne permet pas cette action.';
    const d = etat.detenus.find((x) => x.id === detenuId);
    if (!d || !visible(s, d.etablissement)) return 'Détenu introuvable.';
    if (d.statut === 'LIBERE') return 'Ce détenu est libéré.';
    if (!destination || !motif || !prevuLe) return 'Type, destination, motif et date du mouvement sont obligatoires.';
    if (type === 'TRANSFERT' && (!ETABLISSEMENTS.some((e) => e.code === destination) || destination === d.etablissement)) return 'Un transfert se fait vers un autre établissement du réseau.';
    if (type === 'PERMISSION' && d.statut !== 'CONDAMNE') return 'Une permission de sortir ne concerne qu’un condamné ; un prévenu relève du magistrat saisi.';
    if (retourPrevu && retourPrevu < prevuLe) return 'Le retour prévu précède le départ.';
    etat.mouvements.push({ id: `demo-mvt-${randomUUID().slice(0, 8)}`, detenuId, type, origine: d.etablissement, destination, motif, prevuLe, retourPrevu,
      statut: 'DEMANDE', demandePar: s.sujet, departLe: null, retourLe: null, observation: null });
    return null;
  },
  decider(s: Session, id: string, autoriser: boolean, observation: string | null): string | null {
    if (!peutDecider(s)) return 'Seul le chef d’établissement autorise un mouvement.';
    const m = etat.mouvements.find((x) => x.id === id);
    if (!m || !visible(s, m.origine)) return 'Mouvement introuvable.';
    if (m.statut !== 'DEMANDE') return 'Ce mouvement n’attend plus de décision.';
    if (m.demandePar === s.sujet) return 'Une autre personne que le demandeur doit autoriser ce mouvement.';
    if (!autoriser && !observation) return 'Le motif du refus est obligatoire.';
    Object.assign(m, { statut: autoriser ? 'AUTORISE' : 'REFUSE', observation });
    return null;
  },
  executer(s: Session, id: string, etape: 'DEPART' | 'RETOUR' | 'ANNULATION'): string | null {
    if (!peutGerer(s)) return 'Votre profil ne permet pas cette action.';
    const m = etat.mouvements.find((x) => x.id === id);
    if (!m || !visible(s, m.origine)) return 'Mouvement introuvable.';
    const maintenant = new Date().toISOString();
    if (etape === 'DEPART') {
      if (m.statut !== 'AUTORISE') return 'Le mouvement doit être autorisé avant le départ.';
      Object.assign(m, { statut: 'EN_COURS', departLe: maintenant });
      if (m.type === 'TRANSFERT') demo.terminer(m, maintenant);
    } else if (etape === 'RETOUR') {
      if (m.statut !== 'EN_COURS') return 'Le détenu n’est pas sorti pour ce mouvement.';
      demo.terminer(m, maintenant);
    } else {
      if (m.statut !== 'DEMANDE' && m.statut !== 'AUTORISE') return 'Un mouvement commencé ne s’annule pas.';
      m.statut = 'ANNULE';
    }
    return null;
  },
  terminer(m: Etat['mouvements'][number], le: string) {
    Object.assign(m, { statut: 'TERMINE', retourLe: le });
    if (m.type === 'TRANSFERT') etat.detenus.find((d) => d.id === m.detenuId)!.etablissement = m.destination;
  },
};
