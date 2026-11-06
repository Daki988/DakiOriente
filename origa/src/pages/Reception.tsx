import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { Logo, Icon } from '../components/Icon';
import { Empty, Stepper, SyncPill, useToast } from '../components/ui';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { parseToken, verifyLot } from '../domain/qr';
import type { Lot } from '../domain/types';

/** Extrait l'identifiant de lot d'un lien ou d'un contenu de QR Origa. */
function lotFromScan(text: string): { lotId: string; valid: boolean } | null {
  const m = text.match(/#\/p\/([^?#\s]+)/);
  const token = decodeURIComponent(m ? m[1] : text.trim());
  const p = parseToken(token);
  return p ? { lotId: p.lotId, valid: verifyLot(p.lotId, p.signature) } : null;
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Lecture de QR par la caméra quand le navigateur le permet (Android, Chrome) ; sinon saisie du lien. */
function Scanner({ onResult }: { onResult: (t: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
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
        if (codes[0]) { onResult(codes[0].rawValue); break; }
        await new Promise((r) => setTimeout(r, 250));
      }
    }).catch(() => setError('Caméra refusée : collez le lien du QR ci-dessous.'));
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [onResult]);
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
  const mine = lots.filter((l) => !operator || l.operatorId === operator.id);
  const toReceive = mine.filter((l) => !l.receivedAt);

  function open(text: string) {
    const r = lotFromScan(text);
    if (!r) return show('Ce code n’est pas un QR Origa.');
    if (!r.valid) return show('QR non authentique : lot refusé.');
    const lot = lots.find((l) => l.id === r.lotId);
    if (!lot) return show('Lot inconnu sur cet appareil : synchronisez puis réessayez.');
    if (operator && lot.operatorId !== operator.id) return show('Ce lot n’est pas destiné à votre structure.');
    setScan(false); setLink(''); setCurrent(lot); setCount(lot.count); setWeight(lot.weightKg); setNote('');
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

  return (
    <>
      <div className="appbar"><div className="brand"><Logo />Origa</div><SyncPill /></div>
      <div className="content">
        <div className="hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.94),rgba(11,61,46,.78)),url(./img/poulailler.webp)' }}>
          <span className="kicker">{operator?.name ?? s.userLabel}</span>
          <h1>{toReceive.length} lot(s) à réceptionner</h1>
          <span style={{ fontSize: 13, color: '#CFE7DC' }}>Scannez le QR qui accompagne chaque lot pour valider son arrivée.</span>
        </div>
        <button className="cta" onClick={() => setScan((v) => !v)}><Icon name="qr" size={22} />{scan ? 'Fermer la caméra' : 'Scanner un QR'}</button>
        {scan && <Scanner onResult={open} />}
        <div className="row">
          <input className="input" placeholder="… ou collez le lien du QR" value={link} onChange={(e) => setLink(e.target.value)} />
          <button className="cta light" style={{ width: 'auto' }} disabled={!link} onClick={() => open(link)}>Ouvrir</button>
        </div>
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
