// Navi connaît l'élève : profil du compte (test d'orientation, série, résultats, projet, budget, favoris), fiche de
// suivi tenue d'une conversation à l'autre, et avis d'admission (série conseillée ou non pour une formation).
// Toujours les données de la personne connectée (ou de ses enfants pour un parent), jamais d'une autre.
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { admissionLabel, etabById, formationById, metierById, niveauLabel, riasec, serieById } from "@/lib/data";
import { nomPays } from "@/lib/pays-origine";
import { childrenOf } from "./guardians";

type User = typeof schema.users.$inferSelect;
const RIASEC = Object.fromEntries(riasec.map((r) => [r.code, r.nom]));
const FIN: Record<string, string> = { garant: "garant", bourse: "bourse", pret: "prêt", autofinance: "autofinancement" };
export const LIMITE_SUIVI = 1200;

/** Profil d'orientation d'un élève, en clair (rien d'identifiant au-delà du prénom). */
export async function profilEleve(userId: string) {
  const [[u], [p], [test], favoris] = await Promise.all([
    db.select({ prenom: schema.users.firstName, annee: schema.users.birthYear, pays: schema.users.country, ville: schema.users.city }).from(schema.users).where(eq(schema.users.id, userId)),
    db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId)),
    db.select({ top: schema.orientationResults.top, le: schema.orientationResults.createdAt }).from(schema.orientationResults).where(eq(schema.orientationResults.userId, userId)).orderBy(desc(schema.orientationResults.createdAt)).limit(1),
    db.select({ kind: schema.favorites.kind, id: schema.favorites.itemId }).from(schema.favorites).where(eq(schema.favorites.userId, userId)).limit(40),
  ]);
  if (!u) return null;
  const serie = p?.serie ? serieById[p.serie] : null;
  const top = test?.top ?? p?.riasec?.top ?? [];
  const fav = (k: string, nom: (id: string) => string | undefined) => favoris.filter((f) => f.kind === k).map((f) => nom(f.id)).filter((x): x is string => !!x).slice(0, 8);
  return {
    prenom: u.prenom,
    age: u.annee ? new Date().getFullYear() - u.annee : null,
    pays: u.pays ? nomPays(u.pays) : null,
    ville: u.ville,
    niveau: p?.level ? niveauLabel(p.level) : null,
    serie: serie ? { id: serie.id, intitule: serie.intitule, pays: serie.pays } : p?.serie ?? null,
    etablissement_actuel: p?.currentSchool ?? null,
    resultats: p?.average != null ? { moyenne_sur_20: p.average, mention: p.mention, annee_bac: p.bacYear, verifiee: !!p.averageVerifiedAt } : null,
    test_orientation: top.length ? { profil: top.map((c) => RIASEC[c] ?? c), passe_le: test?.le ? test.le.toISOString().slice(0, 10) : null } : null,
    metiers_vises: (p?.targetJobs ?? []).map((m) => metierById[m]?.nom ?? m).slice(0, 6),
    centres_interet: (p?.interests ?? []).slice(0, 8),
    projet: p?.goals?.slice(0, 400) ?? null,
    rentree_souhaitee: p?.startYear ?? null,
    villes_souhaitees: p?.preferences?.villes ?? [],
    budget_annuel: p?.preferences?.budgetAnnuel ? `${p.preferences.budgetAnnuel} ${p.preferences.devise ?? "MAD"}` : null,
    financement: Object.entries(p?.funding ?? {}).filter(([, v]) => v).map(([k]) => FIN[k] ?? k),
    favoris: {
      ecoles: fav("etablissement", (id) => etabById[id]?.sigle || etabById[id]?.nom),
      formations: fav("formation", (id) => formationById[id]?.intitule),
      metiers: fav("metier", (id) => metierById[id]?.nom),
    },
  };
}
export type ProfilEleve = NonNullable<Awaited<ReturnType<typeof profilEleve>>>;

/** Résumé en quelques lignes pour le contexte de Navi (vide si rien n'est renseigné). */
export function resumeProfil(p: ProfilEleve) {
  const l: string[] = [];
  const serie = typeof p.serie === "object" && p.serie ? p.serie.intitule : p.serie;
  if (p.age || p.pays) l.push(`${p.age ? `${p.age} ans` : ""}${p.age && p.pays ? ", " : ""}${p.pays ?? ""}${p.ville ? ` (${p.ville})` : ""}`);
  if (p.niveau || serie) l.push(`Niveau : ${[p.niveau, serie && `série ${serie}`].filter(Boolean).join(", ")}`);
  if (p.resultats) l.push(`Résultats : ${p.resultats.moyenne_sur_20}/20${p.resultats.mention ? `, ${p.resultats.mention}` : ""}${p.resultats.annee_bac ? `, bac ${p.resultats.annee_bac}` : ""}${p.resultats.verifiee ? " (vérifiée sur le relevé)" : " (déclarée)"}`);
  if (p.test_orientation) l.push(`Test d'orientation : ${p.test_orientation.profil.join(", ")}`);
  if (p.metiers_vises.length) l.push(`Métiers visés : ${p.metiers_vises.join(", ")}`);
  if (p.centres_interet.length) l.push(`Centres d'intérêt : ${p.centres_interet.join(", ")}`);
  if (p.projet) l.push(`Projet : ${p.projet}`);
  if (p.rentree_souhaitee || p.villes_souhaitees.length) l.push(`Rentrée ${p.rentree_souhaitee ?? "?"}${p.villes_souhaitees.length ? `, villes souhaitées : ${p.villes_souhaitees.join(", ")}` : ""}`);
  if (p.budget_annuel) l.push(`Budget annuel déclaré : ${p.budget_annuel}`);
  if (p.financement.length) l.push(`Financement : ${p.financement.join(", ")}`);
  const f = p.favoris;
  if (f.ecoles.length || f.formations.length || f.metiers.length) l.push(`Favoris : ${[...f.metiers, ...f.formations, ...f.ecoles].join(", ")}`);
  return l;
}

