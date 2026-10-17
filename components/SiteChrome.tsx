import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowRight, Chat } from "@/components/Icons";
import { settings, waNeam } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" aria-label="Neam Print, accueil"><Logo className="h-9 w-auto md:h-10" /></Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
          <Link href="/produits" className="hover:text-brand">Produits</Link>
          <Link href="/#comment" className="hover:text-brand">Comment ça marche</Link>
          <Link href="/#contact" className="hover:text-brand">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <a href={waNeam()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2.5 text-sm font-bold text-white md:px-4">
            <Chat className="size-5" /><span className="hidden sm:inline">WhatsApp</span>
          </a>
          <Link href="/produits" className="rounded-full bg-paper px-4 py-2.5 text-sm font-bold md:hidden">Produits</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="grid content-start gap-4">
          <Logo light className="h-14 w-auto" />
          <p className="max-w-sm text-white/70">{settings.tagline}. Envoyez votre fichier ou faites créer votre design, on imprime et on vous prévient sur WhatsApp.</p>
        </div>
        <div className="grid content-start gap-2">
          <p className="text-xs font-bold tracking-[.08em] text-white/50">PRODUITS</p>
          <Link href="/produits#cartes-de-visite" className="text-white/85 hover:text-white">Cartes de visite</Link>
          <Link href="/produits#flyers" className="text-white/85 hover:text-white">Flyers</Link>
          <Link href="/produits#roll-up-plv" className="text-white/85 hover:text-white">Roll-up & PLV</Link>
          <Link href="/produits#grand-format" className="text-white/85 hover:text-white">Bâches & vinyle</Link>
          <Link href="/produits#stickers-etiquettes" className="text-white/85 hover:text-white">Stickers & étiquettes</Link>
        </div>
        <div className="grid content-start gap-2">
          <p className="text-xs font-bold tracking-[.08em] text-white/50">CONTACT</p>
          <p className="text-white/85">{settings.address}</p>
          <a href={waNeam()} target="_blank" rel="noopener" className="text-white/85 hover:text-white">WhatsApp {settings.phoneDisplay}</a>
          <p className="text-white/85">{settings.hours}</p>
        </div>
      </div>
      <p className="mx-auto max-w-6xl border-t border-white/10 px-4 py-6 text-sm text-white/45 md:px-6">
        © {new Date().getFullYear()} Neam Print · Paiement {settings.payments.join(", ")}
      </p>
    </footer>
  );
}

/** Barre d'action fixe en bas d'écran (mobile uniquement). */
export function MobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-3 mb-3 flex gap-2 rounded-full bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,.22)] backdrop-blur">
        <a href={waNeam()} target="_blank" rel="noopener" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-white">
          <Chat /> WhatsApp
        </a>
        <Link href="/produits" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3 font-bold text-white">
          Commander <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
