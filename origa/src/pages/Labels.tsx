import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { listLabels, requestLabels, RESERVE } from '../data/labels';
import { apiEnabled } from '../app/api';
import { publicBase } from '../app/publicBase';
import { fmtDate, useSession } from '../app/hooks';
import { publicUrl } from '../domain/qr';
import { BackBar, Kv, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { Qr } from '../components/Qr';
import type { PresignedLabel } from '../domain/types';

const shortNo = (id: string) => id.slice(id.lastIndexOf('-') + 1);

function Label({ l, farm }: { l: PresignedLabel; farm: string }) {
  return (
    <div className="qlabel"><Qr value={publicUrl(publicBase(), l.lotId, l.signature)} size={84} />
      <div className="t"><b>{l.lotId}</b><span>{farm}</span><span>Élevé au Gabon · origa</span></div></div>
  );
}

/**
 * Étiquettes QR pré-signées : le serveur signe à l'avance les prochains numéros de lot d'une bande.
 * L'éleveur garde une réserve sur son téléphone ; la DGE ou l'agent prépare et imprime un rouleau.
 */
export function LabelsPage() {
  const s = useSession(); const [toast, show] = useToast();
  const mobile = s.role === 'eleveur' || s.role === 'agent';
  const [chosen, setChosen] = useState('');
  const [count, setCount] = useState(12);
  const [busy, setBusy] = useState(false);
  const data = useLiveQuery(async () => {
    const [farms, bands] = await Promise.all([db.farms.orderBy('id').toArray(), db.bands.toArray()]);
    const open = bands.filter((b) => !b.closedAt);
    return { farms: farms.filter((f) => open.some((b) => b.farmId === f.id)), open };
  }, []);
  const farmId = mobile ? s.farmId ?? '' : chosen || data?.farms[0]?.id || '';
  const farm = data?.farms.find((f) => f.id === farmId);
  const band = data?.open.find((b) => b.farmId === farmId);
  const labels = useLiveQuery(() => (band ? listLabels(band.id) : Promise.resolve([] as PresignedLabel[])), [band?.id], [] as PresignedLabel[]);
  const farmLine = farm ? `${farm.name} · ${farm.locality}` : farmId;
  const last = labels.reduce((a, l) => (l.issuedAt > a ? l.issuedAt : a), '');
  const lastLabel = last ? `${fmtDate(last.slice(0, 10))}, ${new Date(last).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : '—';

  async function prepare(n: number) {
    if (!band) return;
    setBusy(true);
    try {
      const got = await requestLabels(band.id, n);
      show(got.length ? `${got.length} étiquette(s) prête(s)` : 'Cette bande a atteint le nombre maximal de lots');
    } catch (e) {
      show(navigator.onLine ? (e as Error).message : 'Pas de réseau : la réserve sera complétée à la prochaine synchronisation');
    } finally { setBusy(false); }
  }

  const roll = <div className="print-only roll">{labels.map((l) => <Label key={l.lotId} l={l} farm={farmLine} />)}</div>;

  if (mobile) {
    const next = labels[0];
    return (
      <>
        <BackBar title="Mes étiquettes QR" sub="Valables sans réseau" />
        <div className="content no-print">
          {!band ? <div className="card"><div className="empty">Aucune bande en cours : les étiquettes se préparent à l'ouverture d'une bande.</div></div> : (
            <>
              <div className="qrbox">
                {next ? <Qr value={publicUrl(publicBase(), next.lotId, next.signature)} />
                  : <div className="empty" style={{ width: 200, height: 200, display: 'flex', alignItems: 'center' }}>Aucune étiquette en réserve pour le moment.</div>}
                {next && <span className="lotid">{next.lotId}</span>}
                <span className={`pill ${next ? 'on' : 'off'}`}><span className="dot" style={{ background: next ? 'var(--green)' : 'var(--sun)' }} />{next ? 'Prochaine étiquette · déjà signée' : 'Réserve vide'}</span>
              </div>
              <div className="note"><Icon name="info" size={18} />Hors ligne, le QR de votre prochain lot est déjà valable. Sans réserve, il faudrait attendre le réseau.</div>
              <div className="card" style={{ gap: 0 }}>
                <Kv k="Bande" v={band.id} />
                <Kv k="Étiquettes en réserve" v={labels.length} cls={labels.length ? 'ok' : 'bad'} />
                <Kv k="Numéros" v={labels.length ? `${shortNo(labels[0].lotId)} à ${shortNo(labels[labels.length - 1].lotId)}` : '—'} />
                <Kv k="Réserve renouvelée" v={lastLabel} />
              </div>
              <button className="cta green" disabled={busy} onClick={() => prepare(RESERVE)}><Icon name="sync" />{busy ? 'Renouvellement…' : 'Renouveler la réserve'}</button>
              <button className="cta light" disabled={!labels.length} onClick={() => window.print()}><Icon name="print" />Imprimer mes étiquettes</button>
            </>
          )}
        </div>
        {roll}{toast}
      </>
    );
  }

  return (
    <>
      <div className="top no-print"><div><h1>Étiquettes QR pré-signées</h1><span className="muted">Un rouleau d'étiquettes déjà signées par le serveur : l'éleveur colle un QR valide même sans réseau.</span></div>
        <div className="row wrap" style={{ gap: 8 }}><button className="sel" disabled={busy || !band} onClick={() => prepare(count)}>Renouveler la réserve</button><button className="sel dark" disabled={!labels.length} onClick={() => window.print()}>Imprimer le rouleau</button></div></div>
      <div className="grid2 no-print" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.7fr)' }}>
        <div className="panel"><h3>Préparer un rouleau</h3>
          <label className="f">Ferme<select className="input" value={farmId} onChange={(e) => setChosen(e.target.value)}>{(data?.farms ?? []).map((f) => <option key={f.id} value={f.id}>{f.id} · {f.name}</option>)}</select></label>
          <label className="f">Bande en cours<input className="input" disabled value={band ? `${band.id} · mise en place le ${fmtDate(band.placedAt)}` : 'Aucune bande en cours'} /></label>
          <label className="f">Nombre d'étiquettes<input className="input" inputMode="numeric" value={count || ''} onChange={(e) => setCount(Math.min(30, Number(e.target.value.replace(/\D/g, '')) || 0))} /></label>
          <div className="note"><Icon name="info" size={18} />Les étiquettes portent les prochains numéros de lot de la bande (30 au plus par rouleau). Un numéro ne sert qu'une fois : à la cession, le lot prend l'étiquette suivante.</div>
          <button className="sel dark" style={{ alignSelf: 'flex-start' }} disabled={busy || !band || count < 1} onClick={() => prepare(count)}>{busy ? 'Préparation…' : 'Préparer le rouleau'}</button>
          <div><Kv k="Étiquettes disponibles pour cette bande" v={`${labels.length} étiquette(s)`} /><Kv k="Dernier rouleau émis" v={lastLabel} /><Kv k="Émission journalisée" v={apiEnabled ? 'Oui' : 'Oui (démonstration locale)'} /></div>
        </div>
        <div className="panel"><div className="row between wrap"><h3>Aperçu du rouleau · {labels.length} étiquette(s) de 90 × 30 mm</h3>{labels.length > 0 && <span className="pill on">Signées par le serveur</span>}</div>
          {labels.length ? <div className="labels">{labels.map((l) => <Label key={l.lotId} l={l} farm={farmLine} />)}</div>
            : <div className="empty">Aucune étiquette préparée pour cette bande. Indiquez un nombre puis « Préparer le rouleau ».</div>}
        </div>
      </div>
      {roll}{toast}
    </>
  );
}
