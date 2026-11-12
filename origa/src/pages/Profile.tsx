import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { verifyAuditChain } from '../data/repo';
import { flushOutbox, syncIssues } from '../data/sync';
import { setSession } from '../app/sessionStore';
import { apiEnabled } from '../app/api';
import { signOut } from '../app/auth';
import { useOnline, usePending, useSession } from '../app/hooks';
import { useToast } from '../components/ui';
import { Icon, Logo } from '../components/Icon';

const ROLE: Record<string, string> = { eleveur: 'Éleveur', agent: 'Agent technique', dge: 'POUFA / DGE', veterinaire: 'Services vétérinaires', bceg: 'BCEG', admin: 'Administrateur', operateur: 'Opérateur', maedr: 'MAEDR', aninf: 'ANINF' };
const CREDITS = [
  ['Éleveuse avec une poule', 'Richard Nyoni', 'https://unsplash.com/photos/sDjk3DHv2dY'],
  ['Visite vétérinaire en ferme avicole', 'Creab ThePolymath', 'https://unsplash.com/photos/e83gkmG_yW8'],
  ['Poulailler', 'Muhammed Minhaj VP', 'https://unsplash.com/photos/8YZOdT7CsGk'],
  ['Poussin', 'Darius Cotoi', 'https://unsplash.com/photos/R-1VgUb5f7U'],
  ['Poule au pré', 'Thomas Iversen', 'https://unsplash.com/photos/4W8FgDVyUME'],
];

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
      <div className="back"><div><h2>Profil</h2><div className="sub">{ROLE[s.role] ?? s.role}</div></div></div>
      <div className="content" style={{ maxWidth: 640 }}>
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div className="ico" style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--green-50)' }}><Icon name="user" size={24} color="#12805C" /></div>
          <div style={{ flex: 1 }}><b>{s.userLabel}</b><div className="muted">{ROLE[s.role]}{s.farmId && s.role !== 'operateur' ? ` · ${s.farmId}` : ''}{!apiEnabled ? ' · démonstration' : ''}</div></div>
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
          <span className="muted">{apiEnabled ? `${pending} enregistrement(s) en attente d'envoi. Les données restent sur l'appareil tant qu'elles ne sont pas envoyées.` : 'Mode démonstration : les données d’essai restent sur cet appareil et ne sont envoyées nulle part.'}</span>
          {apiEnabled && <button className="cta light" onClick={async () => { const r = await flushOutbox(); show(r.error ?? `${r.sent} envoyé(s), ${r.received ?? 0} reçu(s)`); }}><Icon name="sync" />Synchroniser maintenant</button>}
          {syncIssues().slice(-5).map((i) => <div key={i.table + i.key + i.reason} className="note sun"><Icon name="warn" size={18} />{i.table} {i.key} : {i.reason}</div>)}
        </div>
        <div className="card">
          <h3>Journal d'audit</h3>
          <span className="muted">{auditCount} opération(s) tracée(s) sur cet appareil, scellées par chaînage cryptographique.</span>
          <button className="cta light" onClick={async () => show((await verifyAuditChain()) ? 'Journal intègre' : 'Journal altéré !')}>Vérifier l'intégrité</button>
        </div>
        <Link className="cta light" to="/telecharger"><Icon name="share" />Installer l'application sur un téléphone</Link>
        <button className="cta light" onClick={() => { if (pending === 0 || confirm(`${pending} saisie(s) pas encore envoyée(s) : elles restent sur ce téléphone. Se déconnecter ?`)) signOut(); }}><Icon name="back" />Se déconnecter</button>
        {!apiEnabled && <button className="linkbtn" style={{ alignSelf: 'center' }} onClick={async () => { if (confirm('Effacer toutes les données de démonstration de cet appareil ?')) { await db.delete(); location.reload(); } }}>Réinitialiser la démonstration</button>}
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}><Logo size={24} />À propos d'Origa</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <span className="muted">Origa 1.3.0 · Suivi technico-économique et traçabilité de la filière avicole, programme POUFA. Données hébergées au Gabon, loi n° 025/2023.</span>
            <span className="muted"><b>Crédits photo</b> (licence Unsplash) :</span>
            {CREDITS.map(([t, a, u]) => <a key={u} className="muted" href={u} target="_blank" rel="noreferrer">{t} · {a}</a>)}
          </div>
        </details>
      </div>
      {toast}
    </>
  );
}
