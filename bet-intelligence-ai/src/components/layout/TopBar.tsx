import { FlaskConical, Radio, RefreshCw, Settings } from 'lucide-react';
import { useApp } from '../../hooks/useAppStore';
import { formatDateTime, formatLongDate, formatTime } from '../../utils/format';
import { Logo } from './Logo';
import { NAV_ITEMS } from './nav';

export function TopBar() {
  const { route, navigate, refresh, loading, lastUpdated, notify, dataSource, provider, feedFetchedAt } = useApp();
  const live = dataSource === 'live';
  const current = NAV_ITEMS.find((n) => n.id === route);
  const today = formatLongDate(new Date());
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line bg-night/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Logo compact />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-ink sm:text-lg">{current?.label}</h1>
          <p className="truncate text-xs text-muted first-letter:uppercase">
            {today}
            {lastUpdated && (
              <span className="hidden sm:inline">
                {' · '}
                {provider === 'espn' && feedFetchedAt
                  ? `données ESPN du ${formatDateTime(feedFetchedAt)}`
                  : `${live ? 'données API-Football chargées' : 'données simulées générées'} à ${formatTime(lastUpdated.toISOString())}`}
              </span>
            )}
          </p>
        </div>
        {live ? (
          <>
            <span className="hidden items-center gap-1.5 rounded-lg border border-good/30 bg-good-soft px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-good sm:inline-flex" title="Matchs, résultats et cotes fournis par API-Football">
              <Radio size={13} aria-hidden /> DONNÉES RÉELLES
            </span>
            <span className="inline-flex rounded-md border border-good/30 bg-good-soft px-1.5 py-1 text-[10px] font-bold text-good sm:hidden">RÉEL</span>
          </>
        ) : (
          <>
            <span
              className="hidden items-center gap-1.5 rounded-lg border border-warn/30 bg-warn-soft px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-warn sm:inline-flex"
              title="Toutes les données affichées sont synthétiques"
            >
              <FlaskConical size={13} aria-hidden /> MODE DÉMONSTRATION
            </span>
            <span className="inline-flex rounded-md border border-warn/30 bg-warn-soft px-1.5 py-1 text-[10px] font-bold text-warn sm:hidden" title="Mode démonstration">
              DÉMO
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            refresh();
            notify(provider === 'espn' ? 'Instantané ESPN rechargé. Pour récupérer de nouvelles données, utilisez « Actualiser les données réelles » dans Paramètres.' : live ? 'Données rechargées depuis le backend (cache de 30 min pour préserver le quota).' : 'Données simulées régénérées (nouvelles cotes de démonstration).', 'info');
          }}
          disabled={loading}
          className="grid size-9 place-items-center rounded-lg border border-line bg-panel text-ink-2 hover:bg-panel-2 hover:text-ink disabled:opacity-50"
          aria-label="Actualiser les données"
          title="Actualiser les données"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => navigate('parametres')}
          className="grid size-9 place-items-center rounded-lg border border-line bg-panel text-ink-2 hover:bg-panel-2 hover:text-ink"
          aria-label="Ouvrir les paramètres"
          title="Paramètres"
        >
          <Settings size={16} aria-hidden />
        </button>
      </div>
    </header>
  );
}
