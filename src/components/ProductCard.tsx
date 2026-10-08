import { useState } from 'react'
import { Heart, Minus, Plus, Star, Store } from 'lucide-react'
import type { Product } from '../data/products'
import { SERVICE_MAP } from '../data/services'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'
import { Sheet } from './Sheet'

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

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const { addToCart, toast } = useApp()
  const service = SERVICE_MAP[product.serviceId]
  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg ${compact ? 'w-40 shrink-0' : ''}`}
      >
        <div className="relative grid aspect-[4/3] place-items-center" style={{ background: `radial-gradient(circle at 50% 60%, white 0%, ${service.soft} 70%)` }}>
          <span className="text-[56px] drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] transition duration-300 group-hover:scale-110">{product.emoji}</span>
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: service.color }}>
              {product.badge}
            </span>
          )}
          <FavButton id={product.id} className="absolute right-2 top-2" />
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900">{product.name}</h3>
          <p className="line-clamp-1 text-[11px] text-neutral-500">
            {product.unit} · {product.vendor}
          </p>
          <div className="mt-auto flex items-end justify-between pt-2">
            <div>
              <div className="text-sm font-bold" style={{ color: service.color }}>{fcfa(product.price)}</div>
              {product.oldPrice && <div className="text-[11px] text-neutral-400 line-through">{fcfa(product.oldPrice)}</div>}
            </div>
            <button
              aria-label={`Ajouter ${product.name} au panier`}
              onClick={(e) => {
                e.stopPropagation()
                tap()
                addToCart(product)
                toast(`${product.name} ajouté au panier`)
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-md transition active:scale-90"
              style={{ background: service.gradient }}
            >
              <Plus size={18} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </article>
      <ProductSheet product={product} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function ProductSheet({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const { addToCart, toast } = useApp()
  const service = SERVICE_MAP[product.serviceId]
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
          <div className="text-xl font-extrabold" style={{ color: service.color }}>{fcfa(product.price)}</div>
          {product.oldPrice && <div className="text-xs text-neutral-400 line-through">{fcfa(product.oldPrice)}</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
          <Star size={13} className="fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1"><Store size={13} /> {product.vendor}</span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1">⏱ {service.eta}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">{product.description}</p>
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
          className="flex h-13 flex-1 items-center justify-between rounded-2xl px-5 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.98]"
          style={{ background: service.gradient }}
        >
          <span>{service.cta}</span>
          <span>{fcfa(product.price * qty)}</span>
        </button>
      </div>
    </Sheet>
  )
}
