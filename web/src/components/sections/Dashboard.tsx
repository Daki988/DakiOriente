"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Brain, Briefcase, Check, GraduationCap, Headset, KeyRound, MessageCircle, UsersRound } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Alert, Empty, StatusBadge, dateFr } from "@/components/app/kit";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { etabById } from "@/lib/data";
import { profileCompletion } from "@/components/espace/completion";

const STEPS = ["Profil complété", "Test d'orientation", "Recommandations", "Candidatures", "Admission", "Logement"];
const PROGRESS: Record<string, number> = { brouillon: 1, soumise: 2, paiement_confirme: 2, en_verification: 3, piece_demandee: 3, complet: 4, en_traitement: 4, liste_attente: 4, acceptee: 5, refusee: 5, desistee: 5 };
type Me = { profile: { level: string | null; serie: string | null; currentSchool: string | null; skills: string[]; riasec: { top: string[] } | null; preferences: { villes?: string[] } } | null; country: string | null; city: string | null; birthYear: number | null; emailVerifiedAt: string | null; phoneVerifiedAt: string | null };
type Cand = { a: { id: string; number: string; status: string; updatedAt: string }; p: { title: string }; e: { id: string; sigle: string; nom: string; logo: string | null } };
type Reco = { profil: string[]; offres: { programId: string; title: string; score: number; etablissement: { id: string; nom: string; sigle: string; ville: string; logo: string | null } }[] };
type Camp = { id: string; title: string; kind: string; endsAt: string; establishmentId: string };
type Booking = { b: { id: string; status: string; number: string }; h: { title: string; ville: string } };
type Guardian = { link: { status: string; consentAt: string | null } }[];

