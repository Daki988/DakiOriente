import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Logo } from './Icon';

/** Propose la nouvelle version au lieu de recharger pendant une saisie. */
export function UpdateBar() {
  // Vérifie une nouvelle version à l'ouverture puis toutes les 30 minutes ; elle s'installe d'elle-même.
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, reg) { if (reg) window.setInterval(() => { reg.update().catch(() => undefined); }, 30 * 60_000); },
  });
  const apk = useApkUpdate();
  if (apk) {
    return (
      <div className="update-bar" role="status">
        Nouvelle version de l'application (build {apk.build})
        <button onClick={() => { location.href = apk.url; }}>Télécharger</button>
      </div>
    );
  }
  if (!needRefresh) return null;
  return (
    <div className="update-bar" role="status">
      Nouvelle version d'Origa disponible
      <button onClick={() => updateServiceWorker(true)}>Mettre à jour</button>
    </div>
  );
}

/** Numéro de compilation de l'APK (numéro d'exécution de la CI), absent sur le web. */
const APK_BUILD = Number(import.meta.env.VITE_APP_BUILD ?? 0);
const RELEASE_API = 'https://api.github.com/repos/Daki988/DakiOriente/releases/tags/origa-latest';
const APK_NAME = 'Origa-Android-HarmonyOS.apk';

/**
 * Application installée (APK Android / HarmonyOS) : ses écrans sont embarqués et ne se mettent pas à jour
 * comme le site. Elle consulte la dernière version publiée à l'ouverture puis toutes les 6 heures et propose
 * de télécharger la nouvelle, qui s'installe par-dessus l'ancienne (même signature) sans perdre les données.
 */
function useApkUpdate(): { build: number; url: string } | null {
  const [update, setUpdate] = useState<{ build: number; url: string } | null>(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !APK_BUILD) return;
    const check = () => fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((rel: { name?: string; assets?: { name: string; browser_download_url: string }[] } | null) => {
        const build = Number(/build (\d+)/.exec(rel?.name ?? '')?.[1] ?? 0);
        const url = rel?.assets?.find((a) => a.name === APK_NAME)?.browser_download_url;
        if (build > APK_BUILD && url) setUpdate({ build, url });
      })
      .catch(() => undefined); // hors ligne : on réessaiera
    check();
    const t = window.setInterval(check, 6 * 3600_000);
    return () => window.clearInterval(t);
  }, []);
  return update;
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
