// Ce que Navi coûte et qui s'en sert, d'après la table navi_traces : de quoi décider d'un quota
// ou d'un essai sur des mesures plutôt que sur une estimation.
// Usage sur le serveur : node outils/env.cjs outils/navi-stats.mjs [jours]
// En local (base de recette) : npm run navi-stats -- 30
import { sql } from "drizzle-orm";

import { db } from "../src/server/db";

const jours = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 30;
const usd = (v: number) => `${v.toFixed(2)} $`;
const pc = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)} %` : "—");

const { rows: [g] } = await db.execute<{ n: number; cout: number; visiteurs: number; wa: number; cout_visiteurs: number; cout_wa: number }>(sql`
  select count(*)::int as n,
         coalesce(sum(cout_usd), 0) as cout,
         count(*) filter (where user_id is null)::int as visiteurs,
         count(*) filter (where page = '/whatsapp/')::int as wa,
         coalesce(sum(cout_usd) filter (where user_id is null and page is distinct from '/whatsapp/'), 0) as cout_visiteurs,
         coalesce(sum(cout_usd) filter (where page = '/whatsapp/'), 0) as cout_wa
  from navi_traces where at > now() - (${jours} || ' days')::interval`);

if (!g || !g.n) {
  console.log(`Aucun échange enregistré sur ${jours} jours.`);
  process.exit(0);
}

console.log(`\nNavi — ${jours} derniers jours\n`);
console.log(`  Échanges            ${g.n}   (${(g.n / jours).toFixed(1)} par jour)`);
console.log(`  Dont visiteurs      ${g.visiteurs}   ${pc(g.visiteurs, g.n)}`);
console.log(`  Dont WhatsApp       ${g.wa}   ${pc(g.wa, g.n)}`);
console.log(`  Coût total          ${usd(g.cout)}   soit ${usd(g.cout / jours)} par jour`);
console.log(`  Coût moyen          ${usd(g.cout / g.n)} par échange`);
console.log(`  Coût des visiteurs  ${usd(g.cout_visiteurs)} sur le site (hors WhatsApp : ${usd(g.cout_wa)})`);

const { rows: routes } = await db.execute<{ route: string; n: number; cout: number; ms: number }>(sql`
  select route, count(*)::int as n, coalesce(sum(cout_usd), 0) as cout, coalesce(avg(duree_ms), 0) as ms
  from navi_traces where at > now() - (${jours} || ' days')::interval group by route order by n desc`);
console.log(`\n  Par route`);
for (const r of routes) console.log(`    ${r.route.padEnd(10)} ${String(r.n).padStart(5)}  ${usd(r.cout).padStart(9)}  ${Math.round(r.ms)} ms en moyenne`);

const { rows: statuts } = await db.execute<{ statut: string; n: number }>(sql`
  select statut, count(*)::int as n from navi_traces where at > now() - (${jours} || ' days')::interval group by statut order by n desc`);
console.log(`\n  Issues : ${statuts.map((s) => `${s.statut} ${s.n}`).join(" · ")}`);

const { rows: avis } = await db.execute<{ utile: number; inutile: number }>(sql`
  select count(*) filter (where avis = 'utile')::int as utile, count(*) filter (where avis = 'inutile')::int as inutile
  from navi_traces where at > now() - (${jours} || ' days')::interval`);
if (avis[0] && (avis[0].utile || avis[0].inutile)) console.log(`  Avis   : 👍 ${avis[0].utile} · 👎 ${avis[0].inutile}`);

const { rows: jourspar } = await db.execute<{ j: string; n: number; cout: number; visiteurs: number }>(sql`
  select to_char(at, 'YYYY-MM-DD') as j, count(*)::int as n, coalesce(sum(cout_usd), 0) as cout,
         count(*) filter (where user_id is null)::int as visiteurs
  from navi_traces where at > now() - interval '7 days' group by 1 order by 1 desc`);
if (jourspar.length) {
  console.log(`\n  Sept derniers jours`);
  for (const j of jourspar) console.log(`    ${j.j}  ${String(j.n).padStart(4)} échanges  ${usd(j.cout).padStart(8)}  dont ${j.visiteurs} de visiteurs`);
}

// La table ne garde pas d'empreinte de visiteur : on ne peut pas compter les messages par personne
// non connectée, donc pas de distribution pour calibrer finement un seuil d'essai.
console.log(`\n  Note : les échanges de visiteurs ne sont pas rattachés à une personne (aucune empreinte conservée),`);
console.log(`  donc le nombre de messages par visiteur n'est pas mesurable ici.\n`);
process.exit(0);
