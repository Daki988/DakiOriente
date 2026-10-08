import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronRight, CreditCard, MapPin, ShieldCheck, Star, Zap } from 'lucide-react'
import { CITIES, logoOf, SERVICES } from '../data/services'
import { useApp } from '../store/AppContext'
import { NeamMark } from './Logo'
import { PhoneIllustration, PhoneWithBubbles, Rider, Skyline } from './Illustrations'
import { Sheet } from './Sheet'
import { ServiceGlyph } from './ServiceTile'
import { tap } from '../lib/native'

type Slide = { title: ReactNode; text: string; cta: string; to: string; bg: string; art: ReactNode }

const slides: Slide[] = [
  {
    title: <>Tout NEAM dans une seule application.</>,
    text: 'Courses, repas, livraison, santé, beauté, impression, bricolage, services et plus encore.',
    cta: 'Découvrir',
    to: '/services',
    bg: 'linear-gradient(120deg, #07834f 0%, #10c070 55%, #6ff0b0 100%)',
    art: (
      <div className="relative h-full w-full">
        <div className="absolute bottom-[-6%] right-[6%] h-[70%] w-[70%] rounded-full bg-white/25 blur-2xl" />
        <div className="absolute bottom-[10%] right-[18%] w-[38%] max-w-[110px] animate-float"><PhoneIllustration tilt={8} /></div>
        <span className="absolute left-[8%] top-[18%] animate-float text-4xl [animation-delay:.6s]">🛍️</span>
        <span className="absolute bottom-[12%] left-[2%] animate-float text-3xl [animation-delay:1.2s]">🍲</span>
        <span className="absolute right-[2%] top-[8%] animate-float text-3xl [animation-delay:1.8s]">💊</span>
      </div>
    ),
  },
  {
    title: <>Vos essentiels livrés plus vite.</>,
    text: 'Un coursier NEAM Express récupère et livre vos colis en moins de 30 minutes.',
    cta: 'Commander',
    to: '/service/express',
    bg: 'linear-gradient(120deg, #054a32 0%, #0b8f57 60%, #2fe08d 100%)',
    art: (
      <div className="relative h-full w-full">
        <Skyline className="absolute bottom-[18%] left-0 h-[45%] w-full text-neam-950/50" />
        <div className="absolute bottom-[10%] left-0 h-[8%] w-full bg-neam-950/40" />
        <Rider className="absolute bottom-[12%] right-[10%] animate-float" />
      </div>
    ),
  },
  {
    title: <>-20% sur votre premier repas.</>,
    text: 'Code NEAM20 — poulet nyembwe, poisson braisé, grillades et bien plus.',
    cta: 'J’ai faim',
    to: '/service/food',
    bg: 'linear-gradient(120deg, #b10b26 0%, #ff4b4b 60%, #ff9a7a 100%)',
    art: (
      <div className="relative grid h-full w-full place-items-center">
        <div className="absolute h-[70%] w-[70%] rounded-full bg-white/25 blur-xl" />
        <span className="animate-float text-[clamp(70px,22vw,140px)] drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)]">🍲</span>
        <span className="absolute right-[6%] top-[10%] rotate-12 rounded-2xl bg-white px-3 py-1.5 text-sm font-extrabold text-red-600 shadow-lg">-20%</span>
      </div>
    ),
  },
  {
    title: <>Votre pharmacie de garde, 7j/7.</>,
    text: 'Médicaments, parapharmacie et téléconsultation livrés chez vous.',
    cta: 'Voir NEAM Health',
    to: '/service/health',
    bg: 'linear-gradient(120deg, #0b3fb0 0%, #1d84ff 60%, #7cc8ff 100%)',
    art: (
      <div className="relative grid h-full w-full place-items-center">
        <div className="absolute h-[70%] w-[70%] rounded-full bg-white/25 blur-xl" />
        <span className="animate-float text-[clamp(64px,20vw,128px)]">🩺</span>
        <span className="absolute bottom-[14%] left-[10%] animate-float text-4xl [animation-delay:1s]">💊</span>
        <span className="absolute right-[8%] top-[12%] animate-float text-4xl [animation-delay:.5s]">🧴</span>
      </div>
    ),
  },
  {
    title: <>Nouveau : Tremplin by NEAM.</>,
    text: 'Stages, emplois et formations : crée ton CV et postule en un clic.',
    cta: 'Trouver un stage',
    to: '/service/tremplin',
    bg: 'linear-gradient(120deg, #0b3fb0 0%, #1d6ef5 60%, #ffc21a 130%)',
    art: (
      <div className="relative grid h-full w-full place-items-center">
        <div className="absolute h-[70%] w-[70%] rounded-full bg-white/25 blur-xl" />
        <span className="animate-float text-[clamp(64px,20vw,128px)]">🧑🏾‍🎓</span>
        <span className="absolute right-[6%] top-[10%] animate-float text-4xl [animation-delay:.5s]">💼</span>
        <span className="absolute bottom-[14%] left-[8%] animate-float text-3xl [animation-delay:1s]">🚀</span>
      </div>
    ),
  },
  {
    title: <>Payez en toute sécurité.</>,
    text: 'Airtel Money, Moov Money, carte bancaire ou portefeuille NEAM Pay.',
    cta: 'Mon portefeuille',
    to: '/profil',
    bg: 'linear-gradient(120deg, #04241b 0%, #0a5a39 55%, #10c070 100%)',
    art: (
      <div className="relative h-full w-full">
        <div className="absolute right-[8%] top-[22%] aspect-[1.6] w-[66%] rotate-[-8deg] animate-float rounded-2xl bg-gradient-to-br from-neam-300 to-neam-700 p-3 shadow-2xl ring-1 ring-white/30">
          <div className="flex items-center justify-between">
            <NeamMark mono className="h-6" />
            <span className="text-[10px] font-semibold tracking-widest text-white/80">NEAM PAY</span>
          </div>
          <div className="mt-[14%] h-5 w-8 rounded bg-yellow-200/80" />
          <div className="mt-2 font-mono text-[11px] tracking-widest text-white/90">•••• 2026</div>
        </div>
        <span className="absolute bottom-[10%] left-[8%] animate-float text-4xl [animation-delay:1s]">🔒</span>
      </div>
    ),
  },
]

