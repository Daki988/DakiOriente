"use client";
import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCircle2, Download, Globe2, GraduationCap, Hourglass, Inbox, KeyRound, LineChart, MapPin, PieChart } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Chip, Empty, Loading, PageHeader, Panel, StatusBadge, Table, dateFr } from "@/components/app/kit";
import { Select } from "@/components/app/form";
import { LabelChip } from "@/components/ui/Cards";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { etabById, villesOf, type Label } from "@/lib/data";
import { useEcole } from "./EcoleContext";
import { Donut, MonthChart } from "./Charts";
import { CountryTag, ETAB_STATUS, paysColor, paysLabel, pct, type AppRow } from "./shared";

type Ind = { v: number; trend: number | null };
type Dash = {
  periode: string; depuis: string;
  indicateurs: { candidatures: Ind; admis: Ind; enCours: Ind; formations: { v: number; delta: number; nouvelles: number } };
  kpis: { total: number; attente: number; admis: number; refuses: number; nouveaux: number };
  months: { mois: number; n: number; prev: number }[];
  byProgram: { title: string; n: number; admis: number }[];
  byCampus: { campus: string | null; n: number }[];
  byCountry: { country: string | null; n: number }[];
  housing: { admis_etrangers: number; loges: number };
};
const PERIODES: [string, string][] = [["annee", "Cette année"], ["mois", "30 derniers jours"], ["semaine", "7 derniers jours"]];

function Count({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 0.9, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, reduce]);
  return <>{v.toLocaleString("fr-FR")}</>;
}

