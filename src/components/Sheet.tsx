import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  // Portail : évite que les ancêtres animés (transform) cassent le position: fixed
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fermer" className="absolute inset-0 animate-[fade-up_.2s_both] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-lg animate-sheet overflow-y-auto rounded-t-[28px] bg-white pb-safe shadow-2xl lg:animate-pop lg:rounded-[28px]">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 pb-2 pt-3 backdrop-blur">
          <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-neutral-200 lg:hidden" />
          <h3 className="mt-3 text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="mt-3 grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
