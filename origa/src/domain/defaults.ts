import type { Settings } from './types';

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
};

/** Variables disponibles dans les formules. */
export const FORMULA_VARIABLES = [
  'morts_cumules', 'mis_en_place', 'mortalite', 'viabilite', 'poids_moyen_g', 'poids_initial_g', 'age_jours',
  'aliment_kg', 'poids_vif_sorti_kg', 'poids_vif_present_kg', 'poids_poussins_kg', 'ic', 'capacite', 'effectif_present',
];
