import { FlaskConical } from 'lucide-react';
import { useApp } from '../../hooks/useAppStore';
import { Logo } from './Logo';
import { NAV_ITEMS } from './nav';

export function Sidebar() {
  const { route, navigate, tickets, dataSource } = useApp();
  const pending = tickets.filter((t) => t.status === 'PENDING').length;
  return (
    <div className="hidden w-64 shrink-0 border-r border-line bg-night-2 lg:block">
    <aside className="sticky top-[env(safe-area-inset-top,0px)] flex h-dvh flex-col">
      <div className="px-5 py-5">
        <button type="button" onClick={() => navigate('dashboard')} aria-label="Retour au dashboard">
          <Logo />
        </button>
      </div>
      <nav aria-label="Navigation principale" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = route === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(id);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? 'bg-panel-2 font-medium text-ink' : 'text-ink-2 hover:bg-panel hover:text-ink'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-good' : 'text-muted group-hover:text-ink-2'} aria-hidden />
                  <span className="flex-1">{label}</span>
                  {id === 'tickets' && pending > 0 && (
                    <span className="tabular rounded-md bg-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-[#7fb2f0]">{pending}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      {dataSource === 'live' ? (
        <div className="m-3 rounded-xl border border-line bg-panel p-3 text-[11px] leading-relaxed text-ink-2">
          <p className="mb-1 font-semibold text-ink">Données réelles · API-Football</p>
          Probabilités estimées par un modèle statistique, sans garantie. Aucun pari n’est placé ; les tickets restent virtuels.
        </div>
      ) : (
        <div className="m-3 rounded-xl border border-warn/25 bg-warn-soft p-3 text-[11px] leading-relaxed text-[#f8c56a]">
          <p className="mb-1 flex items-center gap-1.5 font-semibold"><FlaskConical size={13} aria-hidden /> Mode démonstration</p>
          Données synthétiques. Aucun pari réel n’est placé ; les tickets n’ont aucune valeur financière.
        </div>
      )}
    </aside>
    </div>
  );
}
