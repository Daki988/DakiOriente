"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, Building2, ClipboardList, Compass, FileCheck2, Filter, Globe2, GraduationCap, Home, KeyRound, RefreshCw, ShieldCheck, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Chip, Kpi, Loading, Panel, money, statusLabel } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { AdminHeader, Bar, Flag, LoadError, nf, pct, ROLE_LABEL, Reveal } from "./shared";

type Stats = {
  usersByRole: { role: string; n: number }[];
  usersByCountry: { country: string | null; n: number }[];
  activity: { total: number; nouveaux: number; actifs: number };
  orientation: { tests: number; profils: Record<string, number> | null };
  appsByStatus: { status: string; n: number }[];
  topFormations: { title: string; n: number }[];
  navilease: { actives: number; verifiees: number; reservations: number; occupees: number; litiges: number; loyer_moyen: number | null };
  paymentsByCur: { currency: string; total: number | null; sequestre: number | null }[];
  weekly: { semaine: string; n: number }[];
  funnel: { inscrits: number; testes: number; candidats: number; admis: number; loges: number };
};
type Moderation = { housings: unknown[]; kyc: unknown[]; disputes: unknown[] };

export function AdminDashboard() {
  const { data: s, error, loading, reload } = useApi<Stats>("/admin/statistiques");
  const mod = useApi<Moderation>("/admin/moderation");
  const pend = useApi<{ total: number }>("/admin/utilisateurs?statut=en_attente&role=etablissement");
  const now = new Date();

  return (
    <div className="min-w-0">
      <AdminHeader title="Tableau de bord" sub={`Données au ${now.toLocaleDateString("fr-FR")} · ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · tous pays`}
        actions={<Button variant="ghost" icon={RefreshCw} onClick={() => { reload(); mod.reload(); pend.reload(); }}>Actualiser</Button>} />
      {loading && !s ? <Loading /> : error ? <LoadError error={error} reload={reload} /> : s && <Body s={s} mod={mod.data} pendingSchools={pend.data?.total ?? 0} />}
    </div>
  );
}

