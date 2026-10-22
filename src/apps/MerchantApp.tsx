import { useEffect, useMemo, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Bell, BellOff, Check, ClipboardList, Package, Pencil, Plus, Search, Store as StoreIcon, Trash2, Wallet } from 'lucide-react'
import { SERVICE_MAP } from '../data/services'
import { money, timeAgo } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../live/auth'
import { beep, useLiveQuery } from '../live/realtime'
import { errMsg, ORDER_SELECT, sb, type LiveOrder } from '../live/supabase'
import { StatusPill } from '../live/ClientOrders'
import { useApp } from '../store/AppContext'
import { Card, Empty, PageTitle, STAFF_APPS, StaffGate, StaffShell } from './staff'

const APP = STAFF_APPS.merchant
const CATEGORIES = SERVICE_MAP.market.categories

type Store = { id: string; name: string; district: string; address: string; phone: string; is_open: boolean; prep_minutes: number; commission_rate: number; is_active: boolean }
type Product = { id: string; store_id: string; name: string; category: string; sub: string | null; unit: string; emoji: string; description: string; price: number; old_price: number | null; in_stock: boolean; popular: boolean }

function useMyStore() {
  const { session } = useAuth()
  const { data, loading, reload } = useLiveQuery<Store | null>(
    `my-store-${session?.user.id}`,
    async () => (await sb().from('stores').select('*').eq('owner_id', session!.user.id).order('created_at').limit(1).maybeSingle()).data as Store | null,
    [{ table: 'stores' }],
    null,
  )
  return { store: data, loading, reload }
}

