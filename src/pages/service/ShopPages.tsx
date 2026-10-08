import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronRight, Clock, MapPin, Route as RouteIcon, Search, Star, Timer } from 'lucide-react'
import type { Quick, Section, Service } from '../../data/services'
import { productsOf, RESTAURANTS, SPECIALTIES, type Product } from '../../data/products'
import { Icon } from '../../lib/icons'
import { ProductCard } from '../../components/ProductCard'
import { BookingSheet, type Bookable } from '../../components/BookingSheet'
import { hrefOf, ServiceHeader, ServiceSubHeader } from './ServiceLayout'
import { tap } from '../../lib/native'

function SectionTitle({ title, to, service }: { title: string; to?: string; service: Service }) {
  return (
    <div className="mb-3 flex items-center justify-between px-4">
      <h2 className="text-[17px] font-bold text-neutral-900">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-sm font-medium" style={{ color: service.color }}>
          Voir tout <ArrowRight size={15} />
        </Link>
      )}
    </div>
  )
}

/** Bannière principale en dégradé, avec composition d'emojis à droite. */
export function HeroBanner({ service, onCta }: { service: Service; onCta: () => void }) {
  const [a, b, c, d] = service.hero.emoji
  return (
    <section className="relative mx-4 overflow-hidden rounded-[24px] text-white shadow-[0_18px_36px_-18px_rgba(0,0,0,0.5)]" style={{ background: service.gradient }}>
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative grid min-h-[190px] grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col justify-center py-5 pl-5">
          <h2 className="text-[clamp(20px,5.6vw,28px)] font-extrabold leading-[1.1]">{service.hero.title}</h2>
          <p className="mt-2 text-[13px] text-white/90">{service.hero.text}</p>
          <button onClick={() => { tap(); onCta() }} className="mt-4 inline-flex w-max items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg transition hover:gap-3 active:scale-95">
            {service.hero.cta} <ArrowRight size={16} />
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-[15%] rounded-full bg-white/25 blur-xl" />
          {a && <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2 animate-float text-[clamp(64px,19vw,110px)] drop-shadow-[0_18px_16px_rgba(0,0,0,0.3)]">{a}</span>}
          {b && <span className="absolute left-[4%] top-[14%] animate-float text-3xl [animation-delay:.6s]">{b}</span>}
          {c && <span className="absolute right-[8%] top-[8%] animate-float text-3xl [animation-delay:1.1s]">{c}</span>}
          {d && <span className="absolute bottom-[10%] right-[4%] animate-float text-2xl [animation-delay:1.6s]">{d}</span>}
        </div>
      </div>
      <div className="absolute bottom-3 left-5 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />)}
      </div>
    </section>
  )
}

export function QuickTile({ q, service }: { q: Quick; service: Service }) {
  return (
    <Link to={hrefOf(service, q.to ?? `c/${encodeURIComponent(q.cat ?? 'Tous')}`)} onClick={tap} className="group flex flex-col items-center gap-1.5 text-center">
      <span className="grid aspect-square w-full max-w-[76px] place-items-center rounded-[20px] transition group-hover:-translate-y-0.5 group-active:scale-95" style={{ background: q.tint, color: service.color }}>
        {q.icon === 'neam' ? null : <Icon name={q.icon} size={28} strokeWidth={2} />}
      </span>
      <span className="text-[11px] font-medium leading-tight text-neutral-700">{q.label}</span>
    </Link>
  )
}

function Row({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
      {products.map((p) => <ProductCard key={p.id} product={p} variant="row" />)}
    </div>
  )
}

function Specialties({ service }: { service: Service }) {
  const [item, setItem] = useState<Bookable | null>(null)
  return (
    <>
      <div className="grid grid-cols-4 gap-3 px-4">
        {SPECIALTIES.map((s) => (
          <button
            key={s.label}
            onClick={() => setItem({ serviceId: 'health', name: `Consultation · ${s.label}`, emoji: s.emoji, price: s.price, unit: '30 min', vendor: 'Médecin partenaire NEAM Health' })}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span className="grid aspect-square w-full max-w-[72px] place-items-center rounded-[20px] text-3xl" style={{ background: service.soft }}>{s.emoji}</span>
            <span className="text-[11px] font-medium leading-tight text-neutral-700">{s.label}</span>
          </button>
        ))}
      </div>
      {item && <BookingSheet item={item} open onClose={() => setItem(null)} />}
    </>
  )
}

function Restaurants({ service }: { service: Service }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
      {RESTAURANTS.map((r) => (
        <Link key={r.name} to={hrefOf(service, `r/${encodeURIComponent(r.name)}`)} className="w-44 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
          <div className="grid h-24 place-items-center text-6xl" style={{ background: `radial-gradient(circle, white, ${service.soft})` }}>{r.cover}</div>
          <div className="p-3">
            <p className="font-semibold">{r.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
              <Star size={12} className="fill-amber-400 text-amber-400" /> {r.rating} · {r.eta}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function SectionBlock({ section, service, products }: { section: Section; service: Service; products: Product[] }) {
  const f = section.filter
  if (f === 'restaurants') return <section className="pt-6"><SectionTitle title={section.title} to={hrefOf(service, 'restaurants')} service={service} /><Restaurants service={service} /></section>
  if (f === 'specialites') return <section className="pt-6"><SectionTitle title={section.title} service={service} /><Specialties service={service} /></section>
  const list = f === 'promo' ? products.filter((p) => p.oldPrice) : f === 'popular' ? products.filter((p) => p.popular) : f === 'all' ? products : products.filter((p) => p.category === f)
  if (!list.length) return null
  const to = f === 'promo' ? 'promos' : `c/${encodeURIComponent(f === 'popular' || f === 'all' ? 'Tous' : f)}`
  return (
    <section className="pt-6">
      <SectionTitle title={section.title} to={hrefOf(service, to)} service={service} />
      <Row products={list} />
    </section>
  )
}

export function ShopHome({ service }: { service: Service }) {
  const navigate = useNavigate()
  const products = useMemo(() => productsOf(service.id), [service.id])
  const heroTarget = service.id === 'health' ? 'c/Consultation' : 'c/Tous'
  return (
    <>
      <ServiceHeader service={service} />
      <HeroBanner service={service} onCta={() => navigate(hrefOf(service, heroTarget))} />
      {service.quick.length > 0 && (
        <section className={`grid gap-x-3 gap-y-4 px-4 pt-6 ${service.quick.length > 4 ? 'grid-cols-4' : 'grid-cols-4'}`}>
          {service.quick.map((q) => <QuickTile key={q.label} q={q} service={service} />)}
        </section>
      )}
      {service.sections.map((s) => <SectionBlock key={s.title} section={s} service={service} products={products} />)}
      {service.banner && (
        <section className="px-4 pt-6">
          <button onClick={() => navigate(hrefOf(service, service.banner?.to ?? 'c/Tous'))} className="relative grid w-full grid-cols-[1.5fr_1fr] overflow-hidden rounded-[24px] text-left text-white shadow-lg" style={{ background: service.gradient }}>
            <div className="p-5">
              <h3 className="text-xl font-extrabold leading-tight">{service.banner.title}</h3>
              <p className="mt-1 text-sm text-white/85">{service.banner.text}</p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900">{service.banner.cta} <ArrowRight size={15} /></span>
            </div>
            <div className="relative">
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-7xl drop-shadow-lg">{service.banner.emoji[0]}</span>
              {service.banner.emoji[1] && <span className="absolute right-3 top-3 text-3xl">{service.banner.emoji[1]}</span>}
            </div>
          </button>
          {service.id === 'market' && (
            <div className="mt-3 grid grid-cols-3 divide-x divide-neutral-100 rounded-2xl bg-white py-3 text-center text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5">
              <span className="flex flex-col items-center gap-1"><RouteIcon size={20} style={{ color: service.color }} /> Suivi en temps réel</span>
              <span className="flex flex-col items-center gap-1"><MapPin size={20} style={{ color: service.color }} /> Zones de livraison</span>
              <span className="flex flex-col items-center gap-1"><Timer size={20} style={{ color: service.color }} /> Livraison express</span>
            </div>
          )}
        </section>
      )}
    </>
  )
}

export function CategoriesPage({ service }: { service: Service }) {
  const products = productsOf(service.id)
  const quickByCat = Object.fromEntries(service.quick.filter((q) => q.cat).map((q) => [q.cat, q]))
  return (
    <>
      <ServiceSubHeader service={service} title="Catégories" />
      <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {['Tous', ...service.categories].map((cat) => {
          const q = quickByCat[cat]
          const count = cat === 'Tous' ? products.length : products.filter((p) => p.category === cat).length
          const sample = (cat === 'Tous' ? products : products.filter((p) => p.category === cat)).slice(0, 3)
          return (
            <li key={cat}>
              <Link to={hrefOf(service, `c/${encodeURIComponent(cat)}`)} className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: q?.tint ?? service.soft, color: service.color }}>
                  {q && q.icon !== 'neam' ? <Icon name={q.icon} size={24} /> : <Icon name="grid" size={22} />}
                </span>
                <span className="mt-3 font-semibold leading-tight">{cat === 'Tous' ? 'Tout voir' : cat}</span>
                <span className="text-xs text-neutral-500">{count} article{count > 1 ? 's' : ''}</span>
                <span className="mt-2 text-xl">{sample.map((p) => p.emoji).join(' ')}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function CategoryPage({ service }: { service: Service }) {
  const { cat = 'Tous' } = useParams()
  const category = decodeURIComponent(cat)
  const all = productsOf(service.id)
  const inCat = category === 'Tous' ? all : all.filter((p) => p.category === category)
  const subs = [...new Set(inCat.map((p) => p.sub).filter(Boolean))] as string[]
  const chips = subs.length ? ['Tous', ...subs] : category === 'Tous' ? ['Tous', ...service.categories] : []
  const [chip, setChip] = useState('Tous')
  const [q, setQ] = useState('')
  const query = norm(q.trim())

  const list = inCat.filter((p) => {
    if (chip !== 'Tous' && (subs.length ? p.sub !== chip : p.category !== chip)) return false
    return !query || norm(`${p.name} ${p.vendor} ${p.category}`).includes(query)
  })

  return (
    <>
      <ServiceSubHeader service={service} title={category === 'Tous' ? service.name : category}>
        <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-neutral-800">
          <Search size={18} className="text-neutral-500" />
          <input autoFocus={category === 'Tous'} value={q} onChange={(e) => setQ(e.target.value)} placeholder={service.searchHint} className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400" />
        </label>
      </ServiceSubHeader>
      {chips.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-4">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setChip(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${chip === c ? 'text-white shadow-md' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`}
              style={chip === c ? { background: service.color } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <section className="grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-4 xl:grid-cols-5">
        {list.map((p, i) => (
          <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 25}ms` }}>
            <ProductCard product={p} variant="mini" />
          </div>
        ))}
      </section>
      {!list.length && (
        <div className="px-6 py-16 text-center text-neutral-500">
          <div className="text-5xl">🔍</div>
          <p className="mt-3 font-medium">Aucun résultat</p>
        </div>
      )}
    </>
  )
}

export function PromosPage({ service }: { service: Service }) {
  const list = productsOf(service.id).filter((p) => p.oldPrice)
  return (
    <>
      <ServiceSubHeader service={service} title="Promotions du jour" />
      <div className="mx-4 mt-4 rounded-2xl p-4 text-sm font-medium" style={{ background: service.soft, color: service.color }}>
        🔥 {list.length} offres à saisir aujourd’hui à {service.name}
      </div>
      <section className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {list.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
    </>
  )
}

export function RestaurantsPage({ service }: { service: Service }) {
  return (
    <>
      <ServiceSubHeader service={service} title="Restaurants" />
      <ul className="space-y-3 p-4">
        {RESTAURANTS.map((r) => (
          <li key={r.name}>
            <Link to={hrefOf(service, `r/${encodeURIComponent(r.name)}`)} className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-5xl" style={{ background: service.soft }}>{r.cover}</span>
              <div className="flex-1">
                <p className="font-bold">{r.name}</p>
                <p className="text-xs text-neutral-500">{r.tags}</p>
                <p className="mt-1 flex items-center gap-3 text-xs text-neutral-600">
                  <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {r.rating}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {r.eta}</span>
                </p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function RestaurantPage({ service }: { service: Service }) {
  const { name = '' } = useParams()
  const r = RESTAURANTS.find((x) => x.name === decodeURIComponent(name)) ?? RESTAURANTS[0]
  const menu = productsOf(service.id).filter((p) => p.vendor === r.name)
  return (
    <>
      <ServiceSubHeader service={service} title={r.name} />
      <div className="relative mx-4 mt-4 grid h-36 place-items-center overflow-hidden rounded-3xl text-8xl" style={{ background: `radial-gradient(circle, white, ${service.soft})` }}>
        {r.cover}
        <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow">
          <Star size={13} className="fill-amber-400 text-amber-400" /> {r.rating} · <Clock size={13} /> {r.eta}
        </span>
      </div>
      <h2 className="px-4 pb-2 pt-5 text-lg font-bold">Menu</h2>
      <section className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {menu.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
    </>
  )
}
