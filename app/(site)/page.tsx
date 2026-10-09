import Link from "next/link";
import { settings, getSignatureProducts, getUpcomingEvents, gallery } from "@/lib/content";
import { hoursSummary } from "@/lib/hours";
import { Button } from "@/components/Button";
import { OpenStatus } from "@/components/OpenStatus";
import { SectionTitle } from "@/components/SectionTitle";
import { AmbianceSwitch } from "@/components/AmbianceSwitch";
import { ProductCard } from "@/components/ProductCard";
import { EventCard } from "@/components/EventCard";
import { Media } from "@/components/Media";
import { VisitBlock } from "@/components/VisitBlock";
import { CactusMark } from "@/components/Logo";
import { IconArrow, IconPin } from "@/components/Icons";

const GENRES = ["Amapiano", "Afrobeats", "Afritcham", "Urban"];

export default function Home() {
  const signatures = getSignatureProducts(3);
  const events = getUpcomingEvents().slice(0, 2);
  const moments = gallery.slice(0, 5);

  return (
    <>
      {/* ───── ACTE 1 — Hero ───── */}
      <section aria-labelledby="hero-title" className="grain relative isolate flex min-h-[calc(100svh-3.5rem-var(--bottom-nav-h))] items-end overflow-hidden md:min-h-[calc(100svh-4rem)]">
        {/* Fond : visuel provisoire en CSS pur (0 octet d'image → LCP texte instantané).
            TODO: DONNÉE À CONFIRMER — remplacer par photo hero (poster) + vidéo légère desktop. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 wood" style={{ background: "radial-gradient(70% 55% at 75% 20%, rgba(140,198,63,.28), transparent 60%), radial-gradient(60% 50% at 10% 85%, rgba(14,58,44,.9), transparent 70%), radial-gradient(40% 30% at 85% 90%, rgba(210,168,78,.18), transparent 70%), linear-gradient(180deg,#0b0f0d 0%,#0a0c0b 100%)" }} />
        <CactusMark className="glow pointer-events-none absolute -right-10 top-6 -z-10 h-[70vmin] w-[70vmin] text-accent/[0.07] md:right-10" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 md:pb-20">
          <OpenStatus hours={settings.hours} className="rise mb-6" />
          <p className="rise text-xs font-semibold uppercase tracking-[0.35em] text-accent">Feel the night · Libreville</p>
          <h1 id="hero-title" className="lift mt-4 font-display text-[clamp(3.2rem,15vw,9rem)]">
            Jackboy<span className="block text-[0.42em] text-text/90">Bar-Restaurant 241</span>
          </h1>
          <p className="rise rise-2 mt-5 max-w-xl text-lg text-text/85 sm:text-xl">{settings.tagline}</p>
          <p className="rise rise-2 mt-1 font-display text-2xl text-gold sm:text-3xl">{settings.taglineFr}</p>
          <div className="rise rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/menu">Découvrir le menu <IconArrow className="h-4 w-4" /></Button>
            <Button href="/acces" variant="ghost"><IconPin className="h-4 w-4" /> Nous trouver</Button>
          </div>
          <p className="rise rise-3 mt-6 text-sm text-muted">
            Louis, Libreville · {hoursSummary(settings.hours)}
          </p>
        </div>
      </section>

      {/* ───── ACTE 2 — Deux ambiances ───── */}
      <section aria-labelledby="acte2" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionTitle id="acte2" kicker="Deux ambiances, une adresse" title="Une soirée. Plusieurs ambiances.">
          Conviviale en début de soirée, beaucoup plus animée vers 23 h – minuit. L&apos;ambiance varie selon les soirs.
        </SectionTitle>
        <AmbianceSwitch />
      </section>

      {/* ───── ACTE 3 — Cuisine ───── */}
      <section aria-labelledby="acte3" className="wood border-y border-white/5 bg-surface/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle id="acte3" kicker="L'expérience culinaire" title="Nos signatures">
            Les paninis Jackboy sont la raison pour laquelle on revient. Pressés minute, généreux.
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {signatures.map((p) => (
              <div key={p.name} className="w-[82%] shrink-0 snap-start md:w-auto">
                <ProductCard p={p} large category={p.category} />
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/menu" variant="gold">Voir le menu complet <IconArrow className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      {/* ───── ACTE 4 — Musique & communauté ───── */}
      <section aria-labelledby="acte4" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionTitle id="acte4" kicker="Musique & communauté" title="Le son de Libreville.">
          On ne le décrit pas, on le vit.
        </SectionTitle>
        <ul className="reveal mb-8 flex flex-wrap gap-2" aria-label="Styles musicaux">
          {GENRES.map((g) => (
            <li key={g} className="rounded-full border border-accent/30 bg-secondary/40 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-accent">{g}</li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {moments.map((m, i) => (
            <li key={i} className={`reveal ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
              <Media src={m.src} alt={m.alt} mood={m.mood} className={`h-full rounded-2xl ${i === 0 ? "aspect-square" : "aspect-[4/5]"}`} sizes="(min-width:768px) 25vw, 50vw" />
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/ambiance" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent hover:underline">
            Toute l&apos;ambiance <IconArrow className="h-4 w-4" />
          </Link>
        </div>

        {events.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-5 font-display text-3xl">À venir</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((e) => <EventCard key={e.title + e.date} e={e} />)}
            </div>
            <Link href="/evenements" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent hover:underline">
              Toute la programmation <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        )}

        <Link href="/loft" className="reveal group mt-16 block overflow-hidden rounded-3xl border border-gold/30">
          <div className="relative">
            <Media mood="late" alt="Le Loft" className="aspect-[16/9] md:aspect-[21/9]" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 to-transparent p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Espace premium</p>
              <p className="font-display text-4xl">Le Loft</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-gold group-hover:underline">Découvrir <IconArrow className="h-4 w-4" /></span>
            </div>
          </div>
        </Link>
      </section>

      {/* ───── ACTE 5 — Passage à l'action ───── */}
      <section aria-labelledby="acte5" className="border-t border-white/5 bg-secondary/25 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle id="acte5" kicker="Rendez-vous" title="On se retrouve chez Jackboy ?">
            Louis, Libreville, à environ 100 mètres de l&apos;ambassade de Côte d&apos;Ivoire.
          </SectionTitle>
          <VisitBlock />
        </div>
      </section>
    </>
  );
}

export const revalidate = 3600;
