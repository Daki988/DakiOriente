import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { gallery, team, getUpcomingEvents, posters } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { SectionTitle } from "@/components/SectionTitle";
import { Gallery } from "@/components/Gallery";
import { AmbianceSwitch } from "@/components/AmbianceSwitch";
import { EventCard } from "@/components/EventCard";
import { Media } from "@/components/Media";
import { IconArrow } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Ambiance, DJ & soirées amapiano à Libreville",
  description: "Photos des soirées Jackboy à Libreville : DJ Hamed aux platines, chicha, shots, cocktails. Amapiano, afrobeats, afritcham, quartier Louis.",
  alternates: { canonical: "/ambiance" },
};

export default function AmbiancePage() {
  const events = getUpcomingEvents().slice(0, 2);
  return (
    <>
      <PageHero kicker="Feel the night" title="L'ambiance">
        Cuisine, musique et communauté. Ces photos viennent de vraies soirées chez Jackboy : chaque soir a sa propre énergie.
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
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="affiches">
        <SectionTitle id="affiches" kicker="Le vrai goût du chill" title="Nos affiches">
          Une seule adresse : Louis, avant l&apos;ambassade de Côte d&apos;Ivoire.
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {posters.map((p) => (
            <li key={p.src} className={`reveal overflow-hidden rounded-2xl border border-white/10 ${p.w > p.h ? "col-span-2" : ""}`}>
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes={p.w > p.h ? "(min-width:768px) 50vw, 100vw" : "(min-width:768px) 25vw, 50vw"} className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="equipe">
        <SectionTitle id="equipe" kicker="Aux platines" title="DJ Hamed">Le DJ résident de Jackboy.</SectionTitle>
        <ul className="grid gap-4 md:grid-cols-2">
          {team.map((m, i) => (
            <li key={i} className="reveal">
              <Media src={m.photo} alt={`${m.name}, ${m.role.toLowerCase()} de Jackboy à Libreville`} mood="team" className="aspect-[4/3] rounded-2xl" sizes="(min-width:768px) 50vw, 100vw" />
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
