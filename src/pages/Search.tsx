import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, Search as SearchIcon, X } from 'lucide-react'
import { PRODUCTS } from '../data/products'
import { SERVICES } from '../data/services'
import { useApp } from '../store/AppContext'
import { PageShell } from '../components/Navigation'
import { ProductCard } from '../components/ProductCard'
import { ServiceBadge } from '../components/ServiceTile'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Search() {
  const navigate = useNavigate()
  const { recentSearches, pushSearch } = useApp()
  const [q, setQ] = useState('')
  const query = norm(q.trim())

  const services = useMemo(() => (query ? SERVICES.filter((s) => norm(`${s.name} ${s.description}`).includes(query)) : []), [query])
  const products = useMemo(
    () => (query ? PRODUCTS.filter((p) => norm(`${p.name} ${p.category} ${p.vendor} ${p.description}`).includes(query)) : PRODUCTS.filter((p) => p.popular)),
    [query],
  )

  return (
    <PageShell>
      <header className="sticky top-0 z-30 bg-white/90 pt-safe backdrop-blur-xl lg:top-[72px]">
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100"><ChevronLeft size={24} /></button>
          <form
            className="flex h-12 flex-1 items-center gap-2 rounded-full bg-neutral-100 px-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (q.trim()) pushSearch(q.trim())
            }}
          >
            <SearchIcon size={19} className="text-neutral-500" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit, un service…" className="flex-1 bg-transparent text-[15px] outline-none" enterKeyHint="search" />
            {q && <button type="button" aria-label="Effacer" onClick={() => setQ('')}><X size={18} className="text-neutral-500" /></button>}
          </form>
        </div>
      </header>

      <div className="px-4 pt-3">
        {!query && (
          <>
            <h2 className="text-sm font-semibold text-neutral-500">Recherches récentes</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {recentSearches.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-neutral-200">
                  <Clock size={14} className="text-neutral-400" /> {r}
                </button>
              ))}
            </div>
          </>
        )}

        {services.length > 0 && (
          <section className="mt-2">
            <h2 className="mb-2 text-sm font-semibold text-neutral-500">Services</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <Link key={s.id} to={`/service/${s.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
                  <ServiceBadge service={s} size="sm" />
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-neutral-500">{s.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <h2 className="mb-2 mt-6 text-sm font-semibold text-neutral-500">{query ? `${products.length} résultat${products.length > 1 ? 's' : ''}` : 'Tendances'}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {query && !products.length && !services.length && (
          <div className="py-12 text-center text-neutral-500">
            <div className="text-5xl">🔍</div>
            <p className="mt-3 font-medium">Aucun résultat pour « {q} »</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
