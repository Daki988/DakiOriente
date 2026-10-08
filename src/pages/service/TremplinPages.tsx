import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Briefcase, Building2, CheckCircle2, ChevronDown, ChevronRight, FileText, GraduationCap, MapPin, Plus, Search, Sparkles, Trash2, Users, Wand2 } from 'lucide-react'
import type { Service } from '../../data/services'
import { CITIES } from '../../data/services'
import { COMPANIES, FORMATIONS, OFFERS, type ContractType, type Offer } from '../../data/careers'
import { useApp, type CV } from '../../store/AppContext'
import { fcfa } from '../../lib/format'
import { tap } from '../../lib/native'
import { Sheet } from '../../components/Sheet'
import { hrefOf, ServiceHeader, ServiceSubHeader } from './ServiceLayout'

const YELLOW = '#ffc21a'

function SearchCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [city, setCity] = useState('Gabon')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        tap()
        navigate(`${hrefOf(service, 'offres')}?q=${encodeURIComponent(q)}&ville=${encodeURIComponent(city)}`)
      }}
      className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-[1fr_180px_auto]'}`}
    >
      <label className="flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-black/5">
        <Search size={19} className="text-neutral-700" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quel stage ou emploi ?" className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400" />
      </label>
      <label className="relative flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-black/5">
        <MapPin size={18} className="fill-neutral-800 text-white" />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 appearance-none bg-transparent text-sm outline-none">
          <option>Gabon</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none" />
      </label>
      <button className="flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-neutral-900 shadow-md transition active:scale-[0.98]" style={{ background: YELLOW }}>
        Rechercher <ArrowRight size={17} />
      </button>
    </form>
  )
}

