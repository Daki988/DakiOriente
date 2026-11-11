import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { VillesListe } from "@/components/sections/VillesListe";
import { CHIFFRES, VILLES, villeHref } from "@/lib/catalogue";
import { DESTINATIONS_ACTIVES, PAYS_ACTIFS_TEXTE } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Villes étudiantes : où étudier ?",
  description: `Casablanca, Rabat, Dakar, Fès, Thiès… Les ${CHIFFRES.villes} villes où étudier ${PAYS_ACTIFS_TEXTE} : écoles, formations, quartiers, transports, budget et logement.`,
  alternates: { canonical: "/villes/" },
};

export default function VillesPage() {
  const ld = { "@context": "https://schema.org", "@type": "ItemList", name: "Villes étudiantes", itemListElement: VILLES.map((v, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE_URL}${villeHref(v.nom)}`, name: `Étudier à ${v.nom}` })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden bg-[radial-gradient(900px_400px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)] pb-10 pt-8">
        <div className="container flex flex-col gap-4">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Villes</span></nav>
          <h1 className="h-display">Où étudier <span className="text-sun-500">{DESTINATIONS_ACTIVES.length > 1 ? "en Afrique" : PAYS_ACTIFS_TEXTE}</span> ?</h1>
          <p className="max-w-2xl text-lg text-ink-soft">{CHIFFRES.villes} villes accueillent les {CHIFFRES.campus} campus des {CHIFFRES.etablissements} établissements privés référencés. Pour chacune : écoles, formations, transports, quartiers étudiants, coût de la vie et logement.</p>
        </div>
      </section>
      <div className="container">
        <VillesListe />
        <Reveal className="mt-8 text-xs text-ink-mute">Photos des villes : Wikimedia Commons (auteurs et licences indiqués sur chaque page de ville).</Reveal>
      </div>
    </>
  );
}
