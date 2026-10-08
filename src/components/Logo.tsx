import { useId } from 'react'

type MarkProps = { className?: string; mono?: boolean }

/** Le "N" en ruban de NEAM. `mono` = version blanche (sur tuiles colorées). */
export function NeamMark({ className = 'h-8', mono = false }: MarkProps) {
  const id = useId().replace(/:/g, '')
  const light = mono ? '#ffffff' : `url(#l${id})`
  const dark = mono ? 'rgba(255,255,255,0.78)' : `url(#d${id})`
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      {!mono && (
        <defs>
          <linearGradient id={`l${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#14c977" />
            <stop offset="1" stopColor="#7cf7bd" />
          </linearGradient>
          <linearGradient id={`d${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0b9a5c" />
            <stop offset="1" stopColor="#0ed27a" />
          </linearGradient>
        </defs>
      )}
      <path d="M44 6 L62 6 L94 84 L74 84 Z" fill={dark} />
      <path d="M4 86 C12 56 24 28 44 6 L62 6 C44 28 34 56 28 86 Z" fill={light} />
      <path d="M74 84 L94 84 C100 56 106 28 118 3 C98 14 84 44 74 84 Z" fill={light} />
    </svg>
  )
}

/** Mot-symbole NEΛM (le A sans barre, jambe droite verte). */
export function NeamWordmark({ className = 'text-3xl', light = true }: { className?: string; light?: boolean }) {
  const color = light ? 'text-white' : 'text-neam-950'
  return (
    <span className={`inline-flex items-baseline font-extrabold tracking-tight leading-none ${color} ${className}`} aria-label="NEAM">
      <span aria-hidden="true">NE</span>
      <svg viewBox="0 0 70 72" className="mx-[0.02em] h-[0.72em] w-[0.7em] self-center translate-y-[0.02em]" aria-hidden="true">
        <path d="M0 72 L26 0 L44 0 L19 72 Z" fill="currentColor" />
        <path d="M26 0 L44 0 L70 72 L51 72 Z" fill="#22d884" />
      </svg>
      <span aria-hidden="true">M</span>
    </span>
  )
}

export function NeamLogo({ tagline = true, size = 'md', light = true }: { tagline?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl'; light?: boolean }) {
  const s = {
    sm: { mark: 'h-7', word: 'text-2xl', tag: 'text-[9px]' },
    md: { mark: 'h-10', word: 'text-[34px]', tag: 'text-[11px]' },
    lg: { mark: 'h-14', word: 'text-5xl', tag: 'text-sm' },
    xl: { mark: 'h-24', word: 'text-7xl', tag: 'text-lg' },
  }[size]
  return (
    <div className="flex items-center gap-2">
      <NeamMark className={`${s.mark} drop-shadow-[0_4px_12px_rgba(16,192,112,0.45)]`} />
      <div className="flex flex-col">
        <NeamWordmark className={s.word} light={light} />
        {tagline && (
          <span className={`${s.tag} mt-0.5 font-medium ${light ? 'text-white/85' : 'text-neam-900/70'}`}>
            Plus proche de votre quotidien.
          </span>
        )}
      </div>
    </div>
  )
}
