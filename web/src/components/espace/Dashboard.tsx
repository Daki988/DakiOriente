"use client";
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Brain, Briefcase, Building2, Check, GraduationCap, Headset, KeyRound, MapPin, MessageCircle, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { LabelChip, domStyle } from "@/components/ui/Cards";
import { Alert, Empty, StatusBadge, Tabs, dateFr } from "@/components/app/kit";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { etabById, type Label } from "@/lib/data";
import { profileCompletion } from "./completion";
import { AppProgress } from "./AppProgress";
import { ParrainageCard } from "./Parrainage";

export type Reco = {
  profil: string[];
  metiers: { id: string; nom: string; domaine: string; score: number }[];
  formations: { id: string; intitule: string; domaine: string; score: number; serieOk: boolean }[];
  offres: { programId: string; title: string; formationId: string; campuses: string[]; homologated: boolean; statut: string | null; score: number; etablissement: { id: string; nom: string; sigle: string; ville: string; logo: string | null; label: string | null } }[];
  etablissements: { etablissement: { id: string; nom: string; sigle: string; ville: string; logo: string | null; label: string | null }; score: number; formations: number }[];
};
type Me = { profile: { level: string | null; serie: string | null; currentSchool: string | null; skills: string[]; riasec: { top: string[] } | null; preferences: { villes?: string[] } } | null; country: string | null; city: string | null; birthYear: number | null };
type Cand = { a: { id: string; number: string; status: string; updatedAt: string; submittedAt: string | null; campus: string | null }; p: { title: string }; e: { id: string; sigle: string; nom: string; ville: string; logo: string | null } };
type Camp = { id: string; title: string; kind: string; endsAt: string; establishmentId: string };
type Guardian = { link: { status: string; consentAt: string | null } }[];

const STEPS = ["Profil complété", "Test d'orientation", "Recommandations", "Candidatures", "Admission"];
/** Libellés courts pour les petits écrans (sans coupure au milieu des mots). */
const STEPS_COURTS = ["Profil", "Test", "Conseils", "Dossiers", "Admission"];

/** Étapes du parcours, calculées sur l'état réel du compte. */
export function parcours(completion: number, tested: boolean, cands: { a: { status: string } }[]) {
  const done = [
    completion >= 80,
    tested,
    tested && cands.length > 0, // recommandations exploitées : au moins une candidature commencée
    cands.some((c) => c.a.status !== "brouillon"),
    cands.some((c) => c.a.status === "acceptee"),
  ];
  const current = done.findIndex((x) => !x);
  return { done, current: current === -1 ? STEPS.length : current };
}

const Compat = ({ v }: { v: number }) => <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><span className="h-1.5 w-1.5 rounded-full bg-[#0f8a46]" />{v} % compatible</span>;

