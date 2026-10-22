/**
 * Serveur simulé pour les apps NEAM Partenaire et NEAM Livreur quand aucun projet Supabase
 * n'est configuré : mêmes appels que le vrai client (from/rpc/auth/channel), données gardées
 * sur l'appareil, et une activité simulée (nouvelles commandes, livreur qui passe…).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { SERVICE_MAP } from '../data/services'

type Row = Record<string, any>
type Db = Record<string, Row[]> & { _jobs?: { at: number; kind: string; id?: string }[] }
type Role = 'merchant' | 'courier'

const KEY = (r: Role) => `neam:demo-db:${r}`
const SKEY = (r: Role) => `neam:demo-session:${r}`
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
const now = () => new Date().toISOString()
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
export const DEMO_CODE = '1234'

const CLIENTS = [['Grâce Mboumba', '24177123456'], ['Brice Ndong', '24166234567'], ['Merveille Obiang', '24174345678'], ['Sandrine Moussavou', '24162456789'], ['Junior Nzé', '24177567890'], ['Prisca Ella', '24165678901']]
const PLACES = ['Louis, près de la pharmacie', 'Glass, rue Pecqueur', 'Nkembo, carrefour SNI', 'Akanda, cité Angondjé', 'Owendo, quartier Alénakiri', 'Mont-Bouët, derrière le marché', 'Batterie IV, immeuble bleu', 'Lalala, à côté de l’église']
const CAT = SERVICE_MAP.market.categories
const PRODUCTS: [string, string, string, number, number | null][] = [
  ['🍚', 'Riz parfumé', '5 kg', 4500, 5000], ['🥖', 'Pain baguette', 'x2', 300, null], ['🍅', 'Tomates fraîches', '1 kg', 1200, null], ['🥑', 'Avocats', 'x3', 1000, null],
  ['🍌', 'Bananes plantain', 'régime', 2500, 3000], ['🐟', 'Poisson capitaine', '1 kg', 6500, null], ['🥛', 'Lait concentré', 'x4', 2200, null], ['🧃', 'Jus d’orange', '1 L', 1500, null],
  ['🧴', 'Savon liquide', '500 ml', 1800, null], ['🫒', 'Huile végétale', '1 L', 1900, 2100], ['🧅', 'Oignons', '1 kg', 900, null], ['🥫', 'Concentré de tomate', 'x6', 1500, null],
]

function seed(role: Role, userId: string, phone: string): Db {
  const db: Db = { profiles: [], stores: [], products: [], orders: [], order_items: [], merchant_payouts: [], couriers: [], cash_remittances: [], staff_applications: [], _jobs: [] }
  db.profiles.push({ id: userId, full_name: role === 'merchant' ? 'Awa Ndong' : 'Junior Mba', phone, role, is_active: true })
  const store = { id: uid(), owner_id: role === 'merchant' ? userId : null, name: 'Épicerie Awa', district: 'Glass', address: 'Rue Pecqueur, face à la station', phone: '24177001122', city: 'Libreville', emoji: '🏪', is_open: true, is_active: true, prep_minutes: 20, commission_rate: 0.1, created_at: ago(60 * 24 * 30) }
  db.stores.push(store)
  PRODUCTS.forEach(([emoji, name, unit, price, old], i) =>
    db.products.push({ id: uid(), store_id: store.id, name, category: CAT[i % 3 === 2 ? 1 : 0] ?? CAT[0], sub: null, unit, emoji, description: '', price, old_price: old, in_stock: i !== 5, popular: i < 4, updated_at: now() }),
  )
  if (role === 'merchant') {
    for (const [min, st] of [[300, 'delivered'], [190, 'delivered'], [95, 'delivered'], [12, 'accepted'], [2, 'pending']] as const) newOrder(db, store, { minutesAgo: min, status: st })
    db.merchant_payouts.push({ id: uid(), store_id: store.id, amount: 15000, reference: 'Airtel Money · versement hebdo', created_at: ago(60 * 24 * 3) })
  } else {
    db.couriers.push({ id: userId, is_online: false, vehicle: 'Moto', plate: 'GA-1234-A', location_at: null })
    const first = newOrder(db, store, { minutesAgo: 240, status: 'delivered', courier: userId })
    newOrder(db, store, { minutesAgo: 130, status: 'delivered', courier: userId })
    // la première course a déjà été reversée au bureau
    db.cash_remittances.push({ id: uid(), courier_id: userId, amount: db.orders.find((o) => o.id === first)!.total, note: 'Remis au bureau NEAM', created_at: ago(200) })
  }
  return db
}

function newOrder(db: Db, store: Row, o: { minutesAgo?: number; status: string; courier?: string }) {
  const id = uid(), at = ago(o.minutesAgo ?? 0)
  const prods = [...db.products.filter((p) => p.store_id === store.id && p.in_stock)].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2))
  let items = 0
  for (const p of prods) {
    const qty = 1 + Math.floor(Math.random() * 3)
    items += p.price * qty
    db.order_items.push({ id: Math.floor(Math.random() * 1e9), order_id: id, name: p.name, emoji: p.emoji, unit: p.unit, price: p.price, qty })
  }
  const [name, phone] = pick(CLIENTS)
  const done = (st: string) => ['accepted', 'ready', 'assigned', 'picked_up', 'delivered'].indexOf(o.status) >= ['accepted', 'ready', 'assigned', 'picked_up', 'delivered'].indexOf(st)
  const fee = 1000
  db.orders.push({
    id, code: 'NM' + Math.floor(100000 + Math.random() * 899999), kind: 'market', status: o.status, client_id: uid(), store_id: store.id, courier_id: o.courier ?? null,
    contact_name: name, contact_phone: phone, city: 'Libreville', address: pick(PLACES), pickup_address: null, parcel: null,
    note: o.courier ? `Démo : le client vous donnera le code ${DEMO_CODE}` : null,
    items_total: items, delivery_fee: fee, total: items + fee, commission: Math.round(items * store.commission_rate), cancel_reason: null, created_at: at,
    accepted_at: done('accepted') ? at : null, ready_at: done('ready') ? at : null, assigned_at: done('assigned') ? at : null, picked_up_at: done('picked_up') ? at : null, delivered_at: o.status === 'delivered' ? at : null,
  })
  return id
}

// ---------- Mini moteur de requêtes (sous-ensemble de PostgREST) ----------
type Filter = (r: Row) => boolean
const val = (v: string) => (v === 'null' ? null : v === 'true' ? true : v === 'false' ? false : v)
function cond(expr: string): Filter {
  const [col, op, ...rest] = expr.split('.')
  const v = rest.join('.')
  if (op === 'in') { const list = v.replace(/^\(|\)$/g, '').split(','); return (r) => list.includes(String(r[col])) }
  if (op === 'gte') return (r) => r[col] != null && String(r[col]) >= v
  if (op === 'eq') return (r) => String(r[col]) === String(val(v))
  return () => true
}
function splitTop(s: string) {
  const out: string[] = []; let depth = 0, cur = ''
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = '' } else cur += ch }
  if (cur) out.push(cur)
  return out
}

function makeClient(role: Role): SupabaseClient {
  let db: Db | null = null
  let session: Row | null = null
  try { session = JSON.parse(localStorage.getItem(SKEY(role)) || 'null'); db = JSON.parse(localStorage.getItem(KEY(role)) || 'null') } catch { /* stockage indisponible */ }
  const save = () => { try { localStorage.setItem(KEY(role), JSON.stringify(db)) } catch { /* plein ou bloqué */ } }
  const listeners = new Set<{ table: string; cb: () => void }>()
  const notify = (table: string) => { save(); for (const l of listeners) if (l.table === table) l.cb() }
  const authCbs = new Set<(e: string, s: Row | null) => void>()
  const T = (name: string) => (db![name] ??= [])
  const schedule = (sec: number, kind: string, id?: string) => db!._jobs!.push({ at: Date.now() + sec * 1000, kind, id })

  class Query implements PromiseLike<any> {
    private filters: Filter[] = []; private orders: [string, boolean][] = []; private lim = 0; private single = false
    private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'; private patch: Row | Row[] = {}; private cols = '*'; private opts: Row = {}
    constructor(private table: string) {}
    select(cols = '*', opts: Row = {}) { if (this.mode === 'select') { this.cols = cols; this.opts = opts } return this }
    insert(rows: Row | Row[]) { this.mode = 'insert'; this.patch = rows; return this }
    update(p: Row) { this.mode = 'update'; this.patch = p; return this }
    delete() { this.mode = 'delete'; return this }
    eq(c: string, v: unknown) { this.filters.push((r) => String(r[c]) === String(v)); return this }
    or(expr: string) { const fs = splitTop(expr).map(cond); this.filters.push((r) => fs.some((f) => f(r))); return this }
    order(c: string, o: { ascending?: boolean } = {}) { this.orders.push([c, o.ascending !== false]); return this }
    limit(n: number) { this.lim = n; return this }
    maybeSingle() { this.single = true; return this }
    private run() {
      if (!db) return { data: null, error: null, count: 0 }
      const rows = T(this.table), match = (r: Row) => this.filters.every((f) => f(r))
      if (this.mode === 'insert') { const list = (Array.isArray(this.patch) ? this.patch : [this.patch]).map((r) => ({ id: uid(), created_at: now(), ...r })); rows.push(...list); notify(this.table); return { data: list, error: null } }
      if (this.mode === 'update') { rows.filter(match).forEach((r) => Object.assign(r, this.patch)); notify(this.table); return { data: null, error: null } }
      if (this.mode === 'delete') { db[this.table] = rows.filter((r) => !match(r)); notify(this.table); return { data: null, error: null } }
      let out = rows.filter(match)
      for (const [c, asc] of [...this.orders].reverse()) out = [...out].sort((a, b) => (a[c] ?? '') < (b[c] ?? '') ? (asc ? -1 : 1) : (a[c] ?? '') > (b[c] ?? '') ? (asc ? 1 : -1) : 0)
      if (this.lim) out = out.slice(0, this.lim)
      out = out.map((r) => ({ ...r, ...(this.cols.includes('order_items(') ? { order_items: T('order_items').filter((i) => i.order_id === r.id) } : {}), ...(this.cols.includes('stores(') ? { stores: T('stores').find((s) => s.id === r.store_id) ?? null } : {}) }))
      if (this.opts.head) return { data: null, error: null, count: out.length }
      return { data: this.single ? out[0] ?? null : out, error: null, count: out.length }
    }
    then<A, B>(ok?: ((v: any) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null) { return Promise.resolve().then(() => this.run()).then(ok, ko) }
  }

  const fail = (message: string) => ({ data: null, error: { message } })
  const order = (id: string) => T('orders').find((o) => o.id === id)
  const rpc = async (name: string, a: Row) => {
    if (!db || !session) return fail('Non connecté')
    const me = session.user.id
    switch (name) {
      case 'merchant_update_store': {
        const s = T('stores').find((x) => x.id === a.p_store)
        if (!s) return fail('Boutique introuvable')
        if (a.p_is_open != null) s.is_open = a.p_is_open
        if (a.p_prep_minutes != null) s.prep_minutes = a.p_prep_minutes
        if (a.p_phone != null) s.phone = a.p_phone
        if (a.p_address != null) s.address = a.p_address
        notify('stores'); return { data: null, error: null }
      }
      case 'merchant_update_order': {
        const o = order(a.p_order)
        if (!o) return fail('Commande introuvable')
        if (a.p_action === 'accept' && o.status === 'pending') Object.assign(o, { status: 'accepted', accepted_at: now() })
        else if (a.p_action === 'reject' && o.status === 'pending') Object.assign(o, { status: 'rejected', cancel_reason: a.p_reason || 'Refusée par la boutique' })
        else if (a.p_action === 'ready' && o.status === 'accepted') { Object.assign(o, { status: 'ready', ready_at: now() }); schedule(8, 'assign', o.id) }
        else return fail('Action impossible à cette étape')
        notify('orders'); return { data: null, error: null }
      }
      case 'store_finances': {
        const del = T('orders').filter((o) => o.store_id === a.p_store && o.status === 'delivered')
        const sales = del.reduce((s, o) => s + o.items_total, 0), commission = del.reduce((s, o) => s + o.commission, 0)
        const paid = T('merchant_payouts').filter((p) => p.store_id === a.p_store).reduce((s, p) => s + p.amount, 0)
        return { data: [{ orders_count: del.length, sales, commission, net: sales - commission, paid, balance: sales - commission - paid }], error: null }
      }
      case 'courier_update_location': { const c = T('couriers').find((x) => x.id === me); if (c) c.location_at = now(); save(); return { data: null, error: null } }
      case 'courier_set_online': {
        const c = T('couriers').find((x) => x.id === me)
        if (!c) return fail('Compte livreur introuvable')
        c.is_online = !!a.p_online
        if (c.is_online && !T('orders').some((o) => o.courier_id === me && ['assigned', 'picked_up'].includes(o.status))) schedule(5, 'courier_job')
        notify('couriers'); return { data: null, error: null }
      }
      case 'courier_cash_due': {
        const cash = T('orders').filter((o) => o.courier_id === me && o.status === 'delivered').reduce((s, o) => s + o.total, 0)
        return { data: cash - T('cash_remittances').filter((r) => r.courier_id === me).reduce((s, r) => s + r.amount, 0), error: null }
      }
      case 'courier_update_order': {
        const o = order(a.p_order)
        if (!o || o.courier_id !== me) return fail('Course introuvable')
        if (a.p_action === 'pickup' && o.status === 'assigned') Object.assign(o, { status: 'picked_up', picked_up_at: now() })
        else if (a.p_action === 'deliver' && o.status === 'picked_up') {
          if (String(a.p_code) !== DEMO_CODE) return fail('Code de remise incorrect')
          Object.assign(o, { status: 'delivered', delivered_at: now() })
          if (T('couriers').find((x) => x.id === me)?.is_online) schedule(20, 'courier_job')
        } else return fail('Action impossible à cette étape')
        notify('orders'); return { data: null, error: null }
      }
      case 'submit_application': return { data: null, error: null }
      default: return fail(`Fonction ${name} indisponible en démonstration`)
    }
  }

  // Activité simulée : traitée toutes les 2 s tant que l'app est ouverte
  setInterval(() => {
    if (!db || !session) return
    const due = db._jobs!.filter((j) => j.at <= Date.now())
    if (role === 'merchant' && !db._jobs!.some((j) => j.kind === 'new_order')) schedule(45 + Math.random() * 30, 'new_order')
    if (!due.length) return
    db._jobs = db._jobs!.filter((j) => j.at > Date.now())
    for (const j of due) {
      const o = j.id ? order(j.id) : undefined
      if (j.kind === 'new_order') { const store = T('stores')[0]; if (store?.is_open && T('orders').filter((x) => x.status === 'pending').length < 3) newOrder(db, store, { status: 'pending' }) }
      if (j.kind === 'assign' && o?.status === 'ready') { Object.assign(o, { status: 'assigned', assigned_at: now() }); schedule(12, 'pickup', o.id) }
      if (j.kind === 'pickup' && o?.status === 'assigned') { Object.assign(o, { status: 'picked_up', picked_up_at: now() }); schedule(18, 'deliver', o.id) }
      if (j.kind === 'deliver' && o?.status === 'picked_up') Object.assign(o, { status: 'delivered', delivered_at: now() })
      if (j.kind === 'courier_job') {
        const me = session.user.id
        if (T('couriers').find((x) => x.id === me)?.is_online && !T('orders').some((x) => x.courier_id === me && ['assigned', 'picked_up'].includes(x.status))) {
          const id = newOrder(db, T('stores')[0], { status: 'ready', courier: me })
          Object.assign(order(id)!, { status: 'assigned', assigned_at: now() })
        }
      }
    }
    notify('orders')
  }, 2000)

  const client = {
    from: (t: string) => (t === 'profiles' ? new Query('profiles') : new Query(t)),
    rpc,
    channel: () => {
      const subs: { table: string; cb: () => void }[] = []
      const ch = { on: (_e: string, o: { table: string }, cb: () => void) => { subs.push({ table: o.table, cb }); return ch }, subscribe: () => { subs.forEach((s) => listeners.add(s)); return ch }, _subs: subs }
      return ch
    },
    removeChannel: (ch: { _subs: { table: string; cb: () => void }[] }) => { ch._subs.forEach((s) => listeners.delete(s)); return Promise.resolve('ok') },
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (cb: (e: string, s: Row | null) => void) => { authCbs.add(cb); return { data: { subscription: { unsubscribe: () => authCbs.delete(cb) } } } },
      signInWithOtp: async () => ({ data: {}, error: null }),
      verifyOtp: async ({ phone, token }: { phone: string; token: string }) => {
        if (token !== '123456') return { data: {}, error: { message: 'Code incorrect ou expiré.' } }
        const id = uid()
        session = { access_token: 'demo', user: { id, phone } }
        db = seed(role, id, phone)
        save()
        try { localStorage.setItem(SKEY(role), JSON.stringify(session)) } catch { /* bloqué */ }
        authCbs.forEach((cb) => cb('SIGNED_IN', session))
        return { data: { session }, error: null }
      },
      signOut: async () => {
        session = null; db = null
        try { localStorage.removeItem(SKEY(role)); localStorage.removeItem(KEY(role)) } catch { /* bloqué */ }
        authCbs.forEach((cb) => cb('SIGNED_OUT', null))
        return { error: null }
      },
    },
  }
  return client as unknown as SupabaseClient
}

export const createDemoClient = makeClient
