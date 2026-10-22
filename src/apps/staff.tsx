import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Clock, Loader2, LogOut, Send, XCircle, type LucideIcon } from 'lucide-react'
import { NeamMark, NeamWordmark } from '../components/Logo'
import { formatPhone } from '../lib/format'
import { useAuth } from '../live/auth'
import { PhoneLogin } from '../live/PhoneLogin'
import { useLiveQuery } from '../live/realtime'
import { errMsg, LIVE, sb, type Role } from '../live/supabase'
import { CITIES } from '../data/services'

export type StaffApp = { role: Exclude<Role, 'client'>; title: string; accent: string; gradient: string; tagline: string }

export const STAFF_APPS: Record<'merchant' | 'courier' | 'admin', StaffApp> = {
  merchant: { role: 'merchant', title: 'NEAM Partenaire', accent: '#f06400', gradient: 'linear-gradient(145deg,#ffa21a,#ff6a00)', tagline: 'Gérez votre boutique NEAM Market' },
  courier: { role: 'courier', title: 'NEAM Livreur', accent: '#079b5a', gradient: 'linear-gradient(145deg,#2fe08d,#089b5a)', tagline: 'Vos courses NEAM Express et Market' },
  admin: { role: 'admin', title: 'NEAM Admin', accent: '#04241b', gradient: 'linear-gradient(145deg,#0d7a4f,#04241b)', tagline: 'Pilotage de la plateforme' },
}

function Centered({ app, children }: { app: StaffApp; children: ReactNode }) {
  return (
    <div className="bg-neam-hero flex min-h-screen items-center justify-center px-4 py-10 pt-[calc(var(--safe-top)+40px)]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <NeamMark className="h-10" />
          <div>
            <NeamWordmark className="text-3xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neam-300">{app.title.replace('NEAM ', '')}</p>
          </div>
        </div>
        <div className="rounded-[28px] bg-white p-6 shadow-2xl">{children}</div>
      </div>
    </div>
  )
}

type Application = { id: string; status: 'pending' | 'approved' | 'rejected'; admin_note: string | null; created_at: string }

