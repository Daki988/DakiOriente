import { CheckCircle2, Filter, RotateCcw, SearchX, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CriteriaForm, validateCriteria } from '../components/tickets/CriteriaForm';
import { TicketHeader, TicketLegs, TicketRisks, TicketSummary } from '../components/tickets/TicketView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Notice } from '../components/ui/Notice';
import { useApp } from '../hooks/useAppStore';
import { sanitizeSettings } from '../services/settingsService';
import { computeExclusions, generateTicket } from '../services/ticketService';
import type { GenerationResult } from '../types';

export function GeneratorPage() {
  const { matches, selections, settings, updateSettings, resetSettings, tickets, addTicket, notify, navigate } = useApp();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const errors = validateCriteria(settings);
  const invalid = Object.keys(errors).length > 0;
  const preview = useMemo(() => computeExclusions(matches, selections, sanitizeSettings(settings)).stats, [matches, selections, settings]);

  const onGenerate = () => {
    if (invalid) return;
    const r = generateTicket(matches, selections, settings, tickets);
    setResult(r);
    if (r.ok) {
      addTicket(r.ticket);
      notify(`Ticket virtuel ${r.ticket.id} enregistré dans l’historique.`, 'good');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card
          title="Paramètres du générateur"
          subtitle="Modifications enregistrées automatiquement"
          actions={
            <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={resetSettings}>
              Valeurs initiales
            </Button>
          }
        >
          <CriteriaForm settings={settings} onChange={updateSettings} />
        </Card>
        <Card title={<span className="flex items-center gap-1.5"><Filter size={14} aria-hidden /> Filtrage en direct</span>}>
          <dl className="tabular grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted">Sélections examinées</dt><dd className="text-right text-ink">{preview.total}</dd>
            <dt className="text-muted">Marché non autorisé</dt><dd className="text-right text-ink-2">−{preview.marketNotAllowed}</dd>
            <dt className="text-muted">Données insuffisantes</dt><dd className="text-right text-ink-2">−{preview.insufficientData}</dd>
            <dt className="text-muted">Cote hors plage</dt><dd className="text-right text-ink-2">−{preview.oddsOutOfRange}</dd>
            <dt className="text-muted">Probabilité trop faible</dt><dd className="text-right text-ink-2">−{preview.lowProbability}</dd>
            <dt className="border-t border-line pt-2 font-medium text-ink">Sélections admissibles</dt>
            <dd className="border-t border-line pt-2 text-right font-semibold text-good">{preview.eligible}</dd>
          </dl>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Composer un ticket virtuel</p>
            <p className="mt-0.5 text-xs text-muted">Une seule sélection par match, triées par probabilité estimée. Aucun ticket n’est forcé.</p>
          </div>
          <Button variant="primary" icon={<Wand2 size={16} />} onClick={onGenerate} disabled={invalid}>
            Générer un ticket
          </Button>
        </div>
        {invalid && <Notice tone="risk">Corrigez les paramètres signalés avant de générer un ticket.</Notice>}

        {!result && (
          <EmptyState
            icon={<Wand2 size={20} />}
            title="Aucun ticket généré pendant cette visite"
            description="Ajustez les paramètres puis cliquez sur « Générer un ticket ». Le ticket sera enregistré dans Mes tickets."
          />
        )}

        {result && !result.ok && (
          <div className="rounded-2xl border border-warn/30 bg-warn-soft p-6 text-center" role="status">
            <SearchX className="mx-auto mb-2 text-warn" aria-hidden />
            <p className="mx-auto max-w-lg text-sm text-ink">{result.message}</p>
            <p className="mt-2 text-xs text-ink-2">{result.excluded.eligible} sélection(s) admissible(s) sur {result.excluded.total} examinée(s).</p>
          </div>
        )}

        {result && result.ok && (
          <Card
            className="animate-slide-up"
            title={<span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-good" aria-hidden /> Ticket virtuel généré</span>}
            subtitle={<TicketHeader ticket={result.ticket} />}
            actions={<Button size="sm" onClick={() => navigate('tickets')}>Voir l’historique</Button>}
          >
            <div className="space-y-5">
              <TicketSummary ticket={result.ticket} />
              {settings.showWarnings && (
                <Notice tone="warn">
                  Cote totale = produit des cotes ; probabilité indicative = produit des probabilités. Cette approximation suppose l’indépendance des
                  événements et ne tient pas compte de leurs dépendances. Les probabilités de ce prototype sont synthétiques et ne constituent pas des
                  estimations sportives réelles. Ticket virtuel sans valeur financière.
                </Notice>
              )}
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Sélections et raisons</h3>
                <TicketLegs ticket={result.ticket} />
              </div>
              <TicketRisks risks={result.risks} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
