import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, Empty, Stepper, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { GrowthChart } from '../components/GrowthChart';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { bandStats } from '../domain/kpis';
import { bandEconomics } from '../domain/analytics';
import { bandId, daysBetween, nextSeq, today, uid } from '../domain/ids';
import type { Band } from '../domain/types';

/** Historique et bilans des bandes : aucune suppression ; une bande clôturée est en lecture seule (§ 5.1). */
export function BandsPage() {
  const s = useSession();
  const settings = useSettings();
  const [toast, show] = useToast();
  const [closing, setClosing] = useState<string | null>(null);
  const rows = useLiveQuery(async () => {
    if (!s.farmId) return [];
    const bands = await db.bands.where('farmId').equals(s.farmId).reverse().sortBy('rank');
    return Promise.all(bands.map(async (b) => {
      const [e, w, x, c] = await Promise.all([
        db.entries.where('bandId').equals(b.id).toArray(), db.weighings.where('bandId').equals(b.id).toArray(),
        db.exits.where('bandId').equals(b.id).toArray(), db.charges.where('bandId').equals(b.id).toArray(),
      ]);
      const st = bandStats(b, e, w, x, settings, today());
      return { b, st, w, eco: bandEconomics(x, c, st) };
    }));
  }, [s.farmId, settings], []);
  const open = rows.find((r) => !r.b.closedAt);

  async function close(b: Band, present: number) {
    await save('bands', { ...b, closedAt: today() }, present > 0 ? `clôture manuelle (${present} présents)` : 'clôture de bande');
    setClosing(null); show('Bande clôturée : bilan figé, lecture seule');
  }

  return (
    <>
      <div className="back"><div style={{ flex: 1 }}><h2>Mes bandes</h2><div className="sub">Bilan automatique à la clôture</div></div></div>
      <div className="content">
        {!open && <Link to="/bande/nouvelle" className="cta"><Icon name="plus" />Ouvrir une bande (réception des poussins)</Link>}
        {rows.length === 0 && <div className="card"><Empty img="./img/poussin.webp" title="Aucune bande" text="Une bande s’ouvre à la réception des poussins." /></div>}
        {rows.map(({ b, st, w, eco }) => (
          <div key={b.id} className="card">
            <div className="row between"><h3>Bande {b.rank} · {b.strain}</h3><span className={`pill ${b.closedAt ? 'sky' : 'on'}`}>{b.closedAt ? 'Clôturée' : 'En cours'}</span></div>
            <span className="muted">{b.id} · mise en place {fmtDate(b.placedAt)} · {fmtInt(b.chicks)} poussins{b.closedAt ? ` · clôture ${fmtDate(b.closedAt)} · ${daysBetween(b.placedAt, b.closedAt)} jours` : ''}</span>
            <div className="kpis">
              <div className="kpi"><span className="l">Mortalité</span><span className="v">{fmt(st.mortalityPct, 1)} %</span><span className="s">Viabilité {fmt(st.viabilityPct, 1)} %</span></div>
              <div className="kpi"><span className="l">IC</span><span className="v">{st.ic ? fmt(st.ic, 2) : '—'}</span><span className="s">GMQ {fmt(st.gmq, 0)} g/j · EPEF {st.epef ? fmt(st.epef, 0) : '—'}</span></div>
              <div className="kpi"><span className="l">Sortis</span><span className="v">{fmtInt(st.exited)}</span><span className="s">{fmt(st.exitedWeightKg / 1000, 2)} t de poids vif</span></div>
              <div className="kpi"><span className="l">Marge</span><span className={`v ${eco.margin < 0 ? 'bad' : ''}`}>{eco.revenue || eco.cost ? `${fmtInt(eco.margin / 1000)} k` : '—'}</span><span className="s">CA {fmtInt(eco.revenue)} · charges {fmtInt(eco.cost)} FCFA</span></div>
            </div>
            {!b.closedAt && <>
              <GrowthChart placedAt={b.placedAt} initialWeightG={b.initialWeightG} weighings={w} days={Math.max(st.ageDays, 42)} />
              {closing === b.id ? (
                <div className="note sun" style={{ flexDirection: 'column' }}>
                  <span>{st.present > 0 ? `Il reste ${fmtInt(st.present)} animaux présents. Clôturer quand même (clôture manuelle) ?` : 'Effectif nul : la bande peut être clôturée.'} Le bilan sera figé et la bande passera en lecture seule.</span>
                  <div className="row"><button className="cta green" onClick={() => close(b, st.present)}>Confirmer la clôture</button><button className="cta light" onClick={() => setClosing(null)}>Annuler</button></div>
                </div>
              ) : <button className="cta light" onClick={() => setClosing(b.id)}>Clôturer la bande et figer le bilan</button>}
            </>}
          </div>
        ))}
      </div>
      {toast}
    </>
  );
}

