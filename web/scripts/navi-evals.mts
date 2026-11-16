// Tests de qualité de Navi sur le vrai modèle : chaque cas de scripts/navi-evals/cas.json passe par converser()
// (mêmes consignes, outils, routeur et modèles qu'en production), puis est noté par des contrôles automatiques
// et par un juge (Claude Opus 5.5) selon les critères du cas.
// Payant : appels réels à l'API (ANTHROPIC_API_KEY). Base PostgreSQL migrée et alimentée par le seed (DATABASE_URL).
// Usage : npx tsx scripts/navi-evals.mts [--reps 3] [--cas infirmier,visa] [--sortie dossier] [--sans-juge]
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

process.env.NAVI_CACHE = "0"; // chaque essai part de zéro : pas de réponse servie depuis le cache
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const REPS = Math.max(1, Number(arg("reps") ?? 1));
const SEUIL = Number(process.env.NAVI_EVALS_SEUIL ?? 0.8);
const JUGE = "claude-opus-5-5";
const sansJuge = process.argv.includes("--sans-juge");
const sortie = path.resolve(arg("sortie") ?? `navi-evals-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}`);
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY manquant."); process.exit(2); }

const { converser, coutUsd } = await import("../src/server/services/navi");
const { controler } = await import("../src/server/services/navi-evals");
const { db, schema } = await import("../src/server/db");
type Cas = import("../src/server/services/navi-evals").Cas;

const tous: Cas[] = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "navi-evals", "cas.json"), "utf8"));
const choisis = arg("cas")?.split(",");
const cas = choisis ? tous.filter((c) => choisis.includes(c.id)) : tous;
fs.mkdirSync(sortie, { recursive: true });
const ecrire = (f: string, o: unknown) => fs.appendFileSync(path.join(sortie, f), JSON.stringify(o) + "\n");
const client = new Anthropic();
const [eleve] = await db.select().from(schema.users).where((await import("drizzle-orm")).eq(schema.users.role, "eleve")).limit(1);

const Verdict = z.object({ verdict: z.enum(["reussi", "echec"]), raison: z.string() });
async function juger(c: Cas, reponse: string, outils: string[]) {
  const conversation = c.messages.map((m) => `${m.role === "user" ? "Utilisateur" : "Navi"} : ${m.texte}`).join("\n");
  const r = await client.messages.parse({
    model: JUGE, max_tokens: 2000, output_config: { effort: "low", format: zodOutputFormat(Verdict) },
    system: "Tu évalues les réponses de Navi, l'assistant d'orientation de la plateforme Navigoal (études supérieures, surtout au Maroc, pour des élèves d'Afrique). Juge seulement selon les critères donnés, sans exigence supplémentaire. « reussi » si tous les critères sont respectés, sinon « echec ». Raison en une phrase.",
    messages: [{ role: "user", content: `Conversation :\n${conversation}\n\nOutils appelés par Navi : ${outils.join(", ") || "aucun"}\n\nRéponse affichée par Navi :\n${reponse}\n\nCritères :\n${c.criteres}` }],
  });
  if (r.stop_reason === "refusal" || !r.parsed_output) throw new Error(`juge sans verdict (${r.stop_reason})`);
  return { ...r.parsed_output, cout: coutUsd(r.model, { entree: r.usage.input_tokens, sortie: r.usage.output_tokens, cacheLu: r.usage.cache_read_input_tokens ?? 0, cacheEcrit: r.usage.cache_creation_input_tokens ?? 0 }), modele: r.model };
}

