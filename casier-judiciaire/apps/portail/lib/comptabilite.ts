/** Libellés et période par défaut du tableau du comptable. */
export const MOYENS_PAIEMENT: Record<string, string> = {
  TRESOR: 'Trésor public', AIRTEL_MONEY: 'Airtel Money', MOOV_MONEY: 'Moov Money', CARTE: 'Carte bancaire',
  OPERATEUR: 'Opérateur de paiement', SIMULATION: 'Paiement simulé',
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const jourLibreville = (decalage = 0) =>
  new Date(Date.now() - decalage * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Africa/Libreville' });

/** Période demandée, ou les 30 derniers jours. */
export function periode(du?: string, au?: string): { du: string; au: string } {
  const fin = au && DATE.test(au) ? au : jourLibreville();
  const debut = du && DATE.test(du) && du <= fin ? du : jourLibreville(29);
  return { du: debut, au: fin };
}
