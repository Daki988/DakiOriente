import { useId, useLayoutEffect, useRef, useState } from "react";
import type { RImage, RItem, RPrim, RSide, RTurn } from "@/lib/design/layout";

/** Opacité appliquée forme par forme, comme dans le PDF, pour un rendu identique. */
function Prim({ p, op }: { p: RPrim; op: number }) {
  if (p.k === "rect") return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={p.fill} opacity={op} />;
  if (p.k === "ellipse") return <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} opacity={op} />;
  if (p.k === "ring") return <circle cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke={p.stroke} strokeWidth={p.sw} opacity={op} />;
  return <polygon points={p.pts.join(" ")} fill={p.fill} opacity={op} />;
}

const rotate = (r?: RTurn) => (r ? `rotate(${r.deg} ${r.cx} ${r.cy})` : undefined);

/** Contour d'une image : arche (haut en demi-cercle), coins arrondis ou rectangle. */
export function clipPathD(c: { x: number; y: number; w: number; h: number }, shape?: RImage["shape"]) {
  const { x, y, w, h } = c;
  if (shape?.arch) {
    const r = Math.min(w / 2, h);
    return `M ${x} ${y + h} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
  }
  const r = Math.min(shape?.r ?? 0, w / 2, h / 2);
  if (!r) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/**
 * Dessine une face calculée. `trim` : vue coupée à la zone finie (aperçus) ;
 * sinon fond perdu visible avec les repères (éditeur) : coupe en rouge, zone de sécurité en vert.
 */
/** Sélection au toucher : élément choisi, choix, et glisser (déplacement en mm). */
export type Pick = { selected?: string | null; onPick: (ref: string | null) => void; onDrag?: (ref: string, dx: number, dy: number) => void };

/** Boîte englobante (mm) d'un élément dessiné ; le texte est mesuré dans le DOM. */
function boxOf(it: RItem, el: SVGGraphicsElement | null) {
  if (it.t === "image") return it.clip ?? { x: it.x, y: it.y, w: it.w, h: it.h };
  if (it.t === "group") {
    const xs: number[] = [], ys: number[] = [];
    for (const p of it.prims) {
      if (p.k === "rect") { xs.push(p.x, p.x + p.w); ys.push(p.y, p.y + p.h); }
      else if (p.k === "poly") p.pts.forEach((v, i) => (i % 2 ? ys : xs).push(v));
      else { const rx = p.k === "ring" ? p.r : p.rx, ry = p.k === "ring" ? p.r : p.ry; xs.push(p.cx - rx, p.cx + rx); ys.push(p.cy - ry, p.cy + ry); }
    }
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (el) { const r = el.getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }
  return null;
}

export function DesignSvg({ side, trim = false, guides = true, className, title, pick }: { side: RSide; trim?: boolean; guides?: boolean; className?: string; title?: string; pick?: Pick }) {
  const b = side.bleed;
  const vb = trim ? `0 0 ${side.w} ${side.h}` : `${-b} ${-b} ${side.w + 2 * b} ${side.h + 2 * b}`;
  const id = `clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ ref: string; x: number; y: number } | null>(null);
  const [hl, setHl] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const sel = pick?.selected;
  useLayoutEffect(() => {
    if (!sel) return setHl(null);
    const it = side.items.find((x) => "ref" in x && x.ref === sel);
    const el = svg.current?.querySelector<SVGGraphicsElement>(`[data-ref="${CSS.escape(sel)}"]`) ?? null;
    setHl(it ? boxOf(it, el) : null);
  }, [sel, side]);
  /** Point de l'écran → mm du design. */
  const toMm = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const handlers = pick ? {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      const ref = (e.target as Element).closest("[data-ref]")?.getAttribute("data-ref") ?? null;
      pick.onPick(ref);
      if (ref && pick.onDrag && ref.startsWith("clip:")) {
        drag.current = { ref, ...toMm(e) };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const dr = drag.current;
      if (!dr || !pick.onDrag) return;
      const p = toMm(e);
      pick.onDrag(dr.ref, p.x - dr.x, p.y - dr.y);
      drag.current = { ...dr, ...p };
    },
    onPointerUp: () => { drag.current = null; },
  } : {};
  const refOf = (it: RItem) => ("ref" in it && it.ref ? { "data-ref": it.ref, style: { cursor: "pointer" } } : {});
  return (
    <svg ref={svg} viewBox={vb} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"
      style={pick ? { touchAction: "none", userSelect: "none", WebkitUserSelect: "none" } : undefined} {...handlers}>
      <defs><clipPath id={id}>{trim && side.cut?.shaped && !side.cut.folds ? <path d={side.cut.d} /> : <rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} />}</clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} fill={side.bg} />
        {side.items.map((it, i) => {
          if (it.t === "rect") {
            const gid = `${id}-d${i}`;
            const fill = it.grad ? `url(#${gid})` : it.fill;
            return (
              <g key={i} transform={rotate(it.rot)}>
                {it.grad && (
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2={it.grad.dir === "h" ? 1 : 0} y2={it.grad.dir === "h" ? 0 : 1}>
                      <stop offset="0" stopColor={it.fill} stopOpacity={it.opacity} />
                      <stop offset="1" stopColor={it.grad.to} stopOpacity={it.grad.op} />
                    </linearGradient>
                  </defs>
                )}
                <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={it.r} fill={fill} opacity={it.grad ? 1 : it.opacity}
                  stroke={it.stroke} strokeWidth={it.sw} strokeDasharray={it.dash} />
              </g>
            );
          }
          if (it.t === "ellipse") {
            return <ellipse key={i} cx={it.cx} cy={it.cy} rx={it.rx} ry={it.ry} fill={it.fill} opacity={it.opacity}
              stroke={it.stroke} strokeWidth={it.sw} strokeDasharray={it.dash} transform={rotate(it.rot)} />;
          }
          if (it.t === "group") {
            const cid = `${id}-g${i}`;
            return (
              <g key={i} {...(pick ? refOf(it) : {})}>
                {it.clip && <clipPath id={cid}><rect x={it.clip.x} y={it.clip.y} width={it.clip.w} height={it.clip.h} /></clipPath>}
                <g clipPath={it.clip ? `url(#${cid})` : undefined}>{it.prims.map((p, j) => <Prim key={j} p={p} op={it.opacity} />)}</g>
              </g>
            );
          }
          if (it.t === "image") {
            const img = <image href={it.src} x={it.x} y={it.y} width={it.w} height={it.h} preserveAspectRatio="none" />;
            if (!it.clip) return <g key={i} {...(pick ? refOf(it) : {})}>{img}</g>;
            const cid = `${id}-i${i}`;
            return (
              <g key={i} {...(pick ? refOf(it) : {})}>
                <clipPath id={cid}><path d={clipPathD(it.clip, it.shape)} /></clipPath>
                <g clipPath={`url(#${cid})`}>{img}</g>
              </g>
            );
          }
          const anchor = it.align === "center" ? "middle" : it.align === "right" ? "end" : "start";
          // L'espacement s'ajoute après chaque lettre : on recentre pour qu'il ne décale pas le texte.
          const shift = it.ls ? (it.align === "center" ? it.ls / 2 : it.align === "right" ? it.ls : 0) : 0;
          return (
            <text key={i} {...(pick ? refOf(it) : {})} fontFamily={`np-${it.font}`} fontSize={it.size} fill={it.fill} textAnchor={anchor} letterSpacing={it.ls} transform={rotate(it.rot)}>
              {it.lines.map((l, j) => <tspan key={j} x={it.x + shift} y={l.y}>{l.s}</tspan>)}
            </text>
          );
        })}
      </g>
      {!trim && guides && <g pointerEvents="none"><Guides side={side} /></g>}
      {hl && (
        <rect x={hl.x - 0.6} y={hl.y - 0.6} width={hl.w + 1.2} height={hl.h + 1.2} fill="none" stroke="#6b12ff" pointerEvents="none"
          strokeWidth={Math.max(Math.min(side.w, side.h) / 160, 0.3)} strokeDasharray={`${Math.min(side.w, side.h) / 60}`} />
      )}
    </svg>
  );
}