const lignes: { cas: string; rep: number; reussi: boolean; routeOk: boolean | null; cout: number; coutJuge: number; duree: number }[] = [];
for (const c of cas) for (let rep = 1; rep <= REPS; rep++) {
  try {
    let trace: import("../src/server/services/navi").Trace | null = null;
    const essai = (async () => {
      for await (const _ of converser({ messages: c.messages, destination: c.destination ?? null, pays: c.pays ?? null, page: { chemin: "/", titre: "Accueil" } },
        c.connecte ? eleve ?? null : null, { onTrace: (t) => { trace = t; } })) void _;
    })();
    await Promise.race([essai, new Promise((_, ko) => setTimeout(() => ko(new Error("délai dépassé (180 s)")), 180_000))]);
    const t = trace as import("../src/server/services/navi").Trace | null;
    if (!t) throw new Error("aucune trace");
    if (t.statut === "erreur") throw new Error("Navi en erreur (API ou réseau)");
    const sortieNavi = { reponse: t.reponse ?? "", outils: t.outils ?? [], cartes: t.cartes ?? 0, route: t.route, statut: t.statut };
    const manques = controler(c, sortieNavi);
    const juge = sansJuge ? null : await juger(c, sortieNavi.reponse, sortieNavi.outils);
    const reussi = !manques.length && (juge ? juge.verdict === "reussi" : true);
    const routeOk = c.attentes.route ? t.route === c.attentes.route : null;
    lignes.push({ cas: c.id, rep, reussi, routeOk, cout: t.coutUsd ?? 0, coutJuge: juge?.cout ?? 0, duree: t.dureeMs ?? 0 });
    ecrire("resultats.jsonl", { cas: c.id, rep, reussi, manques, juge, route: t.route, routeAttendue: c.attentes.route ?? null, modele: t.modele, outils: t.outils, statut: t.statut,
      reponse: t.reponse, jetons: { entree: t.entree, sortie: t.sortie, cacheLu: t.cacheLu, cacheEcrit: t.cacheEcrit }, coutUsd: t.coutUsd, dureeMs: t.dureeMs });
    console.log(`${reussi ? "✓" : "✗"} ${c.id} #${rep}  ${t.route}/${t.modele}  ${(t.dureeMs! / 1000).toFixed(1)} s  ${manques.concat(juge && juge.verdict !== "reussi" ? [`juge : ${juge.raison}`] : []).join(" ; ")}`);
  } catch (e) {
    ecrire("erreurs.jsonl", { cas: c.id, rep, erreur: (e as Error).message });
    console.log(`! ${c.id} #${rep}  non noté : ${(e as Error).message}`);
  }
}

const n = lignes.length, ok = lignes.filter((l) => l.reussi).length;
const routes = lignes.filter((l) => l.routeOk !== null);
const med = (v: number[]) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : 0);
const bilan = {
  essais: n, nonNotes: cas.length * REPS - n, reussite: n ? ok / n : 0,
  routageCorrect: routes.length ? routes.filter((l) => l.routeOk).length / routes.length : null,
  coutNaviUsd: lignes.reduce((s, l) => s + l.cout, 0), coutJugeUsd: lignes.reduce((s, l) => s + l.coutJuge, 0),
  dureeMedianeS: med(lignes.map((l) => l.duree)) / 1000,
  parCas: Object.fromEntries(cas.map((c) => { const l = lignes.filter((x) => x.cas === c.id); return [c.id, `${l.filter((x) => x.reussi).length}/${l.length}`]; })),
};
fs.writeFileSync(path.join(sortie, "bilan.json"), JSON.stringify(bilan, null, 2));
console.log(`\nRéussite : ${(bilan.reussite * 100).toFixed(0)} % (${ok}/${n}, ${bilan.nonNotes} non noté(s))` +
  `${bilan.routageCorrect !== null ? ` · routage correct : ${(bilan.routageCorrect * 100).toFixed(0)} %` : ""}` +
  ` · coût Navi ${bilan.coutNaviUsd.toFixed(3)} $ · juge ${bilan.coutJugeUsd.toFixed(3)} $ · durée médiane ${bilan.dureeMedianeS.toFixed(1)} s\nDétail : ${sortie}`);
process.exit(bilan.reussite >= SEUIL && !bilan.nonNotes ? 0 : 1);
