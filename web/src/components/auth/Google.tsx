"use client";
import { useEffect, useState } from "react";

let cache: Promise<boolean> | null = null;
/** Vrai lorsque la connexion Google est configurée sur le serveur (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). */
export function useGoogleActif() {
  const [actif, setActif] = useState(false);
  useEffect(() => {
    cache ??= fetch("/api/auth/fournisseurs/").then((r) => (r.ok ? r.json() : { google: false })).then((d) => !!d.google).catch(() => false);
    cache.then(setActif);
  }, []);
  return actif;
}

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
  </svg>
);

/** Bouton « Continuer avec Google » (masqué si Google n'est pas configuré). */
export function GoogleButton({ profil, suite, label = "Continuer avec Google", separateur = true }: { profil?: string; suite?: string | null; label?: string; separateur?: boolean }) {
  const actif = useGoogleActif();
  if (!actif) return null;
  const q = new URLSearchParams();
  if (profil) q.set("profil", profil);
  if (suite) q.set("suite", suite);
  return (
    <div className="flex w-full flex-col gap-4">
      <a href={`/api/auth/google/${q.toString() ? `?${q}` : ""}`} className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-[15px] font-bold text-ink transition hover:border-brand-200 hover:bg-[#f6f8fe]">
        <Logo />{label}
      </a>
      {separateur && <div className="flex items-center gap-3 text-xs font-bold uppercase text-ink-mute"><span className="h-px flex-1 bg-slate-200" />ou<span className="h-px flex-1 bg-slate-200" /></div>}
    </div>
  );
}

export const MESSAGES_GOOGLE: Record<string, { tone: "warn" | "info" | "error"; t: string }> = {
  indisponible: { tone: "info", t: "La connexion avec Google n'est pas encore activée. Utilise ton e-mail ou ton numéro." },
  annule: { tone: "info", t: "Connexion avec Google annulée." },
  expire: { tone: "warn", t: "La demande de connexion Google a expiré. Réessaie." },
  suspendu: { tone: "error", t: "Ce compte est suspendu. Écris-nous à contact@navigoal.net." },
  erreur: { tone: "error", t: "La connexion avec Google a échoué. Réessaie dans un instant." },
};
