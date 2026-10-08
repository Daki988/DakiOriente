"use client";
import { motion } from "framer-motion";

export function Radar({ values, size = 340 }: { values: Record<string, number>; size?: number }) {
  const codes = Object.keys(values);
  const c = size / 2, r = size / 2 - 40;
  const pt = (k: number, v: number) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / codes.length;
    return [c + r * v * Math.cos(a), c + r * v * Math.sin(a)];
  };
  const poly = codes.map((code, k) => pt(k, values[code] / 100).join(",")).join(" ");
  const max = Math.max(...Object.values(values));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label="Profil RIASEC">
      {[0.25, 0.5, 0.75, 1].map((l) => <polygon key={l} points={codes.map((_, k) => pt(k, l).join(",")).join(" ")} fill="none" stroke="#dbe3f7" />)}
      {codes.map((code, k) => { const [x, y] = pt(k, 1); return <line key={code} x1={c} y1={c} x2={x} y2={y} stroke="#dbe3f7" />; })}
      <motion.polygon points={poly} fill="rgba(26,71,245,.22)" stroke="#1a47f5" strokeWidth={3} strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0, scale: 0.4 }} animate={{ pathLength: 1, opacity: 1, scale: 1 }} style={{ transformOrigin: "center" }}
        transition={{ duration: 1.2, ease: "easeInOut" }} />
      {codes.map((code, k) => {
        const [x, y] = pt(k, values[code] / 100);
        const [lx, ly] = pt(k, 1.17);
        return (
          <g key={code}>
            <motion.circle cx={x} cy={y} r={5} fill="#fff" stroke="#1a47f5" strokeWidth={3} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + k * 0.08, type: "spring" }} />
            <text x={lx} y={ly + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={values[code] === max ? "#1a47f5" : "#6b7493"}>{code}</text>
          </g>
        );
      })}
    </svg>
  );
}
