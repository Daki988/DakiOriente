"use client";
import { CheckCircle2, Crown, Mail, Star } from "lucide-react";
import { Alert, Chip, Loading, PageHeader, Panel, dateFr, type Tone } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { useEcole } from "./EcoleContext";

type Abo = { id: string; service: string; months: number; startsAt: string; endsAt: string; amount: number | null; paymentRef: string | null; etat: "actif" | "expire_bientot" | "expire" | "a_venir" | "arrete" };
type Offre = {
  actifs: { premiumUntil: string | null; featuredUntil: string | null; homeUntil: string | null };
  historique: Abo[]; catalogue: { code: string; name: string; description: string; prices: { months: number; amount: number | null }[] }[];
  visibilite: { affichages: number; affichagesPrec: number; clics: number; clicsPrec: number; candidatures: number; candidaturesPrec: number; interesses: number };
};
const nf = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const duree = (m: number) => (m % 12 === 0 ? `${m / 12} an${m > 12 ? "s" : ""}` : `${m} mois`);
const ETAT: Record<Abo["etat"], [string, Tone]> = { actif: ["Actif", "green"], expire_bientot: ["Expire bientôt", "rose"], expire: ["Terminé", "grey"], a_venir: ["À venir", "blue"], arrete: ["Arrêté", "grey"] };
function Evol({ n, p }: { n: number; p: number }) {
  if (!p) return null;
  const v = Math.round(((n - p) / p) * 100);
  return <span className={`text-xs font-bold ${v >= 0 ? "text-[#0f8a46]" : "text-[#d42a50]"}`}>{v >= 0 ? "▲" : "▼"} {Math.abs(v)} %</span>;
}

/** « Mon offre » (maquettes « offres », écran 5) : services actifs, échéances, historique et visibilité réelle. */
export function MonOffre() {
  const { eid, etab } = useEcole();
  const r = useApi<Offre>(`/ecole/${eid}/offre`);
  if (!r.data) return r.error ? <Alert tone="error">{r.error.message}</Alert> : <Loading />;
  const { actifs: a, visibilite: v } = r.data;
  const demande = (sujet: string) => `mailto:etablissements@navigoal.net?subject=${encodeURIComponent(`${sujet} · ${etab.nom}`)}`;
  const inclus = [
    a.premiumUntil && "Sélection des candidats (résultats, projet, financement)",
    a.premiumUntil && "Vivier de candidats et campagnes de prospection (2 000 envois par mois)",
    a.featuredUntil && "Mise en avant : badge « Partenaire Navigoal », en tête des listes d'écoles, des pages villes et des résultats de formations, bandeau de l'accueil",
    a.homeUntil && "À la une de l'accueil : première place du bandeau, en grand format",
  ].filter(Boolean) as string[];
  const fin = a.premiumUntil ?? a.featuredUntil ?? a.homeUntil;
  return (
    <>
      <PageHeader title="Mon offre" sub="Vos services Navigoal, leurs échéances et ce qu'ils vous rapportent" />
      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_1fr]">
        {fin ? (
          <section className="card flex flex-col gap-3 rounded-[22px] border-2 border-sun-300 bg-[#fffbea] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2.5">{a.premiumUntil ? <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#ffd34a] to-[#f9a806] px-2.5 py-1 text-xs font-extrabold"><Crown size={13} />PREMIUM</span> : <Chip tone="sun"><Star size={12} className="mr-1 inline" />Partenaire Navigoal</Chip>}
              <b className="text-lg">Actif jusqu&apos;au {dateFr(fin)}</b></div>
            <ul className="flex flex-col gap-2 text-sm">{inclus.map((t) => <li key={t} className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#0f8a46]" />{t}</li>)}</ul>
            <a href={demande("Renouvellement de mon offre")} className="btn-ghost self-start"><Mail size={16} />Demander le renouvellement</a>
          </section>
        ) : (
          <Panel title="Offre gratuite" icon={Crown}>
            <p className="text-sm text-ink-mute">Votre fiche, vos formations, la réception des candidatures et la messagerie sont gratuites. Pour aller plus loin :</p>
            <div className="flex flex-col gap-3">{r.data.catalogue.map((s) => (
              <div key={s.code} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <b>{s.name}</b> <span className="text-sm font-bold text-brand-700">· {s.prices.map((p) => `${p.amount == null ? "sur devis" : `${nf(p.amount)} MAD`} / ${duree(p.months)}`).join(" · ")}</span>
                <p className="mt-1 text-[13px] text-ink-mute">{s.description}</p>
              </div>))}</div>
            <a href={demande("Souscrire une offre")} className="btn-primary self-start"><Mail size={16} />Demander une offre</a>
          </Panel>
        )}
        <Panel title="Visibilité ce mois-ci">
          {[["Affichages en tête de liste", v.affichages, v.affichagesPrec], ["Clics vers votre fiche", v.clics, v.clicsPrec], ["Candidatures reçues", v.candidatures, v.candidaturesPrec], ["Élèves intéressés (prospection)", v.interesses, 0]].map(([t, n, p]) => (
            <div key={t as string} className="flex items-center justify-between border-b border-[#eef1f8] py-2.5 last:border-0"><span className="text-sm">{t}</span><span className="flex items-center gap-2"><b className="text-lg">{nf(n as number)}</b><Evol n={n as number} p={p as number} /></span></div>
          ))}
          <p className="text-xs text-ink-mute">Affichages et clics comptés par Navigoal sur le site public quand votre école est mise en avant (sans donnée personnelle). Évolution par rapport au mois précédent.</p>
        </Panel>
      </div>
      <Panel title="Historique" className="mt-5">
        {!r.data.historique.length ? <p className="text-sm text-ink-mute">Aucun service souscrit pour l&apos;instant.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead><tr className="border-b border-[#e6eaf3] text-left text-[11px] uppercase text-ink-mute">{["Service", "Période", "État", "Montant", "Référence"].map((h) => <th key={h} className="px-3 py-2.5 font-extrabold">{h}</th>)}</tr></thead>
            <tbody>{r.data.historique.map((x) => (
              <tr key={x.id} className="border-b border-[#eef1f8] last:border-0"><td className="px-3 py-3">{x.service} · {duree(x.months)}</td><td className="px-3 py-3">{dateFr(x.startsAt)} → {dateFr(x.endsAt)}</td>
                <td className="px-3 py-3"><Chip tone={ETAT[x.etat][1]}>{ETAT[x.etat][0]}</Chip></td><td className="px-3 py-3">{x.amount != null ? `${nf(x.amount)} MAD` : "—"}</td><td className="px-3 py-3 text-ink-mute">{x.paymentRef ?? "—"}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>
    </>
  );
}