/** Fiche de suivi (notes de Navi d'une conversation à l'autre). */
export async function lireSuivi(userId: string) {
  const [s] = await db.select().from(schema.naviSuivi).where(eq(schema.naviSuivi.userId, userId)).catch(() => []);
  return s ? { notes: s.notes, le: s.updatedAt } : null;
}
export async function ecrireSuivi(userId: string, notes: string) {
  const n = notes.trim().slice(0, LIMITE_SUIVI);
  await db.insert(schema.naviSuivi).values({ userId, notes: n }).onConflictDoUpdate({ target: schema.naviSuivi.userId, set: { notes: n, updatedAt: new Date() } });
}
export async function effacerSuivi(userId: string) {
  await db.delete(schema.naviSuivi).where(eq(schema.naviSuivi.userId, userId));
}

/** Contexte « qui est la personne » ajouté aux consignes de Navi en début de conversation. */
export async function contexteEleve(user: User | null) {
  if (!user) return "";
  const blocs: string[] = [];
  if (user.role === "eleve" || user.role === "etudiant") {
    const p = await profilEleve(user.id).catch(() => null);
    const lignes = p ? resumeProfil(p) : [];
    blocs.push(lignes.length ? `Profil de ${user.firstName} (son compte Navigoal ; ne lui redemande pas ce qui y figure) :\n${lignes.map((x) => `  - ${x}`).join("\n")}` : `Profil de ${user.firstName} : presque vide. Propose-lui le test d'orientation (/orientation/) et de compléter son profil (/espace/profil/) au bon moment.`);
  } else if (user.role === "parent") {
    const enfants = await childrenOf(user.id).catch(() => []);
    for (const { child } of enfants.slice(0, 4)) {
      const p = await profilEleve(child.id).catch(() => null);
      const lignes = p ? resumeProfil(p) : [];
      if (lignes.length) blocs.push(`Profil de son enfant ${child.firstName} :\n${lignes.map((x) => `  - ${x}`).join("\n")}`);
    }
  }
  const s = await lireSuivi(user.id).catch(() => null);
  if (s?.notes) blocs.push(`Fiche de suivi (tes notes des conversations précédentes, au ${s.le.toISOString().slice(0, 10)}) :\n${s.notes}\nReprends le fil naturellement si c'est utile (« La dernière fois, tu hésitais entre… »), sans réciter la fiche.`);
  return blocs.length ? `\n${blocs.join("\n")}` : "";
}

/** Avis d'admission : la série de l'élève est-elle conseillée pour cette formation ? Prudence : un avis, pas une décision. */
export async function verifierAdmission(user: User | null, formationId: string, serieId?: string | null) {
  const f = formationById[formationId];
  if (!f) return { erreur: "Formation inconnue : utilise un identifiant renvoyé par chercher_formations." };
  let id = serieId ?? null;
  let moyenne: number | null = null;
  if (!id && user && (user.role === "eleve" || user.role === "etudiant")) {
    const [p] = await db.select({ serie: schema.profiles.serie, moyenne: schema.profiles.average }).from(schema.profiles).where(eq(schema.profiles.userId, user.id)).catch(() => []);
    id = p?.serie ?? null; moyenne = p?.moyenne ?? null;
  }
  const serie = id ? serieById[id] : null;
  const conseillees = serie ? (f.series_recommandees[serie.pays] ?? []) : [];
  const conseillee = serie ? conseillees.includes(serie.id) : null;
  return {
    formation: f.intitule, diplome: f.diplome, duree_annees: f.duree_annees, niveau: niveauLabel(f.niveau), admission: admissionLabel(f.mode_admission),
    serie_eleve: serie ? serie.intitule : null,
    series_conseillees: conseillees.map((s) => serieById[s]?.intitule ?? s),
    serie_conseillee: conseillee,
    moyenne_eleve: moyenne,
    avis: !serie
      ? "Série du bac inconnue : demande-la, ou propose de la renseigner dans le profil (/espace/profil/)."
      : conseillee
        ? `Série conseillée pour cette formation. Admission : ${admissionLabel(f.mode_admission).toLowerCase()} ; chaque école fixe ses propres exigences.`
        : `Série non listée parmi les séries conseillées : l'admission reste possible dans certaines écoles, mais prévois une formation de repli et vérifie auprès de l'école.`,
    note: "Avis indicatif tiré du référentiel Navigoal ; les écoles ne publient pas de moyenne minimale.",
  };
}

