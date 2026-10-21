// Campagne « Trouve ta voie » (Gabon, déc. 2026 – févr. 2027) : dates et réglages partagés par le site et l'API.

export const CAMPAGNE = {
  id: "trouvetavoie",
  nom: "Trouve ta voie",
  debut: "2026-12-01",
  fin: "2027-02-28",
  objectifComptes: 200,
  objectifDate: "2027-03-01",
  jeu: { debut: "2027-02-01", fin: "2027-02-21", tirage: "2027-02-24" },
} as const;

/** Nombre d'amis inscrits avec son code pour débloquer l'entretien prioritaire. */
export const PARRAINAGE_OBJECTIF = 2;

/** Cookie (première visite suivie) lu à l'inscription. */
export const ACQ_COOKIE = "ng_acq";

/** Le bandeau du jeu-concours n'est affiché que pendant le jeu (heure de Libreville, UTC+1). */
export function jeuEnCours(now = new Date()) {
  const d = new Date(now.getTime() + 3600e3).toISOString().slice(0, 10);
  return d >= CAMPAGNE.jeu.debut && d <= CAMPAGNE.jeu.fin;
}

/** Libellés lisibles des sources (utm_source) utilisées par le calendrier éditorial. */
export const SOURCES: Record<string, string> = {
  lycee: "Lycée (QR code)",
  whatsapp: "WhatsApp",
  parrain: "Parrainage",
  google: "Google",
  tiktok: "TikTok",
  fb: "Facebook",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  live: "Lives",
  teaser: "Teaser",
  email: "E-mail",
  sms: "SMS",
  radio: "Radio",
  flyer: "Flyer",
  direct: "Accès direct",
};
export const sourceLabel = (s: string) => SOURCES[s] ?? s;

/** Date en toutes lettres (« 1er février 2027 », « lundi 1er février »). */
export function dateLongue(iso: string, opts: { annee?: boolean; jour?: boolean } = {}) {
  const d = new Date(`${iso}T12:00:00Z`);
  const s = d.toLocaleDateString("fr-FR", { weekday: opts.jour ? "long" : undefined, day: "numeric", month: "long", year: opts.annee ? "numeric" : undefined, timeZone: "UTC" });
  return d.getUTCDate() === 1 ? s.replace(/(^|\s)1(\s)/, "$11er$2") : s;
}