export function Dashboard() {
  const user = useUser();
  const me = useApi<Me>("/moi");
  const cands = useApi<Cand[]>("/candidatures");
  const reco = useApi<Reco>("/recommandations");
  const camps = useApi<Camp[]>("/campagnes");
  const books = useApi<Booking[]>("/reservations");
  const guards = useApi<Guardian>("/moi/tuteurs");
  const p = me.data?.profile;
  const completion = me.data ? profileCompletion(me.data) : 0;
  const list = cands.data ?? [];
  const admitted = list.find((c) => c.a.status === "acceptee");
  const housed = (books.data ?? []).some((b) => !["demande", "acceptee", "attente_garant", "refusee", "annulee"].includes(b.b.status));
  const flags = [completion >= 80, !!p?.riasec, !!p?.riasec, list.some((c) => c.a.status !== "brouillon"), !!admitted, housed];
  const done = flags.findIndex((x) => !x) === -1 ? STEPS.length - 1 : flags.findIndex((x) => !x);
  const minor = !!me.data?.birthYear && new Date().getFullYear() - me.data.birthYear < 18;
  const consent = (guards.data ?? []).some((g) => g.link.consentAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Bienvenue {user.firstName} <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ delay: 0.6, duration: 1.4 }}>👋</motion.span></h1><p className="text-ink-mute">Continue ton parcours vers ton avenir.</p></div>
        <Link href="/espace/profil" className="card flex items-center gap-4 px-5 py-4 transition hover:shadow-lift">
          <svg width="56" height="56" className="-rotate-90" aria-hidden><circle cx="28" cy="28" r="23" stroke="#e8edfa" strokeWidth="7" fill="none" /><motion.circle cx="28" cy="28" r="23" stroke="#1a47f5" strokeWidth="7" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: completion / 100 }} transition={{ duration: 1.4, ease: "easeOut" }} /></svg>
          <div><b className="block">Profil complété à {completion} %</b><span className="text-xs text-ink-mute">{completion < 100 ? "Complète ton profil pour de meilleures recommandations" : "Bravo, ton profil est complet"}</span></div>
        </Link>
      </div>

      {minor && guards.data && !consent && (
        <Alert tone="warn" title="Consentement parental requis" action={<Link href="/espace/profil#parent" className="btn-sun py-2.5"><UsersRound size={16} />Inviter mon parent</Link>}>
          Tu as moins de 18 ans : ton parent ou tuteur doit valider ton inscription avant tes candidatures, paiements et réservations.
        </Alert>
      )}

      <div className="card flex flex-col gap-5 p-6">
        <b>Mon parcours</b>
        <div className="relative">
          <div className="absolute left-[8%] right-[8%] top-4 h-[3px] bg-[#e8edfa] sm:top-5" />
          <motion.div className="absolute left-[8%] top-4 h-[3px] bg-gradient-to-r from-[#0f8a46] to-brand-600 sm:top-5" initial={{ width: 0 }} animate={{ width: `${(done / (STEPS.length - 1)) * 84}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
          <div className="relative grid grid-cols-6">
            {STEPS.map((t, k) => {
              const ok = k < done, cur = k === done;
              return (
                <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.1 }} className="flex flex-col items-center gap-2 text-center">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold sm:h-10 sm:w-10 ${ok ? "bg-[#0f8a46] text-white" : cur ? "bg-brand-600 text-white ring-[6px] ring-brand-100" : "border-2 border-[#dbe3f7] bg-white text-[#9aa3c0]"}`}>{ok ? <Check size={18} strokeWidth={3} /> : k + 1}</span>
                  <span className={`hidden text-xs font-bold sm:block ${ok || cur ? "" : "text-[#9aa3c0]"}`}>{t}</span>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm font-bold sm:hidden">Étape {done + 1}/{STEPS.length} : {STEPS[done]}</p>
        </div>
      </div>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([[Brain, p?.riasec ? "Repasser le test" : "Passer le test d'orientation", "from-brand-600 to-brand-400", "/orientation"], [Briefcase, "Découvrir les métiers", "from-[#0f8a46] to-[#34d399]", "/metiers"], [GraduationCap, "Rechercher une formation", "from-sun-500 to-sun-300", "/formations"], [KeyRound, "Trouver un logement", "from-[#6a3df0] to-[#a78bfa]", "/navilease/logements"]] as const).map(([I, t, g, href]) => (
          <StaggerItem key={href}>
            <Link href={href} className={`group relative flex h-32 flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br p-4 text-white transition hover:-translate-y-1 hover:shadow-lift ${g}`}>
              <I size={110} strokeWidth={1.5} className="absolute -bottom-6 -right-4 opacity-25 transition duration-500 group-hover:rotate-6 group-hover:scale-110" />
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><I size={20} /></span>
              <span className="flex items-center justify-between font-extrabold">{t}<ArrowUpRight size={18} /></span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Recommandations pour toi</h2><Link href="/orientation" className="text-[13px] font-bold text-brand-600">{p?.riasec ? `Profil ${p.riasec.top.join("·")}` : "Passer le test"}</Link></div>
          {reco.data && reco.data.offres.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {reco.data.offres.slice(0, 6).map((o) => (
                <Link key={o.programId} href={`/etablissements/${o.etablissement.id}/`} className="card flex flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center gap-2.5"><EtabLogo e={{ logo: o.etablissement.logo, sigle: o.etablissement.sigle, nom: o.etablissement.nom }} size={44} /><span className="min-w-0"><b className="line-clamp-2 text-sm">{o.title}</b><span className="text-xs text-ink-mute">{o.etablissement.sigle} · {o.etablissement.ville.split("/")[0]}</span></span></div>
                  <span className="chip self-start bg-[#e8f8ef] text-[#0f8a46]">{o.score} % compatible</span>
                </Link>
              ))}
            </div>
          ) : <Empty icon={Brain} title="Passe le test d'orientation" text="10 minutes pour découvrir ton profil et recevoir des formations et des écoles qui te correspondent." action={<Link href="/orientation" className="btn-primary">Commencer le test</Link>} />}
          <div className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Mes candidatures</h2><Link href="/espace/candidatures" className="text-[13px] font-bold text-brand-600">Tout voir</Link></div>
            {list.length ? list.slice(0, 4).map((c, k) => (
              <Link key={c.a.id} href={`/espace/candidatures/${c.a.id}`} className="flex items-center gap-4 rounded-2xl border border-[#eef1f8] p-3.5 hover:border-brand-200">
                <EtabLogo e={etabById[c.e.id] ?? { logo: c.e.logo, sigle: c.e.sigle, nom: c.e.nom }} size={46} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{c.p.title} · {c.e.sigle}</b><StatusBadge status={c.a.status} /></div>
                  <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <motion.span key={j} className="h-1.5 flex-1 rounded-full" initial={{ background: "#e8edfa" }} animate={{ background: j < (PROGRESS[c.a.status] ?? 1) ? (c.a.status === "refusee" ? "#d42a50" : "#1a47f5") : "#e8edfa" }} transition={{ delay: 0.4 + k * 0.15 + j * 0.08 }} />)}</div>
                </div>
              </Link>
            )) : <p className="py-4 text-sm text-ink-mute">Aucune candidature pour l&apos;instant. Trouve une formation et postule en quelques minutes.</p>}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3 p-5"><h2 className="text-lg font-extrabold">Échéances</h2>
            {(camps.data ?? []).slice(0, 4).map((c) => { const d = new Date(c.endsAt); return (
              <Link key={c.id} href={`/etablissements/${c.establishmentId}/`} className="flex items-center gap-3"><span className="flex w-12 flex-col items-center rounded-xl bg-brand-50 py-1.5"><b className="text-lg">{d.getDate()}</b><span className="text-[10px] font-bold uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span></span><span><b className="block text-[13px]">{c.title}</b><span className="text-xs text-ink-mute">{etabById[c.establishmentId]?.sigle} · clôture le {dateFr(c.endsAt)}</span></span></Link>); })}
            {camps.data && !camps.data.length && <p className="text-sm text-ink-mute">Aucune campagne en cours pour l&apos;instant.</p>}
          </div>
          <div className="card flex flex-col gap-3 bg-gradient-to-br from-white to-[#fff7dd] p-5"><div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Mon logement</b></div>
            {books.data?.length ? books.data.slice(0, 2).map((b) => <Link key={b.b.id} href={`/navilease/reservations/${b.b.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-[13px]"><span><b className="block">{b.h.title}</b><span className="text-ink-mute">{b.h.ville} · {b.b.number}</span></span><StatusBadge status={b.b.status} /></Link>)
              : <p className="text-[13px] text-ink-mute">{admitted ? `Admis·e à ${admitted.e.sigle} ? Trouve un logement vérifié à proximité.` : "Des logements vérifiés près de ton école, avec paiement protégé."}</p>}
            <Link href={admitted ? `/navilease/logements?etablissement=${admitted.e.id}` : "/navilease/logements"} className="btn-primary py-2.5">Voir sur Navilease</Link>
          </div>
          <div className="card flex flex-col gap-3 p-5"><b>Mon conseiller</b>
            <div className="flex items-center gap-2.5"><span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#e8f8ef] text-[#0f8a46]"><Headset size={20} /></span><span><b className="block text-sm">Conseillers Navigoal</b><span className="text-xs text-ink-mute">Visio, téléphone ou WhatsApp</span></span></div>
            <Link href="/espace/conseiller" className="btn-ghost py-2.5"><MessageCircle size={16} /> Prendre rendez-vous</Link></div>
        </div>
      </div>
    </div>
  );
}
