// Complétude du profil élève/étudiant : même calcul sur le tableau de bord et la page profil.
type P = { country?: string | null; city?: string | null; birthYear?: number | string | null; profile?: { level?: string | null; serie?: string | null; currentSchool?: string | null; skills?: string[]; preferences?: { pays?: string[] } } | null };
export function profileCompletion(m: P) {
  const p = m.profile;
  const fields = [m.country, m.city, m.birthYear, p?.level, p?.serie, p?.currentSchool, p?.skills?.length, p?.preferences?.pays?.length];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
