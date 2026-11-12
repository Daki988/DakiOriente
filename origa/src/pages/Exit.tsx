import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, Stepper, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtInt, useBandStats, useCurrentBand, useSession, useSettings } from '../app/hooks';
import { lotId, nextSeq, today, uid } from '../domain/ids';
import { checkExit, withdrawalBlock } from '../domain/rules';
import { signLot } from '../domain/qr';
import { presignedSignature } from '../data/labels';
import { apiEnabled } from '../app/api';
import type { ExitReason } from '../domain/types';


/** Sortie d'animaux et cession du lot : crée le lot, son QR signé et le code de confirmation (§ 6.1). */
export function ExitPage() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const stats = useBandStats(cur?.band);
  const nav = useNavigate();
  const [toast, show] = useToast();
  const settings = useSettings();
  const REASONS = settings.exitReasons as { k: ExitReason; label: string }[];
  const band = cur?.band;
  const operators = useLiveQuery(() => db.operators.toArray(), [], []);
  const treatments = useLiveQuery(() => (band ? db.treatments.where('bandId').equals(band.id).toArray() : []), [band?.id], []);
  const [reason, setReason] = useState<ExitReason>('abattoir');
  const [operatorId, setOperatorId] = useState('');
  const [destination, setDestination] = useState('');
  const [count, setCount] = useState(0);
  const [weight, setWeight] = useState(0);
  const [price, setPrice] = useState(0);
  if (!band || !stats) return null;

  const needsOperator = reason === 'abattoir' || reason === 'vente';
  const eligible = operators.filter((o) => (reason === 'abattoir' ? o.type === 'abattoir' : o.type !== 'abattoir'));
  const check = checkExit(count, stats.present);
  const blocked = withdrawalBlock(treatments, today());
  // Cohérence avec la dernière pesée : un poids moyen déclaré très différent signale une erreur de saisie (même donnée que l'accueil et la page publique).
  const declaredKg = count > 0 && weight > 0 ? weight / count : 0;
  const weighedKg = (stats.avgWeightG ?? 0) / 1000;
  const weightGap = declaredKg && weighedKg ? Math.abs(declaredKg - weighedKg) / weighedKg : 0;
  const valid = check.ok && weight > 0 && (!needsOperator || operatorId) && !(needsOperator && blocked);

  async function submit() {
    const date = today();
    let lid: string | undefined;
    if (needsOperator) {
      const existing = (await db.lots.where('bandId').equals(band!.id).toArray()).map((l) => l.id);
      lid = lotId(band!.id, nextSeq(existing, `${band!.id}-L`, /^(\d{2})$/));
      await save('lots', {
        id: lid, bandId: band!.id, farmId: band!.farmId, count, weightKg: weight, operatorId, cededAt: date,
        // Avec une étiquette pré-signée en réserve, le QR est valide tout de suite, même sans réseau.
        signature: apiEnabled ? (await presignedSignature(lid)) ?? '' : signLot(lid), confirmCode: String(Math.floor(1000 + Math.random() * 9000)),
      }, 'cession de lot');
    }
    await save('exits', { id: uid(), bandId: band!.id, date, count, weightKg: weight, reason, operatorId: operatorId || undefined, destination: destination || undefined, unitPriceXaf: price || undefined, lotId: lid }, 'sortie');
    show('Sortie enregistrée');
    setTimeout(() => nav(lid ? `/lots/${encodeURIComponent(lid)}` : '/'), 600);
  }

  return (
    <>
      <BackBar title="Sortie d'animaux" sub={`${fmtInt(stats.present)} poulets présents`} />
      <div className="content">
        <div className="card">
          <h3>Motif</h3>
          <div className="chips">{REASONS.map((r) => <button key={r.k} className={`chip${reason === r.k ? ' sel-g' : ''}`} onClick={() => { setReason(r.k); setOperatorId(''); }}>{r.label}</button>)}</div>
        </div>
        {needsOperator ? (
          <label className="f">Destinataire (registre des opérateurs)
            <select className="input" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
              <option value="">Choisir…</option>
              {eligible.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.locality}{o.convention ? '' : ' (sans convention)'}</option>)}
            </select>
          </label>
        ) : (
          <label className="f">Localité de destination<input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="ex. Marché de Nkoltang" /></label>
        )}
        <Stepper label="Poulets" value={count} onChange={setCount} step={10} max={stats.present} icon="truck" tint={['var(--green-50)', '#12805C']} />
        <Stepper label="Poids vif total" hint="en kg" value={weight} onChange={setWeight} step={10} icon="scale" tint={['var(--sky-50)', '#2F6FD1']} />
        <Stepper label="Prix unitaire" hint="FCFA par tête (facultatif)" value={price} onChange={setPrice} step={100} />
        {!check.ok && count > 0 && <div className="note red"><Icon name="warn" size={18} />{check.message}</div>}
        {weightGap > 0.25 && <div className="note sun"><Icon name="info" size={18} />Poids moyen déclaré {fmt(declaredKg, 2)} kg par poulet, contre {fmt(weighedKg, 2)} kg à la dernière pesée : vérifiez le poids total ou faites une pesée avant la sortie.</div>}
        {blocked && needsOperator && <div className="note red"><Icon name="warn" size={18} />Cession bloquée : délai d'attente du traitement « {blocked.product} » non écoulé.</div>}
        {!needsOperator && <div className="note sun"><Icon name="info" size={18} />Vente directe : les volumes sont comptés, mais la traçabilité s'arrête à la ferme.</div>}
        <button className="cta green" disabled={!valid} onClick={submit}>{needsOperator ? 'Céder le lot et créer le QR' : 'Enregistrer la sortie'}</button>
      </div>
      {toast}
    </>
  );
}
