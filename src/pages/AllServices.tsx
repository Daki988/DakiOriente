import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SERVICES } from '../data/services'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'
import { ServiceBadge } from '../components/ServiceTile'

export default function AllServices() {
  return (
    <PageShell>
      <PageHeader title="Tous les services" subtitle="Tout NEAM dans une seule application" />
      <ul className="space-y-3 px-4 pt-2">
        {SERVICES.map((s, i) => (
          <li key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <Link to={`/service/${s.id}`} className="group flex items-center gap-4 overflow-hidden rounded-3xl bg-white p-3 pr-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
              <ServiceBadge service={s} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-neutral-500">{s.description}</p>
                <p className="mt-0.5 text-xs font-medium" style={{ color: s.color }}>⏱ {s.eta}</p>
              </div>
              <span className="text-3xl transition group-hover:scale-110">{s.visual[0]}</span>
              <ChevronRight size={18} className="text-neutral-400" />
            </Link>
          </li>
        ))}
        <li className="rounded-3xl border-2 border-dashed border-neutral-200 p-5 text-center text-sm text-neutral-500">
          <span className="text-2xl font-black tracking-widest text-neutral-400">•••</span>
          <p className="mt-1">Plus de services à venir… NEAM Auto, NEAM Immo, NEAM Event</p>
        </li>
      </ul>
    </PageShell>
  )
}
