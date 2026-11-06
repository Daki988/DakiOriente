import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { verifyAuditChain } from '../data/repo';
import { flushOutbox } from '../data/sync';
import { PROFILES, setSession } from '../app/sessionStore';
import { useOnline, usePending, useSession } from '../app/hooks';
import { useToast } from '../components/ui';
import { Icon } from '../components/Icon';

export function ProfilePage() {
  const s = useSession();
  const online = useOnline();
  const pending = usePending();
  const [toast, show] = useToast();
  const farms = useLiveQuery(() => db.farms.toArray(), [], []);
  const auditCount = useLiveQuery(() => db.audit.count(), [], 0);
  const mine = s.role === 'agent' ? farms.filter((f) => s.farmIds?.includes(f.id)) : [];

  return (
    <>
      <div className="back"><div><h2>Profil</h2><div className="sub">{s.userLabel}</div></div></div>
      <div className="content" style={{ maxWidth: 640 }}>
        <div className="card">
          <h3>Profil de démonstration</h3>
          <span className="muted">En production, la connexion se fait par numéro de téléphone et code à usage unique.</span>
          <div className="chips">
            {PROFILES.map((p) => (
              <button key={p.userLabel} className={`chip${p.userLabel === s.userLabel ? ' sel-g' : ''}`} onClick={() => { setSession(p); location.hash = '#/'; }}>{p.userLabel}</button>
            ))}
          </div>
        </div>
        {s.role === 'agent' && (
          <div className="card">
            <h3>Ferme suivie</h3>
            <div className="chips">{mine.map((f) => <button key={f.id} className={`chip${s.farmId === f.id ? ' sel-g' : ''}`} onClick={() => setSession({ ...s, farmId: f.id })}>{f.name}</button>)}</div>
            <Link to="/fermes/nouvelle" className="cta light"><Icon name="plus" />Enrôler une ferme</Link>
          </div>
        )}
        <div className="card">
          <div className="row between"><h3>Synchronisation</h3><span className={`pill ${online ? 'on' : 'off'}`}>{online ? 'En ligne' : 'Hors ligne'}</span></div>
          <span className="muted">{pending} enregistrement(s) en attente d'envoi. Les données restent chiffrées sur l'appareil tant qu'elles ne sont pas envoyées.</span>
          <button className="cta light" onClick={async () => { const r = await flushOutbox(); show(r.error ?? `${r.sent} envoyé(s)`); }}><Icon name="sync" />Synchroniser maintenant</button>
        </div>
        <div className="card">
          <h3>Journal d'audit</h3>
          <span className="muted">{auditCount} opération(s) tracée(s), scellées par chaînage cryptographique.</span>
          <button className="cta light" onClick={async () => show((await verifyAuditChain()) ? 'Journal intègre' : 'Journal altéré !')}>Vérifier l'intégrité</button>
        </div>
        <button className="cta light" onClick={async () => { if (confirm('Effacer les données locales de démonstration ?')) { await db.delete(); location.reload(); } }}>Réinitialiser la démonstration</button>
        <span className="muted" style={{ textAlign: 'center' }}>Origa 0.1.0 · Programme POUFA · Données hébergées au Gabon</span>
      </div>
      {toast}
    </>
  );
}
