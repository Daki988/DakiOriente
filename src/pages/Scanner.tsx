import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Flashlight, X } from 'lucide-react'
import { SERVICES, SERVICE_MAP, type ServiceId } from '../data/services'
import { PRODUCT_MAP } from '../data/products'
import { useApp } from '../store/AppContext'
import { tap } from '../lib/native'

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

/**
 * Codes reconnus :
 *  - neam://service/<id>   → ouvre un service
 *  - neam://produit/<id>   → ajoute un produit au panier
 *  - https://…             → affiché à l'utilisateur
 */
export default function Scanner() {
  const navigate = useNavigate()
  const { addToCart, toast } = useApp()
  const video = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'live' | 'denied' | 'unsupported'>('starting')
  const [result, setResult] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)
  const stream = useRef<MediaStream | null>(null)

  const handle = (raw: string) => {
    tap()
    const m = raw.match(/^neam:\/\/(service|produit)\/([\w-]+)/i)
    if (m?.[1] === 'service' && SERVICE_MAP[m[2] as ServiceId]) return navigate(`/service/${m[2]}`, { replace: true })
    if (m?.[1] === 'produit' && PRODUCT_MAP[m[2]]) {
      addToCart(PRODUCT_MAP[m[2]])
      toast(`${PRODUCT_MAP[m[2]].name} ajouté au panier`)
      return navigate('/panier', { replace: true })
    }
    setResult(raw)
  }

  useEffect(() => {
    let stop = false
    let raf = 0
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported')
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stop) return s.getTracks().forEach((t) => t.stop())
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => {})
        }
        setStatus('live')
        const BD = (window as unknown as { BarcodeDetector?: new (o: object) => Detector }).BarcodeDetector
        if (!BD) return
        const detector = new BD({ formats: ['qr_code', 'ean_13', 'code_128'] })
        const loop = async () => {
          if (stop || !video.current) return
          try {
            const codes = await detector.detect(video.current)
            if (codes[0]) return handle(codes[0].rawValue)
          } catch {
            /* image pas prête */
          }
          raf = window.setTimeout(loop, 350)
        }
        loop()
      } catch {
        setStatus('denied')
      }
    })()
    return () => {
      stop = true
      clearTimeout(raf)
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const toggleTorch = async () => {
    const track = stream.current?.getVideoTracks()[0]
    try {
      await track?.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] })
      setTorch(!torch)
    } catch {
      toast('Lampe non disponible sur cet appareil')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      {status !== 'live' && <div className="bg-neam-hero absolute inset-0" />}

      <div className="relative flex items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)]">
        <button onClick={() => navigate(-1)} aria-label="Fermer" className="glass grid h-11 w-11 place-items-center rounded-full"><X size={22} /></button>
        <h1 className="font-semibold">Scanner NEAM</h1>
        <button onClick={toggleTorch} aria-label="Lampe" className={`glass grid h-11 w-11 place-items-center rounded-full ${torch ? 'bg-white/30' : ''}`}><Flashlight size={20} /></button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative aspect-square w-full max-w-[280px]">
          <div className="absolute inset-0 rounded-[32px] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          {['left-0 top-0 border-l-4 border-t-4 rounded-tl-[32px]', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-[32px]', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-[32px]', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-[32px]'].map((c) => (
            <span key={c} className={`absolute h-12 w-12 border-neam-400 ${c}`} />
          ))}
          <span className="absolute inset-x-6 h-0.5 animate-scan rounded-full bg-neam-400 shadow-[0_0_16px_4px_rgba(34,216,132,0.6)]" />
          {status !== 'live' && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <Camera className="mx-auto h-10 w-10 text-white/70" />
                <p className="mt-2 px-6 text-sm text-white/80">
                  {status === 'starting' && 'Activation de la caméra…'}
                  {status === 'denied' && 'Autorisez l’accès à la caméra pour scanner.'}
                  {status === 'unsupported' && 'Caméra indisponible sur cet appareil.'}
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-8 max-w-xs text-center text-sm text-white/80">Scannez un QR code NEAM pour payer, ouvrir un service ou retrouver un produit.</p>
      </div>

      <div className="relative px-4 pb-[calc(var(--safe-bottom)+20px)]">
        <p className="mb-2 text-center text-xs text-white/60">Démo : simuler un scan</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => handle(`neam://service/${s.id}`)} className="glass shrink-0 rounded-full px-4 py-2 text-xs font-medium">
              {s.visual[0]} {s.short}
            </button>
          ))}
          <button onClick={() => handle('neam://produit/f1')} className="glass shrink-0 rounded-full px-4 py-2 text-xs font-medium">🍲 Produit</button>
        </div>
      </div>

      {result && (
        <div className="absolute inset-x-4 bottom-[calc(var(--safe-bottom)+90px)] animate-pop rounded-3xl bg-white p-4 text-neutral-900 shadow-2xl">
          <p className="text-xs font-semibold uppercase text-neam-600">Code détecté</p>
          <p className="mt-1 break-all text-sm">{result}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setResult(null)} className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-semibold">Rescanner</button>
            {/^https?:\/\//.test(result) && (
              <a href={result} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-neam-600 py-2.5 text-center text-sm font-semibold text-white">Ouvrir</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
