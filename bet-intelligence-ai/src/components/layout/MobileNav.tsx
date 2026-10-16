import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useAppStore';
import type { RouteId } from '../../hooks/useHashRoute';
import { NAV_ITEMS } from './nav';

const QUICK: RouteId[] = ['dashboard', 'matchs', 'generateur', 'tickets'];

/** Barre d'onglets compacte (mobile) + feuille « Plus » listant toutes les sections. */
export function MobileNav() {
  const { route, navigate } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: RouteId) => {
    setOpen(false);
    navigate(id);
  };
  const quick = NAV_ITEMS.filter((n) => QUICK.includes(n.id));
  const moreActive = !QUICK.includes(route);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <nav aria-label="Menu complet" className="absolute inset-x-0 bottom-0 animate-slide-up rounded-t-2xl border-t border-line bg-panel px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Navigation</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:text-ink" aria-label="Fermer le menu">
                <X size={18} />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go(id)}
                    aria-current={route === id ? 'page' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm ${
                      route === id ? 'border-good/40 bg-good-soft text-ink' : 'border-line bg-panel-2 text-ink-2'
                    }`}
                  >
                    <Icon size={17} aria-hidden className={route === id ? 'text-good' : 'text-muted'} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      <nav aria-label="Navigation rapide" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-night-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {quick.map(({ id, label, Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={route === id ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10px] ${route === id ? 'text-good' : 'text-muted'}`}
              >
                <Icon size={19} aria-hidden />
                <span className="max-w-full truncate px-1">{id === 'generateur' ? 'Générateur' : label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10px] ${moreActive || open ? 'text-good' : 'text-muted'}`}
            >
              <Menu size={19} aria-hidden />
              Plus
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
