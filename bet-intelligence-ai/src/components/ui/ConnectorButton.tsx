import { ExternalLink, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useApp } from '../../hooks/useAppStore';
import { useConnectors } from '../../hooks/useConnectors';
import { CONNECTORS, connectorErrorMessage, type ActionResult, type ConnectorKey } from '../../services/connectorService';
import { Button } from './Button';

interface Props {
  connector: ConnectorKey;
  icon: ReactNode;
  children: ReactNode;
  /** Action explicite : exécutée une seule fois par clic, jamais relancée automatiquement. */
  action: () => Promise<ActionResult>;
  successMessage: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

/** Bouton d'action vers un connecteur claude.ai, avec état, erreurs explicites et lien de résultat. */
export function ConnectorButton({ connector, icon, children, action, successMessage, size = 'sm', disabled }: Props) {
  const { notify } = useApp();
  const { availability } = useConnectors();
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const label = CONNECTORS[connector].label;

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      const r = await action();
      setLink(r.link);
      notify(successMessage, 'good');
    } catch (e) {
      const msg = connectorErrorMessage(e, label);
      setError(msg);
      notify(msg, 'risk');
    } finally {
      setPending(false);
    }
  };

  const offline = availability !== 'online';
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size={size}
        onClick={run}
        disabled={disabled || pending || offline}
        icon={pending ? <Loader2 size={14} className="animate-spin" /> : icon}
        title={offline ? 'Disponible dans la version en ligne sur claude.ai, avec vos connecteurs' : undefined}
      >
        {children}
      </Button>
      {offline && availability === 'offline' && <p className="text-[10px] text-muted">Version en ligne uniquement</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#7fb2f0] hover:underline">
          Ouvrir dans {label} <ExternalLink size={11} aria-hidden />
        </a>
      )}
      {error && <p className="max-w-xs text-[11px] leading-snug text-risk" role="alert">{error}</p>}
    </div>
  );
}