export function TremplinHome({ service }: { service: Service }) {
  const { applications } = useApp()
  const cards = [
    { to: 'offres', icon: Search, title: 'Trouve des offres', short: 'Offres', text: 'Stages, emplois, alternances au Gabon et en Afrique.', tint: '#e8f1ff', color: '#1d6ef5' },
    { to: 'cv', icon: FileText, title: 'Crée ton CV', short: 'Mon CV', text: 'Avec nos modèles et l’assistance IA.', tint: '#fff6dc', color: '#e9a400' },
    { to: 'formations', icon: GraduationCap, title: 'Développe tes compétences', short: 'Formations', text: 'Formations adaptées à ton profil.', tint: '#f1ebff', color: '#7c3aed' },
    { to: 'entreprises', icon: Building2, title: 'Découvre les entreprises', short: 'Entreprises', text: 'Qui recrutent près de toi et partout en Afrique.', tint: '#ffebef', color: '#e11d48' },
  ]
  return (
    <div className="bg-gradient-to-b from-[#eef5ff] to-[#f6f7f9]">
      <ServiceHeader service={service} search={false} />
      <section className="relative overflow-hidden px-4 pb-2">
        <div className="pointer-events-none absolute -right-10 top-6 h-56 w-56 rounded-full bg-[#1d6ef5]/15 blur-2xl" />
        <div className="pointer-events-none absolute right-2 top-28 h-24 w-24 rotate-12 rounded-[40%] bg-[#ffc21a]/40 blur-md" />
        <span className="inline-block rounded-full bg-[#dfeaff] px-3 py-1 text-xs font-medium text-[#1b3f8f]">Stages • Emplois • Formations</span>
        <div className="relative grid grid-cols-[1.6fr_1fr] items-end">
          <div>
            <h1 className="mt-3 text-[clamp(28px,8vw,46px)] font-extrabold leading-[1.02] tracking-tight text-[#0b1b3f]">
              De je cherche un stage à <span className="text-[#1d5cf0]">je suis prêt à candidater.</span>
            </h1>
            <svg viewBox="0 0 200 12" className="mt-1 h-3 w-40" aria-hidden="true"><path d="M2 8 C60 2 140 2 198 6" stroke={YELLOW} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
          </div>
          <div className="relative -mb-2 text-center">
            <p className="-rotate-6 text-[13px] italic text-[#0b1b3f]" style={{ fontFamily: 'cursive' }}>Mon avenir commence ici !</p>
            <span className="block animate-float text-[clamp(72px,22vw,140px)] leading-none drop-shadow-xl">🧑🏾‍🎓</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-700">Tremplin t’accompagne à chaque étape : trouve des opportunités, crée ton CV et postule simplement.</p>
        <div className="mt-4"><SearchCard service={service} /></div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-4 pt-5 xl:grid-cols-4">
        {cards.map(({ to, icon: Ico, title, short, text, tint, color }) => (
          <Link key={to} to={hrefOf(service, to)} className="group flex flex-col rounded-3xl p-4 transition hover:-translate-y-0.5" style={{ background: tint }}>
            <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md" style={{ background: color }}><Ico size={21} /></span>
            <span className="mt-3 font-bold text-[#0b1b3f]"><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{title}</span></span>
            <span className="text-xs text-neutral-600">{text}</span>
            <ChevronRight size={18} className="mt-2 self-end text-[#1d5cf0] transition group-hover:translate-x-1" />
          </Link>
        ))}
      </section>

      <section className="mx-4 mt-5 grid grid-cols-3 divide-x divide-neutral-200 rounded-3xl bg-white py-4 text-center shadow-sm ring-1 ring-black/5">
        {[
          { icon: Users, n: '+ 5 000', l: 'jeunes accompagnés' },
          { icon: Briefcase, n: '+ 1 200', l: 'offres disponibles' },
          { icon: Building2, n: '+ 300', l: 'entreprises partenaires' },
        ].map(({ icon: Ico, n, l }) => (
          <div key={l} className="px-2">
            <Ico size={20} className="mx-auto text-[#1d5cf0]" />
            <p className="mt-1 font-extrabold text-[#0b1b3f]">{n}</p>
            <p className="text-[10.5px] leading-tight text-neutral-500">{l}</p>
          </div>
        ))}
      </section>

      <section className="pt-6">
        <div className="mb-3 flex items-center justify-between px-4">
          <h2 className="text-[17px] font-bold">Offres récentes</h2>
          <Link to={hrefOf(service, 'offres')} className="flex items-center gap-1 text-sm font-medium text-[#1d5cf0]">Voir tout <ArrowRight size={15} /></Link>
        </div>
        <div className="space-y-2 px-4">{OFFERS.slice(0, 3).map((o) => <OfferRow key={o.id} offer={o} applied={applications.some((a) => a.offerId === o.id)} />)}</div>
      </section>

      <figure className="mx-4 mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="text-3xl">👩🏾‍🎓👨🏾‍🎓🧑🏾</div>
        <blockquote className="mt-2 text-sm italic text-neutral-700">“Tremplin m’a permis de trouver mon stage en moins d’un mois. La plateforme est simple et vraiment utile !”</blockquote>
        <figcaption className="mt-2 text-xs text-neutral-500">— Grâce, étudiante à Libreville</figcaption>
      </figure>
    </div>
  )
}

const typeColor: Record<ContractType, string> = { Stage: '#1d5cf0', Emploi: '#079b5a', Alternance: '#7c3aed' }

