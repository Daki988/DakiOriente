import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { parseToken, verifyLot } from '../domain/qr';
import { provinceName } from '../domain/provinces';
import { addDays, daysBetween, uid } from '../domain/ids';
import { fmtDate, useSettings } from '../app/hooks';
import { Icon } from '../components/Icon';

/** Page publique consultée par le consommateur : sans compte, sans donnée personnelle (§ 6.2). */
export function PublicLot() {
  const { token = '' } = useParams();
  const settings = useSettings();
  const parsed = parseToken(decodeURIComponent(token));
  const valid = !!parsed && verifyLot(parsed.lotId, parsed.signature);
  const data = useLiveQuery(async () => {
    if (!parsed || !valid) return null;
    const lot = await db.lots.get(parsed.lotId);
    if (!lot) return { lot: undefined };
    const [farm, band, op, vacc] = await Promise.all([
      db.farms.get(lot.farmId), db.bands.get(lot.bandId), lot.operatorId ? db.operators.get(lot.operatorId) : undefined,
      db.vaccinations.where('bandId').equals(lot.bandId).toArray(),
    ]);
    return { lot, farm, band, op, vacc };
  }, [token]);

  useEffect(() => {
    if (parsed) db.scans.put({ id: uid(), lotId: parsed.lotId, at: new Date().toISOString(), valid }).catch(() => undefined);
  }, [token]);

  if (!valid) {
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
  const lot = data?.lot;
  const farm = data?.farm;
  const band = data?.band;
  const vaccOk = band && lot ? settings.vaccinationCalendar.filter((v) => v.day <= daysBetween(band.placedAt, lot.cededAt)).every((v) => data?.vacc?.some((x) => x.vaccine === v.vaccine)) : false;

  return (
    <div className="m-shell">
      <div className="pub-hero">
        <div className="badge-ga"><div className="flag"><i style={{ background: '#009E60' }} /><i style={{ background: '#FCD116' }} /><i style={{ background: '#3A75C4' }} /></div>Élevé au Gabon</div>
        <h1>{farm ? `Ce poulet vient de ${farm.locality}, ${provinceName(farm.province)}` : 'Origine gabonaise vérifiée'}</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Lot {parsed!.lotId} · origine vérifiée par Origa</span>
      </div>
      <div className="content" style={{ marginTop: -18 }}>
        {lot && farm && band ? (
          <>
            <div className="card" style={{ gap: 0 }}>
              <div className="kv"><span>Ferme</span><b>{farm.name}</b></div>
              <div className="kv"><span>Province</span><b>{provinceName(farm.province)}</b></div>
              <div className="kv"><span>Programme</span><b>POUFA</b></div>
              <div className="kv"><span>Vaccinations</span><b className={vaccOk ? 'ok' : 'warn'}>{vaccOk ? 'Calendrier respecté' : 'Calendrier incomplet'}</b></div>
            </div>
            <div className="card">
              <h3>Parcours du lot</h3>
              <div>
                <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>Arrivée des poussins</b><span>{fmtDate(band.placedAt)} · {farm.locality}</span></div></div>
                <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>Élevage suivi au quotidien</b><span>Jusqu'au {fmtDate(lot.cededAt)}</span></div></div>
                <div className="tl"><div className="rail"><div className="c" /><div className="ln" /></div><div className="tx"><b>{data?.op?.type === 'abattoir' ? 'Abattage' : 'Cession'}</b><span>{fmtDate(lot.receivedAt ?? addDays(lot.cededAt, 0))} · {data?.op?.name ?? lot.destination}</span></div></div>
                <div className="tl"><div className="rail"><div className="c" style={{ background: '#F5B700', borderColor: '#FFF6D9' }} /></div><div className="tx"><b>En vente</b><span>{data?.op?.locality ?? 'Gabon'}</span></div></div>
              </div>
            </div>
          </>
        ) : (
          <div className="card"><h3>Signature authentique</h3><span className="muted">Le détail du lot s'affichera dès la synchronisation avec le serveur national.</span></div>
        )}
        <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>Ce QR code prouve l'origine du produit. Ce n'est pas un certificat sanitaire.<br />
          <a href="mailto:signalement@origa.ga" style={{ color: 'var(--sky)', fontWeight: 700 }}>Signaler un problème</a></span>
      </div>
    </div>
  );
}