export function HeroCarousel() {
  const [i, setI] = useState(0)
  const paused = useRef(false)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    const t = setInterval(() => !paused.current && setI((x) => (x + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section
      className="relative overflow-hidden rounded-[26px] shadow-[0_20px_40px_-20px_rgba(4,36,27,0.6)]"
      aria-roledescription="carrousel"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={(e) => {
        paused.current = true
        startX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        paused.current = false
        if (startX.current === null) return
        const dx = e.changedTouches[0].clientX - startX.current
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : slides.length - 1)) % slides.length)
        startX.current = null
      }}
    >
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (
          <div key={k} className="relative grid min-h-[230px] w-full shrink-0 grid-cols-[1.5fr_1fr] sm:min-h-[260px]" style={{ background: s.bg }} aria-hidden={k !== i}>
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative z-10 flex flex-col justify-center py-6 pl-5 pr-1 text-white sm:pl-7">
              <h2 className="text-[clamp(20px,5.6vw,30px)] font-extrabold leading-[1.08] tracking-tight drop-shadow-sm">{s.title}</h2>
              <p className="mt-2.5 text-[clamp(11px,3vw,14px)] leading-snug text-white/90">{s.text}</p>
              <Link
                to={s.to}
                tabIndex={k === i ? 0 : -1}
                onClick={tap}
                className="mt-4 inline-flex w-max items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg transition hover:gap-3 active:scale-95"
              >
                {s.cta} <ArrowRight size={17} />
              </Link>
            </div>
            <div className="relative">{s.art}</div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:left-auto sm:right-6 sm:translate-x-0">
        {slides.map((_, k) => (
          <button
            key={k}
            aria-label={`Diapositive ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  )
}

const features = [
  { icon: ShieldCheck, label: 'Un seul compte pour tout' },
  { icon: Zap, label: 'Des services rapides et fiables' },
  { icon: Star, label: 'Des offres exclusives' },
  { icon: CreditCard, label: 'Paiement sécurisé' },
  { icon: MapPin, label: 'Partout au Gabon' },
]

export function FeatureStrip() {
  return (
    <ul className="grid grid-cols-5 divide-x divide-white/10">
      {features.map(({ icon: Icon, label }, i) => (
        <li key={label} className="flex animate-fade-up flex-col items-center gap-2 px-1 text-center" style={{ animationDelay: `${i * 60}ms` }}>
          <Icon className="h-8 w-8 text-neam-400 drop-shadow-[0_0_12px_rgba(34,216,132,0.5)] sm:h-10 sm:w-10" strokeWidth={1.8} fill={Icon === Star ? 'currentColor' : 'none'} />
          <span className="text-[10px] leading-tight text-white/85 sm:text-xs">{label}</span>
        </li>
      ))}
    </ul>
  )
}

export function PromoBanner() {
  return (
    <Link to="/service/express" onClick={tap} className="group relative block overflow-hidden rounded-[24px] shadow-xl ring-1 ring-white/10">
      <div className="relative aspect-[2.2/1] w-full bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100">
        <div className="absolute right-[12%] top-[10%] h-14 w-14 rounded-full bg-yellow-100/90 blur-sm" />
        <Skyline className="absolute bottom-[30%] left-0 h-[42%] w-full text-slate-500/70" />
        <div className="absolute bottom-[22%] left-0 h-[10%] w-full bg-gradient-to-b from-sky-500/50 to-sky-600/40" />
        <div className="absolute bottom-0 left-0 h-[22%] w-full bg-gradient-to-b from-neutral-500 to-neutral-700" />
        <div className="absolute bottom-[9%] left-0 flex w-full gap-6 overflow-hidden px-2">
          {Array.from({ length: 12 }).map((_, i) => <span key={i} className="h-1 w-8 shrink-0 rounded bg-white/70" />)}
        </div>
        <Rider className="absolute bottom-[10%] left-[10%] transition duration-500 group-hover:translate-x-3" />
        <div className="absolute inset-y-0 right-0 flex w-[72%] flex-col items-end justify-center pr-5 text-right text-white" style={{ background: 'linear-gradient(to left, rgba(4,36,27,0.88) 0%, rgba(4,36,27,0.6) 55%, rgba(4,36,27,0) 100%)' }}>
          <h3 className="text-[clamp(18px,5.4vw,30px)] font-extrabold leading-[1.05]">Vos essentiels<br />livrés plus vite.</h3>
          <span className="mt-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-neam-400 px-4 py-2 text-[clamp(11px,3vw,14px)] font-semibold text-neam-950 shadow-lg transition group-hover:gap-3">
            Commander maintenant <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function FeaturedServices() {
  const featured = SERVICES.filter((s) => !['services', 'tremplin', 'gurutools', 'legal'].includes(s.id))
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white sm:text-xl">Nos services phares</h2>
        <Link to="/services" className="flex items-center gap-0.5 text-sm font-medium text-neam-400 hover:text-neam-300">
          Voir tout <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {featured.map((s, i) => (
          <Link
            key={s.id}
            to={`/service/${s.id}`}
            onClick={tap}
            className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-white/10 transition hover:-translate-y-1"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="relative grid aspect-[1/0.95] place-items-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 70%, white 0%, ${s.soft} 80%)` }}>
              <span className="relative z-10 text-[clamp(30px,10vw,56px)] drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] transition duration-500 group-hover:scale-110">{s.visual[0]}</span>
              <span className="absolute left-[8%] top-[8%] text-[clamp(14px,4vw,24px)] opacity-90">{s.visual[1]}</span>
              <span className="absolute bottom-[8%] right-[8%] text-[clamp(14px,4vw,24px)] opacity-90">{s.visual[2]}</span>
              <span className="absolute right-[10%] top-[10%] text-[clamp(10px,3vw,18px)] opacity-70">{s.visual[3]}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-2 text-white" style={{ background: s.gradient }}>
              <ServiceGlyph service={s} className="h-4 shrink-0 sm:h-5" />
              <div className="min-w-0 text-[clamp(8px,2.4vw,13px)] font-bold leading-[1.05]">
                {s.id === 'brico' ? (
                  <>Brico&amp;Deco<div className="text-[0.8em] font-medium opacity-90">by NEAM</div></>
                ) : (
                  <>NEAM<div>{s.short}</div></>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function SolutionsCta() {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-neam-900 via-neam-950 to-[#021a13] p-5 ring-1 ring-neam-400/20 sm:p-7">
      <div className="absolute -left-10 top-0 h-24 w-40 -rotate-12 bg-neam-400/20 blur-2xl" />
      <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-2">
        <div>
          <h2 className="text-[clamp(17px,5vw,26px)] font-bold leading-tight text-white">
            Des solutions pour votre quotidien, en un seul endroit.
          </h2>
          <Link to="/services" onClick={tap} className="mt-4 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-neam-400 px-5 py-2.5 text-sm font-semibold text-neam-950 shadow-[0_8px_24px_-6px_rgba(34,216,132,0.7)] transition hover:gap-3">
            Explorer NEAM <ArrowRight size={16} />
          </Link>
        </div>
        <PhoneWithBubbles className="aspect-square w-full" />
      </div>
    </section>
  )
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { city, setCity, toast } = useApp()
  const navigate = useNavigate()
  return (
    <Sheet open={open} onClose={onClose} title="Choisir votre ville">
      <p className="mb-3 text-sm text-neutral-500">NEAM est disponible partout au Gabon. Les délais et services varient selon la ville.</p>
      <ul className="grid grid-cols-2 gap-2">
        {CITIES.map((c) => (
          <li key={c}>
            <button
              onClick={() => {
                setCity(c)
                toast(`Livraison à ${c}`)
                onClose()
                navigate('/', { replace: true })
              }}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${c === city ? 'border-neam-500 bg-neam-50 text-neam-800' : 'border-neutral-200 hover:border-neam-300'}`}
            >
              <span className="flex items-center gap-2"><MapPin size={16} className="text-neam-600" /> {c}</span>
              {c === city && <Check size={16} className="text-neam-600" />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}

/** Les nouvelles marques de l'écosystème NEAM, avec leurs logos officiels. */
export function NewServices() {
  const list = SERVICES.filter((s) => s.isNew)
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold text-white sm:text-xl">Nouveau sur NEAM</h2>
        <span className="rounded-full bg-neam-400 px-2 py-0.5 text-[10px] font-bold uppercase text-neam-950">Nouveau</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {list.map((s, i) => (
          <Link
            key={s.id}
            to={`/service/${s.id}`}
            onClick={tap}
            className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-white/10 transition hover:-translate-y-1"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="grid aspect-[1.25] place-items-center p-3" style={{ background: `radial-gradient(circle at 50% 60%, white 0%, ${s.soft} 85%)` }}>
              <img src={logoOf(s.id)} alt={s.name} className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-105" />
            </div>
            <p className="px-2 py-2 text-center text-[clamp(9px,2.5vw,12px)] font-medium leading-tight text-neutral-600">{s.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
