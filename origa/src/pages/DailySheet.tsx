import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, Stepper, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtInt, fmtLongDate, useBandStats, useCurrentBand, useOnline, useSession, useSettings } from '../app/hooks';
import { daysBetween, today, uid } from '../domain/ids';
import { checkDeaths, thresholdAlert, trendAlert } from '../domain/rules';
import type { DailyEntry } from '../domain/types';

/** Fiche d'élevage du jour : 3 champs, saisie hors ligne, contrôles de cohérence (§ 5.1). */
export function DailySheet() {
  const s = useSession();
  const cur = useCurrentBand(s.farmId);
  const stats = useBandStats(cur?.band);
  const settings = useSettings();
  const online = useOnline();
  const nav = useNavigate();
  const [toast, show] = useToast();
  const [existing, setExisting] = useState<DailyEntry | null>(null);
  const [deaths, setDeaths] = useState(0);
  const [feed, setFeed] = useState(0);
  const [water, setWater] = useState(0);
  const band = cur?.band;

  useEffect(() => {
    if (!band) return;
    db.entries.where('[bandId+date]').equals([band.id, today()]).first().then((e) => {
      if (e) { setExisting(e); setDeaths(e.deaths); setFeed(e.feedKg); setWater(e.waterL ?? 0); return; }
      db.entries.where('bandId').equals(band.id).sortBy('date').then((all) => {
        const last = all.at(-1);
        if (last) { setFeed(last.feedKg); setWater(last.waterL ?? 0); }
      });
    });
  }, [band?.id]);

  if (!band || !stats) return null;
  const presentBefore = stats.present + (existing?.deaths ?? 0);
  const check = checkDeaths(deaths, presentBefore);
  const pct = presentBefore ? (deaths / presentBefore) * 100 : 0;
  const over = pct > settings.alertDailyMortalityPct;

  async function submit() {
    if (!check.ok || !band) return;
    const entry: DailyEntry = { id: existing?.id ?? uid(), bandId: band.id, date: today(), deaths, feedKg: feed, waterL: water || undefined, createdAt: new Date().toISOString() };
    await save('entries', entry, existing ? 'modification fiche du jour' : 'fiche du jour');
    await save('inputs', { id: `use-${entry.id}`, farmId: band.farmId, bandId: band.id, date: entry.date, type: 'aliment', product: 'Aliment', quantity: feed, unit: 'kg', kind: 'utilisation' });
    const previous = (await db.entries.where('bandId').equals(band.id).sortBy('date')).filter((e) => e.date < entry.date);
    const msg = thresholdAlert(deaths, presentBefore, settings) ?? trendAlert(deaths, previous);
    if (msg) {
      const at = new Date().toISOString();
      await save('alerts', { id: uid(), farmId: band.farmId, bandId: band.id, createdAt: at, source: thresholdAlert(deaths, presentBefore, settings) ? 'seuil' : 'tendance', message: msg, status: 'nouvelle', history: [{ at, status: 'nouvelle', by: 'Système' }] }, 'alerte automatique');
    }
    show(online ? 'Fiche enregistrée' : 'Fiche enregistrée sur le téléphone');
    setTimeout(() => nav('/'), 700);
  }

  return (
    <>
      <BackBar title="Fiche du jour" sub={`Bande ${band.rank} · Jour ${daysBetween(band.placedAt, today())} · ${fmtLongDate(today())}`} />
      <div className="content">
        <Stepper label="Morts" hint={`Effectif présent : ${fmtInt(presentBefore)}`} value={deaths} onChange={setDeaths} icon="minus" tint={['var(--red-50)', '#D64545']} />
        <Stepper label="Aliment distribué" hint="en kg" value={feed} onChange={setFeed} step={5} icon="feed" tint={['var(--sun-50)', '#B07D00']} />
        <Stepper label={<>Eau bue <span style={{ fontWeight: 500, color: 'var(--ink-3)' }}>(facultatif)</span></>} hint="en litres" value={water} onChange={setWater} step={10} icon="drop" tint={['var(--sky-50)', '#2F6FD1']} />
        <div className="card">
          <div className="row between"><h3>Contrôle automatique</h3>
            <span className={`pill ${!check.ok ? 'red' : over ? 'off' : 'on'}`}>{!check.ok ? 'Incohérent' : over ? 'Alerte' : 'Cohérent'}</span></div>
          <span className="muted">{!check.ok ? check.message : `Mortalité du jour ${fmt(pct, 2)} % : ${over ? 'au-dessus' : 'sous'} le seuil d'alerte vétérinaire (${fmt(settings.alertDailyMortalityPct, 1)} %).`}</span>
          {over && check.ok && <span className="muted">Les services vétérinaires seront prévenus à l'enregistrement.</span>}
        </div>
        {!online && <div className="note"><Icon name="info" size={18} />Pas de réseau : la fiche est enregistrée sur le téléphone et sera envoyée automatiquement.</div>}
        <div style={{ flex: 1 }} />
        <button className="cta green" disabled={!check.ok} onClick={submit}>Enregistrer la fiche</button>
      </div>
      {toast}
    </>
  );
}