const STRAINS = ['Cobb 500', 'Ross 308', 'Arbor Acres', 'Hubbard', 'Autre'];

/** Ouverture d'une bande à la réception des poussins, avec saisie de rattrapage possible (§ 5.1). */
export function BandOpen() {
  const s = useSession();
  const nav = useNavigate();
  const [toast, show] = useToast();
  const farms = useLiveQuery(() => db.farms.toArray(), [], []);
  const mine = farms.filter((f) => (s.role === 'eleveur' ? f.id === s.farmId : s.farmIds?.includes(f.id) ?? true));
  const [farmId, setFarmId] = useState(s.farmId ?? '');
  const [date, setDate] = useState(today());
  const [chicks, setChicks] = useState(1000);
  const [weight, setWeight] = useState(42);
  const [strain, setStrain] = useState(STRAINS[0]);
  const [supplierLot, setSupplierLot] = useState('');
  const [withDelivery, setWithDelivery] = useState(true);
  const [error, setError] = useState('');
  const farm = farms.find((f) => f.id === farmId);

  async function submit() {
    setError('');
    if (!farm) return setError('Choisissez la ferme.');
    if (chicks <= 0) return setError('Indiquez le nombre de poussins reçus.');
    if (date > today()) return setError('La date de réception ne peut pas être dans le futur.');
    const bands = await db.bands.where('farmId').equals(farm.id).toArray();
    if (bands.some((b) => !b.closedAt)) return setError('Une bande est déjà en cours dans cette ferme : clôturez-la d’abord.');
    const rank = nextSeq(bands.map((b) => b.id), `${farm.id}-B`, /^(\d{2})$/);
    const band: Band = { id: bandId(farm.id, rank), farmId: farm.id, rank, placedAt: date, chicks, initialWeightG: weight, strain };
    await save('bands', band, date < today() ? `ouverture de bande (rattrapage, J+${daysBetween(date, today())})` : 'ouverture de bande');
    if (withDelivery) await save('inputs', { id: uid(), farmId: farm.id, bandId: band.id, date, type: 'poussins', product: `Poussins d'un jour ${strain}`, quantity: chicks, unit: 'têtes', kind: 'reception', supplier: 'Couvoir', supplierLot: supplierLot || undefined, subsidized: true, confirmed: true }, 'réception des poussins');
    if (farm.capacity && chicks > farm.capacity) show(`Attention : ${fmtInt(chicks)} poussins pour ${fmtInt(farm.capacity)} places`);
    else show(`Bande ${rank} ouverte`);
    setTimeout(() => nav('/'), 700);
  }

  return (
    <>
      <BackBar title="Ouvrir une bande" sub="Réception des poussins d'un jour" />
      <div className="content">
        {s.role !== 'eleveur' && (
          <label className="f">Ferme<select className="input" value={farmId} onChange={(e) => setFarmId(e.target.value)}><option value="">Choisir…</option>{mine.map((f) => <option key={f.id} value={f.id}>{f.id} · {f.name}</option>)}</select></label>
        )}
        <label className="f">Date de réception<input className="input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></label>
        {date < today() && <div className="note"><Icon name="info" size={18} />Saisie de rattrapage : la bande est ouverte au jour {daysBetween(date, today())}.</div>}
        <Stepper label="Poussins reçus" hint={farm ? `capacité ${fmtInt(farm.capacity)} places · occupation ${fmt((chicks / Math.max(1, farm.capacity)) * 100, 0)} %` : undefined} value={chicks} onChange={setChicks} step={50} icon="plus" tint={['var(--sun-50)', '#B07D00']} />
        <Stepper label="Poids moyen" hint="en grammes" value={weight} onChange={setWeight} icon="scale" tint={['var(--sky-50)', '#2F6FD1']} />
        <label className="f">Souche<select className="input" value={strain} onChange={(e) => setStrain(e.target.value)}>{STRAINS.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="f">N° de lot du couvoir (facultatif)<input className="input" value={supplierLot} onChange={(e) => setSupplierLot(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={withDelivery} onChange={(e) => setWithDelivery(e.target.checked)} /><span>Enregistrer aussi la livraison des poussins dans les intrants</span></label>
        {error && <div className="note red" role="alert"><Icon name="warn" size={18} />{error}</div>}
        <button className="cta green" onClick={submit}>Ouvrir la bande</button>
      </div>
      {toast}
    </>
  );
}
