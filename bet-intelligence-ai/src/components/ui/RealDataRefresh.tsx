import { DownloadCloud, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../hooks/useAppStore';
import { useConnectors } from '../../hooks/useConnectors';
import { connectorErrorMessage } from '../../services/connectorService';
import { ESPN_LEAGUES, estimatedCredits } from '../../services/espnFeed';
import { refreshEspnFeed, type RefreshProgress } from '../../services/espnSync';
import { formatDateTime } from '../../utils/format';
import { Button } from './Button';

/** Bouton « Actualiser les données réelles » : ESPN via le connecteur Firecrawl de la personne. */
export function RealDataRefresh({ compact = false }: { compact?: boolean }) {
  const { refresh, notify, provider, feedFetchedAt } = useApp();
  const { availability } = useConnectors();
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setProgress({ done: 0, total: ESPN_LEAGUES.length, label: 'Démarrage' });
    try {
      const feed = await refreshEspnFeed(setProgress);
      const n = feed.leagues.reduce((a, l) => a + l.events.length, 0);
      notify(`Données réelles mises à jour : ${n} matchs ESPN récupérés.`, 'good');
      refresh();
    } catch (e) {
      const msg = connectorErrorMessage(e, 'Firecrawl');
      setError(msg);
      notify(msg, 'risk');
    } finally {
      setProgress(null);
    }
  };

  if (availability === 'offline') {
    return <p className="text-xs text-muted">Disponible dans la version en ligne sur claude.ai, avec votre connecteur Firecrawl.</p>;
  }
  return (
    <div className="space-y-2">
      {!compact && (
        <p className="text-xs leading-relaxed text-ink-2">
          Matchs, scores et classements réels de {ESPN_LEAGUES.map((l) => l.label.split(' (')[0]).join(', ')} (source ESPN via Firecrawl). Coût estimé :
          environ {estimatedCredits()} crédits Firecrawl par actualisation, débités sur votre compte.
          {provider === 'espn' && feedFetchedAt && <> Dernière mise à jour : {formatDateTime(feedFetchedAt)}.</>}
        </p>
      )}
      <Button
        variant={compact ? 'primary' : 'secondary'}
        size="sm"
        onClick={run}
        disabled={progress !== null || availability !== 'online'}
        icon={progress ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />}
      >
        {progress ? `${progress.label} (${progress.done}/${progress.total})` : provider === 'espn' ? 'Actualiser les données réelles' : 'Charger les données réelles'}
      </Button>
      {error && <p className="text-[11px] leading-snug text-risk" role="alert">{error}</p>}
    </div>
  );
}
