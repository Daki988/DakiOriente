import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { fmt, fmtDate, fmtInt, mortClass, useSession, useSettings } from '../app/hooks';
import { api, apiEnabled } from '../app/api';
import { save } from '../data/repo';
import { useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { bandStats } from '../domain/kpis';
import { bandEconomics, inputGap, periodBounds, traceIndicators } from '../domain/analytics';
import { addDays, today } from '../domain/ids';
import { provinceName } from '../domain/provinces';
import { Logo } from '../components/Icon';
import { printPage } from '../app/native';

type Kind = 'hebdomadaire' | 'finBande' | 'mensuel';

interface Run { id: number; kind: Kind; period: string; label: string; sentAt: string; recipients: number; status: 'envoye' | 'echec'; error?: string; attempts: number }
const KIND_L: Record<Kind, string> = { hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel', finBande: 'Fin de bande' };
const WHEN: Record<Kind, string> = { hebdomadaire: 'chaque lundi, pour la semaine écoulée', mensuel: 'le 1er du mois, pour le mois écoulé', finBande: 'à la clôture de chaque bande' };
const sentAt = (d: string) => new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Envoi automatique des rapports par e-mail : fréquences, destinataires et journal des envois (DGE, administrateur). */
function ReportMail({ refresh }: { refresh: number }) {
  const st = useSettings(); const [toast, show] = useToast();
  const [runs, setRuns] = useState<Run[]>([]);
  const [add, setAdd] = useState('');
  const [d, setD] = useState(st.reports);
  useEffect(() => setD(st.reports), [st.reports]);
  useEffect(() => { if (apiEnabled) api<Run[]>('/reports/runs').then(setRuns).catch(() => setRuns([])); }, [refresh]);
  const recipients = d.recipients ?? [];
  const addOne = () => {
    const mail = add.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { show('Adresse e-mail invalide'); return; }
    if (!recipients.includes(mail)) setD({ ...d, recipients: [...recipients, mail] });
    setAdd('');
  };
  return (
    <div className="grid2 no-print">
      <div className="panel"><h3>Derniers envois</h3>
        {runs.length ? (
          <table className="tbl"><thead><tr><th>Envoyé le</th><th>Rapport</th><th>Période</th><th>Destinataires</th><th>État</th></tr></thead>
            <tbody>{runs.slice(0, 12).map((r) => <tr key={r.id}><td>{sentAt(r.sentAt)}</td><td>{KIND_L[r.kind]}</td><td>{r.label}</td><td>{r.recipients}</td>
              <td>{r.status === 'envoye' ? <span className="pill on">Envoyé</span> : <span className="pill red" title={r.error}>Échec · {r.attempts < 5 ? 'réessai prévu' : 'abandonné'}</span>}</td></tr>)}</tbody></table>
        ) : <div className="empty">{apiEnabled ? 'Aucun rapport envoyé pour le moment.' : 'En démonstration, aucun e-mail ne part : l’envoi est fait par le serveur national.'}</div>}
        <div className="note"><Icon name="info" size={18} />Chaque envoi contient le rapport en PDF et le détail par ferme en CSV. Un rapport n'est jamais envoyé deux fois pour la même période.</div>
      </div>
      <div className="panel"><h3>Envoi automatique par e-mail</h3>
        {(['hebdomadaire', 'mensuel', 'finBande'] as Kind[]).map((k) => (
          <label key={k} className="check"><input type="checkbox" checked={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.checked })} /><span><b>{KIND_L[k]}</b> · {WHEN[k]}</span></label>
        ))}
        <div className="f">Destinataires
          <div className="chips">{recipients.map((m) => <span key={m} className="chip">{m}<button aria-label={`Retirer ${m}`} style={{ marginLeft: 6 }} onClick={() => setD({ ...d, recipients: recipients.filter((x) => x !== m) })}>✕</button></span>)}
            {!recipients.length && <span className="muted">Aucun destinataire : aucun rapport ne part.</span>}</div>
          <div className="row"><input className="input" type="email" placeholder="adresse@exemple.ga" value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOne()} /><button className="sel" onClick={addOne}>Ajouter</button></div>
        </div>
        <button className="sel dark" style={{ alignSelf: 'flex-start' }} onClick={async () => { await save('settings', { ...st, reports: d }, 'réglage des rapports par e-mail'); show('Réglages enregistrés'); }}>Enregistrer</button>
      </div>
      {toast}
    </div>
  );
}

