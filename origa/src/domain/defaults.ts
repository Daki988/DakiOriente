import type { RightAction, RightDomain, Settings } from './types';

const ALL: RightAction[] = ['consulter', 'creer', 'modifier', 'valider', 'administrer'];
const R: RightAction[] = ['consulter'];
const RW: RightAction[] = ['consulter', 'creer', 'modifier'];
const DOMAINS: RightDomain[] = ['fermes', 'elevage', 'intrants', 'sanitaire', 'economie', 'tracabilite', 'pilotage', 'administration'];
const every = (a: RightAction[]) => Object.fromEntries(DOMAINS.map((d) => [d, a])) as Record<RightDomain, RightAction[]>;

/** Matrice des droits par défaut, conforme au tableau des acteurs (§ 3). Modifiable par l'administrateur. */
export const DEFAULT_RIGHTS: Settings['rights'] = {
  eleveur: { fermes: R, elevage: RW, intrants: RW, sanitaire: RW, economie: RW, tracabilite: RW, pilotage: R },
  agent: { fermes: RW, elevage: RW, intrants: RW, sanitaire: RW, economie: RW, tracabilite: RW, pilotage: R },
  dge: { fermes: [...RW, 'valider'], elevage: ['consulter', 'modifier'], intrants: [...RW, 'valider'], sanitaire: R, economie: ['consulter', 'creer'], tracabilite: ['consulter', 'valider'], pilotage: [...RW, 'valider'], administration: R },
  veterinaire: { fermes: R, elevage: R, sanitaire: [...RW, 'valider'], tracabilite: R, pilotage: R },
  bceg: { fermes: R, elevage: R, economie: R, pilotage: R },
  maedr: { pilotage: ['consulter', 'valider'] },
  aninf: { administration: R },
  operateur: { tracabilite: [...RW, 'valider'] },
  admin: every(ALL),
};
export { DOMAINS };

/** Valeurs « Proposé » du cahier des charges, à valider par la DGE et les services vétérinaires. */
export const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  bandReferenceDays: 45,
  weighingEveryDays: 7,
  weighingSample: 50,
  alertDailyMortalityPct: 0.5,
  inputGapPct: 10,
  receptionGapPct: 2,
  formulas: {
    mortalite: 'morts_cumules / mis_en_place * 100',
    viabilite: '100 - mortalite',
    gmq: '(poids_moyen_g - poids_initial_g) / age_jours',
    ic: 'aliment_kg / (poids_vif_sorti_kg + poids_vif_present_kg - poids_poussins_kg)',
    epef: 'viabilite * (poids_moyen_g / 1000) * 100 / (age_jours * ic)',
    occupation: 'mis_en_place / capacite * 100',
  },
  vaccinationCalendar: [
    { day: 1, vaccine: 'Marek / Newcastle (couvoir)' },
    { day: 7, vaccine: 'Gumboro' },
    { day: 14, vaccine: 'Newcastle (rappel)' },
    { day: 24, vaccine: 'Gumboro (rappel)' },
  ],
  clinicalSigns: ['Mortalité soudaine', 'Diarrhée', 'Toux, râles', 'Abattement', "Baisse d'appétit", 'Boiteries', 'Crête violacée', 'Autre'],
  localities: ['Libreville', 'Owendo', 'Ntoum', 'Nkoltang', 'Kango', 'Franceville', 'Moanda', 'Lambaréné', 'Mouila', 'Tchibanga', 'Makokou', 'Koulamoutou', 'Port-Gentil', 'Oyem', 'Bitam'],
  infrastructures: ['Bâtiment d’élevage', 'Magasin d’aliment', 'Forage ou adduction d’eau', 'Groupe électrogène', 'Kit solaire', 'Pédiluve', 'Clôture', 'Incinérateur', 'Chambre froide'],
  inputCatalog: [
    { type: 'poussins', product: "Poussins d'un jour", unit: 'têtes' },
    { type: 'aliment', product: 'Aliment démarrage', unit: 'kg' },
    { type: 'aliment', product: 'Aliment croissance', unit: 'kg' },
    { type: 'aliment', product: 'Aliment finition', unit: 'kg' },
    { type: 'vaccin', product: 'Vaccin Newcastle', unit: 'doses' },
    { type: 'vaccin', product: 'Vaccin Gumboro', unit: 'doses' },
    { type: 'medicament', product: 'Anticoccidien', unit: 'litres' },
    { type: 'medicament', product: 'Vitamines', unit: 'kg' },
  ],
  exitReasons: [
    { k: 'abattoir', label: 'Abattoir' }, { k: 'vente', label: 'Vente à un acheteur' },
    { k: 'vente_directe', label: 'Vente directe (marché)' }, { k: 'autre', label: 'Autre' },
  ],
  chargePosts: ['Poussins', 'Aliment', 'Vétérinaire', 'Main-d’œuvre', 'Énergie', 'Transport', 'Autres'],
  treatmentProducts: [
    { product: 'Anticoccidien (amprolium)', withdrawalDays: 3 },
    { product: 'Enrofloxacine', withdrawalDays: 7 },
    { product: 'Oxytétracycline', withdrawalDays: 7 },
    { product: 'Vitamines et électrolytes', withdrawalDays: 0 },
  ],
  operatorTypes: [{ k: 'abattoir', label: 'Abattoir' }, { k: 'acheteur', label: 'Acheteur' }, { k: 'distributeur', label: 'Distributeur' }],
  farmStatuses: [{ k: 'preparation', label: 'En préparation' }, { k: 'operationnelle', label: 'Opérationnelle' }, { k: 'suspendue', label: 'Suspendue' }],
  biosecurityGrid: ['Pédiluve à l’entrée, désinfectant renouvelé', 'Accès limité et registre des visiteurs', 'Vide sanitaire respecté entre deux bandes', 'Litière sèche et renouvelée', 'Abreuvoirs et mangeoires propres', 'Cadavres éliminés le jour même', 'Pas d’autres volailles ni animaux en contact', 'Tenues et bottes dédiées'],
  rankingWeights: { mortalite: 35, ic: 30, gmq: 20, regularite: 15 },
  reports: { hebdomadaire: true, finBande: true, mensuel: true },
  rights: DEFAULT_RIGHTS,
};

/** Complète des paramètres enregistrés par une version antérieure avec les valeurs par défaut. */
export function withDefaults(s?: Partial<Settings> | null): Settings {
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), formulas: { ...DEFAULT_SETTINGS.formulas, ...(s?.formulas ?? {}) }, rights: { ...DEFAULT_RIGHTS, ...(s?.rights ?? {}) } } as Settings;
}

/** Variables disponibles dans les formules. */
export const FORMULA_VARIABLES = [
  'morts_cumules', 'mis_en_place', 'mortalite', 'viabilite', 'poids_moyen_g', 'poids_initial_g', 'age_jours',
  'aliment_kg', 'poids_vif_sorti_kg', 'poids_vif_present_kg', 'poids_poussins_kg', 'ic', 'capacite', 'effectif_present',
];
