import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/ui/Link";
import { ArrowRight, Building2, ChevronRight, GraduationCap, MapPin } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { CHIFFRES, VILLES, villeHref } from "@/lib/catalogue";
import { paysDetailById } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Villes étudiantes du Maroc : où étudier ?",
  description: `Casablanca, Rabat, Fès, Marrakech, Tanger, Agadir… Les ${CHIFFRES.villes} villes où étudier au Maroc : établissements et campus, formations, transports, quartiers étudiants, coût de la vie et logement.`,
  alternates: { canonical: "/villes/" },
};

const PROFILS = Object.fromEntries(paysDetailById.MA.villes.map((v) => [v.nom.replace("Benguerir", "Ben Guérir"), v.profil]));

export default function VillesPage() {
  const ld = { "@context": "https://schema.org", "@type": "ItemList", name: "Villes étudiantes du Maroc", itemListElement: VILLES.map((v, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE_URL}${villeHref(v.nom)}`, name: `Étudier à ${v.nom}` })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="relative overflow-hidden bg-[radial-gradient(900px_400px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)] pb-10 pt-8">
        <div className="container flex flex-col gap-4">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Villes</span></nav>
          <h1 className="h-display">Où étudier <span className="text-sun-500">au Maroc</span> ?</h1>
          <p className="max-w-2xl text-lg text-ink-soft">{CHIFFRES.villes} villes accueillent les {CHIFFRES.campus} campus des {CHIFFRES.etablissements} établissements privés référencés. Pour chacune : écoles, formations, transports, quartiers étudiants, coût de la vie et logement.</p>
        </div>
      </section>
      <div className="container">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VILLES.map((v) => {
            const nf = new Set(v.offres.map((o) => o.f.id)).size;
            return (
              <StaggerItem key={v.slug}>
                <Link href={villeHref(v.nom)} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-400">
                    {v.photo ? <Image src={v.photo.src} alt={`Vue de ${v.nom}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <MapPin size={64} strokeWidth={1.3} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                    <b className="absolute bottom-3 left-4 text-2xl font-extrabold text-white">{v.nom}</b>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    {PROFILS[v.nom] && <p className="text-[13px] leading-relaxed text-ink-soft">{PROFILS[v.nom]}</p>}
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-soft">
                      <span className="flex items-center gap-1.5"><Building2 size={15} className="text-brand-600" />{v.etabs.length} établissement{v.etabs.length > 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1.5"><GraduationCap size={15} className="text-brand-600" />{nf} formation{nf > 1 ? "s" : ""}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-brand-600">Étudier à {v.nom} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
        <Reveal className="mt-8 text-xs text-ink-mute">Photos des villes : Wikimedia Commons (auteurs et licences indiqués sur chaque page de ville).</Reveal>
      </div>
    </>
  );
}