/** Rapports périodiques produits automatiquement pour chaque période écoulée, exportables en PDF (§ 5.4). */
export function ReportsPage() {
  const st = useSettings(); const s = useSession(); const [toast, show] = useToast();
  const manager = s.role === 'dge' || s.role === 'admin';
  const [refresh, setRefresh] = useState(0); const [sending, setSending] = useState(false);
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
  // Mortalité moyenne pondérée (morts cumulés / poussins mis en place), même définition que le rapport envoyé par le serveur.
  const withS = farmRows.filter((r) => r.s && r.band);
  const mortAvg = (withS.reduce((a, r) => a + r.s!.deaths, 0) / Math.max(1, withS.reduce((a, r) => a + r.band!.chicks, 0))) * 100;
  // Prix moyen par tête vendue, comme sur la vue nationale et le tableau du ministère.
  const pricedP = exitsP.filter((x) => x.unitPriceXaf);
  const pricePerHead = pricedP.reduce((a, x) => a + (x.unitPriceXaf ?? 0) * x.count, 0) / Math.max(1, pricedP.reduce((a, x) => a + x.count, 0));
  const title = kind === 'hebdomadaire' ? 'Rapport hebdomadaire' : kind === 'mensuel' ? 'Rapport mensuel national' : 'Rapport de fin de bande';

  const sendNow = async () => {
    if (!apiEnabled) { show('En démonstration, aucun e-mail ne part : utilisez « Exporter en PDF »'); return; }
    setSending(true);
    try {
      const r = await api<{ recipients: string[] }>('/reports/send', { method: 'POST', body: JSON.stringify({ kind, bandId: kind === 'finBande' ? period?.key : undefined }) });
      show(`Rapport envoyé à ${r.recipients.length} destinataire(s)`); setRefresh((x) => x + 1);
    } catch (e) { show((e as Error).message); } finally { setSending(false); }
  };

  return (
    <>
      <div className="top no-print">
        <div><h1>Rapports</h1><span className="muted">Générés automatiquement pour chaque période écoulée, exportables en PDF{manager ? ' et envoyés par e-mail aux destinataires' : ''}.</span></div>
        <div className="row wrap" style={{ gap: 8 }}>
          {kinds.map((k) => <button key={k} className={`sel${kind === k ? ' dark' : ''}`} onClick={() => { setKind(k); setSel(''); }}>{k === 'hebdomadaire' ? 'Hebdomadaire' : k === 'mensuel' ? 'Mensuel national' : 'Fin de bande'}</button>)}
          <select className="sel" value={period?.key ?? ''} onChange={(e) => setSel(e.target.value)}>{periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
          <button className={manager ? 'sel' : 'sel dark'} onClick={() => printPage()}>Exporter en PDF</button>
          {manager && <button className="sel dark" disabled={sending || (kind === 'finBande' && !period)} onClick={sendNow}>{sending ? 'Envoi…' : 'Envoyer maintenant'}</button>}
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
            <div className="wk"><span className="l">Prix moyen</span><span className="v">{pricedP.length ? fmtInt(pricePerHead) : '—'}</span><span className="s">FCFA par tête vendue</span></div>
            <div className="wk"><span className="l">Lots avec QR</span><span className={`v ${trace.lots ? (trace.qrTargetMet ? 'ok' : 'bad') : ''}`}>{trace.lots ? `${fmt(trace.qrPct, 0)} %` : '—'}</span><span className="s">seuil de recette 95 %</span></div>
            <div className="wk"><span className="l">Ventes rattachées à un lot</span><span className="v">{trace.lots || exitsP.length ? `${fmt(trace.salesLinkedPct, 0)} %` : '—'}</span><span className="s">{trace.lots} lot(s) tracé(s)</span></div>
          </div>
          <table className="tbl">
            <thead><tr><th>Ferme</th><th>Province</th><th>Bande</th><th>Effectif</th><th>Mortalité</th><th>IC</th><th>Complétude</th><th>Produit (kg)</th><th>Écart intrants</th></tr></thead>
            <tbody>{farmRows.map((r) => (
              <tr key={r.f.id}><td>{r.f.id} {r.f.name.replace('Ferme ', '')}</td><td>{provinceName(r.f.province)}</td><td>{r.band?.rank ?? '—'}</td><td>{r.s ? fmtInt(r.s.present) : '—'}</td>
                <td className={r.s ? mortClass(r.s.mortalityPct, st) : ''}>{r.s ? `${fmt(r.s.mortalityPct, 1)} %` : '—'}</td><td>{r.s?.ic ? fmt(r.s.ic, 2) : '—'}</td><td>{r.s ? `${fmt(r.s.completenessPct, 0)} %` : '—'}</td>
                <td>{fmtInt(r.produced)}</td><td className={r.gap.gapPct !== undefined && Math.abs(r.gap.gapPct) > st.inputGapPct ? 'bad' : ''}>{r.gap.gapPct === undefined ? '—' : `${fmt(r.gap.gapPct, 1)} %`}</td></tr>
            ))}</tbody>
          </table>
          {alertsP.length > 0 && <><h3>Alertes de la période</h3>{alertsP.map((a) => <div key={a.id} className="muted">{fmtDate(a.createdAt)} · {a.farmId} · {a.message} · {a.status}</div>)}</>}
        </div>
      )}
      {manager && <ReportMail refresh={refresh} />}
      {toast}
    </>
  );
}
