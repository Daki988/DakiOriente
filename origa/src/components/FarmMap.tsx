import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FarmRow } from '../app/national';
import { provinceName } from '../domain/provinces';

/** Couleur d'une ferme sur la carte (§ 5.4 : selon l'alerte ou la mortalité). */
export const MAP_COLORS = { alerte: '#D64545', mortalite: '#F5B700', ok: '#12805C', inactive: '#8A9A93' };
export function farmColor(r: FarmRow): string {
  if (r.alerts) return MAP_COLORS.alerte;
  if ((r.st?.mortalityPct ?? 0) > 5) return MAP_COLORS.mortalite;
  return r.farm.status === 'operationnelle' ? MAP_COLORS.ok : MAP_COLORS.inactive;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const pct = (n?: number) => (n === undefined ? '—' : `${n.toFixed(1).replace('.', ',')} %`);
/** Emprise du Gabon, pour cadrer la carte quand aucune ferme n'est géolocalisée. */
const GABON: L.LatLngBoundsExpression = [[-3.98, 8.7], [2.32, 14.52]];

/**
 * Carte interactive des exploitations (§ 5.4, § 7.6) : fond OpenStreetMap, position GPS exacte de chaque ferme,
 * couleur selon l'alerte ou la mortalité, fiche résumée au clic avec un lien vers la ferme. Suit les filtres de l'écran.
 */
export function FarmMap({ rows, height = 400 }: { rows: FarmRow[]; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: false });
    L.control.attribution({ prefix: 'Leaflet' }).addTo(m);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, minZoom: 5,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(m);
    m.fitBounds(GABON);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    // La carte est créée dans un panneau dont la taille peut encore changer (grille, menu) : on la recale.
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(box.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current; const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const located = rows.filter((r) => typeof r.farm.lat === 'number' && typeof r.farm.lng === 'number');
    for (const r of located) {
      const color = farmColor(r);
      const html = `<div class="map-pop"><b>${esc(r.farm.name)}</b><span>${esc(r.farm.id)} · ${esc(r.farm.locality ?? '')}, ${esc(provinceName(r.farm.province))}</span>`
        + (r.band && r.st ? `<span>Bande ${r.band.rank} · ${r.st.present.toLocaleString('fr-FR')} poulets · mortalité ${pct(r.st.mortalityPct)}</span>` : '<span>Aucune bande en cours</span>')
        + (r.alerts ? `<span class="bad">${r.alerts} alerte(s) sanitaire(s) ouverte(s)</span>` : '')
        + `<span class="muted">GPS ${r.farm.lat!.toFixed(4)}, ${r.farm.lng!.toFixed(4)}</span>`
        + `<a href="#/fermes/${encodeURIComponent(r.farm.id)}">Ouvrir la fiche de la ferme</a></div>`;
      L.circleMarker([r.farm.lat!, r.farm.lng!], { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95 })
        .bindTooltip(`${r.farm.id} · ${r.farm.name}`, { direction: 'top', offset: [0, -6] })
        .bindPopup(html, { autoPanPaddingTopLeft: [48, 12], autoPanPaddingBottomRight: [12, 12], maxWidth: 260 })
        .addTo(g);
    }
    if (located.length) m.fitBounds(L.latLngBounds(located.map((r) => [r.farm.lat!, r.farm.lng!] as [number, number])).pad(0.25), { maxZoom: 10 });
    else m.fitBounds(GABON);
  }, [rows]);

  const missing = rows.filter((r) => typeof r.farm.lat !== 'number').length;
  return (
    <div className="farm-map">
      <div ref={box} style={{ height }} role="region" aria-label="Carte des fermes au Gabon" />
      <div className="map-legend">
        <span><i style={{ background: MAP_COLORS.ok }} />Opérationnelle</span>
        <span><i style={{ background: MAP_COLORS.mortalite }} />Mortalité &gt; 5 %</span>
        <span><i style={{ background: MAP_COLORS.alerte }} />Alerte ouverte</span>
        <span><i style={{ background: MAP_COLORS.inactive }} />Autre statut</span>
        {missing > 0 && <span className="muted">{missing} ferme(s) sans position GPS</span>}
      </div>
    </div>
  );
}
