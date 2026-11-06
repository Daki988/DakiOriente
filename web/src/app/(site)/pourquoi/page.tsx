import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ArrowRight, BadgeCheck, Check, CircleX, Compass, FileSearch, GraduationCap, House, Lock, MessageCircle, Plane, Send, ShieldCheck, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { ParOapsEncart } from "@/components/ui/ParOaps";
import { etablissements } from "@/lib/data";
import { OFFRES, VILLES } from "@/lib/catalogue";
import { residencesEtudiantes } from "@/lib/residences";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Pourquoi Navigoal",
  description: "Étudier au Maroc, de l'orientation à l'installation : test d'orientation, écoles au statut vérifié, vrai coût des études, candidature unique, logement Navilease et voyage NaviTravel.",
};

const ETAPES: { I: LucideIcon; c: string; t: string; d: string; img: string; alt: string; tag: string; href: string; cta: string }[] = [
  { I: Compass, c: "#1a47f5", t: "Je découvre qui je suis", d: "Un test d'orientation visuel d'une dizaine de minutes relie tes goûts, ta série et les métiers qui recrutent. Résultat : un profil clair et des pistes concrètes, que tu peux partager avec tes parents.", img: "/images/laptop.webp", alt: "Étudiante qui travaille sur un ordinateur portable", tag: "Test d'orientation · fiches métiers · séries décryptées", href: "/orientation", cta: "Passer le test" },
  { I: GraduationCap, c: "#6a3df0", t: "Je choisis une école sûre", d: "Chaque établissement affiche son statut officiel, vérifié sur les textes publiés : reconnu par l'État, diplômes homologués, établissement professionnel ou simplement autorisé. Tu compares les écoles côte à côte.", img: "/photos/ma/ma-uir-1.jpg", alt: "Campus de l'Université internationale de Rabat", tag: "Labels vérifiés · comparateur", href: "/etablissements", cta: "Voir les écoles" },
  { I: Wallet, c: "#0f8a46", t: "Je connais le vrai coût", d: "Scolarité publiée par l'école, logement, vie sur place, billets d'avion et imprévus : le devis complet sur toute la formation, en F CFA ou dans ta monnaie, avant de t'engager.", img: "/photos/pourquoi/parents.jpg", alt: "Une étudiante et sa mère consultent un ordinateur", tag: "Devis sur toute la formation · taux du jour", href: "/devis", cta: "Faire un devis" },
  { I: Send, c: "#e04f2b", t: "Je candidate une seule fois", d: "Un dossier unique, plusieurs écoles. Tu suis chaque candidature en temps réel, tu réponds aux demandes de pièces et tu paies les frais par mobile money.", img: "/images/communaute.webp", alt: "Groupe d'étudiantes", tag: "Un dossier · suivi en direct · paiement mobile", href: "/inscription", cta: "Créer mon dossier" },
  { I: House, c: SERVICES.navilease.c, t: "Je me loge sans arnaque", d: "Navilease : résidences universitaires officielles et logements vérifiés, avec un paiement en séquestre libéré seulement après ton entrée dans les lieux.", img: "/photos/residences/sh-tanger-2.jpg", alt: "Chambre de la résidence The Student House à Tanger", tag: "Navilease · résidences · séquestre", href: "/navilease", cta: "Découvrir Navilease" },
  { I: Plane, c: SERVICES.navitravel.c, t: "Je pars l'esprit tranquille", d: "NaviTravel : billet d'avion, visa, accueil à l'aéroport et assurance, organisés pour toi et suivis par un conseiller.", img: "/photos/navitravel/hublot.jpg", alt: "Vue sur les nuages depuis le hublot d'un avion", tag: "NaviTravel · billet · visa · accueil · assurance", href: "/navitravel", cta: "Découvrir NaviTravel" },
];

const PUBLICS = [
  { img: "/images/laptop.webp", c: "#1a47f5", t: "Élèves", d: "Trouve ta série, ton métier et ta formation, gratuitement.", href: "/orientation" },
  { img: "/images/communaute.webp", c: "#0f8a46", t: "Étudiants en mobilité", d: "Étudie au Maroc dans une école au statut vérifié.", href: "/comparateur" },
  { img: "/photos/pourquoi/parents.jpg", c: "#a55a00", t: "Parents", d: "Le budget réel, le suivi des candidatures et la sécurité du logement.", href: "/parents" },
  { img: "/photos/ma/ma-uir-1.jpg", c: "#6a3df0", t: "Établissements", d: "Des candidats déjà orientés vers vos programmes, partout en Afrique.", href: "/etablissement/guide" },
  { img: "/photos/residences/sh-tanger-2.jpg", c: "#d42a50", t: "Bailleurs et résidences", d: "Des locataires étudiants vérifiés, un paiement garanti.", href: "/navilease#bailleurs" },
];

