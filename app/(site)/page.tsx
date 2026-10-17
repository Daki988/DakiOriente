import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, Chat } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { QuickQuote } from "@/components/QuickQuote";
import { getProducts } from "@/lib/catalog";
import { fcfa } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";
import { HeroShowcase } from "@/components/motion/HeroShowcase";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";
import { settings, waNeam } from "@/lib/site";

export const revalidate = 300;

const STEPS = [
  ["Vous choisissez", "Produit, format, quantité : le prix s’affiche tout de suite, avant de commander."],
  ["Vous créez ou envoyez votre design", "Partez d’un modèle et personnalisez-le en ligne, gratuitement. Ou envoyez votre fichier, ou confiez-le à un graphiste."],
  ["Nous imprimons", "Nous vérifions votre fichier, nous imprimons, puis nous vous prévenons sur WhatsApp. Retrait ou livraison."],
] as const;

const FAQ = [
  ["Combien de temps faut-il pour imprimer ?", "En général 48 à 72 heures après validation du fichier pour les cartes, flyers et stickers. Pour les grands formats, comptez 3 à 4 jours. Le délai exact vous est confirmé sur WhatsApp."],
  ["Je n’ai pas de fichier prêt. Que faire ?", "Créez-le en ligne : choisissez un modèle, mettez vos textes, votre logo et vos couleurs, et voyez le résultat en situation. C’est gratuit. Vous préférez être accompagné ? Choisissez « Un graphiste le crée »."],
  ["Comment je paie ?", `Par ${settings.payments.join(", ").replace(/, ([^,]*)$/, " ou $1")}. Rien à payer en commandant : nous vérifions d’abord votre commande, puis nous vous envoyons le montant exact.`],
  ["Livrez-vous ?", "Oui, partout à Libreville. Vous pouvez aussi passer récupérer votre commande à l’atelier, gratuitement."],
  ["Mon fichier est-il vérifié avant impression ?", "Toujours. Résolution, marges, fond perdu : si quelque chose cloche, nous vous prévenons avant d’imprimer, jamais après."],
] as const;

/** Titre de section façon Neam : numéro discret, question, mot clé en italique. */
function SectionHead({ n, label, title, accent, after = "", intro }: { n: string; label: string; title: string; accent: string; after?: string; intro?: string }) {
  return (
    <Reveal className="grid max-w-2xl content-start gap-3">
      <p className="text-sm text-muted"><span className="tabular">({n})</span> {label}</p>
      <h2 className="text-[32px] font-bold leading-[1.05] md:text-5xl">{title} <em className="accent">{accent}</em>{after}</h2>
      {intro && <p className="text-muted md:text-lg">{intro}</p>}
    </Reveal>
  );
}