function OfferRow({ offer, applied }: { offer: Offer; applied: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eef4ff] text-2xl">{offer.logo}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{offer.title}</span>
          <span className="block truncate text-xs text-neutral-500">{offer.company} · {offer.city} · {offer.contract}</span>
          <span className="mt-1 flex gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: typeColor[offer.type] }}>{offer.type}</span>
            {applied && <span className="rounded-full bg-neam-50 px-2 py-0.5 text-[10px] font-semibold text-neam-700">Candidature envoyée</span>}
          </span>
        </span>
        <span className="text-[11px] text-neutral-400">{offer.posted}</span>
      </button>
      <OfferSheet offer={offer} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function OfferSheet({ offer, open, onClose }: { offer: Offer; open: boolean; onClose: () => void }) {
  const { cv, applications, apply, toast } = useApp()
  const navigate = useNavigate()
  const applied = applications.some((a) => a.offerId === offer.id)
  const ready = cv.fullName.trim() && cv.title.trim()
  return (
    <Sheet open={open} onClose={onClose} title="Offre">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4ff] text-3xl">{offer.logo}</span>
        <div>
          <h2 className="text-lg font-bold leading-tight">{offer.title}</h2>
          <p className="text-sm text-neutral-500">{offer.company}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full px-2.5 py-1 font-semibold text-white" style={{ background: typeColor[offer.type] }}>{offer.contract}</span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1">📍 {offer.city}</span>
        {offer.salary && <span className="rounded-full bg-neutral-100 px-2.5 py-1">💰 {offer.salary}</span>}
        {offer.tags.map((t) => <span key={t} className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[#1b3f8f]">{t}</span>)}
      </div>
      <p className="mt-4 text-sm text-neutral-700">{offer.description}</p>
      <h3 className="mt-4 text-sm font-bold">Missions</h3>
      <ul className="mt-1 space-y-1 text-sm text-neutral-700">
        {offer.missions.map((m) => <li key={m} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1d5cf0]" /> {m}</li>)}
      </ul>
      {applied ? (
        <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-neam-50 py-4 font-semibold text-neam-700"><CheckCircle2 size={19} /> Candidature envoyée</p>
      ) : ready ? (
        <button onClick={() => { tap(); apply(offer.id); toast(`Candidature envoyée à ${offer.company}`) }} className="mt-6 w-full rounded-2xl py-4 font-semibold text-neutral-900 shadow-lg" style={{ background: YELLOW }}>
          Postuler avec mon CV
        </button>
      ) : (
        <div className="mt-6 rounded-2xl bg-[#eef4ff] p-4 text-sm">
          <p className="font-semibold text-[#0b1b3f]">Crée d’abord ton CV pour postuler en un clic.</p>
          <button onClick={() => { onClose(); navigate('/service/tremplin/cv') }} className="mt-3 w-full rounded-xl bg-[#1d5cf0] py-3 font-semibold text-white">Créer mon CV</button>
        </div>
      )}
    </Sheet>
  )
}

export function TremplinOffers({ service }: { service: Service }) {
  const [params] = useSearchParams()
  const { applications } = useApp()
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [type, setType] = useState<'Tous' | ContractType>('Tous')
  const [q, setQ] = useState(params.get('q') ?? '')
  const city = params.get('ville') ?? 'Gabon'
  const company = params.get('entreprise')
  const query = q.trim().toLowerCase()
  const list = useMemo(
    () =>
      OFFERS.filter(
        (o) =>
          (type === 'Tous' || o.type === type) &&
          (city === 'Gabon' || o.city === city) &&
          (!company || o.company === company) &&
          (!query || `${o.title} ${o.company} ${o.tags.join(' ')}`.toLowerCase().includes(query)) &&
          (tab === 'all' || applications.some((a) => a.offerId === o.id)),
      ),
    [type, city, company, query, tab, applications],
  )
  return (
    <>
      <ServiceSubHeader service={service} title={company ?? 'Offres'}>
        <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-neutral-800">
          <Search size={18} className="text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quel stage ou emploi ?" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
      </ServiceSubHeader>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 rounded-2xl bg-neutral-200/70 p-1 text-sm font-semibold">
          {([['all', 'Toutes les offres'], ['mine', `Mes candidatures (${applications.length})`]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-xl py-2 ${tab === id ? 'bg-white shadow' : 'text-neutral-500'}`}>{l}</button>
          ))}
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {(['Tous', 'Stage', 'Emploi', 'Alternance'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${type === t ? 'bg-[#1d5cf0] text-white' : 'bg-white ring-1 ring-neutral-200'}`}>{t}</button>
          ))}
          {city !== 'Gabon' && <span className="shrink-0 rounded-full bg-[#fff6dc] px-4 py-2 text-sm font-medium">📍 {city}</span>}
        </div>
        <p className="mt-3 text-xs text-neutral-500">{list.length} offre{list.length > 1 ? 's' : ''}</p>
        <div className="mt-2 space-y-2">{list.map((o) => <OfferRow key={o.id} offer={o} applied={applications.some((a) => a.offerId === o.id)} />)}</div>
        {!list.length && <p className="py-12 text-center text-sm text-neutral-500">Aucune offre ne correspond. Élargis ta recherche !</p>}
      </div>
    </>
  )
}

const TEMPLATES = [
  { id: 'classique', label: 'Classique', color: '#0b1b3f' },
  { id: 'moderne', label: 'Moderne', color: '#1d5cf0' },
  { id: 'creatif', label: 'Créatif', color: '#e9a400' },
]

export function TremplinCV({ service }: { service: Service }) {
  const { cv: saved, saveCV, applications, toast } = useApp()
  const [cv, setCv] = useState<CV>(saved)
  const [skill, setSkill] = useState('')
  const [tpl, setTpl] = useState(TEMPLATES[1])
  const set = <K extends keyof CV>(k: K, v: CV[K]) => setCv((c) => ({ ...c, [k]: v }))

  const aiSummary = () => {
    const skills = cv.skills.slice(0, 3).join(', ') || 'travail en équipe, rigueur et curiosité'
    const exp = cv.experiences[0]
    set(
      'summary',
      `${cv.title || 'Jeune professionnel(le)'} motivé(e) basé(e) à ${cv.city}, ${exp ? `avec une expérience en tant que ${exp.role} chez ${exp.company}, ` : ''}je mets mes compétences en ${skills} au service de projets ambitieux. Disponible immédiatement pour un stage ou un emploi.`,
    )
    toast('Résumé généré ✨')
  }

  const field = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#1d5cf0]'
  return (
    <>
      <ServiceSubHeader service={service} title="Mon CV" />
      <div className="grid gap-5 p-4 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder="Prénom et nom" value={cv.fullName} onChange={(e) => set('fullName', e.target.value)} />
            <input className={field} placeholder="Titre (ex. Étudiant en gestion)" value={cv.title} onChange={(e) => set('title', e.target.value)} />
            <input className={field} placeholder="Téléphone" inputMode="tel" value={cv.phone} onChange={(e) => set('phone', e.target.value)} />
            <input className={field} placeholder="E-mail" inputMode="email" value={cv.email} onChange={(e) => set('email', e.target.value)} />
            <select className={field} value={cv.city} onChange={(e) => set('city', e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input className={field} placeholder="Diplôme (ex. Licence, USTM)" value={cv.education} onChange={(e) => set('education', e.target.value)} />
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Résumé</span>
              <button onClick={aiSummary} className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#1d5cf0]"><Wand2 size={14} /> Rédiger avec l’IA</button>
            </div>
            <textarea rows={3} value={cv.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Présente-toi en 2-3 phrases…" className="mt-2 w-full resize-none text-sm outline-none" />
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <span className="text-sm font-semibold">Compétences</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cv.skills.map((s) => (
                <button key={s} onClick={() => set('skills', cv.skills.filter((x) => x !== s))} className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs text-[#1b3f8f]">{s} ×</button>
              ))}
            </div>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (skill.trim()) { set('skills', [...cv.skills, skill.trim()]); setSkill('') } }}>
              <input className={field} placeholder="Ajouter une compétence" value={skill} onChange={(e) => setSkill(e.target.value)} />
              <button className="grid w-11 shrink-0 place-items-center rounded-xl bg-[#1d5cf0] text-white"><Plus size={18} /></button>
            </form>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Expériences</span>
              <button onClick={() => set('experiences', [...cv.experiences, { role: '', company: '', period: '' }])} className="flex items-center gap-1 text-xs font-semibold text-[#1d5cf0]"><Plus size={14} /> Ajouter</button>
            </div>
            {cv.experiences.map((x, i) => (
              <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_90px_auto] gap-1.5">
                {(['role', 'company', 'period'] as const).map((k) => (
                  <input key={k} className={field} placeholder={k === 'role' ? 'Poste' : k === 'company' ? 'Entreprise' : 'Période'} value={x[k]} onChange={(e) => set('experiences', cv.experiences.map((y, j) => (j === i ? { ...y, [k]: e.target.value } : y)))} />
                ))}
                <button aria-label="Supprimer" onClick={() => set('experiences', cv.experiences.filter((_, j) => j !== i))} className="grid w-9 place-items-center text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => { saveCV(cv); toast('CV enregistré') }} className="w-full rounded-2xl py-4 font-semibold text-neutral-900 shadow-md" style={{ background: YELLOW }}>Enregistrer mon CV</button>
          {applications.length > 0 && <p className="text-center text-xs text-neutral-500">Utilisé pour {applications.length} candidature{applications.length > 1 ? 's' : ''}</p>}
        </div>

        <div>
          <div className="mb-2 flex gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTpl(t)} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${tpl.id === t.id ? 'text-white' : 'bg-white ring-1 ring-neutral-200'}`} style={tpl.id === t.id ? { background: t.color } : undefined}>{t.label}</button>
            ))}
          </div>
          <article className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            <div className="p-5 text-white" style={{ background: tpl.color }}>
              <p className="text-xl font-bold">{cv.fullName || 'Ton nom'}</p>
              <p className="text-sm opacity-90">{cv.title || 'Ton titre'}</p>
              <p className="mt-2 text-[11px] opacity-80">{[cv.phone, cv.email, cv.city].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {cv.summary && <p className="text-neutral-700">{cv.summary}</p>}
              {cv.experiences.some((x) => x.role) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tpl.color }}>Expériences</p>
                  {cv.experiences.filter((x) => x.role).map((x, i) => <p key={i} className="mt-1"><b>{x.role}</b> — {x.company} <span className="text-neutral-400">{x.period}</span></p>)}
                </div>
              )}
              {cv.education && <div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: tpl.color }}>Formation</p><p className="mt-1">{cv.education}</p></div>}
              {cv.skills.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tpl.color }}>Compétences</p>
                  <div className="mt-1 flex flex-wrap gap-1">{cv.skills.map((s) => <span key={s} className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{s}</span>)}</div>
                </div>
              )}
              {!cv.summary && !cv.skills.length && <p className="flex items-center gap-2 text-neutral-400"><Sparkles size={16} /> L’aperçu se met à jour pendant que tu écris.</p>}
            </div>
          </article>
        </div>
      </div>
    </>
  )
}

