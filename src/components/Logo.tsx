type MarkProps = { className?: string; mono?: boolean }

/** Le symbole « N » officiel de NEAM. `mono` = version blanche (sur tuiles colorées). */
export function NeamMark({ className = 'h-8', mono = false }: MarkProps) {
  return (
    <img
      src={mono ? './brand/express-mark-white.webp' : './brand/express-mark.webp'}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`w-auto select-none object-contain ${className}`}
    />
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

/** Logo officiel complet (symbole + NEAM® + signature), pour fonds sombres. */
export function NeamLogo({ tagline = true, size = 'md', light = true }: { tagline?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl'; light?: boolean }) {
  if (tagline && light) {
    const h = { sm: 'h-9', md: 'h-[52px]', lg: 'h-20', xl: 'h-32' }[size]
    return <img src="./brand/neam-logo.webp" alt="NEAM — Plus proche de votre quotidien." draggable={false} className={`${h} w-auto select-none`} />
  }
  const s = {
    sm: { mark: 'h-7', word: 'text-2xl', tag: 'text-[9px]' },
    md: { mark: 'h-10', word: 'text-[34px]', tag: 'text-[11px]' },
    lg: { mark: 'h-14', word: 'text-5xl', tag: 'text-sm' },
    xl: { mark: 'h-24', word: 'text-7xl', tag: 'text-lg' },
  }[size]
  return (
    <div className="flex items-center gap-2">
      <NeamMark className={s.mark} />
      <div className="flex flex-col">
        <NeamWordmark className={s.word} light={light} />
        {tagline && <span className={`${s.tag} mt-0.5 font-medium ${light ? 'text-white/85' : 'text-neam-900/70'}`}>Plus proche de votre quotidien.</span>}
      </div>
    </div>
  )
}