/**
 * Repères de l'éditeur : coupe (rouge), zone de sécurité (vert), plis (bleu), trous, zones hachurées.
 * Hors de la forme découpée, le design est grisé.
 */
function Guides({ side }: { side: RSide }) {
  const hid = `h-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const u = Math.min(side.w, side.h), sw = Math.max(u / 260, 0.25), dash = `${u / 50} ${u / 80}`;
  const b = side.bleed;
  const c = side.cut;
  if (!c) {
    const safe = Math.min(3, u * 0.06);
    return (
      <g fill="none" strokeWidth={sw} strokeDasharray={dash} aria-hidden="true">
        <rect x={0} y={0} width={side.w} height={side.h} stroke="#e5262b" />
        <rect x={safe} y={safe} width={side.w - 2 * safe} height={side.h - 2 * safe} stroke="#17a34a" />
      </g>
    );
  }
  const big = Math.max(side.w, side.h);
  const fs = Math.max(big / 45, 3);
  return (
    <g aria-hidden="true">
      <defs>
        <pattern id={hid} patternUnits="userSpaceOnUse" width={fs} height={fs} patternTransform="rotate(45)">
          <rect width={fs} height={fs} fill="#ffffff" opacity={0.55} />
          <line x1={0} y1={0} x2={0} y2={fs} stroke="#6b6b76" strokeWidth={fs / 5} />
        </pattern>
      </defs>
      {c.shaped && <path d={`M${-b - 1} ${-b - 1}H${side.w + b + 1}V${side.h + b + 1}H${-b - 1}Z ${c.d}`} fillRule="evenodd" fill="#e9e8ee" opacity={0.92} />}
      {c.hatch?.map((h, i) => (
        <g key={i}>
          <path d={h.d} fill={`url(#${hid})`} stroke="#6b6b76" strokeWidth={sw} />
        </g>
      ))}
      {c.holes?.map((h, i) => <circle key={i} cx={h.cx} cy={h.cy} r={Math.max(h.r, u / 70)} fill="#ffffff" fillOpacity={0.7} stroke="#16141f" strokeWidth={sw} />)}
      {c.focus && <rect x={c.focus.x} y={c.focus.y} width={c.focus.w} height={c.focus.h} fill="none" stroke="#6b12ff" strokeWidth={sw * 3} opacity={0.7} />}
      <g fill="none" strokeWidth={sw} strokeDasharray={dash}>
        {c.folds?.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2f6bff" />)}
        <path d={c.d} stroke="#e5262b" strokeDasharray={c.folds ? undefined : dash} />
        {c.safe && <path d={c.safe} stroke="#17a34a" />}
      </g>
      {c.hatch?.map((h, i) => h.label && <HatchLabel key={i} box={h.box} label={h.label} fs={fs} />)}
    </g>
  );
}

/** Étiquette centrée sur une zone hachurée, verticale si la zone est haute et étroite. */
function HatchLabel({ box, label, fs }: { box: { x: number; y: number; w: number; h: number }; label: string; fs: number }) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const tall = box.h > box.w * 1.5;
  const size = Math.min(fs * 1.1, (tall ? box.w : box.h) * 0.6);
  return (
    <text x={cx} y={cy} fontSize={size} fontFamily="np-sans-bold" fill="#16141f" textAnchor="middle" dominantBaseline="middle"
      transform={tall ? `rotate(-90 ${cx} ${cy})` : undefined} paintOrder="stroke" stroke="#ffffff" strokeWidth={size / 4}>{label}</text>
  );
}
