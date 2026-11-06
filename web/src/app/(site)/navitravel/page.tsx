import type { Metadata } from "next";
import { Check, CircleCheck, ClipboardList, CreditCard, FileText, HandHelping, HeartPulse, Plane, Smile, Sparkles, Stamp, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { DemandeDevis } from "@/components/navitravel/DemandeDevis";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "NaviTravel — billet, visa, accueil et assurance",
  description: "NaviTravel organise le départ des étudiants vers leur école au Maroc : billet d'avion, visa, accueil à l'aéroport et assurance, avec un conseiller qui suit chaque étape.",
};
const s = SERVICES.navitravel;

const PRESTATIONS: { id: string; I: LucideIcon; t: string; d: string; img: string; alt: string }[] = [
  { id: "billet", I: Plane, t: "Billet d'avion", d: "Le meilleur trajet depuis Libreville, Dakar, Douala ou Abidjan, au tarif étudiant, avec les bons bagages. Billet émis par notre agence.", img: "/photos/navitravel/aeroport.jpg", alt: "Voyageur avec sa valise dans un aéroport" },
  { id: "visa", I: Stamp, t: "Visa et démarches", d: "Liste des pièces selon ta nationalité, vérification du dossier, rendez-vous, puis carte de séjour à l'arrivée.", img: "/photos/navitravel/passeport.jpg", alt: "Passeport ouvert avec des tampons de visa" },
  { id: "accueil", I: HandHelping, t: "Accueil à l'arrivée", d: "Quelqu'un t'attend à l'aéroport, t'accompagne jusqu'à ton logement et t'aide pour la carte SIM et la banque.", img: "/photos/navitravel/arrivee.jpg", alt: "Voyageur à l'arrivée avec un chariot de bagages" },
  { id: "assurance", I: HeartPulse, t: "Assurance voyage et santé", d: "Une assurance adaptée aux étudiants et aux exigences du visa, auprès d'un assureur agréé.", img: "/photos/navitravel/hublot.jpg", alt: "Vue sur les nuages depuis le hublot d'un avion" },
];
const ETAPES: [LucideIcon, string, string][] = [
  [ClipboardList, "Tu décris ton projet", "Dates, ville de départ, école, logement."],
  [FileText, "Tu reçois un devis clair", "Chaque prestation et son prix, sans surprise."],
  [CreditCard, "Tu valides et tu paies", "Mobile money, carte, virement ou agence."],
  [Smile, "On s'occupe du reste", "Un conseiller te suit jusqu'à ton installation."],
];
const FAQ = [
  ["Le visa est-il garanti ?", "Non : la décision appartient toujours au consulat. Nous vérifions ton dossier pour mettre toutes les chances de ton côté, et nous te disons à l'avance quels frais restent dus en cas de refus."],
  ["Combien coûte l'accompagnement ?", "Chaque prestation est chiffrée dans ton devis, avec nos frais de service à part. Les frais consulaires et de visa, fixés par les administrations, sont indiqués séparément."],
  ["Mes parents peuvent-ils payer ?", "Oui : un parent lié à ton compte peut régler le devis par mobile money, carte, virement ou en agence."],
  ["Et si mon vol change ?", "Préviens ton conseiller dès que possible : nous adaptons l'accueil et t'aidons auprès de la compagnie selon les conditions de ton billet."],
];

