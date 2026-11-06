import { useState } from 'react';
import { db } from '../data/db';
import { save } from '../data/repo';
import { useToast } from '../components/ui';
import { parseCsv, toCsv } from '../domain/csv';
import { farmId as makeFarmId, nextSeq, uid } from '../domain/ids';
import { PROVINCES } from '../domain/provinces';
import type { Farm, InputType, ProvinceCode } from '../domain/types';

type Kind = 'fermes' | 'fiches' | 'intrants';
const TEMPLATES: Record<Kind, { label: string; source: string; cols: string[]; example: string[] }> = {
  fermes: { label: 'Fermes (formulaires AMI)', source: 'Formulaires d’inscription AMI', cols: ['province', 'nom', 'exploitant', 'telephone', 'localite', 'ref_ami', 'capacite', 'cohorte', 'latitude', 'longitude'], example: ['GA1', 'Ferme Exemple', 'M. Exemple', '+24107000000', 'Ntoum', 'AMI-2026-200', '3000', '2', '0.39', '9.78'] },
  fiches: { label: 'Fiches d’élevage', source: 'Fiches papier et outil transitoire', cols: ['bande', 'date', 'morts', 'aliment_kg', 'eau_l'], example: ['GA1-0042-B07', '2026-10-20', '4', '310', '590'] },
  intrants: { label: 'Intrants livrés', source: 'Bons de livraison', cols: ['ferme', 'date', 'type', 'produit', 'quantite', 'unite', 'fournisseur', 'lot_fournisseur', 'subventionne'], example: ['GA1-0042', '2026-10-14', 'aliment', 'Aliment démarrage', '2000', 'kg', 'SMAG', 'AL-123', 'oui'] },
};
const TYPES: InputType[] = ['poussins', 'aliment', 'vaccin', 'medicament', 'autre'];
interface Line { n: number; raw: Record<string, string>; ok: boolean; message: string; apply?: () => Promise<void> }

