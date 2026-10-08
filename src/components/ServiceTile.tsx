import { Link } from 'react-router-dom'
import { Home, LayoutGrid } from 'lucide-react'
import { NeamMark } from './Logo'
import type { Service } from '../data/services'
import { tap } from '../lib/native'

/** Icône blanche de la tuile, propre à chaque service (comme sur la maquette). */
export function ServiceGlyph({ service, className = 'h-8' }: { service: Service; className?: string }) {
  if (service.id === 'services') return <LayoutGrid className={className} strokeWidth={2.6} fill="white" />
  if (service.id === 'brico')
    return <Home className={className} strokeWidth={2.6} />
  return <NeamMark mono className={className} />
}

export function ServiceBadge({ service, size = 'md' }: { service: Service; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-11 w-11 rounded-xl', md: 'h-14 w-14 rounded-2xl', lg: 'h-20 w-20 rounded-3xl' }[size]
  const g = { sm: 'h-5', md: 'h-6', lg: 'h-9' }[size]
  return (
    <div className={`tile-shine grid shrink-0 place-items-center text-white shadow-lg ${s}`} style={{ background: service.gradient }}>
      <ServiceGlyph service={service} className={g} />
    </div>
  )
}

export function ServiceTile({ service, index = 0 }: { service: Service; index?: number }) {
  const isBrico = service.id === 'brico'
  return (
    <Link
      to={`/service/${service.id}`}
      onClick={tap}
      className="group flex animate-fade-up flex-col items-center text-center"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className="tile-shine flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[22px] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition duration-300 group-hover:-translate-y-1 group-active:scale-95"
        style={{ background: service.gradient }}
      >
        <ServiceGlyph service={service} className="h-[30%] max-h-10" />
        <div className="px-1 leading-[1.05]">
          {isBrico ? (
            <>
              <div className="text-[clamp(11px,3.3vw,16px)] font-bold tracking-tight">Brico&amp;Deco</div>
              <div className="text-[clamp(8px,2.2vw,11px)] font-semibold opacity-90">by NEAM</div>
            </>
          ) : (
            <>
              <div className="text-[clamp(12px,3.7vw,18px)] font-extrabold tracking-tight">NEAM</div>
              <div className="text-[clamp(12px,3.7vw,18px)] font-semibold tracking-tight">{service.short}</div>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 px-0.5 text-[clamp(9.5px,2.6vw,12px)] leading-tight text-neutral-600">{service.description}</p>
    </Link>
  )
}