function OpenToggle({ store, onChange }: { store: Store; onChange: () => void }) {
  const { toast } = useApp()
  const toggle = async () => {
    const { error } = await sb().rpc('merchant_update_store', { p_store: store.id, p_is_open: !store.is_open, p_prep_minutes: null, p_phone: null, p_address: null })
    if (error) return toast(errMsg(error))
    toast(store.is_open ? 'Boutique fermée : plus de nouvelles commandes' : 'Boutique ouverte')
    onChange()
  }
  return (
    <button onClick={toggle} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${store.is_open ? 'bg-white text-neam-700 lg:bg-neam-50' : 'bg-red-500 text-white'}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${store.is_open ? 'bg-neam-500' : 'bg-white'}`} /> {store.is_open ? 'Ouverte' : 'Fermée'}
    </button>
  )
}

// ---------------- Commandes ----------------
function OrderCard({ o, onAction, busy }: { o: LiveOrder; onAction: (id: string, action: string, reason?: string) => void; busy: boolean }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const preparing = o.status === 'accepted' || (o.status === 'assigned' && !o.ready_at)
  return (
    <Card className={o.status === 'pending' ? 'ring-2 ring-amber-400' : ''}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">#{o.code}</p>
          <p className="text-xs text-neutral-500">{timeAgo(new Date(o.created_at).getTime())} · {o.contact_name || 'Client'}</p>
        </div>
        <StatusPill status={o.status === 'assigned' && !o.ready_at ? 'accepted' : o.status} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {o.order_items?.map((l) => (
          <li key={l.id} className="flex gap-2"><span>{l.emoji}</span><span className="flex-1"><b>{l.qty}×</b> {l.name} <span className="text-neutral-400">{l.unit}</span></span><span>{money(l.price * l.qty)}</span></li>
        ))}
      </ul>
      {o.note && <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-900">📝 {o.note}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-neutral-200 pt-2 text-sm">
        <span className="text-neutral-500">Articles</span>
        <span className="font-bold">{money(o.items_total)}</span>
      </div>
      {o.status === 'pending' && !rejecting && (
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <button disabled={busy} onClick={() => onAction(o.id, 'accept')} className="flex items-center justify-center gap-1.5 rounded-xl py-3 font-semibold text-white disabled:opacity-60" style={{ background: APP.accent }}><Check size={18} /> Accepter</button>
          <button disabled={busy} onClick={() => setRejecting(true)} className="rounded-xl bg-neutral-100 px-4 font-semibold text-neutral-600">Refuser</button>
        </div>
      )}
      {rejecting && (
        <div className="mt-3 space-y-2">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 rounded-xl border border-neutral-200 px-3 text-sm">
            <option value="">Motif du refus…</option>
            {['Article en rupture', 'Boutique sur le point de fermer', 'Trop de commandes en cours', 'Autre'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setRejecting(false)} className="rounded-xl bg-neutral-100 py-2.5 text-sm font-semibold">Retour</button>
            <button disabled={!reason || busy} onClick={() => onAction(o.id, 'reject', reason)} className="rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Confirmer le refus</button>
          </div>
        </div>
      )}
      {preparing && (
        <button disabled={busy} onClick={() => onAction(o.id, 'ready')} className="mt-3 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white disabled:opacity-60">Commande prête</button>
      )}
      {(o.status === 'ready' || (o.status === 'assigned' && o.ready_at)) && <p className="mt-3 rounded-xl bg-violet-50 p-2.5 text-center text-sm font-medium text-violet-800">{o.status === 'assigned' ? 'Livreur en route pour récupérer' : 'En attente d’un livreur NEAM'}</p>}
      {o.status === 'picked_up' && <p className="mt-3 rounded-xl bg-neam-50 p-2.5 text-center text-sm font-medium text-neam-800">Récupérée · en livraison</p>}
    </Card>
  )
}

function MerchantOrders({ store, reloadStore }: { store: Store; reloadStore: () => void }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(true)
  const { data: orders, reload } = useLiveQuery<LiveOrder[]>(
    `m-orders-${store.id}`,
    async () => {
      const since = new Date(Date.now() - 36 * 3600_000).toISOString()
      const { data, error } = await sb().from('orders').select(ORDER_SELECT).eq('store_id', store.id).or(`status.in.(pending,accepted,ready,assigned,picked_up),created_at.gte.${since}`).order('created_at', { ascending: false })
      if (error) throw error
      return data as LiveOrder[]
    },
    [{ table: 'orders', filter: `store_id=eq.${store.id}` }],
    [],
  )
  const pending = orders.filter((o) => o.status === 'pending')
  const prevPending = useRef(-1)
  useEffect(() => {
    if (prevPending.current >= 0 && pending.length > prevPending.current && sound) beep()
    prevPending.current = pending.length
  }, [pending.length, sound])

  const act = async (id: string, action: string, reason?: string) => {
    setBusy(true)
    const { error } = await sb().rpc('merchant_update_order', { p_order: id, p_action: action, p_reason: reason ?? null })
    setBusy(false)
    if (error) return toast(errMsg(error))
    toast(action === 'accept' ? 'Commande acceptée' : action === 'ready' ? 'Commande prête : un livreur va passer' : 'Commande refusée')
    reload()
  }
  const cols = [
    { key: 'new', title: 'Nouvelles', list: pending },
    { key: 'prep', title: 'En préparation', list: orders.filter((o) => o.status === 'accepted' || (o.status === 'assigned' && !o.ready_at)) },
    { key: 'ready', title: 'Prêtes / en livraison', list: orders.filter((o) => o.status === 'ready' || o.status === 'picked_up' || (o.status === 'assigned' && o.ready_at)) },
  ]
  const done = orders.filter((o) => ['delivered', 'cancelled', 'rejected'].includes(o.status))
  return (
    <>
      <PageTitle
        title="Commandes"
        subtitle={`${store.name} · préparation ${store.prep_minutes} min`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => { setSound(!sound); if (!sound) beep() }} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-black/5" aria-pressed={sound}>
              {sound ? <Bell size={15} /> : <BellOff size={15} />} Son {sound ? 'activé' : 'coupé'}
            </button>
            <OpenToggle store={store} onChange={reloadStore} />
          </div>
        }
      />
      {!store.is_open && <p className="mx-4 mb-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 lg:mx-8">Boutique fermée : les clients ne peuvent pas commander.</p>}
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-8">
        {cols.map((c) => (
          <section key={c.key} className="min-w-0">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
              {c.title} <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700">{c.list.length}</span>
            </h2>
            <div className="space-y-3">
              {c.list.map((o) => <OrderCard key={o.id} o={o} onAction={act} busy={busy} />)}
              {!c.list.length && <p className="rounded-2xl border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">Aucune commande</p>}
            </div>
          </section>
        ))}
      </div>
      <section className="px-4 pt-8 lg:px-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Terminées (36 h)</h2>
        <Card className="divide-y divide-neutral-100 p-0!">
          {done.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-semibold">#{o.code}</span>
              <span className="flex-1 truncate text-neutral-500">{o.order_items?.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span>
              <StatusPill status={o.status} />
              <span className="w-24 text-right font-semibold">{money(o.items_total)}</span>
            </div>
          ))}
          {!done.length && <p className="p-4 text-center text-sm text-neutral-400">Rien pour l’instant</p>}
        </Card>
      </section>
    </>
  )
}

// ---------------- Catalogue ----------------
const EMPTY: Omit<Product, 'id' | 'store_id'> = { name: '', category: CATEGORIES[0], sub: null, unit: '', emoji: '🛒', description: '', price: 0, old_price: null, in_stock: true, popular: false }

function ProductForm({ store, initial, onClose, onSaved }: { store: Store; initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useApp()
  const [f, setF] = useState(initial ?? { ...EMPTY, id: '', store_id: store.id })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = 'h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400'
  const save = async () => {
    if (f.name.trim().length < 2) return setError('Nom du produit requis.')
    if (!(f.price > 0)) return setError('Prix requis.')
    if (f.old_price != null && f.old_price <= f.price) return setError('L’ancien prix doit être supérieur au prix actuel.')
    setBusy(true)
    const row = { store_id: store.id, name: f.name.trim(), category: f.category, sub: f.sub || null, unit: f.unit.trim(), emoji: f.emoji || '🛒', description: f.description.trim(), price: Math.round(f.price), old_price: f.old_price ? Math.round(f.old_price) : null, in_stock: f.in_stock, popular: f.popular, updated_at: new Date().toISOString() }
    const { error } = initial ? await sb().from('products').update(row).eq('id', initial.id) : await sb().from('products').insert(row)
    setBusy(false)
    if (error) return setError(errMsg(error))
    toast(initial ? 'Produit mis à jour' : 'Produit ajouté au catalogue')
    onSaved()
    onClose()
  }
  return (
    <Sheet open onClose={onClose} title={initial ? 'Modifier le produit' : 'Nouveau produit'}>
      <div className="space-y-2">
        <div className="grid grid-cols-[72px_1fr] gap-2">
          <input id="pf-emoji" className={`${field} text-center text-2xl`} value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} aria-label="Emoji" />
          <input id="pf-name" className={field} placeholder="Nom (ex. Riz parfumé)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select id="pf-cat" className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input id="pf-unit" className={field} placeholder="Unité (ex. 5 kg)" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
        </div>
        {f.category === 'Fruits & Légumes Frais' && (
          <select id="pf-sub" className={field} value={f.sub ?? ''} onChange={(e) => setF({ ...f, sub: e.target.value || null })}>
            <option value="">Sous-catégorie…</option>{['Fruits', 'Légumes', 'Tubercules'].map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-neutral-500">Prix (FCFA)<input id="pf-price" className={field} inputMode="numeric" value={f.price || ''} onChange={(e) => setF({ ...f, price: +e.target.value.replace(/\D/g, '') })} /></label>
          <label className="text-xs font-medium text-neutral-500">Ancien prix (promo)<input id="pf-old" className={field} inputMode="numeric" value={f.old_price ?? ''} onChange={(e) => setF({ ...f, old_price: e.target.value ? +e.target.value.replace(/\D/g, '') : null })} /></label>
        </div>
        <textarea id="pf-desc" rows={2} className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex gap-4 py-1 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.in_stock} onChange={(e) => setF({ ...f, in_stock: e.target.checked })} className="h-4 w-4" /> En stock</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} className="h-4 w-4" /> Mettre en avant</label>
        </div>
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
      <button disabled={busy} onClick={save} className="mt-4 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-60" style={{ background: APP.accent }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </Sheet>
  )
}

function MerchantCatalog({ store }: { store: Store }) {
  const { toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Product | null | 'new'>(null)
  const [confirmDel, setConfirmDel] = useState<Product | null>(null)
  const { data: products, reload } = useLiveQuery<Product[]>(
    `m-products-${store.id}`,
    async () => ((await sb().from('products').select('*').eq('store_id', store.id).order('category').order('name')).data ?? []) as Product[],
    [{ table: 'products', filter: `store_id=eq.${store.id}` }],
    [],
  )
  const list = useMemo(() => products.filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())), [products, q])
  const toggle = async (p: Product) => {
    const { error } = await sb().from('products').update({ in_stock: !p.in_stock, updated_at: new Date().toISOString() }).eq('id', p.id)
    if (error) return toast(errMsg(error))
    toast(p.in_stock ? `${p.name} : en rupture` : `${p.name} : de nouveau en stock`)
    reload()
  }
  const del = async (p: Product) => {
    const { error } = await sb().from('products').delete().eq('id', p.id)
    setConfirmDel(null)
    if (error) return toast(errMsg(error))
    toast('Produit supprimé')
    reload()
  }
  return (
    <>
      <PageTitle title="Catalogue" subtitle={`${products.length} produit${products.length > 1 ? "s" : ""} · ${products.filter((p) => !p.in_stock).length} en rupture`} action={<button onClick={() => setEdit('new')} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white" style={{ background: APP.accent }}><Plus size={17} /> Ajouter</button>} />
      <div className="px-4 lg:px-8">
        <label className="mb-3 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-black/5">
          <Search size={18} className="text-neutral-400" />
          <input id="cat-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <Card className="divide-y divide-neutral-100 p-0!">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-2xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${p.in_stock ? '' : 'text-neutral-400 line-through'}`}>{p.name}</p>
                <p className="truncate text-xs text-neutral-500">{p.category} · {p.unit}</p>
                <p className="text-sm font-bold sm:hidden">{money(p.price)}{p.old_price ? <span className="ml-1.5 text-xs font-normal text-neutral-400 line-through">{money(p.old_price)}</span> : null}</p>
              </div>
              <div className="hidden text-right text-sm sm:block">
                <p className="font-bold">{money(p.price)}</p>
                {p.old_price && <p className="text-xs text-neutral-400 line-through">{money(p.old_price)}</p>}
              </div>
              <button onClick={() => toggle(p)} className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:block ${p.in_stock ? 'bg-neam-50 text-neam-700' : 'bg-red-50 text-red-600'}`}>{p.in_stock ? 'En stock' : 'Rupture'}</button>
              <button onClick={() => toggle(p)} aria-label={p.in_stock ? 'Marquer en rupture' : 'Remettre en stock'} className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition sm:hidden ${p.in_stock ? 'bg-neam-500' : 'bg-neutral-300'}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${p.in_stock ? 'translate-x-5' : ''}`} /></button>
              <button onClick={() => setEdit(p)} aria-label="Modifier" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-neutral-100"><Pencil size={16} /></button>
              <button onClick={() => setConfirmDel(p)} aria-label="Supprimer" className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-red-500 hover:bg-red-50 sm:grid"><Trash2 size={16} /></button>
            </div>
          ))}
          {!list.length && <Empty emoji="📦" title="Aucun produit" text="Ajoutez vos premiers produits pour qu’ils apparaissent sur NEAM Market." />}
        </Card>
      </div>
      {edit && <ProductForm store={store} initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={reload} />}
      {confirmDel && (
        <Sheet open onClose={() => setConfirmDel(null)} title="Supprimer le produit ?">
          <p className="text-sm text-neutral-600">« {confirmDel.name} » sera retiré du catalogue. Les commandes passées ne sont pas modifiées.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmDel(null)} className="rounded-2xl bg-neutral-100 py-3 font-semibold">Annuler</button>
            <button onClick={() => del(confirmDel)} className="rounded-2xl bg-red-600 py-3 font-semibold text-white">Supprimer</button>
          </div>
          {edit === null && <button onClick={() => { setEdit(confirmDel); setConfirmDel(null) }} className="mt-2 w-full py-2 text-sm text-neutral-500">Modifier plutôt</button>}
        </Sheet>
      )}
    </>
  )
}

