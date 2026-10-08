import type { ReactNode } from 'react'
import { useBack } from '../lib/useBack'
import { ChevronLeft } from 'lucide-react'

export function PageHeader({ title, subtitle, right, dark = false }: { title: string; subtitle?: string; right?: ReactNode; dark?: boolean }) {
  const back = useBack()
  return (
    <header className={`sticky top-0 z-30 pt-safe lg:top-[72px] backdrop-blur-xl ${dark ? 'bg-neam-950/90 text-white' : 'bg-white/90 text-neutral-900'} lg:rounded-t-[28px]`}>
      <div className="flex h-14 items-center gap-2 px-3">
        <button
          onClick={back}
          aria-label="Retour"
          className={`grid h-10 w-10 place-items-center rounded-full ${dark ? 'hover:bg-white/10' : 'hover:bg-neutral-100'}`}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight">{title}</h1>
          {subtitle && <p className={`truncate text-xs ${dark ? 'text-white/60' : 'text-neutral-500'}`}>{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}
