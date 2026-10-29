import { useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import { Banknote, Bike, CheckCircle2, History, MapPin, Navigation, Package, Phone, Power, Store } from 'lucide-react'
import { formatPhone, money, timeAgo } from '../lib/format'
import { useAuth } from '../live/auth'
import { watchPosition } from '../live/geo'
import { beep, useLiveQuery } from '../live/realtime'
import { errMsg, ORDER_SELECT, sb, type LiveOrder } from '../live/supabase'
import { StatusPill } from '../live/ClientOrders'
import { useApp } from '../store/AppContext'
import { Card, Empty, PageTitle, STAFF_APPS, StaffGate, StaffShell } from './staff'

const APP = STAFF_APPS.courier
type Courier = { id: string; is_online: boolean; vehicle: string; plate: string; location_at: string | null }

const mapsLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Libreville, Gabon`)}`

/** Partage la position toutes les ~20 s tant que le livreur est en ligne. */
function useLocationSharing(online: boolean) {
  const [error, setError] = useState('')
  const last = useRef(0)
  useEffect(() => {
    if (!online) return
    let stop = () => {}
    let alive = true
    watchPosition(
      (p) => {
        setError('')
        if (Date.now() - last.current < 20_000) return
        last.current = Date.now()
        sb().rpc('courier_update_location', { p_lat: p.lat, p_lng: p.lng }).then(() => {})
      },
      setError,
    ).then((s) => (alive ? (stop = s) : s()))
    return () => {
      alive = false
      stop()
    }
  }, [online])
  return error
}

function useCourierData() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useLiveQuery(
    `courier-${uid}`,
    async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [{ data: me }, { data: orders }, { data: cash }] = await Promise.all([
        sb().from('couriers').select('*').eq('id', uid!).maybeSingle(),
        sb().from('orders').select(ORDER_SELECT).eq('courier_id', uid!).or(`status.in.(assigned,picked_up),delivered_at.gte.${today.toISOString()}`).order('assigned_at', { ascending: true }),
        sb().rpc('courier_cash_due', { p_courier: uid }),
      ])
      return { me: me as Courier | null, orders: (orders ?? []) as LiveOrder[], cash: (cash as number) ?? 0 }
    },
    uid ? [{ table: 'orders', filter: `courier_id=eq.${uid}` }, { table: 'couriers', filter: `id=eq.${uid}` }] : [],
    { me: null as Courier | null, orders: [] as LiveOrder[], cash: 0 },
  )
}

function OnlineSwitch({ me, reload }: { me: Courier; reload: () => void }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    setBusy(true)
    const { error } = await sb().rpc('courier_set_online', { p_online: !me.is_online })
    setBusy(false)
    if (error) return toast(errMsg(error))
    toast(me.is_online ? 'Vous êtes hors ligne' : 'Vous êtes en ligne : les courses peuvent vous être affectées')
    reload()
  }
  return (
    <button disabled={busy} onClick={toggle} className={`flex w-full items-center gap-4 rounded-3xl p-5 text-left text-white shadow-lg transition active:scale-[0.99] ${me.is_online ? '' : 'bg-neutral-800'}`} style={me.is_online ? { background: APP.gradient } : undefined}>
      <span className={`grid h-14 w-14 place-items-center rounded-full ${me.is_online ? 'bg-white/20' : 'bg-white/10'}`}><Power size={26} /></span>
      <span className="flex-1">
        <span className="block text-xl font-extrabold">{me.is_online ? 'En ligne' : 'Hors ligne'}</span>
        <span className="block text-sm text-white/80">{me.is_online ? 'Position partagée · touchez pour faire une pause' : 'Touchez pour commencer votre service'}</span>
      </span>
    </button>
  )
}

function CourseCard({ o }: { o: LiveOrder }) {
  const first = o.status === 'assigned'
  return (
    <Link to={`/livreur/course/${o.id}`} className="block">
      <Card className={first ? 'ring-2 ring-neam-400' : ''}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">#{o.code} · {o.kind === 'market' ? 'NEAM Market' : 'NEAM Express'}</p>
          <StatusPill status={o.status} />
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex gap-2"><Store size={16} className="mt-0.5 shrink-0 text-orange-500" /> <span><b>Récupérer :</b> {o.kind === 'market' ? `${o.stores?.name} — ${o.stores?.address || o.stores?.district}` : o.pickup_address}</span></p>
          <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-red-500" /> <span><b>Livrer :</b> {o.address}</span></p>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-2 text-sm">
          <span className="text-neutral-500">À encaisser</span>
          <span className="text-lg font-extrabold">{money(o.total)}</span>
        </div>
      </Card>
    </Link>
  )
}

