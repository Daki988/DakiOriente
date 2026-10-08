import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BarChart3, Briefcase, CalendarCheck, Check, CheckCircle2, ClipboardList, Copy, FileText, GraduationCap, LayoutGrid, Mail, MapPin, MessageCircle, PlayCircle, Plus, Share2, Sparkles, Users, X } from 'lucide-react'
import type { Service } from '../../data/services'
import { CITIES } from '../../data/services'
import type { Candidate, Recruitment } from '../../data/careers'
import { useApp } from '../../store/AppContext'
import { timeAgo } from '../../lib/format'
import { tap } from '../../lib/native'
import { hrefOf, ServiceHeader, ServiceSubHeader } from './ServiceLayout'
import { useBack } from '../../lib/useBack'

const BLUE = '#0b5cf0'
const COMPANY = 'KUMBA SERVICES'

const scoreColor = (s: number) => (s >= 80 ? '#079b5a' : s >= 65 ? '#e9a400' : '#e11d48')
const scoreBg = (s: number) => (s >= 80 ? '#e7fbf1' : s >= 65 ? '#fff6dc' : '#ffebef')

function Score({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <span className={`rounded-lg font-bold ${big ? 'px-3 py-1 text-lg' : 'px-2 py-0.5 text-xs'}`} style={{ color: scoreColor(value), background: scoreBg(value) }}>
      {value} %
    </span>
  )
}

