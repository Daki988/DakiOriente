import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { Icon } from './Icon';
import { fmtDate, useSession } from '../app/hooks';

/** Centre de notifications : alertes sanitaires à qualifier, notification du navigateur dès qu'une alerte arrive (§ 5.2). */
export function NotificationBell({ light = false }: { light?: boolean }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const watch = ['veterinaire', 'dge', 'admin'].includes(s.role);
  const alerts = useLiveQuery(() => db.alerts.where('status').equals('nouvelle').reverse().sortBy('createdAt'), [], []);
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (!watch) return;
    if (seen.current !== null && alerts.length > seen.current && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Origa · nouvelle alerte sanitaire', { body: `${alerts[0].farmId} : ${alerts[0].message}`, icon: './icons/icon-192.png' });
    }
    seen.current = alerts.length;
  }, [alerts.length, watch]);
  if (!watch) return null;
  return (
    <div style={{ position: 'relative' }}>
      <button className="iconbtn" aria-label={`${alerts.length} alerte(s) à qualifier`} onClick={() => { setOpen((v) => !v); if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); }}>
        <Icon name="warn" size={20} color={light ? '#fff' : 'var(--ink)'} />
        {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <b>Alertes à qualifier</b>
          {alerts.length === 0 && <span className="muted">Aucune nouvelle alerte.</span>}
          {alerts.slice(0, 6).map((a) => <Link key={a.id} to="/alertes" className="li" onClick={() => setOpen(false)}><div className="grow"><b>{a.farmId}</b><span>{a.message} · {fmtDate(a.createdAt)}</span></div></Link>)}
        </div>
      )}
    </div>
  );
}
