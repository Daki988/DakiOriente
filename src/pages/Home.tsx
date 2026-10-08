import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, MapPin, ScanLine, Search } from 'lucide-react'
import { SERVICES } from '../data/services'
import { PRODUCTS } from '../data/products'
import { useApp } from '../store/AppContext'
import { NeamLogo } from '../components/Logo'
import { ServiceTile } from '../components/ServiceTile'
import { ProductCard } from '../components/ProductCard'
import { FeaturedServices, FeatureStrip, HeroCarousel, LocationSheet, PromoBanner, SolutionsCta } from '../components/HomeSections'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
}

export default function Home() {
  const { city, notifications, userName } = useApp()
  const [params, setParams] = useSearchParams()
  const [locOpen, setLocOpen] = useState(false)
  const navigate = useNavigate()
  const unread = notifications.filter((n) => !n.read).length
  const popular = PRODUCTS.filter((p) => p.popular)

  useEffect(() => {
    if (params.get('ville')) {
      setLocOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  return (
    <div className="animate-fade-up lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-start lg:gap-8 lg:px-6 lg:py-8">
      {/* ——— Colonne application ——— */}
      <div className="bg-[#f6f8f7] lg:overflow-clip lg:rounded-[34px] lg:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] lg:ring-1 lg:ring-white/10">
        <header className="bg-neam-hero px-4 pb-[104px] pt-safe text-white lg:hidden">
          <div className="flex items-center justify-between pt-4">
            <NeamLogo />
            <Link to="/notifications" aria-label={`Notifications (${unread} non lues)`} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white/10">
              <Bell size={26} strokeWidth={1.8} />
              {unread > 0 && <span className="absolute right-2 top-1.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-neam-950" />}
            </Link>
          </div>
          <button onClick={() => setLocOpen(true)} className="glass mt-4 flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium">
            <MapPin size={18} className="fill-white text-neam-900" /> {city}, Gabon <ChevronDown size={16} />
          </button>
          <div className="mt-3 flex h-[52px] items-center gap-3 rounded-full bg-white pl-4 pr-2 text-neutral-500 shadow-lg">
            <button onClick={() => navigate('/recherche')} className="flex flex-1 items-center gap-3 text-left text-[15px]">
              <Search size={22} className="text-neutral-800" />
              <span className="truncate">Rechercher un produit, un service…</span>
            </button>
            <Link to="/scanner" aria-label="Scanner un QR code" className="grid h-10 w-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100">
              <ScanLine size={22} />
            </Link>
          </div>
        </header>

        <div className="-mt-[88px] px-4 lg:mt-0 lg:px-6 lg:pt-6">
          <div className="hidden pb-4 lg:block">
            <p className="text-sm text-neutral-500">{greeting()}, {userName.split(' ')[0]} 👋</p>
            <h1 className="text-2xl font-bold text-neutral-900">Que souhaitez-vous faire aujourd’hui ?</h1>
          </div>
          <HeroCarousel />
        </div>

        <section className="px-4 pt-6 lg:px-6" aria-label="Services NEAM">
          <div className="grid grid-cols-4 gap-x-3 gap-y-5">
            {SERVICES.map((s, i) => (
              <ServiceTile key={s.id} service={s} index={i} />
            ))}
            <div className="flex flex-col items-center text-center">
              <div className="grid aspect-square w-full place-items-center rounded-[22px] bg-neutral-200/70 text-neutral-500">
                <div className="text-center">
                  <div className="text-2xl font-black tracking-widest text-neutral-700">•••</div>
                  <div className="mt-1 px-1 text-[clamp(9px,2.5vw,12px)] leading-tight">Plus de services à venir…</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8 pt-8">
          <div className="mb-3 flex items-center justify-between px-4 lg:px-6">
            <h2 className="text-lg font-bold">Populaire près de chez vous</h2>
            <Link to="/recherche" className="flex items-center text-sm font-medium text-neam-600">Tout voir <ChevronRight size={16} /></Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2 lg:px-6">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      </div>

      {/* ——— Colonne vitrine ——— */}
      <div className="bg-neam-dark space-y-6 rounded-t-[30px] px-4 pb-32 pt-7 lg:space-y-7 lg:rounded-none lg:[background:none] lg:p-0 lg:pt-2">
        <div className="hidden flex-col items-center pb-2 lg:flex">
          <NeamLogo size="xl" />
        </div>
        <FeatureStrip />
        <PromoBanner />
        <FeaturedServices />
        <SolutionsCta />
        <p className="pt-2 text-center text-xs text-white/40">© {new Date().getFullYear()} NEAM · Libreville, Gabon</p>
      </div>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  )
}
