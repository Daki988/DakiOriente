import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Logo } from './Icon';

/** Propose la nouvelle version au lieu de recharger pendant une saisie. */
export function UpdateBar() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  return (
    <div className="update-bar" role="status">
      Nouvelle version d'Origa disponible
      <button onClick={() => updateServiceWorker(true)}>Mettre à jour</button>
    </div>
  );
}

/** Évite l'écran blanc : affiche un message clair et permet de recharger. Les saisies restent sur l'appareil. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Origa', error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="m-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, textAlign: 'center' }}>
        <Logo size={64} />
        <h2>Un problème est survenu</h2>
        <p className="muted">Vos saisies sont conservées sur ce téléphone. Rechargez l'application pour continuer.</p>
        <button className="cta green" style={{ maxWidth: 320 }} onClick={() => location.reload()}>Recharger Origa</button>
      </div>
    );
  }
}
