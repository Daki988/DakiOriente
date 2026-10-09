import Link from "next/link";
import { DynIcon } from "./DynIcon";
import { TONES } from "@/lib/content";

export function NewsCard({ a }: { a: { slug: string; cat: string; tone: string; titre: string; date: string; grad: string; icon: string; resume: string } }) {
  return (
    <Link href={`/actualites/${a.slug}/`} className="card group flex h-full flex-col overflow-hidden rounded-[22px] transition hover:-translate-y-1 hover:shadow-lift">
      <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${a.grad}`}>
        <DynIcon name={a.icon} size={64} strokeWidth={1.5} className="text-white/70 transition duration-500 group-hover:scale-125 group-hover:rotate-6" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between"><span className={`chip ${TONES[a.tone]}`}>{a.cat}</span><span className="text-xs text-ink-mute">{a.date}</span></div>
        <div className="text-[17px] font-extrabold leading-snug">{a.titre}</div>
        <div className="mt-auto text-[13px] font-bold text-brand-600 transition group-hover:translate-x-1">Lire l&apos;article →</div>
      </div>
    </Link>
  );
}