const TONE: Record<string, string> = { green: "bg-[#e8f8ef] text-[#0f8a46]", blue: "bg-brand-50 text-brand-600", sun: "bg-sun-100 text-[#a55a00]", violet: "bg-[#f1edff] text-[#6a3df0]" };
function Indicator({ label, value, trend, delta, icon: I, tone, i }: { label: string; value: number; trend?: number | null; delta?: number; icon: typeof Inbox; tone: string; i: number }) {
  const t = trend ?? null;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex min-w-0 items-start gap-3 rounded-[20px] p-4 sm:p-5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE[tone]}`}><I size={19} /></span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-bold text-ink-mute">{label}</span>
        <b className="text-[24px] leading-tight sm:text-[26px]"><Count to={value} /></b>
        {delta !== undefined ? <span className={`text-xs font-bold ${delta > 0 ? "text-[#0f8a46]" : "text-ink-mute"}`}>{delta > 0 ? `+${delta}` : delta} sur la période</span>
          : t === null ? <span className="text-xs text-ink-mute">pas de comparaison</span>
          : <span className={`text-xs font-bold ${t > 0 ? "text-[#0f8a46]" : t < 0 ? "text-[#d42a50]" : "text-ink-mute"}`}>{t > 0 ? "+" : ""}{t} %<span className="font-normal text-ink-mute"> vs période préc.</span></span>}
      </div>
    </motion.div>
  );
}

/** Tableau de bord établissement (planche) : indicateurs réels avec tendance, évolution, répartition, dernières candidatures. */
export function Dashboard() {
  const { eid, etab, link } = useEcole();
  const router = useRouter();
  const [periode, setPeriode] = useState("annee");
  const d = useApi<Dash>(`/ecole/${eid}/tableau-de-bord?periode=${periode}`);
  const recent = useApi<AppRow[]>(`/ecole/${eid}/candidatures`);
  const st = ETAB_STATUS[etab.status];
  const ref = etabById[etab.id];
  const campus = ref ? villesOf(ref) : [etab.ville];

  const header = (
    <PageHeader title="Tableau de bord" sub={<span className="flex flex-wrap items-center gap-2">{etab.nom}{ref?.label && <LabelChip label={ref.label as Label} court />}<Chip tone={st.tone}>{etab.status === "verifie" && <BadgeCheck size={13} />}{st.label}</Chip></span>}
      actions={<>
        <Select aria-label="Période" value={periode} onChange={(e) => setPeriode(e.target.value)} options={PERIODES} className="min-h-[44px] w-auto py-2.5" />
        <a href={apiUrl(`/ecole/${eid}/candidatures?format=csv`)} className="btn-ghost min-h-[44px]"><Download size={17} /><span className="max-sm:hidden">Exporter CSV</span><span className="sm:hidden">CSV</span></a>
      </>} />
  );

  if (d.loading && !d.data) return <>{header}<Loading label="Calcul des indicateurs…" /></>;
  if (d.error) return <>{header}<Alert tone="error" title="Indicateurs indisponibles" action={<Button size="sm" variant="ghost" onClick={d.reload}>Réessayer</Button>}>{d.error.message}</Alert></>;
  const { indicateurs: k, kpis, months, byProgram, byCampus, byCountry, housing } = d.data!;
  const countryTotal = byCountry.reduce((s, c) => s + c.n, 0);
  const ring = pct(housing.admis_etrangers, kpis.admis);
  const last = (recent.data ?? []).slice(0, 6);
  const year = new Date().getFullYear();

  return (
    <>
      {header}
      {kpis.total === 0 && (
        <div className="mb-5"><Alert tone="info" title="Aucune candidature reçue pour le moment" action={<Link href={link("/etablissement/formations")} className="btn-ghost px-3.5 py-2 text-[13px]">Compléter mes formations</Link>}>
          Des formations à jour (frais en dirhams, pièces, places) et une campagne publiée augmentent nettement le nombre de candidatures.
        </Alert></div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicator i={0} label="Candidatures" value={k.candidatures.v} trend={k.candidatures.trend} icon={Inbox} tone="green" />
        <Indicator i={1} label="Admis" value={k.admis.v} trend={k.admis.trend} icon={CheckCircle2} tone="blue" />
        <Indicator i={2} label="En cours" value={k.enCours.v} trend={k.enCours.trend} icon={Hourglass} tone="sun" />
        <Indicator i={3} label="Formations actives" value={k.formations.v} delta={k.formations.delta} icon={GraduationCap} tone="violet" />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1.45fr_1fr] [&>*]:min-w-0">
        <Panel title="Évolution des candidatures" icon={LineChart} action={<span className="text-xs font-bold text-ink-mute">{year}</span>}>
          <MonthChart rows={months} year={year} />
        </Panel>
        <Panel title="Répartition par formation" icon={PieChart} action={<span className="text-xs font-bold text-ink-mute">{PERIODES.find(([p]) => p === periode)?.[1]}</span>}>
          {byProgram.length === 0 ? <Empty icon={PieChart} title="Pas encore de données" text="La répartition s'affichera dès les premières candidatures de la période." />
            : <Donut label="Candidatures par formation" rows={byProgram.map((p) => ({ name: p.title, n: p.n }))} />}
        </Panel>
      </div>

      <Panel title="Dernières candidatures" icon={Inbox} className="mt-4 sm:mt-5" action={<Link href={link("/etablissement/candidatures")} className="text-sm font-bold text-[#6a3df0] hover:underline">Voir toutes</Link>}>
        {recent.loading ? <Loading /> : recent.error ? <Alert tone="error">{recent.error.message}</Alert> : (
          <Table rows={last} rowKey={(r) => r.a.id} onRow={(r) => router.push(link(`/etablissement/candidatures/${r.a.id}`))} empty="Les nouvelles candidatures apparaîtront ici en temps réel."
            cols={[
              { h: "Candidat", c: (r) => <span className="flex items-center gap-2.5"><Avatar name={`${r.s.firstName} ${r.s.lastName}`} size={34} /><span className="min-w-0"><b className="block truncate">{r.s.firstName} {r.s.lastName}</b><CountryTag code={r.s.country} /></span></span> },
              { h: "Formation", c: (r) => <span className="line-clamp-2 text-ink-soft">{r.p.title}</span> },
              { h: "Campus", c: (r) => <span className="whitespace-nowrap text-ink-soft">{r.a.campus ?? r.p.campus ?? etab.ville}</span> },
              { h: "Date", c: (r) => <span className="whitespace-nowrap text-ink-mute">{dateFr(r.a.submittedAt)}</span> },
              { h: "Statut", c: (r) => <StatusBadge status={r.a.status} /> },
            ]} />
        )}
      </Panel>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Panel title="Campus choisi" icon={MapPin}>
          {campus.length > 1 && <p className="-mt-2 text-xs text-ink-mute">Réseau multi-campus : {campus.join(", ")}.</p>}
          {byCampus.length === 0 ? <p className="text-sm text-ink-mute">Aucune candidature sur la période.</p> : (
            <ul className="flex flex-col gap-3">{byCampus.map((c, i) => (
              <li key={c.campus ?? i} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm"><b>{c.campus ?? "Non précisé"}</b><span className="text-ink-mute"><b className="text-ink">{c.n}</b> · {pct(c.n, byCampus.reduce((s, x) => s + x.n, 0))} %</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef1f8]"><motion.div className="h-full rounded-full bg-[#6a3df0]" initial={{ width: 0 }} animate={{ width: `${pct(c.n, byCampus[0].n)}%` }} transition={{ delay: 0.1 * i, duration: 0.6 }} /></div>
              </li>))}</ul>
          )}
        </Panel>
        <Panel title="Pays d'origine des candidats" icon={Globe2}>
          {byCountry.length === 0 ? <p className="text-sm text-ink-mute">La répartition s&apos;affichera dès les premières candidatures.</p> : (
            <ul className="flex flex-col gap-3">
              {byCountry.slice(0, 6).map((c, i) => (
                <li key={c.country ?? "na"} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm"><b>{paysLabel(c.country)}</b><span className="text-ink-mute"><b className="text-ink">{c.n}</b> · {pct(c.n, countryTotal)} %</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef1f8]"><motion.div className="h-full rounded-full" style={{ background: paysColor(c.country) }} initial={{ width: 0 }} animate={{ width: `${pct(c.n, countryTotal)}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Logement des admis" icon={KeyRound} tone="sun">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden><circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3ead0" strokeWidth="4" /><motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="#f9a806" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: ring / 100 }} transition={{ duration: 1, delay: 0.3 }} /></svg>
              <b className="absolute inset-0 flex items-center justify-center text-lg">{ring} %</b>
            </div>
            <span className="text-sm"><b className="block">{housing.admis_etrangers} admis venant de l&apos;étranger sur {kpis.admis}</b><span className="text-ink-mute">{housing.loges} déjà logé{housing.loges > 1 ? "s" : ""} via Navilease</span></span>
          </div>
          <Link href="/navilease" className="btn-primary mt-auto w-full">Logements Navilease <ArrowRight size={16} /></Link>
        </Panel>
      </div>
    </>
  );
}