// ---------------- Boutique ----------------
function MerchantStore({ store, reload }: { store: Store; reload: () => void }) {
  const { toast } = useApp()
  const [prep, setPrep] = useState(store.prep_minutes)
  const [phone, setPhone] = useState(store.phone)
  const [address, setAddress] = useState(store.address)
  const save = async () => {
    const { error } = await sb().rpc('merchant_update_store', { p_store: store.id, p_is_open: null, p_prep_minutes: prep, p_phone: phone, p_address: address })
    if (error) return toast(errMsg(error))
    toast('Boutique mise à jour')
    reload()
  }
  const field = 'h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400'
  return (
    <>
      <PageTitle title="Ma boutique" subtitle={store.district ? `${store.name} · ${store.district}` : store.name} action={<OpenToggle store={store} onChange={reload} />} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-8">
        <Card className="space-y-3">
          <label className="block text-sm font-medium text-neutral-600">Temps de préparation moyen : <b>{prep} min</b>
            <input type="range" min={5} max={90} step={5} value={prep} onChange={(e) => setPrep(+e.target.value)} className="mt-2 w-full" style={{ accentColor: APP.accent }} />
          </label>
          <label className="block text-sm font-medium text-neutral-600">Téléphone (pour les livreurs)<input id="st-phone" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label>
          <label className="block text-sm font-medium text-neutral-600">Adresse de retrait<input id="st-address" className={field} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <button onClick={save} className="w-full rounded-2xl py-3.5 font-semibold text-white" style={{ background: APP.accent }}>Enregistrer</button>
        </Card>
        <Card className="text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Vos conditions NEAM</p>
          <ul className="mt-2 space-y-1.5">
            <li>• Commission NEAM : <b>{Math.round(store.commission_rate * 100)} %</b> sur les articles</li>
            <li>• Paiement par le client : à la livraison, encaissé par le livreur NEAM</li>
            <li>• Versement de vos ventes par NEAM (voir Finances)</li>
            <li>• Statut : {store.is_active ? 'boutique active' : 'boutique suspendue par NEAM'}</li>
          </ul>
        </Card>
      </div>
    </>
  )
}

