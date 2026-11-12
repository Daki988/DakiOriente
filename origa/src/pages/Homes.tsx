import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useNational } from '../app/national';
import { api, apiEnabled } from '../app/api';
import { setSession } from '../app/sessionStore';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { bandEconomics } from '../domain/analytics';
import { addDays, daysBetween, today } from '../domain/ids';
import { vaccinationsDue } from '../domain/rules';
import { provinceName } from '../domain/provinces';
import { Empty, SyncPill } from '../components/ui';
import { Icon, Logo } from '../components/Icon';
import { aggregates, AGG_LABEL } from './Pilotage';
import type { Farm } from '../domain/types';

/** Ferme visible par la BCEG : financée, avec un consentement de l'exploitant toujours valable. */
export const bcegVisible = (f: Farm) => !!f.bcegFinanced && !!f.bcegConsentAt && !f.bcegConsentRevokedAt;
const farmOfBand = (bandId: string) => bandId.split('-B')[0];
const M = (xaf: number) => `${fmt(xaf / 1e6, 1)} M`;

// ---------- Services vétérinaires : la situation sanitaire ----------
export function VetHome() {
  const st = useSettings();
  const national = useNational();
  const data = useLiveQuery(async () => {
    const [alerts, treatments, vaccinations, consultations, biosecurity, diagnostics] = await Promise.all([
      db.alerts.toArray(), db.treatments.toArray(), db.vaccinations.toArray(), db.consultations.toArray(), db.biosecurity.toArray(), db.diagnostics.toArray(),
    ]);
    return { alerts, treatments, vaccinations, consultations, biosecurity, diagnostics };
  }, []);
  if (!national || !data) return null;
  const now = today();
  const name = (id: string) => national.rows.find((r) => r.farm.id === id)?.farm.name ?? id;
  const count = (status: string) => data.alerts.filter((a) => a.status === status).length;
  const open = data.alerts.filter((a) => ['nouvelle', 'analyse', 'confirmee'].includes(a.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const watch = national.rows.filter((r) => r.st && r.farm.status === 'operationnelle').sort((a, b) => b.st!.mortalityPct - a.st!.mortalityPct).slice(0, 6);
  const late = national.rows.flatMap((r) => {
    if (!r.band) return [];
    const done = data.vaccinations.filter((v) => v.bandId === r.band!.id).map((v) => v.vaccine);
    return vaccinationsDue(daysBetween(r.band.placedAt, now), done, st).map((v) => ({ farm: r.farm, vaccine: v.vaccine, day: v.day }));
  });
  const withdrawal = data.treatments.filter((t) => addDays(t.endDate, t.withdrawalDays) > now);
  const waiting = data.consultations.filter((c) => c.status === 'ouverte');
  const lastBio = new Map<string, number>();
  for (const b of [...data.biosecurity].sort((a, z) => a.date.localeCompare(z.date))) lastBio.set(b.farmId, b.scorePct);
  const weakBio = [...lastBio.entries()].filter(([, v]) => v < 70);

  return (
    <>
      <div className="top"><div><h1>Situation sanitaire</h1><span className="muted">Services vétérinaires · données au {fmtDate(now)} · seuil d’alerte {fmt(st.alertDailyMortalityPct, 1)} % de mortalité par jour</span></div>
        <Link className="sel dark" to="/alertes">Qualifier les alertes</Link></div>
      <div className="grid4">
        <Link to="/alertes" className="wk"><span className="l">Alertes à qualifier</span><span className={`v ${count('nouvelle') ? 'bad' : 'ok'}`}>{count('nouvelle')}</span><span className="s">{count('analyse')} en analyse · {count('confirmee')} confirmée(s)</span></Link>
        <div className="wk"><span className="l">Vaccinations à faire</span><span className={`v ${late.length ? 'warn' : 'ok'}`}>{late.length}</span><span className="s">sur {national.rows.filter((r) => r.band).length} bandes en cours</span></div>
        <div className="wk"><span className="l">Lots sous délai d’attente</span><span className={`v ${withdrawal.length ? 'warn' : 'ok'}`}>{withdrawal.length}</span><span className="s">traitement(s) : vente bloquée</span></div>
        <Link to="/assistance" className="wk"><span className="l">Questions des éleveurs</span><span className={`v ${waiting.length ? 'warn' : 'ok'}`}>{waiting.length}</span><span className="s">sans réponse</span></Link>
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="row between"><h3>Alertes ouvertes</h3><Link className="sel" to="/alertes">Tout voir</Link></div>
          {open.length === 0 && <div className="empty">Aucune alerte ouverte.</div>}
          {open.slice(0, 6).map((a) => (
            <Link key={a.id} to="/alertes" className="li"><div className="grow"><b>{a.farmId} · {name(a.farmId)}</b><span>{a.message} · {fmtDate(a.createdAt)}</span></div>
              <span className={`pill ${a.status === 'analyse' ? 'off' : 'red'}`}>{a.status === 'nouvelle' ? 'À qualifier' : a.status === 'analyse' ? 'En analyse' : 'Confirmée'}</span></Link>
          ))}
        </div>
        <div className="panel">
          <h3>Mortalité des bandes en cours</h3>
          <table className="tbl"><thead><tr><th>Ferme</th><th>Province</th><th>Âge</th><th>Mortalité</th></tr></thead>
            <tbody>{watch.map((r) => <tr key={r.farm.id}><td>{r.farm.id} {r.farm.name.replace('Ferme ', '')}</td><td>{provinceName(r.farm.province)}</td><td>{r.st!.ageDays} j</td>
              <td className={r.st!.mortalityPct > 5 ? 'bad' : ''}>{fmt(r.st!.mortalityPct, 1)} %</td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Vaccinations à faire ou en retard</h3>
          {late.length === 0 && <div className="empty">Le calendrier vaccinal est respecté partout.</div>}
          {late.slice(0, 8).map((v) => <div key={`${v.farm.id}-${v.vaccine}`} className="li"><div className="grow"><b>{v.farm.id} · {v.farm.name}</b><span>{v.vaccine} · prévu au jour {v.day}</span></div></div>)}
        </div>
        <div className="panel">
          <h3>Biosécurité et diagnostics</h3>
          <div className="li"><div className="grow"><b>{weakBio.length} ferme(s) sous 70 % de conformité</b><span>{weakBio.map(([id, v]) => `${id} (${fmt(v, 0)} %)`).join(' · ') || 'Aucune'}</span></div><Link className="pill sky" to="/biosecurite">Voir</Link></div>
          <div className="li"><div className="grow"><b>{data.diagnostics.filter((d) => d.date >= addDays(now, -30)).length} diagnostic(s) sur 30 jours</b><span>Dernier : {data.diagnostics.sort((a, b) => b.date.localeCompare(a.date))[0]?.diagnostic ?? 'aucun'}</span></div><Link className="pill sky" to="/diagnostics">Voir</Link></div>
        </div>
      </div>
    </>
  );
}

// ---------- BCEG : le portefeuille des fermes financées ----------
export function BcegHome() {
  const national = useNational();
  const data = useLiveQuery(async () => ({ charges: await db.charges.toArray() }), []);
  if (!national || !data) return null;
  const financed = national.rows.filter((r) => r.farm.bcegFinanced);
  const rows = financed.filter((r) => bcegVisible(r.farm));
  const hidden = financed.length - rows.length;
  const eco = rows.map((r) => {
    const exits = national.exits.filter((x) => farmOfBand(x.bandId) === r.farm.id);
    return { r, eco: bandEconomics(exits, data.charges.filter((c) => c.farmId === r.farm.id)), sold: exits.reduce((a, x) => a + x.count, 0) };
  });
  const tot = eco.reduce((a, e) => ({ rev: a.rev + e.eco.revenue, cost: a.cost + e.eco.cost }), { rev: 0, cost: 0 });
  const present = rows.reduce((a, r) => a + (r.st?.present ?? 0), 0);
  const inDeficit = eco.filter((e) => e.eco.cost > 0 && e.eco.margin < 0).length;

  return (
    <>
      <div className="top"><div><h1>Portefeuille BCEG</h1><span className="muted">Fermes financées par la BCEG. Seules celles dont l’exploitant a donné son consentement sont visibles.</span></div>
        <Link className="sel dark" to="/economie">Suivi économique</Link></div>
      <div className="grid4">
        <div className="wk"><span className="l">Fermes financées suivies</span><span className="v">{rows.length}</span><span className="s">{hidden ? `${hidden} sans consentement : données masquées` : 'toutes avec consentement'}</span></div>
        <div className="wk"><span className="l">Chiffre d’affaires déclaré</span><span className="v">{M(tot.rev)}</span><span className="s">FCFA, toutes bandes</span></div>
        <div className="wk"><span className="l">Marge</span><span className={`v ${tot.rev - tot.cost < 0 ? 'bad' : 'ok'}`}>{M(tot.rev - tot.cost)}</span><span className="s">{inDeficit} ferme(s) en déficit</span></div>
        <div className="wk"><span className="l">Poulets en élevage</span><span className="v">{fmtInt(present)}</span><span className="s">{rows.filter((r) => r.band).length} bande(s) en cours</span></div>
      </div>
      <div className="panel">
        <h3>Fermes du portefeuille</h3>
        {rows.length === 0 ? <div className="empty">Aucune ferme financée avec consentement.</div> : (
          <table className="tbl"><thead><tr><th>Ferme</th><th>Province</th><th>Bande en cours</th><th>Mortalité</th><th>Poulets vendus</th><th>Chiffre d’affaires</th><th>Charges</th><th>Marge</th><th>Domiciliation</th></tr></thead>
            <tbody>{eco.map(({ r, eco: e, sold }) => (
              <tr key={r.farm.id} className="click" onClick={() => { location.hash = `#/fermes/${r.farm.id}`; }}>
                <td>{r.farm.id} {r.farm.name.replace('Ferme ', '')}</td><td>{provinceName(r.farm.province)}</td>
                <td>{r.band ? `Bande ${r.band.rank} · jour ${r.st?.ageDays ?? '—'}` : '—'}</td><td>{r.st ? `${fmt(r.st.mortalityPct, 1)} %` : '—'}</td>
                <td>{fmtInt(sold)}</td><td>{fmtInt(e.revenue)}</td><td>{fmtInt(e.cost)}</td><td className={e.margin < 0 ? 'bad' : 'ok'}>{fmtInt(e.margin)}</td><td>{r.farm.incomeAccount ?? '—'}</td>
              </tr>
            ))}</tbody></table>
        )}
        <span className="muted">Montants en FCFA. La BCEG ne voit ni les alertes sanitaires ni les traitements des fermes.</span>
      </div>
    </>
  );
}

// ---------- MAEDR : les indicateurs nationaux et les diffusions à valider ----------
export function MaedrHome() {
  const [agg, setAgg] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    (apiEnabled ? api<Record<string, number>>('/stats/aggregates') : aggregates()).then(setAgg).catch(() => setAgg({}));
  }, []);
  const pubs = useLiveQuery(() => db.publications.orderBy('createdAt').reverse().toArray(), [], []);
  const pending = pubs.filter((p) => p.status === 'soumise');
  const last = pubs.find((p) => p.status === 'validee');
  const keys = ['fermesActives', 'volumeKg', 'pouletsVendus', 'prixMoyenTete', 'mortaliteMoyennePct', 'lotsTraces', 'lotsAvecQrPct'];

  return (
    <>
      <div className="top"><div><h1>Tableau de bord du ministère</h1><span className="muted">Indicateurs consolidés de la filière, sans donnée individuelle. Vous validez les diffusions avant leur publication.</span></div>
        <Link className="sel dark" to="/diffusion">Diffusions à valider{pending.length ? ` (${pending.length})` : ''}</Link></div>
      <div className="grid4">
        {keys.map((k) => <div key={k} className="wk"><span className="l">{AGG_LABEL[k]}</span><span className="v">{agg && k in agg ? (k.endsWith('Pct') ? `${fmt(agg[k], 1)} %` : fmtInt(agg[k])) : '—'}</span></div>)}
        <Link to="/diffusion" className="wk"><span className="l">Diffusions en attente</span><span className={`v ${pending.length ? 'warn' : 'ok'}`}>{pending.length}</span><span className="s">soumises par la DGE</span></Link>
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="row between"><h3>À valider</h3><Link className="sel" to="/diffusion">Ouvrir</Link></div>
          {pending.length === 0 && <div className="empty">Aucune diffusion en attente de votre décision.</div>}
          {pending.map((p) => <Link key={p.id} to="/diffusion" className="li"><div className="grow"><b>{p.period}</b><span>Préparée par {p.createdBy} le {fmtDate(p.createdAt)}</span></div><span className="pill sky">Examiner</span></Link>)}
        </div>
        <div className="panel">
          <h3>Dernière publication</h3>
          {last ? <div className="li"><div className="grow"><b>{last.period}</b><span>Validée le {fmtDate(last.decidedAt ?? last.createdAt)} par {last.decidedBy}</span></div><Link className="pill on" to="/statistiques">Page publique</Link></div>
            : <div className="empty">Rien n’a encore été publié.</div>}
          <span className="muted">La page publique affiche uniquement la dernière diffusion validée.</span>
        </div>
      </div>
    </>
  );
}

// ---------- Agent technique : les fermes qu'il suit ----------
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; };
export function AgentHome() {
  const s = useSession();
  const nav = useNavigate();
  const national = useNational();
  const data = useLiveQuery(async () => {
    const [entries, visits] = await Promise.all([db.entries.where('date').equals(today()).toArray(), db.visits.toArray()]);
    return { entries, visits };
  }, []);
  if (!national || !data) return null;
  const mine = national.rows.filter((r) => s.farmIds?.includes(r.farm.id));
  const filled = (bandId?: string) => !!bandId && data.entries.some((e) => e.bandId === bandId);
  const lastVisit = (farmId: string) => data.visits.filter((v) => v.farmId === farmId).sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const monthStart = `${today().slice(0, 7)}-01`;
  const open = (farmId: string) => { setSession({ ...s, farmId }); nav('/ferme'); };

  return (
    <>
      <div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div>
      <div className="greet">{greeting()}, {s.userLabel.split(' · ')[0]}</div>
      <div className="content">
        <div className="hero">
          <span className="kicker">Agent technique · {mine.length} ferme(s) suivie(s)</span>
          <h1>{mine.filter((r) => filled(r.band?.id)).length} fiche(s) du jour sur {mine.filter((r) => r.band).length}</h1>
          <div className="progress"><i style={{ width: `${(mine.filter((r) => filled(r.band?.id)).length / Math.max(1, mine.filter((r) => r.band).length)) * 100}%` }} /></div>
          <div className="row between" style={{ fontSize: 13, color: '#CFE7DC' }}><span>{mine.reduce((a, r) => a + r.alerts, 0)} alerte(s) ouverte(s)</span><span>{data.visits.filter((v) => v.date >= monthStart && s.farmIds?.includes(v.farmId)).length} visite(s) ce mois</span></div>
        </div>
        {mine.length === 0 && <div className="card"><Empty title="Aucune ferme rattachée" text="L’administrateur rattache les fermes à votre compte." /></div>}
        {mine.map((r) => (
          <button key={r.farm.id} className="card farmcard" onClick={() => open(r.farm.id)}>
            <div className="row between"><b>{r.farm.name}</b><span className={`pill ${r.alerts ? 'red' : r.band ? 'on' : 'off'}`}>{r.alerts ? `${r.alerts} alerte(s)` : r.band ? `Bande ${r.band.rank}` : 'Sans bande'}</span></div>
            <span className="muted">{r.farm.id} · {r.farm.locality}</span>
            {r.band && r.st && <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <span className="muted">Jour <b>{r.st.ageDays}</b></span><span className="muted"><b>{fmtInt(r.st.present)}</b> poulets</span>
              <span className="muted">Mortalité <b className={r.st.mortalityPct > 5 ? 'bad' : ''}>{fmt(r.st.mortalityPct, 1)} %</b></span></div>}
            <div className="row between"><span className={filled(r.band?.id) ? 'ok' : 'warn'} style={{ fontSize: 13, fontWeight: 600 }}>{r.band ? (filled(r.band.id) ? 'Fiche du jour remplie' : 'Fiche du jour à remplir') : 'Aucune saisie attendue'}</span>
              <span className="muted">Dernière visite : {lastVisit(r.farm.id) ? fmtDate(lastVisit(r.farm.id)!) : 'aucune'}</span></div>
          </button>
        ))}
        <div className="row"><Link to="/visites" className="cta light" style={{ flex: 1, fontSize: 16 }}><Icon name="pin" />Visite</Link><Link to="/fermes/nouvelle" className="cta light" style={{ flex: 1, fontSize: 16 }}><Icon name="farm" />Enrôler</Link></div>
      </div>
    </>
  );
}