function Body({ s, mod, pendingSchools }: { s: Stats; mod?: Moderation; pendingSchools: number }) {
  const candidatures = s.appsByStatus.filter((a) => a.status !== "brouillon").reduce((t, a) => t + a.n, 0);
  const admis = s.appsByStatus.find((a) => a.status === "acceptee")?.n ?? 0;
  const f = s.funnel;
  const alerts = [
    { n: pendingSchools, t: pendingSchools > 1 ? "comptes établissement à valider" : "compte établissement à valider", sub: "Vérifier le domaine et les pièces", href: "/admin/utilisateurs?statut=en_attente", Icon: Building2, tone: "bg-[#f1edff] text-[#6a3df0]" },
    { n: mod?.housings.length ?? 0, t: (mod?.housings.length ?? 0) > 1 ? "annonces Navilease à modérer" : "annonce Navilease à modérer", sub: "Photos, prix, coordonnées", href: "/admin/navilease", Icon: Home, tone: "bg-sun-100 text-[#a55a00]" },
    { n: mod?.kyc.length ?? 0, t: (mod?.kyc.length ?? 0) > 1 ? "KYC bailleurs à valider" : "KYC bailleur à valider", sub: "Identité et titre de propriété", href: "/admin/navilease#kyc", Icon: ShieldCheck, tone: "bg-brand-50 text-brand-600" },
    { n: mod?.disputes.length ?? 0, t: (mod?.disputes.length ?? 0) > 1 ? "litiges ouverts" : "litige ouvert", sub: "Médiation et séquestre", href: "/admin/navilease#litiges", Icon: AlertTriangle, tone: "bg-[#ffecef] text-[#d42a50]" },
  ];
  const totalAlerts = alerts.reduce((t, a) => t + a.n, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[
          <Kpi key="i" icon={Users} label="Inscrits" value={nf(s.activity.total)} sub={`+${nf(s.activity.nouveaux)} sur 30 jours`} />,
          <Kpi key="a" icon={Activity} tone="green" label="Actifs (30 j)" value={nf(s.activity.actifs)} sub={`${pct(s.activity.actifs, s.activity.total)} des inscrits`} />,
          <Kpi key="t" icon={Compass} tone="blue" label="Tests réalisés" value={nf(s.orientation.tests)} sub={`${pct(f.testes, f.inscrits)} des élèves testés`} />,
          <Kpi key="c" icon={FileCheck2} tone="violet" label="Candidatures" value={nf(candidatures)} sub={`${nf(f.candidats)} candidats`} />,
          <Kpi key="ad" icon={GraduationCap} tone="sun" label="Admissions" value={nf(admis)} sub={`taux ${pct(admis, candidatures)}`} />,
        ].map((k, i) => <Reveal key={i} i={i} className={i === 4 ? "col-span-2 lg:col-span-1" : ""}>{k}</Reveal>)}
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Candidatures soumises par semaine" icon={BarChart3} action={<Chip tone="grey">12 semaines</Chip>}>
          <WeeklyChart weekly={s.weekly} />
        </Panel>
        <Panel title="Alertes de modération" icon={AlertTriangle} action={<Chip tone={totalAlerts ? "rose" : "green"}>{totalAlerts}</Chip>}>
          <ul className="flex flex-col gap-2.5">
            {alerts.map((a, i) => (
              <Reveal key={a.t} i={i} as="li">
                <Link href={a.href} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.tone}`}><a.Icon size={18} /></span>
                  <span className="flex min-w-0 flex-1 flex-col"><b className="text-sm">{a.n} {a.t}</b><span className="text-xs text-ink-mute">{a.sub}</span></span>
                  <span className="text-[13px] font-bold text-brand-600">{a.n ? "Traiter" : "Voir"}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Entonnoir de conversion" icon={Filter} action={<Chip tone="grey">Depuis le lancement</Chip>}>
          <Funnel f={f} />
        </Panel>
        <Panel title="Navilease" icon={KeyRound} tone="sun" action={<Link href="/admin/navilease" className="text-[13px] font-bold text-brand-600">Modération</Link>}>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Annonces actives" value={nf(s.navilease.actives)} sub={`${nf(s.navilease.occupees)} occupées`} />
            <Mini label="Taux de vérification" value={pct(s.navilease.verifiees, s.navilease.actives)} sub="visitées ou certifiées" />
            <Mini label="Réservations" value={nf(s.navilease.reservations)} sub="depuis le lancement" />
            <Mini label="Litiges ouverts" value={nf(s.navilease.litiges)} sub="ouverts ou en médiation" danger={s.navilease.litiges > 0} />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm"><span className="font-bold">Loyer moyen publié</span><b>{s.navilease.loyer_moyen == null ? "—" : nf(s.navilease.loyer_moyen)}</b></div>
          <p className="text-xs text-ink-mute">Loyer moyen toutes devises confondues (indicatif).</p>
        </Panel>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-3">
        <Panel title="Élèves par pays" icon={Globe2}>
          <Breakdown rows={s.usersByCountry.map((c) => ({ k: c.country ?? "?", label: c.country ? <Flag code={c.country} withName /> : "Non renseigné", n: c.n }))} empty="Aucun élève inscrit." />
        </Panel>
        <Panel title="Utilisateurs par rôle" icon={Users}>
          <Breakdown rows={s.usersByRole.map((r) => ({ k: r.role, label: ROLE_LABEL[r.role] ?? r.role, n: r.n }))} empty="Aucun utilisateur." color="bg-[#6a3df0]" />
        </Panel>
        <Panel title="Paiements par devise" icon={Wallet} action={<Link href="/admin/paiements" className="text-[13px] font-bold text-brand-600">Détail</Link>}>
          {s.paymentsByCur.length ? (
            <ul className="flex flex-col gap-3">
              {s.paymentsByCur.map((p) => (
                <li key={p.currency} className="rounded-2xl border border-slate-200/80 p-3.5">
                  <div className="flex items-center justify-between"><b>{p.currency}</b><Chip tone="green">Encaissé</Chip></div>
                  <div className="mt-1 text-lg font-extrabold">{money(p.total ?? 0, p.currency)}</div>
                  <div className="text-xs text-ink-mute">dont en séquestre : <b className="text-[#6a3df0]">{money(p.sequestre ?? 0, p.currency)}</b></div>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-ink-mute">Aucun paiement enregistré.</p>}
        </Panel>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        <Panel title="Formations les plus demandées" icon={GraduationCap}>
          <Breakdown rows={s.topFormations.map((t) => ({ k: t.title, label: t.title, n: t.n }))} empty="Aucune candidature soumise pour l'instant." color="bg-sun-400" />
        </Panel>
        <Panel title="Candidatures par statut" icon={ClipboardList}>
          {s.appsByStatus.length ? (
            <div className="flex flex-wrap gap-2">{s.appsByStatus.map((a) => <span key={a.status} className="chip bg-[#eef1f8] text-ink-soft">{statusLabel(a.status)} <b className="text-ink">{nf(a.n)}</b></span>)}</div>
          ) : <p className="py-6 text-center text-sm text-ink-mute">Aucune candidature.</p>}
          {s.orientation.profils && (
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-ink-mute">Profils RIASEC dominants</span>
              <div className="flex flex-wrap gap-2">{Object.entries(s.orientation.profils).sort((a, b) => b[1] - a[1]).map(([k, n]) => <Chip key={k} tone="violet">{k} · {nf(n)}</Chip>)}</div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

const Mini = ({ label, value, sub, danger }: { label: string; value: string; sub: string; danger?: boolean }) => (
  <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-200/80 bg-white p-3.5">
    <span className="text-[11px] font-bold uppercase text-ink-mute">{label}</span>
    <b className={`text-xl ${danger ? "text-[#d42a50]" : ""}`}>{value}</b>
    <span className="text-xs text-ink-mute">{sub}</span>
  </div>
);

function Breakdown({ rows, empty, color = "bg-brand-600" }: { rows: { k: string; label: React.ReactNode; n: number }[]; empty: string; color?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-mute">{empty}</p>;
  const sorted = [...rows].sort((a, b) => b.n - a.n);
  const max = sorted[0].n;
  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((r, i) => (
        <li key={r.k} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-semibold">{r.label}</span><b>{nf(r.n)}</b></div>
          <Bar value={r.n} max={max} className={color} delay={i * 0.06} label={`${typeof r.label === "string" ? r.label : r.k} : ${r.n}`} />
        </li>
      ))}
    </ul>
  );
}

function Funnel({ f }: { f: Stats["funnel"] }) {
  const steps: [string, number][] = [["Inscrits (élèves)", f.inscrits], ["Testés", f.testes], ["Candidats", f.candidats], ["Admis", f.admis], ["Logés", f.loges]];
  const max = Math.max(1, f.inscrits);
  const shades = ["bg-brand-100", "bg-brand-200", "bg-brand-400", "bg-brand-600", "bg-sun-400"];
  return (
    <div className="flex flex-col gap-3">
      {steps.map(([l, n], i) => (
        <div key={l} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 sm:grid-cols-[140px_1fr_64px_72px]">
          <b className="text-sm">{l}</b>
          <div className="h-8 overflow-hidden rounded-xl bg-[#f3f5fb]">
            <motion.div className={`h-full rounded-xl ${shades[i]}`} initial={{ width: 0 }} animate={{ width: `${Math.max(n ? 2 : 0, (n / max) * 100)}%` }} transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }} />
          </div>
          <b className="text-right text-sm">{nf(n)}</b>
          <span className="hidden rounded-full bg-[#eef1f8] px-2 py-1 text-center text-xs font-bold text-ink-soft sm:block">{i === 0 ? "—" : pct(n, steps[i - 1][1])}</span>
        </div>
      ))}
      <p className="text-xs text-ink-mute">Taux global inscrit → admis : {pct(f.admis, f.inscrits)} · inscrit → logé : {pct(f.loges, f.inscrits)}. Pourcentages calculés par rapport à l&apos;étape précédente.</p>
    </div>
  );
}

/** Courbe hebdomadaire (12 semaines, semaines vides complétées à 0). */
function WeeklyChart({ weekly }: { weekly: Stats["weekly"] }) {
  const pts = useMemo(() => {
    const map = new Map(weekly.map((w) => [w.semaine, w.n]));
    const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return Array.from({ length: 12 }, (_, i) => {
      const w = new Date(d.getTime() - (11 - i) * 7 * 864e5);
      const k = w.toISOString().slice(0, 10);
      return { k, n: map.get(k) ?? 0, label: w.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }) };
    });
  }, [weekly]);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, L = 36, R = 12, T = 14, B = 28;
  const max = Math.max(4, ...pts.map((p) => p.n));
  const nice = Math.ceil(max / 4) * 4;
  const x = (i: number) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / nice);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const total = pts.reduce((t, p) => t + p.n, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2"><b className="text-2xl">{nf(total)}</b><span className="text-sm text-ink-mute">candidatures soumises sur 12 semaines</span></div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Candidatures par semaine : ${pts.map((p) => `${p.label} ${p.n}`).join(", ")}`} onMouseLeave={() => setHover(null)}>
          {[0, 1, 2, 3, 4].map((g) => { const v = (nice / 4) * g; return <g key={g}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e8ecf6" strokeWidth={1} /><text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#8a93ad">{nf(v)}</text></g>; })}
          {pts.map((p, i) => (i % 2 === 0 || i === pts.length - 1) && <text key={p.k} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} fontSize={10} fill="#8a93ad">{p.label}</text>)}
          <motion.path d={area} fill="#1a47f5" fillOpacity={0.08} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
          <motion.path d={line} fill="none" stroke="#1a47f5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: "easeOut" }} />
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} stroke="#c9d3ee" strokeDasharray="3 3" />}
          {pts.map((p, i) => <circle key={p.k} cx={x(i)} cy={y(p.n)} r={hover === i ? 5 : 3.5} fill="#fff" stroke="#1a47f5" strokeWidth={2} />)}
          {pts.map((p, i) => <rect key={`h${p.k}`} x={x(i) - (W - L - R) / 22} y={T} width={(W - L - R) / 11} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />)}
        </svg>
        {hover != null && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lift" style={{ left: `${(x(hover) / W) * 100}%` }}>
            Semaine du {pts[hover].label}<br /><b className="text-sm">{nf(pts[hover].n)}</b> candidature{pts[hover].n > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

