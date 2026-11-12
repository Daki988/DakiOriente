import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../data/db';
import { save } from '../data/repo';
import { useNational } from '../app/national';
import { BackBar, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtInt, useSession } from '../app/hooks';
import { PROVINCES, gpsMatchesProvince, provinceName } from '../domain/provinces';
import { farmId, nextSeq } from '../domain/ids';
import type { Farm, ProvinceCode } from '../domain/types';

/** Registre unique des fermes (§ 5.1) avec filtres. */
export function FarmsPage() {
  const data = useNational();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const s = useSession();
  const rows = useMemo(() => (data?.rows ?? []).filter((r) => {
    if (s.role === 'bceg' && !(r.farm.bcegFinanced && r.farm.bcegConsentAt && !r.farm.bcegConsentRevokedAt)) return false; // accès BCEG limité, avec consentement
    const t = `${r.farm.id} ${r.farm.name} ${r.farm.locality} ${provinceName(r.farm.province)}`.toLowerCase();
    return t.includes(q.toLowerCase());
  }), [data, q, s.role]);
  if (!data) return null;
  return (
    <>
      <div className="top">
        <div><h1>Registre des fermes</h1><span className="muted">{rows.length} ferme(s){s.role === 'bceg' ? ' financées, avec consentement de l’exploitant' : ''}</span></div>
        <div className="row" style={{ gap: 8 }}>
          <input className="sel" placeholder="Rechercher une ferme…" value={q} onChange={(e) => setQ(e.target.value)} />
          {s.role !== 'bceg' && <button className="sel dark" onClick={() => nav('/fermes/nouvelle')}>+ Nouvelle ferme</button>}
        </div>
      </div>
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Identifiant</th><th>Ferme</th><th>Province</th><th>Statut</th><th>Cohorte</th><th>Capacité</th><th>Effectif</th><th>Mortalité</th><th>IC</th><th>Complétude</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.farm.id}>
                <td className="lotid" style={{ fontSize: 13 }}><Link to={`/fermes/${r.farm.id}`}>{r.farm.id}</Link></td><td>{r.farm.name}<br /><span className="muted" style={{ fontSize: 12 }}>{r.farm.locality}</span></td>
                <td>{provinceName(r.farm.province)}</td>
                <td><span className={`pill ${r.farm.status === 'operationnelle' ? 'on' : r.farm.status === 'suspendue' ? 'red' : 'off'}`}>{r.farm.status === 'operationnelle' ? 'Opérationnelle' : r.farm.status === 'suspendue' ? 'Suspendue' : 'En préparation'}</span></td>
                <td>{r.farm.cohort}</td><td>{fmtInt(r.farm.capacity)}</td><td>{r.st ? fmtInt(r.st.present) : '—'}</td>
                <td>{r.st ? `${fmt(r.st.mortalityPct, 1)} %` : '—'}</td><td>{r.st?.ic ? fmt(r.st.ic, 2) : '—'}</td>
                <td>{r.st ? <><span className="meter"><i style={{ width: `${r.st.completenessPct}%` }} /></span>{fmt(r.st.completenessPct, 0)} %</> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const dist = (a: Farm, lat: number, lng: number) => (a.lat === undefined ? Infinity : Math.hypot(a.lat - lat, a.lng! - lng) * 111);

/** Enrôlement d'une ferme sur place par l'agent technique : GPS, contrôle des doublons et de la province. */
export function FarmNew() {
  const nav = useNavigate();
  const [toast, show] = useToast();
  const [f, setF] = useState({ name: '', owner: '', phone: '', province: 'GA1' as ProvinceCode, locality: '', amiRef: '', capacity: 3000, cohort: 2 as 1 | 2 });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [warn, setWarn] = useState<string[]>([]);
  const set = (k: keyof typeof f, v: string | number) => setF((x) => ({ ...x, [k]: v }));

  function locate() {
    if (!navigator.geolocation) return show('GPS indisponible sur cet appareil');
    navigator.geolocation.getCurrentPosition((p) => setGps({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }), () => show('Position introuvable : saisie manuelle possible'), { enableHighAccuracy: true, timeout: 15000 });
  }

  async function submit() {
    const all = await db.farms.toArray();
    const w: string[] = [];
    if (all.some((x) => x.phone.replace(/\s/g, '') === f.phone.replace(/\s/g, ''))) w.push('Un exploitant avec ce numéro existe déjà.');
    if (gps && all.some((x) => dist(x, gps.lat, gps.lng) < 0.2)) w.push('Une ferme existe déjà à moins de 200 m.');
    if (gps && !gpsMatchesProvince(f.province, gps.lat, gps.lng)) w.push(`La position GPS ne correspond pas à la province ${provinceName(f.province)}.`);
    if (w.length && JSON.stringify(w) !== JSON.stringify(warn)) { setWarn(w); return; } // second clic = confirmation consciente
    const id = farmId(f.province, nextSeq(all.map((x) => x.id), `${f.province}-`, /^(\d{4})$/));
    await save('farms', { id, ...f, lat: gps?.lat, lng: gps?.lng, buildings: 1, status: 'preparation', bcegFinanced: false, createdAt: new Date().toISOString() } satisfies Farm, 'enrôlement de ferme');
    show(`Ferme ${id} enregistrée`);
    setTimeout(() => nav(-1), 800);
  }

  const valid = f.name && f.owner && f.phone && f.locality;
  return (
    <>
      <BackBar title="Nouvelle ferme" sub="Identifiant attribué automatiquement" />
      <div className="content" style={{ maxWidth: 640 }}>
        <label className="f">Nom de la ferme<input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="f">Exploitant<input className="input" value={f.owner} onChange={(e) => set('owner', e.target.value)} /></label>
        <label className="f">Téléphone<input className="input" inputMode="tel" placeholder="+241 …" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <div className="row">
          <label className="f" style={{ flex: 1 }}>Province<select className="input" value={f.province} onChange={(e) => set('province', e.target.value)}>{Object.entries(PROVINCES).map(([c, p]) => <option key={c} value={c}>{p.name}</option>)}</select></label>
          <label className="f" style={{ flex: 1 }}>Localité<input className="input" value={f.locality} onChange={(e) => set('locality', e.target.value)} /></label>
        </div>
        <div className="row">
          <label className="f" style={{ flex: 1 }}>Capacité (places)<input className="input" inputMode="numeric" value={f.capacity} onChange={(e) => set('capacity', Number(e.target.value) || 0)} /></label>
          <label className="f" style={{ flex: 1 }}>Référence AMI<input className="input" value={f.amiRef} onChange={(e) => set('amiRef', e.target.value)} /></label>
        </div>
        <button className="cta light" onClick={locate}><Icon name="pin" />{gps ? `Position : ${gps.lat}, ${gps.lng}` : 'Relever la position GPS sur place'}</button>
        <div className="row">
          <label className="f" style={{ flex: 1 }}>Latitude (correction manuelle)<input className="input" inputMode="decimal" value={gps?.lat ?? ''} onChange={(e) => setGps({ lat: Number(e.target.value.replace(',', '.')) || 0, lng: gps?.lng ?? 0 })} /></label>
          <label className="f" style={{ flex: 1 }}>Longitude<input className="input" inputMode="decimal" value={gps?.lng ?? ''} onChange={(e) => setGps({ lat: gps?.lat ?? 0, lng: Number(e.target.value.replace(',', '.')) || 0 })} /></label>
        </div>
        {warn.map((w) => <div key={w} className="note sun"><Icon name="warn" size={18} />{w}</div>)}
        <button className="cta green" disabled={!valid} onClick={submit}>{warn.length ? 'Confirmer malgré les avertissements' : 'Enregistrer la ferme'}</button>
      </div>
      {toast}
    </>
  );
}
