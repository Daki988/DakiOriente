import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { useNational } from '../app/national';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { bandEconomics, rankFarms, traceIndicators } from '../domain/analytics';
import { provinceName } from '../domain/provinces';
import { today, uid } from '../domain/ids';
import { useToast, Empty } from '../components/ui';
import { Logo } from '../components/Icon';
import type { Publication } from '../domain/types';

// ---------- Classement des fermes (§ 5.4) ----------
export function RankingPage() {
  const data = useNational(); const st = useSettings();
  if (!data) return null;
  const rows = data.rows.filter((r) => r.st);
  const ranked = rankFarms(rows.map((r) => ({ id: r.farm.id, mortality: r.st!.mortalityPct, ic: r.st!.ic, gmq: r.st!.gmq, completeness: r.st!.completenessPct })), st.rankingWeights);
  const w = st.rankingWeights;
  return (
    <>
      <div className="top"><div><h1>Classement des fermes</h1><span className="muted">Pondérations : mortalité {w.mortalite} · IC {w.ic} · GMQ {w.gmq} · régularité de saisie {w.regularite} (réglables dans les paramètres).</span></div></div>
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Rang</th><th>Ferme</th><th>Province</th><th>Score</th><th>Mortalité</th><th>IC</th><th>GMQ</th><th>Complétude</th></tr></thead>
          <tbody>{ranked.map((r, i) => {
            const row = rows.find((x) => x.farm.id === r.id)!;
            return (
              <tr key={r.id}><td><b>{i + 1}</b></td><td><Link to={`/fermes/${r.id}`}>{r.id} {row.farm.name.replace('Ferme ', '')}</Link></td><td>{provinceName(row.farm.province)}</td>
                <td><span className="meter"><i style={{ width: `${r.score}%` }} /></span>{fmt(r.score, 0)}</td><td>{fmt(row.st!.mortalityPct, 1)} %</td><td>{fmt(row.st!.ic, 2)}</td><td>{fmt(row.st!.gmq, 0)}</td><td>{fmt(row.st!.completenessPct, 0)} %</td></tr>
            );
          })}</tbody>
        </table>
        <span className="muted">Les fermes sans pesée (IC non calculable) ne sont pas classées.</span>
      </div>
    </>
  );
}

