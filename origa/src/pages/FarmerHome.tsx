import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { Icon, Logo } from '../components/Icon';
import { SyncPill } from '../components/ui';
import { fmt, fmtDate, fmtInt, useBandStats, useCurrentBand, useSession, useSettings } from '../app/hooks';
import { addDays, daysBetween, today } from '../domain/ids';
import { vaccinationsDue } from '../domain/rules';
import { refWeight } from '../data/seed';
import { stockByType } from '../domain/kpis';

export function FarmerHome() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const stats = useBandStats(cur?.band);
  const settings = useSettings();
  const band = cur?.band;
  const extra = useLiveQuery(async () => {
    if (!band) return null;
    const [vacc, ws, todayEntry, inputs] = await Promise.all([
      db.vaccinations.where('bandId').equals(band.id).toArray(),
      db.weighings.where('bandId').equals(band.id).sortBy('date'),
      db.entries.where('[bandId+date]').equals([band.id, today()]).first(),
      db.inputs.where('farmId').equals(band.farmId).toArray(),
    ]);
    return { vacc: vacc.map((v) => v.vaccine), lastW: ws.at(-1)?.date, todayDone: !!todayEntry, stock: stockByType(inputs.filter((i) => i.bandId === band.id)) };
  }, [band?.id]);

  if (!cur) return null;
  if (!band || !stats) {
    return (
      <>
        <div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div>
        <div className="content"><div className="card"><h3>Aucune bande en cours</h3><span className="muted">Une bande s’ouvre à la réception des poussins.</span></div></div>
      </>
    );
  }
  const ref = settings.bandReferenceDays;
  const ageToday = daysBetween(band.placedAt, today());
  const due = vaccinationsDue(ageToday, extra?.vacc ?? [], settings);
  const weighingLate = !extra?.lastW || daysBetween(extra.lastW, today()) >= settings.weighingEveryDays;
  const feedStock = extra?.stock.aliment ?? 0;
  const dailyFeed = stats.feedKg / Math.max(1, stats.ageDays);
  const refW = refWeight(stats.ageDays);
  const refMort = 4.5;

  return (
    <>
      <div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div>
      <div className="content">
        <div className="hero">
          <div className="row between"><span className="kicker">{cur.farm?.name} · {cur.farm?.id}</span><span className="pill ghost">Bande {band.rank}</span></div>
          <h1>Jour {ageToday} sur {ref}<br />{fmtInt(stats.present)} poulets présents</h1>
          <div className="progress"><i style={{ width: `${Math.min(100, (ageToday / ref) * 100)}%` }} /></div>
          <div className="row between" style={{ fontSize: 13, color: '#CFE7DC' }}><span>Mise en place {fmtDate(band.placedAt)}</span><span>Sortie prévue {fmtDate(addDays(band.placedAt, ref))}</span></div>
        </div>

        <Link to="/fiche" className="cta" style={extra?.todayDone ? { background: 'var(--green-50)', color: 'var(--green)' } : undefined}>
          <Icon name="check" size={22} stroke={2.4} />{extra?.todayDone ? 'Fiche du jour remplie · modifier' : 'Remplir la fiche du jour'}
        </Link>

        <div className="kpis">
          <div className="kpi"><span className="l">Mortalité</span><span className="v">{fmt(stats.mortalityPct, 1)} %</span>
            <span className={`s ${stats.mortalityPct <= refMort ? 'ok' : 'bad'}`}>{stats.mortalityPct <= refMort ? '▼ sous' : '▲ au-dessus de'} la référence ({fmt(refMort, 1)} %)</span></div>
          <div className="kpi"><span className="l">Poids moyen</span><span className="v">{fmtInt(stats.avgWeightG)} g</span>
            <span className={`s ${stats.avgWeightG >= refW * 0.95 ? 'ok' : 'warn'}`}>GMQ {fmt(stats.gmq, 0)} g/jour</span></div>
          <div className="kpi"><span className="l">Indice de consommation</span><span className="v">{stats.ic ? fmt(stats.ic, 2) : '—'}</span><span className="s warn">Viabilité {fmt(stats.viabilityPct, 1)} %</span></div>
          <div className="kpi"><span className="l">Stock d'aliment</span><span className="v">{fmt(feedStock / 1000, 1)} t</span>
            <span className={`s ${feedStock / dailyFeed > 5 ? 'ok' : 'bad'}`}>≈ {fmtInt(feedStock / Math.max(1, dailyFeed))} jours</span></div>
        </div>

        <div className="actions">
          <Link to="/pesee" className="act"><div className="ico" style={{ background: 'var(--sky-50)' }}><Icon name="scale" color="#2F6FD1" /></div>Pesée</Link>
          <Link to="/sortie" className="act"><div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="truck" color="#12805C" /></div>Sortie</Link>
          <Link to="/sante" className="act"><div className="ico" style={{ background: 'var(--red-50)' }}><Icon name="heart" color="#D64545" /></div>Santé</Link>
          <Link to="/intrants" className="act"><div className="ico" style={{ background: 'var(--sun-50)' }}><Icon name="box" color="#B07D00" /></div>Intrants</Link>
        </div>

        <div className="card">
          <div className="row between"><h3>À faire aujourd'hui</h3><span className="pill sky">{due.length + (weighingLate ? 1 : 0) + (extra?.todayDone ? 0 : 1)}</span></div>
          {!extra?.todayDone && <span className="muted">• Fiche du jour : morts et aliment distribué</span>}
          {due.map((v) => <span key={v.vaccine} className="muted">• Vaccin {v.vaccine} prévu au jour {v.day}</span>)}
          {weighingLate && <span className="muted">• Pesée hebdomadaire de {settings.weighingSample} sujets</span>}
          {extra?.todayDone && !due.length && !weighingLate && <span className="muted">Tout est à jour. Bon travail !</span>}
        </div>
      </div>
    </>
  );
}
