import { useEffect, useState } from 'react'
import { NeamLogo } from './Logo'

/** Écran de lancement animé (une fois par session). */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() => {
    try {
      return sessionStorage.getItem('neam:splash') ? 'done' : 'in'
    } catch {
      return 'in'
    }
  })

  // Une seule fois au montage : si l'effet dépendait de `phase`, le passage à « out »
  // annulerait le second minuteur et l'écran (invisible) bloquerait tous les clics.
  useEffect(() => {
    if (phase !== 'in') return
    try {
      sessionStorage.setItem('neam:splash', '1')
    } catch {
      /* ignore */
    }
    const a = setTimeout(() => setPhase('out'), 1500)
    const b = setTimeout(() => setPhase('done'), 2000)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  if (phase === 'done') return null
  return (
    <div className={`bg-neam-hero fixed inset-0 z-[100] grid place-items-center transition-opacity duration-500 ${phase === 'out' ? 'pointer-events-none opacity-0' : ''}`}>
      <div className="absolute h-64 w-64 animate-pulse rounded-full bg-neam-400/20 blur-3xl" />
      <div className="relative animate-pop">
        <NeamLogo size="lg" />
      </div>
      <div className="absolute bottom-[calc(var(--safe-bottom)+48px)] h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[scan_1.2s_ease-in-out_infinite] rounded-full bg-neam-400" style={{ position: 'relative' }} />
      </div>
    </div>
  )
}