function ApplicationFlow({ app }: { app: StaffApp }) {
  const { session, refresh, signOut } = useAuth()
  const kind = app.role as 'merchant' | 'courier'
  const { data: apps, loading, reload } = useLiveQuery<Application[]>(
    `apps-${session?.user.id}-${kind}`,
    async () => (await sb().from('staff_applications').select('id, status, admin_note, created_at').eq('user_id', session!.user.id).eq('kind', kind).order('created_at', { ascending: false })).data ?? [],
    [{ table: 'staff_applications', filter: `user_id=eq.${session?.user.id}` }],
    [],
  )
  const [f, setF] = useState({ full_name: '', store_name: '', district: '', address: '', vehicle: 'Moto', plate: '', id_number: '', city: 'Libreville' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const last = apps[0]
  // Validée pendant que la page était ouverte : on recharge le rôle
  useEffect(() => {
    if (last?.status === 'approved') refresh()
    // refresh change à chaque rendu du fournisseur : on ne dépend que du statut
  }, [last?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loader2 className="mx-auto animate-spin text-neutral-400" />
  if (last?.status === 'approved') return <p className="text-center text-sm">Compte validé, ouverture…</p>
  if (last?.status === 'pending')
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600"><Clock size={30} /></span>
        <h2 className="mt-4 text-xl font-bold">Candidature en cours d’examen</h2>
        <p className="mt-2 text-sm text-neutral-600">L’équipe NEAM vérifie vos informations. Cette page s’ouvrira automatiquement dès la validation.</p>
        <button onClick={signOut} className="mt-6 text-sm font-medium text-neutral-500">Se déconnecter</button>
      </div>
    )

  const submit = async () => {
    if (f.full_name.trim().length < 3) return setError('Indiquez votre nom complet.')
    if (kind === 'merchant' && f.store_name.trim().length < 2) return setError('Indiquez le nom de votre boutique.')
    setBusy(true)
    const details = kind === 'merchant' ? { store_name: f.store_name, district: f.district, address: f.address, city: f.city } : { vehicle: f.vehicle, plate: f.plate, id_number: f.id_number, city: f.city }
    const { error } = await sb().rpc('submit_application', { p_kind: kind, p_full_name: f.full_name, p_phone: '+' + (session?.user.phone ?? ''), p_details: details })
    setBusy(false)
    if (error) return setError(errMsg(error))
    reload()
  }
  const field = 'h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400'
  return (
    <div>
      {last?.status === 'rejected' && (
        <p className="mb-4 flex gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700"><XCircle size={18} className="shrink-0" /> Candidature précédente refusée{last.admin_note ? ` : ${last.admin_note}` : ''}. Vous pouvez en envoyer une nouvelle.</p>
      )}
      <h2 className="text-xl font-bold">{kind === 'merchant' ? 'Devenir partenaire NEAM Market' : 'Rejoindre l’équipe des livreurs NEAM'}</h2>
      <p className="mt-1 text-sm text-neutral-500">Envoyez votre candidature, l’équipe NEAM la valide sous 48 h.</p>
      <div className="mt-4 space-y-2">
        <input id="ap-name" className={field} placeholder="Nom et prénom" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        {kind === 'merchant' ? (
          <>
            <input id="ap-store" className={field} placeholder="Nom de la boutique" value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input id="ap-district" className={field} placeholder="Quartier" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} />
              <select id="ap-city" className={field} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.slice(0, 3).map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <input id="ap-address" className={field} placeholder="Adresse, point de repère" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <select id="ap-vehicle" className={field} value={f.vehicle} onChange={(e) => setF({ ...f, vehicle: e.target.value })}>{['Moto', 'Voiture', 'Vélo', 'À pied'].map((v) => <option key={v}>{v}</option>)}</select>
              <input id="ap-plate" className={field} placeholder="Immatriculation" value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} />
            </div>
            <input id="ap-idn" className={field} placeholder="N° de pièce d’identité" value={f.id_number} onChange={(e) => setF({ ...f, id_number: e.target.value })} />
          </>
        )}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
      <button disabled={busy} onClick={submit} className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white disabled:opacity-70" style={{ background: app.accent }}>
        {busy ? <Loader2 className="animate-spin" size={18} /> : <><Send size={17} /> Envoyer ma candidature</>}
      </button>
      <button onClick={signOut} className="mt-3 w-full py-2 text-sm font-medium text-neutral-500">Se déconnecter</button>
    </div>
  )
}

/** Accès réservé : connexion + rôle attendu, sinon candidature (marchand, livreur) ou refus (admin). */
export function StaffGate({ app, children }: { app: StaffApp; children: ReactNode }) {
  const { ready, session, profile, signOut } = useAuth()
  if (!LIVE)
    return (
      <Centered app={app}>
        <h2 className="text-xl font-bold">Configuration requise</h2>
        <p className="mt-2 text-sm text-neutral-600">Cet espace fonctionne avec le serveur NEAM (Supabase). Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY puis reconstruisez l’application.</p>
      </Centered>
    )
  if (!ready || (session && !profile)) return <Centered app={app}><Loader2 className="mx-auto animate-spin text-neutral-400" /></Centered>
  if (!session) return <Centered app={app}><PhoneLogin accent={app.accent} title={app.title} subtitle={`${app.tagline}. Connectez-vous avec votre numéro.`} /></Centered>
  if (profile && !profile.is_active)
    return <Centered app={app}><h2 className="text-xl font-bold">Compte suspendu</h2><p className="mt-2 text-sm text-neutral-600">Contactez l’équipe NEAM.</p><button onClick={signOut} className="mt-4 text-sm font-medium text-neutral-500">Se déconnecter</button></Centered>
  if (profile?.role === app.role || (profile?.role === 'admin' && app.role !== 'courier')) return <>{children}</>
  if (app.role === 'admin')
    return <Centered app={app}><h2 className="text-xl font-bold">Accès réservé</h2><p className="mt-2 text-sm text-neutral-600">Ce compte n’a pas les droits d’administration.</p><button onClick={signOut} className="mt-4 text-sm font-medium text-neutral-500">Se déconnecter</button></Centered>
  return <Centered app={app}><ApplicationFlow app={app} /></Centered>
}

export type StaffTab = { to: string; label: string; icon: LucideIcon; badge?: number }

/** Mise en page des espaces pro : barre latérale (desktop) / onglets en bas (mobile). */
export function StaffShell({ app, tabs, children, right }: { app: StaffApp; tabs: StaffTab[]; children: ReactNode; right?: ReactNode }) {
  const { profile, signOut } = useAuth()
  const link = (desktop: boolean) => ({ isActive }: { isActive: boolean }) =>
    desktop
      ? `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
      : `relative flex flex-col items-center gap-1 text-[10.5px] font-medium ${isActive ? '' : 'text-neutral-500'}`
  return (
    <div className="min-h-screen bg-[#f4f6f5] lg:flex">
      <aside className="bg-neam-dark sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 text-white lg:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <NeamMark className="h-8" />
          <div>
            <NeamWordmark className="text-xl" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neam-300">{app.title.replace('NEAM ', '')}</p>
          </div>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end className={link(true)}>
              <t.icon size={18} /> <span className="flex-1">{t.label}</span>
              {!!t.badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold">{t.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl bg-white/5 p-3 text-sm">
          <p className="truncate font-semibold">{profile?.full_name || 'Mon compte'}</p>
          <p className="truncate text-xs text-white/60">{formatPhone(profile?.phone)}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-1.5 text-xs text-white/70 hover:text-white"><LogOut size={14} /> Se déconnecter</button>
        </div>
      </aside>

      <div className={`min-w-0 flex-1 lg:pb-8 ${tabs.length > 5 ? 'pb-8' : 'pb-24'}`}>
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-[calc(var(--safe-top)+12px)] text-white lg:hidden" style={{ background: app.gradient }}>
          <NeamMark mono className="h-7" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">{app.title}</p>
            <p className="truncate text-sm font-semibold">{profile?.full_name || 'Mon compte'}</p>
          </div>
          {right}
          <button onClick={signOut} aria-label="Se déconnecter" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><LogOut size={18} /></button>
        </header>
        {tabs.length > 5 && (
          <nav className="no-scrollbar sticky top-[calc(var(--safe-top)+64px)] z-20 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 lg:hidden" aria-label="Sections">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-neam-950 text-white' : 'text-neutral-600'}`}>
                <t.icon size={15} /> {t.label}
                {!!t.badge && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{t.badge}</span>}
              </NavLink>
            ))}
          </nav>
        )}
        {right && <div className="hidden justify-end px-8 pt-6 lg:flex">{right}</div>}
        <main className="mx-auto max-w-6xl">{children}</main>
      </div>

      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-safe backdrop-blur lg:hidden ${tabs.length > 5 ? 'hidden' : ''}`}>
        <div className="grid h-16 items-center" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end className={link(false)} style={({ isActive }) => (isActive ? { color: app.accent } : undefined)}>
              <span className="relative">
                <t.icon size={22} />
                {!!t.badge && <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{t.badge}</span>}
              </span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-5 lg:px-8 lg:pt-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${className}`}>{children}</div>
}

export function Empty({ emoji, title, text }: { emoji: string; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="text-5xl">{emoji}</div>
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-neutral-500">{text}</p>}
    </div>
  )
}
