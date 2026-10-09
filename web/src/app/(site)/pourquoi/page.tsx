import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, KeyRound, Plane, Sparkles, UserRound, UsersRound, X } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { CtaBand } from "@/components/ui/CtaBand";
import { etablissements, formations, metiers, series } from "@/lib/data";

export const metadata: Metadata = { title: "Pourquoi Navigoal", description: "Ce que Navigoal apporte aux élèves, étudiants, parents, établissements et bailleurs." };

const PERSONAS = [
  { I: UserRound, c: "#1a47f5", t: "Élève (collège, lycée)", s: "Comprends ton profil et choisis ta série.", pts: ["Test d'orientation visuel et gratuit", "Ma série au lycée : matières, métiers, études", "Annales, cours et préparation BEPC / BFEM / bac"], kpi: "Un projet construit à partir de ton profil", href: "/orientation", cta: "Passer le test" },
  { I: Plane, c: "#0f8a46", t: "Étudiant·e en mobilité", s: "Étudie au Maroc dans une école aux diplômes homologués.", pts: ["Seuls les établissements reconnus par l'État ou aux diplômes homologués, comparés côte à côte", "Visa selon ta nationalité, budget, carte de séjour", "Candidature, paiement mobile et logement Navilease au même endroit"], kpi: "Un seul dossier pour toutes tes candidatures", href: "/comparateur", cta: "Comparer des écoles", wide: true },
  { I: UsersRound, c: "#a55a00", t: "Parent / tuteur", s: "Accompagnez et sécurisez le projet de votre enfant.", pts: ["Devis complet : scolarité + vie sur toute la formation", "Démarches de visa et carte de séjour, étape par étape", "Suivi des paiements, garant du logement, séquestre"], kpi: "Le vrai coût, avant de s'engager", href: "/devis", cta: "Faire un devis" },
  { I: Building2, c: "#6a3df0", t: "Établissement", s: "Recrutez les bons candidats, partout en Afrique.", pts: ["Vitrine : photos, programmes, métiers, frais", "Candidatures qualifiées (profil, série, budget validés)", "Statistiques et campagnes d'admission"], kpi: "Des candidats déjà orientés vers vos programmes", href: "/etablissements", cta: "Voir les fiches" },
  { I: KeyRound, c: "#d42a50", t: "Bailleur Navilease", s: "Louez à des étudiants vérifiés, paiements garantis.", pts: ["Locataires admis et identifiés", "Encaissement protégé, contrats et quittances automatiques", "Visibilité auprès des écoles partenaires"], kpi: "Des logements occupés dès la rentrée", href: "/navilease", cta: "Découvrir Navilease" },
];
const AVANT = ["Infos dispersées (sites, réseaux sociaux, bouche-à-oreille)", "Écoles publiques difficiles d'accès pour les étrangers", "Impossible de savoir si un diplôme est reconnu par l'État", "Impossible de comparer coûts, visa et logement", "Arnaques à la caution", "Dossiers envoyés un par un"];

export default function PourquoiPage() {
  const APRES = ["Tout le parcours sur une seule plateforme", `${etablissements.length} écoles privées et inter-États qui accueillent les internationaux`, "Comparateur : formation, métier, budget total, visa", "Logements vérifiés et paiement en séquestre", "Un dossier, plusieurs candidatures suivies en temps réel"];
  const chiffres: [number, string][] = [[etablissements.length, "écoles privées & inter-États"], [formations.length, "formations reliées aux métiers"], [metiers.length, "fiches métiers"], [series.length, "séries du bac décryptées"], [3, "pays, 1 parcours"]];
  return (
    <>
      <section className="bg-[radial-gradient(900px_500px_at_85%_0%,#dae6ff,transparent_60%)] pb-8 pt-14">
        <Reveal className="container flex flex-col items-center gap-4 text-center">
          <span className="eyebrow">Pourquoi Navigoal</span>
          <h1 className="h-display max-w-4xl">Une seule plateforme, <span className="text-brand-600">de l&apos;orientation</span> à <span className="text-sun-500">l&apos;installation</span></h1>
          <p className="max-w-3xl text-lg text-ink-soft">Navigoal relie séries, métiers, formations, établissements, pays et logement pour que chacun prenne la bonne décision.</p>
        </Reveal>
      </section>
      <Stagger className="container mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map(({ I, c, t, s, pts, kpi, href, cta, wide }) => (
          <StaggerItem key={t} className={`card flex h-full flex-col gap-4 rounded-[26px] p-6 ${wide ? "bg-gradient-to-br from-white from-55% to-brand-50 lg:col-span-2" : ""}`}>
            <div className="flex items-center gap-3"><span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-white" style={{ background: c }}><I size={26} /></span><span><span className="block text-xs font-extrabold text-ink-mute">POUR</span><b className="text-[19px]">{t}</b></span></div>
            <div className="text-[21px] font-extrabold leading-tight tracking-tight">{s}</div>
            {pts.map((x) => <span key={x} className="flex items-start gap-2.5 text-sm text-ink-soft"><Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: c }} />{x}</span>)}
            <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 rounded-2xl bg-[#f6f8fe] px-3.5 py-3 text-[13px] font-bold"><Sparkles size={16} style={{ color: c }} />{kpi}</span>
              <Link href={href} className="text-[13px] font-bold text-brand-600">{cta} →</Link>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      <div className="container mt-14 grid gap-6 md:grid-cols-2">
        <Reveal className="card flex h-full flex-col gap-3 rounded-[26px] p-7"><span className="chip self-start bg-[#ffecef] text-[#d42a50]">Sans Navigoal</span>{AVANT.map((t) => <span key={t} className="flex items-start gap-2.5 text-[15px] text-ink-soft"><X size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-[#d42a50]" />{t}</span>)}</Reveal>
        <Reveal delay={0.1} className="card flex h-full flex-col gap-3 rounded-[26px] border-2 border-brand-600 p-7 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]"><span className="chip self-start bg-[#e8f8ef] text-[#0f8a46]">Avec Navigoal</span>{APRES.map((t) => <span key={t} className="flex items-start gap-2.5 text-[15px] font-semibold"><Check size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-[#0f8a46]" />{t}</span>)}</Reveal>
      </div>
      <Reveal className="container mt-14">
        <div className="card grid grid-cols-2 gap-6 rounded-[26px] p-8 sm:grid-cols-3 lg:grid-cols-5">
          {chiffres.map(([n, l]) => <div key={l} className="flex flex-col items-center gap-1 text-center"><b className="text-4xl font-extrabold text-brand-600"><Counter to={n} /></b><span className="text-[13px] text-ink-mute">{l}</span></div>)}
        </div>
      </Reveal>
      <CtaBand />
    </>
  );
}
