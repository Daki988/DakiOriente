import { useCallback, useRef, useState } from "react";

const LIMIT = 100;

/**
 * Historique annuler / rétablir.
 * Les changements successifs avec la même `mergeKey` (ex. un curseur qu'on glisse)
 * comptent comme une seule étape.
 */
export function useHistory<T>(initial: T) {
  const [state, setState] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = useRef<{ key?: string; at: number }>({ at: 0 });

  const set = useCallback((fn: (prev: T) => T, mergeKey?: string) => {
    const now = Date.now();
    const merge = mergeKey !== undefined && last.current.key === mergeKey && now - last.current.at < 1000;
    last.current = { key: mergeKey, at: now };
    setState((s) => {
      const next = fn(s.present);
      if (next === s.present) return s;
      return merge
        ? { ...s, present: next, future: [] }
        : { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = { at: 0 };
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  return { value: state.present, set, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
