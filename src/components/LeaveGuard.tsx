import { useBlocker } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { SERVICE_MAP } from '../data/services'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { isInsideService } from '../lib/cartScope'
import { Sheet } from './Sheet'
import { ServiceBadge } from './ServiceTile'

/** Demande confirmation avant de quitter un service dont le panier n'est pas vide, puis vide ce panier. */
export function LeaveGuard() {
  const { cartService, cartCount, cartTotal, clearCart, toast } = useApp()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!cartService || !cartCount) return false
    if ((nextLocation.state as { skipLeaveGuard?: boolean } | null)?.skipLeaveGuard) return false
    return isInsideService(currentLocation.pathname, cartService) && !isInsideService(nextLocation.pathname, cartService)
  })

  if (blocker.state !== 'blocked' || !cartService) return null
  const service = SERVICE_MAP[cartService]
  return (
    <Sheet open onClose={() => blocker.reset?.()} title={`Quitter ${service.name} ?`}>
      <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: service.soft }}>
        <ServiceBadge service={service} size="sm" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Votre panier sera annulé</p>
          <p className="text-neutral-600">{cartCount} article{cartCount > 1 ? 's' : ''} · {fcfa(cartTotal)}</p>
        </div>
        <ShoppingCart style={{ color: service.color }} />
      </div>
      <p className="mt-3 text-sm text-neutral-600">Chaque service NEAM a son propre panier. Validez votre commande avant de passer à un autre service.</p>
      <div className="mt-5 grid gap-2">
        <button onClick={() => blocker.reset?.()} className="w-full rounded-2xl py-3.5 font-semibold text-white shadow-md" style={{ background: service.gradient }}>
          Rester sur {service.name}
        </button>
        <button
          onClick={() => {
            clearCart()
            toast(`Panier ${service.name} annulé`)
            blocker.proceed?.()
          }}
          className="w-full rounded-2xl bg-neutral-100 py-3.5 font-semibold text-red-600"
        >
          Quitter et vider le panier
        </button>
      </div>
    </Sheet>
  )
}
