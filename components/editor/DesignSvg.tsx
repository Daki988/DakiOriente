import { useId } from "react";
import type { RPrim, RSide } from "@/lib/design/layout";

/** Opacité appliquée forme par forme, comme dans le PDF, pour un rendu identique. */
function Prim({ p, op }: { p: RPrim; op: number }) {
  if (p.k === "rect") return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={p.fill} opacity={op} />;
  if (p.k === "ellipse") return <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} opacity={op} />;
  if (p.k === "ring") return <circle cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke={p.stroke} strokeWidth={p.sw} opacity={op} />;
  return <polygon points={p.pts.join(" ")} fill={p.fill} opacity={op} />;
}

/**
 * Dessine une face calculée. `trim` : vue coupée à la zone finie (aperçus) ;
 * sinon fond perdu visible avec le trait de coupe (éditeur).
 */
export function DesignSvg({ side, trim = false, className, title }: { side: RSide; trim?: boolean; className?: string; title?: string }) {
  const b = side.bleed;
  const vb = trim ? `0 0 ${side.w} ${side.h}` : `${-b} ${-b} ${side.w + 2 * b} ${side.h + 2 * b}`;
  const id = `clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id={id}><rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} fill={side.bg} />
        {side.items.map((it, i) => {
          if (it.t === "rect") return <rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} rx={it.r} fill={it.fill} opacity={it.opacity} />;
          if (it.t === "ellipse") return <ellipse key={i} cx={it.cx} cy={it.cy} rx={it.rx} ry={it.ry} fill={it.fill} opacity={it.opacity} />;
          if (it.t === "group") {
            const cid = `${id}-g${i}`;
            return (
              <g key={i}>
                {it.clip && <clipPath id={cid}><rect x={it.clip.x} y={it.clip.y} width={it.clip.w} height={it.clip.h} /></clipPath>}
                <g clipPath={it.clip ? `url(#${cid})` : undefined}>{it.prims.map((p, j) => <Prim key={j} p={p} op={it.opacity} />)}</g>
              </g>
            );
          }
          if (it.t === "image") {
            const img = <image href={it.src} x={it.x} y={it.y} width={it.w} height={it.h} preserveAspectRatio="none" />;
            if (!it.clip) return <g key={i}>{img}</g>;
            const cid = `${id}-i${i}`;
            return (
              <g key={i}>
                <clipPath id={cid}><rect x={it.clip.x} y={it.clip.y} width={it.clip.w} height={it.clip.h} /></clipPath>
                <g clipPath={`url(#${cid})`}>{img}</g>
              </g>
            );
          }
          const anchor = it.align === "center" ? "middle" : it.align === "right" ? "end" : "start";
          return (
            <text key={i} fontFamily={`np-${it.font}`} fontSize={it.size} fill={it.fill} textAnchor={anchor}>
              {it.lines.map((l, j) => <tspan key={j} x={it.x} y={l.y}>{l.s}</tspan>)}
            </text>
          );
        })}
      </g>
      {!trim && (
        <rect x={0} y={0} width={side.w} height={side.h} fill="none" stroke="#ff2e88" strokeWidth={Math.min(side.w, side.h) / 300} strokeDasharray={`${Math.min(side.w, side.h) / 60}`} />
      )}
    </svg>
  );
}