const LABELS = [
  { c: "#0f8a46", t: "Reconnu par l'État", d: "Établissement reconnu : ses diplômes sont équivalents à ceux de l'enseignement public." },
  { c: "#1a47f5", t: "Diplômes homologués", d: "Une ou plusieurs filières homologuées par l'État, avec la référence du texte." },
  { c: "#6a3df0", t: "Établissement professionnel", d: "Formation professionnelle agréée, aux diplômes reconnus." },
  { c: "#a55a00", t: "Établissement autorisé", d: "École autorisée qui délivre ses propres diplômes : nous le disons clairement." },
];

const CONFIANCE: [LucideIcon, string, string][] = [
  [ShieldCheck, "Données protégées", "Hébergement en Europe, documents partagés seulement avec les écoles choisies, jamais revendus."],
  [Lock, "Paiements sécurisés", "Mobile money, carte ou agence ; séquestre pour les logements Navilease."],
  [FileSearch, "Sources officielles", "Statuts et frais issus des textes et des sites officiels, datés et vérifiés."],
  [UsersRound, "Des humains à l'écoute", "Des conseillers sur WhatsApp et dans la messagerie, en plus de Navi."],
];

const FAQ = [
  ["Navigoal est-il vraiment gratuit ?", "Oui pour les élèves, étudiants et parents : orientation, comparateur, devis et dossier de candidature. Seuls les frais de dossier fixés par certaines écoles, et les services Navilease ou NaviTravel que tu choisis, sont payants, toujours annoncés avant."],
  ["Comment savez-vous qu'une école est reconnue ?", "Nous partons des textes officiels (arrêtés, listes des ministères) et indiquons la date de vérification sur chaque fiche."],
  ["Qui décide de mon admission ?", "Toujours l'établissement. Navigoal transmet ton dossier complet et t'aide à le suivre jusqu'à la réponse."],
  ["Mes parents peuvent-ils suivre mon dossier ?", "Oui : en liant leur compte au tien, ils voient tes candidatures, paiements et rendez-vous, et donnent leur accord si tu es mineur."],
];

