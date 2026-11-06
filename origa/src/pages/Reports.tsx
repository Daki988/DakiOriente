import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { fmt, fmtDate, fmtInt, useSettings } from '../app/hooks';
import { bandStats } from '../domain/kpis';
import { bandEconomics, inputGap, periodBounds, traceIndicators } from '../domain/analytics';
import { addDays, today } from '../domain/ids';
import { provinceName } from '../domain/provinces';
import { Logo } from '../components/Icon';

type Kind = 'hebdomadaire' | 'finBande' | 'mensuel';

/** Rapports périodiques produits automatiquement pour chaque période écoulée, exportables en PDF (§ 5.4). */
export function ReportsPage() {
  const st = useSettings();
  const kinds = (['hebdomadaire', 'finBande', 'mensuel'] as Kind[]).filter((k) => st.reports[k]);
  const [kind, setKind] = useState<Kind>(kinds[0] ?? 'hebdomadaire');
  const data = useLiveQuery(async () => {
    const [farms, bands, entries, weighings, exits, inputs, visits, lots, alerts, charges] = await Promise.all([
      db.farms.toArray(), db.bands.toArray(), db.entries.toArray(), db.weighings.toArray(), db.exits.toArray(), db.inputs.toArray(), db.visits.toArray(), db.lots.toArray(), db.alerts.toArray(), db.charges.toArray(),
    ]);
    return { farms, bands, entries, weighings, exits, inputs, visits, lots, alerts, charges };
  }, []);

  // Périodes générées automatiquement : 8 dernières semaines, 6 derniers mois, bandes clôturées.
  const periods = useMemo(() => {
    if (kind === 'finBande') return (data?.bands ?? []).filter((b) => b.closedAt).sort((a, b) => b.closedAt!.localeCompare(a.closedAt!)).map((b) => ({ key: b.id, label: `${b.id} · clôturée le ${fmtDate(b.closedAt!)}`, start: b.placedAt, end: b.closedAt! }));
    const out: { key: string; label: string; start: string; end: string }[] = [];
    for (let i = 1; i <= (kind === 'mensuel' ? 6 : 8); i++) {
      const ref = kind === 'mensuel' ? addDays(today(), -30 * (i - 1)) : addDays(today(), -7 * i);
      const p = periodBounds(kind, ref);
      if (!out.some((o) => o.key === p.start)) out.push({ key: p.start, label: p.label, start: p.start, end: p.end });
    }
    return out;
  }, [kind, data]);
  const [sel, setSel] = useState('');
  const period = periods.find((p) => p.key === sel) ?? periods[0];
  if (!data) return null;

  const inP = (d: string) => !!period && d >= period.start && d <= period.end;
  const farmRows = data.farms.filter((f) => f.status === 'operationnelle').map((f) => {
    const band = data.bands.filter((b) => b.farmId === f.id && (kind === 'finBande' ? b.id === period?.key : b.placedAt <= (period?.end ?? today()))).sort((a, b) => b.rank - a.rank)[0];
    const by = <T extends { bandId: string }>(xs: T[]) => (band ? xs.filter((x) => x.bandId === band.id) : []);
    const s = band ? bandStats(band, by(data.entries), by(data.weighings), by(data.exits), st, period?.end ?? today()) : undefined;
    const produced = data.exits.filter((x) => x.bandId.startsWith(f.id) && inP(x.date)).reduce((a, x) => a + x.weightKg, 0);
    const gap = inputGap(data.inputs.filter((i) => i.farmId === f.id), data.visits.filter((v) => v.farmId === f.id));
    return { f, band, s, produced, gap };
  }).filter((r) => kind !== 'finBande' || r.band);
  const totalKg = farmRows.reduce((a, r) => a + r.produced, 0);
  const alertsP = data.alerts.filter((a) => inP(a.createdAt.slice(0, 10)));
  const exitsP = data.exits.filter((x) => inP(x.date));
  const eco = bandEconomics(exitsP, data.charges.filter((c) => inP(c.date)));
  const trace = traceIndicators(data.lots.filter((l) => inP(l.cededAt)), exitsP);
  const mortAvg = farmRows.filter((r) => r.s).reduce((a, r) => a + r.s!.mortalityPct, 0) / Math.max(1, farmRows.filter((r) => r.s).length);
  const title = kind === 'hebdomadaire' ? 'Rapport hebdomadaire' : kind === 'mensuel' ? 'Rapport mensuel national' : 'Rapport de fin de bande';

  return (
    <>
      <div className="top no-print">
        <div><h1>Rapports</h1><span className="muted">Produits automatiquement pour chaque période écoulée. Périodicité réglable dans les paramètres.</span></div>
        <div className="row wrap" style={{ gap: 8 }}>
          {kinds.map((k) => <button key={k} className={`sel${kind === k ? ' dark' : ''}`} onClick={() => { setKind(k); setSel(''); }}>{k === 'hebdomadaire' ? 'Hebdomadaire' : k === 'mensuel' ? 'Mensuel national' : 'Fin de bande'}</button>)}
          <select className="sel" value={period?.key ?? ''} onChange={(e) => setSel(e.target.value)}>{periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
          <button className="sel dark" onClick={() => window.print()}>Exporter en PDF</button>
        </div>
      </div>
      {!period ? <div className="panel"><div className="empty">Aucune période disponible pour ce rapport.</div></div> : (
        <div className="panel report report-print">
          <div className="row between"><div className="row" style={{ alignItems: 'center' }}><Logo size={36} /><div><h2 style={{ fontSize: 20 }}>{title}</h2><span className="muted">Programme POUFA · {period.label} ({fmtDate(period.start)} → {fmtDate(period.end)})</span></div></div><span className="muted">Édité le {fmtDate(today())}</span></div>
          <div className="grid4">
            <div className="wk"><span className="l">Fermes suivies</span><span className="v">{farmRows.length}</span></div>
            <div className="wk"><span className="l">Production de la période</span><span className="v">{fmt(totalKg / 1000, 2)} t</span></div>
            <div className="wk"><span className="l">Mortalité moyenne</span><span className="v">{fmt(mortAvg, 1)} %</span></div>
            <div className="wk"><span className="l">Alertes sanitaires</span><span className={`v ${alertsP.length ? 'bad' : ''}`}>{alertsP.length}</span></div>
          </div>
          <div className="grid4">
            <div className="wk"><span className="l">Chiffre d'affaires déclaré</span><span className="v">{fmtInt(eco.revenue / 1000)} k</span><span className="s">FCFA</span></div>
            <div className="wk"><span className="l">Prix moyen</span><span className="v">{eco.avgPricePerKg ? fmtInt(eco.avgPricePerKg) : '—'}</span><span className="s">FCFA / kg vif</span></div>
            <div className="wk"><span className="l">Lots avec QR</span><span className={`v ${trace.qrTargetMet ? 'ok' : 'bad'}`}>{fmt(trace.qrPct, 0)} %</span><span className="s">seuil de recette 95 %</span></div>
            <div className="wk"><span className="l">Ventes rattachées à un lot</span><span className="v">{fmt(trace.salesLinkedPct, 0)} %</span><span className="s">{trace.lots} lot(s) tracé(s)</span></div>
          </div>
          <table className="tbl">
            <thead><tr><th>Ferme</th><th>Province</th><th>Bande</th><th>Effectif</th><th>Mortalité</th><th>IC</th><th>Complétude</th><th>Produit (kg)</th><th>Écart intrants</th></tr></thead>
            <tbody>{farmRows.map((r) => (
              <tr key={r.f.id}><td>{r.f.id} {r.f.name.replace('Ferme ', '')}</td><td>{provinceName(r.f.province)}</td><td>{r.band?.rank ?? '—'}</td><td>{r.s ? fmtInt(r.s.present) : '—'}</td>
                <td className={r.s && r.s.mortalityPct > 6 ? 'bad' : ''}>{r.s ? `${fmt(r.s.mortalityPct, 1)} %` : '—'}</td><td>{r.s?.ic ? fmt(r.s.ic, 2) : '—'}</td><td>{r.s ? `${fmt(r.s.completenessPct, 0)} %` : '—'}</td>
                <td>{fmtInt(r.produced)}</td><td className={r.gap.gapPct !== undefined && Math.abs(r.gap.gapPct) > st.inputGapPct ? 'bad' : ''}>{r.gap.gapPct === undefined ? '—' : `${fmt(r.gap.gapPct, 1)} %`}</td></tr>
            ))}</tbody>
          </table>
          {alertsP.length > 0 && <><h3>Alertes de la période</h3>{alertsP.map((a) => <div key={a.id} className="muted">{fmtDate(a.createdAt)} · {a.farmId} · {a.message} · {a.status}</div>)}</>}
        </div>
      )}
    </>
  );
}