export function GuruHome({ service }: { service: Service }) {
  const navigate = useNavigate()
  const steps = [
    { icon: FileText, title: 'Créez votre annonce', text: 'Avec un assistant simple et des modèles prêts à l’emploi.', tint: '#e8f1ff', color: BLUE },
    { icon: Share2, title: 'Partagez votre lien', text: 'WhatsApp, réseaux sociaux ou votre page carrière.', tint: '#e7fbf1', color: '#16a34a' },
    { icon: Users, title: 'Recevez et classez', text: 'Les candidatures sont triées et analysées par l’IA.', tint: '#f1ebff', color: '#7c3aed' },
    { icon: Check, title: 'Choisissez en toute confiance', text: 'Consultez les profils, le score et les recommandations.', tint: '#fff6dc', color: '#e9a400' },
  ]
  return (
    <div className="bg-gradient-to-b from-[#eef5ff] to-[#f6f7f9]">
      <ServiceHeader service={service} search={false} />
      <section className="px-4">
        <span className="inline-block rounded-full bg-[#dfeaff] px-3 py-1 text-xs font-medium text-[#1b3f8f]">Recrutement • TPE/PME • Gabon</span>
        <div className="grid grid-cols-[1.6fr_1fr] items-end">
          <h1 className="mt-3 text-[clamp(30px,8.4vw,48px)] font-extrabold leading-[1.02] tracking-tight text-[#0b1b3f]">
            Le recrutement, <span style={{ color: BLUE }}>sans la paperasse.</span>
          </h1>
          <div className="relative text-center">
            <p className="-rotate-6 text-[12px] italic text-[#0b1b3f]" style={{ fontFamily: 'cursive' }}>Trouvez les bons talents</p>
            <span className="block animate-float text-[clamp(70px,20vw,130px)] leading-none drop-shadow-xl">👩🏾‍💼</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-700">Publiez une annonce, partagez votre lien et recevez vos candidatures classées par pertinence grâce à l’IA. Simple, rapide et 100 % adapté aux TPE et PME du Gabon.</p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={() => { tap(); navigate(hrefOf(service, 'annonce')) }} className="flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white shadow-lg" style={{ background: BLUE }}>
            Créer une annonce gratuitement <ArrowRight size={17} />
          </button>
          <button onClick={() => navigate(hrefOf(service, 'tableau'))} className="flex items-center justify-center gap-2 rounded-2xl border-2 bg-white py-3 font-semibold" style={{ borderColor: BLUE, color: BLUE }}>
            <PlayCircle size={19} /> Voir la démonstration
          </button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700">
          {['0 FCFA pendant le lancement', 'Sans carte bancaire', 'Simple à utiliser'].map((t) => (
            <li key={t} className="flex items-center gap-1"><CheckCircle2 size={15} className="fill-neam-500 text-white" /> {t}</li>
          ))}
        </ul>
      </section>
      <section className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-4">
        {steps.map(({ icon: Ico, title, text, tint, color }) => (
          <div key={title} className="rounded-3xl p-4" style={{ background: tint }}>
            <span className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-md" style={{ background: color }}><Ico size={20} /></span>
            <p className="mt-3 font-bold leading-tight text-[#0b1b3f]">{title}</p>
            <p className="mt-1 text-xs text-neutral-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function RecruitmentCard({ r, service }: { r: Recruitment; service: Service }) {
  const { candidates } = useApp()
  const list = candidates.filter((c) => c.recruitmentId === r.id)
  const relevant = list.filter((c) => c.score >= 80).length
  const shortlisted = list.filter((c) => c.status === 'présélectionné').length
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{r.title}</p>
          <p className="text-xs text-neutral-500">{r.city} · {r.contract} · {timeAgo(r.createdAt)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.status === 'Publié' ? 'bg-neam-50 text-neam-700' : 'bg-[#e8f1ff] text-[#0b5cf0]'}`}>{r.status}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 text-center">
        {[[list.length, 'candidatures'], [relevant, 'pertinents'], [shortlisted, 'présélectionnés']].map(([n, l]) => (
          <div key={l as string}><p className="text-lg font-extrabold">{n}</p><p className="text-[10.5px] text-neutral-500">{l}</p></div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full" style={{ width: `${list.length ? Math.max(8, (relevant / list.length) * 100) : 4}%`, background: BLUE }} />
      </div>
      <Link to={hrefOf(service, `r/${r.id}`)} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold" style={{ borderColor: '#cfe0ff', color: BLUE }}>
        Voir les candidatures <ArrowRight size={15} />
      </Link>
    </div>
  )
}

export function GuruDashboard({ service }: { service: Service }) {
  const { recruitments, candidates } = useApp()
  const navigate = useNavigate()
  const stats = [
    { icon: ClipboardList, n: recruitments.filter((r) => r.status !== 'Terminé').length, l: 'Recrutements actifs', color: BLUE, tint: '#e8f1ff' },
    { icon: Users, n: candidates.length, l: 'Candidatures reçues', color: '#16a34a', tint: '#e7fbf1' },
    { icon: LayoutGrid, n: candidates.filter((c) => c.score >= 80).length, l: 'Profils pertinents', color: '#7c3aed', tint: '#f1ebff' },
    { icon: CalendarCheck, n: candidates.filter((c) => c.status === 'présélectionné').length, l: 'Entretiens planifiés', color: '#ea580c', tint: '#fff0e6' },
  ]
  return (
    <>
      <ServiceSubHeader service={service} title="Tableau de bord" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-[#0b1b3f]">Bonjour,<br />{COMPANY} 👋</p>
            <p className="text-sm text-neutral-500">Voici un aperçu de vos recrutements en cours.</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: BLUE }}>KS</span>
        </div>
        <button onClick={() => navigate(hrefOf(service, 'annonce'))} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white shadow-md" style={{ background: BLUE }}>
          <Plus size={18} /> Créer une annonce
        </button>
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map(({ icon: Ico, n, l, color, tint }) => (
            <div key={l} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: tint, color }}><Ico size={19} /></span>
              <p className="mt-2 text-2xl font-extrabold">{n}</p>
              <p className="text-xs text-neutral-500">{l}</p>
            </div>
          ))}
        </div>
        <h2 className="mb-3 mt-6 text-[17px] font-bold">Mes recrutements</h2>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{recruitments.map((r) => <RecruitmentCard key={r.id} r={r} service={service} />)}</div>
      </div>
    </>
  )
}

export function GuruNewJob({ service }: { service: Service }) {
  const { createRecruitment, toast } = useApp()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('Libreville')
  const [contract, setContract] = useState('CDI')
  const [description, setDescription] = useState('')
  const [created, setCreated] = useState<Recruitment | null>(null)
  const templates = ['Commercial(e)', 'Caissier(ère)', 'Chauffeur-livreur', 'Comptable', 'Assistant(e) de direction', 'Développeur web']
  const field = 'h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b5cf0]'
  const link = created ? `https://neam.ga/emploi/${created.id}` : ''

  if (created)
    return (
      <>
        <ServiceSubHeader service={service} title="Annonce publiée" />
        <div className="p-4 text-center">
          <div className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-neam-50 text-4xl">🎉</div>
          <h2 className="mt-4 text-xl font-bold">« {created.title} » est en ligne</h2>
          <p className="mt-1 text-sm text-neutral-500">Partagez votre lien pour recevoir des candidatures. Elles seront analysées et classées automatiquement.</p>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 text-left text-sm ring-1 ring-black/5">
            <span className="flex-1 truncate text-neutral-600">{link}</span>
            <button onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); toast('Lien copié') }} className="flex items-center gap-1 rounded-xl px-3 py-2 font-semibold text-white" style={{ background: BLUE }}><Copy size={15} /> Copier</button>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Nous recrutons : ${created.title} (${created.city}, ${created.contract}). Postulez ici : ${link}`)}`} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-3.5 font-semibold text-white">
            <MessageCircle size={18} /> Partager sur WhatsApp
          </a>
          <button onClick={() => navigate(hrefOf(service, `r/${created.id}`), { replace: true })} className="mt-3 w-full rounded-2xl border-2 bg-white py-3 font-semibold" style={{ borderColor: BLUE, color: BLUE }}>Voir les candidatures</button>
        </div>
      </>
    )

  return (
    <>
      <ServiceSubHeader service={service} title="Créer une annonce" />
      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700">Modèles prêts à l’emploi</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {templates.map((t) => (
              <button key={t} onClick={() => { setTitle(t); setDescription(`Nous recherchons un(e) ${t.toLowerCase()} motivé(e) pour renforcer notre équipe à ${city}. Vous êtes rigoureux(se), organisé(e) et avez le sens du service.`) }} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-medium ring-1 ring-neutral-200">{t}</button>
            ))}
          </div>
        </div>
        <input className={field} placeholder="Intitulé du poste" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className={field} value={contract} onChange={(e) => setContract(e.target.value)}>{['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <textarea rows={5} className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-[#0b5cf0]" placeholder="Description du poste, missions, profil recherché…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button
          disabled={!title.trim()}
          onClick={() => { tap(); setCreated(createRecruitment({ title: title.trim(), city, contract, description })); toast('Annonce publiée') }}
          className="w-full rounded-2xl py-4 font-semibold text-white shadow-lg disabled:opacity-50"
          style={{ background: BLUE }}
        >
          Publier l’annonce
        </button>
      </div>
    </>
  )
}

