import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ChevronRight, FileSignature, HandCoins, ShieldCheck, UsersRound } from "lucide-react";

export const metadata: Metadata = { title: "Bailleurs · Navilease", description: "Louez votre logement à des étudiants vérifiés avec Navilease : annonce, demandes, contrat numérique, quittances et versements sécurisés." };

const AVANTAGES = [
  { I: UsersRound, t: "Des étudiants identifiés", s: "Les locataires sont des étudiants inscrits sur Navigoal, avec un parent garant lorsqu'ils sont mineurs." },
  { I: HandCoins, t: "Des loyers encaissés en sécurité", s: "Le premier loyer et la caution sont payés avant l'entrée et vous sont versés après l'état des lieux." },
  { I: FileSignature, t: "Contrat et quittances automatiques", s: "Le contrat se signe en ligne ; les quittances sont générées à chaque loyer payé." },
  { I: ShieldCheck, t: "Un cadre clair", s: "État des lieux en photos à l'entrée et à la sortie, médiation Navilease en cas de désaccord." },
];
const ETAPES = [
  ["Créez votre compte bailleur", "Quelques minutes, avec votre e-mail ou votre téléphone."],
  ["Faites vérifier votre profil", "Pièce d'identité et justificatif du logement, contrôlés par l'équipe."],
  ["Publiez votre annonce", "Photos, loyer, charges, équipements et établissements proches."],
  ["Recevez les demandes", "Vous acceptez ou refusez chaque réservation depuis votre espace."],
  ["Signez et accueillez", "Contrat numérique, état des lieux, puis versement des fonds."],
];

export default function Page() {
  return (
    <div className="container flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/navilease">Navilease</Link><ChevronRight size={14} /><span>Bailleurs</span></nav>
        <h1 className="h-display">Louez à des <span className="text-sun-500">étudiants vérifiés</span></h1>
        <p className="max-w-2xl text-lg text-ink-soft">Propriétaires et gestionnaires au Maroc : proposez votre logement aux étudiants qui arrivent de toute l&apos;Afrique, dans un cadre sécurisé.</p>
        <div className="flex flex-wrap gap-3 pt-1"><Link href="/inscription?profil=bailleur" className="btn-sun">Publier mon logement</Link><Link href="/connexion?suite=/bailleur" className="btn-ghost">J&apos;ai déjà un compte</Link></div>
      </div>
      <section className="grid gap-4 sm:grid-cols-2">
        {AVANTAGES.map(({ I, t, s }) => (
          <div key={t} className="card flex gap-4 p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f4ed] text-[#2b6a4c]"><I size={22} /></span><span><b className="block">{t}</b><span className="text-sm leading-relaxed text-ink-soft">{s}</span></span></div>
        ))}
      </section>
      <section className="flex flex-col gap-5 rounded-[28px] bg-gradient-to-br from-brand-950 to-brand-700 p-6 text-white sm:p-10">
        <h2 className="text-2xl font-extrabold sm:text-[28px]">Publier en 5 étapes</h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES.map(([t, s], k) => <li key={t} className="flex flex-col gap-1.5"><span className="text-[28px] font-extrabold text-sun-400">0{k + 1}</span><b>{t}</b><span className="text-[13px] leading-relaxed text-[#c9d6ff]">{s}</span></li>)}
        </ol>
        <Link href="/inscription?profil=bailleur" className="btn-sun self-start">Créer mon compte bailleur</Link>
      </section>
      <p className="text-sm text-ink-mute">Les conditions détaillées (vérification, versements, annulation) figurent dans les <Link href="/navilease/cgu" className="font-bold text-brand-600">règles de Navilease</Link>.</p>
    </div>
  );
}
