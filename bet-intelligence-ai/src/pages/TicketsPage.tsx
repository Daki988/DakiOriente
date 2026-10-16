import { Dices, Eye, RotateCcw, Search, Ticket as TicketIcon, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TicketHeader, TicketLegs, TicketRisks, TicketSummary } from '../components/tickets/TicketView';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Notice } from '../components/ui/Notice';
import { useApp } from '../hooks/useAppStore';
import { setTicketStatus, simulateSettlement, STATUS_LABELS } from '../services/ticketService';
import type { MarketId, Ticket, TicketStatus } from '../types';
import { formatDateTime, formatOdds, formatPct } from '../utils/format';
import { MARKETS, marketShort } from '../utils/markets';

type Confirm = { kind: 'delete'; id: string } | { kind: 'reset' } | null;

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function TicketsPage() {
  const { tickets, updateTicket, deleteTicket, resetDemo, notify, navigate, settings } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [market, setMarket] = useState<MarketId | ''>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return tickets.filter(
      (t) =>
        (!status || t.status === status) &&
        (!market || t.legs.some((l) => l.market === market)) &&
        (!q || normalize(`${t.id} ${t.legs.map((l) => `${l.homeName} ${l.awayName}`).join(' ')}`).includes(q)),
    );
  }, [tickets, search, status, market]);

  const detail = tickets.find((t) => t.id === detailId) ?? null;

  const settle = (t: Ticket) => {
    const s = simulateSettlement(t);
    updateTicket(s);
    notify(`${t.id} : ${STATUS_LABELS[s.status]} (tirage simulé selon les probabilités synthétiques).`, s.status === 'WON_SIM' ? 'good' : 'risk');
  };

  return (
    <div className="space-y-5">
      <Notice tone="demo">Tickets virtuels sans valeur financière. Les statuts « gagnant / perdant » sont simulés : aucun résultat sportif réel n’est consulté.</Notice>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-line bg-panel p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_220px_auto] sm:p-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="t-search" className="sr-only">Rechercher un ticket</label>
          <input id="t-search" type="search" placeholder="Identifiant ou équipe…" className="field-input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor="t-status" className="sr-only">Filtrer par statut</label>
          <select id="t-status" className="field-input" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | '')}>
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="t-market" className="sr-only">Filtrer par marché</label>
          <select id="t-market" className="field-input" value={market} onChange={(e) => setMarket(e.target.value as MarketId | '')}>
            <option value="">Tous les marchés</option>
            {MARKETS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <Button variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setConfirm({ kind: 'reset' })} className="text-risk hover:text-risk">
          Réinitialiser la démo
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={20} />}
          title="Aucun ticket virtuel enregistré"
          description="Les tickets générés apparaissent ici et sont conservés dans ce navigateur."
          action={<Button variant="primary" size="sm" onClick={() => navigate('generateur')}>Ouvrir le générateur</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={20} />} title="Aucun ticket ne correspond à la recherche" />
      ) : (
        <>
          <p className="text-xs text-muted" aria-live="polite">{filtered.length} ticket(s) affiché(s) sur {tickets.length}</p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((t) => (
              <li key={t.id} className="flex flex-col rounded-2xl border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">{t.id}</p>
                    <p className="text-[11px] text-muted">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <ul className={`my-3 space-y-1 ${settings.compactTables ? 'text-[11px]' : 'text-xs'}`}>
                  {t.legs.map((l) => (
                    <li key={l.selectionId} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 rounded bg-panel-3 px-1 py-0.5 text-center text-[10px] font-semibold text-ink-2">{marketShort(l.market)}</span>
                      <span className="min-w-0 flex-1 truncate text-ink-2">{l.homeName} – {l.awayName}</span>
                      <span className="tabular font-mono text-ink">{formatOdds(l.odds)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <p className="tabular text-xs text-muted">
                    Cote <span className="font-mono font-semibold text-ink">{formatOdds(t.totalOdds)}</span> · Proba.{' '}
                    <span className="font-semibold text-good">{formatPct(t.probability)}</span>
                  </p>
                  <div className="flex gap-1">
                    {t.status === 'PENDING' && (
                      <Button size="sm" variant="ghost" icon={<Dices size={13} />} onClick={() => settle(t)} title="Tirage aléatoire selon les probabilités synthétiques">
                        Simuler le résultat
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" icon={<Eye size={13} />} onClick={() => setDetailId(t.id)}>Détails</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'delete', id: t.id })} aria-label={`Supprimer le ticket ${t.id}`} className="text-muted hover:text-risk">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title="Détails du ticket virtuel"
        subtitle={detail && <TicketHeader ticket={detail} />}
        footer={
          detail && (
            <>
              <Button variant="ghost" className="mr-auto text-risk hover:text-risk" icon={<Trash2 size={14} />} onClick={() => setConfirm({ kind: 'delete', id: detail.id })}>
                Supprimer
              </Button>
              {detail.status === 'PENDING' && (
                <Button icon={<Dices size={14} />} onClick={() => settle(detail)}>Simuler le résultat</Button>
              )}
              <Button variant="primary" onClick={() => setDetailId(null)}>Fermer</Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <TicketSummary ticket={detail} />
            <div>
              <label htmlFor="d-status" className="mb-1.5 block text-xs font-medium text-ink-2">Statut (simulé)</label>
              <select
                id="d-status"
                className="field-input max-w-xs"
                value={detail.status}
                onChange={(e) => updateTicket(setTicketStatus(detail, e.target.value as TicketStatus))}
              >
                {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">Changement manuel à des fins de démonstration ; « Annulé » exclut le ticket des performances.</p>
            </div>
            <TicketLegs ticket={detail} />
            <TicketRisks risks={detail.risks} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title="Supprimer ce ticket ?"
        message={`Le ticket ${confirm?.kind === 'delete' ? confirm.id : ''} sera définitivement retiré de l’historique local. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'delete') {
            deleteTicket(confirm.id);
            if (detailId === confirm.id) setDetailId(null);
            notify('Ticket supprimé.', 'info');
          }
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === 'reset'}
        title="Réinitialiser la démonstration ?"
        message="Tous les tickets virtuels et vos paramètres seront effacés de ce navigateur, et les données simulées reviendront à leur état initial."
        confirmLabel="Tout réinitialiser"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          resetDemo();
          setConfirm(null);
          notify('Démonstration réinitialisée.', 'info');
        }}
      />
    </div>
  );
}
