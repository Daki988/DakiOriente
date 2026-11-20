// Calcul des échéances d'un rappel de paiement (loyer, scolarité) : fonctions pures, testées dans tests/rappels.test.ts.
export const DELAIS = [2, 3, 5, 7] as const;
export const FREQUENCES = { mensuel: 1, trimestriel: 3, semestriel: 6, annuel: 12, unique: 0 } as const;
export type Frequence = keyof typeof FREQUENCES;

const iso = (a: number, m: number, j: number) => `${a}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
const finDeMois = (a: number, m: number) => new Date(Date.UTC(a, m, 0)).getUTCDate(); // m de 1 à 12

/** Date AAAA-MM-JJ de la n-ième échéance (n = 0 : la première), le même jour du mois, ramené à la fin des mois courts. */
export function echeance(premiere: string, frequence: Frequence, n: number) {
  const [a, m, j] = premiere.split("-").map(Number);
  const pas = FREQUENCES[frequence];
  const total = m - 1 + pas * n;
  const an = a + Math.floor(total / 12), mois = (total % 12) + 1;
  return iso(an, mois, Math.min(j, finDeMois(an, mois)));
}

/** Prochaine échéance à partir d'aujourd'hui (incluse), ou null si toutes sont passées. */
export function prochaineEcheance(r: { premiereEcheance: string; frequence: string; finLe?: string | null }, aujourdhui: string) {
  const f = (r.frequence in FREQUENCES ? r.frequence : "mensuel") as Frequence;
  if (f === "unique") return r.premiereEcheance >= aujourdhui && (!r.finLe || r.premiereEcheance <= r.finLe) ? r.premiereEcheance : null;
  for (let n = 0; n < 1200; n++) {
    const d = echeance(r.premiereEcheance, f, n);
    if (r.finLe && d > r.finLe) return null;
    if (d >= aujourdhui) return d;
  }
  return null;
}

/** Nombre de jours entre deux dates AAAA-MM-JJ (b − a). */
export const ecartJours = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/**
 * Faut-il envoyer un rappel aujourd'hui pour l'échéance donnée ?
 * « avant » : dès que l'on entre dans la fenêtre du délai (rattrapage si la tâche n'a pas tourné un jour), une seule fois ;
 * « jour » : le jour même, si demandé.
 */
export function rappelsDuJour(echeanceIso: string, aujourdhui: string, delai: number, aussiLeJour: boolean): ("avant" | "jour")[] {
  const reste = ecartJours(aujourdhui, echeanceIso);
  const out: ("avant" | "jour")[] = [];
  if (reste > 0 && reste <= delai) out.push("avant");
  if (reste === 0 && aussiLeJour) out.push("jour");
  return out;
}

export const aujourdhuiIso = (d = new Date()) => d.toISOString().slice(0, 10);
