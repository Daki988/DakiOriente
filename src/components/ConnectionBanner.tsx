import { RefreshCw, WifiOff } from 'lucide-react'
import { retryAll, useConnectionTrouble } from '../live/realtime'

/** Bandeau affiché quand le serveur NEAM ne répond pas : les écrans gardent leurs dernières données. */
export function ConnectionBanner() {
  const trouble = useConnectionTrouble()
  if (!trouble) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-400 px-4 pb-2 pt-[calc(var(--safe-top)+8px)] text-sm font-semibold text-amber-950 shadow">
      <WifiOff size={16} aria-hidden="true" />
      <span>Connexion difficile : les informations peuvent dater.</span>
      <button onClick={retryAll} className="ml-1 inline-flex min-h-9 items-center gap-1 rounded-full bg-amber-950/10 px-3 underline-offset-2 hover:underline">
        <RefreshCw size={14} aria-hidden="true" /> Réessayer
      </button>
    </div>
  )
}
