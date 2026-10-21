# Visuels du catalogue : pictogrammes, anneaux de données, carte des terrains d'expérience
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))

# Pictogrammes au trait (24 × 24), couleur héritée du texte
_P = {
    'web': '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 8.5h18M6.2 6.3h.01M8.6 6.3h.01M7 12.2h6M7 15.2h9"/>',
    'logiciel': '<path d="M4 20v-9M9.5 20V5M15 20v-6M20.5 20V8M2.5 20.5h20"/>',
    'ia': '<circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M6.5 7.2 10 10.5M17.5 7.2 14 10.5M6.5 16.8 10 13.5M17.5 16.8 14 13.5"/>',
    'conseil': '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4.4"/><circle cx="11" cy="13" r="1.1"/><path d="M11 13 20 4M16.6 4H20v3.4"/>',
    'audit': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.4 15.4 5.1 5.1M7.8 12.5l1.8-2 1.8 1.4 2.3-3"/>',
    'strategie': '<circle cx="6" cy="18" r="2"/><path d="M8 18h5a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/><path d="M17.5 3v7M17.5 3H21l-1.2 1.7L21 6.4h-3.5"/>',
    'production': '<path d="m14.5 4.5 5 5L9 20H4v-5z"/><path d="m12.4 6.6 5 5"/>',
    'deploiement': '<path d="M12 2.5c3.5 2.2 5 5.8 5 9.5l-2 3H9l-2-3c0-3.7 1.5-7.3 5-9.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M9 15l-2.5 3.5M15 15l2.5 3.5M12 18v3.5"/>',
    'mesure': '<path d="M3 20.5h18M4 16l5-5 4 3 7-8"/><path d="M15.5 6H20v4.5"/>',
    'idee': '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    'lieu': '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    'impact': '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    'fiable': '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.4-4.4"/>',
    'resultat': '<circle cx="12" cy="12" r="9"/><path d="M8.5 15.5l7-7M10 8.5h5.5V14"/>',
    'oeil': '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'couches': '<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
    'engrenage': '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.3"/>',
    'donnees': '<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 2.6A9 9 0 0 1 21.4 9H15z"/>',
    'etincelle': '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M19 14.5l.8 2.2L22 17.5l-2.2.8L19 20.5l-.8-2.2L16 17.5l2.2-.8z"/>',
    'cle': '<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 7.7-1.5"/><circle cx="12" cy="15.6" r="1.4"/>',
    'puzzle': '<path d="M5 7h3.5a2.2 2.2 0 1 1 4.4 0H17v4.1a2.2 2.2 0 1 1 0 4.4V20h-4.1a2.2 2.2 0 1 0-4.4 0H5v-4.5a2.2 2.2 0 1 0 0-4.4z"/>',
    'puce': '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    'equipe': '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M14.2 14.3c.7-.3 1.5-.5 2.3-.5 2.8 0 4.5 2.4 4.5 5.2"/>',
    'pousse': '<path d="M12 21v-8.5"/><path d="M12 12.5c0-4 3-7 8-7 0 4-3 7-8 7zM12 15c0-3.3-2.5-6-7-6 0 3.3 2.5 6 7 6z"/>',
    'boutique': '<path d="M4.5 11v9.5h15V11"/><path d="M3 9.5 5 4h14l2 5.5c0 1.5-1.2 2.6-2.6 2.6S15.8 11 15.8 9.5c0 1.5-1.2 2.6-2.6 2.6h-2.4c-1.4 0-2.6-1.1-2.6-2.6 0 1.5-1.2 2.6-2.6 2.6S3 11 3 9.5z"/><path d="M10 20.5V16h4v4.5"/>',
    'immeuble': '<path d="M4 21V5l8-2.5V21M12 8h8v13M2.5 21h19"/><path d="M7 8h2M7 11.5h2M7 15h2M15 11.5h2M15 15h2"/>',
    'reglages': '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    'plan': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    'aimant': '<path d="M5 4h4v8a3 3 0 0 0 6 0V4h4v8a7 7 0 0 1-14 0z"/><path d="M5 8h4M15 8h4"/>',
    'sommet': '<path d="M3 20 9.5 9l4 6.5L16 12l5 8z"/><path d="M9.5 9V3.5l4 1.7-4 1.6"/>',
    'porte_voix': '<path d="M3 10v4h3l7 4.5V5.5L6 10z"/><path d="M17 9a4 4 0 0 1 0 6M6 14l1.5 5h3l-1.2-4"/>',
    'boussole': '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    'drapeau': '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    'mobile': '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    'portefeuille': '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11v3"/><path d="M16 13.5h.01"/>',
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    'loupe_doc': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M14 3l5 5h-5z"/><circle cx="16" cy="16" r="3"/><path d="m18.2 18.2 2.3 2.3"/>',
}

