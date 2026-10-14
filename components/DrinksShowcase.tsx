import Image from "next/image";
import { drinks, whatsappLink } from "@/lib/content";

/**
 * Vitrine des milkshakes & mocktails (photos studio, fond clair = effet « carte produit »).
 * Noms et prix non encore communiqués : pas de prix affiché, commande sur demande.
 */
export function DrinksShowcase() {
  return (
    <section aria-labelledby="gobelets" className="reveal">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Signés Jackboy</p>
          <h2 id="gobelets" className="mt-2 font-display text-4xl sm:text-5xl">Milkshakes & mocktails</h2>
          <p className="mt-3 max-w-xl text-muted">
            Crémeux, glacés, pétillants : nos boissons signatures, servies dans les gobelets Jackboy. Sur place ou à emporter.
          </p>
        </div>
        <a
          href={whatsappLink("Bonjour Jackboy ! Quels milkshakes et mocktails avez-vous aujourd'hui, et à quel prix ?")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center rounded-full border border-[#25D366]/50 px-5 text-sm font-semibold text-[#25D366] transition hover:bg-[#25D366] hover:text-black"
        >
          Demander les parfums du jour
        </a>
      </div>
      <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {drinks.map((d, i) => (
          <li key={d.src} className="w-[62%] shrink-0 snap-center sm:w-[40%] md:w-auto">
            <figure
              className={`spotlight group relative overflow-hidden rounded-[2rem] transition duration-500 hover:-translate-y-2 ${i % 2 ? "md:translate-y-6" : ""}`}
              style={{ backgroundColor: d.bg }}
            >
              <div className="relative aspect-[3/4]">
                <Image src={d.src} alt={d.alt} fill sizes="(min-width:768px) 20vw, 62vw" className="object-contain p-2 transition duration-700 group-hover:scale-105 group-hover:-rotate-2" />
              </div>
              <figcaption className="absolute inset-x-3 bottom-3 rounded-full bg-bg/85 px-4 py-2 text-center text-xs font-semibold text-text backdrop-blur">
                {d.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
