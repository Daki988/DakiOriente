"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Valeurs = Record<string, string | string[]>;

/** Lit les filtres dans l'URL (listes séparées par des virgules). */
function lire<T extends Valeurs>(sp: URLSearchParams, defauts: T): T {
  const o: Valeurs = { ...defauts };
  for (const k of Object.keys(defauts)) {
    const v = sp.get(k);
    if (v == null) continue;
    o[k] = Array.isArray(defauts[k]) ? v.split(",").filter(Boolean) : v;
  }
  return o as T;
}

/** Écrit les filtres non vides (les valeurs par défaut sont omises). */
function ecrire<T extends Valeurs>(f: T, defauts: T): string {
  const q = new URLSearchParams();
  for (const k of Object.keys(defauts)) {
    const v = f[k];
    if (Array.isArray(v)) { if (v.length) q.set(k, v.join(",")); }
    else if (v && v !== defauts[k]) q.set(k, v);
  }
  return q.toString();
}

/**
 * Lit l'URL côté navigateur. Isolé dans sa propre frontière Suspense : la page qui l'utilise reste
 * rendue côté serveur (contenu complet pour Google et les aperçus de liens), au lieu d'être entièrement
 * rendue dans le navigateur comme le serait tout composant appelant useSearchParams.
 */
function Lecteur({ onUrl }: { onUrl: (qs: string) => void }) {
  const qs = useSearchParams().toString();
  useEffect(() => { onUrl(qs); }, [qs, onUrl]);
  return null;
}
export function LireUrl({ onUrl }: { onUrl: (qs: string) => void }) {
  return <Suspense fallback={null}><Lecteur onUrl={onUrl} /></Suspense>;
}

/**
 * Filtres synchronisés avec l'URL : partageables, conservés au retour arrière et
 * réinitialisés si l'on arrive par un lien qui change les paramètres.
 * Le composant doit afficher `sync` (lecteur d'URL) quelque part dans son rendu.
 */
export function useFiltres<T extends Valeurs>(defauts: T) {
  const ref = useRef(defauts);
  // Rendu serveur et premier rendu navigateur : filtres par défaut (liste complète), puis lecture de l'URL.
  const [f, setF] = useState<T>(defauts);
  const qs = useMemo(() => ecrire(f, ref.current), [f]);
  const dernier = useRef<string | null>(null); // null : URL pas encore lue

  // Navigation externe (lien, retour arrière) : l'URL fait foi.
  const onUrl = useCallback((cur: string) => {
    if (cur !== dernier.current) { dernier.current = cur; setF(lire(new URLSearchParams(cur), ref.current)); }
  }, []);
  // Changement de filtre : mise à jour de l'URL sans rechargement ni défilement.
  useEffect(() => {
    if (dernier.current === null || qs === dernier.current) return;
    dernier.current = qs;
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
  }, [qs]);
  const sync = <LireUrl onUrl={onUrl} />;

  const set = useCallback((patch: Partial<T>) => setF((p) => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setF(ref.current), []);
  const toggle = useCallback((k: keyof T, v: string) => setF((p) => {
    const cur = p[k] as string[];
    return { ...p, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
  }), []);
  return { f, set, reset, toggle, qs, sync };
}
