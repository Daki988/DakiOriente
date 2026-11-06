import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, useToast } from '../components/ui';
import { fmtDate, fmtInt, useSession } from '../app/hooks';
import { stockByType } from '../domain/kpis';

const LABEL: Record<string, string> = { poussins: 'Poussins', aliment: 'Aliment', vaccin: 'Vaccins', medicament: 'Médicaments', autre: 'Autres' };

/** Intrants reçus et utilisés : stock, confirmation de réception par l'éleveur (§ 5.1). */
export function InputsPage() {
  const s = useSession();
  const [toast, show] = useToast();
  const movs = useLiveQuery(() => (s.farmId ? db.inputs.where('farmId').equals(s.farmId).reverse().sortBy('date') : []), [s.farmId], []);
  const stock = stockByType(movs.filter((m) => m.type !== 'poussins'));
  const receptions = movs.filter((m) => m.kind === 'reception');
  return (
    <>
      <BackBar title="Intrants" sub="Fournis par l'État (subvention dégressive)" />
      <div className="content">
        <div className="kpis">
          {Object.entries(stock).map(([t, q]) => (
            <div key={t} className="kpi"><span className="l">Stock {LABEL[t] ?? t}</span><span className={`v ${q < 0 ? 'bad' : ''}`}>{fmtInt(q)}</span><span className="s">{q < 0 ? 'Stock négatif : à vérifier' : 'kg'}</span></div>
          ))}
        </div>
        <div className="card">
          <h3>Réceptions</h3>
          <div className="list">
            {receptions.map((m) => (
              <div key={m.id} className="li">
                <div className="grow"><b>{m.product}</b><span>{fmtInt(m.quantity)} {m.unit} · {m.supplier} · lot {m.supplierLot ?? '—'} · {fmtDate(m.date)}</span></div>
                {m.confirmed ? <span className="pill on">Confirmé</span> : (
                  <button className="pill sky" onClick={async () => { await save('inputs', { ...m, confirmed: true }, 'confirmation de réception'); show('Réception confirmée'); }}>Confirmer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast}
    </>
  );
}