export default function NaviTravelPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/navitravel/hublot.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_65%] brightness-[.5]" />
        <div className="container relative grid items-center gap-8 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="flex flex-col gap-5">
            <span className="chip self-start bg-white/15 text-white backdrop-blur"><Sparkles size={13} />Nouveau service Navigoal</span>
            <h1 className="h-display text-white">Ton départ, organisé de A à Z.</h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#e3e9f7]">Billet d&apos;avion, visa, accueil à l&apos;aéroport et assurance : NaviTravel prépare ton voyage vers ton école au Maroc, avec un conseiller qui te suit jusqu&apos;à ton installation.</p>
            <div className="flex flex-wrap gap-3"><a href="#devis" className="rounded-2xl px-5 py-3.5 font-extrabold text-white shadow-lg transition hover:brightness-110" style={{ background: s.accent }}>Demander mon devis gratuit</a><a href="#services" className="rounded-2xl bg-white/15 px-5 py-3.5 font-bold text-white backdrop-blur hover:bg-white/25">Voir les services</a></div>
          </Reveal>
          <Reveal delay={0.15} className="card hidden flex-col gap-2.5 justify-self-end p-5 lg:flex lg:w-[300px]">
            <span className="text-xs font-extrabold tracking-wider text-ink-mute">TON VOYAGE</span>
            {[[Plane, "Libreville → Casablanca"], [Stamp, "Visa étudiant"], [HandHelping, "Accueil à l'aéroport"]].map(([I, t]) => { const Ic = I as LucideIcon; return <span key={t as string} className="flex items-center gap-2.5 text-sm"><Ic size={17} style={{ color: s.c }} />{t as string}<CircleCheck size={17} className="ml-auto text-[#0f8a46]" /></span>; })}
          </Reveal>
        </div>
      </section>

      <section id="services" className="container mt-16 flex scroll-mt-32 flex-col gap-7">
        <Reveal className="text-center"><span className="eyebrow" style={{ color: s.c }}>Les services</span><h2 className="h-section mt-2">Tout ce qu&apos;il faut pour partir sereinement</h2></Reveal>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESTATIONS.map((p) => (
            <StaggerItem key={p.id} className="card flex scroll-mt-32 flex-col overflow-hidden">
              <div id={p.id} className="relative h-[190px] scroll-mt-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute left-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: s.c }}><p.I size={22} /></span>
              </div>
              <div className="flex flex-col gap-2 p-5"><b className="text-lg">{p.t}</b><span className="text-[14.5px] leading-relaxed text-ink-soft">{p.d}</span></div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section id="comment" className="mt-20 scroll-mt-32 py-16" style={{ background: s.fond }}>
        <div className="container flex flex-col gap-10">
          <Reveal className="text-center"><span className="eyebrow" style={{ color: s.c }}>Comment ça marche</span><h2 className="h-section mt-2">Quatre étapes, un seul interlocuteur</h2></Reveal>
          <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map(([I, t, d], k) => (
              <StaggerItem key={t} className="flex flex-col gap-2.5"><span className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl bg-white"><I size={24} style={{ color: s.c }} /></span><b className="text-lg">{k + 1}. {t}</b><span className="text-sm leading-relaxed text-ink-mute">{d}</span></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="devis" className="container mt-20 grid scroll-mt-32 items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow" style={{ color: s.c }}>Relié à ton dossier Navigoal</span>
          <h2 className="h-section">Ton admission, ton logement et ton voyage au même endroit</h2>
          <p className="text-[16.5px] leading-relaxed text-ink-soft">Ta lettre d&apos;admission, ton logement Navilease et tes documents sont déjà dans ton espace : NaviTravel s&apos;en sert pour ton visa et ton accueil, sans rien ressaisir. Tes parents suivent chaque étape.</p>
          {["Devis gratuit et sans engagement", "Prix détaillés, frais consulaires annoncés à part", "Billets émis par notre agence de voyage, assurance auprès d'un assureur agréé", "Le visa reste décidé par le consulat : nous t'aidons à mettre toutes les chances de ton côté"].map((t) => <span key={t} className="flex gap-2.5 text-[15px]"><Check size={18} className="mt-0.5 shrink-0" style={{ color: s.c }} />{t}</span>)}
        </Reveal>
        <DemandeDevis />
      </section>

      <section id="questions" className="container mt-20 max-w-4xl scroll-mt-32">
        <h2 className="mb-5 text-center text-2xl font-extrabold sm:text-3xl">Questions fréquentes</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map(([q, r]) => (
            <details key={q} className="card group h-fit rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<span className="text-xl transition group-open:rotate-45" style={{ color: s.c }}>+</span></summary>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{r}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
