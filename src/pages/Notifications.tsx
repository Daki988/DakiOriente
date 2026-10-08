import { useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { timeAgo } from '../lib/format'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'

export default function Notifications() {
  const { notifications, markAllRead } = useApp()
  // Marque tout comme lu en quittant la page, pour garder l'indicateur visible pendant la lecture
  useEffect(() => () => markAllRead(), [])
  return (
    <PageShell>
      <PageHeader title="Notifications" />
      <ul className="space-y-2 px-4 pt-2">
        {notifications.map((n) => (
          <li key={n.id} className={`flex gap-3 rounded-3xl p-4 ring-1 ring-black/5 ${n.read ? 'bg-white' : 'bg-neam-50'}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{n.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{n.title}</p>
                {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-neam-500" />}
              </div>
              <p className="text-sm text-neutral-600">{n.body}</p>
              <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.ts)}</p>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
