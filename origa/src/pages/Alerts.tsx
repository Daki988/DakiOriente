import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { fmtDate, useSession } from '../app/hooks';
import { useToast } from '../components/ui';
import type { Alert, AlertStatus } from '../domain/types';

const LABEL: Record<AlertStatus, string> = { nouvelle: 'Nouvelle', analyse: 'En analyse', confirmee: 'Confirmée', informee: 'Informée', close: 'Close' };
const CLS: Record<AlertStatus, string> = { nouvelle: 'red', analyse: 'off', confirmee: 'red', informee: 'sky', close: 'on' };
const NEXT: Record<AlertStatus, AlertStatus[]> = { nouvelle: ['analyse'], analyse: ['confirmee', 'informee'], confirmee: ['close'], informee: ['close'], close: [] };

/** Qualification des alertes : seule l'autorité vétérinaire fait évoluer et publie une alerte (§ 5.2). */
export function AlertsPage() {
  const s = useSession();
  const [toast, show] = useToast();
  const alerts = useLiveQuery(() => db.alerts.orderBy('createdAt').reverse().toArray(), [], []);
  const reports = useLiveQuery(() => db.reports.toArray(), [], []);
  const [comment, setComment] = useState<Record<string, string>>({});
  const vet = s.role === 'veterinaire';

  async function move(a: Alert, to: AlertStatus) {
    const at = new Date().toISOString();
    await save('alerts', { ...a, status: to, history: [...a.history, { at, status: to, by: s.userLabel, comment: comment[a.id] || undefined }] }, `alerte : ${LABEL[to]}`);
    setComment((c) => ({ ...c, [a.id]: '' }));
    show(`Alerte ${LABEL[to].toLowerCase()}`);
  }

  return (
    <>
      <div className="top"><div><h1>Alertes sanitaires</h1><span className="muted">{vet ? 'Vous qualifiez et publiez les alertes.' : 'Lecture seule : la qualification revient aux services vétérinaires.'}</span></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.length === 0 && <div className="panel"><div className="empty">Aucune alerte.</div></div>}
        {alerts.map((a) => {
          const photo = reports.find((r) => r.bandId === a.bandId && a.source === 'declaration' && r.photo)?.photo;
          return (
            <div key={a.id} className="panel">
              <div className="row between wrap"><h3>{a.farmId} · {a.message}</h3><span className={`pill ${CLS[a.status]}`}>{LABEL[a.status]}</span></div>
              <span className="muted">Source : {a.source === 'seuil' ? 'seuil de mortalité' : a.source === 'tendance' ? 'écart à la tendance' : "déclaration de l'éleveur"} · {fmtDate(a.createdAt)} · bande {a.bandId}</span>
              {photo && <img src={photo} alt="Photo jointe" style={{ maxWidth: 240, borderRadius: 12 }} />}
              <div className="muted">{a.history.map((h, i) => <div key={i}>{fmtDate(h.at)} — {LABEL[h.status]} par {h.by}{h.comment ? ` : ${h.comment}` : ''}</div>)}</div>
              {vet && NEXT[a.status].length > 0 && (
                <div className="row wrap" style={{ gap: 8 }}>
                  <input className="sel" style={{ flex: 1, minWidth: 220 }} placeholder="Commentaire (diagnostic, recommandation)…" value={comment[a.id] ?? ''} onChange={(e) => setComment((c) => ({ ...c, [a.id]: e.target.value }))} />
                  {NEXT[a.status].map((n) => <button key={n} className={`sel${n === 'confirmee' ? ' dark' : ''}`} onClick={() => move(a, n)}>{LABEL[n]}</button>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast}
    </>
  );
}
