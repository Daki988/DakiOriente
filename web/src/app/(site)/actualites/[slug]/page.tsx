import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronRight, Clock, HandCoins, Lightbulb, Newspaper, PenLine } from "lucide-react";
import { DynIcon } from "@/components/ui/DynIcon";
import { Markdown, headings, slugify } from "@/components/public/markdown";
import { articleBySlug, articleCards } from "@/server/content-ui";
import { variantes } from "@/lib/couvertures";
import { SITE_URL } from "@/lib/site";
import { TONES } from "@/lib/content";
import { descriptionSeo, filAriane, titreEditorial } from "@/lib/seo";

export const revalidate = 300;
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const a = await articleBySlug(params.slug);
  return a ? { title: titreEditorial(a.title), description: descriptionSeo(`${a.excerpt.replace(/\.?\s*$/, ".")} Conseils Navigoal pour étudier au Maroc.`, a.excerpt), alternates: { canonical: `/actualites/${a.slug}/` }, openGraph: { title: a.title, description: descriptionSeo(a.excerpt), type: "article", images: [{ url: a.photo.src }] } } : { title: "Article" };
}

/** Découpe le corps Markdown en sections (une carte par titre « ## »), comme les guides. */
function sections(md: string) {
  const out: { titre: string | null; texte: string }[] = [];
  for (const bloc of md.replace(/\r/g, "").split(/\n(?=##\s)/)) {
    const m = /^##\s+(.+)\n?([\s\S]*)$/.exec(bloc.trim());
    if (m) out.push({ titre: m[1].trim(), texte: m[2].trim() });
    else if (bloc.trim()) out.push({ titre: null, texte: bloc.trim() });
  }
  return out;
}

export default async function ArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const a = await articleBySlug(params.slug);
  if (!a) notFound();
  const toc = headings(a.body);
  const minutes = Math.max(2, Math.round(a.body.split(/\s+/).length / 200));
  const autres = (await articleCards()).filter((x) => x.slug !== a.slug).slice(0, 3);
  const date = (a.publishedAt ?? a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.excerpt, image: `${SITE_URL}${a.photo.src}`, datePublished: (a.publishedAt ?? a.createdAt).toISOString(), author: { "@type": "Organization", name: "Navigoal" }, publisher: { "@type": "Organization", name: "Navigoal" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane(SITE_URL, [["Actualités", "/actualites/"], [a.title, `/actualites/${a.slug}/`]])).replace(/</g, "\\u003c") }} />
      <section className="bg-gradient-to-br from-brand-50 via-[#f6f8fe] to-sun-100/60 pb-8 pt-8">
        <div className="container flex flex-col gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/actualites/">Actualités</Link><ChevronRight size={14} /><span>{a.category}</span></nav>
          <span className={`chip self-start ${TONES[a.style.tone]}`}><DynIcon name={a.style.icon} size={13} />{a.category}</span>
          <h1 className="h-section max-w-4xl">{a.title}</h1>
          <p className="max-w-3xl text-lg text-ink-soft">{a.excerpt}</p>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-mute"><span className="flex items-center gap-1.5"><PenLine size={14} />Rédaction Navigoal</span><span className="flex items-center gap-1.5"><CalendarDays size={14} />{date}</span><span className="flex items-center gap-1.5"><Clock size={14} />{minutes} min de lecture</span></span>
        </div>
      </section>
      <div className="container mt-6 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <article className="flex min-w-0 flex-col gap-6">
          <figure className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.photo.src} srcSet={variantes(a.photo.src)} sizes="(max-width: 1024px) 100vw, 860px" alt={a.photo.alt} fetchPriority="high" className="h-56 w-full rounded-[22px] bg-[#e8edfa] object-cover sm:h-80 lg:h-[400px]" />
            {a.photo.credit && <figcaption className="text-xs text-ink-mute">Photo : {a.photo.page ? <a href={a.photo.page} target="_blank" rel="noopener noreferrer" className="underline">{a.photo.credit}</a> : a.photo.credit}{a.photo.licence ? ` · ${a.photo.licence}` : ""}</figcaption>}
          </figure>
          {sections(a.body).map((s, k) => (
            <section key={k} className="card flex flex-col gap-3 p-5 sm:p-7">
              {s.titre && <h2 id={slugify(s.titre)} className="scroll-mt-32 text-2xl font-extrabold tracking-tight">{s.titre}</h2>}
              {s.texte && <Markdown text={s.texte} />}
            </section>
          ))}
          <div className="flex flex-col gap-4 rounded-[22px] bg-gradient-to-br from-[#0b1a4f] to-brand-600 p-5 text-white sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun-400 text-ink"><HandCoins size={28} /></span>
            <span className="flex-1"><b className="text-lg">Les bourses pour toi</b><span className="mt-1 block text-sm text-[#c9d3f5]">Bourses publiques et bourses des écoles, avec leurs conditions et leurs démarches.</span></span>
            <Link href="/bourses/" className="btn-sun min-h-[44px] self-start px-5 sm:self-center">Voir les bourses</Link>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-5"><Lightbulb className="shrink-0 text-[#a55a00]" /><span className="text-sm"><b className="block">À retenir</b>Comparez les écoles et faites un devis complet (scolarité, vie, visa, logement) avant de vous engager. <Link href="/devis" className="font-bold text-brand-600">Simuler mon devis →</Link></span></div>
        </article>
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:[html[data-entete=cache]_&]:top-4 transition-[top] duration-300">
          {toc.length > 0 && <nav className="card flex flex-col gap-1 rounded-[22px] p-5" aria-label="Sommaire"><span className="mb-1 text-xs font-extrabold uppercase text-ink-mute">Sommaire</span>{toc.map((t, i) => <a key={t} href={`#${slugify(t)}`} className="rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50">{i + 1}. {t}</a>)}</nav>}
          <div className="card flex flex-col gap-3 rounded-[22px] p-5"><b>Va plus loin</b><Link href="/orientation" className="btn-primary py-2.5">Passer le test d&apos;orientation</Link><Link href="/comparateur" className="btn-ghost py-2.5">Comparer des écoles</Link></div>
          {!!autres.length && (
            <div className="card flex flex-col gap-3 rounded-[22px] p-5">
              <b className="flex items-center gap-2"><Newspaper size={17} className="text-brand-600" />À lire aussi</b>
              {autres.map((x) => (
                <Link key={x.slug} href={`/actualites/${x.slug}/`} className="group flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.photo.src} srcSet={variantes(x.photo.src)} sizes="72px" alt="" loading="lazy" className="h-12 w-[72px] shrink-0 rounded-xl bg-[#e8edfa] object-cover" />
                  <span className="text-sm font-bold leading-snug group-hover:text-brand-600">{x.titre}</span>
                </Link>
              ))}
              <Link href="/actualites/" className="flex items-center gap-1.5 text-[13px] font-bold text-brand-600">Toutes les actualités <ArrowRight size={14} /></Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