/** Accueil personnalisé du panneau de Navi pour un élève connecté (sans appel au modèle). */
/** Ce qui presse dans les candidatures de l'élève : pièce demandée par une école, brouillon dont la campagne ferme sous 7 jours. */
export async function urgenceCandidature(userId: string, maintenant = new Date()) {
  const A = schema.applications;
  const lignes = await db.select({ statut: A.status, ecole: A.establishmentId, titre: schema.programs.title, fin: schema.campaigns.endsAt })
    .from(A).innerJoin(schema.programs, eq(schema.programs.id, A.programId)).leftJoin(schema.campaigns, eq(schema.campaigns.id, A.campaignId))
    .where(and(eq(A.studentId, userId), inArray(A.status, ["piece_demandee", "brouillon"])));
  const nom = (id: string) => etabById[id]?.sigle || etabById[id]?.nom || "une école";
  const piece = lignes.find((l) => l.statut === "piece_demandee");
  if (piece) return `${nom(piece.ecole)} attend une pièce pour ta candidature en « ${piece.titre} » : pense à la déposer.`;
  const proche = lignes.filter((l) => l.statut === "brouillon" && l.fin && l.fin > maintenant && l.fin.getTime() - maintenant.getTime() <= 7 * 864e5)
    .sort((x, y) => x.fin!.getTime() - y.fin!.getTime())[0];
  if (proche) {
    const j = Math.ceil((proche.fin!.getTime() - maintenant.getTime()) / 864e5);
    return `Ta candidature à ${nom(proche.ecole)} (« ${proche.titre} ») n'est pas encore envoyée, et les candidatures ferment dans ${j} jour${j > 1 ? "s" : ""}. On la termine ensemble ?`;
  }
  return null;
}

export async function accueilNavi(user: User | null) {
  if (!user || !["eleve", "etudiant", "parent"].includes(user.role)) return { texte: null, suggestions: [] as string[] };
  const [p, s] = await Promise.all([
    user.role === "parent" ? null : profilEleve(user.id).catch(() => null),
    lireSuivi(user.id).catch(() => null),
  ]);
  const urgent = user.role === "parent" ? null : await urgenceCandidature(user.id).catch(() => null);
  const prochaine = s?.notes.split("\n").map((l) => l.replace(/^[-•*\s]+/, "").trim()).find((l, i, all) => i > 0 && /prochaine étape/i.test(all[i - 1] ?? "") && l) ?? null;
  const vouv = user.role === "parent";
  const phrases = [vouv ? `Bonjour ${user.firstName} 👋 Ravi de vous revoir.` : `Salut ${user.firstName} 👋 Content de te revoir.`];
  if (urgent) phrases.push(urgent);
  else if (prochaine) phrases.push(vouv ? `La dernière fois, la prochaine étape était : ${prochaine.replace(/\.$/, "")}. On s'y remet ?` : `La dernière fois, ta prochaine étape c'était : ${prochaine.replace(/\.$/, "")}. On s'y remet ?`);
  else if (p?.test_orientation && p.metiers_vises.length) phrases.push(`Ton test te décrit plutôt ${p.test_orientation.profil.join(" et ").toLowerCase()}, et tu vises ${p.metiers_vises.slice(0, 2).join(" ou ")}. On regarde les formations et les écoles ?`);
  else if (p?.test_orientation) phrases.push(`Ton test te décrit plutôt ${p.test_orientation.profil.join(" et ").toLowerCase()}. On cherche ensemble les métiers qui te ressemblent ?`);
  else if (!vouv) phrases.push("Tu sais déjà ce que tu veux faire, ou tu hésites encore ? Raconte-moi.");
  else phrases.push("Comment puis-je vous aider pour le projet d'études de votre enfant ?");
  const sug: string[] = [];
  if (urgent) sug.push("Aide-moi à finir ma candidature");
  if (prochaine) sug.push("On reprend où on s'était arrêtés");
  const serie = p && typeof p.serie === "object" && p.serie ? p.serie.intitule : null;
  if (p?.metiers_vises[0]) sug.push(`Quelles écoles pour devenir ${p.metiers_vises[0].toLowerCase()} ?`);
  if (serie && p?.metiers_vises[0]) sug.push(`Avec mon ${serie}, j'ai mes chances ?`);
  if (p && !p.test_orientation) sug.push("Je veux passer le test d'orientation");
  if (p?.budget_annuel) sug.push("Quelles écoles dans mon budget ?");
  return { texte: phrases.join(" "), suggestions: sug.slice(0, 3) };
}
