import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/ui/Link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { JeuBandeau } from "@/components/campagne/JeuBandeau";
import { etablissements, fmt, metiers } from "@/lib/data";
import { COUTS, convert } from "@/lib/devis";

export const metadata: Metadata = {
  title: "Trouve ta voie : orientation gratuite (Gabon)",
  description: "Ton métier, ta filière, ton école : test d'orientation gratuit, écoles au statut officiel affiché et devis complet en F CFA pour étudier au Maroc.",
  alternates: { canonical: "/trouve-ta-voie/" },
  openGraph: { title: "Trouve ta voie au Maroc · Navigoal", description: "Test d'orientation gratuit, écoles au statut affiché, budget en F CFA.", images: [{ url: "/og.png", width: 1200, height: 630 }] },
};

const MAROC = etablissements.filter((e) => e.pays === "MA");
const N_RECONNUS = MAROC.filter((e) => e.label === "reconnu_etat").length;
const N_HOMOLOGUES = MAROC.filter((e) => e.label === "diplomes_homologues").length;
const MA = COUTS.MA;
const xaf = (mad: number) => convert(mad, "MAD", "XAF");
const court = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".", ",")} M` : fmt(Math.round(v / 1e4) * 1e4));
const fourchette = (f: { min: number; max: number }) => `${court(xaf(f.min))} à ${court(xaf(f.max))}`;
const PRIX = [
  { poste: "Vivre hors Casablanca, Rabat, Marrakech", montant: fourchette(MA.vie_mensuelle.autre_ville), unite: "par mois" },
  { poste: "Vivre à Casablanca, Rabat ou Marrakech", montant: fourchette(MA.vie_mensuelle.ville_chere), unite: "par mois" },
  { poste: "Institut, BTS, technicien spécialisé", montant: fourchette(MA.scolarite_annuelle.institut), unite: "par an" },
  { poste: "École d'ingénieurs", montant: fourchette(MA.scolarite_annuelle.ecole_ingenieurs), unite: "par an" },
  { poste: "École de commerce", montant: fourchette(MA.scolarite_annuelle.ecole_commerce), unite: "par an" },
];

const ETAPES = [
  { n: "1", titre: "Trouve ton métier", texte: "Le test d'orientation : 5 minutes, gratuit. Ton profil et les métiers qui te ressemblent.", lien: "/orientation/", action: "Faire le test" },
  { n: "2", titre: "Choisis ta filière", texte: `${metiers.length} fiches métiers : missions, niveau d'études, filières qui y mènent.`, lien: "/metiers/", action: "Voir les métiers" },
  { n: "3", titre: "Compare les écoles", texte: `${MAROC.length} établissements au Maroc, statut officiel affiché, comparés côte à côte.`, lien: "/comparateur/", action: "Ouvrir le comparateur" },
];
const POURQUOI = [
  { titre: "Des diplômes qui comptent", texte: `${N_RECONNUS} écoles reconnues par l'État et ${N_HOMOLOGUES} aux diplômes homologués sur Navigoal.` },
  { titre: "Des démarches expliquées", texte: "Entrée, carte de séjour étudiant, assurance : chaque étape détaillée selon ta nationalité." },
  { titre: "Un budget prévisible", texte: "Le devis complet en F CFA, scolarité et vie comprises, avant de signer." },
  { titre: "Une communauté sur place", texte: "Des étudiants gabonais à Rabat, Casablanca et Fès, et des ambassadeurs pour répondre." },
];
const FAQ = [
  { q: "C'est vraiment gratuit ?", r: "Oui. Le test d'orientation, l'inscription, le comparateur des écoles et le devis sont gratuits pour les élèves, les étudiants et les parents." },
  { q: "Je n'ai pas encore mon bac, je peux m'inscrire ?", r: "Oui, et c'est même le bon moment : en terminale, tu as le temps de choisir ton métier, ta filière et de candidater pour la rentrée de septembre." },
  { q: "Navigoal garantit-il une admission ou une bourse ?", r: "Non. Navigoal t'aide à choisir et à candidater ; la décision d'admission appartient à chaque école, et les bourses dépendent des organismes qui les attribuent." },
  { q: "Comment sont calculés les prix en F CFA ?", r: "Ce sont des estimations Navigoal à partir des grilles publiées, converties au taux indicatif du jour. Le devis personnalisé utilise les frais réels de l'école quand ils sont connus." },
  { q: "Mes parents peuvent-ils suivre mon dossier ?", r: "Oui. Depuis ton profil, tu invites un parent : il suit tes candidatures, tes paiements et ton logement Navilease depuis son espace." },
];

