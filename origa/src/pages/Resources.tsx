import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { BackBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtDate, useBandStats, useCurrentBand, useSession, useSettings } from '../app/hooks';
import { addDays, daysBetween, today } from '../domain/ids';

const GUIDES = [
  { t: 'Préparer l’arrivée des poussins', b: 'Vide sanitaire d’au moins 14 jours, litière sèche de 5 à 8 cm, chauffage en route 24 h avant, 32 à 34 °C sous la source de chaleur, eau tiède et propre disponible dès l’arrivée.' },
  { t: 'Les 7 premiers jours', b: 'Observer la répartition des poussins : regroupés = froid, écartés = chaud. Peser 50 sujets à J7 : le poids doit être environ 4 fois celui de l’arrivée. Retirer les morts deux fois par jour.' },
  { t: 'Eau et aliment', b: 'Un poulet boit environ 1,8 fois ce qu’il mange. Une baisse de consommation d’eau est souvent le premier signe d’une maladie : notez-la dans la fiche du jour.' },
  { t: 'Biosécurité au quotidien', b: 'Pédiluve renouvelé, tenue dédiée, visiteurs limités et notés, aucune autre volaille au contact, cadavres éliminés le jour même.' },
  { t: 'Vaccination', b: 'Respecter le calendrier : Newcastle et Gumboro selon le programme. Eau sans chlore, vaccin préparé juste avant, abreuvoirs vidés 1 à 2 h avant pour que tout soit bu en 2 h.' },
  { t: 'Avant la vente', b: 'Respecter le délai d’attente des médicaments : la cession est bloquée dans Origa tant qu’il n’est pas écoulé. Mettre à jeun 8 à 10 h avant l’abattage.' },
];

/** Portail : formation, planification, incitations et espace d'échange (services proposés par le CGI). */
export function ResourcesPage() {
  const s = useSession(); const st = useSettings(); const cur = useCurrentBand(s.farmId); const stats = useBandStats(cur?.band);
  const reliability = useLiveQuery(async () => {
    if (!s.farmId) return 0;
    const bands = await db.bands.where('farmId').equals(s.farmId).toArray();
    const ids = bands.map((b) => b.id);
    const entries = (await db.entries.toArray()).filter((e) => ids.includes(e.bandId));
    const days = bands.reduce((a, b) => a + Math.max(1, daysBetween(b.placedAt, b.closedAt ?? today())), 0);
    return Math.min(100, (new Set(entries.map((e) => e.bandId + e.date)).size / Math.max(1, days)) * 100);
  }, [s.farmId], 0);
  const band = cur?.band;
  const plan = band ? [
    ...st.vaccinationCalendar.map((v) => ({ d: addDays(band.placedAt, v.day), t: `Vaccin ${v.vaccine}` })),
    ...[7, 14, 21, 28, 35, 42].map((d) => ({ d: addDays(band.placedAt, d), t: `Pesée de ${st.weighingSample} sujets` })),
    { d: addDays(band.placedAt, st.bandReferenceDays - 3), t: 'Rendez-vous d’abattage à confirmer' },
    { d: addDays(band.placedAt, st.bandReferenceDays), t: 'Fin de bande prévue · clôture et bilan' },
    { d: addDays(band.placedAt, st.bandReferenceDays + 14), t: 'Fin du vide sanitaire · nouvelle bande possible' },
  ].filter((x) => x.d >= today()).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 8) : [];
  const badge = reliability >= 90 ? ['Or', '#B07D00'] : reliability >= 75 ? ['Argent', '#4A5A53'] : reliability >= 50 ? ['Bronze', '#9A5B2E'] : ['À améliorer', '#D64545'];

  return (
    <>
      <BackBar title="Ressources" sub="Formation, planning et échanges" />
      <div className="content">
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div className="ico" style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--sun-50)' }}><Icon name="check" size={26} color={badge[1]} /></div>
          <div style={{ flex: 1 }}><b>Badge de fiabilité : {badge[0]}</b><div className="muted">Régularité de saisie {fmt(reliability, 0)} %. Un score élevé donne la priorité dans la distribution d’intrants.</div></div>
        </div>
        {plan.length > 0 && (
          <div className="card"><h3>Mon planning · bande {band?.rank}</h3>
            {plan.map((p) => <div key={p.d + p.t} className="kv"><span>{fmtDate(p.d)}</span><b>{p.t}</b></div>)}
            {stats && <span className="muted">Jour {stats.ageDays} · {fmt(stats.mortalityPct, 1)} % de mortalité</span>}
          </div>
        )}
        <div className="card"><h3>Espace d'échange</h3>
          <Link className="li" to="/assistance"><div className="ico" style={{ background: 'var(--red-50)' }}><Icon name="heart" color="#D64545" /></div><div className="grow"><b>Poser une question à un vétérinaire</b><span>Réponse dans l'application, photo possible</span></div></Link>
          <Link className="li" to="/offres"><div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="truck" color="#12805C" /></div><div className="grow"><b>Trouver un acheteur</b><span>Publiez vos volumes disponibles</span></div></Link>
          <Link className="li" to="/prix"><div className="ico" style={{ background: 'var(--sky-50)' }}><Icon name="bands" color="#2F6FD1" /></div><div className="grow"><b>Observatoire des prix</b><span>Poulets, poussins et aliment</span></div></Link>
        </div>
        <div className="card"><h3>Formation · fiches pratiques</h3>
          {GUIDES.map((g) => <details key={g.t} className="guide"><summary>{g.t}</summary><p className="muted">{g.b}</p></details>)}
        </div>
      </div>
    </>
  );
}

