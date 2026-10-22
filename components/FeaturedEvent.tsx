import Image from "next/image";
import Link from "next/link";
import { formatEventDate, settings, fullAddress, type JackboyEvent } from "@/lib/content";
import { fmt } from "@/lib/hours";
import { SITE_URL } from "@/lib/site";
import { LdJson } from "./Schema";
import { IconArrow, IconCalendar, IconPhone, IconPin } from "./Icons";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Données structurées « Event » (résultats enrichis Google). */
export function eventSchema(e: JackboyEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${e.title} — Jack Boy Bar-Resto 241`,
    description: e.description,
    startDate: `${e.date}T${e.time}:00+01:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.poster ? [`${SITE_URL}${e.poster}`] : undefined,
    location: {
      "@type": "Place",
      name: settings.name,
      address: { "@type": "PostalAddress", streetAddress: settings.address.street, addressLocality: settings.address.city, addressCountry: "GA" },
    },
    performer: e.dj ? { "@type": "Person", name: e.dj } : undefined,
    organizer: { "@type": "Organization", name: settings.name, url: SITE_URL },
    ...(e.video ? { subjectOf: { "@type": "VideoObject", name: `${e.title} — teaser`, contentUrl: `${SITE_URL}${e.video}`, thumbnailUrl: `${SITE_URL}${e.videoPoster ?? e.poster}`, uploadDate: "2026-10-22", description: e.description } } : {}),
  };
}

/** Grande carte « prochaine soirée » : affiche, infos, teaser vidéo. */
export function FeaturedEvent({ e, compact = false }: { e: JackboyEvent; compact?: boolean }) {
  const id = slug(e.title);
  return (
    <article id={id} aria-labelledby={`${id}-t`} className="spotlight reveal scroll-mt-24 overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#2a0306] via-surface to-surface shadow-[0_0_60px_rgba(220,20,40,.15)]">
      <LdJson data={eventSchema(e)} />
      <div className={`grid gap-6 p-4 sm:p-6 ${e.video && !compact ? "lg:grid-cols-[1fr_1.1fr_0.8fr]" : "md:grid-cols-[1fr_1.2fr]"}`}>
        {e.poster && (
          <a href={e.poster} target="_blank" rel="noopener" className="group relative block overflow-hidden rounded-2xl">
            <Image src={e.poster} alt={`Affiche ${e.title} au Jack Boy, ${formatEventDate(e.date)} à ${fmt(e.time)}`} width={e.posterWidth ?? 1116} height={e.posterHeight ?? 1410}
              sizes="(min-width:1024px) 30vw, (min-width:768px) 45vw, 100vw" className="h-auto w-full transition duration-700 group-hover:scale-[1.02]" />
          </a>
        )}
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Prochaine soirée
          </p>
          <h3 id={`${id}-t`} className="mt-4 font-display text-5xl leading-none text-white sm:text-6xl">{e.title}</h3>
          <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-red-300">
            <IconCalendar className="h-5 w-5 shrink-0" /> {cap(formatEventDate(e.date))} · dès {fmt(e.time)}{e.endNote ? ` ${e.endNote}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted"><IconPin className="h-4 w-4" /> {settings.name} · {fullAddress()}</p>
          <p className="mt-4 text-text/85">{e.description}</p>
          {e.genres && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Musique">
              {e.genres.map((g) => <li key={g} className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">{g}</li>)}
            </ul>
          )}
          {e.dj && <p className="mt-4 text-sm">Musique par <strong className="font-display text-xl tracking-wide text-white">{e.dj}</strong></p>}
          {e.perks && (
            <ul className="mt-3 space-y-1 text-sm text-text/85">
              {e.perks.map((p) => <li key={p}>🦇 {p}</li>)}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {(e.infoPhones ?? [settings.phones[0].number]).slice(0, 1).map((n) => (
              <a key={n} href={`tel:${n}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-red-500">
                <IconPhone className="h-4 w-4" /> Infos & réservation
              </a>
            ))}
            <Link href="/acces" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold uppercase tracking-wider hover:border-red-400 hover:text-red-300">
              Itinéraire <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          {e.infoPhones && (
            <p className="mt-3 text-xs text-muted">
              Infos : {e.infoPhones.map((n, i) => (
                <a key={n} href={`tel:${n}`} className="hover:text-red-300">{i ? " / " : ""}{settings.phones.find((p) => p.number === n)?.display ?? n}</a>
              ))}
            </p>
          )}
        </div>
        {e.video && !compact && (
          <figure className="mx-auto w-full max-w-[320px] self-center">
            <video
              src={e.video}
              poster={e.videoPoster}
              controls
              playsInline
              preload="none"
              className="aspect-[9/16] w-full rounded-2xl border border-white/10 bg-black object-cover"
              aria-label={`Teaser vidéo ${e.title}`}
            />
            <figcaption className="mt-2 text-center text-xs text-muted">▶ Le teaser — monte le son… si tu oses.</figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}
