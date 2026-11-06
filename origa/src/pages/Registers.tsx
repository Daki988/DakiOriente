import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { Registry } from '../components/Registry';
import { useCurrentBand, useSession, useSettings, fmtDate, fmtInt } from '../app/hooks';
import { addDays, uid, today } from '../domain/ids';
import type { Charge, Consultation, Diagnostic, InputOrder, Offer, PriceRecord, SlaughterBooking, Treatment, Vaccination, Visit } from '../domain/types';

const xaf = (n?: number) => (n === undefined ? '—' : `${fmtInt(n)} FCFA`);
const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

/** Mon périmètre : éleveur (sa ferme), agent (ses fermes), autres (tout). */
function useScope() {
  const s = useSession();
  return (farmId?: string) => (s.role === 'eleveur' ? farmId === s.farmId : s.role === 'agent' ? !!farmId && !!s.farmIds?.includes(farmId) : true);
}
const web = (role: string) => !['eleveur', 'agent', 'operateur'].includes(role);

// ---------- Registre des vaccinations (§ 5.2) ----------
export function VaccinationsPage() {
  const s = useSession(); const st = useSettings(); const cur = useCurrentBand(s.farmId);
  const bandIds = useLiveQuery(async () => (await db.bands.toArray()).filter((b) => b.farmId === s.farmId || web(s.role)).map((b) => b.id), [s.farmId], [] as string[]);
  return (
    <Registry<Vaccination & { id: string }>
      title="Vaccinations" sub="Comparées au calendrier vaccinal de référence" table="vaccinations" action="vaccination"
      fields={[
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'vaccine', label: 'Vaccin', type: 'select', required: true, options: opt([...new Set([...st.vaccinationCalendar.map((v) => v.vaccine), 'Autre'])]) },
        { key: 'method', label: 'Mode', type: 'select', required: true, options: opt(['Eau de boisson', 'Injection', 'Nébulisation', 'Goutte oculaire']) },
        { key: 'animals', label: 'Nombre d’animaux', type: 'number', required: true },
      ]}
      defaults={() => ({ animals: cur?.band?.chicks })}
      prepare={(d) => (cur?.band ? { ...d, bandId: cur.band.id } : 'Aucune bande en cours : ouvrez d’abord une bande.')}
      filter={(r) => bandIds.includes(r.bandId)}
      columns={[{ label: 'Vaccin', render: (r) => r.vaccine }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Mode', render: (r) => r.method }, { label: 'Animaux', render: (r) => fmtInt(r.animals) }]}
      empty={{ title: 'Aucune vaccination enregistrée', text: 'Chaque vaccination est rattachée à la bande en cours puis au lot.' }}
    />
  );
}

// ---------- Registre des traitements (§ 5.2) ----------
export function TreatmentsPage() {
  const s = useSession(); const st = useSettings(); const cur = useCurrentBand(s.farmId);
  const bandIds = useLiveQuery(async () => (await db.bands.toArray()).filter((b) => b.farmId === s.farmId || web(s.role)).map((b) => b.id), [s.farmId], [] as string[]);
  return (
    <Registry<Treatment & { id: string }>
      title="Traitements" sub="Le délai d'attente bloque la cession des lots traités" table="treatments" action="traitement"
      fields={[
        { key: 'product', label: 'Produit', type: 'select', required: true, options: opt(st.treatmentProducts.map((p) => p.product)) },
        { key: 'reason', label: 'Motif', type: 'text', required: true },
        { key: 'startDate', label: 'Début', type: 'date', required: true },
        { key: 'endDate', label: 'Fin', type: 'date', required: true },
        { key: 'animals', label: 'Animaux traités', type: 'number', required: true },
      ]}
      defaults={() => ({ startDate: today(), endDate: addDays(today(), 3), animals: cur?.band?.chicks })}
      prepare={(d) => {
        if (!cur?.band) return 'Aucune bande en cours.';
        if (d.endDate < d.startDate) return 'La date de fin précède la date de début.';
        const withdrawalDays = st.treatmentProducts.find((p) => p.product === d.product)?.withdrawalDays ?? 0;
        return { ...d, bandId: cur.band.id, withdrawalDays };
      }}
      filter={(r) => bandIds.includes(r.bandId)}
      columns={[
        { label: 'Produit', render: (r) => r.product }, { label: 'Période', render: (r) => `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}` },
        { label: 'Motif', render: (r) => r.reason }, { label: 'Fin du délai d’attente', render: (r) => fmtDate(addDays(r.endDate, r.withdrawalDays)) },
      ]}
      empty={{ title: 'Aucun traitement', text: 'Les traitements reçus avant la vente apparaissent dans l’historique du lot.' }}
    />
  );
}

// ---------- Charges d'exploitation (§ 5.3) ----------
export function ChargesPage() {
  const s = useSession(); const st = useSettings(); const inScope = useScope();
  return (
    <Registry<Charge & { id: string }>
      title="Charges d'exploitation" sub="Base du coût de production et de la marge" table="charges" action="charge" web={web(s.role)}
      fields={[
        { key: 'farmId', label: 'Ferme', type: 'farm', required: true }, { key: 'bandId', label: 'Bande', type: 'band' },
        { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'post', label: 'Poste', type: 'select', required: true, options: opt(st.chargePosts) },
        { key: 'amountXaf', label: 'Montant (FCFA)', type: 'number', required: true }, { key: 'note', label: 'Précision', type: 'text' },
      ]}
      prepare={(d) => (d.amountXaf > 0 ? d : 'Le montant doit être positif.')}
      filter={(r) => inScope(r.farmId)}
      columns={[{ label: 'Poste', render: (r) => r.post }, { label: 'Montant', render: (r) => xaf(r.amountXaf) }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Ferme', render: (r) => r.farmId }]}
      empty={{ title: 'Aucune charge', text: 'Saisissez poussins, aliment, main-d’œuvre, énergie, transport…' }}
    />
  );
}

// ---------- Commandes d'intrants : demande → validation DGE → livraison ----------
export function OrdersPage() {
  const s = useSession(); const st = useSettings(); const inScope = useScope();
  const dge = s.role === 'dge' || s.role === 'admin';
  const decide = async (r: InputOrder, status: InputOrder['status']) => {
    await save('orders', { ...r, status, decidedBy: s.userLabel }, `commande ${status}`);
    if (status === 'livree') {
      await save('inputs', { id: uid(), farmId: r.farmId, date: today(), type: r.type as never, product: r.product, quantity: r.quantity, unit: r.unit, kind: 'reception', supplier: 'Programme POUFA', subsidized: true, confirmed: false }, 'livraison issue d’une commande');
    }
  };
  const label: Record<InputOrder['status'], [string, string]> = { demandee: ['sky', 'Demandée'], validee: ['on', 'Validée'], refusee: ['red', 'Refusée'], livree: ['on', 'Livrée'] };
  return (
    <Registry<InputOrder>
      title="Commandes d'intrants" sub="Demande, validation par la DGE, puis livraison" table="orders" action="commande d’intrants" web={web(s.role)}
      canCreate={!dge || s.role === 'admin'}
      fields={[
        { key: 'farmId', label: 'Ferme', type: 'farm', required: true },
        { key: 'product', label: 'Intrant', type: 'select', required: true, options: st.inputCatalog.map((c) => ({ value: c.product, label: `${c.product} (${c.unit})` })) },
        { key: 'quantity', label: 'Quantité', type: 'number', required: true }, { key: 'wishedDate', label: 'Date souhaitée', type: 'date', required: true },
        { key: 'note', label: 'Précision', type: 'text' },
      ]}
      defaults={() => ({ wishedDate: addDays(today(), 14), status: 'demandee' })}
      prepare={(d) => { const c = st.inputCatalog.find((x) => x.product === d.product); return c ? { ...d, type: c.type, unit: c.unit, status: 'demandee' } : 'Intrant inconnu.'; }}
      filter={(r) => inScope(r.farmId)}
      columns={[
        { label: 'Intrant', render: (r) => `${r.product} · ${fmtInt(r.quantity)} ${r.unit}` }, { label: 'Ferme', render: (r) => r.farmId },
        { label: 'Souhaitée le', render: (r) => fmtDate(r.wishedDate) }, { label: 'Statut', render: (r) => <span className={`pill ${label[r.status][0]}`}>{label[r.status][1]}</span> },
      ]}
      rowActions={(r) => dge ? (
        r.status === 'demandee' ? <><button className="sel dark" onClick={() => decide(r, 'validee')}>Valider</button> <button className="sel" onClick={() => decide(r, 'refusee')}>Refuser</button></>
          : r.status === 'validee' ? <button className="sel" onClick={() => decide(r, 'livree')}>Marquer livrée</button> : null
      ) : null}
      empty={{ title: 'Aucune commande', text: 'Demandez les intrants de la prochaine bande : la DGE valide puis livre.' }}
    />
  );
}

// ---------- Rendez-vous d'abattage (calendrier par abattoir) ----------
export function SlaughterPage() {
  const s = useSession(); const st = useSettings(); const inScope = useScope(); const cur = useCurrentBand(s.farmId);
  const ops = useLiveQuery(() => db.operators.toArray(), [], []);
  const canConfirm = s.role === 'dge' || s.role === 'admin' || s.role === 'operateur';
  const lab: Record<SlaughterBooking['status'], [string, string]> = { demande: ['sky', 'Demandé'], confirme: ['on', 'Confirmé'], realise: ['on', 'Réalisé'], annule: ['red', 'Annulé'] };
  return (
    <Registry<SlaughterBooking>
      title="Rendez-vous d'abattage" sub="Date proposée selon la fin de bande prévue" table="slaughter" action="rendez-vous d’abattage" web={web(s.role)}
      canCreate={s.role === 'eleveur' || s.role === 'agent'}
      fields={[
        { key: 'operatorId', label: 'Abattoir', type: 'select', required: true, options: ops.filter((o) => o.type === 'abattoir').map((o) => ({ value: o.id, label: `${o.name} · ${o.locality}` })) },
        { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'count', label: 'Poulets', type: 'number', required: true },
      ]}
      defaults={() => ({ date: cur?.band ? addDays(cur.band.placedAt, st.bandReferenceDays - 2) : today(), status: 'demande' })}
      prepare={(d) => (cur?.band ? { ...d, farmId: cur.band.farmId, bandId: cur.band.id, status: 'demande' } : 'Aucune bande en cours.')}
      filter={(r) => (s.role === 'operateur' ? r.operatorId === s.operatorId : inScope(r.farmId))}
      sort={(a, b) => a.date.localeCompare(b.date)}
      columns={[
        { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Abattoir', render: (r) => ops.find((o) => o.id === r.operatorId)?.name ?? r.operatorId },
        { label: 'Ferme', render: (r) => r.farmId }, { label: 'Poulets', render: (r) => fmtInt(r.count) }, { label: 'Statut', render: (r) => <span className={`pill ${lab[r.status][0]}`}>{lab[r.status][1]}</span> },
      ]}
      rowActions={(r) => canConfirm && r.status === 'demande'
        ? <button className="sel dark" onClick={() => save('slaughter', { ...r, status: 'confirme' }, 'rendez-vous confirmé')}>Confirmer</button>
        : canConfirm && r.status === 'confirme' ? <button className="sel" onClick={() => save('slaughter', { ...r, status: 'realise' }, 'abattage réalisé')}>Réalisé</button> : null}
      empty={{ title: 'Aucun rendez-vous', text: 'Planifiez le passage à l’abattoir avant la fin de la bande.' }}
    />
  );
}

// ---------- Visites techniques (§ 5.4) ----------
export function VisitsPage() {
  const s = useSession(); const inScope = useScope();
  return (
    <Registry<Visit>
      title="Visites techniques" sub="Constats utilisés pour le recoupement des déclarations" table="visits" action="visite technique" web={web(s.role)}
      canCreate={s.role === 'agent' || s.role === 'admin'}
      fields={[
        { key: 'farmId', label: 'Ferme', type: 'farm', required: true }, { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'findings', label: 'Constats', type: 'textarea', required: true }, { key: 'recommendations', label: 'Recommandations', type: 'textarea' },
        { key: 'observedFeedStockKg', label: 'Stock d’aliment constaté (kg)', type: 'number', hint: 'sert au recoupement' },
      ]}
      prepare={(d) => new Promise((resolve) => {
        const done = (lat?: number, lng?: number) => resolve({ ...d, agent: s.userLabel, lat, lng });
        if (!navigator.geolocation) return done();
        navigator.geolocation.getCurrentPosition((p) => done(+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5)), () => done(), { timeout: 8000 });
      })}
      filter={(r) => inScope(r.farmId)}
      columns={[{ label: 'Ferme', render: (r) => r.farmId }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Agent', render: (r) => r.agent }, { label: 'Constats', render: (r) => r.findings }, { label: 'Stock constaté', render: (r) => (r.observedFeedStockKg !== undefined ? `${fmtInt(r.observedFeedStockKg)} kg` : '—') }]}
      empty={{ title: 'Aucune visite', text: 'La position GPS est relevée automatiquement à l’enregistrement.' }}
    />
  );
}

// ---------- Diagnostics et interventions vétérinaires (§ 5.2) ----------
export function DiagnosticsPage() {
  const s = useSession();
  return (
    <Registry<Diagnostic>
      title="Diagnostics et interventions" sub="Saisie réservée aux services vétérinaires" table="diagnostics" action="diagnostic vétérinaire" web
      canCreate={s.role === 'veterinaire' || s.role === 'admin'}
      fields={[
        { key: 'farmId', label: 'Ferme', type: 'farm', required: true }, { key: 'bandId', label: 'Bande', type: 'band' }, { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'diagnostic', label: 'Diagnostic', type: 'textarea', required: true }, { key: 'intervention', label: 'Intervention', type: 'textarea', required: true },
        { key: 'recommendations', label: 'Recommandations', type: 'textarea' }, { key: 'photo', label: 'Pièce jointe', type: 'photo' },
      ]}
      prepare={(d) => ({ ...d, by: s.userLabel })}
      columns={[{ label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Ferme', render: (r) => r.farmId }, { label: 'Diagnostic', render: (r) => r.diagnostic }, { label: 'Intervention', render: (r) => r.intervention }, { label: 'Par', render: (r) => r.by }]}
      empty={{ img: './img/veterinaire.webp', title: 'Aucun diagnostic', text: 'Historique sanitaire de chaque ferme ; ne remplace ni l’inspection ni le diagnostic réglementaire.' }}
    />
  );
}

// ---------- Assistance vétérinaire à distance (service CGI) ----------
export function ConsultationsPage() {
  const s = useSession(); const inScope = useScope();
  const vet = s.role === 'veterinaire';
  return (
    <Registry<Consultation>
      title="Assistance vétérinaire" sub="Un conseil rapide, sans remplacer les interventions réglementaires" table="consultations" action="consultation" web={web(s.role)}
      canCreate={s.role === 'eleveur' || s.role === 'agent'}
      fields={[{ key: 'question', label: 'Votre question', type: 'textarea', required: true }, { key: 'photo', label: 'Photo', type: 'photo' }]}
      prepare={(d) => (s.farmId ? { ...d, farmId: s.farmId, status: 'ouverte' } : 'Ferme inconnue.')}
      filter={(r) => inScope(r.farmId)}
      columns={[{ label: 'Question', render: (r) => r.question }, { label: 'Ferme', render: (r) => r.farmId }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Réponse', render: (r) => r.answer ? `${r.answer} (${r.answeredBy})` : 'En attente' }]}
      rowActions={(r) => vet && r.status === 'ouverte' ? <button className="sel dark" onClick={() => { const a = prompt('Réponse au producteur'); if (a) save('consultations', { ...r, answer: a, answeredBy: s.userLabel, status: 'repondue' }, 'réponse vétérinaire'); }}>Répondre</button> : null}
      empty={{ img: './img/veterinaire.webp', title: 'Aucune question', text: 'Posez une question, avec une photo si besoin : un vétérinaire vous répond.' }}
    />
  );
}

// ---------- Mise en relation commerciale (service CGI) ----------
export function OffersPage() {
  const s = useSession(); const cur = useCurrentBand(s.farmId);
  return (
    <Registry<Offer>
      title="Mise en relation" sub="Offres des producteurs, visibles des acheteurs et distributeurs" table="offers" action="offre commerciale" web={web(s.role)}
      canCreate={s.role === 'eleveur' || s.role === 'agent'}
      fields={[
        { key: 'product', label: 'Produit', type: 'select', required: true, options: opt(['Poulets vifs', 'Poulets abattus', 'Fumier']) },
        { key: 'quantity', label: 'Quantité', type: 'number', required: true }, { key: 'availableFrom', label: 'Disponible à partir du', type: 'date', required: true },
        { key: 'priceXaf', label: 'Prix indicatif (FCFA)', type: 'number' }, { key: 'contact', label: 'Contact', type: 'text', required: true },
      ]}
      defaults={() => ({ availableFrom: cur?.band ? addDays(cur.band.placedAt, 42) : today(), quantity: cur?.band ? cur.band.chicks : undefined, status: 'ouverte' })}
      prepare={(d) => (s.farmId ? { ...d, farmId: s.farmId, status: 'ouverte' } : 'Ferme inconnue.')}
      filter={(r) => r.status === 'ouverte' || r.farmId === s.farmId}
      columns={[{ label: 'Offre', render: (r) => `${r.product} · ${fmtInt(r.quantity)}` }, { label: 'Ferme', render: (r) => r.farmId }, { label: 'Disponible', render: (r) => fmtDate(r.availableFrom) }, { label: 'Prix', render: (r) => xaf(r.priceXaf) }, { label: 'Contact', render: (r) => r.contact }]}
      rowActions={(r) => r.farmId === s.farmId && r.status === 'ouverte' ? <button className="sel" onClick={() => save('offers', { ...r, status: 'close' }, 'offre close')}>Clore</button> : null}
      empty={{ img: './img/poule.webp', title: 'Aucune offre', text: 'Publiez vos volumes disponibles pour trouver un acheteur.' }}
    />
  );
}

// ---------- Observatoire des prix (service CGI) ----------
export function PricesPage() {
  const s = useSession();
  const rows = useLiveQuery(() => db.prices.toArray(), [], [] as PriceRecord[]);
  const avg = Object.values(rows.reduce<Record<string, { p: string; u: string; sum: number; n: number }>>((m, r) => {
    const k = `${r.product}|${r.unit}`; m[k] = m[k] ?? { p: r.product, u: r.unit, sum: 0, n: 0 }; m[k].sum += r.priceXaf; m[k].n++; return m;
  }, {}));
  return (
    <Registry<PriceRecord>
      title="Observatoire des prix" sub="Poulets, poussins, aliment et intrants" table="prices" action="relevé de prix" web={web(s.role)}
      canCreate={['agent', 'dge', 'admin', 'eleveur'].includes(s.role)}
      intro={avg.length > 0 && <div className={web(s.role) ? 'grid4' : 'kpis'}>{avg.map((a) => <div key={a.p + a.u} className={web(s.role) ? 'wk' : 'kpi'}><span className="l">{a.p}</span><span className="v">{fmtInt(a.sum / a.n)}</span><span className="s">FCFA / {a.u} · {a.n} relevé(s)</span></div>)}</div>}
      fields={[
        { key: 'product', label: 'Produit', type: 'select', required: true, options: opt(['Poulet vif', 'Poulet abattu', 'Poussin d’un jour', 'Aliment démarrage', 'Aliment croissance', 'Aliment finition']) },
        { key: 'unit', label: 'Unité', type: 'select', required: true, options: opt(['kg', 'tête', 'sac de 50 kg']) },
        { key: 'priceXaf', label: 'Prix (FCFA)', type: 'number', required: true }, { key: 'locality', label: 'Localité', type: 'text', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
      ]}
      prepare={(d) => ({ ...d, source: s.userLabel })}
      columns={[{ label: 'Produit', render: (r) => r.product }, { label: 'Prix', render: (r) => `${fmtInt(r.priceXaf)} FCFA / ${r.unit}` }, { label: 'Localité', render: (r) => r.locality }, { label: 'Date', render: (r) => fmtDate(r.date) }]}
      empty={{ title: 'Aucun relevé', text: 'Les relevés de prix informent producteurs et marché.' }}
    />
  );
}