export default async function Home() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const quick = products.filter((p) => p.pricing === "pack" && p.featured).slice(0, 3);
  // Vitrine animée : des supports variés pour montrer l'étendue de ce qu'on imprime.
  const showcase = ["carte-de-visite-standard", "roll-up-85x200", "impression-dtf", "etiquettes-adhesives", "flyer-a5", "bache-440-g-brillante-ou-mate"]
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is (typeof products)[number] => Boolean(p))
    .map((p) => {
      const f = fromPrice(p);
      return { slug: p.slug, name: p.name, categorySlug: p.categorySlug, formatMm: p.formatMm, from: `${fcfa(f.price)}${p.unit === "m²" ? " / m²" : ""}` };
    });

  return (
    <>
      {/* Accroche */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 overflow-x-clip px-4 pb-14 pt-10 md:grid-cols-[1.2fr_1fr] md:overflow-visible md:px-6 md:pb-24 md:pt-20">
        <div className="grid gap-6">
          <p className="fade-in text-sm text-muted">Libreville, Gabon</p>
          <h1 className="text-[44px] font-bold leading-[1.02] md:text-[68px]">
            {["Et", "si", "imprimer", "devenait"].map((w, k) => (
              <Fragment key={w}><span className="word"><span style={{ "--d": `${120 + k * 90}ms` } as React.CSSProperties}>{w}</span></span>{" "}</Fragment>
            ))}
            <span className="word"><span style={{ "--d": "520ms" } as React.CSSProperties}>
              <em className="accent relative">simple
                <svg viewBox="0 0 200 20" className="scribble absolute -bottom-[0.12em] left-0 h-[0.28em] w-full" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 14 C 50 4, 120 4, 197 10" fill="none" stroke="var(--yellow)" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </em> ?
            </span></span>
          </h1>
          <p className="fade-in max-w-lg text-lg leading-relaxed text-muted" style={{ "--d": "700ms" } as React.CSSProperties}>
            Cartes de visite, flyers, bâches, stickers… Vous choisissez, vous voyez le prix tout de suite, nous imprimons. Et nous vous prévenons sur WhatsApp quand c’est prêt.
          </p>
          <div className="fade-in flex flex-wrap items-center gap-x-6 gap-y-3" style={{ "--d": "850ms" } as React.CSSProperties}>
            <Link href="/produits" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white hover:bg-brand">
              Voir les produits et les prix <ArrowRight className="size-4" />
            </Link>
            <a href={waNeam()} target="_blank" rel="noopener" className="font-semibold underline decoration-line decoration-2 underline-offset-4 hover:decoration-brand">
              Parler de mon projet
            </a>
          </div>
        </div>

        {/* Vitrine animée sur fond d'encres CMJ */}
        <div className="fade-in" style={{ "--d": "300ms" } as React.CSSProperties}>
          <HeroShowcase items={showcase} />
        </div>
      </section>

      {/* (01) Produits */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:px-6 md:py-20">
          <SectionHead n="01" label="Nos produits" title="Qu’est-ce que vous voulez" accent="imprimer" after=" ?"
            intro="Les plus demandés. Le prix affiché est le prix de départ ; le total exact se calcule sur chaque produit." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {featured.map((p, k) => (
              <Reveal key={p.slug} delay={(k % 3) * 110}><Tilt className="rounded-2xl"><ProductCard product={p} /></Tilt></Reveal>
            ))}
          </div>
          <Link href="/produits" className="inline-flex w-fit items-center gap-2 font-semibold hover:text-brand">
            Voir les {products.length} produits <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* (02) Méthode */}
      <section id="comment" className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.2fr] md:px-6 md:py-20">
          <SectionHead n="02" label="Comment ça marche" title="Comment ça se" accent="passe" after=" ?"
            intro="Pas de surprise ni de jargon : trois étapes, et vous savez toujours où en est votre commande." />
          <Reveal className="relative">
            <span aria-hidden="true" className="draw-line absolute bottom-6 left-[0.6rem] top-2 w-0.5 rounded bg-gradient-to-b from-cyan via-magenta to-yellow" />
            <ol className="grid">
              {STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} delay={250 + i * 180} className="grid grid-cols-[3rem_1fr] gap-x-2 py-6 first:pt-0 md:first:pt-2">
                  <span className="tabular relative z-10 grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-ink ring-2 ring-line">{i + 1}</span>
                  <div className="grid gap-1.5">
                    <h3 className="text-xl font-bold">{t}</h3>
                    <p className="text-muted">{d}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* (03) Prix */}
      {quick.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1fr_1.1fr] md:px-6 md:py-20">
            <SectionHead n="03" label="Les prix" title="Combien ça" accent="coûte" after=" ?"
              intro="Choisissez un produit et une quantité, le prix s’affiche. Papier et finitions se règlent ensuite sur la page du produit." />
            <Reveal delay={150}><QuickQuote products={quick} /></Reveal>
          </div>
        </section>
      )}

      {/* (04) Questions */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.2fr] md:px-6 md:py-20">
          <div className="grid content-start gap-3">
            <SectionHead n="04" label="Questions fréquentes" title="Les questions qu’on nous pose" accent="souvent" after="." />
            <p className="text-muted">Pas trouvé votre réponse ? <a href={waNeam()} target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-4">Écrivez-nous</a>.</p>
          </div>
          <div className="grid">
            {FAQ.map(([q, a], k) => (
              <Reveal key={q} delay={k * 80}><details className="group border-t border-line py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {q}<span className="text-2xl font-light text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-xl text-muted">{a}</p>
              </details></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-14 md:px-6 md:py-20">
          <Reveal><h2 className="text-[34px] font-bold leading-[1.05] md:text-5xl">Un projet, une question ?<br /><em className="accent">Parlons-en.</em></h2></Reveal>
          <Reveal delay={150} className="grid gap-2">
            <a href={waNeam()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white">
              <Chat className="size-5" /> Écrire sur WhatsApp
            </a>
            <p className="text-sm text-muted">{settings.phoneDisplay} · {settings.hours}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