const dur = "border-[3px] border-[#0A0A0A] shadow-[6px_6px_0_#0A0A0A]";
const sticker = `${dur} inline-block whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#0A0A0A] sm:text-base`;
const bouton = `${dur} inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-extrabold text-[#0A0A0A] transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#0A0A0A] active:translate-y-0`;

export default function TrouveTaVoiePage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[#1A47F5]">
        <div className="flex h-10 items-center justify-center bg-[#0A0A0A] sm:h-14">
          <p className="whitespace-nowrap font-display text-base tracking-[.12em] text-[#FFE14D] sm:text-2xl">241 → 212 ✦ BAC EN POCHE<span className="hidden sm:inline"> ✦ TROUVE TA VOIE ✦ 241 → 212</span></p>
        </div>
        <div className="container relative grid gap-6 pb-0 pt-6 lg:min-h-[780px] lg:grid-cols-[1.1fr_.9fr] lg:pt-12">
          <div className="relative z-10 pb-4 lg:pb-16">
            <span className="inline-block rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0A0A0A] sm:text-lg">POV : t&apos;as ton bac en vue mais zéro plan.</span>
            <h1 className="mt-5 font-display text-[19vw] uppercase leading-[1.02] tracking-tight text-white sm:text-[110px] lg:text-[150px]">
              <Reveal y={40}><span className="block">Trouve</span></Reveal>
              <Reveal y={40} delay={0.08}><span className="mt-1 inline-block bg-[#FFE14D] px-3 text-[#0A0A0A]">ta voie</span></Reveal>
              <Reveal y={40} delay={0.16}><span className="mt-1 block">au Maroc.</span></Reveal>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-xl">Ton métier, ta filière, ton école : Navigoal t&apos;accompagne gratuitement, de Libreville jusqu&apos;au campus.</p>
            <div className="mt-7 hidden flex-wrap gap-5 sm:flex">
              <Link href="/orientation/" className={`${bouton} bg-[#FFE14D]`}>Faire le test · 5 min, gratuit</Link>
              <Link href="/devis/?o=GA" className={`${bouton} bg-white`}>Mon devis en F CFA</Link>
            </div>
            <Stagger className="mt-6 flex flex-wrap gap-3 lg:hidden">
              <StaggerItem><span className={`${sticker} -rotate-2 bg-[#FFE14D]`}>+{MAROC.length - 3} ÉCOLES</span></StaggerItem>
              <StaggerItem><span className={`${sticker} rotate-2 bg-[#FF8A3D]`}>BUDGET EN F CFA</span></StaggerItem>
            </Stagger>
          </div>
          <div className="relative min-h-[300px] sm:min-h-[420px] lg:min-h-0">
            <Image src="/images/campagne-etudiante.webp" alt="Étudiante souriante avec son sac à dos et ses cahiers" width={688} height={596} priority
              className="absolute -right-6 bottom-0 w-[300px] max-w-none sm:w-[460px] lg:-right-10 lg:w-[640px]" />
            <Stagger className="hidden lg:block">
              <StaggerItem className="absolute left-0 top-16"><span className={`${sticker} -rotate-3 bg-[#FFE14D]`}>+{MAROC.length - 3} ÉCOLES AU STATUT AFFICHÉ</span></StaggerItem>
              <StaggerItem className="absolute bottom-20 left-0"><span className={`${sticker} rotate-3 bg-[#FF8A3D]`}>TON BUDGET EN F CFA</span></StaggerItem>
            </Stagger>
            <div className="absolute right-0 top-4 hidden h-44 w-44 -rotate-12 flex-col items-center justify-center rounded-full bg-[#0A0A0A] text-center sm:flex lg:top-6">
              <p className="font-display text-4xl text-[#FFE14D]">241→212</p>
              <p className="mt-1 text-xs font-bold leading-tight text-white">DE LIBREVILLE<br />AU CAMPUS</p>
            </div>
          </div>
        </div>
      </section>

      <JeuBandeau />

      <section className="container py-16 sm:py-24">
        <p className="eyebrow">Dans cet ordre</p>
        <h2 className="h-section mt-3">Ton métier d&apos;abord. Ta filière ensuite. Ton école enfin.</h2>
        <Stagger className="mt-10 grid gap-5 md:grid-cols-3 md:gap-7">
          {ETAPES.map((e) => (
            <StaggerItem key={e.n} className="card p-6 sm:p-8">
              <p className="font-display text-5xl text-brand-600 sm:text-6xl">{e.n}</p>
              <h3 className="mt-3 text-xl font-extrabold sm:text-2xl">{e.titre}</h3>
              <p className="mt-2 text-ink-soft">{e.texte}</p>
              <Link href={e.lien} className="mt-4 inline-block font-extrabold text-brand-600">{e.action} →</Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-[#f3f7ff] py-16 sm:py-24">
        <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Le vrai prix</p>
            <h2 className="h-section mt-3">Combien ça coûte vraiment, en F CFA ?</h2>
            <p className="mt-4 text-ink-soft">Estimations Navigoal à partir des grilles publiées. Ton devis personnalisé utilise les frais réels de ton école et tient compte de toute la durée de la formation.</p>
            <Link href="/devis/?o=GA" className={`${bouton} mt-7 bg-[#FFE14D]`}>Calculer mon devis</Link>
          </div>
          <div className="card px-5 py-2 sm:px-9">
            {PRIX.map((p) => (
              <div key={p.poste} className="flex flex-col gap-1 border-b border-slate-200/70 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4">
                <p className="flex-1 font-semibold">{p.poste}</p>
                <p className="font-display text-2xl text-[#0A0A0A] sm:text-3xl">{p.montant} <span className="font-sans text-sm font-bold tracking-normal text-ink-soft">F CFA {p.unite}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <p className="eyebrow">Pourquoi le Maroc</p>
        <h2 className="h-section mt-3">Proche, francophone, et des diplômes reconnus.</h2>
        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POURQUOI.map((p) => (
            <StaggerItem key={p.titre} className={`${dur} rounded-2xl bg-white p-6`}>
              <h3 className="text-lg font-extrabold text-[#0A0A0A]">{p.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.texte}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="eyebrow text-sun-400">Parents</p>
            <h2 className="h-section mt-3 text-white">Le vrai coût, avant de signer.</h2>
            <p className="mt-4 max-w-2xl text-brand-200">Devis complet en F CFA, statut officiel de chaque école, et un espace parent pour suivre candidatures, paiements et logement depuis Libreville.</p>
          </div>
          <Link href="/inscription/?profil=parent" className={`${bouton} self-start bg-[#FFE14D] lg:self-auto`}>Créer mon espace parent</Link>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <p className="eyebrow">Questions fréquentes</p>
        <div className="mt-6 max-w-3xl">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-slate-200/70 py-5">
              <summary className="flex cursor-pointer list-none items-center gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{f.q}</span><span className="text-2xl text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="bg-[#0A0A0A]">
        <div className="container flex flex-col gap-3 py-8 sm:flex-row sm:items-center">
          <p className="flex-1 font-display text-2xl text-[#FFE14D] sm:text-3xl">TON TALENT ▸ TES OPPORTUNITÉS ▸ TON AVENIR</p>
          <p className="font-bold text-white">navigoal.net</p>
        </div>
      </div>

      {/* Barre d'action collante sur mobile (s'arrête avant le pied de page du site) */}
      <div className="sticky bottom-0 z-40 bg-[#0A0A0A] px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3.5 sm:hidden">
        <Link href="/orientation/" className={`${bouton} w-full bg-[#FFE14D] py-3.5`}>Faire le test · 5 min</Link>
      </div>
    </div>
  );
}
