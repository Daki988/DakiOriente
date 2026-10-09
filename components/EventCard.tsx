import { formatEventDate, type JackboyEvent } from "@/lib/content";
import { fmt } from "@/lib/hours";
import { Media } from "./Media";

export function EventCard({ e }: { e: JackboyEvent }) {
  const d = new Date(`${e.date}T00:00:00Z`);
  return (
    <article className="reveal flex overflow-hidden rounded-3xl border border-white/5 bg-surface">
      <div className="relative w-28 shrink-0 sm:w-40">
        <Media src={e.poster} alt={`Affiche — ${e.title}`} mood="late" className="absolute inset-0" sizes="160px" />
        <div className="absolute left-3 top-3 rounded-xl bg-black/70 px-2.5 py-1.5 text-center backdrop-blur">
          <span className="block font-display text-2xl leading-none text-accent">{d.getUTCDate()}</span>
          <span className="block text-[10px] uppercase tracking-widest">
            {new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(d)}
          </span>
        </div>
      </div>
      <div className="min-w-0 p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{formatEventDate(e.date)} · {fmt(e.time)}</p>
        <h3 className="mt-1 font-display text-2xl">{e.title}</h3>
        {e.dj && <p className="mt-1 text-sm text-accent">{e.dj}</p>}
        <p className="mt-2 text-sm text-muted">{e.description}</p>
      </div>
    </article>
  );
}
