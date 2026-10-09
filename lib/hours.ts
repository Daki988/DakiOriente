import type { DayHours } from "./content";

/** Fuseau de l'établissement (Libreville, UTC+1, sans heure d'été). */
export const TIMEZONE = "Africa/Libreville";

const DAY_INDEX: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Heure locale de Libreville : jour de la semaine (0 = dimanche) et minutes depuis minuit. */
function librevilleNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day: wd, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus = { open: boolean; label: string };

/**
 * Calcule l'état ouvert/fermé. Gère les créneaux qui passent minuit
 * (ex. 15:00 → 06:00 : la fin appartient au lendemain).
 */
export function getOpenStatus(hours: DayHours[], now = new Date()): OpenStatus {
  const { day, minutes } = librevilleNow(now);
  const byDay = new Map(hours.map((h) => [DAY_INDEX[h.day], h]));

  // 1. Créneau de la veille qui déborde après minuit
  const prev = byDay.get((day + 6) % 7);
  if (prev && !prev.closed) {
    const o = toMinutes(prev.open), c = toMinutes(prev.close);
    if (c <= o && minutes < c) return { open: true, label: `Ouvert · ferme à ${fmt(prev.close)}` };
  }
  // 2. Créneau du jour
  const today = byDay.get(day);
  if (today && !today.closed) {
    const o = toMinutes(today.open), c = toMinutes(today.close);
    const overnight = c <= o;
    if (minutes >= o && (overnight || minutes < c)) return { open: true, label: `Ouvert · ferme à ${fmt(today.close)}` };
    if (minutes < o) return { open: false, label: `Fermé · ouvre à ${fmt(today.open)}` };
  }
  // 3. Prochaine ouverture
  for (let i = 1; i <= 7; i++) {
    const d = byDay.get((day + i) % 7);
    if (d && !d.closed) return { open: false, label: `Fermé · ouvre ${i === 1 ? "demain" : d.day} à ${fmt(d.open)}` };
  }
  return { open: false, label: "Fermé" };
}

export function fmt(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

/** Résumé lisible : « Tous les jours, 15 h – 6 h » si identiques. */
export function hoursSummary(hours: DayHours[]): string {
  const open = hours.filter((h) => !h.closed);
  const same = open.length === 7 && open.every((h) => h.open === open[0].open && h.close === open[0].close);
  if (same) return `Tous les jours, ${fmt(open[0].open)} – ${fmt(open[0].close)}`;
  return "Horaires variables selon les jours";
}
