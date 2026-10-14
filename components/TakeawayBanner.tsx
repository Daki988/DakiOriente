import Image from "next/image";
import Link from "next/link";
import { whatsappLink, primaryPhone } from "@/lib/content";
import { IconArrow, IconPhone } from "./Icons";

/** Bannière « À emporter & livraison » illustrée par les boîtes Jackboy. */
export function TakeawayBanner() {
  return (
    <section aria-labelledby="emporter" className="spotlight reveal relative isolate overflow-hidden rounded-3xl border border-white/10">
      <Image src="/images/menu/boites-a-emporter-jackboy-libreville.webp" alt="Brochettes, paninis, nems et wings dans les boîtes à emporter Jackboy" fill sizes="(min-width:1152px) 1152px, 100vw" className="-z-10 object-cover object-[center_80%]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-bg/10" />
      <div className="max-w-lg p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">À emporter & livraison</p>
        <h2 id="emporter" className="mt-2 font-display text-4xl sm:text-5xl">Jackboy chez vous.</h2>
        <p className="mt-3 text-text/85">
          Brochettes, paninis, nems, wings, burgers : vos plats préparés minute et emballés dans nos boîtes kraft.
          Composez votre panier, on vous confirme par WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/menu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-wider text-accent-ink hover:brightness-110">
            Commander <IconArrow className="h-4 w-4" />
          </Link>
          <a href={whatsappLink("Bonjour Jackboy, je voudrais passer une commande à emporter / en livraison.")} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-bg/40 px-6 text-sm font-semibold uppercase tracking-wider backdrop-blur hover:border-accent hover:text-accent">
            WhatsApp
          </a>
          <a href={`tel:${primaryPhone.number}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-bg/40 px-6 text-sm font-semibold backdrop-blur hover:border-accent hover:text-accent" aria-label={`Appeler Jackboy au ${primaryPhone.display}`}>
            <IconPhone className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
