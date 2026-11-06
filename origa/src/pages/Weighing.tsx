import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { save } from '../data/repo';
import { refWeight } from '../data/seed';
import { BackBar, Stepper, useToast } from '../components/ui';
import { fmt, fmtInt, useBandStats, useCurrentBand, useSession, useSettings } from '../app/hooks';
import { daysBetween, today, uid } from '../domain/ids';

export function WeighingPage() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const stats = useBandStats(cur?.band);
  const settings = useSettings();
  const nav = useNavigate();
  const [toast, show] = useToast();
  const band = cur?.band;
  const age = band ? daysBetween(band.placedAt, today()) : 0;
  const [sample, setSample] = useState(settings.weighingSample);
  const [avg, setAvg] = useState(() => refWeight(age));
  if (!band || !stats) return null;
  const ref = refWeight(age);
  const gmq = (avg - band.initialWeightG) / Math.max(1, age);

  async function submit() {
    await save('weighings', { id: uid(), bandId: band!.id, date: today(), sampleSize: sample, avgWeightG: avg }, 'pesée');
    show('Pesée enregistrée');
    setTimeout(() => nav('/'), 700);
  }
  return (
    <>
      <BackBar title="Pesée" sub={`Bande ${band.rank} · Jour ${age} · échantillon conseillé ${settings.weighingSample} sujets`} />
      <div className="content">
        <Stepper label="Sujets pesés" value={sample} onChange={setSample} icon="scale" tint={['var(--sky-50)', '#2F6FD1']} />
        <Stepper label="Poids moyen" hint="en grammes" value={avg} onChange={setAvg} step={10} icon="scale" tint={['var(--green-50)', '#12805C']} />
        <div className="card" style={{ gap: 0 }}>
          <div className="kv"><span>Référence de la souche ({band.strain}) au jour {age}</span><b>{fmtInt(ref)} g</b></div>
          <div className="kv"><span>Écart à la référence</span><b className={avg >= ref * 0.95 ? 'ok' : 'warn'}>{fmt(((avg - ref) / ref) * 100, 1)} %</b></div>
          <div className="kv"><span>Gain moyen quotidien</span><b>{fmt(gmq, 0)} g/jour</b></div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="cta green" disabled={sample <= 0 || avg <= 0} onClick={submit}>Enregistrer la pesée</button>
      </div>
      {toast}
    </>
  );
}
