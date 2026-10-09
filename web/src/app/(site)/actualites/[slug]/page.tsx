import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lightbulb } from "lucide-react";
import { DynIcon } from "@/components/ui/DynIcon";
import { Markdown, headings, slugify } from "@/components/public/markdown";
import { articleBySlug } from "@/server/content-ui";
import { TONES } from "@/lib/content";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await articleBySlug(params.slug);
  return a ? { title: a.title, description: a.excerpt } : { title: "Article" };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await articleBySlug(params.slug);
  if (!a) notFound();
  const toc = headings(a.body);
  const minutes = Math.max(2, Math.round(a.body.split(/\s+/).length / 200));
  return (
    <div className="container grid items-start gap-10 pt-8 lg:grid-cols-[1fr_320px]">
      <article className="flex min-w-0 flex-col gap-6">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/actualites">Actualités</Link><ChevronRight size={14} /><span>{a.category}</span></nav>
        <span className={`chip self-start ${TONES[a.style.tone]}`}>{a.category}</span>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-[44px]">{a.title}</h1>
        <p className="text-sm text-ink-mute">Rédaction Navigoal · publié le {(a.publishedAt ?? a.createdAt).toLocaleDateString("fr-FR")} · {minutes} min de lecture</p>
        <div className={`flex h-56 items-center justify-center rounded-3xl bg-gradient-to-br sm:h-72 ${a.style.grad}`}><DynIcon name={a.style.icon} size={90} strokeWidth={1.3} className="text-white/70" /></div>
        <p className="text-lg font-semibold leading-relaxed text-ink">{a.excerpt}</p>
        <Markdown text={a.body} />
        <div className="flex items-start gap-3 rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-5"><Lightbulb className="shrink-0 text-[#a55a00]" /><span className="text-sm"><b className="block">À retenir</b>Comparez les écoles et faites un devis complet (scolarité, vie, visa, logement) avant de vous engager. <Link href="/devis" className="font-bold text-brand-600">Simuler mon devis →</Link></span></div>
      </article>
      <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
        {toc.length > 0 && <nav className="card flex flex-col gap-1 rounded-[22px] p-5" aria-label="Sommaire"><span className="mb-1 text-xs font-extrabold uppercase text-ink-mute">Sommaire</span>{toc.map((t, i) => <a key={t} href={`#${slugify(t)}`} className="rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50">{i + 1}. {t}</a>)}</nav>}
        <div className="card flex flex-col gap-3 rounded-[22px] p-5"><b>Va plus loin</b><Link href="/orientation" className="btn-primary py-2.5">Passer le test d&apos;orientation</Link><Link href="/comparateur" className="btn-ghost py-2.5">Comparer des écoles</Link></div>
      </aside>
    </div>
  );
}
