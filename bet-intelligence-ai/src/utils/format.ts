const numberFr = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const pctFr = new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateFr = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
const longDateFr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFr = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dateTimeFr = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Cote décimale au format français : 1,45 */
export const formatOdds = (odds: number): string => numberFr.format(odds);
export const formatNumber = (n: number, decimals = 2): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
export const formatInt = (n: number): string => intFr.format(n);
/** Probabilité 0–1 au format « 78,4 % ». */
export const formatPct = (p: number): string => pctFr.format(p);
/** Montant en FCFA fictifs. */
export const formatFcfa = (amount: number): string => `${intFr.format(Math.round(amount))} FCFA`;
export const formatDate = (iso: string): string => dateFr.format(new Date(iso));
export const formatLongDate = (d: Date): string => longDateFr.format(d);
export const formatTime = (iso: string): string => timeFr.format(new Date(iso));
export const formatDateTime = (iso: string): string => dateTimeFr.format(new Date(iso));

/** Clé de jour locale AAAA-MM-JJ (pour les filtres par date). */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
