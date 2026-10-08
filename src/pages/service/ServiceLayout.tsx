import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronLeft, MapPin, ScanLine, Search, ShoppingCart } from 'lucide-react'
import { logoOf, type NavItem, type Service } from '../../data/services'
import { useApp } from '../../store/AppContext'
import { Icon } from '../../lib/icons'
import { NeamMark } from '../../components/Logo'
import { ServiceWordmark } from '../../components/ServiceTile'
import { tap } from '../../lib/native'
import { useBack } from '../../lib/useBack'

export const hrefOf = (service: Service, to: string) => (to.startsWith('/') ? to : `/service/${service.id}${to ? `/${to}` : ''}`)

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  if (item.icon === 'neam') return <NeamMark className={`h-6 ${active ? '' : 'opacity-80 grayscale-[30%]'}`} />
  return <Icon name={item.icon} size={23} strokeWidth={active ? 2.4 : 1.8} />
}

/** Barre de navigation propre au service (bas sur mobile, onglets sur desktop). */
export function ServiceNav({ service }: { service: Service }) {
  const { cartCount } = useApp()
  const items = service.nav
  const renderItem = (item: NavItem, desktop: boolean) => (
    <NavLink
      key={item.label}
      to={hrefOf(service, item.to)}
      end={item.to === ''}
      onClick={tap}
      className={({ isActive }) =>
        desktop
          ? `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive && item.to !== '/' ? 'text-white shadow' : 'text-neutral-600 hover:bg-neutral-100'}`
          : `relative flex flex-col items-center gap-1 text-[10.5px] font-medium ${isActive && item.to !== '/' ? '' : 'text-neutral-500'}`
      }
      style={({ isActive }) => (isActive && item.to !== '/' ? (desktop ? { background: service.gradient } : { color: service.color }) : undefined)}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            {desktop && item.icon !== 'neam' ? <Icon name={item.icon} size={17} /> : desktop ? <NeamMark className="h-4" /> : <NavIcon item={item} active={isActive && item.to !== '/'} />}
            {item.to === '/panier' && cartCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{cartCount}</span>
            )}
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label={`Navigation ${service.name}`}>
        <div className="mx-auto max-w-xl rounded-t-[24px] border-t border-neutral-100 bg-white/95 pb-safe shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="grid h-[66px] grid-cols-5 items-center">{items.map((i) => renderItem(i, false))}</div>
        </div>
      </nav>
      <nav className="sticky top-[72px] z-30 hidden gap-1 overflow-x-auto border-b border-neutral-100 bg-white/90 px-4 py-2 backdrop-blur lg:flex" aria-label={`Onglets ${service.name}`}>
        {items.map((i) => renderItem(i, true))}
      </nav>
    </>
  )
}

/** En-tête « app » du service : logo, cloche, panier, ville et recherche. */
export function ServiceHeader({ service, search = true, location = search }: { service: Service; search?: boolean; location?: boolean }) {
  const { city, cartCount, notifications } = useApp()
  const navigate = useNavigate()
  const unread = notifications.some((n) => !n.read)
  return (
    <header className="bg-white px-4 pb-3 pt-safe lg:pt-4">
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/')} aria-label="Retour à NEAM" className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 lg:hidden">
            <ChevronLeft size={22} />
          </button>
          <ServiceWordmark service={service} />
        </div>
        <div className="flex items-center gap-1">
          <Link to="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100">
            <Bell size={22} />
            {unread && <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
          </Link>
          <Link to="/panier" aria-label="Panier" className="relative grid h-10 w-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
          </Link>
        </div>
      </div>
      {location && (
          <button onClick={() => navigate('/?ville=1')} className="mt-2 flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800">
            <MapPin size={16} style={{ color: service.color }} className="fill-current" /> {city}, Gabon <ChevronDown size={15} />
          </button>
      )}
      {search && (
          <div className="mt-3 flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-white pl-4 pr-2 shadow-sm">
            <button onClick={() => navigate(hrefOf(service, 'c/Tous'))} className="flex flex-1 items-center gap-3 text-left text-sm text-neutral-400">
              <Search size={20} className="text-neutral-700" /> {service.searchHint}
            </button>
            <Link to="/scanner" aria-label="Scanner" className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 hover:bg-neutral-100"><ScanLine size={20} /></Link>
          </div>
      )}
    </header>
  )
}

/** En-tête coloré des sous-pages (catégorie, restaurant…), comme l'écran « Fruits & Légumes frais ». */
export function ServiceSubHeader({ service, title, children }: { service: Service; title: string; children?: ReactNode }) {
  const back = useBack(hrefOf(service, ''))
  const { cartCount } = useApp()
  return (
    <header className="sticky top-0 z-30 pt-safe text-white lg:top-[124px]" style={{ background: service.gradient }}>
      <div className="flex h-14 items-center gap-2 px-3">
        <button onClick={back} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"><ChevronLeft size={24} /></button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        <Link to="/panier" aria-label="Panier" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/15">
          <ShoppingCart size={21} />
          {cartCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold" style={{ color: service.color }}>{cartCount}</span>}
        </Link>
      </div>
      {children && <div className="px-4 pb-3">{children}</div>}
    </header>
  )
}

/** Mise en page d'un service : panneau de marque (desktop) + application. */
export function ServiceLayout({ service, children }: { service: Service; children: ReactNode }) {
  return (
    <div className="animate-fade-up lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-6 lg:py-8">
      <aside
        className="sticky top-[96px] hidden overflow-hidden rounded-[32px] p-8 shadow-2xl lg:block"
        style={{ background: `radial-gradient(120% 80% at 0% 0%, white 0%, ${service.soft} 55%, ${service.soft} 100%)` }}
      >
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-2xl" style={{ background: service.gradient }} />
        <img src={logoOf(service.id)} alt={service.name} className="relative mx-auto max-h-52 w-auto" />
        <p className="relative mt-6 text-xl font-semibold leading-snug text-neutral-900">{service.tagline}</p>
        <ul className="relative mt-6 space-y-3">
          {service.features.map((f) => (
            <li key={f.label} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5" style={{ color: service.color }}>
                {f.icon === 'neam' ? <NeamMark className="h-5" /> : <Icon name={f.icon} size={20} />}
              </span>
              <span className="text-sm font-medium text-neutral-800">{f.label}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-8 flex gap-1 text-5xl">{service.visual.slice(0, 3).map((e) => <span key={e} className="animate-float" style={{ animationDelay: `${e.length * 0.2}s` }}>{e}</span>)}</div>
      </aside>
      <div className="min-h-screen bg-[#f6f7f9] pb-28 lg:min-h-[calc(100vh-130px)] lg:overflow-clip lg:rounded-[32px] lg:pb-8 lg:shadow-2xl">{children}</div>
    </div>
  )
}