/** Reprise complète et contrôlée des données existantes, avec rapport de reprise (§ 5.4, § 9). */
export function ImportPage() {
  const [kind, setKind] = useState<Kind>('fermes');
  const [lines, setLines] = useState<Line[]>([]);
  const [done, setDone] = useState<Line[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();
  const t = TEMPLATES[kind];

  const download = (name: string, content: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); };

  async function analyse(text: string) {
    const rows = parseCsv(text); setDone(null);
    const [farms, bands, entries] = await Promise.all([db.farms.toArray(), db.bands.toArray(), db.entries.toArray()]);
    const ids = farms.map((f) => f.id); const phones = new Set(farms.map((f) => f.phone.replace(/\s/g, '')));
    const out: Line[] = rows.map((r, i) => {
      const n = i + 2;
      const missing = t.cols.filter((c) => ['latitude', 'longitude', 'eau_l', 'lot_fournisseur', 'ref_ami', 'fournisseur', 'subventionne'].indexOf(c) < 0 && !r[c]);
      if (missing.length) return { n, raw: r, ok: false, message: `Colonne(s) vide(s) : ${missing.join(', ')}` };
      if (kind === 'fermes') {
        const prov = r.province.toUpperCase() as ProvinceCode;
        if (!PROVINCES[prov]) return { n, raw: r, ok: false, message: `Province inconnue « ${r.province} » (GA1 à GA9)` };
        const phone = r.telephone.replace(/\s/g, '');
        if (phones.has(phone)) return { n, raw: r, ok: false, message: 'Doublon : un exploitant avec ce téléphone existe déjà' };
        phones.add(phone);
        const id = makeFarmId(prov, nextSeq(ids, `${prov}-`, /^(\d{4})$/)); ids.push(id);
        const farm: Farm = { id, name: r.nom, owner: r.exploitant, phone: r.telephone, province: prov, locality: r.localite, amiRef: r.ref_ami || undefined, capacity: Number(r.capacite) || 0, buildings: 1, status: 'preparation', cohort: r.cohorte === '1' ? 1 : 2, bcegFinanced: false, lat: r.latitude ? Number(r.latitude) : undefined, lng: r.longitude ? Number(r.longitude) : undefined, createdAt: new Date().toISOString() };
        return { n, raw: r, ok: true, message: `Ferme ${id} créée`, apply: async () => { await save('farms', farm, 'reprise : ferme (AMI)'); } };
      }
      if (kind === 'fiches') {
        const band = bands.find((b) => b.id === r.bande);
        if (!band) return { n, raw: r, ok: false, message: `Bande inconnue « ${r.bande} »` };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || r.date < band.placedAt) return { n, raw: r, ok: false, message: 'Date invalide ou antérieure à la mise en place (format AAAA-MM-JJ)' };
        const deaths = Number(r.morts); const feed = Number(r.aliment_kg.replace(',', '.'));
        if (!Number.isInteger(deaths) || deaths < 0 || !(feed >= 0)) return { n, raw: r, ok: false, message: 'Morts ou aliment invalides' };
        const existing = entries.find((e) => e.bandId === band.id && e.date === r.date);
        return { n, raw: r, ok: true, message: existing ? 'Fiche existante mise à jour' : 'Fiche reprise', apply: async () => { await save('entries', { id: existing?.id ?? uid(), bandId: band.id, date: r.date, deaths, feedKg: feed, waterL: r.eau_l ? Number(r.eau_l) : undefined, createdAt: new Date().toISOString() }, 'reprise : fiche d’élevage'); } };
      }
      if (!farms.some((f) => f.id === r.ferme)) return { n, raw: r, ok: false, message: `Ferme inconnue « ${r.ferme} »` };
      if (!TYPES.includes(r.type as InputType)) return { n, raw: r, ok: false, message: `Type inconnu « ${r.type} » (${TYPES.join(', ')})` };
      const q = Number(r.quantite.replace(',', '.'));
      if (!(q > 0)) return { n, raw: r, ok: false, message: 'Quantité invalide' };
      return { n, raw: r, ok: true, message: 'Livraison reprise', apply: async () => { await save('inputs', { id: uid(), farmId: r.ferme, date: r.date, type: r.type as InputType, product: r.produit, quantity: q, unit: r.unite, kind: 'reception', supplier: r.fournisseur || undefined, supplierLot: r.lot_fournisseur || undefined, subsidized: /^(oui|1|true)$/i.test(r.subventionne ?? ''), confirmed: true }, 'reprise : intrant'); } };
    });
    setLines(out);
  }

  async function run() {
    setBusy(true);
    for (const l of lines) if (l.ok && l.apply) await l.apply();
    setDone(lines); setLines([]); setBusy(false); show('Reprise terminée');
  }
  const ok = lines.filter((l) => l.ok).length;

  return (
    <>
      <div className="top"><div><h1>Reprise des données existantes</h1><span className="muted">Aucune donnée antérieure à la mise en service ne doit être perdue : chaque ligne est contrôlée, importée, journalisée et tracée dans un rapport.</span></div></div>
      <div className="panel">
        <div className="row wrap" style={{ gap: 8 }}>
          {(Object.keys(TEMPLATES) as Kind[]).map((k) => <button key={k} className={`sel${kind === k ? ' dark' : ''}`} onClick={() => { setKind(k); setLines([]); setDone(null); }}>{TEMPLATES[k].label}</button>)}
        </div>
        <span className="muted">Source : {t.source}. Colonnes attendues : <b>{t.cols.join(' ; ')}</b>.</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="sel" onClick={() => download(`modele-${kind}.csv`, toCsv([Object.fromEntries(t.cols.map((c, i) => [c, t.example[i]]))]))}>Télécharger le modèle CSV</button>
          <label className="sel dark" style={{ cursor: 'pointer' }}>Choisir le fichier CSV<input type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) analyse(await f.text()); e.target.value = ''; }} /></label>
        </div>
      </div>
      {lines.length > 0 && (
        <div className="panel">
          <div className="row between wrap"><h3>Contrôle avant import : {ok} ligne(s) valide(s), {lines.length - ok} rejetée(s)</h3><button className="sel dark" disabled={!ok || busy} onClick={run}>{busy ? 'Import…' : `Importer ${ok} ligne(s)`}</button></div>
          <table className="tbl"><thead><tr><th>Ligne</th><th>Statut</th><th>Détail</th></tr></thead>
            <tbody>{lines.map((l) => <tr key={l.n}><td>{l.n}</td><td><span className={`pill ${l.ok ? 'on' : 'red'}`}>{l.ok ? 'Valide' : 'Rejetée'}</span></td><td>{l.message}</td></tr>)}</tbody></table>
        </div>
      )}
      {done && (
        <div className="panel">
          <div className="row between wrap"><h3>Rapport de reprise : {done.filter((l) => l.ok).length} importée(s), {done.filter((l) => !l.ok).length} rejetée(s)</h3>
            <button className="sel dark" onClick={() => download(`rapport-reprise-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(done.map((l) => ({ ligne: l.n, statut: l.ok ? 'importée' : 'rejetée', detail: l.message, ...l.raw }))))}>Télécharger le rapport</button></div>
          <span className="muted">Les lignes rejetées sont à corriger dans le fichier source puis à réimporter.</span>
        </div>
      )}
      {toast}
    </>
  );
}