function CourierHome() {
  const { data, loading, reload } = useCourierData()
  const active = data.orders.filter((o) => o.status === 'assigned' || o.status === 'picked_up')
  const doneToday = data.orders.filter((o) => o.status === 'delivered')
  const prev = useRef(-1)
  useEffect(() => {
    if (prev.current >= 0 && active.length > prev.current) beep()
    prev.current = active.length
  }, [active.length])

  if (loading) return null
  if (!data.me) return <Empty emoji="🛵" title="Compte livreur introuvable" text="Contactez l’équipe NEAM." />
  return (
    <>
      <PageTitle title="Mes courses" subtitle={`${data.me.vehicle}${data.me.plate ? ` · ${data.me.plate}` : ''}`} />
      <div className="space-y-4 px-4 lg:px-8">
        <OnlineSwitch me={data.me} reload={reload} />
        <div className="grid grid-cols-3 gap-2 text-center">
          <Card className="p-3"><p className="text-2xl font-extrabold">{active.length}</p><p className="text-[11px] text-neutral-500">en cours</p></Card>
          <Card className="p-3"><p className="text-2xl font-extrabold">{doneToday.length}</p><p className="text-[11px] text-neutral-500">livrées aujourd’hui</p></Card>
          <Card className="p-3"><p className="text-lg font-extrabold tabular-nums">{money(data.cash)}</p><p className="text-[11px] text-neutral-500">espèces à reverser</p></Card>
        </div>
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Courses affectées</h2>
          <div className="space-y-3">
            {active.map((o) => <CourseCard key={o.id} o={o} />)}
            {!active.length && <Empty emoji={data.me.is_online ? '⏳' : '😴'} title={data.me.is_online ? 'En attente d’une course' : 'Vous êtes hors ligne'} text={data.me.is_online ? 'Le dispatch NEAM vous affectera la prochaine course. Gardez l’application ouverte.' : 'Passez en ligne pour recevoir des courses.'} />}
          </div>
        </section>
      </div>
    </>
  )
}

