import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { PROVINCES, gpsMatchesProvince } from '../domain/provinces';
import { inputGap } from '../domain/analytics';
import { today } from '../domain/ids';
import type { Farm, FarmStatus } from '../domain/types';

/** Fiche ferme : modification, statut historisé, capacités, GPS corrigeable, BCEG et consentement révocable (§ 5.1). */
export function FarmDetail() {
  const { id = '' } = useParams();
  const s = useSession(); const st = useSettings(); const [toast, show] = useToast();
  const data = useLiveQuery(async () => {
    const farm = await db.farms.get(id);
    if (!farm) return null;
    const [bands, inputs, visits, bio] = await Promise.all([db.bands.where('farmId').equals(id).reverse().sortBy('rank'), db.inputs.where('farmId').equals(id).toArray(), db.visits.where('farmId').equals(id).toArray(), db.biosecurity.where('farmId').equals(id).reverse().sortBy('date')]);
    return { farm, bands, gap: inputGap(inputs, visits), bio: bio[0], visits: visits.length };
  }, [id]);
  const [f, setF] = useState<Farm | null>(null);
  useEffect(() => { if (data?.farm) setF(data.farm); }, [data?.farm]);
  if (data === null) return <><BackBar title="Ferme introuvable" /><div className="content"><div className="empty">Cette ferme n'existe pas ou n'est pas dans votre périmètre.</div></div></>;
  if (data === undefined || !f) return null;

  const canEdit = ['agent', 'dge', 'admin'].includes(s.role);
  const canReopen = s.role === 'dge' || s.role === 'admin';
  const seeIncome = s.role === 'bceg' || s.role === 'admin';
  const set = <K extends keyof Farm>(k: K, v: Farm[K]) => setF((x) => (x ? { ...x, [k]: v } : x));
  const open = data.bands.find((b) => !b.closedAt);
  const occupation = open ? (open.chicks / Math.max(1, f.capacity)) * 100 : 0;
  const gpsWarn = f.lat !== undefined && f.lng !== undefined && !gpsMatchesProvince(f.province, f.lat, f.lng);

  async function submit() {
    if (!f) return;
    const prev = data!.farm;
    const statusChanged = prev.status !== f.status;
    const next: Farm = { ...f, statusHistory: statusChanged ? [...(f.statusHistory ?? []), { at: new Date().toISOString(), status: f.status, by: s.userLabel }] : f.statusHistory };
    await save('farms', next, statusChanged ? `statut de ferme : ${f.status}` : 'modification de la fiche ferme');
    show('Fiche ferme enregistrée');
  }
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => { set('lat', +p.coords.latitude.toFixed(5)); set('lng', +p.coords.longitude.toFixed(5)); }, () => show('Position introuvable'));

  return (
    <>
      <BackBar title={f.name} sub={`${f.id} · ${PROVINCES[f.province].name}`} />
      <div className="content" style={{ maxWidth: 760 }}>
        <div className="kpis">
          <div className="kpi"><span className="l">Taux d'occupation</span><span className="v">{open ? `${fmt(occupation, 0)} %` : '—'}</span><span className="s">{fmtInt(f.capacity)} places</span></div>
          <div className="kpi"><span className="l">Écart sur l'aliment</span><span className={`v ${data.gap.gapPct !== undefined && Math.abs(data.gap.gapPct) > st.inputGapPct ? 'bad' : ''}`}>{data.gap.gapPct === undefined ? '—' : `${fmt(data.gap.gapPct, 1)} %`}</span><span className="s">{data.visits} visite(s) technique(s)</span></div>
          <div className="kpi"><span className="l">Biosécurité</span><span className="v">{data.bio ? `${fmt(data.bio.scorePct, 0)} %` : '—'}</span><span className="s">{data.bio ? `contrôle du ${fmtDate(data.bio.date)}` : 'aucun contrôle'}</span></div>
          <div className="kpi"><span className="l">Bandes</span><span className="v">{data.bands.length}</span><span className="s">{open ? `bande ${open.rank} en cours` : 'aucune en cours'}</span></div>
        </div>
        <fieldset disabled={!canEdit} className="card" style={{ border: '1px solid var(--line)', gap: 12 }}>
          <h3>Identification</h3>
          <label className="f">Nom<input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
          <div className="row"><label className="f" style={{ flex: 1 }}>Exploitant<input className="input" value={f.owner} onChange={(e) => set('owner', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Téléphone<input className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></label></div>
          <div className="row"><label className="f" style={{ flex: 1 }}>Localité<input className="input" list="localites" value={f.locality} onChange={(e) => set('locality', e.target.value)} /><datalist id="localites">{st.localities.map((l) => <option key={l} value={l} />)}</datalist></label>
            <label className="f" style={{ flex: 1 }}>Référence AMI<input className="input" value={f.amiRef ?? ''} onChange={(e) => set('amiRef', e.target.value)} /></label></div>
          <h3>Programme</h3>
          <div className="row">
            <label className="f" style={{ flex: 1 }}>Statut<select className="input" value={f.status} onChange={(e) => set('status', e.target.value as FarmStatus)}>{st.farmStatuses.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}</select></label>
            <label className="f" style={{ flex: 1 }}>Cohorte<select className="input" value={f.cohort} onChange={(e) => set('cohort', Number(e.target.value) as 1 | 2)}><option value={1}>1</option><option value={2}>2</option></select></label>
          </div>
          {(f.statusHistory ?? []).length > 0 && <span className="muted">Historique : {(f.statusHistory ?? []).map((h) => `${fmtDate(h.at)} ${h.status} (${h.by})`).join(' · ')}</span>}
          <h3>Capacités et infrastructures</h3>
          <div className="row"><label className="f" style={{ flex: 1 }}>Capacité (places)<input className="input" inputMode="numeric" value={f.capacity} onChange={(e) => set('capacity', Number(e.target.value) || 0)} /></label>
            <label className="f" style={{ flex: 1 }}>Bâtiments<input className="input" inputMode="numeric" value={f.buildings} onChange={(e) => set('buildings', Number(e.target.value) || 0)} /></label></div>
          <div className="chips">{st.infrastructures.map((i) => {
            const on = (f.infrastructures ?? []).includes(i);
            return <button type="button" key={i} className={`chip${on ? ' sel-g' : ''}`} onClick={() => set('infrastructures', on ? (f.infrastructures ?? []).filter((x) => x !== i) : [...(f.infrastructures ?? []), i])}>{i}</button>;
          })}</div>
          <h3>Position GPS</h3>
          <div className="row">
            <label className="f" style={{ flex: 1 }}>Latitude<input className="input" inputMode="decimal" value={f.lat ?? ''} onChange={(e) => set('lat', e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))} /></label>
            <label className="f" style={{ flex: 1 }}>Longitude<input className="input" inputMode="decimal" value={f.lng ?? ''} onChange={(e) => set('lng', e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))} /></label>
          </div>
          <button type="button" className="cta light" onClick={locate}><Icon name="pin" />Relever la position sur place</button>
          {gpsWarn && <div className="note sun"><Icon name="warn" size={18} />La position ne correspond pas à la province {PROVINCES[f.province].name}.</div>}
          <h3>Financement BCEG</h3>
          <label className="check"><input type="checkbox" checked={f.bcegFinanced} onChange={(e) => set('bcegFinanced', e.target.checked)} /><span>Ferme financée par la BCEG</span></label>
          {f.bcegFinanced && (f.bcegConsentAt && !f.bcegConsentRevokedAt
            ? <div className="row between"><span className="muted">Consentement de l'exploitant donné le {fmtDate(f.bcegConsentAt)}.</span><button type="button" className="sel" onClick={() => { set('bcegConsentRevokedAt', today()); }}>Révoquer</button></div>
            : <div className="row between"><span className="muted">{f.bcegConsentRevokedAt ? `Consentement révoqué le ${fmtDate(f.bcegConsentRevokedAt)} : la BCEG ne voit plus cette ferme.` : 'Sans consentement, la BCEG ne voit pas cette ferme.'}</span><button type="button" className="sel" onClick={() => setF((x) => (x ? { ...x, bcegConsentAt: today(), bcegConsentRevokedAt: undefined } : x))}>Recueillir le consentement</button></div>)}
          {seeIncome && <label className="f">Domiciliation des revenus (visible de la BCEG seule)<input className="input" value={f.incomeAccount ?? ''} onChange={(e) => set('incomeAccount', e.target.value)} /></label>}
          {canEdit && <button type="button" className="cta green" onClick={submit}>Enregistrer la fiche</button>}
        </fieldset>
        <div className="card">
          <h3>Historique des bandes</h3>
          {data.bands.map((b) => (
            <div key={b.id} className="li"><div className="grow"><b>Bande {b.rank} · {b.strain}</b><span>{fmtDate(b.placedAt)} → {b.closedAt ? fmtDate(b.closedAt) : 'en cours'} · {fmtInt(b.chicks)} poussins</span></div>
              {b.closedAt && canReopen && !open && <button className="sel" onClick={async () => { if (confirm('Rouvrir cette bande clôturée ? L’opération est journalisée.')) { await save('bands', { ...b, closedAt: undefined }, 'réouverture de bande (profil habilité)'); show('Bande rouverte'); } }}>Rouvrir</button>}
            </div>
          ))}
        </div>
      </div>
      {toast}
    </>
  );
}
