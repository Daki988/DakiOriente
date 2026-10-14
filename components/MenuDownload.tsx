import Image from "next/image";
import { MENU_PDF } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { IconDownload, IconEye } from "./Icons";

/** Carte officielle : aperçu des 2 pages + téléchargement PDF + partage WhatsApp. */
export function MenuDownload({ compact = false }: { compact?: boolean }) {
  const shareText = `La carte de Jackboy Bar-Resto 241 (Libreville) : ${SITE_URL}${MENU_PDF.href}`;
  if (compact) {
    // Version barre : discrète, ne repousse pas le menu
    return (
      <div className="spotlight flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3">
        <p className="min-w-0 text-sm">
          <span className="font-semibold">La carte en PDF</span>
          <span className="hidden text-muted sm:inline"> · {MENU_PDF.sizeLabel}</span>
        </p>
        <div className="flex shrink-0 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label="Partager le menu sur WhatsApp"
            className="inline-flex min-h-11 items-center rounded-full border border-[#25D366]/50 px-3 text-xs font-semibold text-[#25D366] hover:bg-[#25D366] hover:text-black">
            Partager
          </a>
          <a href={MENU_PDF.href} download={MENU_PDF.filename}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-ink hover:brightness-110">
            <IconDownload className="h-4 w-4" /> Télécharger
          </a>
        </div>
      </div>
    );
  }
  return (
    <section aria-labelledby="carte-pdf" className="spotlight reveal overflow-hidden rounded-3xl border border-white/10 bg-surface">
      <div className="grid items-center gap-6 p-5 sm:p-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">La carte officielle</p>
          <h2 id="carte-pdf" className="mt-2 font-display text-3xl sm:text-4xl">Le menu à emporter partout</h2>
          <p className="mt-3 text-sm text-muted">
            Bar & fast food gourmet, tous les prix en FCFA. Téléchargez-la, gardez-la dans votre téléphone ou envoyez-la à votre groupe.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={MENU_PDF.href}
              download={MENU_PDF.filename}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-wider text-accent-ink transition hover:brightness-110"
            >
              <IconDownload className="h-4 w-4" /> Télécharger le menu
            </a>
            <a
              href={MENU_PDF.href}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold uppercase tracking-wider transition hover:border-accent hover:text-accent"
            >
              <IconEye className="h-4 w-4" /> Ouvrir
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#25D366]/50 px-6 text-sm font-semibold uppercase tracking-wider text-[#25D366] transition hover:bg-[#25D366] hover:text-black"
            >
              Partager
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">{MENU_PDF.sizeLabel}</p>
        </div>
        {(
          <div className="relative mx-auto h-64 w-full max-w-sm sm:h-80" aria-hidden="true">
            {MENU_PDF.pages.map((pg, i) => (
              <a
                key={pg.src}
                href={MENU_PDF.href}
                target="_blank"
                rel="noopener"
                tabIndex={-1}
                className={`absolute top-0 block h-full w-[58%] overflow-hidden rounded-xl border border-white/10 shadow-2xl transition duration-500 hover:z-10 hover:-translate-y-2 hover:rotate-0 ${
                  i === 0 ? "left-0 -rotate-6" : "right-0 rotate-6"
                }`}
              >
                <Image src={pg.src} alt={pg.alt} fill sizes="220px" className="object-cover object-top" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
