import Link from "next/link";
import Image from "next/image";
import { settings, getSignatureProducts, getUpcomingEvents, gallery, loft, getCategories, getComposerPools, seo } from "@/lib/content";
import { hoursSummary } from "@/lib/hours";
import { Button } from "@/components/Button";
import { OpenStatus } from "@/components/OpenStatus";
import { SectionTitle } from "@/components/SectionTitle";
import { AmbianceSwitch } from "@/components/AmbianceSwitch";
import { ProductCard } from "@/components/ProductCard";
import { EventCard } from "@/components/EventCard";
import { Media } from "@/components/Media";
import { VisitBlock } from "@/components/VisitBlock";
import { CactusMark, FullLogo } from "@/components/Logo";
import { IconArrow, IconPin } from "@/components/Icons";
import { Marquee } from "@/components/Marquee";
import { NightPulse } from "@/components/NightPulse";
import { SoireeComposer } from "@/components/SoireeComposer";
import { MenuDownload } from "@/components/MenuDownload";
import { Faq } from "@/components/Faq";
import { DrinksShowcase } from "@/components/DrinksShowcase";
import { TakeawayBanner } from "@/components/TakeawayBanner";

const GENRES = ["Amapiano", "Afrobeats", "Afritcham", "Urban"];

export default function Home() {
  const signatures = getSignatureProducts(6);
  const events = getUpcomingEvents().slice(0, 2);
  const moments = gallery.filter((g) => !g.caption.startsWith("DJ Hamed")).slice(0, 5);
  const pools = getComposerPools();
  const categories = getCategories();

  return (
    <>
      {/* ───── ACTE 1 — Hero ───── */}
      <section aria-labelledby="hero-title" className="grain relative isolate flex min-h-[calc(100svh-3.5rem-var(--bottom-nav-h))] items-end overflow-hidden md:min-h-[calc(100svh-4rem)]">
        {/* Fond : les platines de Jackboy dans la pénombre (photo réelle, ~35 Ko), assombrie pour la lisibilité */}
        <Image
          src="/images/ambiance/platines-dj-nuit-jackboy-libreville.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[70%_center] opacity-70"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, rgba(10,12,11,.55) 0%, rgba(10,12,11,.35) 35%, rgba(10,12,11,.92) 100%), radial-gradient(70% 55% at 75% 20%, rgba(22,180,127,.22), transparent 60%), radial-gradient(60% 50% at 10% 85%, rgba(11,58,46,.7), transparent 70%)" }} />
        <CactusMark className="glow pointer-events-none absolute -right-10 top-6 -z-10 h-[70vmin] w-[70vmin] text-accent/[0.07] md:right-10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[6%] top-1/2 -z-10 hidden -translate-y-1/2 lg:block">
          <div className="relative h-[460px] w-[420px]">
            <Media src="/images/ambiance/dj-hamed-aux-platines-jackboy-libreville.webp" alt="" className="absolute right-0 top-0 h-[300px] w-[360px] rotate-3 rounded-3xl border border-white/10 shadow-2xl" sizes="360px" />
            <Media src="/images/menu/cocktail-passion-jackboy.webp" alt="" className="absolute bottom-0 left-0 h-[250px] w-[175px] -rotate-6 rounded-3xl border border-white/10 shadow-2xl" sizes="175px" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-8 md:pb-20 md:pt-16">
          <OpenStatus hours={settings.hours} className="lift mb-4" />
          <FullLogo priority className="neon mb-4 h-auto w-24 sm:w-44 md:w-56" />
          <p className="lift text-xs font-semibold uppercase tracking-[0.35em] text-accent">Bar · Fast food gourmet · Chicha · Libreville</p>
          <h1 id="hero-title" className="lift mt-2 font-display text-[clamp(2.5rem,10.5vw,7rem)]">
            Jackboy{" "}<span className="block text-[0.42em] text-text/90">Bar-Restaurant 241</span>
          </h1>
          <p className="lift mt-4 max-w-xl text-base text-text/85 sm:text-xl">{settings.tagline}</p>
          <p className="lift neon-text mt-1 font-display text-2xl text-gold sm:text-3xl">{settings.taglineFr}</p>
          <div className="lift mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="/menu">Découvrir le menu <IconArrow className="h-4 w-4" /></Button>
            <Button href="/acces" variant="ghost"><IconPin className="h-4 w-4" /> Nous trouver</Button>
          </div>
          <p className="lift mt-6 text-sm text-muted">
            Louis, Libreville · {hoursSummary(settings.hours)} · Good drinks · Good vibes · Great people
          </p>
        </div>
      </section>

      <Marquee items={["Ton repère, ton rythme, ta vibe", "Good drinks", "Good vibes", "Great people", "Le vrai goût du chill", "Amapiano", "Afrobeats", "Afritcham", "Before & after", "Burgers", "Chicha", "Louis · Libreville"]} />

      {/* ───── ACTE 2 — Deux ambiances ───── */}
      <section aria-labelledby="acte2" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionTitle id="acte2" kicker="Deux ambiances, une adresse" title="Une soirée. Plusieurs ambiances.">
          Conviviale en début de soirée, beaucoup plus animée vers 23 h – minuit. L&apos;ambiance varie selon les soirs.
        </SectionTitle>
        <AmbianceSwitch />
        <div className="mt-6"><NightPulse /></div>
      </section>

      {/* ───── ACTE 3 — Cuisine ───── */}
      <section aria-labelledby="acte3" className="wood border-y border-white/5 bg-surface/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle id="acte3" kicker="Fast food gourmet" title="Du goût, du vrai, du plaisir.">
            Burgers gourmets, paninis croustillants dès 1 500 FCFA, wings caramélisées ou salées, brochettes et nems.
            {settings.ordering.enabled && " À déguster sur place, à emporter ou en livraison."}
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {signatures.map((p) => (
              <div key={p.name} className="w-[82%] shrink-0 snap-start md:w-auto">
                <ProductCard p={p} large category={p.category} />
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/menu" variant="gold">{settings.ordering.enabled ? "Voir le menu & commander" : "Voir le menu complet"} <IconArrow className="h-4 w-4" /></Button>
          </div>
          <div className="mt-20"><DrinksShowcase /></div>
          {settings.ordering.enabled && <div className="mt-16"><TakeawayBanner /></div>}
          {settings.ordering.enabled && <div className="mt-6"><SoireeComposer pools={pools} /></div>}
          <div className="mt-6"><MenuDownload /></div>
        </div>
      </section>

      {/* ───── ACTE 4 — Musique & communauté ───── */}
      <section aria-labelledby="acte4" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionTitle id="acte4" kicker="Musique & communauté" title="Le son de Libreville.">
          Aux platines : <strong className="text-text">{settings.residentDj}</strong>. Music, drinks, friends, good mood.
        </SectionTitle>
        <div className="spotlight reveal mb-10 grid overflow-hidden rounded-3xl border border-white/10 bg-surface md:grid-cols-[1.2fr_1fr]">
          <Media src="/images/ambiance/dj-hamed-aux-platines-jackboy-libreville.webp" alt="DJ Hamed aux platines chez Jackboy, Libreville" className="aspect-[4/3] md:aspect-auto md:min-h-[420px]" sizes="(min-width:768px) 60vw, 100vw" />
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Aux platines</p>
            <h3 className="mt-2 font-display text-5xl sm:text-6xl">{settings.residentDj}</h3>
            <p className="mt-4 text-text/80">
              Le DJ résident de Jackboy. Il lit la salle, fait monter la pression au bon moment et transforme
              l&apos;afterwork en vraie soirée : amapiano, afrobeats, afritcham et sons urbains.
            </p>
            <p className="mt-6 font-display text-2xl text-accent">Ton repère, ton rythme, ta vibe.</p>
          </div>
        </div>
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

        {loft.visible && <Link href="/loft" className="reveal group mt-16 block overflow-hidden rounded-3xl border border-gold/30">
          <div className="relative">
            <Media mood="late" alt="Le Loft" className="aspect-[16/9] md:aspect-[21/9]" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 to-transparent p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Espace premium</p>
              <p className="font-display text-4xl">Le Loft</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-gold group-hover:underline">Découvrir <IconArrow className="h-4 w-4" /></span>
            </div>
          </div>
        </Link>}
      </section>

      {/* ───── Présentation (contenu riche pour le référencement local) ───── */}
      <section aria-labelledby="apropos" className="border-t border-white/5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
          <div className="reveal">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Jackboy en bref</p>
            <h2 id="apropos" className="mt-3 font-display text-4xl sm:text-5xl">Votre bar-restaurant à Libreville</h2>
            <div className="mt-5 space-y-4 text-text/85">
              <p>
                Installé dans le <strong>quartier Louis à Libreville</strong>, à 100 mètres de l&apos;ambassade de Côte d&apos;Ivoire,
                Jackboy Bar-Resto 241 réunit tout ce qu&apos;on attend d&apos;une sortie réussie : un <strong>fast food gourmet</strong>,
                un <strong>bar</strong> bien fourni et une vraie ambiance.
              </p>
              <p>
                Côté cuisine : <Link className="text-accent underline-offset-2 hover:underline" href="/menu/burgers">burgers</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/paninis">paninis</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/wings">chicken wings</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/brochettes">brochettes</Link> et{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/nems">nems</Link>, à partir de 1 000 FCFA.
                Côté bar : <Link className="text-accent underline-offset-2 hover:underline" href="/menu/cocktails">cocktails</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/bieres-locales">bières gabonaises</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/spiritueux">whisky et spiritueux</Link>,{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/vins">vins</Link> et{" "}
                <Link className="text-accent underline-offset-2 hover:underline" href="/menu/chicha">chicha</Link>.
              </p>
              <p>
                Ouvert tous les jours dès 15 h : afterwork entre collègues, dîner entre amis, anniversaire ou grosse soirée
                amapiano et afrobeats avec {settings.residentDj}. Commandez aussi à emporter ou en livraison via WhatsApp.
              </p>
            </div>
          </div>
          <div className="reveal">
            <h2 className="mb-4 font-display text-3xl">Questions fréquentes</h2>
            <Faq limit={4} />
            <Link href="/faq" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent hover:underline">
              Toutes les questions <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <nav aria-label="Catégories du menu" className="mx-auto mt-12 max-w-6xl px-4">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/menu/${c.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-4 text-sm text-text/80 hover:border-accent hover:text-accent">
                  {seo.categories[c.slug]?.h1 ?? c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* ───── ACTE 5 — Passage à l'action ───── */}
      <section aria-labelledby="acte5" className="border-t border-white/5 bg-secondary/25 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle id="acte5" kicker="Rendez-vous" title="On se retrouve chez Jackboy ?">
            Louis, Libreville, à 100 mètres de l&apos;ambassade de Côte d&apos;Ivoire. Tous les jours dès 15 h.
          </SectionTitle>
          <VisitBlock />
        </div>
      </section>
    </>
  );
}

export const revalidate = 3600;
