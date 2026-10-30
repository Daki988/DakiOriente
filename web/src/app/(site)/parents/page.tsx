import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Link from "@/components/ui/Link";
import { Reveal } from "@/components/motion/Reveal";
import { QuestionWhatsApp } from "@/components/ui/QuestionWhatsApp";
import { fmt } from "@/lib/data";
import { COUTS, convert } from "@/lib/devis";

export const metadata: Metadata = {
  title: "Parents : financer les études au Maroc",
  description: "Coût réel des études au Maroc en F CFA, écoles reconnues par l'État, suivi des candidatures, paiement sécurisé et logement : l'espace parent.",
  alternates: { canonical: "/parents/" },
};

const MA = COUTS.MA;
const xaf = (mad: number) => convert(mad, "MAD", "XAF");
const court = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".", ",")} M` : fmt(Math.round(v / 1e3) * 1e3));
const fourchette = (min: number, max: number) => `${court(xaf(min))} à ${court(xaf(max))}`;
const installation = MA.installation.reduce((a, p) => [a[0] + p.min, a[1] + p.max], [0, 0]);

const COUTS_PARENTS = [
  { titre: "Scolarité par an", valeur: fourchette(MA.scolarite_annuelle.institut.min, MA.scolarite_annuelle.ecole_commerce.max), note: "de l'institut à l'école de commerce ; santé et grandes écoles au-delà" },
  { titre: "Vie sur place par mois", valeur: fourchette(MA.vie_mensuelle.autre_ville.min, MA.vie_mensuelle.ville_chere.max), note: "logement, repas, transport ; plus cher à Casablanca, Rabat, Marrakech" },
  { titre: "Installation (une fois)", valeur: fourchette(installation[0], installation[1]), note: "caution, carte de séjour, assurance santé, équipement" },
];

const ACTIONS = [
  { titre: "Suivre chaque candidature", texte: "Statut, pièces demandées, réponse de l'école : vous êtes prévenu en même temps que votre enfant." },
  { titre: "Payer en ligne, avec reçu", texte: "Frais de dossier et réservation du logement, avec reçu dans votre espace. L'argent du logement reste bloqué jusqu'à l'entrée de votre enfant." },
  { titre: "Valider le logement comme garant", texte: "Votre accord est demandé avant toute réservation pour un enfant mineur ; l'adresse et le contrat sont visibles après le paiement." },
  { titre: "Parler à un conseiller", texte: "Au téléphone ou sur WhatsApp, pour comparer les écoles, le budget et les démarches." },
];

const FAQ = [
  { q: "Les diplômes sont-ils reconnus ?", r: "Chaque établissement affiche son statut officiel au Maroc (reconnu par l'État, diplômes homologués, établissement autorisé), vérifié sur les sources officielles marocaines. Pour l'équivalence au Gabon, renseignez-vous auprès du ministère de l'Enseignement supérieur." },
  { q: "Faut-il un visa pour le Maroc ?", r: "Les ressortissants gabonais sont dispensés de visa pour entrer au Maroc. Sur place, l'étudiant demande une carte de séjour avec son inscription. Le guide « Visa et séjour » détaille les pièces." },
  { q: "Mon enfant est mineur : comment ça marche ?", r: "Il peut créer son compte et explorer Navigoal. Les candidatures, les paiements et la réservation d'un logement s'ouvrent après votre consentement, donné depuis votre espace parent." },
  { q: "Que se passe-t-il si l'école refuse le dossier ?", r: "Votre enfant peut candidater à plusieurs écoles en parallèle ; chaque décision apparaît dans votre espace. Les conditions de remboursement des frais de dossier sont celles de chaque école." },
  { q: "Navigoal est-il payant pour les parents ?", r: "Non : le compte parent, le devis, le comparateur et le suivi sont gratuits. Seuls les frais de l'école et du logement sont payés, avec reçu." },
];

export default function ParentsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 to-brand-600 text-white">
        <div className="container relative grid gap-8 pt-12 sm:pt-16 lg:grid-cols-[1.2fr_.8fr] lg:pt-20">
          <Reveal className="flex flex-col gap-5 pb-8 lg:pb-20">
            <p className="text-[13px] font-extrabold uppercase tracking-[.16em] text-sun-400">Parents et tuteurs</p>
            <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">Votre enfant étudie au Maroc. Vous gardez la main.</h1>
            <p className="max-w-2xl text-base leading-relaxed text-brand-100 sm:text-lg">Budget réel en F CFA, écoles reconnues par l&apos;État, suivi des candidatures et paiement sécurisé, depuis le Gabon.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/inscription?profil=parent" className="btn-sun min-h-[48px] px-6">Créer mon compte parent</Link>
              <Link href="/devis" className="btn-ghost min-h-[48px] border-white/30 bg-white/10 px-6 text-white hover:bg-white/20">Faire un devis</Link>
            </div>
            <p className="text-[13px] text-brand-200">Gratuit · votre enfant vous invite depuis son espace, ou vous le liez avec son code d&apos;invitation</p>
          </Reveal>
          <div className="relative mx-auto w-[min(70%,360px)] self-end lg:w-full lg:max-w-[400px]">
            <Image src="/images/etudiante-840.webp" alt="Étudiante souriante avec ses cahiers" width={840} height={751} priority sizes="(max-width: 1024px) 70vw, 400px" className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Combien ça coûte vraiment ?</h2>
        <p className="mt-2 text-ink-soft">Fourchettes indicatives en F CFA, converties au taux du jour. Le devis détaillé se fait école par école.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {COUTS_PARENTS.map((c) => (
            <div key={c.titre} className="card rounded-[22px] p-5 sm:p-6">
              <p className="text-[13px] font-bold text-ink-mute">{c.titre}</p>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums sm:text-[26px]">{c.valeur} <span className="text-base">F CFA</span></p>
              <p className="mt-1 text-[13px] text-ink-soft">{c.note}</p>
            </div>
          ))}
        </div>
        <Link href="/devis" className="btn-ghost mt-5">Faire un devis détaillé</Link>
      </section>

      <section className="container grid gap-10 pb-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ce que vous pouvez faire</h2>
          <ol className="mt-4">
            {ACTIONS.map((a, i) => (
              <li key={a.titre} className="flex gap-4 border-b border-slate-200/70 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-extrabold text-brand-600">{i + 1}</span>
                <div><h3 className="font-extrabold">{a.titre}</h3><p className="mt-1 text-sm leading-relaxed text-ink-soft">{a.texte}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Vos questions</h2>
          <div className="mt-4">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-slate-200/70 py-4">
                <summary className="flex cursor-pointer list-none items-center gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{f.q}</span><ChevronDown size={18} className="shrink-0 text-ink-mute transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.r}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">À lire aussi : <Link href="/ressources/visa-carte-de-sejour/" className="font-bold text-brand-600">Visa et séjour</Link> · <Link href="/pays/ma/" className="font-bold text-brand-600">Étudier au Maroc</Link></p>
        </div>
      </section>
      <QuestionWhatsApp sujet="le suivi des études de mon enfant au Maroc" cta={{ href: "/inscription?profil=parent", label: "Créer mon compte" }} />
    </>
  );
}