export function TremplinFormations({ service }: { service: Service }) {
  const { enrollments, enroll, toast } = useApp()
  return (
    <>
      <ServiceSubHeader service={service} title="Formations" />
      <ul className="grid gap-3 p-4 sm:grid-cols-2">
        {FORMATIONS.map((f) => {
          const on = enrollments.includes(f.id)
          return (
            <li key={f.id} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f1ebff] text-3xl">{f.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{f.title}</p>
                <p className="text-xs text-neutral-500">{f.duration} · {f.level} · {f.provider}</p>
                <p className="text-sm font-bold text-[#7c3aed]">{f.price ? fcfa(f.price) : 'Gratuit'}</p>
              </div>
              <button
                onClick={() => { if (!on) { enroll(f.id); toast('Inscription confirmée') } }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${on ? 'bg-neam-50 text-neam-700' : 'bg-[#7c3aed] text-white'}`}
              >
                {on ? 'Inscrit ✓' : 'S’inscrire'}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function TremplinCompanies({ service }: { service: Service }) {
  return (
    <>
      <ServiceSubHeader service={service} title="Entreprises qui recrutent" />
      <ul className="space-y-3 p-4">
        {COMPANIES.map((c) => (
          <li key={c.name}>
            <Link to={`${hrefOf(service, 'offres')}?entreprise=${encodeURIComponent(c.name)}`} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffebef] text-2xl">{c.logo}</span>
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-neutral-500">{c.sector} · {c.city}</p>
              </div>
              <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#1d5cf0]">{c.offers} offre{c.offers > 1 ? 's' : ''}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-4 text-center text-xs text-neutral-400">Vous recrutez ? Publiez vos offres avec <Link to="/service/gurutools" className="font-semibold text-[#0b5cf0]">GuruTools by NEAM</Link>.</p>
    </>
  )
}

