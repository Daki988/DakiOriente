import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Lock, MessageSquareText, Receipt, ShieldCheck, Video } from 'lucide-react'
import type { Service } from '../../data/services'
import { PRODUCT_MAP, productsOf } from '../../data/products'
import { ProductCard } from '../../components/ProductCard'
import { BookingSheet } from '../../components/BookingSheet'
import { hrefOf, ServiceHeader } from './ServiceLayout'

const GOLD = '#f5b301'
const NAVY = '#0b2a6b'

const DOMAINS = [
  { cat: 'Entreprise', emoji: '🏢', label: 'Création d’entreprise' },
  { cat: 'Contrats', emoji: '📜', label: 'Contrats & CGV' },
  { cat: 'Travail', emoji: '👷🏾', label: 'Droit du travail' },
  { cat: 'Immobilier', emoji: '🏠', label: 'Immobilier & bail' },
  { cat: 'Famille', emoji: '👪', label: 'Famille & succession' },
  { cat: 'Recouvrement', emoji: '💼', label: 'Recouvrement' },
]

export function LegalHome({ service }: { service: Service }) {
  const [book, setBook] = useState(false)
  const consult = PRODUCT_MAP.l1
  const docs = productsOf('legal').filter((p) => !p.booking)
  return (
    <>
      <ServiceHeader service={service} />
      <section className="relative mx-4 overflow-hidden rounded-[26px] p-5 text-white shadow-xl" style={{ background: `linear-gradient(140deg, #1f62e0 0%, ${NAVY} 70%)` }}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <span className="absolute bottom-3 right-4 text-[84px] opacity-90 drop-shadow-xl">⚖️</span>
        <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: GOLD }}>Guru Légal by NEAM</p>
        <h1 className="mt-2 max-w-[70%] text-[clamp(21px,6vw,30px)] font-extrabold leading-[1.1]">Des solutions juridiques simples pour avancer sereinement.</h1>
        <p className="mt-2 max-w-[65%] text-sm text-white/80">Juristes qualifiés · documents conformes au droit gabonais et OHADA.</p>
        <button onClick={() => setBook(true)} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0b1b3f] shadow-lg" style={{ background: GOLD }}>
          <Video size={17} /> Consulter un juriste
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3 px-4 pt-6">
        {DOMAINS.map((d) => (
          <Link key={d.cat} to={hrefOf(service, `c/${encodeURIComponent(d.cat)}`)} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: service.soft }}>{d.emoji}</span>
            <span className="text-[11px] font-semibold leading-tight text-[#0b1b3f]">{d.label}</span>
          </Link>
        ))}
      </section>

      <section className="pt-6">
        <div className="mb-3 flex items-center justify-between px-4">
          <h2 className="text-[17px] font-bold">Documents les plus demandés</h2>
          <Link to={hrefOf(service, 'c/Tous')} className="flex items-center gap-1 text-sm font-medium" style={{ color: service.color }}>Voir tout <ArrowRight size={15} /></Link>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">{docs.map((p) => <ProductCard key={p.id} product={p} variant="row" />)}</div>
      </section>

      <section className="mx-4 mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Comment ça marche ?</h2>
        <ol className="mt-3 space-y-3">
          {[
            { icon: MessageSquareText, t: 'Décrivez votre besoin', d: 'Choisissez un document ou réservez une consultation.' },
            { icon: BadgeCheck, t: 'Un juriste s’en occupe', d: 'Rédaction ou conseil personnalisé sous 24 h.' },
            { icon: Receipt, t: 'Recevez et signez', d: 'Document final dans l’app, prêt à être signé.' },
          ].map(({ icon: Ico, t, d }, i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: NAVY }}><Ico size={18} /></span>
              <div>
                <p className="text-sm font-semibold">{i + 1}. {t}</p>
                <p className="text-xs text-neutral-500">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-4 mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-[#0b1b3f]">
        {[[ShieldCheck, 'Juristes qualifiés'], [Lock, 'Confidentialité garantie'], [Receipt, 'Prix transparents']].map(([Ico, l]) => {
          const I = Ico as typeof Lock
          return <span key={l as string} className="flex flex-col items-center gap-1 rounded-2xl bg-white py-3 ring-1 ring-black/5"><I size={19} style={{ color: GOLD }} /> {l as string}</span>
        })}
      </section>
      <p className="px-6 pt-4 text-center text-[11px] text-neutral-400">Les informations fournies ne remplacent pas l’assistance d’un avocat devant les juridictions.</p>

      <BookingSheet item={consult} open={book} onClose={() => setBook(false)} />
    </>
  )
}