// ---------------- Finances ----------------
function MerchantFinances({ store }: { store: Store }) {
  const { data } = useLiveQuery(
    `m-fin-${store.id}`,
    async () => {
      const [{ data: f }, { data: payouts }] = await Promise.all([
        sb().rpc('store_finances', { p_store: store.id }),
        sb().from('merchant_payouts').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
      ])
      return { f: (f as { orders_count: number; sales: number; commission: number; net: number; paid: number; balance: number }[] | null)?.[0], payouts: (payouts ?? []) as { id: string; amount: number; reference: string | null; created_at: string }[] }
    },
    [{ table: 'orders', filter: `store_id=eq.${store.id}` }],
    { f: undefined, payouts: [] },
  )
  const f = data.f
  const tiles = [
    { l: 'Commandes livrées', v: f ? String(f.orders_count) : '—' },
    { l: 'Ventes (articles)', v: f ? money(f.sales) : '—' },
    { l: `Commission NEAM (${Math.round(store.commission_rate * 100)} %)`, v: f ? `-${money(f.commission)}` : '—' },
    { l: 'Net à recevoir', v: f ? money(f.net) : '—' },
  ]
  return (
    <>
      <PageTitle title="Finances" subtitle="Ventes livrées et versements NEAM" />
      <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-8">
        {tiles.map((t) => <Card key={t.l}><p className="text-xs text-neutral-500">{t.l}</p><p className="mt-1 text-xl font-extrabold tabular-nums">{t.v}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 pt-4 lg:grid-cols-2 lg:px-8">
        <Card>
          <p className="text-sm text-neutral-500">Solde restant à verser par NEAM</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: APP.accent }}>{f ? money(f.balance) : '—'}</p>
          <p className="mt-1 text-xs text-neutral-500">Déjà versé : {f ? money(f.paid) : '—'}</p>
        </Card>
        <Card className="p-0!">
          <p className="px-4 pt-4 text-sm font-semibold">Versements reçus</p>
          <div className="divide-y divide-neutral-100">
            {data.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}{p.reference ? ` · ${p.reference}` : ''}</span>
                <span className="font-semibold">{money(p.amount)}</span>
              </div>
            ))}
            {!data.payouts.length && <p className="px-4 py-6 text-center text-sm text-neutral-400">Aucun versement pour l’instant</p>}
          </div>
        </Card>
      </div>
    </>
  )
}

