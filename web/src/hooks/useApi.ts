"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

/** Chargement d'une ressource de l'API avec état, erreur et rechargement. */
export function useApi<T>(path: string | null, opts: { refreshMs?: number } = {}) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!!path);
  const live = useRef(true);
  const load = useCallback(async () => {
    if (!path) return;
    try {
      const d = await api<T>(path);
      if (live.current) { setData(d); setError(null); }
    } catch (e) {
      if (live.current) setError(e instanceof ApiError ? e : new ApiError("Erreur réseau.", 0, "reseau"));
    } finally {
      if (live.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    live.current = true;
    setLoading(!!path);
    load();
    const t = opts.refreshMs ? setInterval(load, opts.refreshMs) : undefined;
    return () => { live.current = false; if (t) clearInterval(t); };
  }, [load, path, opts.refreshMs]);
  return { data, error, loading, reload: load, setData };
}

/** Action (POST/PATCH…) avec état d'envoi et message d'erreur. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setPending(true); setError(null);
    try { return await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); return undefined; }
    finally { setPending(false); }
  }, []);
  return { pending, error, setError, run };
}
