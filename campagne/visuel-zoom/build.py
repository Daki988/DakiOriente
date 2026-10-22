# Visuel « Zoomez… » : photo de main fournie par NEAM (détourée, fond transparent),
# posée sur fond crème, poignet coupé au bord ; le texte minuscule est placé entre l'index et le pouce.
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTO = os.path.join(HERE, 'photo/main-neam.png')
GAP = (390, 720)             # centre de l'espace entre l'index et le pouce (pixels de la photo, 1127 × 1395)
BG = (251, 246, 233)         # crème
TINY = ['Si vous avez dû zoomer pour lire ceci,', 'imaginez vos clients qui vous cherchent sur Google.', '→ Diagnostic digital gratuit : neamindustry.com']

def fond(W, H, scale, name):
    hand = Image.open(PHOTO).convert('RGBA')
    hand = hand.resize((round(hand.width * scale), round(hand.height * scale)), Image.LANCZOS)
    x0, y0 = W - hand.width, H - hand.height        # la main sort par le coin bas droit
    canvas = Image.new('RGBA', (W, H), BG + (255,))
    canvas.alpha_composite(hand, (x0, y0))
    canvas.convert('RGB').save(os.path.join(HERE, name), quality=94)
    return x0 + GAP[0] * scale, y0 + GAP[1] * scale

def page(name, img_name, W, H, scale, title_y, fs):
    gx, gy = fond(W, H, scale, img_name)
    lh = fs * 1.55
    n = len(TINY)
    up = fs * 3.3                                   # hauteur du chevron + « NEAM » au-dessus du texte
    first = gy - ((n - 1) * lh - up) / 2            # bloc entier centré dans l'espace libre
    tiny = ''.join(f'<text x="{gx:.1f}" y="{first + i * lh:.1f}" text-anchor="middle" class="tiny">{l}</text>' for i, l in enumerate(TINY))
    ny = first - fs * 1.5                           # ligne « NEAM »
    cy = ny - fs * 1.15                             # base du chevron
    chev = (f'<path d="M{gx - 4.5:.1f} {cy:.1f} {gx:.1f} {cy - 6:.1f} {gx + 4.5:.1f} {cy:.1f}h-2.2l-2.3-3.2-2.3 3.2z" fill="#f5b31b"/>'
            f'<text x="{gx:.1f}" y="{ny:.1f}" text-anchor="middle" class="tiny tiny--b">NEAM</text>')
    html = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>NEAM — Zoomez…</title>
<link rel="stylesheet" href="../../print/catalogue/fonts/fonts.css">
<style>
  * {{ margin: 0; padding: 0; }}
  html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
  svg {{ display: block; }}
  .title {{ font: 700 172px "Instrument Sans", Arial, sans-serif; letter-spacing: -8px; fill: #0f0f10; }}
  .tiny {{ font: italic 500 {fs}px "Instrument Sans", Arial, sans-serif; letter-spacing: .15px; fill: #1d2a22; text-transform: uppercase; }}
  .tiny--b {{ font-style: normal; font-weight: 700; letter-spacing: 1px; font-size: {fs * .85:.2f}px; }}
  .sig {{ font: 500 22px "IBM Plex Mono", monospace; fill: #76767c; letter-spacing: 1px; }}
</style></head>
<body><svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<image href="{img_name}" x="0" y="0" width="{W}" height="{H}"/>
<text x="505" y="{title_y}" text-anchor="middle" class="title">Zoomez</text>{"".join(f'<circle cx="{858 + k * 34}" cy="{title_y - 11}" r="12" fill="#f5b31b"/>' for k in range(3))}
{chev}{tiny}
<image href="../../assets/logo-light.png" x="60" y="{H - 92}" width="150" height="36"/>
<text x="230" y="{H - 64}" class="sig">@neam.industry</text>
</svg></body></html>'''
    open(os.path.join(HERE, name), 'w').write(html)
    print(name, 'texte centré en', round(gx), round(gy))

page('zoom.html', 'fond-publication.jpg', 1080, 1350, .8, 250, 7.4)
page('zoom-story.html', 'fond-story.jpg', 1080, 1920, .95, 560, 8.8)
