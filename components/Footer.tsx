import Link from "next/link";
import { Logo } from "./Logo";
import { settings, fullAddress } from "@/lib/content";
import { hoursSummary } from "@/lib/hours";
import { NAV } from "./nav";

export function Footer() {
  const socials = settings.socials.filter((s): s is { network: string; url: string } => !!s.url);
  return (
    <footer className="border-t border-white/5 bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 text-sm text-muted">{settings.tagline}</p>
          <p className="mt-1 text-sm text-gold">{settings.taglineFr}</p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">Nous trouver</h2>
          <address className="not-italic text-sm leading-relaxed">
            {fullAddress()}<br />{settings.address.landmark}
          </address>
          <p className="mt-2 text-sm">{hoursSummary(settings.hours)}</p>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">Contact</h2>
          <ul className="space-y-1 text-sm">
            {settings.phones.map((p) => (
              <li key={p.number}><a className="hover:text-accent" href={`tel:${p.number}`}>{p.display}</a> <span className="text-muted">· {p.label}</span></li>
            ))}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-3 flex gap-3 text-sm">
              {socials.map((s) => (
                <li key={s.network}><a className="capitalize hover:text-accent" href={s.url} target="_blank" rel="noopener noreferrer">{s.network}</a></li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Pied de page">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted">Explorer</h2>
          <ul className="space-y-1 text-sm">
            {NAV.map((n) => <li key={n.href}><Link className="hover:text-accent" href={n.href}>{n.label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/5 px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {settings.name} ·{" "}
        <Link href="/mentions-legales" className="underline-offset-2 hover:underline">Mentions légales</Link> ·{" "}
        <Link href="/confidentialite" className="underline-offset-2 hover:underline">Confidentialité</Link> · Réalisé par NEAM
        <p className="mt-2 text-white/40">L&apos;abus d&apos;alcool est dangereux pour la santé. À consommer avec modération.</p>
      </div>
    </footer>
  );
}
