import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../data/db';
import { parseToken, verifyLot } from '../domain/qr';
import { provinceName } from '../domain/provinces';
import { daysBetween, uid } from '../domain/ids';
import { fmt, fmtDate, fmtInt } from '../app/hooks';
import { withdrawalBlock } from '../domain/rules';
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
  /** Données saisies du lot. */
  count?: number | null;
  weightKg?: number | null;
  /** Effectif et poids cédés par la ferme (lot d'origine pour un lot transformé). */
  cededCount?: number | null;
  cededWeightKg?: number | null;
  cededAt?: string;
  receivedAt?: string | null;
  receivedCount?: number | null;
  distributorCheckedAt?: string | null;
  product?: string | null;
  parentId?: string | null;
  band?: { rank: number | null; placedAt: string; strain: string | null; ageDays: number } | null;
  operator?: { name: string; type: string; locality: string } | null;
  vaccinations?: { vaccine: string; date: string }[];
  treatments?: { count: number; withdrawalOk: boolean };
  movements?: { date: string; from: string; to: string }[];
  vaccinationsOk?: boolean;
  /** QR signé par une version de démonstration, avant le branchement au serveur national. */
  demoQr?: boolean;
}

/** Vérification et données servies par le serveur national (cas réel du consommateur). */
async function fromServer(token: string): Promise<View> {
  const lotId = parseToken(token)?.lotId ?? '';
  try {
    const res = await fetch(`${API}/public/lots/${encodeURIComponent(token)}`, { cache: 'no-store' });
    const j = await res.json();
    if (!j.valid) return { valid: false, lotId, demoQr: !!j.demo };
    if (j.pending) return { valid: true, pending: true, lotId };
    return {
      valid: true, lotId, farmName: j.farm?.name, locality: j.farm?.locality, province: j.farm?.province,
      count: j.lot.count, weightKg: j.lot.weightKg, cededCount: j.lot.cededCount ?? j.lot.count, cededWeightKg: j.lot.cededWeightKg ?? j.lot.weightKg, cededAt: j.lot.cededAt, receivedAt: j.lot.receivedAt, receivedCount: j.lot.receivedCount,
      distributorCheckedAt: j.lot.distributorCheckedAt, product: j.lot.product, parentId: j.lot.parentId,
      band: j.band, operator: j.operator, vaccinations: j.vaccinations ?? [], treatments: j.treatments, movements: j.movements ?? [], vaccinationsOk: j.vaccinationsOk,
    };
  } catch {
    // Sans réseau : la signature se vérifie quand même avec la clé publique embarquée.
    const p = parseToken(token);
    return { valid: !!p && verifyLot(p.lotId, p.signature), offline: true, pending: true, lotId };
  }
}

/** Mode démonstration : les mêmes données, lues dans la base locale. */
async function fromLocal(token: string): Promise<View> {
  const p = parseToken(token);
  if (!p || !verifyLot(p.lotId, p.signature)) return { valid: false, lotId: p?.lotId ?? '' };
  await db.scans.put({ id: uid(), lotId: p.lotId, at: new Date().toISOString(), valid: true }).catch(() => undefined);
  const lot = await db.lots.get(p.lotId);
  if (!lot) return { valid: true, pending: true, lotId: p.lotId };
  const [farm, band, op, vacc, treatments, movements, settings] = await Promise.all([
    db.farms.get(lot.farmId), db.bands.get(lot.bandId), lot.operatorId ? db.operators.get(lot.operatorId) : undefined,
    db.vaccinations.where('bandId').equals(lot.bandId).toArray(), db.treatments.where('bandId').equals(lot.bandId).toArray(),
    db.movements.filter((m) => m.lotId === lot.id).toArray(), db.settings.get('global'),
  ]);
  const age = band ? daysBetween(band.placedAt, lot.cededAt) : 0;
  const due = (settings ?? DEFAULT_SETTINGS).vaccinationCalendar.filter((v) => v.day <= age);
  return {
    valid: true, lotId: lot.id, farmName: farm?.name, locality: farm?.locality, province: farm ? provinceName(farm.province) : undefined,
    count: lot.count, weightKg: lot.weightKg, cededAt: lot.cededAt, receivedAt: lot.receivedAt ?? null, receivedCount: lot.receivedCount ?? null,
    distributorCheckedAt: lot.distributorCheckedAt ?? null, product: lot.derivedProduct ?? null, parentId: lot.parentId ?? null,
    band: band ? { rank: band.rank, placedAt: band.placedAt, strain: band.strain ?? null, ageDays: age } : null,
    operator: op ? { name: op.name, type: op.type, locality: op.locality } : null,
    vaccinations: vacc.map((v) => ({ vaccine: v.vaccine, date: v.date })).sort((x, y) => x.date.localeCompare(y.date)),
    treatments: { count: treatments.length, withdrawalOk: !withdrawalBlock(treatments, lot.cededAt) },
    movements: movements.map((m) => ({ date: m.date, from: m.from, to: m.to })).sort((x, y) => x.date.localeCompare(y.date)),
    vaccinationsOk: due.every((d) => vacc.some((x) => x.vaccine === d.vaccine)),
  };
}

