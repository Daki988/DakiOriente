import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { EventCard } from "@/components/EventCard";

export const metadata: Metadata = {
  title: "Événements",
  description: "La programmation de Jackboy : soirées amapiano, afrobeats, afritcham, DJs invités.",
  alternates: { canonical: "/evenements" },
};

// Régénération périodique : les événements passés disparaissent sans redéploiement.
export const revalidate = 3600;

export default function EventsPage() {
  const events = getUpcomingEvents();
  return (
    <>
      <PageHero kicker="Programmation" title="Événements">
        Soirées, DJs et rendez-vous à venir chez Jackboy.
      </PageHero>
      <div className="mx-auto max-w-4xl px-4 py-12">
        {events.length ? (
          <div className="grid gap-4">{events.map((e) => <EventCard key={e.title + e.date} e={e} />)}</div>
        ) : (
          <p className="text-muted">Aucun événement annoncé pour le moment. Suivez-nous sur les réseaux pour ne rien manquer.</p>
        )}
      </div>
    </>
  );
}
