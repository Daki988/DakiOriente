import { useState } from 'react';
import { Logo, Icon } from '../components/Icon';
import { requestOtp, verifyOtp } from '../app/api';
import { flushOutbox } from '../data/sync';

/** Connexion par numéro de téléphone et code à usage unique reçu par SMS. */
export function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError((e as Error).message || 'Connexion impossible. Vérifiez le réseau.'); } finally { setBusy(false); }
  }

  return (
    <div className="m-shell">
      <div className="pub-hero" style={{ paddingBottom: 48 }}>
        <div className="brand" style={{ color: '#fff' }}><Logo dark />Origa</div>
        <h1>Suivi des fermes et origine des poulets du Gabon</h1>
        <span style={{ fontSize: 14, color: '#CFE7DC' }}>Programme POUFA · Ministère de l'Agriculture, de l'Élevage et du Développement rural</span>
      </div>
      <div className="content" style={{ marginTop: -20 }}>
        <div className="card" style={{ gap: 14 }}>
          {step === 'phone' ? (
            <>
              <h3>Connexion</h3>
              <label className="f">Numéro de téléphone
                <input className="input" inputMode="tel" autoComplete="tel" placeholder="+241 07 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <button className="cta green" disabled={busy || phone.replace(/\D/g, '').length < 8}
                onClick={() => run(async () => { await requestOtp(phone); setStep('code'); })}>Recevoir un code par SMS</button>
            </>
          ) : (
            <>
              <h3>Code reçu par SMS</h3>
              <span className="muted">Envoyé au {phone}. Il expire dans 5 minutes.</span>
              <input className="input" aria-label="Code à 6 chiffres" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                style={{ fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: 800 }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              <button className="cta green" disabled={busy || code.length !== 6} onClick={() => run(async () => { await verifyOtp(phone, code); await flushOutbox(); location.hash = '#/'; })}>Se connecter</button>
              <button className="cta light" disabled={busy} onClick={() => { setStep('phone'); setCode(''); }}>Changer de numéro</button>
            </>
          )}
          {error && <div className="note red"><Icon name="warn" size={18} />{error}</div>}
        </div>
        <span className="muted" style={{ textAlign: 'center' }}>Vos données sont hébergées au Gabon et protégées conformément à la loi n° 025/2023.</span>
      </div>
    </div>
  );
}
