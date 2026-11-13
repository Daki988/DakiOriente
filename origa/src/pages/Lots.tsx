import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { BackBar, Empty, Kv, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { Qr } from '../components/Qr';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { publicUrl, verifyLot } from '../domain/qr';
import { publicBase } from '../app/publicBase';
import { withdrawalBlock } from '../domain/rules';
import { lotStatus } from '../domain/analytics';

export function LotsPage() {
  const s = useSession();
  const lots = useLiveQuery(() => (s.farmId ? db.lots.where('farmId').equals(s.farmId).reverse().sortBy('cededAt') : []), [s.farmId], []);
  const ops = useLiveQuery(() => db.operators.toArray(), [], []);
  return (
    <>
      <div className="back"><div style={{ flex: 1 }}><h2>Lots et QR codes</h2><div className="sub">Chaque lot cédé porte un QR signé</div></div></div>
      <div className="content">
        <Link to="/sortie" className="cta"><Icon name="plus" />Céder un lot</Link>
        <div className="card">
          {lots.length === 0 && <Empty img="./img/poule.webp" title="Aucun lot cédé" text="Chaque lot cédé à un abattoir ou un acheteur reçoit ici son QR code signé." />}
          <div className="list">
            {lots.map((l) => (
              <Link key={l.id} to={`/lots/${encodeURIComponent(l.id)}`} className="li">
                <div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="qr" color="#12805C" /></div>
                <div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.count)} poulets · {ops.find((o) => o.id === l.operatorId)?.name ?? l.destination} · {fmtDate(l.cededAt)}</span></div>
                <span className={`pill ${lotStatus(l).validated ? 'on' : 'sky'}`}>{lotStatus(l).label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** Événements de la bande et du lot, sans ressaisie : historique d'élevage (§ 6.1). */
async function lotTimeline(bandId: string, lotId: string) {
  const band = await db.bands.get(bandId);
  const [inputs, vacc, treat, entries, weighs, reports, bio, moves, lot] = await Promise.all([
    db.inputs.where('bandId').equals(bandId).toArray(), db.vaccinations.where('bandId').equals(bandId).toArray(),
    db.treatments.where('bandId').equals(bandId).toArray(), db.entries.where('bandId').equals(bandId).toArray(), db.weighings.where('bandId').equals(bandId).toArray(),
    db.reports.where('bandId').equals(bandId).toArray(), band ? db.biosecurity.where('farmId').equals(band.farmId).toArray() : [], db.movements.where('lotId').equals(lotId).toArray(), db.lots.get(lotId),
  ]);
  const ev: { date: string; title: string; detail: string; tone?: 'bad' | 'ok' }[] = [];
  if (band) ev.push({ date: band.placedAt, title: 'Mise en place', detail: `${fmtInt(band.chicks)} poussins ${band.strain}` });
  inputs.filter((i) => i.kind === 'reception').forEach((i) => ev.push({ date: i.date, title: `Intrant reçu : ${i.product}`, detail: `${fmtInt(i.quantity)} ${i.unit}${i.supplierLot ? ` · lot ${i.supplierLot}` : ''}` }));
  vacc.forEach((v) => ev.push({ date: v.date, title: `Vaccination : ${v.vaccine}`, detail: v.method, tone: 'ok' }));
  treat.forEach((t) => ev.push({ date: t.startDate, title: `Traitement : ${t.product}`, detail: `${t.reason} · délai d'attente ${t.withdrawalDays} j` }));
  reports.forEach((r) => ev.push({ date: r.date, title: 'Déclaration sanitaire', detail: r.signs.join(', '), tone: 'bad' }));
  bio.forEach((b) => ev.push({ date: b.date, title: 'Contrôle de biosécurité', detail: `${Math.round(b.scorePct)} % conforme` }));
  const deaths = entries.reduce((a, e) => a + e.deaths, 0);
  if (entries.length) ev.push({ date: entries.map((e) => e.date).sort().pop()!, title: 'Suivi quotidien', detail: `${entries.length} fiches · ${fmtInt(deaths)} morts cumulés · ${weighs.length} pesées` });
  if (lot) ev.push({ date: lot.cededAt, title: 'Cession', detail: `${fmtInt(lot.count)} poulets · ${fmtInt(lot.weightKg)} kg` });
  if (lot?.receivedAt) ev.push({ date: lot.receivedAt, title: 'Réception par le destinataire', detail: `${fmtInt(lot.receivedCount ?? 0)} reçus sur ${fmtInt(lot.count)}${lot.receptionNote ? ` · ${lot.receptionNote}` : ''}`, tone: 'ok' });
  moves.forEach((m) => ev.push({ date: m.date, title: 'Transport', detail: `${m.from} → ${m.to}` }));
  if (lot?.distributorCheckedAt) ev.push({ date: lot.distributorCheckedAt, title: 'Contrôle par le distributeur', detail: 'Origine confirmée', tone: 'ok' });
  return ev.sort((a, b) => a.date.localeCompare(b.date));
}

export function LotDetail() {
  const { id = '' } = useParams();
  const settings = useSettings();
  const [toast, show] = useToast();
  const [print, setPrint] = useState<'label' | 'doc' | null>(null);
  const data = useLiveQuery(async () => {
    const lot = await db.lots.get(id);
    if (!lot) return null;
    const [op, treatments, farm, timeline] = await Promise.all([lot.operatorId ? db.operators.get(lot.operatorId) : undefined, db.treatments.where('bandId').equals(lot.bandId).toArray(), db.farms.get(lot.farmId), lotTimeline(lot.bandId, lot.id)]);
    return { lot, op, farm, timeline, blocked: withdrawalBlock(treatments, lot.cededAt) };
  }, [id]);
  useEffect(() => { if (!print) return; const t = setTimeout(() => { window.print(); setPrint(null); }, 300); return () => clearTimeout(t); }, [print]);
  if (data === undefined) return null;
  if (!data) return <><BackBar title="Lot introuvable" /><div className="content"><div className="empty">Ce lot n'existe pas sur cet appareil.</div></div></>;
  const { lot, op, farm, timeline, blocked } = data;
  const url = publicUrl(publicBase(), lot.id, lot.signature);
  const pending = !lot.signature;
  const authentic = !pending && verifyLot(lot.id, lot.signature);
  const status = lotStatus(lot);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: `Lot ${lot.id}`, text: 'Origine vérifiée par Origa', url });
      else { await navigator.clipboard.writeText(url); show('Lien copié'); }
    } catch { /* partage annulé */ }
  }

  return (
    <>
      <BackBar title="Lot cédé" sub={status.label} />
      <div className="content no-print">
        <div className="qrbox">
          {pending ? <div className="empty" style={{ width: 200, height: 200, display: 'flex', alignItems: 'center' }}>Le QR apparaîtra après la synchronisation, quand le serveur aura signé le lot.</div> : <Qr value={url} />}
          <span className="lotid">{lot.id}</span>
          {pending ? <span className="pill off"><span className="dot" style={{ background: 'var(--sun)' }} />Signature en attente de réseau</span>
            : <span className={`pill ${authentic ? 'on' : 'red'}`}><span className="dot" style={{ background: authentic ? 'var(--green)' : 'var(--red)' }} />{authentic ? 'Signé · infalsifiable' : 'Signature invalide'}</span>}
          <span className={`pill ${status.validated ? 'on' : 'sky'}`}>{status.validated ? 'Validé sur événements vérifiables' : 'En attente de réception par le destinataire'}</span>
        </div>
        <div className="card" style={{ gap: 0 }}>
          <Kv k="Destinataire" v={op ? `${op.name}, ${op.locality}` : lot.destination ?? '—'} />
          <Kv k="Poulets" v={fmtInt(lot.count)} />
          <Kv k="Poids vif" v={lot.weightKg ? `${fmtInt(lot.weightKg)} kg` : '—'} />
          <Kv k="Date de cession" v={fmtDate(lot.cededAt)} />
          {lot.receivedAt
            ? <Kv k="Réception" v={`${fmtDate(lot.receivedAt)} · ${fmtInt(lot.receivedCount ?? lot.count)} reçus${lot.count ? ` (écart ${fmt(((lot.count - (lot.receivedCount ?? lot.count)) / lot.count) * 100, 1)} %)` : ''}`} cls={lot.count && (lot.count - (lot.receivedCount ?? lot.count)) / lot.count * 100 > settings.receptionGapPct ? 'bad' : 'ok'} />
            : <Kv k="Réception" v="En attente" />}
          <Kv k="Délai d'attente médicaments" v={blocked ? 'Non respecté' : 'Respecté'} cls={blocked ? 'bad' : 'ok'} />
          <Kv k="Code de confirmation" v={lot.confirmCode.split('').join(' ')} />
        </div>
        <div className="row">
          <button className="cta light" style={{ flex: 1, fontSize: 15 }} disabled={pending} onClick={() => setPrint('label')}><Icon name="qr" />Étiquette</button>
          <button className="cta light" style={{ flex: 1, fontSize: 15 }} onClick={() => setPrint('doc')}><Icon name="report" />Document</button>
        </div>
        <div className="row">
          <button className="cta light" style={{ flex: 1, fontSize: 16 }} disabled={pending} onClick={share}><Icon name="share" />Partager</button>
          <a className="cta green" style={{ flex: 1, fontSize: 16 }} href={url} target="_blank" rel="noreferrer">Page publique</a>
        </div>
        <div className="card">
          <h3>Historique du lot</h3>
          {timeline.map((e, i) => (
            <div key={i} className="tl"><div className="rail"><div className="c" style={e.tone === 'bad' ? { background: 'var(--red)', borderColor: 'var(--red-50)' } : undefined} />{i < timeline.length - 1 && <div className="ln" />}</div>
              <div className="tx"><b>{e.title}</b><span>{fmtDate(e.date)} · {e.detail}</span></div></div>
          ))}
        </div>
      </div>
      {print === 'label' && (
        <div className="print-only label">
          <Qr value={url} size={180} /><div><b>{lot.id}</b><span>{farm?.name} · {farm?.locality}</span><span>{fmtInt(lot.count)} poulets · cédé le {fmtDate(lot.cededAt)}</span><span>Élevé au Gabon · origa</span></div>
        </div>
      )}
      {print === 'doc' && (
        <div className="print-only doc">
          <h1>Document d'accompagnement du lot</h1>
          <p>Programme POUFA · Ministère de l'Agriculture, de l'Élevage et du Développement rural</p>
          <table><tbody>
            <tr><th>Lot</th><td>{lot.id}</td></tr><tr><th>Ferme d'origine</th><td>{farm?.id} · {farm?.name} · {farm?.locality}</td></tr>
            <tr><th>Destinataire</th><td>{op ? `${op.name}, ${op.locality}` : lot.destination}</td></tr><tr><th>Date de cession</th><td>{fmtDate(lot.cededAt)}</td></tr>
            <tr><th>Nombre de poulets</th><td>{fmtInt(lot.count)}</td></tr><tr><th>Poids vif</th><td>{fmtInt(lot.weightKg)} kg</td></tr>
            <tr><th>Délai d'attente des médicaments</th><td>{blocked ? 'NON RESPECTÉ' : 'Respecté'}</td></tr><tr><th>Code de confirmation</th><td>{lot.confirmCode}</td></tr>
          </tbody></table>
          {!pending && <Qr value={url} size={140} />}
          <p>Historique : {timeline.map((e) => `${fmtDate(e.date)} ${e.title}`).join(' ; ')}.</p>
          <div className="sign"><span>Signature de l'éleveur</span><span>Signature et cachet de l'abattoir</span></div>
        </div>
      )}
      {toast}
    </>
  );
}