export function Dashboard() {
  const user = useUser();
  const me = useApi<Me>("/moi");
  const cands = useApi<Cand[]>("/candidatures");
  const reco = useApi<Reco>("/recommandations");
  const camps = useApi<Camp[]>("/campagnes");
  const guards = useApi<Guardian>("/moi/tuteurs");
  const [tab, setTab] = useState<"formations" | "metiers" | "etablissements">("formations");
  const p = me.data?.profile;
  const completion = me.data ? profileCompletion(me.data) : 0;
  const list = cands.data ?? [];
  const tested = !!p?.riasec;
  const { done, current } = parcours(completion, tested, list);
  const minor = !!me.data?.birthYear && new Date().getFullYear() - me.data.birthYear < 18;
  const consent = (guards.data ?? []).some((g) => g.link.consentAt);
  const admitted = list.find((c) => c.a.status === "acceptee");
  const NEXT: [string, string][] = [["Compléter mon profil", "/espace/profil"], ["Passer le test d'orientation", "/orientation"], ["Voir les formations recommandées", "#recommandations"], ["Envoyer ma candidature", "/espace/candidatures"], ["Suivre mes candidatures", "/espace/candidatures"]];
  const r = reco.data;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">Bienvenue {user.firstName} <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ delay: 0.6, duration: 1.4 }}>👋</motion.span></h1>
          <p className="text-ink-mute">Continue ton parcours vers ton avenir.</p>
        </div>
        <Link href="/espace/profil" className="card flex items-center gap-4 px-4 py-3 transition hover:shadow-lift sm:min-w-[300px] sm:px-5 sm:py-4">
          <div className="flex-1">
            <b className="block text-sm">Profil complété à {me.data ? completion : "…"} %</b>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8edfa]"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#0f8a46] to-[#34d399]" initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 1.2, ease: "easeOut" }} /></div>
            <span className="mt-1 block text-xs text-ink-mute">{completion < 100 ? "Complète ton profil pour des recommandations plus justes" : "Bravo, ton profil est complet"}</span>
          </div>
          <ArrowRight size={18} className="text-ink-mute" />
        </Link>
      </div>

      {minor && guards.data && !consent && (
        <Alert tone="warn" title="Consentement parental requis" action={<Link href="/espace/profil#parent" className="btn-sun py-2.5"><UsersRound size={16} />Inviter mon parent</Link>}>
          Tu as moins de 18 ans : ton parent ou tuteur doit valider ton inscription avant tes candidatures, paiements et réservations.
        </Alert>
      )}

      <section className="card flex flex-col gap-4 p-4 sm:p-6" aria-labelledby="parcours">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="parcours" className="font-extrabold">Mon parcours</h2>
          {current < STEPS.length ? <Link href={NEXT[current][1]} className="flex items-center gap-1 text-[13px] font-bold text-brand-600">Prochaine étape : {NEXT[current][0]}<ArrowRight size={14} /></Link> : <span className="chip bg-[#e8f8ef] text-[#0f8a46]">Admission obtenue 🎉</span>}
        </div>
        <ol className="relative grid grid-cols-5">
          <span className="absolute left-[10%] right-[10%] top-4 h-[3px] bg-[#e8edfa] sm:top-5" aria-hidden />
          <motion.span className="absolute left-[10%] top-4 h-[3px] bg-gradient-to-r from-[#0f8a46] to-brand-600 sm:top-5" aria-hidden initial={{ width: 0 }} animate={{ width: `${(Math.min(current, STEPS.length - 1) / (STEPS.length - 1)) * 80}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
          {STEPS.map((t, k) => {
            const ok = done[k], cur = k === current;
            return (
              <motion.li key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.1 }} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={cur ? "step" : undefined}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold sm:h-10 sm:w-10 ${ok ? "bg-[#0f8a46] text-white" : cur ? "bg-brand-600 text-white ring-[5px] ring-brand-100" : "border-2 border-[#dbe3f7] bg-white text-[#9aa3c0]"}`}>{ok ? <Check size={17} strokeWidth={3} /> : k + 1}</span>
                <span lang="fr" className={`w-full px-0.5 text-[10px] font-bold leading-tight sm:text-xs ${ok || cur ? "" : "text-[#9aa3c0]"}`}><span className="sm:hidden">{STEPS_COURTS[k]}</span><span className="hidden sm:inline">{t}</span></span>
              </motion.li>
            );
          })}
        </ol>
      </section>

      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {([[Brain, tested ? "Repasser le test d'orientation" : "Passer le test d'orientation", "from-brand-600 to-brand-400", "/orientation"], [Briefcase, "Découvrir les métiers", "from-[#0f8a46] to-[#34d399]", "/metiers"], [Search, "Rechercher une formation", "from-[#f26a1b] to-sun-400", "/formations"], [Building2, "Trouver un établissement", "from-[#6a3df0] to-[#a78bfa]", "/etablissements"]] as const).map(([I, t, g, href]) => (
          <StaggerItem key={href}>
            <Link href={href} className={`group relative flex h-28 flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br p-3.5 text-white transition hover:-translate-y-1 hover:shadow-lift sm:h-32 sm:p-4 ${g}`}>
              <I size={100} strokeWidth={1.5} className="absolute -bottom-6 -right-4 opacity-20 transition duration-500 group-hover:rotate-6 group-hover:scale-110" />
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 sm:h-10 sm:w-10"><I size={19} /></span>
              <span className="flex items-end justify-between gap-1 text-[14px] font-extrabold leading-snug sm:text-[15px]">{t}<ArrowUpRight size={17} className="shrink-0" /></span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <ParrainageCard />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <section id="recommandations" className="card flex min-w-0 flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold sm:text-xl">Recommandations pour toi</h2>
              <Link href={tab === "metiers" ? "/metiers" : tab === "etablissements" ? "/etablissements" : "/espace/orientation"} className="text-[13px] font-bold text-brand-600">Voir tout</Link>
            </div>
            {!tested ? (
              <Empty icon={Brain} title="Passe le test d'orientation" text="5 minutes pour découvrir ton profil et recevoir des formations, des métiers et des établissements qui te correspondent, avec leur pourcentage de compatibilité." action={<Link href="/orientation" className="btn-primary">Commencer le test</Link>} />
            ) : (
              <>
                <Tabs value={tab} onChange={setTab} items={[["formations", <span key="f" className="flex items-center gap-1.5"><GraduationCap size={14} />Formations</span>], ["metiers", <span key="m" className="flex items-center gap-1.5"><Briefcase size={14} />Métiers</span>], ["etablissements", <span key="e" className="flex items-center gap-1.5"><Building2 size={14} />Établissements</span>]]} />
                {reco.loading && <p className="py-6 text-sm text-ink-mute">Calcul de tes recommandations…</p>}
                {r && tab === "formations" && (r.offres.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {r.offres.slice(0, 6).map((o) => {
                      const e = etabById[o.etablissement.id];
                      return (
                        <Link key={o.programId} href={`/formations/${o.formationId}/?etab=${o.etablissement.id}`} className="flex min-w-0 gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:shadow-card">
                          {e ? <EtabPhoto e={e} className="h-[72px] w-[72px] shrink-0" rounded="rounded-xl" /> : <EtabLogo e={o.etablissement} size={72} />}
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <b className="line-clamp-2 text-[13.5px] leading-snug">{o.title}</b>
                            <span className="truncate text-xs text-ink-mute">{o.etablissement.nom}</span>
                            <span className="flex items-center gap-1 text-xs text-ink-mute"><MapPin size={11} />{o.campuses.length > 1 ? `${o.campuses.length} campus` : o.etablissement.ville}{o.statut === "recente" && <span className="ml-1 chip bg-brand-50 py-0 text-brand-700">Accrédité</span>}</span>
                            <span className="mt-1"><Compat v={o.score} /></span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : <p className="py-6 text-sm text-ink-mute">Aucune formation publiée ne correspond encore à ton profil. Complète ta série et tes villes d&apos;études dans ton profil.</p>)}
                {r && tab === "metiers" && (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {r.metiers.slice(0, 6).map((m) => { const st = domStyle(m.domaine); const I = st.icon; return (
                      <Link key={m.id} href={`/metiers/${m.id}/`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:shadow-card">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: st.solid }}><I size={22} /></span>
                        <span className="flex min-w-0 flex-col gap-1"><b className="truncate text-[13.5px]">{m.nom}</b><Compat v={m.score} /></span>
                      </Link>); })}
                  </div>
                )}
                {r && tab === "etablissements" && (r.etablissements.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {r.etablissements.slice(0, 6).map(({ etablissement: x, score, formations }) => (
                      <Link key={x.id} href={`/etablissements/${x.id}/`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200 hover:shadow-card">
                        <EtabLogo e={etabById[x.id] ?? x} size={52} />
                        <span className="flex min-w-0 flex-col gap-1"><b className="truncate text-[13.5px]">{x.nom}</b><span className="text-xs text-ink-mute">{x.ville} · {formations} formation{formations > 1 ? "s" : ""} compatible{formations > 1 ? "s" : ""}</span>
                          <span className="flex flex-wrap gap-1"><Compat v={score} />{x.label && <LabelChip label={x.label as Label} court />}</span></span>
                      </Link>
                    ))}
                  </div>
                ) : <p className="py-6 text-sm text-ink-mute">Aucun établissement compatible pour l&apos;instant.</p>)}
              </>
            )}
          </section>

          <section className="card flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold sm:text-xl">Mes candidatures</h2><Link href="/espace/candidatures" className="text-[13px] font-bold text-brand-600">Tout voir</Link></div>
            {list.length ? list.slice(0, 3).map((c) => (
              <Link key={c.a.id} href={`/espace/candidatures/${c.a.id}`} className="flex flex-col gap-3 rounded-2xl border border-[#eef1f8] p-3.5 hover:border-brand-200">
                <div className="flex items-center gap-3">
                  <EtabLogo e={etabById[c.e.id] ?? { logo: c.e.logo, sigle: c.e.sigle, nom: c.e.nom }} size={42} />
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm">{c.p.title}</b><span className="text-xs text-ink-mute">{c.e.nom}{c.a.campus ? ` · ${c.a.campus}` : ""}</span></span>
                  <StatusBadge status={c.a.status} />
                </div>
                <AppProgress status={c.a.status} compact />
              </Link>
            )) : <p className="py-4 text-sm text-ink-mute">Aucune candidature pour l&apos;instant. Trouve une formation et postule en quelques minutes.</p>}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="card flex flex-col gap-3 p-4 sm:p-5"><h2 className="text-lg font-extrabold">Échéances des campagnes</h2>
            {(camps.data ?? []).slice(0, 4).map((c) => { const d = new Date(c.endsAt); return (
              <Link key={c.id} href={`/etablissements/${c.establishmentId}/`} className="flex items-center gap-3"><span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-brand-50 py-1.5"><b className="text-lg leading-tight">{d.getDate()}</b><span className="text-[10px] font-bold uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span></span><span className="min-w-0"><b className="block truncate text-[13px]">{c.title}</b><span className="text-xs text-ink-mute">{etabById[c.establishmentId]?.sigle} · clôture le {dateFr(c.endsAt)}</span></span></Link>); })}
            {camps.data && !camps.data.length && <p className="text-sm text-ink-mute">Aucune campagne d&apos;admission ouverte pour l&apos;instant.</p>}
          </section>
          <section className="card flex flex-col gap-3 bg-gradient-to-br from-white to-[#fff7dd] p-4 sm:p-5"><div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Mon logement</b></div>
            <p className="text-[13px] text-ink-mute">{admitted ? `Admis·e à ${admitted.e.sigle} ? Trouve un logement vérifié près de ton campus.` : "Des logements étudiants vérifiés près de ton futur établissement, avec paiement protégé."}</p>
            <Link href={admitted ? `/navilease/logements?etablissement=${admitted.e.id}` : "/navilease/logements"} className="btn-primary py-2.5">Voir sur Navilease</Link>
          </section>
          <section className="card flex flex-col gap-3 p-4 sm:p-5"><b>Mon conseiller</b>
            <div className="flex items-center gap-2.5"><span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#e8f8ef] text-[#0f8a46]"><Headset size={20} /></span><span><b className="block text-sm">Conseillers Navigoal</b><span className="text-xs text-ink-mute">Visio, téléphone ou WhatsApp</span></span></div>
            <Link href="/espace/conseiller" className="btn-ghost py-2.5"><MessageCircle size={16} /> Prendre rendez-vous</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
