import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ChevronRight, HandCoins, Scale, ShieldCheck, UsersRound } from "lucide-react";
import { EtapesReservation } from "@/components/navilease/Explications";

export const metadata: Metadata = { title: "Comment ça marche · Navilease", description: "Réserver un logement étudiant au Maroc avec Navilease : recherche, réservation, paiement protégé en séquestre, contrat numérique et emménagement." };

const PROTECTIONS = [
  { I: ShieldCheck, t: "Bailleurs et logements vérifiés", s: "L'identité du bailleur et les justificatifs du logement sont contrôlés avant la mise en ligne. L'adresse exacte n'est révélée qu'après le paiement." },
  { I: HandCoins, t: "Argent bloqué jusqu'à l'entrée", s: "Le premier loyer et la caution restent en séquestre. Le bailleur n'est payé qu'après l'état des lieux d'entrée." },
  { I: UsersRound, t: "Les parents gardent la main", s: "Si l'étudiant est mineur, le parent valide la réservation. Il peut se porter garant et suit les paiements depuis son espace." },
  { I: Scale, t: "Médiation en cas de litige", s: "En cas de désaccord, les fonds sont gelés et l'équipe Navilease intervient entre l'étudiant et le bailleur." },
];

export default function Page() {
  return (
    <div className="container flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/navilease">Navilease</Link><ChevronRight size={14} /><span>Comment ça marche</span></nav>
        <h1 className="h-display">Se loger <span className="text-sun-500">sans mauvaise surprise</span></h1>
        <p className="max-w-2xl text-lg text-ink-soft">De la recherche à la remise des clés : ce que fait Navilease pour protéger l&apos;étudiant et sa famille.</p>
      </div>
      <EtapesReservation />
      <section className="flex flex-col gap-5">
        <h2 className="h-section">Ce qui vous protège</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROTECTIONS.map(({ I, t, s }) => (
            <div key={t} className="card flex gap-4 p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f4ed] text-[#2b6a4c]"><I size={22} /></span><span><b className="block">{t}</b><span className="text-sm leading-relaxed text-ink-soft">{s}</span></span></div>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href="/navilease/logements" className="btn-primary">Voir les logements</Link>
        <Link href="/navilease/residences" className="btn-ghost">Résidences universitaires</Link>
        <Link href="/navilease/cgu" className="btn-ghost">Lire les règles complètes</Link>
      </div>
    </div>
  );
}