function CourseDetail() {
  const { id = '' } = useParams()
  const { toast } = useApp()
  const { data, reload } = useCourierData()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const o = data.orders.find((x) => x.id === id)
  if (!o) return <Empty emoji="📦" title="Course introuvable" text="Elle a peut-être été réaffectée par le dispatch." />

  const act = async (action: 'pickup' | 'deliver') => {
    setBusy(true)
    setError('')
    const { data: res, error } = await sb().rpc('courier_update_order', { p_order: o.id, p_action: action, p_code: action === 'deliver' ? code : null })
    setBusy(false)
    if (error) return setError(errMsg(error))
    // Code faux : le serveur compte l'essai (5 maximum) et renvoie une commande vide
    if (action === 'deliver' && !(res as { id?: string } | null)?.id) return setError('Code de remise incorrect. Après 5 essais, la remise est bloquée.')
    toast(action === 'pickup' ? 'Récupération confirmée · en route vers le client' : `Livraison validée · ${money(o.total)} encaissés`)
    reload()
  }
  const pickup = o.kind === 'market' ? `${o.stores?.name ?? ''} — ${o.stores?.address || o.stores?.district || ''}` : o.pickup_address ?? ''
  const notReady = o.kind === 'market' && !o.ready_at
  return (
    <>
      <PageTitle title={`Course #${o.code}`} subtitle={o.kind === 'market' ? 'NEAM Market' : `NEAM Express · ${o.parcel?.size === 'doc' ? 'Document' : 'Colis'}`} action={<StatusPill status={o.status} />} />
      <div className="space-y-3 px-4 lg:px-8">
        <Card className={o.status === 'assigned' ? 'ring-2 ring-orange-300' : 'opacity-70'}>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">1 · Récupérer</p>
          <p className="mt-1 font-semibold">{pickup}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={mapsLink(o.kind === 'market' ? o.stores?.address || o.stores?.district || '' : o.pickup_address ?? '')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-sm font-medium"><Navigation size={15} /> Itinéraire</a>
            {o.kind === 'market' && o.stores?.phone && <a href={`tel:${o.stores.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-sm font-medium"><Phone size={15} /> {formatPhone(o.stores.phone)}</a>}
          </div>
          {o.kind === 'market' && (
            <ul className="mt-3 space-y-1 border-t border-dashed border-neutral-200 pt-3 text-sm">
              {o.order_items?.map((l) => <li key={l.id}>{l.emoji} <b>{l.qty}×</b> {l.name}</li>)}
            </ul>
          )}
          {o.status === 'assigned' && (
            <button disabled={busy || notReady} onClick={() => act('pickup')} className="mt-4 w-full rounded-2xl bg-orange-500 py-3.5 font-semibold text-white disabled:opacity-50">
              {notReady ? 'En préparation à la boutique…' : 'J’ai récupéré la commande'}
            </button>
          )}
        </Card>

        <Card className={o.status === 'picked_up' ? 'ring-2 ring-neam-400' : ''}>
          <p className="text-xs font-bold uppercase tracking-wide text-neam-700">2 · Livrer</p>
          <p className="mt-1 font-semibold">{o.address}</p>
          <p className="text-sm text-neutral-600">{o.contact_name || 'Client'} · <span className="select-all">{formatPhone(o.contact_phone)}</span></p>
          {o.note && <p className="mt-2 rounded-xl bg-amber-50 p-2 text-sm text-amber-900">📝 {o.note}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={mapsLink(o.address)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-sm font-medium"><Navigation size={15} /> Itinéraire</a>
            <a href={`tel:${o.contact_phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-sm font-medium"><Phone size={15} /> Appeler</a>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-neam-50 px-4 py-3">
            <span className="text-sm font-medium text-neam-900"><Banknote size={16} className="mr-1 inline" /> À encaisser en espèces</span>
            <span className="text-xl font-extrabold text-neam-900">{money(o.total)}</span>
          </div>
          {o.status === 'picked_up' && (
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-neutral-600" htmlFor="dl-code">Code de remise donné par le client</label>
              <input id="dl-code" inputMode="numeric" maxLength={4} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }} placeholder="••••" className="h-14 w-full rounded-2xl border border-neutral-200 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-neam-500" />
              <button disabled={busy || code.length !== 4} onClick={() => act('deliver')} className="w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-50" style={{ background: APP.accent }}>
                Valider la livraison · {money(o.total)} encaissés
              </button>
            </div>
          )}
          {o.status === 'delivered' && <p className="mt-3 flex items-center gap-2 font-semibold text-neam-700"><CheckCircle2 size={18} /> Livrée {o.delivered_at ? timeAgo(new Date(o.delivered_at).getTime()) : ''}</p>}
        </Card>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
        <Link to="/livreur" className="block py-2 text-center text-sm font-medium text-neutral-500">← Toutes mes courses</Link>
      </div>
    </>
  )
}

function CourierHistory() {
  const { session } = useAuth()
  const { data } = useLiveQuery(
    `courier-hist-${session?.user.id}`,
    async () => {
      const [{ data: orders }, { data: rem }] = await Promise.all([
        sb().from('orders').select('id, code, kind, total, delivered_at, address').eq('courier_id', session!.user.id).eq('status', 'delivered').order('delivered_at', { ascending: false }).limit(100),
        sb().from('cash_remittances').select('id, amount, created_at, note').eq('courier_id', session!.user.id).order('created_at', { ascending: false }).limit(50),
      ])
      return { orders: (orders ?? []) as { id: string; code: string; kind: string; total: number; delivered_at: string; address: string }[], rem: (rem ?? []) as { id: string; amount: number; created_at: string; note: string | null }[] }
    },
    [],
    { orders: [], rem: [] },
  )
  return (
    <>
      <PageTitle title="Historique" subtitle="Livraisons et espèces reversées" />
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-8">
        <Card className="p-0!">
          <p className="px-4 pt-4 text-sm font-semibold">Livraisons</p>
          <div className="divide-y divide-neutral-100">
            {data.orders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                {o.kind === 'market' ? <Package size={16} className="text-orange-500" /> : <Bike size={16} className="text-neam-600" />}
                <span className="flex-1 truncate">#{o.code} · {o.address}</span>
                <span className="text-xs text-neutral-400">{new Date(o.delivered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                <span className="w-20 text-right font-semibold">{money(o.total)}</span>
              </div>
            ))}
            {!data.orders.length && <p className="px-4 py-6 text-center text-sm text-neutral-400">Aucune livraison</p>}
          </div>
        </Card>
        <Card className="p-0!">
          <p className="px-4 pt-4 text-sm font-semibold">Espèces remises à NEAM</p>
          <div className="divide-y divide-neutral-100">
            {data.rem.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}{r.note ? ` · ${r.note}` : ''}</span>
                <span className="font-semibold">{money(r.amount)}</span>
              </div>
            ))}
            {!data.rem.length && <p className="px-4 py-6 text-center text-sm text-neutral-400">Aucune remise</p>}
          </div>
        </Card>
      </div>
    </>
  )
}

/** Toujours monté pendant le service : partage la position quelle que soit la page ouverte. */
function LocationSharer() {
  const { data } = useCourierData()
  const error = useLocationSharing(!!data.me?.is_online)
  if (!error || !data.me?.is_online) return null
  return <p className="mx-4 mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-800 lg:mx-8">📍 {error}</p>
}

export default function CourierApp() {
  return (
    <StaffGate app={APP}>
      <StaffShell app={APP} tabs={[{ to: '/livreur', label: 'Courses', icon: Bike }, { to: '/livreur/historique', label: 'Historique', icon: History }]}>
        <LocationSharer />
        <Routes>
          <Route index element={<CourierHome />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="historique" element={<CourierHistory />} />
        </Routes>
      </StaffShell>
    </StaffGate>
  )
}
