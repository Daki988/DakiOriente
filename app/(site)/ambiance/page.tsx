import type { Metadata } from "next";
import Link from "next/link";
import { gallery, team, getUpcomingEvents } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { SectionTitle } from "@/components/SectionTitle";
import { Gallery } from "@/components/Gallery";
import { AmbianceSwitch } from "@/components/AmbianceSwitch";
import { EventCard } from "@/components/EventCard";
import { Media } from "@/components/Media";
import { IconArrow } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Ambiance",
  description: "Photos, vidéos, DJs et équipe : l'ambiance Jackboy, de l'apéro à la nuit. Amapiano, afrobeats, afritcham.",
  alternates: { canonical: "/ambiance" },
};

export default function AmbiancePage() {
  const events = getUpcomingEvents().slice(0, 2);
  return (
    <>
      <PageHero kicker="Feel the night" title="L'ambiance">
        Cuisine, musique et communauté. Les photos reflètent des soirées réelles : chaque soir a sa propre énergie.
      </PageHero>
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="galerie">
        <SectionTitle id="galerie" kicker="Galerie" title="Les moments forts" />
        <Gallery items={gallery} />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="deux">
        <SectionTitle id="deux" kicker="De l'apéro à la nuit" title="Deux temps, une adresse" />
        <AmbianceSwitch />
      </section>
      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="djs">
          <SectionTitle id="djs" kicker="Aux platines" title="DJs & événements" />
          <div className="grid gap-4 md:grid-cols-2">{events.map((e) => <EventCard key={e.title + e.date} e={e} />)}</div>
          <Link href="/evenements" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent hover:underline">
            Toute la programmation <IconArrow className="h-4 w-4" />
          </Link>
        </section>
      )}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="equipe">
        <SectionTitle id="equipe" kicker="Hospitalité" title="L'équipe">Ceux qui font Jackboy, chaque soir.</SectionTitle>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {team.map((m, i) => (
            <li key={i} className="reveal">
              <Media src={m.photo} alt={`${m.role} — ${m.name}`} mood="team" className="aspect-[4/5] rounded-2xl" sizes="(min-width:768px) 33vw, 50vw" />
              <p className="mt-3 font-semibold">{m.name}</p>
              <p className="text-sm text-muted">{m.role}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export const revalidate = 3600;
