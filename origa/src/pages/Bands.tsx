import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { fmt, fmtDate, fmtInt, useSession, useSettings } from '../app/hooks';
import { bandStats } from '../domain/kpis';
import { today } from '../domain/ids';

/** Historique des bandes : aucune suppression, comparaison entre bandes (§ 5.1). */
export function BandsPage() {
  const s = useSession();
  const settings = useSettings();
  const rows = useLiveQuery(async () => {
    if (!s.farmId) return [];
    const bands = await db.bands.where('farmId').equals(s.farmId).reverse().sortBy('rank');
    return Promise.all(bands.map(async (b) => {
      const [e, w, x] = await Promise.all([
        db.entries.where('bandId').equals(b.id).toArray(), db.weighings.where('bandId').equals(b.id).toArray(), db.exits.where('bandId').equals(b.id).toArray(),
      ]);
      return { b, st: bandStats(b, e, w, x, settings, today()) };
    }));
  }, [s.farmId, settings], []);
  return (
    <>
      <div className="back"><div><h2>Mes bandes</h2><div className="sub">Bilan automatique à la clôture</div></div></div>
      <div className="content">
        {rows.map(({ b, st }) => (
          <div key={b.id} className="card">
            <div className="row between"><h3>Bande {b.rank} · {b.strain}</h3><span className={`pill ${b.closedAt ? 'sky' : 'on'}`}>{b.closedAt ? 'Clôturée' : 'En cours'}</span></div>
            <span className="muted">Mise en place {fmtDate(b.placedAt)} · {fmtInt(b.chicks)} poussins{b.closedAt ? ` · clôture ${fmtDate(b.closedAt)}` : ''}</span>
            <div className="kpis">
              <div className="kpi"><span className="l">Mortalité</span><span className="v">{fmt(st.mortalityPct, 1)} %</span></div>
              <div className="kpi"><span className="l">IC</span><span className="v">{st.ic ? fmt(st.ic, 2) : '—'}</span></div>
              <div className="kpi"><span className="l">Sortis</span><span className="v">{fmtInt(st.exited)}</span></div>
              <div className="kpi"><span className="l">Poids vif sorti</span><span className="v">{fmt(st.exitedWeightKg / 1000, 1)} t</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
