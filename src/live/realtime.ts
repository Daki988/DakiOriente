import { useCallback, useEffect, useRef, useState } from 'react'
import { sb, supabase } from './supabase'

/**
 * Charge une liste et la recharge à chaque changement en temps réel sur les tables indiquées.
 * Les règles d'accès (RLS) s'appliquent aussi aux événements reçus.
 */
export function useLiveQuery<T>(key: string, load: () => Promise<T>, tables: { table: string; filter?: string }[], initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadRef = useRef(load)
  loadRef.current = load

  const reload = useCallback(async () => {
    try {
      setData(await loadRef.current())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    reload()
    let timer: ReturnType<typeof setTimeout> | undefined
    const debounced = () => {
      clearTimeout(timer)
      timer = setTimeout(reload, 250)
    }
    const ch = sb().channel(`lq:${key}:${Math.random().toString(36).slice(2)}`)
    for (const t of tables) ch.on('postgres_changes', { event: '*', schema: 'public', table: t.table, ...(t.filter ? { filter: t.filter } : {}) }, debounced)
    ch.subscribe()
    // Filet de sécurité si le temps réel est coupé (réseau mobile)
    const poll = setInterval(reload, 30_000)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      sb().removeChannel(ch)
    }
  }, [key, reload])

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
