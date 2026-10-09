"use client";
// Carte schématique légère (sans tuiles externes) : positions arrondies ~500 m, épingles de prix et établissement.
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { money } from "@/components/app/kit";

export type Pin = { id: string; lat: number; lng: number; label: string; active?: boolean };

export function PseudoMap({ pins, school, onPin, hovered, className = "", caption, osm }: {
  pins: Pin[]; school?: { lat: number; lng: number; label: string } | null; onPin?: (id: string) => void; hovered?: string | null; className?: string; caption?: string; osm?: { lat: number; lng: number } | null;
}) {
  const pts = [...pins.map((p) => [p.lat, p.lng]), ...(school ? [[school.lat, school.lng]] : [])];
  const W = 400, H = 400, pad = 90;
  let minLat = Math.min(...pts.map((p) => p[0])), maxLat = Math.max(...pts.map((p) => p[0]));
  let minLng = Math.min(...pts.map((p) => p[1])), maxLng = Math.max(...pts.map((p) => p[1]));
  if (!pts.length) { minLat = maxLat = 0; minLng = maxLng = 0; }
  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.01);
  const cLat = (minLat + maxLat) / 2, cLng = (minLng + maxLng) / 2;
  const x = (lng: number) => W / 2 + ((lng - cLng) / span) * (W - 2 * pad);
  const y = (lat: number) => H / 2 - ((lat - cLat) / span) * (H - 2 * pad);
  const sx = school ? x(school.lng) : W / 2, sy = school ? y(school.lat) : H / 2;
  return (
    <div className={`relative overflow-hidden rounded-[22px] border border-slate-200/70 bg-[#eef2fb] ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width={W} height={H} fill="#eef2fb" />
        <rect x="250" y="210" width="60" height="50" rx="8" fill="#d5ecdf" />
        <rect x="40" y="40" width="70" height="44" rx="8" fill="#d5ecdf" />
        <path d="M-10 120 C 120 100, 260 140, 410 110" stroke="#fff" strokeWidth="14" fill="none" />
        <path d="M-10 300 C 140 280, 240 330, 410 290" stroke="#fff" strokeWidth="10" fill="none" />
        <path d="M90 -10 C 110 140, 70 260, 120 410" stroke="#fff" strokeWidth="12" fill="none" />
        <path d="M330 -10 C 300 150, 340 260, 300 410" stroke="#ffd34a" strokeWidth="3" strokeDasharray="8 7" fill="none" />
        {school && <circle cx={sx} cy={sy} r="95" fill="rgba(26,71,245,.06)" stroke="#1a47f5" strokeWidth="1.5" strokeDasharray="5 6" />}
      </svg>
      {school && (
        <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: `${(sx / W) * 100}%`, top: `${(sy / H) * 100}%` }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-brand-600 bg-white text-brand-600 shadow-card"><GraduationCap size={18} /></span>
          <span className="max-w-[120px] truncate rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">{school.label}</span>
        </div>
      )}
      {pins.map((p, i) => {
        const on = hovered === p.id || p.active;
        return (
          <div key={p.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${on ? "z-10" : ""}`} style={{ left: `${(x(p.lng) / W) * 100}%`, top: `${(y(p.lat) / H) * 100}%` }}>
            <motion.button type="button" onClick={() => onPin?.(p.id)} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1, scale: on ? 1.12 : 1 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 18 }}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold shadow-card transition-colors ${on ? "bg-brand-600 text-white" : "bg-white text-ink hover:bg-brand-50"}`} aria-label={`Logement : ${p.label}`}>
              {p.label}
            </motion.button>
          </div>
        );
      })}
      {(caption || osm) && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
          {caption && <span className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold shadow-card">{caption}</span>}
          {osm && <a href={`https://www.openstreetmap.org/?mlat=${osm.lat}&mlon=${osm.lng}#map=15/${osm.lat}/${osm.lng}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-700 shadow-card hover:bg-white">Voir sur OpenStreetMap</a>}
        </div>
      )}
    </div>
  );
}

export const pricePin = (n: number, cur: string) => money(n, cur).replace(" F CFA", " F");
