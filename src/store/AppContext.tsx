import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCT_MAP, type Product } from '../data/products'
import type { ServiceId } from '../data/services'

export type CartLine = { productId: string; qty: number }

export type OrderLine = { name: string; emoji: string; qty: number; price: number }

export type Order = {
  id: string
  serviceId: ServiceId
  lines: OrderLine[]
  subtotal: number
  delivery: number
  total: number
  payment: string
  address: string
  createdAt: number
  /** Durée totale estimée en minutes (pour la simulation du suivi) */
  etaMin: number
  note?: string
}

export type Notification = { id: string; title: string; body: string; ts: number; read: boolean; icon: string }

type Toast = { id: number; text: string }

type State = {
  city: string
  cart: CartLine[]
  favorites: string[]
  orders: Order[]
  notifications: Notification[]
  recentSearches: string[]
  wallet: number
  userName: string
}

const KEY = 'neam:v1'

const initialNotifications: Notification[] = [
  { id: 'n1', icon: '🎉', title: 'Bienvenue sur NEAM !', body: 'Un seul compte pour tous vos services du quotidien.', ts: Date.now() - 1000 * 60 * 5, read: false },
  { id: 'n2', icon: '🍲', title: 'NEAM Food : -20% ce soir', body: 'Profitez de -20% sur votre première commande de repas avec le code NEAM20.', ts: Date.now() - 1000 * 60 * 90, read: false },
  { id: 'n3', icon: '🛵', title: 'Livraison offerte', body: 'Livraison gratuite sur NEAM Market dès 15 000 FCFA d’achat.', ts: Date.now() - 1000 * 60 * 60 * 26, read: true },
]

const defaults: State = {
  city: 'Libreville',
  cart: [],
  favorites: [],
  orders: [],
  notifications: initialNotifications,
  recentSearches: ['Poulet nyembwe', 'Paracétamol', 'Cartes de visite'],
  wallet: 25000,
  userName: 'Invité NEAM',
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch {
    /* stockage indisponible */
  }
  return defaults
}

type Ctx = State & {
  setCity: (c: string) => void
  addToCart: (p: Product, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  clearCart: () => void
  toggleFavorite: (productId: string) => void
  placeOrder: (o: Omit<Order, 'id' | 'createdAt'>) => Order
  markAllRead: () => void
  pushSearch: (q: string) => void
  payWithWallet: (amount: number) => boolean
  setUserName: (n: string) => void
  cartCount: number
  cartTotal: number
  toasts: Toast[]
  toast: (text: string) => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* stockage indisponible */
    }
  }, [state])

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const api = useMemo<Ctx>(() => {
    const cartCount = state.cart.reduce((n, l) => n + l.qty, 0)
    const cartTotal = state.cart.reduce((n, l) => n + (PRODUCT_MAP[l.productId]?.price ?? 0) * l.qty, 0)
    return {
      ...state,
      cartCount,
      cartTotal,
      toasts,
      toast,
      setCity: (city) => setState((s) => ({ ...s, city })),
      addToCart: (p, qty = 1) =>
        setState((s) => {
          const found = s.cart.find((l) => l.productId === p.id)
          const cart = found
            ? s.cart.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + qty } : l))
            : [...s.cart, { productId: p.id, qty }]
          return { ...s, cart }
        }),
      setQty: (productId, qty) =>
        setState((s) => ({
          ...s,
          cart: qty <= 0 ? s.cart.filter((l) => l.productId !== productId) : s.cart.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        })),
      clearCart: () => setState((s) => ({ ...s, cart: [] })),
      toggleFavorite: (id) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
        })),
      placeOrder: (o) => {
        const order: Order = { ...o, id: `NM${Date.now().toString().slice(-6)}`, createdAt: Date.now() }
        setState((s) => ({
          ...s,
          orders: [order, ...s.orders],
          notifications: [
            { id: `n${order.id}`, icon: '✅', title: `Commande ${order.id} confirmée`, body: 'Suivez votre livraison en temps réel dans l’onglet Commandes.', ts: Date.now(), read: false },
            ...s.notifications,
          ],
        }))
        return order
      },
      markAllRead: () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushSearch: (q) =>
        setState((s) => ({ ...s, recentSearches: [q, ...s.recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6) })),
      payWithWallet: (amount) => {
        if (state.wallet < amount) return false
        setState((s) => ({ ...s, wallet: s.wallet - amount }))
        return true
      },
      setUserName: (userName) => setState((s) => ({ ...s, userName })),
    }
  }, [state, toasts, toast])

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>')
  return ctx
}

