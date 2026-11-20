import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { sb, supabase } from './supabase'

/** Réponse Supabase → données, ou exception : une erreur réseau ne doit jamais ressembler à une liste vide. */
export function must<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error
  return r.data
}

// État de connexion partagé par tous les écrans : une requête en échec allume le bandeau « Connexion difficile »
const failing = new Set<string>()
const reloaders = new Set<() => void>()
const watchers = new Set<() => void>()
const setFailing = (id: string, bad: boolean) => {
  const before = failing.size
  if (bad) failing.add(id)
  else failing.delete(id)
  if ((before > 0) !== (failing.size > 0)) watchers.forEach((w) => w())
}
export function useConnectionTrouble() {
  return useSyncExternalStore(
    (cb) => (watchers.add(cb), () => watchers.delete(cb)),
    () => failing.size > 0,
  )
}
/** Relance tout de suite tous les chargements en cours (bouton « Réessayer »). */
export const retryAll = () => reloaders.forEach((r) => r())

/**
 * Charge une liste et la recharge à chaque changement en temps réel sur les tables indiquées.
 * Les règles d'accès (RLS) s'appliquent aussi aux événements reçus.
 * En cas d'échec, les dernières données restent affichées ; avant le premier succès, l'écran reste en chargement
 * (jamais un faux « aucune commande »).
 */
export function useLiveQuery<T>(key: string, load: () => Promise<T>, tables: { table: string; filter?: string }[], initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadRef = useRef(load)
  loadRef.current = load
  const tablesRef = useRef(tables)
  tablesRef.current = tables
  const seq = useRef(0)
  const id = useRef(Math.random().toString(36).slice(2)).current

  const reload = useCallback(async () => {
    // Seule la réponse la plus récente compte : un ancien sondage ne doit pas faire reculer l'écran
    const mine = ++seq.current
    try {
      const next = await loadRef.current()
      if (mine !== seq.current) return
      setData(next)
      setError('')
      setLoading(false)
      setFailing(id, false)
    } catch (e) {
      if (mine !== seq.current) return
      setError((e as Error).message || 'Connexion impossible')
      setFailing(id, true)
    }
  }, [id])

  useEffect(() => {
    if (!supabase) return
    reload()
    let timer: ReturnType<typeof setTimeout> | undefined
    const debounced = () => {
      clearTimeout(timer)
      timer = setTimeout(reload, 250)
    }
    const ch = sb().channel(`lq:${key}:${Math.random().toString(36).slice(2)}`)
    for (const t of tablesRef.current) ch.on('postgres_changes', { event: '*', schema: 'public', table: t.table, ...(t.filter ? { filter: t.filter } : {}) }, debounced)
    ch.subscribe()
    // Filet de sécurité si le temps réel est coupé (réseau mobile) ; relance au retour du réseau ou de l'app
    const poll = setInterval(() => document.visibilityState === 'visible' && reload(), 30_000)
    const wake = () => document.visibilityState === 'visible' && reload()
    window.addEventListener('online', wake)
    document.addEventListener('visibilitychange', wake)
    reloaders.add(reload)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      window.removeEventListener('online', wake)
      document.removeEventListener('visibilitychange', wake)
      reloaders.delete(reload)
      setFailing(id, false)
      sb().removeChannel(ch)
    }
  }, [key, reload, id])

  return { data, loading, error, reload }
}

/** Bip sonore court (nouvelle commande) — WebAudio, sans fichier. */
export function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.25].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.22)
    })
  } catch {
    /* son indisponible */
  }
}
