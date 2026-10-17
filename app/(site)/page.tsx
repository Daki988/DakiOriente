import Link from "next/link";
import { ArrowRight, Chat } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { QuickQuote } from "@/components/QuickQuote";
import { getProducts } from "@/lib/catalog";
import { settings, waNeam } from "@/lib/site";

export const revalidate = 300;

const STEPS = [
  ["Vous choisissez", "Produit, format, quantité : le prix s’affiche tout de suite, avant de commander."],
  ["Vous envoyez votre fichier", "Un PDF ou une image suffit. Pas encore de design ? Un graphiste le crée pour vous."],
  ["Nous imprimons", "Nous vérifions votre fichier, nous imprimons, puis nous vous prévenons sur WhatsApp. Retrait ou livraison."],
] as const;

const FAQ = [
  ["Combien de temps faut-il pour imprimer ?", "En général 48 à 72 heures après validation du fichier pour les cartes, flyers et stickers. Pour les grands formats, comptez 3 à 4 jours. Le délai exact vous est confirmé sur WhatsApp."],
  ["Je n’ai pas de fichier prêt. Que faire ?", "C’est normal. Choisissez « Un graphiste le crée » au moment de commander : nous préparons le design avec vous, puis nous vous l’envoyons pour validation avant d’imprimer."],
  ["Comment je paie ?", `Par ${settings.payments.join(", ").replace(/, ([^,]*)$/, " ou $1")}. Rien à payer en commandant : nous vérifions d’abord votre commande, puis nous vous envoyons le montant exact.`],
  ["Livrez-vous ?", "Oui, partout à Libreville. Vous pouvez aussi passer récupérer votre commande à l’atelier, gratuitement."],
  ["Mon fichier est-il vérifié avant impression ?", "Toujours. Résolution, marges, fond perdu : si quelque chose cloche, nous vous prévenons avant d’imprimer, jamais après."],
] as const;

/** Titre de section façon Neam : numéro discret, question, mot clé en italique. */
function SectionHead({ n, label, title, accent, after = "", intro }: { n: string; label: string; title: string; accent: string; after?: string; intro?: string }) {
  return (
    <div className="grid max-w-2xl content-start gap-3">
      <p className="text-sm text-muted"><span className="tabular">({n})</span> {label}</p>
      <h2 className="text-[32px] font-bold leading-[1.05] md:text-5xl">{title} <em className="accent">{accent}</em>{after}</h2>
      {intro && <p className="text-muted md:text-lg">{intro}</p>}
    </div>
  );
}

export default async function Home() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const quick = products.filter((p) => p.pricing === "pack" && p.featured).slice(0, 3);

  return (
    <>
      {/* Accroche */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 md:grid-cols-[1.2fr_1fr] md:px-6 md:pb-24 md:pt-20">
        <div className="grid gap-6">
          <p className="text-sm text-muted">Libreville, Gabon</p>
          <h1 className="text-[44px] font-bold leading-[1.02] md:text-[68px]">
            Et si imprimer devenait <em className="accent">simple</em> ?
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted">
            Cartes de visite, flyers, bâches, stickers… Vous choisissez, vous voyez le prix tout de suite, nous imprimons. Et nous vous prévenons sur WhatsApp quand c’est prêt.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/produits" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white hover:bg-brand">
              Voir les produits et les prix <ArrowRight className="size-4" />
            </Link>
            <a href={waNeam()} target="_blank" rel="noopener" className="font-semibold underline decoration-line decoration-2 underline-offset-4 hover:decoration-brand">
              Parler de mon projet
            </a>
          </div>
        </div>

        {/* Encres CMJ : la seule touche de couleur forte de la page */}
        <div className="relative mx-auto aspect-square w-full max-w-[220px] md:max-w-[340px]" aria-hidden="true">
          <span className="ink-light left-[4%] top-[6%] bg-cyan" />
          <span className="ink-light right-[4%] top-[6%] bg-magenta" />
          <span className="ink-light bottom-[4%] left-[24%] bg-yellow" />
          <div className="absolute bottom-[14%] left-[50%] w-[58%] -translate-x-1/2 -rotate-6 rounded-md bg-white p-[5%] shadow-[0_18px_40px_-12px_rgba(13,14,18,.35)]" style={{ aspectRatio: "85/55" }}>
            <p className="font-display text-[clamp(13px,3.6vw,18px)] font-bold">Aïcha N.</p>
            <p className="text-[clamp(9px,2.3vw,11px)] text-muted">Directrice · Libreville</p>
            <span className="absolute bottom-[14%] right-[8%] h-1.5 w-1/3 rounded bg-brand" />
          </div>
        </div>
      </section>

      {/* (01) Produits */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:px-6 md:py-20">
          <SectionHead n="01" label="Nos produits" title="Qu’est-ce que vous voulez" accent="imprimer" after=" ?"
            intro="Les plus demandés. Le prix affiché est le prix de départ ; le total exact se calcule sur chaque produit." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
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
          <ol className="grid">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3rem_1fr] gap-x-2 border-t border-line py-6 first:border-t-0 first:pt-0 md:first:pt-2">
                <span className="tabular text-sm text-muted">0{i + 1}</span>
                <div className="grid gap-1.5">
                  <h3 className="text-xl font-bold">{t}</h3>
                  <p className="text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* (03) Prix */}
      {quick.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1fr_1.1fr] md:px-6 md:py-20">
            <SectionHead n="03" label="Les prix" title="Combien ça" accent="coûte" after=" ?"
              intro="Choisissez un produit et une quantité, le prix s’affiche. Papier et finitions se règlent ensuite sur la page du produit." />
            <QuickQuote products={quick} />
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
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-t border-line py-5 last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {q}<span className="text-2xl font-light text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 max-w-xl text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-14 md:px-6 md:py-20">
          <h2 className="text-[34px] font-bold leading-[1.05] md:text-5xl">Un projet, une question ?<br /><em className="accent">Parlons-en.</em></h2>
          <div className="grid gap-2">
            <a href={waNeam()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white">
              <Chat className="size-5" /> Écrire sur WhatsApp
            </a>
            <p className="text-sm text-muted">{settings.phoneDisplay} · {settings.hours}</p>
          </div>
        </div>
      </section>
    </>
  );
}
