import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../data/db';
import { parseToken, verifyLot } from '../domain/qr';
import { provinceName } from '../domain/provinces';
import { daysBetween, uid } from '../domain/ids';
import { fmtDate } from '../app/hooks';
import { API, apiEnabled } from '../app/api';
import { DEFAULT_SETTINGS } from '../domain/defaults';
import { Icon } from '../components/Icon';

interface View {
  valid: boolean;
  pending?: boolean;
  offline?: boolean;
  lotId: string;
  farmName?: string | null;
  locality?: string;
  province?: string;
  placedAt?: string;
  cededAt?: string;
  receivedAt?: string | null;
  operator?: { name: string; type: string; locality: string } | null;
  vaccinationsOk?: boolean;
}

/** Vérification et données servies par le serveur national (cas réel du consommateur). */
async function fromServer(token: string): Promise<View> {
  const lotId = parseToken(token)?.lotId ?? '';
  try {
    const res = await fetch(`${API}/public/lots/${encodeURIComponent(token)}`);
    const j = await res.json();
    if (!j.valid) return { valid: false, lotId };
    if (j.pending) return { valid: true, pending: true, lotId };
    return { valid: true, lotId, farmName: j.farm?.name, locality: j.farm?.locality, province: j.farm?.province, placedAt: j.band?.placedAt, cededAt: j.lot.cededAt, receivedAt: j.lot.receivedAt, operator: j.operator, vaccinationsOk: j.vaccinationsOk };
  } catch {
    // Sans réseau : la signature se vérifie quand même avec la clé publique embarquée.
    const p = parseToken(token);
    return { valid: !!p && verifyLot(p.lotId, p.signature), offline: true, pending: true, lotId };
  }
}

/** Mode démonstration : données de la base locale. */
async function fromLocal(token: string): Promise<View> {
  const p = parseToken(token);
  if (!p || !verifyLot(p.lotId, p.signature)) return { valid: false, lotId: p?.lotId ?? '' };
  await db.scans.put({ id: uid(), lotId: p.lotId, at: new Date().toISOString(), valid: true }).catch(() => undefined);
  const lot = await db.lots.get(p.lotId);
  if (!lot) return { valid: true, pending: true, lotId: p.lotId };
  const [farm, band, op, vacc, settings] = await Promise.all([
    db.farms.get(lot.farmId), db.bands.get(lot.bandId), lot.operatorId ? db.operators.get(lot.operatorId) : undefined,
    db.vaccinations.where('bandId').equals(lot.bandId).toArray(), db.settings.get('global'),
  ]);
  const age = band ? daysBetween(band.placedAt, lot.cededAt) : 0;
  const due = (settings ?? DEFAULT_SETTINGS).vaccinationCalendar.filter((v) => v.day <= age);
  return {
    valid: true, lotId: lot.id, farmName: farm?.name, locality: farm?.locality, province: farm ? provinceName(farm.province) : undefined,
    placedAt: band?.placedAt, cededAt: lot.cededAt, receivedAt: lot.receivedAt, operator: op ? { name: op.name, type: op.type, locality: op.locality } : null,
    vaccinationsOk: due.every((d) => vacc.some((x) => x.vaccine === d.vaccine)),
  };
}

/** Page publique consultée par le consommateur : sans compte, sans donnée personnelle (§ 6.2). */
export function PublicLot() {
  const { token = '' } = useParams();
  const [v, setV] = useState<View | null>(null);
  useEffect(() => {
    const t = decodeURIComponent(token);
    (apiEnabled ? fromServer(t) : fromLocal(t)).then(setV);
  }, [token]);
  if (!v) return <div className="m-shell"><div className="empty">Vérification de l'origine…</div></div>;

  if (!v.valid) {
    return (
      <div className="m-shell">
        <div className="pub-hero" style={{ background: 'linear-gradient(160deg,#7A1F1F,#D64545)' }}>
          <h1>QR code non reconnu</h1>
          <span style={{ fontSize: 14 }}>Ce code n'a pas été émis par Origa. Le produit n'a pas d'origine vérifiée.</span>
        </div>
        <div className="content" style={{ marginTop: 16 }}><div className="note red"><Icon name="warn" size={18} />Signalez ce produit au point de vente ou à l'AGASA.</div></div>
      </div>
    );
  }
  return (
    <div className="m-shell">
      <div className="pub-hero">
        <div className="badge-ga"><div className="flag"><i style={{ background: '#009E60' }} /><i style={{ background: '#FCD116' }} /><i style={{ background: '#3A75C4' }} /></div>Élevé au Gabon</div>
        <h1>{v.locality ? `Ce poulet vient de ${v.locality}, ${v.province}` : 'Origine gabonaise vérifiée'}</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Lot {v.lotId} · origine vérifiée par Origa</span>
      </div>
      <div className="content" style={{ marginTop: -18 }}>
        {v.pending ? (
          <div className="card"><h3>Signature authentique</h3><span className="muted">{v.offline ? 'Pas de réseau : la signature a été vérifiée sur ce téléphone. Le détail du lot s’affichera avec une connexion.' : 'Le détail du lot sera disponible dès sa synchronisation par l’éleveur.'}</span></div>
        ) : (
          <>
            <div className="card" style={{ gap: 0 }}>
              {v.farmName && <div className="kv"><span>Ferme</span><b>{v.farmName}</b></div>}
              <div className="kv"><span>Province</span><b>{v.province}</b></div>
              <div className="kv"><span>Programme</span><b>POUFA</b></div>
              <div className="kv"><span>Vaccinations</span><b className={v.vaccinationsOk ? 'ok' : 'warn'}>{v.vaccinationsOk ? 'Calendrier respecté' : 'Calendrier incomplet'}</b></div>
            </div>
            <div className="card">
              <h3>Parcours du lot</h3>
              <div>
                {v.placedAt && <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>Arrivée des poussins</b><span>{fmtDate(v.placedAt)} · {v.locality}</span></div></div>}
                <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>Élevage suivi au quotidien</b><span>Jusqu'au {fmtDate(v.cededAt!)}</span></div></div>
                <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>{v.operator?.type === 'abattoir' ? 'Abattage' : 'Cession'}</b><span>{fmtDate(v.receivedAt ?? v.cededAt!)} · {v.operator?.name ?? 'Acheteur identifié'}</span></div></div>
                <div className="tl"><div className="rail"><div className="c" style={{ background: '#F5B700', borderColor: '#FFF6D9' }} /></div><div className="tx"><b>En vente</b><span>{v.operator?.locality ?? 'Gabon'}</span></div></div>
              </div>
            </div>
          </>
        )}
        <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>Ce QR code prouve l'origine du produit. Ce n'est pas un certificat sanitaire.<br />
          <a href="mailto:signalement@origa.ga" style={{ color: 'var(--sky)', fontWeight: 700 }}>Signaler un problème</a></span>
      </div>
    </div>
  );
}
