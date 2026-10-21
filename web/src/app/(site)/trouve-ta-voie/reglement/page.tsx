import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { CAMPAGNE, dateLongue } from "@/lib/campagne";

export const metadata: Metadata = {
  title: "Règlement du jeu #TrouveTaVoie",
  description: "Règlement du jeu-concours #TrouveTaVoie organisé par Navigoal du 1er au 21 février 2027 : participation, dotation, tirage au sort.",
  alternates: { canonical: "/trouve-ta-voie/reglement/" },
};

const jour = (iso: string) => dateLongue(iso, { jour: true, annee: true });

// Texte provisoire : à compléter (raison sociale, valeur du lot) et à faire relire avant publication.
const ARTICLES = [
  { titre: "Article 1 · Organisateur", texte: "Le jeu est organisé par Navigoal (raison sociale, adresse et numéro d'immatriculation à compléter), éditeur du site navigoal.net." },
  { titre: "Article 2 · Dates", texte: `Du ${jour(CAMPAGNE.jeu.debut)} à 0 h au ${jour(CAMPAGNE.jeu.fin)} à 23 h 59, heure de Libreville. Tirage au sort le ${jour(CAMPAGNE.jeu.tirage)}, en direct.` },
  { titre: "Article 3 · Participants", texte: "Le jeu est ouvert aux élèves et étudiants résidant au Gabon, âgés de 18 ans ou plus, ou mineurs avec l'autorisation écrite d'un parent ou tuteur. Une seule participation par personne." },
  { titre: "Article 4 · Comment participer", texte: "1. Faire le test d'orientation sur navigoal.net. 2. Créer un compte élève ou étudiant. 3. Partager son profil avec #TrouveTaVoie. Le partage est facultatif si le participant n'a pas accès aux réseaux sociaux : la création du compte suffit." },
  { titre: "Article 5 · Dotation", texte: "Un « pack départ » : frais de candidature pris en charge, accompagnement personnalisé par un conseiller Navigoal, ordinateur portable (valeur et modèle à préciser). La dotation n'est ni échangeable ni remboursable en espèces." },
  { titre: "Article 6 · Tirage et annonce", texte: "Le tirage a lieu parmi les comptes valides, sous le contrôle d'un témoin. Le gagnant est prévenu par e-mail et par WhatsApp ; son nom n'est publié qu'avec son accord." },
  { titre: "Article 7 · Données personnelles", texte: "Les données servent uniquement à la gestion du jeu et du compte Navigoal, conformément à la politique de confidentialité." },
];

export default function ReglementPage() {
  return (
    <div className="bg-white">
      <div className="border-b-[3px] border-[#0A0A0A] bg-[#FFE14D]">
        <div className="container py-12 sm:py-16">
          <p className="eyebrow text-[#0A0A0A]">Jeu-concours</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[1.05] text-[#0A0A0A] sm:text-7xl lg:text-8xl">Règlement du jeu #TrouveTaVoie</h1>
          <p className="mt-4 text-base font-bold text-[#0A0A0A] sm:text-lg">Du 1er au 21 février 2027 · Tirage le 24 février</p>
        </div>
      </div>
      <div className="container max-w-4xl py-10 sm:py-14">
        {ARTICLES.map((a) => (
          <section key={a.titre} className="border-b border-slate-200/70 py-6">
            <h2 className="text-lg font-extrabold sm:text-xl">{a.titre}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{a.texte}</p>
          </section>
        ))}
        <p className="mt-8"><Link href="/trouve-ta-voie/" className="font-extrabold text-brand-600">← Retour à Trouve ta voie</Link> · <Link href="/confidentialite/" className="font-extrabold text-brand-600">Politique de confidentialité</Link></p>
      </div>
    </div>
  );
}
