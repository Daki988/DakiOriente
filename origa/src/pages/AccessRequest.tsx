import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Logo } from '../components/Icon';
import { submitAccessRequest } from '../app/auth';
import { PROVINCES } from '../domain/provinces';
import type { ProvinceCode, RequestedProfile } from '../domain/types';

const PROFILES: { k: RequestedProfile; label: string; ref?: string; org: string }[] = [
  { k: 'eleveur', label: 'Éleveur du programme POUFA', ref: 'Référence AMI (formulaire d’inscription)', org: 'Nom de la ferme et localité' },
  { k: 'operateur', label: 'Abattoir, acheteur ou distributeur', ref: 'Numéro de convention', org: 'Nom de la structure' },
  { k: 'agent', label: 'Agent technique', org: 'Direction ou service de rattachement' },
  { k: 'veterinaire', label: 'Services vétérinaires', org: 'Service de rattachement' },
  { k: 'bceg', label: 'BCEG', org: 'Agence' },
  { k: 'autre', label: 'Autre (ministère, partenaire)', org: 'Institution' },
];

/**
 * Demande d'accès. Le cahier des charges ne prévoit pas d'inscription libre : l'administrateur crée les comptes,
 * et aucun compte d'opérateur n'est actif sans convention signée.
 */
export function AccessRequestPage() {
  const [f, setF] = useState({ name: '', phone: '', profile: 'eleveur' as RequestedProfile, organisation: '', province: 'GA1' as ProvinceCode, reference: '', message: '', consent: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const p = PROFILES.find((x) => x.k === f.profile)!;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const valid = f.name.trim().length > 2 && f.phone.replace(/\D/g, '').length >= 8 && f.organisation.trim().length > 2 && f.consent;

  async function submit() {
    setBusy(true); setError('');
    try {
      await submitAccessRequest({ ...f, reference: f.reference || undefined, message: f.message || undefined });
      setDone(true);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="m-shell">
      <div className="pub-hero bg-photo" style={{ backgroundImage: 'linear-gradient(160deg,rgba(11,61,46,.92),rgba(18,128,92,.82)),url(./img/poulailler.webp)' }}>
        <Link to="/" className="brand" style={{ color: '#fff' }}><Logo dark />Origa</Link>
        <h1>Demander un accès</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Chaque compte est vérifié puis activé par l'administrateur du programme.</span>
      </div>
      <div className="content" style={{ marginTop: -18 }}>
        {done ? (
          <div className="card" style={{ alignItems: 'flex-start' }}>
            <div className="ico" style={{ background: 'var(--green-50)' }}><Icon name="check" color="#12805C" /></div>
            <h3>Demande envoyée</h3>
            <span className="muted">Vous recevrez un SMS dès que votre compte sera activé. Vous pourrez alors vous connecter avec votre numéro.</span>
            <Link to="/" className="cta green">Retour à la connexion</Link>
          </div>
        ) : (
          <div className="card" style={{ gap: 14 }}>
            <label className="f">Vous êtes
              <select className="input" value={f.profile} onChange={(e) => set('profile', e.target.value as RequestedProfile)}>
                {PROFILES.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
              </select>
            </label>
            <label className="f">Nom et prénom<input className="input" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
            <label className="f">Téléphone (servira à vous connecter)<input className="input" inputMode="tel" autoComplete="tel" placeholder="+241 …" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></label>
            <label className="f">{p.org}<input className="input" value={f.organisation} onChange={(e) => set('organisation', e.target.value)} /></label>
            <label className="f">Province
              <select className="input" value={f.province} onChange={(e) => set('province', e.target.value as ProvinceCode)}>
                {Object.entries(PROVINCES).map(([c, x]) => <option key={c} value={c}>{x.name}</option>)}
              </select>
            </label>
            {p.ref && <label className="f">{p.ref}<input className="input" value={f.reference} onChange={(e) => set('reference', e.target.value)} /></label>}
            <label className="f">Message (facultatif)<textarea className="input" value={f.message} onChange={(e) => set('message', e.target.value)} /></label>
            <label className="check">
              <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
              <span>J'accepte que mes données soient traitées pour la gestion de mon accès au programme POUFA, conformément à la loi n° 025/2023 sur la protection des données personnelles.</span>
            </label>
            {f.profile === 'operateur' && <div className="note"><Icon name="info" size={18} />Votre compte sera activé après signature de la convention avec le ministère.</div>}
            {error && <div className="note red" role="alert"><Icon name="warn" size={18} />{error}</div>}
            <button className="cta green" disabled={!valid || busy} onClick={submit}>{busy ? 'Envoi…' : 'Envoyer ma demande'}</button>
            <Link to="/" className="cta light">J'ai déjà un compte</Link>
          </div>
        )}
      </div>
    </div>
  );
}
