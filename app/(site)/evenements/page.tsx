import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { EventCard } from "@/components/EventCard";
import { FeaturedEvent } from "@/components/FeaturedEvent";
import { HideAfter } from "@/components/HideAfter";

export const metadata: Metadata = {
  title: "Soirées & événements à Libreville",
  description: "Soirées à Libreville chez Jackboy (Louis) : Afro Halloween Party le samedi 31 octobre 2026 dès 21 h avec DJ Hamed. Amapiano, afrobeats, afrotcham, dancehall.",
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
      <div className="mx-auto max-w-6xl px-4 py-12">
        {events.length ? (
          <div className="grid gap-6">
            {events.map((e, i) => (
              <HideAfter key={e.title + e.date} date={e.date}>
                {i === 0 ? <FeaturedEvent e={e} /> : <EventCard e={e} />}
              </HideAfter>
            ))}
          </div>
        ) : (
          <p className="text-muted">Prochaines soirées annoncées très bientôt. Chaque soir, l'ambiance monte avec DJ Hamed aux platines.</p>
        )}
      </div>
    </>
  );
}
