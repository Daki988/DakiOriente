import Link from "@/components/ui/Link";
import { TONES } from "@/lib/content";
import { variantes, type Couverture } from "@/lib/couvertures";

export function NewsCard({ a, prioritaire = false }: { a: { slug: string; cat: string; tone: string; titre: string; date: string; resume: string; photo: Couverture }; prioritaire?: boolean }) {
  return (
    <Link href={`/actualites/${a.slug}/`} className="card group flex h-full flex-col overflow-hidden rounded-[22px] transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative h-48 overflow-hidden bg-[#e8edfa]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.photo.src} srcSet={variantes(a.photo.src)} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px" alt={a.photo.alt} loading={prioritaire ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between"><span className={`chip ${TONES[a.tone]}`}>{a.cat}</span><span className="text-xs text-ink-mute">{a.date}</span></div>
        <div className="text-[17px] font-extrabold leading-snug">{a.titre}</div>
        <p className="line-clamp-2 text-sm text-ink-soft">{a.resume}</p>
        <div className="mt-auto text-[13px] font-bold text-brand-600 transition group-hover:translate-x-1">Lire l&apos;article →</div>
      </div>
    </Link>
  );
}
