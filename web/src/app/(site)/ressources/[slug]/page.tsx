import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Check, ChevronRight, Clock, Download } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { CalculateurBac, Checklist, Convertisseur } from "@/components/sections/Outils";
import { VenirAuMaroc } from "@/components/sections/VenirAuMaroc";
import { Illustration } from "@/components/ui/Illustration";
import { photo } from "@/lib/photos";
import { GUIDES, OUTILS, PAGES_OUTILS, guideBySlug } from "@/lib/ressources";
import { SITE_URL } from "@/lib/site";
import { descriptionSeo, titreEditorial } from "@/lib/seo";

export const generateStaticParams = () => [...GUIDES.map((g) => ({ slug: g.slug })), ...PAGES_OUTILS.map((slug) => ({ slug }))];
export const dynamicParams = false;
const outil = (slug: string) => OUTILS.find((o) => o.slug === slug);

export const generateMetadata = ({ params }: { params: { slug: string } }): Metadata => {
  const r = guideBySlug[params.slug] ?? outil(params.slug);
  if (!r) return {};
  return { title: titreEditorial(r.titre), description: descriptionSeo(r.resume), alternates: { canonical: `/ressources/${r.slug}/` }, openGraph: { title: r.titre, description: r.resume, type: "article", images: [{ url: "/og.png", width: 1200, height: 630 }] } };
};

export default function RessourcePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug[params.slug];
  const o = g ? undefined : outil(params.slug);
  if (!g && !o) notFound();
  const r = (g ?? o)!;
  const ld = g
    ? { "@context": "https://schema.org", "@type": "Article", headline: g.titre, description: g.resume, inLanguage: "fr", url: `${SITE_URL}/ressources/${g.slug}/`, publisher: { "@type": "Organization", name: "Navigoal", logo: `${SITE_URL}/brand/navigoal-logo.png` } }
    : { "@context": "https://schema.org", "@type": "WebApplication", name: r.titre, description: r.resume, applicationCategory: "EducationalApplication", offers: { "@type": "Offer", price: 0, priceCurrency: "MAD" }, url: `${SITE_URL}/ressources/${r.slug}/` };
  const autres = GUIDES.filter((x) => x.slug !== r.slug).slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="bg-gradient-to-b from-brand-50 to-transparent pb-6 pt-8 print:hidden">
        <div className="container flex flex-col gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/ressources">Ressources</Link><ChevronRight size={14} /><span>{r.titre}</span></nav>
          <span className="eyebrow">{g ? (g.type === "orientation" ? "Orientation" : "Guide pratique") : "Outil pratique"}</span>
          <h1 className="h-section max-w-3xl">{r.titre}</h1>
          <p className="max-w-2xl text-lg text-ink-soft">{r.resume}</p>
          {g?.lecture && <span className="flex items-center gap-1.5 text-sm text-ink-mute"><Clock size={15} />{g.lecture} min de lecture</span>}
        </div>
      </section>

      <div className="container mt-4 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          {g && (
            <>
              {g.photo && <Illustration p={photo(g.photo)} className="h-48 sm:h-64" rounded="rounded-[22px]" />}
              {g.sections!.map((s, k) => (
                <Reveal key={s.titre} delay={Math.min(k, 3) * 0.04}>
                  <section className="card flex flex-col gap-3 p-5 sm:p-7">
                    <h2 className="text-xl font-extrabold">{s.titre}</h2>
                    {s.texte?.map((t) => <p key={t} className="leading-relaxed text-ink-soft">{t}</p>)}
                    {s.liste && <ul className="flex flex-col gap-2">{s.liste.map((t) => <li key={t} className="flex items-start gap-2.5 text-ink-soft"><Check size={17} className="mt-0.5 shrink-0 text-[#0f8a46]" /><span className="leading-relaxed">{t}</span></li>)}</ul>}
                  </section>
                </Reveal>
              ))}
              {g.slug === "visa-carte-de-sejour" && <VenirAuMaroc />}
              {g.sources?.length ? <div className="text-xs text-ink-mute"><b>Sources :</b> <ul className="mt-1 flex flex-col gap-0.5">{g.sources.map((s) => <li key={s} className="break-all">{s.startsWith("http") ? <a href={s} target="_blank" rel="noopener noreferrer" className="underline">{s}</a> : s}</li>)}</ul></div> : null}
              <p className="text-xs text-ink-mute">Guide rédigé par Navigoal à partir de ses référentiels (octobre 2026). Les règles administratives évoluent : vérifie-les auprès des autorités et de ton établissement.</p>
            </>
          )}
          {r.slug === "checklist-candidature" && <Checklist />}
          {r.slug === "calculateur-moyenne-bac" && <CalculateurBac />}
          {r.slug === "convertisseur-devises" && <Convertisseur />}
        </div>
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 print:hidden">
          <div className="card flex flex-col gap-2 p-5">
            <b>Modèles à télécharger</b>
            {OUTILS.filter((x) => x.format === "docx").map((x) => <a key={x.slug} href={x.href} download className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-2 text-sm font-semibold hover:bg-[#f6f8fe]"><Download size={16} className="text-brand-600" />{x.titre}</a>)}
          </div>
          <div className="card flex flex-col gap-2 p-5">
            <b className="flex items-center gap-2"><BookOpen size={17} className="text-brand-600" />À lire aussi</b>
            {autres.map((x) => <Link key={x.slug} href={x.href} className="flex min-h-[40px] items-center text-sm font-semibold text-ink-soft hover:text-brand-600">{x.titre}</Link>)}
            <Link href="/ressources" className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-brand-600">Toutes les ressources <ArrowRight size={14} /></Link>
          </div>
        </aside>
      </div>
    </>
  );
}
