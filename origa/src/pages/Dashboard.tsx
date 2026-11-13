import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNational } from '../app/national';
import { fmt, fmtDate, fmtInt, mortClass, useSettings } from '../app/hooks';
import { PROVINCES, provinceName } from '../domain/provinces';
import { traceIndicators } from '../domain/analytics';
import { addDays, today } from '../domain/ids';
import type { ProvinceCode } from '../domain/types';
import { FarmMap } from '../components/FarmMap';
import { printPage, saveText } from '../app/native';

const STATUS: Record<string, [string, string]> = { nouvelle: ['red', 'Nouvelle'], analyse: ['off', 'En analyse'], confirmee: ['red', 'Confirmée'], informee: ['sky', 'Informée'], close: ['on', 'Close'] };

/** Tableau de bord national (§ 5.4) : indicateurs, production, fermes à accompagner, alertes, carte. */
export function Dashboard() {
  const data = useNational();
  const settings = useSettings();
  const nav = useNavigate();
  const [prov, setProv] = useState<ProvinceCode | ''>('');
  const [days, setDays] = useState(30);
  const [cohort, setCohort] = useState<'' | '1' | '2'>('');
  const [status, setStatus] = useState('operationnelle');
  const [unit, setUnit] = useState<'t' | 'kg' | 'tetes'>('t');
  const rows = useMemo(() => (data?.rows ?? []).filter((r) => (!prov || r.farm.province === prov) && (!cohort || String(r.farm.cohort) === cohort) && (!status || r.farm.status === status)), [data, prov, cohort, status]);
  if (!data) return null;

  const active = rows.filter((r) => r.farm.status === 'operationnelle' || status !== 'operationnelle');
  const since = days ? addDays(today(), -days) : '0000';
  const farmIds = new Set(rows.map((r) => r.farm.id));
  const exitsP = data.exits.filter((x) => x.date >= since && farmIds.has(x.bandId.split('-B')[0]));
  const sold = exitsP.reduce((a, x) => a + x.count, 0);
  const soldKg = exitsP.reduce((a, x) => a + x.weightKg, 0);
  const priced = exitsP.filter((x) => x.unitPriceXaf);
  const avgPrice = priced.reduce((a, x) => a + (x.unitPriceXaf ?? 0) * x.count, 0) / Math.max(1, priced.reduce((a, x) => a + x.count, 0));
  const trace = traceIndicators(data.lots.filter((l) => l.cededAt >= since && farmIds.has(l.farmId)), exitsP);
  const vol = unit === 'tetes' ? `${fmtInt(sold)} têtes` : unit === 'kg' ? `${fmtInt(soldKg)} kg` : `${fmt(soldKg / 1000, 1)} t`;
  const present = active.reduce((s, r) => s + (r.st?.present ?? 0), 0);
  const openAlerts = data.alerts.filter((a) => ['nouvelle', 'analyse', 'confirmee'].includes(a.status) && (!prov || rows.some((r) => r.farm.id === a.farmId)));
  const max = Math.max(1, ...data.weeks.map((w) => w.t));
  const score = (r: (typeof rows)[number]) => r.alerts * 10 + (r.st?.mortalityPct ?? 0) + (100 - (r.st?.completenessPct ?? 100)) / 10;
  const toFollow = [...active].sort((a, b) => score(b) - score(a)).slice(0, 6);
  const byProv = Object.entries(PROVINCES).map(([c, p]) => ({ c, name: p.name, n: active.filter((r) => r.farm.province === c).length })).sort((a, b) => b.n - a.n);
  const maxProv = Math.max(1, ...byProv.map((p) => p.n));

  function exportCsv() {
    const head = 'Ferme;Nom;Province;Bande;Effectif;Mortalite %;IC;Completude %\n';
    const body = rows.map((r) => [r.farm.id, r.farm.name, provinceName(r.farm.province), r.band?.id ?? '', r.st?.present ?? '', fmt(r.st?.mortalityPct ?? 0, 2), fmt(r.st?.ic ?? 0, 2), fmt(r.st?.completenessPct ?? 0, 0)].join(';')).join('\n');
    saveText(`origa-fermes-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + head + body);
  }

  return (
    <>
      <div className="top">
        <div><h1>Vue nationale</h1><span className="muted">Données au {fmtDate(new Date().toISOString())} · {active.length} fermes opérationnelles</span></div>
        <div className="row wrap" style={{ gap: 8 }}>
          <select className="sel" value={prov} onChange={(e) => setProv(e.target.value as ProvinceCode | '')} aria-label="Province">
            <option value="">Toutes les provinces</option>
            {Object.entries(PROVINCES).map(([c, p]) => <option key={c} value={c}>{p.name}</option>)}
          </select>
          <select className="sel" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Période"><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option><option value={0}>Depuis le début</option></select>
          <select className="sel" value={cohort} onChange={(e) => setCohort(e.target.value as '' | '1' | '2')} aria-label="Cohorte"><option value="">Cohortes 1 et 2</option><option value="1">Cohorte 1</option><option value="2">Cohorte 2</option></select>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statut"><option value="operationnelle">Opérationnelles</option><option value="preparation">En préparation</option><option value="suspendue">Suspendues</option><option value="">Tous statuts</option></select>
          <select className="sel" value={unit} onChange={(e) => setUnit(e.target.value as 't' | 'kg' | 'tetes')} aria-label="Unité"><option value="t">Tonnes</option><option value="kg">Kilogrammes</option><option value="tetes">Têtes</option></select>
          <button className="sel" onClick={exportCsv}>Exporter CSV</button>
          <button className="sel dark" onClick={() => printPage('Origa · vue nationale')}>Rapport PDF</button>
        </div>
      </div>
      <div className="grid4">
        <div className="wk"><span className="l">Fermes opérationnelles</span><span className="v">{active.length} <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>/ 150</span></span><span className="s ok">Objectif programme POUFA</span></div>
        <div className="wk"><span className="l">Poulets en élevage</span><span className="v">{fmtInt(present)}</span><span className="s ok">{active.filter((r) => r.band).length} bandes en cours</span></div>
        <div className="wk"><span className="l">Production cumulée</span><span className="v">{fmt(data.produced, 1)} t</span><span className="s">Poids vif depuis le 1er septembre</span></div>
        <div className="wk"><span className="l">Alertes sanitaires ouvertes</span><span className={`v ${openAlerts.length ? 'bad' : 'ok'}`}>{openAlerts.length}</span><span className="s bad">{openAlerts.filter((a) => a.status === 'confirmee').length} confirmée(s)</span></div>
      </div>
      <div className="grid4">
        <div className="wk"><span className="l">Volumes vendus ({days ? `${days} j` : 'total'})</span><span className="v">{vol}</span><span className="s">{fmtInt(sold)} poulets sortis</span></div>
        <div className="wk"><span className="l">Prix moyen</span><span className="v">{priced.length ? fmtInt(avgPrice) : '—'}</span><span className="s">FCFA par tête vendue</span></div>
        <div className="wk"><span className="l">Lots avec QR</span><span className={`v ${trace.lots ? (trace.qrTargetMet ? 'ok' : 'bad') : ''}`}>{trace.lots ? `${fmt(trace.qrPct, 0)} %` : '—'}</span><span className="s">{trace.lots} lot(s) · seuil 95 %</span></div>
        <div className="wk"><span className="l">Ventes rattachées à un lot</span><span className="v">{trace.lots || exitsP.length ? `${fmt(trace.salesLinkedPct, 0)} %` : '—'}</span><span className="s">{trace.lots ? `${fmt(trace.validatedPct, 0)} % des lots à réception confirmée` : 'aucun lot sur la période'}</span></div>
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="row between wrap"><h3>Production hebdomadaire (tonnes de poids vif)</h3><span className="pill sky">Hachuré : prévision à 6 semaines</span></div>
          <div className="bars" role="img" aria-label="Production hebdomadaire réalisée et prévue">
            {data.weeks.map((w, i) => (
              <div key={i} className="bar"><em>{w.t >= 0.05 ? fmt(w.t, 1) : ''}</em><i className={w.proj ? 'proj' : ''} style={{ height: `${(w.t / max) * 82}%` }} /><span>S{w.w}</span></div>
            ))}
          </div>
          <h3>Fermes à accompagner</h3>
          <table className="tbl">
            <thead><tr><th>Ferme</th><th>Province</th><th>Mortalité</th><th>IC</th><th>Complétude</th><th>Statut</th></tr></thead>
            <tbody>
              {toFollow.map((r) => {
                const m = r.st?.mortalityPct ?? 0; const c = r.st?.completenessPct ?? 0;
                const [cls, label] = r.alerts ? ['red', 'Alerte'] : c < 70 ? ['off', 'Saisie faible'] : m > settings.mortalityRefPct ? ['sky', 'À visiter'] : ['on', 'Bon'];
                return (
                  <tr key={r.farm.id} className="click" onClick={() => nav(`/fermes?q=${r.farm.id}`)}>
                    <td>{r.farm.id} {r.farm.name.replace('Ferme ', '')}</td><td>{provinceName(r.farm.province)}</td>
                    <td className={mortClass(m, settings)}>{fmt(m, 1)} %</td><td>{r.st?.ic ? fmt(r.st.ic, 2) : '—'}</td>
                    <td><span className="meter"><i style={{ width: `${c}%` }} /></span>{fmt(c, 0)} %</td><td><span className={`pill ${cls}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Alertes sanitaires</h3>
          {openAlerts.length === 0 && <div className="empty">Aucune alerte ouverte.</div>}
          {openAlerts.slice(0, 4).map((a) => (
            <div key={a.id} className={`alert${a.status === 'confirmee' ? ' hot' : ''}`} onClick={() => nav('/alertes')} style={{ cursor: 'pointer' }}>
              <span className="dot" style={{ background: a.status === 'confirmee' ? 'var(--red)' : 'var(--sun)', marginTop: 5 }} />
              <div className="t"><b>{STATUS[a.status][1]} · {a.farmId}</b><span>{a.message}</span></div>
            </div>
          ))}
          <h3>Carte des fermes</h3>
          <FarmMap rows={rows} />
          <h3>Fermes actives par province</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byProv.filter((p) => p.n > 0).map((p) => (
              <div key={p.c} className="pv"><span className="n">{p.name}</span><span className="b"><i style={{ width: `${(p.n / maxProv) * 100}%` }} /></span><span className="c">{p.n}</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