// ---------- Suivi économique (§ 5.3) ----------
export function EconomicsPage() {
  const s = useSession();
  const data = useLiveQuery(async () => {
    const [farms, bands, exits, charges] = await Promise.all([db.farms.toArray(), db.bands.toArray(), db.exits.toArray(), db.charges.toArray()]);
    return farms.filter((f) => s.role !== 'bceg' || (f.bcegFinanced && f.bcegConsentAt && !f.bcegConsentRevokedAt)).map((f) => {
      const ids = bands.filter((b) => b.farmId === f.id).map((b) => b.id);
      const x = exits.filter((e) => ids.includes(e.bandId));
      const c = charges.filter((ch) => ch.farmId === f.id);
      return { f, eco: bandEconomics(x, c), sold: x.reduce((a, e) => a + e.count, 0) };
    });
  }, [s.role]);
  if (!data) return null;
  const tot = data.reduce((a, r) => ({ rev: a.rev + r.eco.revenue, cost: a.cost + r.eco.cost }), { rev: 0, cost: 0 });
  return (
    <>
      <div className="top"><div><h1>Suivi économique</h1><span className="muted">{s.role === 'bceg' ? 'Fermes financées par la BCEG, avec le consentement de l’exploitant.' : 'Rentabilité des fermes et préparation de la fin progressive de la subvention.'}</span></div></div>
      <div className="grid4">
        <div className="wk"><span className="l">Chiffre d'affaires</span><span className="v">{fmtInt(tot.rev / 1e6)} M</span><span className="s">FCFA déclarés</span></div>
        <div className="wk"><span className="l">Charges</span><span className="v">{fmtInt(tot.cost / 1e6)} M</span><span className="s">FCFA</span></div>
        <div className="wk"><span className="l">Marge</span><span className={`v ${tot.rev - tot.cost < 0 ? 'bad' : 'ok'}`}>{fmtInt((tot.rev - tot.cost) / 1e6)} M</span><span className="s">FCFA</span></div>
        <div className="wk"><span className="l">Fermes</span><span className="v">{data.length}</span><span className="s">{data.filter((r) => r.eco.cost > 0).length} avec charges saisies</span></div>
      </div>
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Ferme</th><th>Poulets vendus</th><th>Chiffre d'affaires</th><th>Charges</th><th>Coût de revient</th><th>Marge</th><th>Taux de marge</th>{(s.role === 'bceg' || s.role === 'admin') && <th>Domiciliation</th>}</tr></thead>
          <tbody>{data.map(({ f, eco, sold }) => (
            <tr key={f.id}><td><Link to={`/fermes/${f.id}`}>{f.id} {f.name.replace('Ferme ', '')}</Link></td><td>{fmtInt(sold)}</td><td>{fmtInt(eco.revenue)} F</td><td>{fmtInt(eco.cost)} F</td>
              <td>{eco.costPerKg ? `${fmtInt(eco.costPerKg)} F/kg` : '—'}</td><td className={eco.margin < 0 ? 'bad' : ''}>{fmtInt(eco.margin)} F</td><td>{eco.revenue ? `${fmt(eco.marginRatePct, 1)} %` : '—'}</td>
              {(s.role === 'bceg' || s.role === 'admin') && <td>{f.incomeAccount ?? '—'}</td>}</tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

/** Agrégats nationaux diffusables : aucune donnée individuelle. */
export async function aggregates(): Promise<Record<string, number>> {
  const [farms, exits, lots, entries, bands] = await Promise.all([db.farms.toArray(), db.exits.toArray(), db.lots.toArray(), db.entries.toArray(), db.bands.toArray()]);
  const sold = exits.filter((e) => e.unitPriceXaf);
  const placed = bands.reduce((a, b) => a + b.chicks, 0);
  return {
    fermesActives: farms.filter((f) => f.status === 'operationnelle').length,
    volumeKg: Math.round(exits.reduce((a, e) => a + e.weightKg, 0)),
    pouletsVendus: exits.reduce((a, e) => a + e.count, 0),
    prixMoyenTete: Math.round(sold.reduce((a, e) => a + (e.unitPriceXaf ?? 0) * e.count, 0) / Math.max(1, sold.reduce((a, e) => a + e.count, 0))),
    mortaliteMoyennePct: Math.round((entries.reduce((a, e) => a + e.deaths, 0) / Math.max(1, placed)) * 1000) / 10,
    lotsTraces: lots.length,
    lotsAvecQrPct: Math.round(traceIndicators(lots, exits).qrPct),
  };
}
export const AGG_LABEL: Record<string, string> = { fermesActives: 'Fermes actives', volumeKg: 'Volume produit (kg vif)', pouletsVendus: 'Poulets sortis', prixMoyenTete: 'Prix moyen (FCFA / tête)', mortaliteMoyennePct: 'Mortalité moyenne (%)', lotsTraces: 'Lots tracés', lotsAvecQrPct: 'Lots avec QR (%)' };

// ---------- Diffusion des données agrégées, validée par le MAEDR ----------
export function PublicationsPage() {
  const s = useSession(); const [toast, show] = useToast();
  const pubs = useLiveQuery(() => db.publications.orderBy('createdAt').reverse().toArray(), [], [] as Publication[]);
  const [period, setPeriod] = useState(new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  const canPrepare = s.role === 'dge' || s.role === 'admin';
  const canValidate = s.role === 'maedr' || s.role === 'admin';
  const lab: Record<Publication['status'], [string, string]> = { brouillon: ['off', 'Brouillon'], soumise: ['sky', 'Soumise au MAEDR'], validee: ['on', 'Validée · publiée'], refusee: ['red', 'Refusée'] };
  async function prepare() {
    await save('publications', { id: uid(), period, createdAt: new Date().toISOString(), createdBy: s.userLabel, data: await aggregates(), status: 'soumise' }, 'diffusion soumise au MAEDR');
    show('Agrégats soumis au MAEDR');
  }
  const decide = (p: Publication, ok: boolean) => save('publications', { ...p, status: ok ? 'validee' : 'refusee', decidedBy: s.userLabel, decidedAt: today(), note: ok ? undefined : prompt('Motif du refus') ?? '' }, ok ? 'diffusion validée par le MAEDR' : 'diffusion refusée');
  return (
    <>
      <div className="top"><div><h1>Diffusion des données</h1><span className="muted">Seuls des indicateurs consolidés sont publiés, après validation du MAEDR. Page publique : <Link to="/statistiques">/statistiques</Link>.</span></div>
        {canPrepare && <div className="row" style={{ gap: 8 }}><input className="sel" value={period} onChange={(e) => setPeriod(e.target.value)} /><button className="sel dark" onClick={prepare}>Préparer et soumettre</button></div>}</div>
      {pubs.length === 0 && <div className="panel"><Empty title="Aucune diffusion" text="La DGE prépare les agrégats, le MAEDR les valide avant publication." /></div>}
      {pubs.map((p) => (
        <div key={p.id} className="panel">
          <div className="row between wrap"><h3>{p.period}</h3><span className={`pill ${lab[p.status][0]}`}>{lab[p.status][1]}</span></div>
          <div className="grid4">{Object.entries(p.data).map(([k, v]) => <div key={k} className="wk"><span className="l">{AGG_LABEL[k] ?? k}</span><span className="v">{fmtInt(v)}</span></div>)}</div>
          <span className="muted">Préparée par {p.createdBy} le {fmtDate(p.createdAt)}{p.decidedBy ? ` · décision de ${p.decidedBy} le ${fmtDate(p.decidedAt!)}${p.note ? ` : ${p.note}` : ''}` : ''}</span>
          {canValidate && p.status === 'soumise' && <div className="row" style={{ gap: 8 }}><button className="sel dark" onClick={() => decide(p, true)}>Valider la diffusion</button><button className="sel" onClick={() => decide(p, false)}>Refuser</button></div>}
        </div>
      ))}
      {toast}
    </>
  );
}

/** Page publique des statistiques validées par le MAEDR. */
export function PublicStats() {
  const pubs = useLiveQuery(() => db.publications.where('status').equals('validee').reverse().sortBy('createdAt'), [], [] as Publication[]);
  const last = pubs[0];
  return (
    <div className="m-shell">
      <div className="pub-hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.92),rgba(18,128,92,.8)),url(./img/poulailler.webp)' }}>
        <Link to="/" className="brand" style={{ color: '#fff' }}><Logo dark />Origa</Link>
        <h1>La filière avicole gabonaise en chiffres</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Indicateurs consolidés du programme POUFA, validés par le ministère.</span>
      </div>
      <div className="content" style={{ marginTop: -18 }}>
        {!last ? <div className="card"><Empty title="Aucune publication" text="Les premiers indicateurs seront publiés après validation du ministère." /></div> : (
          <div className="card"><h3>{last.period}</h3><div className="kpis">{Object.entries(last.data).map(([k, v]) => <div key={k} className="kpi"><span className="l">{AGG_LABEL[k] ?? k}</span><span className="v">{fmtInt(v)}</span></div>)}</div>
            <span className="muted">Validé le {fmtDate(last.decidedAt!)}. Aucune donnée individuelle n'est publiée.</span></div>
        )}
      </div>
    </div>
  );
}
