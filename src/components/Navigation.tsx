import type { ReactNode } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Heart, Home, MapPin, Package, ScanLine, Search, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { NeamLogo } from './Logo'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'

const tabs = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/commandes', label: 'Commandes', icon: ShoppingBag },
  { to: '/scanner', label: 'Scanner', icon: ScanLine, center: true },
  { to: '/favoris', label: 'Favoris', icon: Heart },
  { to: '/profil', label: 'Profil', icon: User },
]

export function BottomNav() {
  const { pathname } = useLocation()
  if (['/scanner', '/panier', '/checkout', '/service/'].some((p) => pathname.startsWith(p))) return null
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label="Navigation principale">
      <div className="mx-auto max-w-xl rounded-t-[26px] border-t border-neutral-100 bg-white/95 pb-safe shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <ul className="grid h-[68px] grid-cols-5 items-end pb-2">
          {tabs.map(({ to, label, icon: Icon, center }) => (
            <li key={to} className="flex justify-center">
              <NavLink
                to={to}
                end={to === '/'}
                onClick={tap}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[11px] font-medium transition ${isActive ? 'text-neam-600' : 'text-neutral-500'}`
                }
              >
                {({ isActive }) =>
                  center ? (
                    <>
                      <span className="-mt-9 grid h-[62px] w-[62px] place-items-center rounded-full bg-gradient-to-b from-neam-500 to-neam-700 text-white shadow-[0_10px_24px_-6px_rgba(7,155,90,0.65)] ring-[5px] ring-white transition active:scale-95">
                        <Icon size={28} strokeWidth={2.2} />
                      </span>
                      <span className="text-neutral-600">{label}</span>
                    </>
                  ) : (
                    <>
                      <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} fill={isActive && to === '/' ? 'currentColor' : 'none'} />
                      {label}
                    </>
                  )
                }
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

/** Bouton panier flottant (mobile) */
export function CartFab() {
  const { cartCount, cartTotal } = useApp()
  const { pathname } = useLocation()
  if (!cartCount || ['/panier', '/checkout', '/scanner'].some((p) => pathname.startsWith(p))) return null
  return (
    <Link
      to="/panier"
      onClick={tap}
      className="fixed bottom-[calc(84px+var(--safe-bottom))] right-4 z-40 flex animate-pop items-center gap-3 rounded-full bg-neam-950 py-2 pl-2 pr-4 text-white shadow-[0_12px_30px_-8px_rgba(4,36,27,0.7)] ring-1 ring-neam-400/40 lg:hidden"
    >
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-neam-500">
        <ShoppingCart size={20} />
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-neam-700">{cartCount}</span>
      </span>
      <span className="text-sm font-semibold">{fcfa(cartTotal)}</span>
    </Link>
  )
}

export function TopNav() {
  const { city, cartCount, notifications } = useApp()
  const navigate = useNavigate()
  const unread = notifications.some((n) => !n.read)
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
  return (
    <header className="sticky top-0 z-40 hidden h-[72px] border-b border-white/10 bg-neam-950/80 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-full max-w-[1240px] items-center gap-4 px-6">
        <Link to="/" aria-label="Accueil NEAM" className="shrink-0">
          <NeamLogo size="sm" tagline={false} />
        </Link>
        <button onClick={() => navigate('/?ville=1')} className="glass flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm text-white">
          <MapPin size={16} className="text-neam-400" /> {city}, Gabon <ChevronDown size={16} />
        </button>
        <button onClick={() => navigate('/recherche')} className="flex h-10 min-w-[200px] flex-1 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-white px-4 text-left text-sm text-neutral-400">
          <Search size={18} className="text-neutral-700" /> Rechercher un produit, un service…
        </button>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end aria-label="Accueil" className={link}><Home size={17} /> <span className="hidden xl:inline">Accueil</span></NavLink>
          <NavLink to="/commandes" aria-label="Commandes" className={link}><Package size={17} /> <span className="hidden xl:inline">Commandes</span></NavLink>
          <NavLink to="/scanner" aria-label="Scanner" className={link}><ScanLine size={17} /> <span className="hidden xl:inline">Scanner</span></NavLink>
          <NavLink to="/favoris" aria-label="Favoris" className={link}><Heart size={17} /> <span className="hidden xl:inline">Favoris</span></NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10">
            <Bell size={21} />
            {unread && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-neam-950" />}
          </Link>
          <Link to="/panier" aria-label="Panier" className="relative grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10">
            <ShoppingCart size={21} />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-neam-500 px-1 text-[11px] font-bold">{cartCount}</span>}
          </Link>
          <Link to="/profil" aria-label="Profil" className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-neam-400 to-neam-700 text-white">
            <User size={19} />
          </Link>
        </div>
      </div>
    </header>
  )
}

/** Conteneur standard des pages secondaires (carte blanche sur desktop). */
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen animate-fade-up bg-[#f4f7f5] pb-28 lg:mx-auto lg:my-6 lg:min-h-[calc(100vh-120px)] lg:max-w-3xl lg:overflow-clip lg:rounded-[28px] lg:pb-8 lg:shadow-2xl ${className}`}>
      {children}
    </div>
  )
}
