"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCircle2, Download, Globe2, GraduationCap, Hourglass, Inbox, KeyRound, LineChart, Percent, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Chip, Empty, Loading, PageHeader, Panel, StatusBadge, since } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { useEcole } from "./EcoleContext";
import { CountryTag, ETAB_STATUS, PAYS_COLOR, pct, paysLabel, type AppRow } from "./shared";
import { WeekChart } from "./WeekChart";

type Dash = {
  kpis: { total: number; attente: number; admis: number; refuses: number; nouveaux: number };
  byWeek: { semaine: string; n: number }[];
  byCountry: { country: string | null; n: number }[];
  byProgram: { title: string; n: number; admis: number }[];
  housing: { admis_etrangers: number; loges: number };
};

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

const KPI_TONE: Record<string, string> = { violet: "bg-[#f1edff] text-[#6a3df0]", sun: "bg-sun-100 text-[#a55a00]", green: "bg-[#e8f8ef] text-[#0f8a46]", blue: "bg-brand-50 text-brand-600", rose: "bg-[#ffecef] text-[#d42a50]" };
function KpiCard({ label, value, suffix, sub, icon: I, tone, i }: { label: string; value: number; suffix?: string; sub: string; icon: typeof Inbox; tone: string; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex flex-col gap-1 rounded-[20px] p-4 sm:p-5">
      <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${KPI_TONE[tone]}`}><I size={19} /></span>
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">{label}</span>
      <b className="text-[26px] leading-tight"><Count to={value} />{suffix}</b>
      <span className="text-xs text-ink-mute">{sub}</span>
    </motion.div>
  );
}

export function Dashboard() {
  const { eid, etab, link } = useEcole();
  const router = useRouter();
  const d = useApi<Dash>(`/ecole/${eid}/tableau-de-bord`);
  const recent = useApi<AppRow[]>(`/ecole/${eid}/candidatures`);
  const st = ETAB_STATUS[etab.status];

  const header = (
    <PageHeader title="Tableau de bord" sub={`${etab.nom} · ${etab.ville}`} badge={<Chip tone={st.tone}>{etab.status === "verifie" && <BadgeCheck size={13} />}{st.label}</Chip>}
      actions={<>
        <a href={apiUrl(`/ecole/${eid}/candidatures?format=csv`)} className="btn-ghost"><Download size={17} />Exporter CSV</a>
        <Link href={link("/etablissement/candidatures")} className="btn-primary"><Inbox size={17} />Voir les candidatures</Link>
      </>} />
  );

  if (d.loading) return <>{header}<Loading label="Calcul des indicateurs…" /></>;
  if (d.error) return <>{header}<Alert tone="error" title="Indicateurs indisponibles" action={<Button size="sm" variant="ghost" onClick={d.reload}>Réessayer</Button>}>{d.error.message}</Alert></>;
  const { kpis, byCountry, byProgram, housing } = d.data!;
  const decided = kpis.admis + kpis.refuses;
  const countryTotal = byCountry.reduce((s, c) => s + c.n, 0);
  const ring = pct(housing.admis_etrangers, kpis.admis);
  const todo = (recent.data ?? []).slice(0, 5);

  return (
    <>
      {header}
      {kpis.total === 0 && (
        <div className="mb-6"><Alert tone="info" title="Aucune candidature reçue pour le moment" action={<Link href={link("/etablissement/formations")} className="btn-ghost px-3.5 py-2 text-[13px]">Compléter mes formations</Link>}>
          Des formations à jour (frais, pièces, places) et une campagne publiée augmentent nettement le nombre de candidatures.
        </Alert></div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard i={0} label="Candidatures reçues" value={kpis.total} sub={`dont ${kpis.nouveaux} cette semaine`} icon={Inbox} tone="violet" />
        <KpiCard i={1} label="Dossiers en attente" value={kpis.attente} sub="à traiter ou en cours" icon={Hourglass} tone="sun" />
        <KpiCard i={2} label="Admis" value={kpis.admis} sub="candidatures acceptées" icon={CheckCircle2} tone="green" />
        <KpiCard i={3} label="Taux d'admission" value={pct(kpis.admis, decided)} suffix=" %" sub={decided ? `sur ${decided} décision${decided > 1 ? "s" : ""}` : "aucune décision encore"} icon={Percent} tone="blue" />
        <KpiCard i={4} label="Refusés" value={kpis.refuses} sub="décisions négatives" icon={XCircle} tone="rose" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr] [&>*]:min-w-0">
        <Panel title="Candidatures par semaine" icon={LineChart} action={<span className="text-xs font-bold text-ink-mute">12 dernières semaines</span>}>
          <WeekChart rows={d.data!.byWeek} />
        </Panel>
        <Panel title="Par pays d'origine" icon={Globe2}>
          {byCountry.length === 0 ? <Empty icon={Globe2} title="Pas encore de données" text="La répartition par pays s'affichera dès les premières candidatures." /> : (
            <ul className="flex flex-col gap-4">
              {byCountry.map((c, i) => (
                <li key={c.country ?? "na"} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm"><b>{paysLabel(c.country)}</b><span className="text-ink-mute"><b className="text-ink">{c.n}</b> · {pct(c.n, countryTotal)} %</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef1f8]">
                    <motion.div className="h-full rounded-full" style={{ background: PAYS_COLOR[c.country ?? ""] ?? "#9aa3bf" }} initial={{ width: 0 }} animate={{ width: `${pct(c.n, countryTotal)}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: "easeOut" }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr] [&>*]:min-w-0">
        <Panel title="Formations les plus demandées" icon={GraduationCap} action={<Link href={link("/etablissement/formations")} className="text-sm font-bold text-[#6a3df0] hover:underline">Gérer les formations</Link>}>
          {byProgram.length === 0 ? <Empty icon={GraduationCap} title="Aucune candidature par formation" text="Vos formations les plus demandées apparaîtront ici." /> : (
            <div className="relative -mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-[#eef1f8] text-left text-[11px] font-extrabold uppercase text-ink-mute"><th className="px-5 py-2.5 sm:px-6">Formation</th><th className="px-3 text-right">Candidatures</th><th className="px-3 text-right">Admis</th><th className="px-3">Taux</th><th className="w-[22%] px-5 sm:px-6"><span className="sr-only">Part</span></th></tr></thead>
                <tbody>
                  {byProgram.map((p, i) => (
                    <tr key={p.title} className="border-b border-[#f1f4fb] last:border-0">
                      <td className="px-5 py-3 font-bold sm:px-6">{p.title}</td><td className="px-3 text-right">{p.n}</td><td className="px-3 text-right">{p.admis}</td>
                      <td className="px-3"><Chip tone="green" className="whitespace-nowrap">{pct(p.admis, p.n)} %</Chip></td>
                      <td className="px-5 sm:px-6"><div className="h-1.5 rounded-full bg-[#eef1f8]"><motion.div className="h-full rounded-full bg-[#6a3df0]" initial={{ width: 0 }} animate={{ width: `${pct(p.n, byProgram[0].n)}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Besoins logement des admis" icon={KeyRound} tone="sun">
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3ead0" strokeWidth="4" />
                <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="#f9a806" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: ring / 100 }} transition={{ duration: 1, delay: 0.3 }} />
              </svg>
              <b className="absolute inset-0 flex items-center justify-center text-xl">{ring} %</b>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <b>{housing.admis_etrangers} admis internationa{housing.admis_etrangers > 1 ? "ux" : "l"} sur {kpis.admis}</b>
              <span className="text-ink-mute">venant d&apos;un autre pays, ils chercheront probablement un logement à {etab.ville}.</span>
            </div>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-mute">Déjà logés via Navilease</dt><dd className="font-extrabold text-[#0f8a46]">{housing.loges} étudiant{housing.loges > 1 ? "s" : ""}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-mute">Restent à loger</dt><dd className="font-extrabold">{Math.max(0, housing.admis_etrangers - housing.loges)}</dd></div>
          </dl>
          <Link href="/navilease" className="btn-primary mt-auto w-full">Découvrir les logements Navilease <ArrowRight size={16} /></Link>
        </Panel>
      </div>

      <Panel title="Dernières candidatures" icon={Inbox} className="mt-5" action={<Link href={link("/etablissement/candidatures")} className="text-sm font-bold text-[#6a3df0] hover:underline">Tout voir</Link>}>
        {recent.loading ? <Loading /> : recent.error ? <Alert tone="error">{recent.error.message}</Alert> : todo.length === 0 ? (
          <Empty icon={Inbox} title="Aucune candidature" text="Les nouvelles candidatures apparaîtront ici en temps réel." />
        ) : (
          <ul className="-my-2 divide-y divide-[#f1f4fb]">
            {todo.map((r) => (
              <li key={r.a.id}>
                <button onClick={() => router.push(link(`/etablissement/candidatures/${r.a.id}`))} className="flex w-full items-center gap-3 rounded-xl py-3 text-left hover:bg-brand-50/40">
                  <Avatar name={`${r.s.firstName} ${r.s.lastName}`} size={38} />
                  <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{r.s.firstName} {r.s.lastName}</b><span className="truncate text-xs text-ink-mute">{r.p.title} · #{r.a.number}</span></span>
                  <span className="hidden sm:block"><CountryTag code={r.s.country} /></span>
                  <span className="hidden text-xs text-ink-mute md:block">{r.a.submittedAt ? since(r.a.submittedAt) : "—"}</span>
                  <StatusBadge status={r.a.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
