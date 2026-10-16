import { useEffect, useState } from 'react';
import { connectorStatuses, getMcp, type ConnectorKey, type ConnectorStatus } from '../services/connectorService';
import { isOnline } from '../services/runtime';

/** 'checking' tant que le runtime n'a pas répondu ; 'offline' hors claude.ai ou sans accès. */
export type ConnectorAvailability = 'checking' | 'offline' | 'online';

export function useConnectors() {
  const [availability, setAvailability] = useState<ConnectorAvailability>(isOnline() ? 'checking' : 'offline');
  const [statuses, setStatuses] = useState<Record<ConnectorKey, ConnectorStatus> | null>(null);
  useEffect(() => {
    if (!isOnline()) return;
    let cancelled = false;
    getMcp().then(async (mcp) => {
      if (cancelled) return;
      setAvailability(mcp ? 'online' : 'offline');
      if (mcp) {
        const s = await connectorStatuses();
        if (!cancelled) setStatuses(s);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { availability, statuses };
}