const POOL = [
  ['Arnaud O.', '👨🏾', 'Profil solide, expérience similaire'],
  ['Christelle M.', '👩🏾', 'Très bonne présentation, motivée'],
  ['Brice N.', '🧑🏾', 'Compétences proches du poste'],
  ['Nadège E.', '👩🏾‍🦱', 'Expérience courte mais pertinente'],
  ['Kevin B.', '👨🏾‍🦱', 'Profil junior à former'],
]

function CandidateRow({ c, service }: { c: Candidate; service: Service }) {
  return (
    <Link to={hrefOf(service, `candidat/${c.id}`)} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-2xl">{c.avatar}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">{c.name} <Score value={c.score} /></p>
        <p className="truncate text-xs text-neutral-500">{c.experience} · {c.summary}</p>
      </div>
      {c.status === 'présélectionné' && <CheckCircle2 size={18} className="text-neam-600" />}
      {c.status === 'écarté' && <X size={18} className="text-neutral-400" />}
    </Link>
  )
}

export function GuruRecruitment({ service }: { service: Service }) {
  const { rid } = useParams()
  const { recruitments, candidates, addCandidates, toast } = useApp()
  const [tab, setTab] = useState<'all' | 'relevant' | 'review'>('all')
  const r = recruitments.find((x) => x.id === rid)
  if (!r) return <Navigate to={hrefOf(service, 'tableau')} replace />
  const list = candidates.filter((c) => c.recruitmentId === r.id).sort((a, b) => b.score - a.score)
  const shown = list.filter((c) => (tab === 'relevant' ? c.score >= 80 : tab === 'review' ? c.status === 'nouveau' : true))

  const simulate = () => {
    addCandidates(
      POOL.map(([name, avatar, summary], i) => ({
        id: `c${Date.now()}${i}`,
        recruitmentId: r.id,
        name,
        avatar,
        score: [92, 84, 76, 63, 48][i],
        city: r.city,
        experience: ['4 ans d’expérience', '2 ans d’expérience', '1 an d’expérience', '6 mois d’expérience', 'Débutant'][i],
        degree: 'Bac+2',
        summary,
        strengths: ['Expérience dans un poste similaire', 'Disponibilité immédiate', `Mobilité sur ${r.city}`].slice(0, 3 - Math.floor(i / 2)),
        improvements: i < 2 ? ['Prétentions salariales à valider'] : ['Expérience à approfondir', 'Compétences techniques à renforcer'],
        status: 'nouveau' as const,
      })),
    )
    toast('5 nouvelles candidatures analysées')
  }

  return (
    <>
      <ServiceSubHeader service={service} title={r.title} />
      <div className="p-4">
        <p className="text-sm text-neutral-500">{list.length} candidature{list.length > 1 ? 's' : ''} · {r.city} · {r.contract}</p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-[#e8f1ff] p-1 text-xs font-semibold">
          {([['all', `Tous (${list.length})`], ['relevant', `Pertinents (${list.filter((c) => c.score >= 80).length})`], ['review', `À examiner (${list.filter((c) => c.status === 'nouveau').length})`]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-xl py-2 ${tab === id ? 'bg-white shadow' : 'text-[#1b3f8f]'}`} style={tab === id ? { color: BLUE } : undefined}>{l}</button>
          ))}
        </div>
        <div className="mt-3 space-y-2">{shown.map((c) => <CandidateRow key={c.id} c={c} service={service} />)}</div>
        {!list.length && (
          <div className="mt-6 rounded-3xl bg-white p-6 text-center ring-1 ring-black/5">
            <div className="text-5xl">📬</div>
            <p className="mt-2 font-semibold">En attente de candidatures</p>
            <p className="text-sm text-neutral-500">Partagez le lien de votre annonce pour recevoir vos premiers profils.</p>
            <button onClick={simulate} className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: BLUE }}>Simuler des candidatures (démo)</button>
          </div>
        )}
      </div>
    </>
  )
}

export function GuruCandidates({ service }: { service: Service }) {
  const { candidates, recruitments } = useApp()
  const sorted = [...candidates].sort((a, b) => b.score - a.score)
  return (
    <>
      <ServiceSubHeader service={service} title="Vivier de talents" />
      <div className="space-y-2 p-4">
        {sorted.map((c) => (
          <div key={c.id}>
            <p className="mb-1 pl-1 text-[11px] font-medium text-neutral-400">{recruitments.find((r) => r.id === c.recruitmentId)?.title}</p>
            <CandidateRow c={c} service={service} />
          </div>
        ))}
      </div>
    </>
  )
}

export function GuruCandidate({ service }: { service: Service }) {
  const { cid } = useParams()
  const back = useBack(hrefOf(service, 'tableau'))
  const { candidates, setCandidateStatus, toast } = useApp()
  const [tab, setTab] = useState<'resume' | 'cv' | 'ia' | 'notes'>('ia')
  const [notes, setNotes] = useState('')
  const c = candidates.find((x) => x.id === cid)
  if (!c) return <Navigate to={hrefOf(service, 'tableau')} replace />
  const label = c.score >= 80 ? 'Candidat très pertinent' : c.score >= 65 ? 'Candidat intéressant' : 'Profil à approfondir'
  return (
    <>
      <ServiceSubHeader service={service} title="Profil candidat" />
      <div className="p-4">
        <button onClick={back} className="flex items-center gap-1 text-xs font-medium" style={{ color: BLUE }}><ArrowLeft size={14} /> Retour à la liste</button>
        <div className="mt-3 flex items-center gap-4">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#eef4ff] text-5xl">{c.avatar}</span>
          <div>
            <p className="flex items-center gap-2 text-xl font-bold">{c.name} <Score value={c.score} big /></p>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: scoreColor(c.score), background: scoreBg(c.score) }}>{label}</span>
            <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><MapPin size={12} /> {c.city}</span>
              <span className="flex items-center gap-1"><Briefcase size={12} /> {c.experience}</span>
              <span className="flex items-center gap-1"><GraduationCap size={12} /> {c.degree}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <a href="mailto:" onClick={() => toast(`Message envoyé à ${c.name}`)} className="flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-[clamp(11px,3.4vw,14px)] font-semibold text-white" style={{ background: BLUE }}><Mail size={16} className="shrink-0" /> Contacter</a>
          <button onClick={() => { setCandidateStatus(c.id, 'présélectionné'); toast('Candidat présélectionné') }} className={`rounded-xl px-1 py-2.5 text-[clamp(11px,3.4vw,14px)] font-semibold leading-tight ${c.status === 'présélectionné' ? 'bg-neam-600 text-white' : 'bg-neam-50 text-neam-700'}`}><span className="sm:hidden">Retenir</span><span className="hidden sm:inline">Présélectionner</span></button>
          <button onClick={() => { setCandidateStatus(c.id, 'écarté'); toast('Candidature écartée') }} className={`rounded-xl px-1 py-2.5 text-[clamp(11px,3.4vw,14px)] font-semibold leading-tight ${c.status === 'écarté' ? 'bg-neutral-700 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Écarter</button>
        </div>

        <div className="mt-5 grid grid-cols-4 border-b border-neutral-200 text-sm">
          {([['resume', 'Résumé'], ['cv', 'CV'], ['ia', 'Analyse IA'], ['notes', 'Notes']] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`-mb-px border-b-2 py-2.5 font-medium ${tab === id ? '' : 'border-transparent text-neutral-500'}`} style={tab === id ? { borderColor: BLUE, color: BLUE } : undefined}>{l}</button>
          ))}
        </div>

        {tab === 'ia' && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <p className="text-xs text-neutral-500">Score global</p>
                <p className="text-4xl font-extrabold" style={{ color: scoreColor(c.score) }}>{c.score} %</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} /></div>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <p className="text-sm font-semibold">Points forts</p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-700">{c.strengths.map((s) => <li key={s} className="flex gap-1.5"><CheckCircle2 size={14} className="shrink-0 fill-neam-500 text-white" /> {s}</li>)}</ul>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <p className="text-sm font-semibold">Points à améliorer</p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-700">{c.improvements.map((s) => <li key={s} className="flex gap-1.5"><span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-400" /> {s}</li>)}</ul>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-[#eef4ff] p-4">
              <Sparkles size={22} style={{ color: BLUE }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: BLUE }}>Recommandation de l’IA</p>
                <p className="mt-1 text-xs text-neutral-700">
                  {c.score >= 80
                    ? 'Profil fortement recommandé pour ce poste. Le candidat possède une expérience pertinente, des compétences alignées et un bon potentiel d’évolution.'
                    : c.score >= 65
                      ? 'Profil intéressant à rencontrer : plusieurs compétences clés sont présentes, quelques points restent à vérifier en entretien.'
                      : 'Profil éloigné des attentes du poste. À considérer pour un poste junior ou après formation.'}
                </p>
              </div>
            </div>
          </div>
        )}
        {tab === 'resume' && <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-neutral-700 ring-1 ring-black/5">{c.name} — {c.experience}. {c.summary}. Basé(e) à {c.city}, niveau {c.degree}.</p>}
        {tab === 'cv' && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5">
            <p className="flex items-center gap-2 font-semibold"><FileText size={16} style={{ color: BLUE }} /> CV_{c.name.replace(/\W+/g, '_')}.pdf</p>
            <p className="mt-2 text-neutral-600">Expérience : {c.experience}<br />Formation : {c.degree}<br />Compétences : {c.strengths.join(', ')}</p>
          </div>
        )}
        {tab === 'notes' && (
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vos notes d’entretien (privées)…" className="mt-4 w-full rounded-2xl bg-white p-4 text-sm outline-none ring-1 ring-black/5" />
        )}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400"><BarChart3 size={13} /> Analyse indicative — la décision finale vous appartient.</p>
      </div>
    </>
  )
}
