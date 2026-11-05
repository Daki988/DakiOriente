import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "@/components/ui/Link";
import { ChevronRight } from "lucide-react";
import { ResidencesListe } from "@/components/navilease/ResidencesListe";
import { residencesEtudiantes, VILLES_RESIDENCES } from "@/lib/residences";

export const metadata: Metadata = {
  title: "Résidences universitaires au Maroc : prix et réservation",
  description: `${residencesEtudiantes.length} résidences étudiantes au Maroc (${VILLES_RESIDENCES.slice(0, 5).join(", ")}…) : photos, loyers, services inclus et lien de réservation officiel.`,
  alternates: { canonical: "/navilease/residences/" },
};

export default function ResidencesPage() {
  return (
    <>
      <section className="bg-[radial-gradient(900px_400px_at_85%_0%,#fff1c2,transparent_60%),linear-gradient(180deg,#fffaf0,#f6f8fe)] pb-8 pt-8">
        <div className="container flex flex-col gap-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/navilease">Navilease</Link><ChevronRight size={14} /><span>Résidences universitaires</span></nav>
          <h1 className="h-section">Résidences universitaires au Maroc</h1>
          <p className="max-w-3xl text-ink-soft">Photos, loyers et services relevés sur les sites officiels. La réservation se fait directement auprès de chaque résidence, sur sa plateforme officielle : Navilease ne prend aucun paiement pour ces résidences.</p>
        </div>
      </section>
      <div className="mt-6"><Suspense><ResidencesListe /></Suspense></div>
    </>
  );
}
