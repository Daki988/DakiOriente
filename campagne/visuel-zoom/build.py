# Visuel « Zoomez… » avec une vraie main (photo Pexels 8058534, Anna Nekrashevich, licence Pexels :
# usage commercial gratuit, sans attribution obligatoire). Le texte minuscule est placé dans le cercle
# formé par le pouce et l'index.
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTO = os.path.join(HERE, 'photo/main-pexels-8058534.jpg')
HOLE = (1745, 764)            # centre du cercle formé par les doigts (mesuré sur la photo, 3000 × 1688)
HOLE_R = 124                  # rayon équivalent du cercle (pixels de la photo)
TINY = ['Si vous avez dû', 'zoomer pour lire ceci,', 'imaginez vos clients', 'qui vous cherchent', 'sur Google.', 'Diagnostic gratuit :', 'neamindustry.com']

def fond(W, H, scale, hole_x):
    """Photo mise à l'échelle, collée en bas, prolongée vers le haut avec la couleur du fond."""
    ph = Image.open(PHOTO).convert('RGB')
    pw, phh = round(ph.width * scale), round(ph.height * scale)
    ph = ph.resize((pw, phh), Image.LANCZOS)
    x0 = round(HOLE[0] * scale - hole_x)            # recadrage horizontal pour centrer le cercle
    ph = ph.crop((x0, 0, x0 + W, phh))
    oy = H - phh
    arr = np.asarray(ph).astype(float)
    # la photo s'assombrit légèrement sur son bord haut (vignettage) : on corrige les 70 premières lignes
    lum = arr.mean(axis=2)
    bg = lum > 150
    ref = arr[70:90][bg[70:90]].mean(axis=0)
    for y in range(70):
        row = arr[y][bg[y]].mean(axis=0) if bg[y].any() else ref
        arr[y] *= (ref / row)[None, :]           # chaque ligne ramenée à la teinte du fond plus bas
    band = arr[8:34].mean(axis=0)                                  # couleur du fond juste sous le bord (sans le doigt)
    k = 61                                                         # lissage horizontal pour éviter les traînées
    pad = np.pad(band, ((k, k), (0, 0)), mode='edge')
    band = np.stack([np.convolve(pad[:, c], np.ones(k) / k, mode='same')[k:-k] for c in range(3)], axis=1)
    rows = oy + 34
    light = np.linspace(1.05, 1.0, rows)[:, None, None]            # lumière douce vers le haut
    ext = np.clip(band[None, :, :] * light, 0, 255)
    canvas = np.zeros((H, W, 3))
    canvas[oy:] = arr
    # fondu progressif sur les 34 premières lignes de la photo
    a = np.clip((np.arange(34) - 4) / 30, 0, 1)[:, None, None]
    canvas[oy:oy + 34] = arr[:34] * a + ext[oy:oy + 34] * (1 - a)
    canvas[:oy] = ext[:oy]
    canvas = Image.fromarray(np.clip(canvas, 0, 255).astype('uint8'))
    return canvas, (hole_x, oy + HOLE[1] * scale), HOLE_R * scale

def page(name, img_name, W, H, scale, hole_x, title_y, fs):
    canvas, (hx, hy), r = fond(W, H, scale, hole_x)
    canvas.save(os.path.join(HERE, img_name), quality=93)
    lh = fs * 1.3
    n = len(TINY)
    block = fs * 2.6 + n * lh                       # chevron + « NEAM » + lignes
    top = hy - block / 2 + fs * .3
    cy = top + fs * .7                              # base du chevron
    ny = cy + fs * 1.35                             # ligne « NEAM »
    y0 = ny + lh * 1.05
    tiny = ''.join(f'<text x="{hx:.1f}" y="{y0 + i * lh:.1f}" text-anchor="middle" class="tiny">{l}</text>' for i, l in enumerate(TINY))
    chev = (f'<path d="M{hx - 4:.1f} {cy:.1f} {hx:.1f} {cy - 5.5:.1f} {hx + 4:.1f} {cy:.1f}h-2l-2-3-2 3z" fill="#f5b31b"/>'
            f'<text x="{hx:.1f}" y="{ny:.1f}" text-anchor="middle" class="tiny tiny--b">NEAM</text>')
    html = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>NEAM — Zoomez…</title>
<link rel="stylesheet" href="../../print/catalogue/fonts/fonts.css">
<style>
  * {{ margin: 0; padding: 0; }}
  html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
  svg {{ display: block; }}
  .title {{ font: 700 172px "Instrument Sans", Arial, sans-serif; letter-spacing: -8px; fill: #0f0f10; }}
  .tiny {{ font: italic 600 {fs}px "Instrument Sans", Arial, sans-serif; letter-spacing: .1px; fill: #1a1712; text-transform: uppercase; }}
  .tiny--b {{ font-style: normal; font-weight: 700; letter-spacing: .8px; font-size: {fs * .85:.2f}px; }}
  .sig {{ font: 500 22px "IBM Plex Mono", monospace; fill: #4a4337; letter-spacing: 1px; }}
</style></head>
<body><svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<image href="{img_name}" x="0" y="0" width="{W}" height="{H}"/>
<text x="505" y="{title_y}" text-anchor="middle" class="title">Zoomez</text>{"".join(f'<circle cx="{858 + k * 34}" cy="{title_y - 11}" r="12" fill="#f5b31b"/>' for k in range(3))}
{chev}{tiny}
<image href="../../assets/logo-light.png" x="{W - 210}" y="{H - 96}" width="150" height="36"/>
<text x="{W - 60}" y="{H - 112}" text-anchor="end" class="sig">@neam.industry</text>
</svg></body></html>'''
    open(os.path.join(HERE, name), 'w').write(html)
    print(name, 'cercle', round(hx), round(hy), 'rayon', round(r))

page('zoom.html', 'fond-publication.jpg', 1080, 1350, .62, 560, 255, 6.3)
page('zoom-story.html', 'fond-story.jpg', 1080, 1920, .74, 560, 560, 7.4)
