/** Moyens de paiement proposés à un payeur : ceux de son pays d'abord (Airtel Money, Moov Money au Gabon), puis les moyens communs. */
export type Moyen = { id: string; label: string; detail?: string; pays?: string[] };

export function moyensPour(liste: Moyen[] | undefined, pays: string | null | undefined): Moyen[] {
  const l = liste ?? [];
  const locaux = l.filter((m) => m.pays && pays && m.pays.includes(pays));
  return [...locaux, ...l.filter((m) => !m.pays)];
}
