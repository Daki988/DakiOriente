import { Cpu, Leaf, LayoutGrid, Plus, Printer, ShoppingCart, Truck, Utensils } from 'lucide-react'
import { NeamMark, NeamWordmark } from './Logo'
import { SERVICES } from '../data/services'

/** Téléphone stylisé affichant l'app NEAM. */
export function PhoneIllustration({ className = '', tilt = -10 }: { className?: string; tilt?: number }) {
  return (
    <div
      className={`relative aspect-[9/18] rounded-[22%/11%] bg-neutral-900 p-[5%] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[18%/9%] bg-neam-hero px-[8%] pt-[18%]">
        <div className="absolute left-1/2 top-[3%] h-[3.5%] w-[32%] -translate-x-1/2 rounded-full bg-black" />
        <NeamMark className="w-[62%]" />
        <NeamWordmark className="mt-[6%] text-[clamp(10px,2.4vw,20px)]" />
        <div className="mt-auto mb-[12%] grid w-full grid-cols-3 gap-[6%]">
          {SERVICES.slice(0, 9).map((s) => (
            <div key={s.id} className="aspect-square rounded-[25%]" style={{ background: s.gradient }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const bubbles = [
  { icon: ShoppingCart, bg: 'linear-gradient(145deg,#ffa21a,#ff6a00)', pos: 'left-[2%] top-[18%]', d: '0s' },
  { icon: Utensils, bg: 'linear-gradient(145deg,#ff4b4b,#e3112f)', pos: 'left-[24%] top-[0%]', d: '.4s' },
  { icon: Truck, bg: 'linear-gradient(145deg,#2fe08d,#089b5a)', pos: 'left-[50%] top-[-4%]', d: '.8s' },
  { icon: Plus, bg: 'linear-gradient(145deg,#2ab4ff,#1361ef)', pos: 'right-[16%] top-[6%]', d: '1.2s' },
  { icon: Printer, bg: 'linear-gradient(145deg,#b05cff,#6a24d6)', pos: 'right-[0%] top-[26%]', d: '1.6s' },
  { icon: LayoutGrid, bg: 'linear-gradient(145deg,#ffcf2e,#ff9a00)', pos: 'right-[12%] top-[48%]', d: '2s' },
  { icon: Cpu, bg: 'linear-gradient(145deg,#12c8ff,#0a63f0)', pos: 'right-[-2%] top-[66%]', d: '2.4s' },
  { icon: Leaf, bg: 'linear-gradient(145deg,#ff5fae,#e0157a)', pos: 'right-[18%] bottom-[2%]', d: '2.8s' },
  { icon: Truck, bg: 'linear-gradient(145deg,#2fe08d,#089b5a)', pos: 'left-[0%] top-[56%]', d: '3.2s' },
]

/** Téléphone entouré des icônes de services flottantes. */
export function PhoneWithBubbles({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[18%] rounded-full bg-neam-400/30 blur-3xl" />
      <PhoneIllustration className="absolute left-1/2 top-[14%] w-[40%] -translate-x-1/2" tilt={-12} />
      {bubbles.map(({ icon: Icon, bg, pos, d }, i) => (
        <span
          key={i}
          className={`absolute grid aspect-square w-[15%] animate-float place-items-center rounded-[28%] text-white shadow-lg ${pos}`}
          style={{ background: bg, animationDelay: d }}
        >
          <Icon className="h-1/2 w-1/2" strokeWidth={2.4} />
        </span>
      ))}
    </div>
  )
}

/** Silhouette de ville (front de mer de Libreville stylisé). */
export function Skyline({ className = '' }: { className?: string }) {
  const b = [
    [0, 52, 14], [16, 38, 10], [28, 60, 16], [46, 30, 12], [60, 70, 14], [76, 44, 10], [88, 56, 18],
    [108, 34, 12], [122, 64, 15], [139, 48, 11], [152, 78, 16], [170, 40, 12], [184, 58, 14], [200, 36, 10],
  ]
  return (
    <svg viewBox="0 0 214 80" preserveAspectRatio="none" className={className} aria-hidden="true">
      {b.map(([x, h, w], i) => (
        <g key={i}>
          <rect x={x} y={80 - h} width={w} height={h} rx="1" fill="currentColor" opacity={0.55 + (i % 3) * 0.15} />
          {Array.from({ length: Math.floor(h / 10) }).map((_, j) => (
            <rect key={j} x={x + 3} y={80 - h + 5 + j * 10} width={w - 6} height="2" fill="white" opacity="0.18" />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** Coursier NEAM en scooter. */
export function Rider({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative">
      <span className="block -scale-x-100 text-[clamp(56px,15vw,96px)] leading-none drop-shadow-[0_18px_14px_rgba(0,0,0,0.35)]">🛵</span>
      <span className="absolute right-[18%] top-[2%] grid aspect-square w-[34%] place-items-center rounded-lg bg-gradient-to-br from-neam-500 to-neam-700 shadow-lg ring-2 ring-white/30">
        <NeamMark mono className="w-[62%]" />
      </span>
      <span className="absolute left-[-30%] top-[42%] h-[4px] w-[30%] rounded-full bg-white/60" />
      <span className="absolute left-[-42%] top-[56%] h-[3px] w-[38%] rounded-full bg-white/40" />
      <span className="absolute left-[-24%] top-[70%] h-[3px] w-[22%] rounded-full bg-white/30" />
      </div>
    </div>
  )
}
