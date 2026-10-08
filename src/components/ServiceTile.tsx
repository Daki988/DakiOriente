import { Link } from 'react-router-dom'
import { NeamWordmark } from './Logo'
import { markOf, markWhiteOf, type Service } from '../data/services'
import { tap } from '../lib/native'

/** Symbole officiel du service en blanc (pour les tuiles en dégradé). */
export function ServiceGlyph({ service, className = 'h-8' }: { service: Service; className?: string }) {
  return <img src={markWhiteOf(service.id)} alt="" aria-hidden="true" draggable={false} className={`w-auto select-none object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${className}`} />
}

/** Icône d'app du service : symbole en couleur sur fond blanc. */
export function ServiceBadge({ service, size = 'md' }: { service: Service; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-11 w-11 rounded-xl p-1.5', md: 'h-14 w-14 rounded-2xl p-2', lg: 'h-20 w-20 rounded-3xl p-2.5' }[size]
  return (
    <div className={`grid shrink-0 place-items-center bg-white shadow-md ring-1 ring-black/5 ${s}`}>
      <img src={markOf(service.id)} alt="" aria-hidden="true" className="max-h-full max-w-full object-contain" />
    </div>
  )
}

/** Logo horizontal du service : symbole + NEAM + nom (comme dans les en-têtes des interfaces). */
export function ServiceWordmark({ service, className = '', size = 'md' }: { service: Service; className?: string; size?: 'md' | 'lg' }) {
  const big = size === 'lg'
  const brand = service.tileTitle
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={markOf(service.id)} alt="" aria-hidden="true" className={`${big ? 'h-16' : 'h-9'} w-auto object-contain`} />
      <div className="leading-[0.95]">
        {brand ? (
          <>
            <div className={`${big ? 'text-4xl' : 'text-[19px]'} font-extrabold tracking-tight`} style={{ color: service.color }}>{brand}</div>
            <div className={`${big ? 'text-lg' : 'text-[11px]'} font-bold text-neutral-900`}>
              by <NeamWordmark light={false} className={big ? 'text-lg' : 'text-[11px]'} />
            </div>
          </>
        ) : (
          <>
            <NeamWordmark light={false} className={big ? 'text-4xl' : 'text-[19px]'} />
            <div className={`${big ? 'text-4xl' : 'text-[19px]'} font-bold tracking-tight`} style={{ color: service.color }}>{service.short}</div>
          </>
        )}
      </div>
    </div>
  )
}

export function ServiceTile({ service, index = 0 }: { service: Service; index?: number }) {
  return (
    <Link
      to={`/service/${service.id}`}
      onClick={tap}
      className="group flex animate-fade-up flex-col items-center text-center"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative w-full">
      {service.isNew && <span className="absolute -right-1 -top-1.5 z-10 rounded-full bg-white px-1.5 py-0.5 text-[clamp(6.5px,1.9vw,9px)] font-extrabold uppercase tracking-wide shadow-md ring-1 ring-black/5" style={{ color: service.color }}>Nouveau</span>}
      <div
        className="tile-shine relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[22px] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] transition duration-300 group-hover:-translate-y-1 group-active:scale-95"
        style={{ background: service.gradient }}
      >
        <ServiceGlyph service={service} className="h-[34%] max-h-11 max-w-[70%]" />
        <div className="px-1 leading-[1.05]">
          {service.tileTitle ? (
            <>
              <div className="text-[clamp(10.5px,3.2vw,16px)] font-bold tracking-tight">{service.tileTitle}</div>
              <div className="text-[clamp(8px,2.2vw,11px)] font-semibold opacity-90">{service.tileSub}</div>
            </>
          ) : (
            <>
              <div className="text-[clamp(12px,3.7vw,18px)] font-extrabold tracking-tight">NEAM</div>
              <div className="text-[clamp(12px,3.7vw,18px)] font-semibold tracking-tight">{service.short}</div>
            </>
          )}
        </div>
      </div>
      </div>
      <p className="mt-2 px-0.5 text-[clamp(9.5px,2.6vw,12px)] leading-tight text-neutral-600">{service.description}</p>
    </Link>
  )
}
