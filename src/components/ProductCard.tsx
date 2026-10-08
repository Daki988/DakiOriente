import { useState } from 'react'
import { CalendarPlus, Heart, Minus, Plus, ShoppingCart, Star, Store, Upload } from 'lucide-react'
import type { Product } from '../data/products'
import { SERVICE_MAP } from '../data/services'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'
import { Sheet } from './Sheet'
import { BookingSheet, CustomizeSheet } from './BookingSheet'

export function FavButton({ id, className = '' }: { id: string; className?: string }) {
  const { favorites, toggleFavorite, toast } = useApp()
  const on = favorites.includes(id)
  return (
    <button
      aria-label={on ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation()
        tap()
        toggleFavorite(id)
        if (!on) toast('Ajouté aux favoris')
      }}
      className={`grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart size={16} className={on ? 'fill-red-500 text-red-500' : 'text-neutral-500'} />
    </button>
  )
}

function Price({ product, className = '' }: { product: Product; className?: string }) {
  const service = SERVICE_MAP[product.serviceId]
  return (
    <div className={className}>
      {product.from && <div className="text-[10px] leading-none text-neutral-500">à partir de</div>}
      <div className="text-sm font-bold" style={{ color: service.color }}>{fcfa(product.price)}</div>
      {product.oldPrice && <div className="text-[11px] text-neutral-400 line-through">{fcfa(product.oldPrice)}</div>}
    </div>
  )
}

/**
 * Carte produit. `variant` :
 *  - default : carte complète (grilles 2-4 colonnes)
 *  - row     : carte compacte pour les listes horizontales
 *  - mini    : petite carte (grilles 3 colonnes, comme les pages catégories des interfaces)
 */
export function ProductCard({ product, variant = 'default', compact }: { product: Product; variant?: 'default' | 'row' | 'mini'; compact?: boolean }) {
  const [open, setOpen] = useState<null | 'detail' | 'book' | 'custom'>(null)
  const { addToCart, toast } = useApp()
  const service = SERVICE_MAP[product.serviceId]
  const v = compact ? 'row' : variant

  const primary = (e: React.MouseEvent) => {
    e.stopPropagation()
    tap()
    if (product.booking) return setOpen('book')
    if (product.custom) return setOpen('custom')
    addToCart(product)
    toast(`${product.name} ajouté au panier`)
  }
  const ActionIcon = product.booking ? CalendarPlus : product.custom ? Upload : v === 'mini' ? ShoppingCart : Plus

  return (
    <>
      <article
        onClick={() => setOpen('detail')}
        className={`group relative flex cursor-pointer flex-col overflow-hidden bg-white shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg ${v === 'row' ? 'w-40 shrink-0 rounded-2xl' : v === 'mini' ? 'rounded-xl' : 'rounded-2xl'}`}
      >
        <div className={`relative grid place-items-center ${v === 'mini' ? 'aspect-square' : 'aspect-[4/3]'}`} style={{ background: `radial-gradient(circle at 50% 60%, white 0%, ${service.soft} 70%)` }}>
          <span className={`${v === 'mini' ? 'text-[44px]' : 'text-[56px]'} drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] transition duration-300 group-hover:scale-110`}>{product.emoji}</span>
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: product.badge.startsWith('-') ? '#ef233c' : service.color }}>
              {product.badge}
            </span>
          )}
          {v !== 'mini' && <FavButton id={product.id} className="absolute right-2 top-2" />}
        </div>
        <div className={`flex flex-1 flex-col ${v === 'mini' ? 'p-2' : 'p-3'}`}>
          <h3 className={`line-clamp-1 font-semibold text-neutral-900 ${v === 'mini' ? 'text-xs' : 'text-sm'}`}>{product.name}</h3>
          <p className="line-clamp-1 text-[11px] text-neutral-500">{v === 'mini' ? product.unit : `${product.unit} · ${product.vendor}`}</p>
          <div className="mt-auto flex items-end justify-between gap-1 pt-2">
            <Price product={product} />
            <button
              aria-label={`${product.booking ? 'Réserver' : product.custom ? 'Personnaliser' : 'Ajouter'} ${product.name}`}
              onClick={primary}
              className={`grid shrink-0 place-items-center text-white shadow-md transition active:scale-90 ${v === 'mini' ? 'h-7 w-7 rounded-lg' : 'h-9 w-9 rounded-xl'}`}
              style={{ background: service.gradient }}
            >
              <ActionIcon size={v === 'mini' ? 14 : 17} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </article>
      <ProductSheet product={product} open={open === 'detail'} onClose={() => setOpen(null)} onBook={() => setOpen('book')} onCustom={() => setOpen('custom')} />
      {product.booking && <BookingSheet item={product} open={open === 'book'} onClose={() => setOpen(null)} />}
      {product.custom && <CustomizeSheet product={product} open={open === 'custom'} onClose={() => setOpen(null)} />}
    </>
  )
}

export function ProductSheet({ product, open, onClose, onBook, onCustom }: { product: Product; open: boolean; onClose: () => void; onBook?: () => void; onCustom?: () => void }) {
  const [qty, setQty] = useState(1)
  const { addToCart, toast } = useApp()
  const service = SERVICE_MAP[product.serviceId]
  const special = product.booking ? onBook : product.custom ? onCustom : undefined
  return (
    <Sheet open={open} onClose={onClose} title={service.name}>
      <div className="relative grid h-52 place-items-center rounded-3xl" style={{ background: `radial-gradient(circle at 50% 55%, white 0%, ${service.soft} 75%)` }}>
        <span className="animate-float text-[110px] drop-shadow-[0_16px_18px_rgba(0,0,0,0.2)]">{product.emoji}</span>
        <FavButton id={product.id} className="absolute right-3 top-3 h-10 w-10" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p className="text-sm text-neutral-500">{product.unit}</p>
        </div>
        <div className="text-right">
          {product.from && <div className="text-xs text-neutral-500">à partir de</div>}
          <div className="text-xl font-extrabold" style={{ color: service.color }}>{fcfa(product.price)}</div>
          {product.oldPrice && <div className="text-xs text-neutral-400 line-through">{fcfa(product.oldPrice)}</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
          <Star size={13} className="fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1"><Store size={13} /> {product.vendor}</span>
        {service.eta && <span className="rounded-full bg-neutral-100 px-2.5 py-1">⏱ {product.booking ? 'Sur rendez-vous' : service.eta}</span>}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">{product.description}</p>
      {special ? (
        <button
          onClick={() => { onClose(); special() }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white shadow-lg"
          style={{ background: service.gradient }}
        >
          {product.booking ? <><CalendarPlus size={19} /> Choisir un créneau</> : <><Upload size={19} /> Personnaliser</>}
        </button>
      ) : (
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1">
            <button aria-label="Diminuer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm"><Minus size={18} /></button>
            <span className="w-8 text-center text-lg font-bold">{qty}</span>
            <button aria-label="Augmenter" onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm"><Plus size={18} /></button>
          </div>
          <button
            onClick={() => {
              tap()
              addToCart(product, qty)
              toast(`${qty} × ${product.name} ajouté${qty > 1 ? 's' : ''}`)
              setQty(1)
              onClose()
            }}
            className="flex flex-1 items-center justify-between rounded-2xl px-5 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.98]"
            style={{ background: service.gradient }}
          >
            <span>{service.cta}</span>
            <span>{fcfa(product.price * qty)}</span>
          </button>
        </div>
      )}
    </Sheet>
  )
}