/** Une étape du parcours : faite (verte) ou à venir (grise). */
function Step({ title, sub, done = true, last = false }: { title: string; sub?: string; done?: boolean; last?: boolean }) {
  return (
    <div className="tl">
      <div className="rail"><div className="c" style={done ? undefined : { background: '#C9D4CF', borderColor: '#EEF2F0' }} />{!last && <div className="ln" />}</div>
      <div className="tx"><b style={done ? undefined : { color: 'var(--ink-3)' }}>{title}</b>{sub && <span>{sub}</span>}</div>
    </div>
  );
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
    if (v.demoQr) return (
      <div className="m-shell">
        <div className="pub-hero" style={{ background: 'linear-gradient(160deg,#6B5000,#B07D00)' }}>
          <h1>QR code de démonstration</h1>
          <span style={{ fontSize: 14 }}>Ce code a été créé par une version d’essai d’Origa, avant son branchement au serveur national. Il est authentique mais ne contient aucune donnée.</span>
        </div>
        <div className="content" style={{ marginTop: 16 }}><div className="note sun"><Icon name="info" size={18} />Pour obtenir un QR lisible, mettez l’application à jour puis cédez un nouveau lot.</div></div>
      </div>
    );
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
      <div className="pub-hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.9),rgba(18,128,92,.78)),url(./img/poule.webp)' }}>
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
              <h3 style={{ paddingBottom: 6 }}>Ce lot</h3>
              <div className="kv"><span>Produit</span><b>{v.product ?? 'Poulets de chair'}{v.parentId ? ` · issu du lot ${v.parentId}` : ''}</b></div>
              {v.count ? <div className="kv"><span>Quantité</span><b>{fmtInt(v.count)} {v.product ? 'unités' : 'poulets'}{v.weightKg ? ` · ${fmtInt(v.weightKg)} kg` : ''}</b></div> : null}
              {v.count && v.weightKg && !v.product ? <div className="kv"><span>Poids moyen</span><b>{fmt(v.weightKg / v.count, 2)} kg par poulet</b></div> : null}
              {v.farmName && <div className="kv"><span>Ferme</span><b>{v.farmName}</b></div>}
              <div className="kv"><span>Localité</span><b>{[v.locality, v.province].filter(Boolean).join(', ')}</b></div>
              {v.band && <div className="kv"><span>Élevage</span><b>Bande {v.band.rank ?? '—'}{v.band.strain ? ` · ${v.band.strain}` : ''} · {v.band.ageDays} jours</b></div>}
              <div className="kv"><span>Vaccinations</span><b className={v.vaccinationsOk ? 'ok' : 'warn'}>{v.vaccinations?.length ? v.vaccinations.map((x) => x.vaccine).join(', ') : v.vaccinationsOk ? 'Aucune requise à cet âge' : 'Aucune enregistrée'}</b></div>
              {!v.vaccinationsOk && <div className="kv"><span /><b className="warn">Calendrier vaccinal incomplet</b></div>}
              <div className="kv"><span>Traitements</span><b className={v.treatments?.withdrawalOk === false ? 'bad' : 'ok'}>{!v.treatments?.count ? 'Aucun traitement' : v.treatments.withdrawalOk ? `${v.treatments.count} · délai d'attente respecté` : `${v.treatments.count} · délai d'attente non écoulé`}</b></div>
              <div className="kv"><span>Programme</span><b>POUFA</b></div>
            </div>
            <div className="card">
              <h3>Parcours du lot</h3>
              <div>
                {v.band && <Step title="Arrivée des poussins" sub={`${fmtDate(v.band.placedAt)} · ${v.locality ?? ''}`} />}
                {v.band && <Step title="Élevage suivi au quotidien" sub={`${v.band.ageDays} jours à la ferme`} />}
                <Step title={`Sortie de la ferme vers ${v.operator?.name ?? 'un acheteur identifié'}`} sub={`${fmtDate(v.cededAt!)}${v.cededCount ?? v.count ? ` · ${fmtInt((v.cededCount ?? v.count)!)} poulets` : ''}${v.cededWeightKg ?? v.weightKg ? `, ${fmtInt((v.cededWeightKg ?? v.weightKg)!)} kg` : ''}`} />
                {v.receivedAt
                  ? <Step title={v.operator?.type === 'abattoir' ? "Réception et abattage à l'abattoir" : 'Réception par le destinataire'} sub={`${fmtDate(v.receivedAt)}${v.receivedCount ? ` · ${fmtInt(v.receivedCount)} reçus` : ''} · ${v.operator?.locality ?? ''}`} />
                  : <Step done={false} title={v.operator?.type === 'abattoir' ? "Réception à l'abattoir" : 'Réception par le destinataire'} sub="En attente : le lot n'a pas encore été réceptionné" last={!v.movements?.length} />}
                {(v.movements ?? []).map((m, i) => <Step key={i} title={`Transport vers ${m.to}`} sub={`${fmtDate(m.date)} · depuis ${m.from}`} />)}
                {v.distributorCheckedAt && <Step title="Origine contrôlée par le distributeur" sub={fmtDate(v.distributorCheckedAt)} />}
                {v.receivedAt && <Step title="En vente" sub={(v.movements?.length ? v.movements.at(-1)!.to : v.operator?.locality) ?? 'Gabon'} last />}
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
