import type { RSide } from "@/lib/design/layout";
import type { MockupKind } from "@/lib/design/templates";
import { DesignSvg } from "./DesignSvg";

const shadow = "drop-shadow(0 18px 22px rgba(20,16,10,.28)) drop-shadow(0 3px 4px rgba(20,16,10,.25))";

/** Le design, coupé à la zone finie, avec une légère lumière de papier. */
function Print({ side, className = "", radius = 0, style }: { side: RSide; className?: string; radius?: number | string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${side.w} / ${side.h}`, borderRadius: radius, ...style }}>
      <DesignSvg side={side} trim className="block size-full" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(125deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,.06) 100%)" }} />
    </div>
  );
}

function Stage({ children, bg, label }: { children: React.ReactNode; bg: string; label: string }) {
  return (
    <figure className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden" style={{ background: bg }} aria-label={label}>
      {children}
    </figure>
  );
}

const desk = "radial-gradient(120% 90% at 30% 20%, #efe7da 0%, #ddd1bf 55%, #c9b9a2 100%)";
const room = "linear-gradient(#ecebe7 0 72%, #cfc8bd 72% 100%)";
const wall = "repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 1px, transparent 1px 68px), linear-gradient(#d9d3c9, #cbc3b6)";

/** Aperçus réalistes, sans photo : mise en scène CSS du design réel. */
export function Mockup({ rounded = true, ...p }: { kind: MockupKind; sides: RSide[]; tshirt?: "white" | "black"; rounded?: boolean }) {
  return <div className={rounded ? "overflow-hidden rounded-2xl" : ""}><Scene {...p} /></div>;
}

function Scene({ kind, sides, tshirt = "white" }: { kind: MockupKind; sides: RSide[]; tshirt?: "white" | "black" }) {
  const [a, b] = sides;
  const portrait = a.h > a.w;

  if (kind === "cards") {
    return (
      <Stage bg={desk} label="Cartes posées sur un bureau">
        <div className="relative w-[78%]" style={{ perspective: 1100 }}>
          <div style={{ transform: "rotateX(38deg) rotateZ(-9deg)", transformStyle: "preserve-3d" }} className="relative">
            {b && <Print side={b} className="absolute left-[30%] top-[-30%] w-[62%]" radius={6} style={{ filter: shadow, transform: "rotate(14deg)" }} />}
            <Print side={a} className="relative w-[70%]" radius={6} style={{ filter: shadow }} />
            <div className="absolute left-[4%] top-[8%] -z-10 w-[70%] rounded-md bg-white/70" style={{ aspectRatio: `${a.w}/${a.h}`, filter: shadow, transform: "translate(6px,8px)" }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "invite") {
    return (
      <Stage bg="radial-gradient(110% 90% at 50% 10%, #f6efe6, #e2d5c4)" label="Invitation devant son enveloppe">
        <div className="relative w-[70%]" style={{ perspective: 1200 }}>
          <svg viewBox="0 0 160 110" className="absolute inset-x-[-6%] top-[18%] w-[112%]" style={{ filter: shadow }} aria-hidden="true">
            <rect width="160" height="110" rx="3" fill="#f8f4ee" />
            <path d="M0 0 L80 58 L160 0" fill="none" stroke="#e3dbcf" strokeWidth="1.2" />
          </svg>
          <Print side={a} className={`relative mx-auto ${portrait ? "w-[52%]" : "w-[86%]"}`} radius={3} style={{ filter: shadow, transform: "rotateX(8deg) rotateZ(-3deg) translateY(-6%)" }} />
        </div>
      </Stage>
    );
  }

  if (kind === "rollup") {
    return (
      <Stage bg={room} label="Roll-up déployé dans un salon">
        <div className="flex items-end gap-[5%]" style={{ width: "100%", justifyContent: "center" }}>
          <div className="relative" style={{ width: `${(64 * a.w) / (a.h + a.w * 0.06)}%`, aspectRatio: `${a.w} / ${a.h + a.w * 0.06}` }}>
            <Print side={a} className="absolute inset-x-0 top-0 w-full" style={{ filter: shadow }} />
            <div className="absolute inset-x-[-9%] bottom-0 h-[2.6%] rounded-sm" style={{ background: "linear-gradient(#c9ccd1,#8e939b)", boxShadow: "0 6px 10px rgba(0,0,0,.25)" }} />
            <div className="absolute -bottom-1.5 left-1/2 h-3 w-[150%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-sm" />
          </div>
          <svg viewBox="0 0 40 170" className="w-[11%] opacity-25" aria-hidden="true"><circle cx="20" cy="14" r="11" fill="#333" /><path d="M6 32 Q20 26 34 32 L37 100 L30 100 L29 168 L22 168 L20 108 L18 168 L11 168 L10 100 L3 100 Z" fill="#333" /></svg>
        </div>
      </Stage>
    );
  }

  if (kind === "banner" || kind === "wall") {
    const holes = kind === "banner";
    return (
      <Stage bg={wall} label={holes ? "Bâche fixée sur un mur" : "Impression posée sur un mur"}>
        <div className="relative" style={{ width: a.w / a.h > 1.2 ? "84%" : portrait ? "38%" : "62%" }}>
          <Print side={a} className="w-full" radius={holes ? 0 : 4} style={{ filter: shadow }} />
          {holes && (
            <>
              {[0, 0.25, 0.5, 0.75, 1].flatMap((p) => ["top", "bottom"].map((edge) => (
                <span key={`${edge}${p}`} className="absolute size-2 -translate-x-1/2 rounded-full border-2 border-[#9aa0a6] bg-[#e9ecef]" style={{ left: `${3 + p * 94}%`, [edge]: 5 }} />
              )))}
            </>
          )}
        </div>
      </Stage>
    );
  }

  if (kind === "sticker") {
    return (
      <Stage bg="linear-gradient(135deg,#d7dbe0,#b9bfc7)" label="Sticker collé sur un ordinateur portable">
        <div className="relative grid aspect-[16/10] w-[82%] place-items-center rounded-[14px]" style={{ background: "linear-gradient(140deg,#3b3f46,#24272c)", boxShadow: "0 22px 40px rgba(0,0,0,.35)" }}>
          <div className="rounded-[18%] bg-white p-[2.2%]" style={{ width: "34%", filter: shadow, transform: "rotate(-8deg)" }}>
            <Print side={a} className="w-full" radius="14%" />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "tshirt") {
    const fill = tshirt === "black" ? "#1f1f22" : "#f4f4f2";
    return (
      <Stage bg="radial-gradient(100% 80% at 50% 20%, #f1efea, #dcd7cd)" label="T-shirt imprimé">
        <div className="relative h-[90%]" style={{ aspectRatio: "1 / 1.05" }}>
          <svg viewBox="0 0 200 210" className="absolute inset-0 size-full" style={{ filter: "drop-shadow(0 14px 18px rgba(0,0,0,.25))" }} aria-hidden="true">
            <path d="M62 12 Q100 34 138 12 L190 40 L172 84 L150 74 L150 204 L50 204 L50 74 L28 84 L10 40 Z" fill={fill} />
            <path d="M62 12 Q100 34 138 12" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="3" />
          </svg>
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2" style={{ width: portrait ? "30%" : "42%" }}>
            <Print side={a} className="w-full" style={{ mixBlendMode: tshirt === "black" ? "normal" : "multiply" }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "box") {
    return (
      <Stage bg="radial-gradient(110% 90% at 40% 20%, #f3f0ea, #d9d2c6)" label="Boîte personnalisée">
        <div className="relative w-[40%]" style={{ perspective: 900 }}>
          <div className="relative" style={{ transformStyle: "preserve-3d", transform: "rotateX(-14deg) rotateY(-32deg)" }}>
            <Print side={a} className="w-full" style={{ boxShadow: "0 24px 30px rgba(0,0,0,.25)" }} />
            <div className="absolute right-0 top-0 h-full origin-right" style={{ width: "40%", transform: "rotateY(-90deg)", background: a.bg, filter: "brightness(.78)" }} />
            <div className="absolute left-0 top-0 w-full origin-top" style={{ height: `${40 * a.w / a.h}%`, transform: "rotateX(-90deg)", background: a.bg, filter: "brightness(1.08)" }} />
          </div>
        </div>
      </Stage>
    );
  }

  /** Largeur en % de la scène (4:3) pour que l'impression occupe au plus `maxH` de sa hauteur. */
  const fitW = (maxW: number, maxH: number) => Math.min(maxW, (maxH * 0.75 * a.w) / a.h);

  if (kind === "poster") {
    return (
      <Stage bg={wall} label="Affiche fixée au mur">
        <div className="relative" style={{ width: `${fitW(62, 80)}%`, transform: "rotate(-1.5deg)" }}>
          <Print side={a} className="w-full" style={{ filter: shadow }} />
          <span className="absolute -top-2 left-[8%] h-5 w-[22%] rotate-[-6deg] bg-white/60 shadow-sm" />
          <span className="absolute -top-2 right-[8%] h-5 w-[22%] rotate-[5deg] bg-white/60 shadow-sm" />
        </div>
      </Stage>
    );
  }

  if (kind === "lanyard") {
    return (
      <Stage bg="radial-gradient(110% 90% at 50% 10%, #eef0f3, #cdd3da)" label="Badge porté au cordon">
        <div className="relative flex h-full w-full flex-col items-center">
          <svg viewBox="0 0 100 60" className="w-[46%]" aria-hidden="true">
            <path d="M8 0 L44 52 M92 0 L56 52" stroke="#1f2937" strokeWidth="6" fill="none" strokeLinecap="round" />
            <rect x="42" y="48" width="16" height="10" rx="2" fill="#9aa0a6" />
          </svg>
          <Print side={a} className="-mt-[1%]" radius={8} style={{ width: `${portrait ? 26 : 40}%`, filter: shadow, transform: "rotate(-3deg)" }} />
        </div>
      </Stage>
    );
  }

  if (kind === "bottle") {
    return (
      <Stage bg="linear-gradient(#f3efe8 0 70%, #ddd3c4 70%)" label="Étiquette sur une bouteille">
        <div className="relative h-[86%]" style={{ aspectRatio: "1 / 2.4" }}>
          <svg viewBox="0 0 100 240" className="absolute inset-0 size-full" style={{ filter: "drop-shadow(0 16px 18px rgba(0,0,0,.25))" }} aria-hidden="true">
            <rect x="38" y="0" width="24" height="18" rx="3" fill="#2b2b2b" />
            <path d="M40 18 H60 V48 Q92 64 92 100 V228 Q92 240 80 240 H20 Q8 240 8 228 V100 Q8 64 40 48 Z" fill="#7a4a1e" />
            <path d="M18 104 V226" stroke="rgba(255,255,255,.25)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2" style={{ width: "78%" }}>
            <Print side={a} className="w-full" radius={4} />
            <div className="pointer-events-none absolute inset-0 rounded" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.28), rgba(255,255,255,.12) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,.3))" }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "vehicle") {
    return (
      <Stage bg="linear-gradient(#e4ecf2 0 66%, #b9b4ab 66%)" label="Adhésif sur un véhicule utilitaire">
        <div className="relative w-[88%]" style={{ aspectRatio: "2.3 / 1" }}>
          <svg viewBox="0 0 230 100" className="absolute inset-0 size-full" style={{ filter: "drop-shadow(0 12px 12px rgba(0,0,0,.22))" }} aria-hidden="true">
            <path d="M6 20 Q6 8 18 8 H150 Q160 8 166 16 L196 46 H214 Q224 46 224 58 V82 H6 Z" fill="#f7f7f5" />
            <path d="M156 18 L186 46 H156 Z" fill="#9fb5c4" />
            <circle cx="50" cy="84" r="14" fill="#1f1f22" /><circle cx="50" cy="84" r="6" fill="#9aa0a6" />
            <circle cx="186" cy="84" r="14" fill="#1f1f22" /><circle cx="186" cy="84" r="6" fill="#9aa0a6" />
          </svg>
          <div className="absolute left-[6%] top-[16%] grid h-[56%] w-[58%] place-items-center overflow-hidden">
            <Print side={a} className="max-h-full max-w-full" style={a.w / a.h > 58 / 56 * 2.3 ? { width: "100%" } : { height: "100%" }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "window") {
    return (
      <Stage bg="linear-gradient(#cfc8bd, #b8b0a3)" label="Lettrage sur une vitrine">
        <div className="relative grid h-[84%] w-[86%] place-items-center rounded-sm border-[10px] border-[#2b2b2e]" style={{ background: "linear-gradient(160deg, #3d5a73, #1f3347 60%, #2c4660)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 38%, transparent 46%)" }} />
          <Print side={a} style={{ width: `${Math.min(80, (60 * a.w) / a.h)}%`, opacity: 0.96 }} />
        </div>
      </Stage>
    );
  }

  if (kind === "folder") {
    return (
      <Stage bg={desk} label="Chemise à rabat">
        <div className="relative" style={{ width: `${fitW(40, 78)}%`, perspective: 1100 }}>
          <div style={{ transform: "rotateX(22deg) rotateZ(-4deg)" }}>
            <div className="absolute inset-0 translate-x-[7%] translate-y-[-3%] bg-[#f4f1ea]" style={{ filter: shadow }} />
            <div className="absolute inset-x-[4%] top-[-5%] h-[30%] bg-white" />
            <Print side={a} className="relative w-full" style={{ filter: shadow }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "brochure") {
    return (
      <Stage bg={desk} label="Brochures en éventail">
        <div className="relative" style={{ width: `${fitW(40, 74)}%`, perspective: 1200 }}>
          <div style={{ transform: "rotateX(26deg)" }}>
            {[-18, -9].map((r) => (
              <Print key={r} side={a} className="absolute inset-0 w-full origin-bottom" style={{ filter: shadow, transform: `rotate(${r}deg)` }} />
            ))}
            <Print side={a} className="relative w-full origin-bottom" style={{ filter: shadow, transform: "rotate(2deg)" }} />
          </div>
        </div>
      </Stage>
    );
  }

  if (kind === "plaque") {
    return (
      <Stage bg={wall} label="Plaque à l’entrée">
        <div className="relative" style={{ width: `${fitW(64, 70)}%` }}>
          <div className="rounded-[4px] p-[2.5%]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,.85), rgba(255,255,255,.45))", boxShadow: "0 20px 30px rgba(0,0,0,.25)" }}>
            <Print side={a} className="w-full" radius={2} />
          </div>
          {[["2.5%", "2.5%"], ["2.5%", "auto"], ["auto", "2.5%"], ["auto", "auto"]].map(([t, l], i) => (
            <span key={i} className="absolute size-3 rounded-full border border-[#8b9096] bg-[radial-gradient(circle_at_35%_35%,#f5f5f5,#a7acb2)]"
              style={{ top: t === "auto" ? undefined : t, bottom: t === "auto" ? "2.5%" : undefined, left: l === "auto" ? undefined : l, right: l === "auto" ? "2.5%" : undefined }} />
          ))}
        </div>
      </Stage>
    );
  }

  // Flyers, affiches, papeterie : feuilles posées sur une table.
  return (
    <Stage bg={desk} label="Impression posée sur une table">
      <div className="relative" style={{ width: portrait ? "46%" : "70%", perspective: 1200 }}>
        <div style={{ transform: "rotateX(28deg) rotateZ(-5deg)" }}>
          <div className="absolute inset-0 bg-white" style={{ transform: "rotate(7deg) translate(6%,2%)", filter: shadow }} />
          <Print side={a} className="relative w-full" style={{ filter: shadow }} />
        </div>
      </div>
    </Stage>
  );
}
