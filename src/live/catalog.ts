import { useEffect, useState } from 'react'
import { productsOf, registerProducts, type Product } from '../data/products'
import type { ServiceId } from '../data/services'
import { LIVE, supabase } from './supabase'

export type LiveStore = { id: string; name: string; district: string; address: string; phone: string; emoji: string; is_open: boolean; prep_minutes: number }

type Row = {
  id: string; store_id: string; name: string; category: string; sub: string | null; unit: string; emoji: string; description: string
  price: number; old_price: number | null; in_stock: boolean; popular: boolean; stores: { name: string; is_open: boolean } | null
}

type Catalog = { at: number; products: Product[]; stores: LiveStore[] }
let cache: Catalog | null = null
let inflight: Promise<Catalog> | null = null

const toProduct = (r: Row): Product => ({
  id: r.id,
  serviceId: 'market',
  name: r.name,
  category: r.category,
  sub: r.sub ?? undefined,
  price: r.price,
  oldPrice: r.old_price ?? undefined,
  badge: r.old_price ? `-${Math.round((1 - r.price / r.old_price) * 100)}%` : undefined,
  emoji: r.emoji,
  unit: r.unit,
  rating: 4.7,
  vendor: r.stores?.name ?? 'NEAM Market',
  description: r.description,
  popular: r.popular,
  storeId: r.store_id,
  inStock: r.in_stock,
})

export async function loadMarket(force = false): Promise<Catalog> {
  if (!supabase) return { at: 0, products: [], stores: [] }
  if (cache && !force && Date.now() - cache.at < 60_000) return cache
  if (inflight) return inflight
  inflight = (async () => {
    const [{ data: p, error: e1 }, { data: s, error: e2 }] = await Promise.all([
      supabase.from('products').select('*, stores!inner(name, is_open, is_active)').eq('stores.is_active', true).order('popular', { ascending: false }).order('name'),
      supabase.from('stores').select('id, name, district, address, phone, emoji, is_open, prep_minutes').eq('is_active', true).order('name'),
    ])
    inflight = null
    if (e1 || e2) throw e1 ?? e2
    const products = (p as Row[]).filter((r) => r.in_stock).map(toProduct)
    registerProducts(products)
    const next: Catalog = { at: Date.now(), products, stores: (s ?? []) as LiveStore[] }
    cache = next
    return next
  })()
  return inflight
}

/** Produits d'un service : catalogue réel pour Market en production, catalogue de démonstration sinon. */
export function useProducts(serviceId: ServiceId) {
  const live = LIVE && serviceId === 'market'
  const [state, setState] = useState<{ products: Product[]; loading: boolean; error: string }>(() =>
    live ? { products: cache?.products ?? [], loading: !cache, error: '' } : { products: productsOf(serviceId), loading: false, error: '' },
  )
  useEffect(() => {
    if (!live) return setState({ products: productsOf(serviceId), loading: false, error: '' })
    let alive = true
    loadMarket()
      .then((c) => alive && setState({ products: c.products, loading: false, error: '' }))
      .catch(() => alive && setState((s) => ({ ...s, loading: false, error: 'Impossible de charger le catalogue. Vérifiez votre connexion.' })))
    return () => {
      alive = false
    }
  }, [live, serviceId])
  return state
}

export function useStores() {
  const [stores, setStores] = useState<LiveStore[]>(cache?.stores ?? [])
  useEffect(() => {
    if (!LIVE) return
    loadMarket().then((c) => setStores(c.stores)).catch(() => {})
  }, [])
  return stores
}
