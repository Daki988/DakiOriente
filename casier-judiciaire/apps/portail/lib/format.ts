/** Dates affichées à l'heure de Libreville, en français (ERG-07 : formats centralisés). */
const FUSEAU = 'Africa/Libreville';

export function dateLongue(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function dateHeure(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date(iso)).replace(':', ' h ');
}
