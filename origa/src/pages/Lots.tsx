import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { BackBar, Kv, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { Qr } from '../components/Qr';
import { fmtDate, fmtInt, useSession } from '../app/hooks';
import { publicUrl, verifyLot } from '../domain/qr';
import { publicBase } from '../app/publicBase';
import { withdrawalBlock } from '../domain/rules';

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
          {lots.length === 0 && <div className="empty">Aucun lot cédé pour l'instant.</div>}
          <div className="list">
            {lots.map((l) => (
              <Link key={l.id} to={`/lots/${encodeURIComponent(l.id)}`} className="li">
                <div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="qr" color="#12805C" /></div>
                <div className="grow"><b className="lotid" style={{ fontSize: 13 }}>{l.id}</b><span>{fmtInt(l.count)} poulets · {ops.find((o) => o.id === l.operatorId)?.name ?? l.destination} · {fmtDate(l.cededAt)}</span></div>
                <span className={`pill ${l.receivedAt ? 'on' : 'sky'}`}>{l.receivedAt ? 'Reçu' : 'Cédé'}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function LotDetail() {
  const { id = '' } = useParams();
  const [toast, show] = useToast();
  const data = useLiveQuery(async () => {
    const lot = await db.lots.get(id);
    if (!lot) return null;
    const [op, treatments] = await Promise.all([lot.operatorId ? db.operators.get(lot.operatorId) : undefined, db.treatments.where('bandId').equals(lot.bandId).toArray()]);
    return { lot, op, blocked: withdrawalBlock(treatments, lot.cededAt) };
  }, [id]);
  if (data === undefined) return null;
  if (!data) return <><BackBar title="Lot introuvable" /><div className="content"><div className="empty">Ce lot n'existe pas sur cet appareil.</div></div></>;
  const { lot, op, blocked } = data;
  const url = publicUrl(publicBase(), lot.id, lot.signature);
  const authentic = verifyLot(lot.id, lot.signature);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: `Lot ${lot.id}`, text: 'Origine vérifiée par Origa', url });
      else { await navigator.clipboard.writeText(url); show('Lien copié'); }
    } catch { /* partage annulé */ }
  }

  return (
    <>
      <BackBar title="Lot cédé" sub="Étiquette activée · scannable partout" />
      <div className="content">
        <div className="qrbox">
          <Qr value={url} />
          <span className="lotid">{lot.id}</span>
          <span className={`pill ${authentic ? 'on' : 'red'}`}><span className="dot" style={{ background: authentic ? 'var(--green)' : 'var(--red)' }} />{authentic ? 'Signé · infalsifiable' : 'Signature invalide'}</span>
        </div>
        <div className="card" style={{ gap: 0 }}>
          <Kv k="Destinataire" v={op ? `${op.name}, ${op.locality}` : lot.destination ?? '—'} />
          <Kv k="Poulets" v={fmtInt(lot.count)} />
          <Kv k="Poids vif" v={`${fmtInt(lot.weightKg)} kg`} />
          <Kv k="Date de cession" v={fmtDate(lot.cededAt)} />
          <Kv k="Délai d'attente médicaments" v={blocked ? 'Non respecté' : 'Respecté'} cls={blocked ? 'bad' : 'ok'} />
          <Kv k="Code de confirmation" v={lot.confirmCode.split('').join(' ')} />
        </div>
        <div className="row">
          <button className="cta light" style={{ flex: 1, fontSize: 16 }} onClick={share}><Icon name="share" />Partager</button>
          <a className="cta green" style={{ flex: 1, fontSize: 16 }} href={url} target="_blank" rel="noreferrer">Page publique</a>
        </div>
      </div>
      {toast}
    </>
  );
}