const MENU = [
  { to: '/bande/nouvelle', icon: 'plus', t: 'Ouvrir une bande', s: 'Réception des poussins', roles: ['eleveur', 'agent'] },
  { to: '/vaccinations', icon: 'heart', t: 'Vaccinations', s: 'Registre et calendrier', roles: ['eleveur', 'agent'] },
  { to: '/traitements', icon: 'feed', t: 'Traitements', s: 'Produits et délais d’attente', roles: ['eleveur', 'agent'] },
  { to: '/biosecurite', icon: 'check', t: 'Biosécurité', s: 'Contrôles et mesures correctives', roles: ['eleveur', 'agent'] },
  { to: '/visites', icon: 'pin', t: 'Visites techniques', s: 'Constats et recommandations', roles: ['agent'] },
  { to: '/charges', icon: 'report', t: 'Charges et rentabilité', s: 'Coût de production, marge', roles: ['eleveur', 'agent'] },
  { to: '/commandes', icon: 'box', t: 'Commander des intrants', s: 'Pour la bande suivante', roles: ['eleveur', 'agent'] },
  { to: '/abattage', icon: 'truck', t: 'Rendez-vous d’abattage', s: 'Calendrier des abattoirs', roles: ['eleveur', 'agent'] },
  { to: '/assistance', icon: 'heart', t: 'Assistance vétérinaire', s: 'Poser une question', roles: ['eleveur', 'agent'] },
  { to: '/offres', icon: 'share', t: 'Mise en relation', s: 'Trouver un acheteur', roles: ['eleveur', 'agent'] },
  { to: '/prix', icon: 'bands', t: 'Observatoire des prix', s: 'Relevés du marché', roles: ['eleveur', 'agent'] },
  { to: '/ressources', icon: 'info', t: 'Ressources', s: 'Formation, planning, badge', roles: ['eleveur', 'agent'] },
];

/** Menu des fonctions secondaires sur mobile. */
export function MoreMenu() {
  const s = useSession();
  return (
    <>
      <div className="back"><div><h2>Plus</h2><div className="sub">Toutes les fonctions d'Origa</div></div></div>
      <div className="content">
        <div className="card">{MENU.filter((m) => m.roles.includes(s.role)).map((m) => (
          <Link key={m.to} to={m.to} className="li"><div className="ico" style={{ background: 'var(--green-50)' }}><Icon name={m.icon} color="#12805C" /></div><div className="grow"><b>{m.t}</b><span>{m.s}</span></div><Icon name="back" size={16} color="#8A9A93" /></Link>
        ))}</div>
        {s.role === 'agent' && <Link to={`/fermes/${s.farmId}`} className="cta light">Fiche de la ferme suivie</Link>}
      </div>
    </>
  );
}
