import { Bot, CalendarDays, Cloud, Database, FileSpreadsheet, FlaskConical, Mail, Plug, RotateCcw, Server, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CriteriaForm } from '../components/tickets/CriteriaForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Toggle } from '../components/ui/Fields';
import { useApp, type CloudStatus } from '../hooks/useAppStore';
import { useConnectors } from '../hooks/useConnectors';
import type { ConnectorKey, ConnectorStatus } from '../services/connectorService';
import { runtime } from '../services/runtime';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings, resetDemo, notify, storageOk, cloud, dataSource, fallbackReason, quota } = useApp();
  const { availability, statuses } = useConnectors();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Card
          title="Règles de sélection"
          subtitle="Seuil de probabilité, limites de cote, nombre de sélections et marchés autorisés"
          actions={
            <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => { resetSettings(); notify('Paramètres rétablis aux valeurs initiales.', 'info'); }}>
              Valeurs initiales
            </Button>
          }
        >
          <CriteriaForm settings={settings} onChange={updateSettings} />
        </Card>

        <Card title="Avertissements et interface">
          <div className="space-y-5">
            <Toggle
              label="Afficher les avertissements"
              description="Bandeaux rappelant le caractère synthétique des données et les limites des calculs. Les mentions essentielles restent toujours visibles."
              checked={settings.showWarnings}
              onChange={(v) => updateSettings({ showWarnings: v })}
            />
            <Toggle label="Listes compactes" description="Réduit la hauteur des lignes de matchs et de tickets." checked={settings.compactTables} onChange={(v) => updateSettings({ compactTables: v })} />
            <Toggle label="Réduire les animations" description="Désactive les transitions (la préférence système est respectée dans tous les cas)." checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Vos connecteurs claude.ai" subtitle="Utilisés uniquement quand vous cliquez sur une action">
          {availability === 'offline' ? (
            <p className="text-xs leading-relaxed text-ink-2">
              Les connecteurs fonctionnent dans la version en ligne de l’application, ouverte sur claude.ai. Cette copie locale n’y a pas accès.
            </p>
          ) : (
            <ul className="space-y-3">
              <ConnectorRow k="calendar" icon={<CalendarDays size={16} />} label="Google Calendar" use="Ajouter un match fictif à votre agenda" statuses={statuses} checking={availability === 'checking'} />
              <ConnectorRow k="gmail" icon={<Mail size={16} />} label="Gmail" use="Créer un brouillon (jamais envoyé automatiquement)" statuses={statuses} checking={availability === 'checking'} />
              <ConnectorRow k="drive" icon={<FileSpreadsheet size={16} />} label="Google Drive" use="Exporter l’historique en feuille de calcul" statuses={statuses} checking={availability === 'checking'} />
            </ul>
          )}
          {availability === 'online' && <PermissionsButton />}
        </Card>

        <Card title="Sources de données" subtitle="État des connexions de cette version">
          <ul className="space-y-3">
            <SourceRow
              icon={<FlaskConical size={16} />}
              label="Mode démonstration"
              status={dataSource === 'live' ? <Badge>Inactif</Badge> : <Badge tone="warn">Actif</Badge>}
              detail={dataSource === 'live' ? 'Remplacé par les données réelles.' : fallbackReason ?? 'Matchs, cotes et probabilités synthétiques générés localement.'}
            />
            <SourceRow icon={<Cloud size={16} />} label="Sauvegarde du compte" status={<CloudBadge status={cloud} />} detail="Tickets et paramètres enregistrés dans votre espace privé de l’artefact (version en ligne)." />
            <SourceRow
              icon={<Plug size={16} />}
              label="API football"
              status={dataSource === 'live' ? <Badge tone="good">API-Football</Badge> : <Badge>Non connectée</Badge>}
              detail={
                dataSource === 'live'
                  ? `Matchs, résultats et cotes (1xBet, Bet365, Pinnacle, Unibet).${quota?.remaining != null ? ` Requêtes restantes aujourd’hui : ${quota.remaining}${quota.limit != null ? ` / ${quota.limit}` : ''}.` : ''}`
                  : 'Nécessite le backend déployé avec une clé API-Football (voir README).'
              }
            />
            <SourceRow icon={<Bot size={16} />} label="Bot Telegram" status={<Badge>Non connecté</Badge>} detail="Aucune notification n’est envoyée." />
            <SourceRow
              icon={<Server size={16} />}
              label="Backend"
              status={dataSource === 'live' ? <Badge tone="good">Connecté</Badge> : <Badge>Non connecté</Badge>}
              detail={dataSource === 'live' ? 'Backend Python (FastAPI) : modèle statistique et règlement des tickets.' : 'Backend Python prêt (dossier api/), à déployer.'}
            />
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">Aucun secret ni clé d’API n’est stocké dans cette application.</p>
        </Card>

        <Card title="Stockage local">
          <div className="flex items-start gap-3">
            <Database size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-2">
              Paramètres et tickets virtuels sont enregistrés dans le localStorage de ce navigateur{' '}
              {storageOk ? <Badge tone="good">Opérationnel</Badge> : <Badge tone="risk">Indisponible</Badge>}
            </p>
          </div>
          <Button className="mt-4 w-full" variant="danger" icon={<Trash2 size={14} />} onClick={() => setConfirmReset(true)}>
            Réinitialiser la démonstration
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser la démonstration ?"
        message="Tous les tickets virtuels et vos paramètres seront effacés de ce navigateur, et les données simulées reviendront à leur état initial."
        confirmLabel="Tout réinitialiser"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          notify('Démonstration réinitialisée.', 'info');
        }}
      />
    </div>
  );
}

