import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { Icon, Logo } from '../components/Icon';
import { BackBar, Empty, SyncPill } from '../components/ui';
import { fmt, fmtDate, fmtInt, fmtLongDate, useBandStats, useCurrentBand, useDesktop, useSession, useSettings } from '../app/hooks';
import { GrowthChart } from '../components/GrowthChart';
import { Qr } from '../components/Qr';
import { publicUrl } from '../domain/qr';
import { publicBase } from '../app/publicBase';
import { lotStatus } from '../domain/analytics';
import { addDays, daysBetween, today } from '../domain/ids';
import { vaccinationsDue } from '../domain/rules';
import { refWeight } from '../data/seed';
import { stockByType } from '../domain/kpis';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; };

export function FarmerHome() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const stats = useBandStats(cur?.band);
  const settings = useSettings();
  const desktop = useDesktop();
  const band = cur?.band;
  const extra = useLiveQuery(async () => {
    if (!band) return null;
    const [vacc, ws, todayEntry, inputs] = await Promise.all([
      db.vaccinations.where('bandId').equals(band.id).toArray(),
      db.weighings.where('bandId').equals(band.id).sortBy('date'),
      db.entries.where('[bandId+date]').equals([band.id, today()]).first(),
      db.inputs.where('farmId').equals(band.farmId).toArray(),
    ]);
    const lots = (await db.lots.where('farmId').equals(band.farmId).toArray()).filter((l) => !l.parentId).sort((a, b) => b.cededAt.localeCompare(a.cededAt)).slice(0, 3);
    return { vacc: vacc.map((v) => v.vaccine), weighings: ws, lastW: ws.at(-1)?.date, todayDone: !!todayEntry, stock: stockByType(inputs.filter((i) => i.bandId === band.id)), lots };
  }, [band?.id]);

  if (!cur) return null;
  // L'agent arrive ici depuis la liste de ses fermes : un retour remplace le logo.
  const head = s.role === 'agent'
    ? <BackBar title={cur.farm?.name ?? 'Ferme suivie'} sub={`Ferme suivie · ${cur.farm?.id ?? ''}`} right={<SyncPill />} />
    : <><div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div><div className="greet">{greeting()}, {s.userLabel.split(' · ')[0]}</div></>;
  if (!band || !stats) {
    return (
      <>
        {head}
        <div className="content"><div className="card"><Empty img="./img/poussin.webp" title="Aucune bande en cours" text="Une bande s’ouvre à la réception des poussins."><Link to="/bande/nouvelle" className="cta" style={{ width: 'auto' }}>Ouvrir une bande</Link></Empty></div></div>
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

  const todoCount = due.length + (weighingLate ? 1 : 0) + (extra?.todayDone ? 0 : 1);
  const todo = (
    <>
      {!extra?.todayDone && <span className="muted">• Fiche du jour : morts et aliment distribué</span>}
      {due.map((v) => <Link key={v.vaccine} to="/vaccinations" className="muted">• Vaccin {v.vaccine} prévu au jour {v.day} · <b style={{ color: 'var(--green)' }}>enregistrer</b></Link>)}
      {weighingLate && <Link to="/pesee" className="muted">• Pesée hebdomadaire de {settings.weighingSample} sujets</Link>}
      {extra?.todayDone && !due.length && !weighingLate && <span className="muted">Tout est à jour. Bon travail !</span>}
    </>
  );
  const kpis = (
    <div className="kpis">
      <div className="kpi"><span className="l">Mortalité</span><span className="v">{fmt(stats.mortalityPct, 1)} %</span>
        <span className={`s ${stats.mortalityPct <= refMort ? 'ok' : 'bad'}`}>{stats.mortalityPct <= refMort ? '▼ sous' : '▲ au-dessus de'} la référence ({fmt(refMort, 1)} %)</span></div>
      <div className="kpi"><span className="l">Poids moyen</span><span className="v">{fmtInt(stats.avgWeightG)} g</span>
        <span className={`s ${stats.avgWeightG >= refW * 0.95 ? 'ok' : 'warn'}`}>GMQ {fmt(stats.gmq, 0)} g/jour</span></div>
      <div className="kpi"><span className="l">Indice de consommation</span><span className="v">{stats.ic ? fmt(stats.ic, 2) : '—'}</span><span className="s warn">Viabilité {fmt(stats.viabilityPct, 1)} %</span></div>
      <div className="kpi"><span className="l">Stock d'aliment</span><span className="v">{fmt(feedStock / 1000, 1)} t</span>
        <span className={`s ${feedStock / dailyFeed > 5 ? 'ok' : 'bad'}`}>≈ {fmtInt(feedStock / Math.max(1, dailyFeed))} jours</span></div>
    </div>
  );

  // Ordinateur : maquette Figma « Version ordinateur · Éleveur — Accueil ».
  if (desktop) {
    return (
      <>
        <div className="top">
          <div><h1>{s.role === 'agent' ? cur.farm?.name : `${greeting()}, ${s.userLabel.split(' · ')[0]}`}</h1><span className="muted">{cur.farm?.name} · {cur.farm?.id} · {fmtLongDate(today())}</span></div>
          <div className="row" style={{ alignItems: 'center' }}><SyncPill />
            <Link to="/fiche" className={`cta sm${extra?.todayDone ? ' light' : ''}`}><Icon name="check" size={20} stroke={2.4} />{extra?.todayDone ? 'Fiche du jour remplie · modifier' : 'Remplir la fiche du jour'}</Link></div>
        </div>
        <div className="desk2">
          <div className="hero">
            <div className="row between"><span className="kicker">Bande {band.rank} · en cours</span><span className="pill ghost">Jour {ageToday} sur {ref}</span></div>
            <h1>{fmtInt(stats.present)} poulets présents</h1>
            <div className="progress"><i style={{ width: `${Math.min(100, (ageToday / ref) * 100)}%` }} /></div>
            <div className="row between" style={{ fontSize: 13, color: '#CFE7DC' }}><span>Mise en place {fmtDate(band.placedAt)} · {fmtInt(band.chicks)} poussins</span><span>Sortie prévue {fmtDate(addDays(band.placedAt, ref))}</span></div>
          </div>
          <div className="panel">
            <div className="row between"><h3>À faire aujourd'hui</h3><span className="pill sky">{todoCount}</span></div>
            <div className="todo">{todo}</div>
          </div>
        </div>
        {kpis}
        <div className="desk2">
          <div className="panel"><h3>Croissance de la bande</h3>
            <GrowthChart placedAt={band.placedAt} initialWeightG={band.initialWeightG} weighings={extra?.weighings ?? []} days={Math.max(stats.ageDays, ref - 3)} wide /></div>
          <div className="panel"><div className="row between"><h3>Derniers lots cédés</h3><Link to="/lots" className="muted"><b style={{ color: 'var(--green)' }}>Tous les lots</b></Link></div>
            {(extra?.lots ?? []).length === 0 && <span className="muted">Aucun lot cédé pour l'instant.</span>}
            {(extra?.lots ?? []).map((l) => (
              <Link key={l.id} to={`/lots/${l.id}`} className="li">
                <div style={{ width: 56, height: 56, flex: 'none' }}>{l.signature ? <Qr value={publicUrl(publicBase(), l.id, l.signature)} size={56} /> : <div className="ico" style={{ background: 'var(--sky-50)', width: 56, height: 56 }}><Icon name="qr" color="#2F6FD1" /></div>}</div>
                <div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.count)} poulets · {fmtDate(l.cededAt)}</span></div>
                <span className={`pill ${lotStatus(l).validated ? 'on' : 'sky'}`}>{lotStatus(l).label}</span>
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
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

        {kpis}

        <div className="actions">
          <Link to="/pesee" className="act"><div className="ico" style={{ background: 'var(--sky-50)' }}><Icon name="scale" color="#2F6FD1" /></div>Pesée</Link>
          <Link to="/sortie" className="act"><div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="truck" color="#12805C" /></div>Sortie</Link>
          <Link to="/sante" className="act"><div className="ico" style={{ background: 'var(--red-50)' }}><Icon name="heart" color="#D64545" /></div>Santé</Link>
          <Link to="/intrants" className="act"><div className="ico" style={{ background: 'var(--sun-50)' }}><Icon name="box" color="#B07D00" /></div>Intrants</Link>
        </div>

        <div className="card">
          <div className="row between"><h3>À faire aujourd'hui</h3><span className="pill sky">{todoCount}</span></div>
          {todo}
        </div>
      </div>
    </>
  );
}
