import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { fmtDate, fmtInt } from '../app/hooks';
import type { Lot, Operator } from '../domain/types';
import { buildEpcis } from '../domain/epcis';
import { Icon } from '../components/Icon';

/** Recherche amont / aval (§ 6.3) : de la ferme, la bande, le lot ou le lot d'aliment vers les destinataires. */
export function TracePage() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ lots: Lot[]; ops: Operator[]; note: string } | null>(null);

  async function search() {
    const term = q.trim().toUpperCase();
    if (!term) return;
    const [lots, ops, inputs] = await Promise.all([db.lots.toArray(), db.operators.toArray(), db.inputs.toArray()]);
    let bands = new Set<string>();
    let note = '';
    const supplier = inputs.filter((i) => i.supplierLot?.toUpperCase() === term);
    if (supplier.length) { bands = new Set(supplier.map((i) => i.bandId!).filter(Boolean)); note = `Lot fournisseur ${term} : ${bands.size} bande(s) concernée(s).`; }
    const found = lots.filter((l) => bands.has(l.bandId) || l.id.startsWith(term) || l.farmId === term || l.bandId === term);
    setRes({ lots: found, ops, note: note || `${found.length} lot(s) trouvé(s).` });
  }

  function exportCsv() {
    if (!res) return;
    const rows = res.lots.map((l) => [l.id, l.farmId, l.cededAt, l.count, l.weightKg, res.ops.find((o) => o.id === l.operatorId)?.name ?? l.destination ?? ''].join(';'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿Lot;Ferme;Date;Poulets;Poids kg;Destinataire\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `origa-rappel-${q.trim()}.csv`; a.click();
  }

  async function exportEpcis() {
    if (!res) return;
    const ids = new Set(res.lots.map((l) => l.id));
    // Les lots dérivés (transformation) et les transports des lots trouvés font partie de l'histoire à exporter.
    const derived = (await db.lots.toArray()).filter((l) => l.parentId && ids.has(l.parentId) && !ids.has(l.id));
    const movements = (await db.movements.toArray()).filter((m) => ids.has(m.lotId));
    const doc = buildEpcis({ lots: [...res.lots, ...derived], movements });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/ld+json' }));
    a.download = `origa-epcis-${q.trim()}.jsonld`; a.click();
  }

  return (
    <>
      <div className="top"><div><h1>Traçabilité et rappel de lot</h1><span className="muted">Ferme (GA1-0042), bande (GA1-0042-B06), lot ou numéro de lot d'aliment.</span></div></div>
      <div className="panel">
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="sel" style={{ flex: 1, minWidth: 240 }} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Identifiant à rechercher…" />
          <button className="sel dark" onClick={search}>Rechercher</button>
          {res && res.lots.length > 0 && <button className="sel" onClick={exportCsv}>Exporter pour l'AGASA (CSV)</button>}
          {res && res.lots.length > 0 && <button className="sel" onClick={exportEpcis}>Exporter EPCIS 2.0 (JSON)</button>}
        </div>
        {res && <span className="muted">{res.note}</span>}
        {res && res.lots.length > 0 && (
          <table className="tbl">
            <thead><tr><th>Lot</th><th>Ferme</th><th>Cédé le</th><th>Poulets</th><th>Poids vif</th><th>Destinataire</th><th>Réception</th></tr></thead>
            <tbody>
              {res.lots.map((l) => (
                <tr key={l.id}><td><Link className="lotid" style={{ fontSize: 13 }} to={`/lots/${encodeURIComponent(l.id)}`}>{l.id}</Link></td><td>{l.farmId}</td><td>{fmtDate(l.cededAt)}</td>
                  <td>{fmtInt(l.count)}</td><td>{fmtInt(l.weightKg)} kg</td><td>{res.ops.find((o) => o.id === l.operatorId)?.name ?? l.destination}</td>
                  <td>{l.receivedAt ? <span className="pill on">Validée</span> : <span className="pill off">En attente</span>}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {res && res.lots.length > 0 && <div className="note"><Icon name="info" size={18} />EPCIS 2.0 est le format international GS1 d'échange des événements de traçabilité. Le fichier contient, pour chaque lot : cession, transport, réception, transformation et contrôle du distributeur.</div>}
      </div>
    </>
  );
}
