import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Mode « production » : un projet Supabase est configuré. Sinon, mode démonstration. */
export const LIVE = !!(url && key)

/** Sans serveur, les apps Partenaire et Livreur tournent sur un serveur simulé (données sur l'appareil). */
const FLAVOR = import.meta.env.VITE_APP as string | undefined
export const DEMO_STAFF = !LIVE && (FLAVOR === 'merchant' || FLAVOR === 'courier')

export const supabase: SupabaseClient | null = LIVE
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : DEMO_STAFF
    ? createDemoClient(FLAVOR as 'merchant' | 'courier')
    : null

/** Services ouverts au lancement (les autres restent en aperçu). */
export const LIVE_SERVICES = ['market', 'express'] as const
export const isLiveService = (id: string) => !LIVE || (LIVE_SERVICES as readonly string[]).includes(id)

export function sb() {
  if (!supabase) throw new Error('Supabase n’est pas configuré')
  return supabase
}

/** Message d'erreur lisible (les fonctions SQL renvoient déjà des messages en français). */
export const errMsg = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Connexion impossible. Vérifiez votre accès à Internet.'
  if (/Token has expired|invalid.*otp/i.test(m)) return 'Code incorrect ou expiré.'
  return m
}

/** Numéro gabonais → format international sans « + » (2410…), comme l'attend Supabase. */
export const normalizePhone = (raw: string) => {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (!d.startsWith('241')) d = '241' + d
  return d
}

export type Role = 'client' | 'merchant' | 'courier' | 'admin'
export type OrderStatus = 'pending' | 'accepted' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'rejected'

export type LiveOrder = {
  id: string
  code: string
  kind: 'market' | 'express'
  status: OrderStatus
  client_id: string
  store_id: string | null
  courier_id: string | null
  contact_name: string
  contact_phone: string
  city: string
  address: string
  pickup_address: string | null
  parcel: { size: string; speed: string; km: number; description?: string } | null
  note: string | null
  items_total: number
  delivery_fee: number
  total: number
  commission: number
  cancel_reason: string | null
  created_at: string
  accepted_at: string | null
  ready_at: string | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  order_items?: { id: number; name: string; emoji: string; unit: string; price: number; qty: number }[]
  stores?: { name: string; district: string; phone: string; address: string } | null
}

export const ORDER_SELECT = '*, order_items(*), stores(name, district, phone, address)'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente',
  accepted: 'En préparation',
  ready: 'Prête',
  assigned: 'Livreur en route',
  picked_up: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  rejected: 'Refusée',
}

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-sky-100 text-sky-800',
  ready: 'bg-violet-100 text-violet-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-neam-100 text-neam-800',
  delivered: 'bg-neutral-100 text-neutral-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
}

export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'ready', 'assigned', 'picked_up']