export default function PourquoiPage() {
  const chiffres: [number, string, string?][] = [[etablissements.length, "écoles privées au statut vérifié"], [VILLES.length, "villes étudiantes"], [OFFRES.length, "formations reliées aux métiers", "+"], [residencesEtudiantes.length, "résidences universitaires"], [1, "dossier pour toutes tes candidatures"]];
  return (
    <>
      {/* Accroche */}
      <section className="relative overflow-hidden bg-[radial-gradient(900px_520px_at_85%_10%,#dae6ff,transparent_60%),#f6f8fe]">
        <div className="container grid items-center gap-10 pb-0 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <Reveal className="flex flex-col gap-5 pb-4 lg:pb-16">
            <span className="eyebrow">Pourquoi Navigoal</span>
            <h1 className="h-display">Étudier au Maroc, <span className="text-brand-600">de l&apos;orientation</span> à <span className="text-sun-500">l&apos;installation</span>.</h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">Une seule plateforme pour choisir sa voie, trouver une école au statut vérifié, connaître le vrai coût, candidater, se loger et voyager. Pensée pour les élèves d&apos;Afrique et leurs familles.</p>
            <div className="flex flex-wrap gap-3"><Link href="/orientation" className="btn-primary">Passer le test gratuit <ArrowRight size={16} /></Link><a href="#parcours" className="btn-ghost">Voir le parcours</a></div>
          </Reveal>
          <div className="relative mx-auto h-[380px] w-full max-w-[560px] sm:h-[470px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/villes/casablanca.jpg" alt="Casablanca" className="absolute left-0 top-4 h-[300px] w-[52%] rounded-[28px] object-cover shadow-[0_40px_80px_-30px_rgba(11,21,51,.5)] sm:h-[400px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/ma/ma-uir-1.jpg" alt="Campus universitaire au Maroc" className="absolute right-0 top-16 h-[200px] w-[44%] rounded-[28px] object-cover shadow-[0_40px_80px_-30px_rgba(11,21,51,.5)] sm:h-[260px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/etudiante.webp" alt="" className="absolute bottom-0 left-[24%] h-[330px] w-auto sm:h-[430px]" />
            <div className="card absolute bottom-10 left-0 hidden items-center gap-2.5 px-3.5 py-3 sm:flex"><BadgeCheck size={22} className="text-[#0f8a46]" /><span><b className="block text-sm">Statut vérifié</b><span className="text-xs text-ink-mute">sur les textes officiels</span></span></div>
            <div className="card absolute bottom-24 right-0 flex items-center gap-2.5 px-3.5 py-3"><Wallet size={22} className="text-brand-600" /><span><b className="block text-sm">Le vrai coût</b><span className="text-xs text-ink-mute">en F CFA ou dans ta monnaie</span></span></div>
          </div>
        </div>
      </section>

      {/* Le constat */}
      <section className="container mt-16 grid items-center gap-10 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-[#d42a50]">Le constat</span>
          <h2 className="h-section">Partir étudier, c&apos;est souvent un saut dans l&apos;inconnu.</h2>
          <p className="text-[17px] leading-relaxed text-ink-soft">Des informations éparpillées sur les réseaux sociaux, des écoles dont on ignore si le diplôme est reconnu, des frais découverts trop tard, des cautions envoyées à des inconnus… Navigoal remet de l&apos;ordre et de la confiance dans ce parcours.</p>
        </Reveal>
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {[["Infos dispersées", "Sites, groupes WhatsApp, bouche-à-oreille."], ["Statut flou", "Diplôme reconnu ou non ? Difficile à vérifier."], ["Budget sous-estimé", "Logement, visa et vie sur place oubliés."], ["Arnaques au logement", "Cautions versées pour des logements fictifs."]].map(([t, d]) => (
            <StaggerItem key={t} className="flex flex-col gap-1.5 rounded-[20px] bg-[#fff5f6] p-5"><CircleX size={22} className="text-[#d42a50]" /><b>{t}</b><span className="text-sm text-ink-mute">{d}</span></StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Le parcours */}
      <section id="parcours" className="container mt-20 flex scroll-mt-28 flex-col gap-14 sm:gap-20">
        <Reveal className="flex flex-col items-center gap-2 text-center"><span className="eyebrow">Le parcours</span><h2 className="h-section">Six étapes, une seule plateforme</h2><p className="text-ink-mute sm:text-lg">Chaque étape est reliée à la suivante : rien à ressaisir, tout est suivi.</p></Reveal>
        {ETAPES.map((e, k) => (
          <Reveal key={e.t} className="grid items-center gap-6 md:grid-cols-2 md:gap-14">
            <div className={`h-[230px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-28px_rgba(11,21,51,.45)] sm:h-[340px] ${k % 2 ? "md:order-2" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.img} alt={e.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col gap-3.5">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-white" style={{ background: e.c }}><e.I size={26} /></span>
              <h3 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">{k + 1}. {e.t}</h3>
              <p className="text-[17px] leading-relaxed text-ink-soft">{e.d}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip border border-slate-200 bg-white" style={{ color: e.c }}><Check size={13} />{e.tag}</span>
                <Link href={e.href} className="text-sm font-bold" style={{ color: e.c }}>{e.cta} →</Link>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Les publics */}
      <section className="mt-20 bg-[#f6f8fe] py-16">
        <div className="container flex flex-col gap-6">
          <Reveal><span className="eyebrow">Pour chacun</span><h2 className="h-section mt-2">Une plateforme, cinq publics</h2></Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PUBLICS.map((p) => (
              <StaggerItem key={p.t} className="card group relative flex flex-col overflow-hidden">
                <div className="relative h-[150px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="chip absolute bottom-3 left-3 text-white" style={{ background: p.c }}>{p.t}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4"><span className="text-[14.5px] leading-relaxed">{p.d}</span><Link href={p.href} className="mt-auto text-[13px] font-bold after:absolute after:inset-0" style={{ color: p.c }}>Découvrir →</Link></div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Les labels */}
      <section className="container mt-20 grid items-center gap-10 lg:grid-cols-[420px_1fr]">
        <Reveal className="flex flex-col gap-3.5"><span className="eyebrow text-[#0f8a46]">La transparence</span><h2 className="h-section">Le statut de chaque école, expliqué simplement</h2><p className="leading-relaxed text-ink-soft">Nous ne présentons que des établissements privés et inter-États qui accueillent les étudiants internationaux, avec leur statut exact et la date de vérification.</p><Link href="/etablissements" className="btn-ghost self-start">Voir les {etablissements.length} écoles</Link></Reveal>
        <Stagger className="grid gap-3.5 sm:grid-cols-2">
          {LABELS.map((l) => <StaggerItem key={l.t} className="flex flex-col gap-2 rounded-[20px] border border-slate-200 bg-white p-5"><span className="chip self-start text-white" style={{ background: l.c }}><BadgeCheck size={13} />{l.t}</span><span className="text-[14px] leading-relaxed text-ink-soft">{l.d}</span></StaggerItem>)}
        </Stagger>
      </section>

      {/* La confiance */}
      <section className="container mt-20">
        <Reveal className="grid items-center gap-10 rounded-[32px] bg-ink p-7 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-sun-400">La confiance</span>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">Votre projet et vos données sont entre de bonnes mains</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/education.webp" alt="Étudiants accompagnés par une conseillère" loading="lazy" className="mt-2 h-[220px] w-full rounded-[22px] object-cover" />
          </div>
          <div className="grid gap-7 sm:grid-cols-2">
            {CONFIANCE.map(([I, t, d]) => <div key={t} className="flex gap-3.5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[.12]"><I size={22} className="text-sun-400" /></span><span><b className="text-white">{t}</b><span className="mt-1 block text-sm leading-relaxed text-[#c9d2ea]">{d}</span></span></div>)}
          </div>
        </Reveal>
      </section>

      {/* L'écosystème */}
      <section className="container mt-20 flex flex-col gap-6">
        <Reveal className="text-center"><span className="eyebrow">L&apos;écosystème</span><h2 className="h-section mt-2">Quatre services qui se parlent</h2></Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { c: "#1a47f5", n: "Navigoal", d: "S'orienter, comparer, candidater", I: Compass, href: "/", logo: null },
            { c: "#6a3df0", n: "Navi", d: "L'assistant qui te répond à toute heure", I: MessageCircle, href: "/orientation", logo: null },
            { c: SERVICES.navilease.c, n: "Navilease", d: "Se loger en toute sécurité", I: House, href: "/navilease", logo: SERVICES.navilease.logoHorizontal },
            { c: SERVICES.navitravel.c, n: "NaviTravel", d: "Voyager et s'installer", I: Plane, href: "/navitravel", logo: SERVICES.navitravel.logoHorizontal },
          ].map((x) => (
            <StaggerItem key={x.n} className="card relative flex flex-col gap-2.5 border-t-[5px] p-5" style={{ borderTopColor: x.c }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.logo ? <img src={x.logo} alt={x.n} className="h-9 w-auto self-start" /> : <span className="flex items-center gap-2.5"><x.I size={22} style={{ color: x.c }} /><b className="text-lg">{x.n}</b></span>}
              <span className="text-sm text-ink-mute">{x.d}</span>
              <Link href={x.href} className="text-[13px] font-bold after:absolute after:inset-0" style={{ color: x.c }}>Découvrir →</Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Chiffres */}
      <Reveal className="container mt-14">
        <div className="card grid grid-cols-2 gap-6 rounded-[28px] p-8 sm:grid-cols-3 lg:grid-cols-5">
          {chiffres.map(([n, l, plus]) => <div key={l} className="flex flex-col items-center gap-1 text-center"><b className="text-4xl font-extrabold text-brand-600"><Counter to={n} />{plus}</b><span className="text-[13px] text-ink-mute">{l}</span></div>)}
        </div>
      </Reveal>

      <ParOapsEncart />

      {/* Questions */}
      <section className="container mt-14 max-w-3xl">
        <h2 className="mb-4 text-2xl font-extrabold">Questions fréquentes</h2>
        <div className="flex flex-col gap-2.5">
          {FAQ.map(([q, r], i) => (
            <details key={q} open={i === 0} className="card group rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span className="text-xl text-brand-600 transition group-open:rotate-45">+</span></summary>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="container mt-14">
        <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-5 overflow-hidden rounded-[32px] p-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/villes/rabat.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover brightness-[.42]" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-[40px]">Ton avenir commence par le bon choix.</h2>
          <div className="relative flex flex-wrap justify-center gap-3"><Link href="/inscription" className="btn-sun">Créer mon compte gratuit</Link><Link href="/espace/conseiller" className="rounded-2xl bg-white/15 px-5 py-3 font-bold text-white backdrop-blur hover:bg-white/25">Parler à un conseiller</Link></div>
        </div>
      </section>
    </>
  );
}