function MerchantInner() {
  const { store, loading, reload } = useMyStore()
  const { data: pendingCount } = useLiveQuery<number>(
    `m-pending-${store?.id}`,
    async () => (store ? (await sb().from('orders').select('id', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'pending')).count ?? 0 : 0),
    store ? [{ table: 'orders', filter: `store_id=eq.${store.id}` }] : [],
    0,
  )
  const tabs = [
    { to: '/marchand', label: 'Commandes', icon: ClipboardList, badge: pendingCount },
    { to: '/marchand/catalogue', label: 'Catalogue', icon: Package },
    { to: '/marchand/boutique', label: 'Boutique', icon: StoreIcon },
    { to: '/marchand/finances', label: 'Finances', icon: Wallet },
  ]
  return (
    <StaffShell app={APP} tabs={tabs}>
      {loading ? null : !store ? (
        <Empty emoji="🏪" title="Aucune boutique liée à ce compte" text="Contactez l’équipe NEAM pour rattacher votre boutique." />
      ) : (
        <Routes>
          <Route index element={<MerchantOrders store={store} reloadStore={reload} />} />
          <Route path="catalogue" element={<MerchantCatalog store={store} />} />
          <Route path="boutique" element={<MerchantStore key={store.id + store.prep_minutes} store={store} reload={reload} />} />
          <Route path="finances" element={<MerchantFinances store={store} />} />
        </Routes>
      )}
    </StaffShell>
  )
}

export default function MerchantApp() {
  return (
    <StaffGate app={APP}>
      <MerchantInner />
    </StaffGate>
  )
}

