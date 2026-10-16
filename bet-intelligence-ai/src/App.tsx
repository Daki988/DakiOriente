import { AlertTriangle, RefreshCw } from 'lucide-react';
import { MobileNav } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Button } from './components/ui/Button';
import { Notice } from './components/ui/Notice';
import { Toasts } from './components/ui/Toasts';
import { useApp } from './hooks/useAppStore';
import type { RouteId } from './hooks/useHashRoute';
import { AnalysisPage } from './pages/AnalysisPage';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { MatchesPage } from './pages/MatchesPage';
import { PerformancePage } from './pages/PerformancePage';
import { SettingsPage } from './pages/SettingsPage';
import { TicketsPage } from './pages/TicketsPage';

const PAGES: Record<RouteId, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  matchs: MatchesPage,
  analyse: AnalysisPage,
  generateur: GeneratorPage,
  tickets: TicketsPage,
  performances: PerformancePage,
  parametres: SettingsPage,
};

export default function App() {
  const { route, loading, error, matches, refresh, settings, storageOk } = useApp();
  const Page = PAGES[route];
  const firstLoad = loading && matches.length === 0;

  return (
    <div className={`flex min-h-dvh ${settings.reduceMotion ? 'reduce-motion' : ''}`}>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-panel-2 focus:px-3 focus:py-2 focus:text-sm">
        Aller au contenu
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="contenu" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {!storageOk && (
            <Notice tone="warn" className="mb-4">
              Le stockage local est indisponible (navigation privée ou quota atteint) : vos tickets et paramètres ne seront pas conservés après actualisation.
            </Notice>
          )}
          {error ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-risk/30 bg-risk-soft p-6 text-center">
              <AlertTriangle className="mx-auto mb-2 text-risk" aria-hidden />
              <p className="text-sm font-medium text-ink">Impossible de charger les données de démonstration.</p>
              <p className="mt-1 text-xs text-ink-2">{error}</p>
              <Button className="mt-4" onClick={refresh} icon={<RefreshCw size={14} />}>Réessayer</Button>
            </div>
          ) : firstLoad ? (
            <LoadingSkeleton />
          ) : (
            <div key={route} className="animate-fade-in">
              <Page />
            </div>
          )}
        </main>
      </div>
      <MobileNav />
      <Toasts />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement des données simulées">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-panel" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-panel" />
    </div>
  );
}