function SourceRow({ icon, label, status, detail }: { icon: ReactNode; label: string; status: ReactNode; detail: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-night-2 p-3">
      <span className="mt-0.5 text-muted" aria-hidden>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">{label}</p>
          {status}
        </div>
        <p className="mt-0.5 text-[11px] text-muted">{detail}</p>
      </div>
    </li>
  );
}

const statusMeta: Record<ConnectorStatus, { tone: 'good' | 'warn' | 'risk' | 'neutral'; label: string }> = {
  connected: { tone: 'good', label: 'Connecté' },
  unknown: { tone: 'neutral', label: 'Autorisation au 1er usage' },
  needs_reauth: { tone: 'warn', label: 'À reconnecter' },
  not_connected: { tone: 'risk', label: 'Non connecté' },
};

function ConnectorRow({ k, icon, label, use, statuses, checking }: { k: ConnectorKey; icon: ReactNode; label: string; use: string; statuses: Record<ConnectorKey, ConnectorStatus> | null; checking: boolean }) {
  const st = statuses?.[k];
  const meta = st ? statusMeta[st] : null;
  return (
    <SourceRow
      icon={icon}
      label={label}
      status={checking ? <Badge>Vérification…</Badge> : meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : <Badge>Inconnu</Badge>}
      detail={st === 'not_connected' ? `Ajoutez ${label} dans claude.ai → Paramètres → Connecteurs.` : st === 'needs_reauth' ? `Reconnectez ${label} dans claude.ai → Paramètres → Connecteurs.` : use}
    />
  );
}

function CloudBadge({ status }: { status: CloudStatus }) {
  if (status === 'synced') return <Badge tone="good">Synchronisée</Badge>;
  if (status === 'saving' || status === 'loading') return <Badge tone="info">Enregistrement…</Badge>;
  if (status === 'error') return <Badge tone="risk">Erreur</Badge>;
  return <Badge>Hors ligne</Badge>;
}

function PermissionsButton() {
  const [failed, setFailed] = useState(false);
  const open = async () => {
    try {
      const p = await runtime()?.use('permissions');
      if (!p) throw new Error('unavailable');
      await p.manage();
    } catch {
      setFailed(true);
    }
  };
  return (
    <div className="mt-4">
      <Button size="sm" variant="ghost" icon={<ShieldCheck size={14} />} onClick={open}>Gérer les autorisations</Button>
      {failed && <p className="mt-1 text-[11px] text-muted">Utilisez le menu Autorisations de l’artefact dans claude.ai.</p>}
    </div>
  );
}
