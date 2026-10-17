import Link from "next/link";
import { ArrowRight, Chat } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { QuickQuote } from "@/components/QuickQuote";
import { getProducts } from "@/lib/catalog";
import { settings, waNeam } from "@/lib/site";

export const revalidate = 300;

const MARQUEE = ["CARTES DE VISITE", "FLYERS", "ROLL-UP", "BÂCHES", "STICKERS", "TEXTILE DTF", "ÉTIQUETTES", "INVITATIONS"];

const STEPS = [
  ["Choisissez", "Produit, format, quantité : le prix s’affiche tout de suite.", "bg-yellow"],
  ["Envoyez votre fichier", "Votre PDF ou image, ou bien un graphiste crée le design pour vous.", "bg-magenta"],
  ["Recevez", "On vérifie le fichier, on imprime, on vous prévient sur WhatsApp. Retrait ou livraison.", "bg-cyan"],
] as const;

const PROMISES = [
  ["Fichier vérifié avant impression", "Résolution, fond perdu, marges : on vous alerte avant d’imprimer."],
  ["Prix affiché d’avance", "Le total est calculé avant la commande, sans surprise."],
  ["Paiement Mobile Money", `${settings.payments.join(", ")}.`],
  ["Suivi en direct", "Un lien de suivi et un message WhatsApp à chaque étape."],
] as const;

export default async function Home() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const quick = products.filter((p) => p.pricing === "pack" && p.featured).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 md:grid-cols-2 md:px-6 md:py-20">
          <div className="relative z-10 grid gap-5">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3 py-1.5 text-[13px] font-medium text-white/90">
              <span className="size-2 rounded-full bg-yellow" /> Imprimerie en ligne · Libreville
            </p>
            <h1 className="text-[52px] font-extrabold leading-[.94] md:text-[76px]">
              Vos idées,<br />imprimées<br /><span className="text-yellow">sans détour.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/72">
              Cartes de visite, flyers, roll-up, bâches, stickers… Prix immédiat, fichier vérifié, et un message WhatsApp quand c’est prêt.
            </p>
            <div className="grid gap-2.5 sm:flex">
              <Link href="/produits" className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white">
                Voir les produits et les prix <ArrowRight />
              </Link>
              <a href={waNeam()} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/35 px-6 py-4 font-bold">
                <Chat /> Devis sur WhatsApp
              </a>
            </div>
            <ul className="flex flex-wrap gap-2 text-xs font-medium text-white/85">
              {["Airtel & Moov Money", "Retrait ou livraison à Libreville", "Fichier vérifié"].map((t) => (
                <li key={t} className="rounded-full border border-white/18 px-2.5 py-1.5">{t}</li>
              ))}
            </ul>
          </div>

          {/* Composition encres CMJ + imprimés */}
          <div className="relative mx-auto h-[260px] w-full max-w-[420px] md:h-[380px]" aria-hidden="true">
            <span className="ink left-[6%] top-[8%] w-[46%] aspect-square bg-cyan" />
            <span className="ink left-[34%] top-[2%] w-[46%] aspect-square bg-magenta" />
            <span className="ink left-[20%] top-[34%] w-[46%] aspect-square bg-yellow" />
            <div className="absolute right-[2%] top-[22%] w-[34%] rotate-[8deg] overflow-hidden rounded-md bg-white shadow-[0_18px_30px_rgba(0,0,0,.4)]">
              <div className="aspect-[3/2] bg-blue" />
              <p className="px-2.5 pb-1 pt-2 font-display text-[clamp(13px,3.6vw,20px)] font-extrabold leading-[.95] text-ink">GRANDE<br />OUVERTURE</p>
              <div className="mx-2.5 mb-3 h-1.5 w-1/2 rounded bg-magenta" />
            </div>
            <div className="absolute bottom-[4%] left-[2%] w-[48%] -rotate-[7deg] rounded-lg border border-white/15 bg-ink p-[4%] shadow-[0_16px_28px_rgba(0,0,0,.45)]" style={{ aspectRatio: "85/55" }}>
              <p className="font-display text-[clamp(12px,3.4vw,17px)] font-bold">Aïcha N.</p>
              <p className="text-[clamp(8px,2.2vw,10px)] text-white/60">Directrice · Libreville</p>
              <span className="absolute bottom-[12%] right-[8%] w-[22%] aspect-square rounded-full bg-yellow" />
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau défilant */}
      <div className="overflow-hidden bg-yellow py-3.5" aria-hidden="true">
        <div className="marquee flex w-max gap-5 font-display text-lg font-extrabold tracking-tight">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="flex items-center gap-5">{t}<span>✺</span></span>
          ))}
        </div>
      </div>

      {/* Produits */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-2">
          <p className="text-xs font-bold tracking-[.08em] text-brand">NOTRE CATALOGUE</p>
          <h2 className="text-[34px] font-extrabold leading-none md:text-5xl">Ce qu’on imprime pour vous</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {featured.map((p, i) => <ProductCard key={p.slug} product={p} badge={i < 2 ? "Top vente" : undefined} />)}
        </div>
        <Link href="/produits" className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-bold text-white md:w-fit">
          Voir les {products.length} produits <ArrowRight />
        </Link>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-2">
            <p className="text-xs font-bold tracking-[.08em] text-yellow">SIMPLE COMME BONJOUR</p>
            <h2 className="text-[34px] font-extrabold leading-none md:text-5xl">Commandez en 3 étapes</h2>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map(([t, d, c], i) => (
              <li key={t} className="flex gap-4 rounded-[20px] border border-white/10 bg-white/[.06] p-4 md:flex-col">
                <span className={`grid size-12 flex-none place-items-center rounded-[14px] font-display text-[22px] font-extrabold text-ink ${c}`}>{i + 1}</span>
                <div className="grid gap-1">
                  <h3 className="text-[19px] font-bold">{t}</h3>
                  <p className="text-sm leading-relaxed text-white/65">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Devis express */}
      {quick.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2 md:items-center md:px-6 md:py-16">
          <div className="grid gap-2">
            <p className="text-xs font-bold tracking-[.08em] text-brand">PRIX EN DIRECT</p>
            <h2 className="text-[34px] font-extrabold leading-none md:text-5xl">Votre prix en 10 secondes</h2>
            <p className="max-w-md text-muted">Choisissez un produit et une quantité. Les options (papier, finition) se règlent sur la page du produit.</p>
          </div>
          <QuickQuote products={quick} />
        </section>
      )}

      {/* Engagements */}
      <section className="bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-6">
          {PROMISES.map(([t, d]) => (
            <div key={t} className="grid content-start gap-1.5">
              <h3 className="text-xl font-extrabold leading-tight">{t}</h3>
              <p className="text-sm text-white/80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Appel final */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 md:px-6">
          <h2 className="text-[44px] font-extrabold leading-[.95] md:text-6xl">Un projet ?<br /><span className="text-yellow">On l’imprime.</span></h2>
          <p className="max-w-md text-white/70">{settings.hours}. Réponse rapide sur WhatsApp.</p>
          <div className="grid gap-2.5 sm:flex">
            <a href={waNeam()} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold">
              <Chat /> Écrire sur WhatsApp
            </a>
            <p className="flex items-center justify-center rounded-full border-[1.5px] border-white/35 px-6 py-4 font-bold select-all">{settings.phoneDisplay}</p>
          </div>
        </div>
      </section>
    </>
  );
}