def icon(name, cls='ico'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_P[name]}</svg>'

def ring(pct, label=''):
    """Anneau de pourcentage (valeur réelle, sans arrondi trompeur)."""
    r = 15.9155  # circonférence = 100
    lab = f'<text x="21" y="24.2" text-anchor="middle" class="ring__t">{label}</text>' if label else ''
    return (f'<svg class="ring" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="{r}" class="ring__bg"/>'
            f'<circle cx="21" cy="21" r="{r}" class="ring__fg" stroke-dasharray="{pct:.1f} {100 - pct:.1f}" stroke-dashoffset="25"/>{lab}</svg>')

def bars(rows):
    """Barres horizontales [(libellé, valeur, max)]."""
    out = []
    for i, (lab, v, m) in enumerate(rows):
        y = i * 15
        w = 0 if not m else 100 * v / m
        out.append(f'<text x="0" y="{y + 6}" class="bars__l">{lab}</text><rect x="0" y="{y + 8.5}" width="100" height="4" rx="2" class="bars__bg"/>'
                   + (f'<rect x="0" y="{y + 8.5}" width="{w:.1f}" height="4" rx="2" class="bars__fg"/>' if w else '')
                   + f'<text x="100" y="{y + 6}" text-anchor="end" class="bars__v">{v}&nbsp;/&nbsp;{m}</text>')
    return f'<svg class="bars" viewBox="0 0 100 {len(rows) * 15}" aria-hidden="true">{"".join(out)}</svg>'

# ---------- Carte : Afrique de l'Ouest et centrale, Maghreb, Europe du Sud ----------
def _decode(topo):
    sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0; pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs

def _ring(arcs, idx):
    pts = []
    for k, i in enumerate(idx):
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a if k == 0 else a[1:])
    return pts

def carte(highlight, points, box=(-19.5, 33.0, -7.5, 52.5), width=300):
    lon0, lon1, lat0, lat1 = box
    k = math.cos(math.radians((lat0 + lat1) / 2))
    W = (lon1 - lon0) * k; H = lat1 - lat0
    s = width / W
    height = H * s
    P = lambda lon, lat: ((lon - lon0) * k * s, (lat1 - lat) * s)
    topo = json.load(open(os.path.join(HERE, 'img/countries-110m.json')))
    arcs = _decode(topo)
    paths = []
    for g in topo['objects']['countries']['geometries']:
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']] if g['type'] == 'Polygon' else []
        d = []
        for poly in polys:
            for ring_idx in poly:
                pts = _ring(arcs, ring_idx)
                xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                if max(xs) < lon0 - 5 or min(xs) > lon1 + 5 or max(ys) < lat0 - 5 or min(ys) > lat1 + 5:
                    continue
                d.append('M' + 'L'.join(f'{P(x, y)[0]:.1f},{P(x, y)[1]:.1f}' for x, y in pts) + 'Z')
        if d:
            cls = 'map__on' if g['properties']['name'] in highlight else 'map__land'
            paths.append(f'<path class="{cls}" d="{"".join(d)}"/>')
    dots = []
    for lab, lon, lat, dx, dy, anchor in points:
        x, y = P(lon, lat)
        dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="10" class="map__halo"/><circle cx="{x:.1f}" cy="{y:.1f}" r="4.2" class="map__dot"/>'
                    f'<text x="{x + dx:.1f}" y="{y + dy:.1f}" text-anchor="{anchor}" class="map__lab">{lab}</text>')
    return f'<svg class="map" viewBox="0 0 {width} {height:.0f}" aria-label="Carte des terrains d’expérience">{"".join(paths)}{"".join(dots)}</svg>'
