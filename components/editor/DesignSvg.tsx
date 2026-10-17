import type { RSide } from "@/lib/design/layout";

/**
 * Dessine une face calculée. `trim` : vue coupée à la zone finie (aperçus) ;
 * sinon fond perdu visible avec le trait de coupe (éditeur).
 */
export function DesignSvg({ side, trim = false, className, title }: { side: RSide; trim?: boolean; className?: string; title?: string }) {
  const b = side.bleed;
  const vb = trim ? `0 0 ${side.w} ${side.h}` : `${-b} ${-b} ${side.w + 2 * b} ${side.h + 2 * b}`;
  const id = `clip-${Math.round(side.w)}x${Math.round(side.h)}`;
  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id={id}><rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-b} y={-b} width={side.w + 2 * b} height={side.h + 2 * b} fill={side.bg} />
        {side.items.map((it, i) => {
          if (it.t === "rect") return <rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} rx={it.r} fill={it.fill} opacity={it.opacity} />;
          if (it.t === "ellipse") return <ellipse key={i} cx={it.cx} cy={it.cy} rx={it.rx} ry={it.ry} fill={it.fill} opacity={it.opacity} />;
          if (it.t === "image") return <image key={i} href={it.src} x={it.x} y={it.y} width={it.w} height={it.h} preserveAspectRatio="xMidYMid meet" />;
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
