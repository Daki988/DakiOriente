// Rappels aux élèves (et à leurs parents) : pièce demandée par une école, candidature en brouillon dont la campagne
// se termine (J-7 et J-2). Lancés chaque jour avec les rappels d'offres (scripts/rappels-offres.mts) ; chaque rappel
// n'est envoyé qu'une fois grâce à une clé de la table « counters ».
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { db, schema } from "../db";
import { DOC_LABEL } from "./documents";
import { guardiansOf } from "./guardians";
import { notify } from "./notifications";
import { etabById } from "@/lib/data";

const JOUR = 864e5;
/** Vrai si la clé est nouvelle (rappel jamais envoyé), et la réserve. */
async function premiereFois(cle: string) {
  const r = await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key });
  return r.length > 0;
}
async function prevenir(eleveId: string, prenom: string, n: { kind: string; title: string; body: string; link: string }, parentTitle: string) {
  await notify(eleveId, n);
  for (const g of await guardiansOf(eleveId)) {
    if (g.link.status === "actif" && g.parent?.id) await notify(g.parent.id, { ...n, title: parentTitle.replace("{prenom}", prenom), link: n.link.replace("/espace/candidatures/", "/parent/candidatures/") });
  }
}

export async function rappelsEleves(maintenant = new Date()) {
  let envoyes = 0;
  const A = schema.applications;
  const lignes = await db.select({ a: A, prenom: schema.users.firstName, titre: schema.programs.title, campagneFin: schema.campaigns.endsAt })
    .from(A).innerJoin(schema.users, eq(schema.users.id, A.studentId)).innerJoin(schema.programs, eq(schema.programs.id, A.programId))
    .leftJoin(schema.campaigns, eq(schema.campaigns.id, A.campaignId))
    .where(inArray(A.status, ["piece_demandee", "brouillon"]));

  // Campagnes ouvertes par programme (pour les brouillons sans campagne rattachée).
  const ouvertes = await db.select({ fin: schema.campaigns.endsAt, programmes: schema.campaigns.programIds }).from(schema.campaigns)
    .where(and(eq(schema.campaigns.published, true), gt(schema.campaigns.endsAt, maintenant), lte(schema.campaigns.startsAt, maintenant)));
  const finPour = (programId: string) => ouvertes.filter((c) => c.programmes.includes(programId)).map((c) => c.fin).sort((x, y) => x.getTime() - y.getTime())[0] ?? null;

  for (const { a, prenom, titre, campagneFin } of lignes) {
    const ecole = etabById[a.establishmentId]?.sigle || etabById[a.establishmentId]?.nom || "l'école";
    const lien = `/espace/candidatures/${a.id}/`;
    if (a.status === "piece_demandee") {
      // Tous les 3 jours, 3 fois au plus, tant que la pièce n'est pas déposée.
      const palier = Math.floor((maintenant.getTime() - a.updatedAt.getTime()) / (3 * JOUR));
      if (palier < 1 || palier > 3 || !(await premiereFois(`rappel:piece:${a.id}:${palier}`))) continue;
      const pieces = a.requestedDocuments.map((d) => DOC_LABEL[d as keyof typeof DOC_LABEL] ?? d).join(", ") || "une pièce";
      await prevenir(a.studentId, prenom, { kind: "rappel_piece", title: `${ecole} attend une pièce pour ta candidature`, body: `Pour « ${titre} », ${ecole} a demandé : ${pieces}. Dépose-la pour que ton dossier avance.`, link: lien }, `${ecole} attend une pièce pour la candidature de {prenom}`);
      envoyes++;
    } else {
      const fin = campagneFin && campagneFin > maintenant ? campagneFin : finPour(a.programId);
      if (!fin) continue;
      const jours = Math.ceil((fin.getTime() - maintenant.getTime()) / JOUR);
      const palier = jours <= 2 ? "J2" : jours <= 7 ? "J7" : null;
      if (!palier || !(await premiereFois(`rappel:brouillon:${a.id}:${palier}`))) continue;
      const date = fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      await prevenir(a.studentId, prenom, { kind: "rappel_brouillon", title: jours <= 2 ? `Plus que ${jours} jour${jours > 1 ? "s" : ""} pour envoyer ta candidature à ${ecole}` : `Ta candidature à ${ecole} n'est pas encore envoyée`, body: `« ${titre} » : les candidatures ferment le ${date}. Termine ton dossier et envoie-le (c'est gratuit).`, link: lien }, `La candidature de {prenom} à ${ecole} n'est pas encore envoyée`);
      envoyes++;
    }
  }
  return { envoyes };
}
