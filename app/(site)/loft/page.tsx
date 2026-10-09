import type { Metadata } from "next";
import { loft, settings } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { Media } from "@/components/Media";
import { Button } from "@/components/Button";
import { IconPhone, IconStar } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Le Loft",
  description: "Le Loft, l'espace premium de Jackboy Bar-Restaurant 241 à Libreville.",
  alternates: { canonical: "/loft" },
};

export default function LoftPage() {
  const phone = settings.phones[1] ?? settings.phones[0];
  return (
    <>
      <PageHero kicker="Espace premium" title={loft.title}>{loft.intro}</PageHero>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center">
        <Media src={loft.image} alt="Le Loft" mood="late" className="reveal aspect-[4/5] rounded-3xl border border-gold/20" sizes="(min-width:768px) 50vw, 100vw" />
        <div className="reveal">
          <ul className="space-y-4">
            {loft.features.map((f) => (
              <li key={f} className="flex items-start gap-3"><IconStar className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> <span>{f}</span></li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">{loft.conditions}</p>
          <div className="mt-8"><Button href={`tel:${phone.number}`} variant="gold"><IconPhone className="h-4 w-4" /> Renseignements Loft</Button></div>
        </div>
      </div>
    </>
  );
}
