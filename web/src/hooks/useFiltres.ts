"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
 * Filtres synchronisés avec l'URL : partageables, conservés au retour arrière et
 * réinitialisés si l'on arrive par un lien qui change les paramètres.
 */
export function useFiltres<T extends Valeurs>(defauts: T) {
  const sp = useSearchParams();
  const ref = useRef(defauts);
  const [f, setF] = useState<T>(() => lire(new URLSearchParams(sp.toString()), defauts));
  const qs = useMemo(() => ecrire(f, ref.current), [f]);
  const dernier = useRef(qs);

  // Navigation externe (lien, retour arrière) : l'URL fait foi.
  useEffect(() => {
    const cur = sp.toString();
    if (cur !== dernier.current) { dernier.current = cur; setF(lire(new URLSearchParams(cur), ref.current)); }
  }, [sp]);
  // Changement de filtre : mise à jour de l'URL sans rechargement ni défilement.
  useEffect(() => {
    if (qs === dernier.current) return;
    dernier.current = qs;
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
  }, [qs]);

  const set = useCallback((patch: Partial<T>) => setF((p) => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setF(ref.current), []);
  const toggle = useCallback((k: keyof T, v: string) => setF((p) => {
    const cur = p[k] as string[];
    return { ...p, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
  }), []);
  return { f, set, reset, toggle, qs };
}
