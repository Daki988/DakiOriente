// Accueil (maquette validée) : catégories, chiffres, parcours, encarts, formations populaires, communauté, établissements.
import Link from "@/components/ui/Link";
import { EcolesPartenaires } from "@/components/ui/Partenaires";
import { ArrowRight, BadgeCheck, Briefcase, Building2, ChevronRight, Compass, FileCheck2, GraduationCap, Landmark, MapPin, Search, Sparkles, UserRound, Users } from "lucide-react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Illustration } from "@/components/ui/Illustration";
import { Marquee } from "@/components/motion/Marquee";
import { Counter } from "@/components/motion/Counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { domStyle } from "@/components/ui/Cards";
import { CHIFFRES, FORMATIONS_UNE } from "@/lib/catalogue";
import { etablissements, riasec } from "@/lib/data";
import { photo, photoDomaine } from "@/lib/photos";

const CATEGORIES = [
  { href: "/metiers", Icon: Briefcase, bg: "#eef4ff", fg: "#1a47f5", t: "Métiers", s: "Découvre les métiers qui te ressemblent." },
  { href: "/formations", Icon: FileCheck2, bg: "#fff3e3", fg: "#e2701b", t: "Formations", s: "Trouve la formation adaptée à ton projet." },
  { href: "/etablissements", Icon: Landmark, bg: "#f1edff", fg: "#6a3df0", t: "Établissements", s: "Compare et choisis ton école au Maroc." },
  { href: "/orientation", Icon: Compass, bg: "#eaf1ff", fg: "#1336e0", t: "Orientation", s: "Fais le test et obtiens des recommandations." },
];
export function Categories() {
  return (
    <Stagger className="container relative z-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:-mt-2 lg:grid-cols-4 lg:gap-4">
      {CATEGORIES.map(({ href, Icon, bg, fg, t, s }) => (
        <StaggerItem key={t}>
          <Link href={href} className="group flex h-full items-center gap-3.5 rounded-[20px] border border-white/60 p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lift sm:p-5" style={{ background: bg }}>
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:scale-110" style={{ color: fg }}><Icon size={24} /></span>
            <span className="min-w-0 flex-1"><span className="block font-extrabold" style={{ color: fg }}>{t}</span><span className="block text-[13px] leading-snug text-ink-soft">{s}</span></span>
            <ChevronRight size={18} className="shrink-0 text-ink-mute transition group-hover:translate-x-1" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function StatsBand() {
  const items: [typeof Users, number, string][] = [
    [Building2, CHIFFRES.etablissements, "établissements privés au Maroc"],
    [GraduationCap, CHIFFRES.filieres, "filières accréditées par l'État"],
    [MapPin, CHIFFRES.villes, "villes d'études"],
    [Users, CHIFFRES.paysAfrique, "pays d'Afrique : démarches détaillées"],
  ];
  return (
    <section className="mt-8 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-700 text-white">
      <div className="container grid grid-cols-2 gap-x-4 gap-y-6 py-7 lg:grid-cols-4">
        {items.map(([I, n, l], k) => (
          <div key={l} className={`flex items-center gap-3 ${k ? "lg:border-l lg:border-white/15 lg:pl-6" : ""}`}>
            <I size={30} className="shrink-0 text-sun-400" />
            <div className="min-w-0"><div className="text-2xl font-extrabold sm:text-[28px]"><Counter to={n} /></div><div className="text-[13px] leading-snug text-[#c9d6ff]">{l}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

const ETAPES = [
  { Icon: UserRound, bg: "#eaf1ff", fg: "#1a47f5", t: "Découvre ton profil", s: "Fais le test d'orientation et connais tes forces.", href: "/orientation" },
  { Icon: Search, bg: "#fff3e3", fg: "#e2701b", t: "Explore les métiers", s: "Missions, compétences et formations qui y mènent.", href: "/metiers" },
  { Icon: GraduationCap, bg: "#e8f8ef", fg: "#0f8a46", t: "Trouve une formation", s: `${CHIFFRES.formations} formations proposées au Maroc.`, href: "/formations" },
  { Icon: Landmark, bg: "#f1edff", fg: "#6a3df0", t: "Choisis un établissement", s: "Compare labels, campus, frais et logement.", href: "/comparateur" },
  { Icon: FileCheck2, bg: "#ffecef", fg: "#d42a50", t: "Candidate", s: "Constitue ton dossier en ligne et suis son évolution.", href: "/inscription" },
];
export function Parcours() {
  return (
    <section className="container mt-16 sm:mt-20">
      <Reveal className="flex flex-col items-center gap-2 text-center">
        <h2 className="h-section">Un accompagnement à <span className="text-sun-500">chaque étape</span></h2>
        <p className="max-w-2xl text-ink-mute">De la découverte de ton profil à ton admission, Navigoal t&apos;accompagne tout au long de ton parcours.</p>
      </Reveal>
      <div className="relative mt-10">
        <div className="absolute left-[10%] right-[10%] top-9 hidden border-t-2 border-dashed border-[#d6def3] md:block" />
        <Stagger className="relative grid gap-5 md:grid-cols-5 md:gap-6">
          {ETAPES.map(({ Icon, bg, fg, t, s, href }, k) => (
            <StaggerItem key={t}>
              <Link href={href} className="group grid grid-cols-[64px_1fr] items-center gap-x-4 rounded-2xl p-1 text-left md:flex md:flex-col md:items-center md:gap-3 md:text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full ring-8 ring-[#f6f8fe] transition group-hover:scale-110 md:h-[72px] md:w-[72px]" style={{ background: bg, color: fg }}><Icon size={28} /></span>
                <span className="flex flex-col gap-1"><b className="text-[15px]">{k + 1}. {t}</b><span className="text-[13px] leading-snug text-ink-mute md:max-w-[200px]">{s}</span></span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function Encarts() {
  const p = photo("laptop");
  return (
    <section className="container mt-16 grid gap-5 lg:grid-cols-2">
      <Reveal className="relative h-full overflow-hidden rounded-[26px] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 text-white sm:p-8">
        <div className="relative z-10 flex max-w-[330px] flex-col gap-4">
          <span className="chip w-fit bg-white/10 text-[11px] uppercase tracking-wider text-white">Test d&apos;orientation</span>
          <h2 className="text-[28px] font-extrabold leading-tight sm:text-[32px]">Quel est ton profil ?</h2>
          <p className="text-[15px] leading-relaxed text-[#c9d6ff]">Réponds à quelques questions et découvre les métiers et formations qui te correspondent.</p>
          <Link href="/orientation" className="btn-sun btn-shine w-fit">Faire le test gratuitement <ArrowRight size={17} /></Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 sm:absolute sm:right-6 sm:top-1/2 sm:mt-0 sm:w-[190px] sm:-translate-y-1/2 sm:flex-col sm:items-end">
          {riasec.map((r, k) => <span key={r.code} className={`chip border border-white/15 bg-white/10 px-3 py-1.5 text-[13px] text-white backdrop-blur ${k % 2 ? "sm:mr-6" : ""}`}><Sparkles size={13} className="text-sun-400" />{r.profil.split(" / ")[0]}</span>)}
        </div>
      </Reveal>
      <Reveal delay={0.1} className="card grid h-full overflow-hidden rounded-[26px] sm:grid-cols-[1fr_1.1fr]">
        <Illustration p={p} className="h-48 sm:h-full" />
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-7">
          <span className="chip w-fit bg-brand-50 text-[11px] uppercase tracking-wider text-brand-700">Établissements</span>
          <h2 className="text-2xl font-extrabold leading-tight sm:text-[28px]">Trouve l&apos;établissement idéal</h2>
          <p className="text-[15px] text-ink-soft">Explore les {CHIFFRES.etablissements} établissements privés du Maroc : labels officiels, filières accréditées, campus et frais.</p>
          <Link href="/etablissements" className="btn-ghost w-fit">Voir les établissements <ArrowRight size={17} /></Link>
        </div>
      </Reveal>
    </section>
  );
}

export function FormationsPopulaires() {
  // Une formation par domaine, parmi celles proposées par le plus d'établissements.
  const vues = new Set<string>();
  const liste = FORMATIONS_UNE.filter((f) => (vues.has(f.domaine) ? false : (vues.add(f.domaine), true))).slice(0, 6);
  return (
    <section className="container mt-16 flex flex-col gap-6">
      <Reveal className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><h2 className="h-section">Formations populaires</h2><p className="mt-1 text-ink-mute">Les formations proposées par le plus grand nombre d&apos;établissements au Maroc.</p></div>
        <Link href="/formations" className="flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-brand-600">Voir toutes les formations <ArrowRight size={16} /></Link>
      </Reveal>
      <Stagger className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {liste.map((f) => {
          const s = domStyle(f.domaine);
          const I = s.icon;
          return (
            <StaggerItem key={f.id}>
              <Link href={`/formations/${f.id}/`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                <Illustration p={photoDomaine(f.domaine)} domaine={f.domaine} className="h-32 transition duration-700 group-hover:scale-105" />
                <div className="flex flex-1 items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.fg }}><I size={19} /></span>
                  <span className="min-w-0 flex-1"><b className="line-clamp-2 text-[13px] leading-snug">{f.intitule}</b><span className="text-xs text-ink-mute">{f.etablissements.length} établissements</span></span>
                  <ChevronRight size={16} className="shrink-0 text-ink-mute" />
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

export function Communaute() {
  const feats = [[BadgeCheck, "Accès gratuit à l'essentiel"], [Sparkles, "Recommandations personnalisées"], [FileCheck2, "Candidatures en ligne"], [Users, "Accompagnement par des conseillers"]] as const;
  return (
    <Reveal className="mt-16 bg-gradient-to-r from-[#eaf1ff] to-[#f6f8fe]">
      <div className="container flex flex-col items-start justify-between gap-8 py-10 lg:flex-row lg:items-center">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="text-2xl font-extrabold sm:text-[28px]">Rejoins la communauté Navigoal</h2>
          <p className="text-ink-soft">Crée ton compte pour enregistrer tes favoris, recevoir des recommandations et candidater en ligne.</p>
          <Link href="/inscription" className="btn-sun btn-shine mt-1 w-fit">Créer mon compte gratuitement <ArrowRight size={17} /></Link>
        </div>
        <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-4 lg:w-auto">
          {feats.map(([I, t]) => <div key={t} className="flex flex-col items-center gap-2 text-center lg:w-32"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"><I size={22} /></span><span className="text-[13px] font-semibold">{t}</span></div>)}
        </div>
      </div>
    </Reveal>
  );
}

// Établissements publiés ayant un logo (un seul par réseau)
const LOGOS = etablissements.filter((e, i, all) => e.logo && all.findIndex((x) => x.logo === e.logo) === i).sort((a, b) => b.filieres.length - a.filieres.length).slice(0, 24);
export function Etablissements() {
  return (
    <section className="mt-14">
      <div className="container mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div><h2 className="text-2xl font-extrabold sm:text-[28px]">Ils sont sur Navigoal</h2><p className="mt-1 text-ink-mute">Établissements privés référencés, reconnus ou autorisés par l&apos;État marocain.</p></div>
        <Link href="/etablissements" className="flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-brand-600">Voir tous les établissements <ArrowRight size={16} /></Link>
      </div>
      <EcolesPartenaires />
      <Marquee>
        {LOGOS.map((e) => (
          <Link key={e.id} href={`/etablissements/${e.id}/`} className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-2.5 pr-4 transition hover:border-brand-300 hover:shadow-card" title={e.nom}>
            <EtabLogo e={e} size={48} />
            <span><span className="block text-sm font-extrabold">{e.sigle}</span><span className="block text-[11px] text-ink-mute">{e.campus ? `${e.campus.length} campus` : e.ville}</span></span>
          </Link>
        ))}
      </Marquee>
    </section>
  );
}
