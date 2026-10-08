import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Bike, ChevronRight, CreditCard, Globe, Handshake, HelpCircle, Info, MapPin, Pencil, Plus, QrCode, Send, ShieldCheck, Store } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { NeamMark } from '../components/Logo'
import { PageShell } from '../components/Navigation'
import { Sheet } from '../components/Sheet'

export default function Profile() {
  const { userName, setUserName, wallet, orders, favorites, city, toast } = useApp()
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(userName)

  const soon = () => toast('Bientôt disponible sur NEAM')

  const menu = [
    { icon: MapPin, label: 'Mes adresses', hint: city },
    { icon: CreditCard, label: 'Moyens de paiement', hint: 'Airtel, Moov, carte' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: Globe, label: 'Langue', hint: 'Français' },
    { icon: ShieldCheck, label: 'Sécurité et confidentialité' },
    { icon: HelpCircle, label: 'Aide et support', hint: '7j/7' },
    { icon: Info, label: 'À propos de NEAM', hint: 'v1.0.0' },
  ]

  return (
    <PageShell>
      <header className="bg-neam-hero relative overflow-hidden px-5 pb-24 pt-[calc(var(--safe-top)+20px)] text-white">
        <NeamMark className="absolute -right-10 -top-6 h-48 opacity-10" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-neam-300 to-neam-700 text-2xl font-bold ring-4 ring-white/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{userName}</h1>
            <p className="text-sm text-white/70">{city}, Gabon · Membre NEAM</p>
          </div>
          <button onClick={() => setEdit(true)} aria-label="Modifier le profil" className="glass grid h-10 w-10 place-items-center rounded-full"><Pencil size={17} /></button>
        </div>
      </header>

      <div className="relative -mt-16 space-y-4 px-4">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-neam-500 via-neam-600 to-neam-800 p-5 text-white shadow-[0_20px_40px_-15px_rgba(7,122,73,0.7)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold"><NeamMark mono className="h-5" /> NEAM Pay</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium">Sécurisé</span>
          </div>
          <p className="mt-4 text-xs text-white/75">Solde disponible</p>
          <p className="text-3xl font-extrabold tracking-tight">{fcfa(wallet)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: Plus, label: 'Recharger' },
              { icon: Send, label: 'Envoyer' },
              { icon: QrCode, label: 'Payer', to: '/scanner' },
            ].map(({ icon: Icon, label, to }) =>
              to ? (
                <Link key={label} to={to} className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-2.5 text-xs font-medium backdrop-blur hover:bg-white/25"><Icon size={18} />{label}</Link>
              ) : (
                <button key={label} onClick={soon} className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-2.5 text-xs font-medium backdrop-blur hover:bg-white/25"><Icon size={18} />{label}</button>
              ),
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: orders.length, l: 'Commandes', to: '/commandes' },
            { n: favorites.length, l: 'Favoris', to: '/favoris' },
            { n: 9, l: 'Services', to: '/services' },
          ].map((s) => (
            <Link key={s.l} to={s.to} className="rounded-2xl bg-white py-3 shadow-sm ring-1 ring-black/5">
              <p className="text-xl font-extrabold text-neam-700">{s.n}</p>
              <p className="text-xs text-neutral-500">{s.l}</p>
            </Link>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          {menu.map(({ icon: Icon, label, hint, to }) => {
            const inner = (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-neam-50 text-neam-700"><Icon size={19} /></span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                {hint && <span className="text-xs text-neutral-400">{hint}</span>}
                <ChevronRight size={17} className="text-neutral-300" />
              </>
            )
            const cls = 'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left last:border-0 hover:bg-neutral-50'
            return to ? <Link key={label} to={to} className={cls}>{inner}</Link> : <button key={label} onClick={soon} className={cls}>{inner}</button>
          })}
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button onClick={soon} className="rounded-3xl bg-neam-950 p-4 text-left text-white">
            <Bike className="text-neam-400" />
            <p className="mt-2 text-sm font-semibold">Devenir coursier</p>
            <p className="text-xs text-white/60">Gagnez avec NEAM Express</p>
          </button>
          <button onClick={soon} className="rounded-3xl bg-white p-4 text-left ring-1 ring-black/5">
            <Store className="text-neam-600" />
            <p className="mt-2 text-sm font-semibold">Devenir partenaire</p>
            <p className="text-xs text-neutral-500">Vendez sur NEAM</p>
          </button>
        </section>
        <p className="flex items-center justify-center gap-1.5 pb-4 text-xs text-neutral-400"><Handshake size={14} /> NEAM — Plus proche de votre quotidien.</p>
      </div>

      <Sheet open={edit} onClose={() => setEdit(false)} title="Modifier le profil">
        <label className="block text-sm font-medium text-neutral-600">
          Nom complet
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-neutral-200 px-4 text-base outline-none focus:border-neam-500" />
        </label>
        <button
          onClick={() => {
            if (name.trim()) setUserName(name.trim())
            setEdit(false)
            toast('Profil mis à jour')
          }}
          className="mt-4 w-full rounded-2xl bg-neam-600 py-3.5 font-semibold text-white"
        >
          Enregistrer
        </button>
      </Sheet>
    </PageShell>
  )
}
