import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Clock, MapPin, Search, ShoppingCart, Star } from 'lucide-react'
import { SERVICE_MAP, type ServiceId } from '../data/services'
import { productsOf } from '../data/products'
import { useApp } from '../store/AppContext'
import { ProductCard } from '../components/ProductCard'
import { ServiceBadge } from '../components/ServiceTile'
import { PageShell } from '../components/Navigation'
import ExpressForm from './ExpressForm'

export default function Service() {
  const { id } = useParams()
  const service = SERVICE_MAP[id as ServiceId]
  const navigate = useNavigate()
  const { city, cartCount } = useApp()
  const [cat, setCat] = useState('Tout')
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    if (!service) return []
    const query = q.trim().toLowerCase()
    return productsOf(service.id).filter(
      (p) => (cat === 'Tout' || p.category === cat) && (!query || `${p.name} ${p.vendor} ${p.category}`.toLowerCase().includes(query)),
    )
  }, [service, cat, q])

  if (!service) return <Navigate to="/services" replace />

  return (
    <PageShell className="lg:max-w-5xl">
      <header className="relative overflow-hidden pt-safe text-white" style={{ background: service.gradient }}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15" />
        <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex h-14 items-center justify-between px-3">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
            <ChevronLeft size={24} />
          </button>
          <Link to="/panier" aria-label="Panier" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold" style={{ color: service.color }}>{cartCount}</span>}
          </Link>
        </div>
        <div className="relative flex items-center gap-4 px-5 pb-16 pt-2">
          <div className="ring-4 ring-white/30 rounded-3xl"><ServiceBadge service={service} size="lg" /></div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight">{service.name}</h1>
            <p className="text-sm text-white/90">{service.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
              <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-1"><Clock size={12} /> {service.eta}</span>
              <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-1"><MapPin size={12} /> {city}</span>
              <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-1"><Star size={12} className="fill-white" /> 4,8</span>
            </div>
          </div>
        </div>
      </header>

      {service.id === 'express' ? (
        <ExpressForm />
      ) : (
        <>
          <div className="relative -mt-8 px-4">
            <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 shadow-lg ring-1 ring-black/5">
              <Search size={20} className="text-neutral-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Rechercher dans ${service.name}…`}
                className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
              />
            </label>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {service.categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${cat === c ? 'text-white shadow-md' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`}
                style={cat === c ? { background: service.gradient } : undefined}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl p-4" style={{ background: service.soft }}>
            <span className="text-3xl">{service.visual[0]}</span>
            <div className="text-sm">
              <p className="font-semibold" style={{ color: service.color }}>Livraison offerte dès 15 000 FCFA</p>
              <p className="text-neutral-600">Partenaires vérifiés · Paiement sécurisé</p>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p, i) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </section>
          {items.length === 0 && (
            <div className="px-6 py-16 text-center text-neutral-500">
              <div className="text-5xl">🔍</div>
              <p className="mt-3 font-medium">Aucun résultat</p>
              <p className="text-sm">Essayez une autre catégorie ou un autre mot-clé.</p>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
