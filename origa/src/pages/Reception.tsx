import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { Logo, Icon } from '../components/Icon';
import { Empty, Stepper, SyncPill, useToast } from '../components/ui';
import { fmt, fmtDate, fmtInt, useDesktop, useSession, useSettings } from '../app/hooks';
import { parseToken, signLot, verifyLot } from '../domain/qr';
import { lotStatus } from '../domain/analytics';
import { API, apiEnabled, api } from '../app/api';
import { flushOutbox } from '../data/sync';
import { today, uid } from '../domain/ids';
import type { Lot } from '../domain/types';

/** Extrait l'identifiant de lot d'un lien ou d'un contenu de QR Origa. */
function lotFromScan(text: string): { lotId: string; token: string; valid: boolean } | null {
  const m = text.match(/#\/p\/([^?#\s]+)/);
  const token = decodeURIComponent(m ? m[1] : text.trim());
  const p = parseToken(token);
  return p ? { lotId: p.lotId, token, valid: verifyLot(p.lotId, p.signature) } : null;
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Lecture de QR par la caméra quand le navigateur le permet (Android, Chrome) ; sinon saisie du lien. */
function Scanner({ onResult }: { onResult: (t: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  // Rappel stable : la caméra ne redémarre pas à chaque rafraîchissement de l'écran (synchronisation toutes les 15 s).
  const cb = useRef(onResult); cb.current = onResult;
  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) { setError('Lecture par caméra indisponible sur cet appareil : collez le lien du QR ci-dessous.'); return; }
    const det = new BD({ formats: ['qr_code'] });
    let stream: MediaStream | undefined; let stop = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(async (s) => {
      stream = s;
      if (!video.current) return;
      video.current.srcObject = s; await video.current.play();
      while (!stop) {
        const codes = await det.detect(video.current).catch(() => []);
        if (codes[0]) { cb.current(codes[0].rawValue); break; }
        await new Promise((r) => setTimeout(r, 250));
      }
    }).catch(() => setError('Caméra refusée : collez le lien du QR ci-dessous.'));
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);
  return error ? <div className="note sun"><Icon name="info" size={18} />{error}</div> : <video ref={video} className="scanner" muted playsInline />;
}

/** Réception et validation des lots à l'abattoir (§ 6.2), réservée aux opérateurs sous convention. */
export function Reception() {
  const s = useSession();
  const settings = useSettings();
  const [toast, show] = useToast();
  const [scan, setScan] = useState(false);
  const [link, setLink] = useState('');
  const [current, setCurrent] = useState<Lot | null>(null);
  const [count, setCount] = useState(0);
  const [weight, setWeight] = useState(0);
  const [note, setNote] = useState('');
  const operator = useLiveQuery(() => (s.operatorId ? db.operators.get(s.operatorId) : undefined), [s.operatorId]);
  const lots = useLiveQuery(() => db.lots.orderBy('cededAt').reverse().toArray(), [], []);
  const distributor = operator?.type === 'distributeur';
  const mine = lots.filter((l) => !operator || l.operatorId === operator.id);
  const [derived, setDerived] = useState({ product: 'Poulets entiers', count: 0 });
  const [move, setMove] = useState({ from: '', to: '' });
  const toReceive = mine.filter((l) => !l.receivedAt);
  const desktop = useDesktop();

  async function open(text: string) {
    const r = lotFromScan(text);
    if (!r) return show('Ce code n’est pas un QR Origa.');
    if (!r.valid) return show('QR non authentique : lot refusé.');
    let lot = lots.find((l) => l.id === r.lotId);
    // Lot cédé à l'instant : on synchronise avant de conclure qu'il est inconnu.
    if (!lot && apiEnabled) { await flushOutbox(); lot = await db.lots.get(r.lotId); }
    // Distributeur : le lot ne lui est pas destiné nominativement ; ses données publiques suffisent au contrôle.
    if (!lot && distributor && apiEnabled) {
      const j = await fetch(`${API}/public/lots/${encodeURIComponent(r.token)}`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      if (j?.valid && j.lot) {
        lot = { id: j.lot.id, farmId: j.farm?.name ?? '', bandId: '', count: j.lot.count ?? 0, weightKg: j.lot.weightKg ?? 0, cededAt: j.lot.cededAt, receivedAt: j.lot.receivedAt ?? undefined,
          distributorCheckedAt: j.lot.distributorCheckedAt ?? undefined, derivedProduct: j.lot.product ?? undefined, signature: 'serveur', confirmCode: '' } as Lot;
      }
    }
    if (!lot) return show('Lot inconnu : vérifiez le réseau puis réessayez.');
    if (operator && !distributor && lot.operatorId !== operator.id) return show('Ce lot n’est pas destiné à votre structure.');
    setScan(false); setLink(''); setCurrent(lot); setCount(lot.count); setWeight(lot.weightKg); setNote('');
  }

  async function distributorCheck(lot: Lot) {
    if (apiEnabled) await api(`/lots/${encodeURIComponent(lot.id)}/distributor-check`, { method: 'POST' });
    else await save('lots', { ...lot, distributorCheckedAt: today(), distributorId: operator?.id }, 'contrôle par le distributeur');
    setCurrent(null); show('Origine confirmée');
  }
  async function createDerived(lot: Lot) {
    if (derived.count <= 0) return show('Indiquez la quantité.');
    const n = lots.filter((l) => l.parentId === lot.id).length + 1;
    const id = `${lot.id}-D${n}`;
    await save('lots', { id, bandId: lot.bandId, farmId: lot.farmId, parentId: lot.id, count: derived.count, weightKg: 0, operatorId: lot.operatorId, cededAt: today(), signature: apiEnabled ? '' : signLot(id), confirmCode: String(Math.floor(1000 + Math.random() * 9000)), derivedProduct: derived.product, receivedAt: today() }, 'transformation : lot dérivé');
    show(`Lot dérivé ${id} créé, avec son QR`);
  }
  async function addMove(lot: Lot) {
    if (!move.from || !move.to) return show('Indiquez l’origine et la destination.');
    await save('movements', { id: uid(), lotId: lot.id, date: today(), from: move.from, to: move.to, by: s.userLabel }, 'transport du lot');
    setMove({ from: '', to: '' }); show('Transport enregistré');
  }

  if (current && distributor) {
    const st = lotStatus(current);
    return (
      <>
        <div className="back"><button className="iconbtn" aria-label="Retour" onClick={() => setCurrent(null)}><Icon name="back" size={24} stroke={2.2} /></button><div><h2>Contrôle du lot</h2><div className="sub lotid">{current.id}</div></div></div>
        <div className="content">
          <div className="card" style={{ gap: 0 }}>
            <div className="kv"><span>Ferme d'origine</span><b>{current.farmId}</b></div>
            <div className="kv"><span>Statut</span><b className={st.validated ? 'ok' : 'warn'}>{st.label}</b></div>
          </div>
          {!st.validated && <div className="note red"><Icon name="warn" size={18} />Lot non validé à l'abattoir : signalez-le avant mise en vente.</div>}
          {current.distributorCheckedAt ? <div className="note"><Icon name="check" size={18} />Déjà contrôlé le {fmtDate(current.distributorCheckedAt)}.</div>
            : <button className="cta green" onClick={() => distributorCheck(current)}>Confirmer la réception et l'origine</button>}
        </div>
        {toast}
      </>
    );
  }

  if (current && current.receivedAt) {
    const children = lots.filter((l) => l.parentId === current.id);
    return (
      <>
        <div className="back"><button className="iconbtn" aria-label="Retour" onClick={() => setCurrent(null)}><Icon name="back" size={24} stroke={2.2} /></button><div><h2>Lot réceptionné</h2><div className="sub lotid">{current.id}</div></div></div>
        <div className="content">
          <div className="card">
            <h3>Transformation et conditionnement</h3>
            <span className="muted">Chaque produit conditionné reçoit un QR lié au lot parent.</span>
            <div className="row">
              <select className="input" value={derived.product} onChange={(e) => setDerived({ ...derived, product: e.target.value })}>{['Poulets entiers', 'Découpes', 'Abats', 'Poulets congelés'].map((x) => <option key={x}>{x}</option>)}</select>
              <input className="input" style={{ maxWidth: 110 }} inputMode="numeric" placeholder="Unités" value={derived.count || ''} onChange={(e) => setDerived({ ...derived, count: Number(e.target.value) || 0 })} />
            </div>
            <button className="cta light" onClick={() => createDerived(current)}><Icon name="qr" />Créer le lot dérivé</button>
            {children.map((c) => <a key={c.id} className="li" href={`#/lots/${encodeURIComponent(c.id)}`}><div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{c.id}</b><span>{c.derivedProduct} · {fmtInt(c.count)} unités</span></div></a>)}
          </div>
          <div className="card">
            <h3>Transport</h3>
            <div className="row"><input className="input" placeholder="Depuis" value={move.from} onChange={(e) => setMove({ ...move, from: e.target.value })} /><input className="input" placeholder="Vers" value={move.to} onChange={(e) => setMove({ ...move, to: e.target.value })} /></div>
            <button className="cta light" onClick={() => addMove(current)}><Icon name="truck" />Enregistrer le mouvement</button>
          </div>
        </div>
        {toast}
      </>
    );
  }

  if (current) {
    const gap = current.count ? ((current.count - count) / current.count) * 100 : 0;
    const over = Math.abs(gap) > settings.receptionGapPct;
    return (
      <>
        <div className="back">
          <button className="iconbtn" aria-label="Retour" onClick={() => setCurrent(null)}><Icon name="back" size={24} stroke={2.2} /></button>
          <div><h2>Réception du lot</h2><div className="sub lotid">{current.id}</div></div>
        </div>
        <div className="content">
          <div className="card" style={{ gap: 0 }}>
            <div className="kv"><span>Annoncé par la ferme</span><b>{fmtInt(current.count)} poulets · {fmtInt(current.weightKg)} kg</b></div>
            <div className="kv"><span>Cédé le</span><b>{fmtDate(current.cededAt)}</b></div>
            <div className="kv"><span>Ferme</span><b>{current.farmId}</b></div>
          </div>
          <Stepper label="Poulets reçus" value={count} onChange={setCount} step={10} icon="truck" tint={['var(--green-50)', '#12805C']} />
          <Stepper label="Poids reçu" hint="en kg" value={weight} onChange={setWeight} step={10} icon="scale" tint={['var(--sky-50)', '#2F6FD1']} />
          <label className="f">Constats (état des animaux, transport)<textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          {over && <div className="note red"><Icon name="warn" size={18} />Écart de {fmt(gap, 1)} % avec l'annonce (seuil {fmt(settings.receptionGapPct, 1)} %) : il sera signalé à la DGE.</div>}
          <button className="cta green" disabled={count <= 0} onClick={async () => {
            await save('lots', { ...current, receivedAt: new Date().toISOString().slice(0, 10), receivedCount: count, receivedWeightKg: weight, receptionNote: note || undefined }, over ? 'réception avec écart' : 'réception validée');
            setCurrent(null); show('Réception validée');
          }}>Valider la réception</button>
        </div>
        {toast}
      </>
    );
  }

  // Ordinateur : maquette Figma « Abattoir — Réception » (indicateurs, tableau des lots reçus).
  if (desktop) {
    const received = mine.filter((l) => l.receivedAt && !l.parentId);
    const month = today().slice(0, 7);
    const thisMonth = received.filter((l) => l.receivedAt!.startsWith(month));
    const gaps = received.filter((l) => l.receivedCount !== undefined && l.count > 0).map((l) => ((l.count - (l.receivedCount ?? l.count)) / l.count) * 100);
    const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const ids = new Set(mine.map((l) => l.id));
    const derivedCount = lots.filter((l) => l.parentId && ids.has(l.parentId)).length;
    return (
      <>
        <div className="top">
          <div><h1>{distributor ? 'Contrôle des lots reçus' : 'Réception des lots'}</h1><span className="muted">{operator?.name ?? s.userLabel} · {toReceive.length} lot(s) annoncé(s)</span></div>
          <div className="row" style={{ alignItems: 'center' }}>
            <SyncPill />
            <input className="input" style={{ width: 300 }} placeholder="… ou collez le lien du QR" value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && link) open(link); }} />
            {link ? <button className="cta sm light" onClick={() => open(link)}>Ouvrir</button> : <button className="cta sm" onClick={() => setScan((v) => !v)}><Icon name="qr" size={20} />{scan ? 'Fermer la caméra' : 'Scanner un QR'}</button>}
          </div>
        </div>
        {scan && <Scanner onResult={open} />}
        {!distributor && (
          <div className="kpis">
            <div className="kpi"><span className="l">Lots annoncés</span><span className="v">{toReceive.length}</span><span className="s">à réceptionner</span></div>
            <div className="kpi"><span className="l">Reçus ce mois</span><span className="v">{thisMonth.length}</span><span className="s ok">{fmtInt(thisMonth.reduce((a, l) => a + (l.receivedCount ?? l.count), 0))} poulets</span></div>
            <div className="kpi"><span className="l">Écart moyen</span><span className="v">{fmt(meanGap, 1)} %</span><span className={`s ${meanGap <= settings.receptionGapPct ? 'ok' : 'bad'}`}>{meanGap <= settings.receptionGapPct ? 'sous' : 'au-dessus du'} le seuil ({fmt(settings.receptionGapPct, 0)} %)</span></div>
            <div className="kpi"><span className="l">Lots transformés</span><span className="v">{derivedCount}</span><span className="s">lots dérivés</span></div>
          </div>
        )}
        <div className="desk2">
          <div className="panel">
            <h3>{distributor ? 'Lots à contrôler' : 'Lots réceptionnés'}</h3>
            {received.length === 0 ? <span className="muted">Aucun lot réceptionné pour l'instant.</span> : (
              <table className="tbl"><thead><tr><th>Lot</th><th>Annoncé</th><th>Reçu</th><th>Écart</th><th>Date</th><th /></tr></thead>
                <tbody>{received.slice(0, 12).map((l) => (
                  <tr key={l.id} className="click" onClick={() => setCurrent(l)}>
                    <td className="lotid nw">{l.id}</td><td>{fmtInt(l.count)}</td><td>{fmtInt(l.receivedCount ?? l.count)}</td>
                    <td>{l.count ? `${fmt(((l.count - (l.receivedCount ?? l.count)) / l.count) * 100, 1)} %` : '—'}</td><td>{fmtDate(l.receivedAt!)}</td>
                    <td><span className="pill on">{distributor ? 'Contrôler' : 'Transformer · transporter'}</span></td>
                  </tr>
                ))}</tbody></table>
            )}
          </div>
          <div className="panel">
            <h3>Lots attendus</h3>
            {toReceive.length === 0 ? <Empty img="./img/poussin.webp" title="Aucun lot en attente" text="Les lots cédés à votre structure apparaîtront ici." /> : (
              <div className="list">{toReceive.map((l) => (
                <button key={l.id} className="li" style={{ textAlign: 'left' }} onClick={() => { setCurrent(l); setCount(l.count); setWeight(l.weightKg); }}>
                  <div className="ico" style={{ background: 'var(--sun-50)' }}><Icon name="truck" color="#B07D00" /></div>
                  <div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.count)} poulets · cédé le {fmtDate(l.cededAt)}</span></div>
                  <span className="pill sky">Réceptionner</span>
                </button>
              ))}</div>
            )}
          </div>
        </div>
        {toast}
      </>
    );
  }

  return (
    <>
      <div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div>
      <div className="content">
        <div className="hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.94),rgba(11,61,46,.78)),url(./img/poulailler.webp)' }}>
          <span className="kicker">{operator?.name ?? s.userLabel}</span>
          <h1>{distributor ? 'Contrôle des lots reçus' : `${toReceive.length} lot(s) à réceptionner`}</h1>
          <span style={{ fontSize: 13, color: '#CFE7DC' }}>Scannez le QR qui accompagne chaque lot pour valider son arrivée.</span>
        </div>
        <button className="cta" onClick={() => setScan((v) => !v)}><Icon name="qr" size={22} />{scan ? 'Fermer la caméra' : 'Scanner un QR'}</button>
        {scan && <Scanner onResult={open} />}
        <div className="row">
          <input className="input" placeholder="… ou collez le lien du QR" value={link} onChange={(e) => setLink(e.target.value)} />
          <button className="cta light" style={{ width: 'auto' }} disabled={!link} onClick={() => open(link)}>Ouvrir</button>
        </div>
        {!distributor && mine.filter((l) => l.receivedAt && !l.parentId).length > 0 && (
          <div className="card"><h3>Lots réceptionnés</h3><div className="list">{mine.filter((l) => l.receivedAt && !l.parentId).slice(0, 8).map((l) => (
            <button key={l.id} className="li" style={{ textAlign: 'left' }} onClick={() => setCurrent(l)}><div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.receivedCount ?? l.count)} reçus le {fmtDate(l.receivedAt!)}</span></div><span className="pill on">Transformer · transporter</span></button>
          ))}</div></div>
        )}
        <div className="card">
          <h3>Lots attendus</h3>
          {toReceive.length === 0 ? <Empty img="./img/poussin.webp" title="Aucun lot en attente" text="Les lots cédés à votre structure apparaîtront ici." /> : (
            <div className="list">{toReceive.map((l) => (
              <button key={l.id} className="li" style={{ textAlign: 'left' }} onClick={() => { setCurrent(l); setCount(l.count); setWeight(l.weightKg); }}>
                <div className="ico" style={{ background: 'var(--sun-50)' }}><Icon name="truck" color="#B07D00" /></div>
                <div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.count)} poulets · cédé le {fmtDate(l.cededAt)}</span></div>
                <span className="pill sky">Réceptionner</span>
              </button>
            ))}</div>
          )}
        </div>
      </div>
      {toast}
    </>
  );
}
