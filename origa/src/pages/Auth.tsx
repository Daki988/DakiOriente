import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo, Icon } from '../components/Icon';
import { requestCode, verifyCode } from '../app/auth';
import { apiEnabled, serverDemo } from '../app/api';
import { flushOutbox } from '../data/sync';
import { DEMO_USERS } from '../data/demoUsers';

const ROLE_LABEL: Record<string, string> = { eleveur: 'Éleveur', agent: 'Agent technique', dge: 'DGE', veterinaire: 'Vétérinaire', bceg: 'BCEG', operateur: 'Abattoir', maedr: 'MAEDR', aninf: 'ANINF', admin: 'Administrateur' };

/** Connexion par numéro de téléphone et code à usage unique (SMS en production). */
export function Auth() {
  const [phone, setPhone] = useState('');
  const [normalized, setNormalized] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string>();
  const [demo, setDemo] = useState(!apiEnabled);
  const [upgraded] = useState(() => { try { const u = localStorage.getItem('origa.upgraded'); localStorage.removeItem('origa.upgraded'); return !!u; } catch { return false; } });
  useEffect(() => { if (apiEnabled) serverDemo().then(setDemo); }, []);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError((e as Error).message || 'Connexion impossible. Vérifiez le réseau.'); } finally { setBusy(false); }
  }
  const sendCode = (p = phone) => run(async () => {
    const r = await requestCode(p);
    setNormalized(r.phone); setDemoCode(r.demoCode); setStep('code'); setCode('');
  });
  const login = () => run(async () => {
    await verifyCode(normalized, code);
    if (apiEnabled) await flushOutbox();
    location.hash = '#/';
  });

  return (
    <div className="auth">
      <aside className="auth-visual" style={{ backgroundImage: 'url(./img/eleveuse.webp)' }}>
        <div className="auth-visual-in">
          <div className="brand" style={{ color: '#fff' }}><Logo dark />Origa</div>
          <h1>L'origine prouvée,<br />de la ferme à l'assiette.</h1>
          <p>Suivi des fermes du programme POUFA et traçabilité des poulets du Gabon.</p>
          <div className="auth-flag"><i style={{ background: '#009E60' }} /><i style={{ background: '#FCD116' }} /><i style={{ background: '#3A75C4' }} /></div>
        </div>
      </aside>

      <main className="auth-form">
        <div className="auth-card">
          {step === 'phone' ? (
            <>
              <h2>Connexion</h2>
              <p className="muted">Saisissez votre numéro : vous recevrez un code à usage unique{apiEnabled ? ' par SMS' : ''}.</p>
              <label className="f">Numéro de téléphone
                <input className="input lg" inputMode="tel" autoComplete="tel" placeholder="+241 07 12 34 56" value={phone}
                  onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && phone && sendCode()} />
              </label>
              <button className="cta green" disabled={busy || phone.replace(/\D/g, '').length < 8} onClick={() => sendCode()}>
                {busy ? 'Envoi…' : 'Recevoir mon code'}
              </button>
              {upgraded && <div className="note"><Icon name="info" size={18} />Origa est maintenant relié au serveur national. Les données d’essai de cet appareil ont été remplacées par celles du serveur : reconnectez-vous.</div>}
              {demo && (
                <div className="demo-box">
                  <b>Démonstration</b>
                  <span className="muted">Touchez un profil pour l'essayer, avec des données fictives.</span>
                  <div className="chips">
                    {DEMO_USERS.map((u) => (
                      <button key={u.id} className="chip" onClick={() => { setPhone(u.phone); sendCode(u.phone); }}>{ROLE_LABEL[u.role]}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button className="linkbtn" onClick={() => setStep('phone')}><Icon name="back" size={18} />Changer de numéro</button>
              <h2>Code de connexion</h2>
              <p className="muted">Envoyé au {normalized}. Il expire dans 5 minutes.</p>
              {demoCode && <div className="note sun"><Icon name="info" size={18} />Mode démonstration : votre code est <b style={{ letterSpacing: 2 }}>{demoCode}</b>.</div>}
              <input className="input otp" aria-label="Code à 6 chiffres" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && login()} />
              <button className="cta green" disabled={busy || code.length !== 6} onClick={login}>{busy ? 'Vérification…' : 'Se connecter'}</button>
              <button className="cta light" disabled={busy} onClick={() => sendCode(normalized)}>Renvoyer le code</button>
            </>
          )}
          {error && <div className="note red" role="alert"><Icon name="warn" size={18} />{error}</div>}

          <div className="auth-links">
            <Link to="/demande-acces">Pas encore de compte ? <b>Demander un accès</b></Link>
            <Link to="/telecharger">Installer l'application sur un téléphone</Link>
          </div>
        </div>
        <span className="muted auth-legal">Données hébergées au Gabon, protégées conformément à la loi n° 025/2023. Ministère de l'Agriculture, de l'Élevage et du Développement rural · Programme POUFA.</span>
      </main>
    </div>
  );
}
