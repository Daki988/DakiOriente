# Génère les pages HTML du visuel « Zoomez… » (publication 1080 × 1350 et story 1080 × 1920)
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import hand

HERE = os.path.dirname(os.path.abspath(__file__))
TINY = ['Si vous avez dû zoomer pour lire ceci,', 'imaginez vos clients qui vous cherchent sur Google.', '→ Diagnostic digital gratuit : neamindustry.com']

def page(name, H, dy, title_y):
    defs, h = hand(0, dy)
    ty = 795 + dy
    tiny = ''.join(f'<text x="470" y="{ty + i * 11}" text-anchor="middle" class="tiny">{l}</text>' for i, l in enumerate(TINY))
    chev = f'<path d="M466 {ty - 17} 470 {ty - 23} 474 {ty - 17}h-2l-2-3-2 3z" fill="#f5b31b"/><text x="470" y="{ty - 9}" text-anchor="middle" class="tiny tiny--b">NEAM</text>'
    html = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>NEAM — Zoomez…</title>
<link rel="stylesheet" href="../../print/catalogue/fonts/fonts.css">
<style>
  * {{ margin: 0; padding: 0; }}
  html, body {{ width: 1080px; height: {H}px; overflow: hidden; background: #fbf6e9; }}
  svg {{ display: block; }}
  .title {{ font: 700 172px "Instrument Sans", Arial, sans-serif; letter-spacing: -8px; fill: #0f0f10; }}
  .title tspan {{ fill: #f5b31b; }}
  .tiny {{ font: italic 500 7.6px "Instrument Sans", Arial, sans-serif; letter-spacing: .15px; fill: #1d2a22; text-transform: uppercase; }}
  .tiny--b {{ font-style: normal; font-weight: 700; letter-spacing: 1px; font-size: 6.4px; }}
  .sig {{ font: 500 22px "IBM Plex Mono", monospace; fill: #76767c; letter-spacing: 1px; }}
</style></head>
<body><svg width="1080" height="{H}" viewBox="0 0 1080 {H}">
<defs>{''.join(defs)}<filter id="ombre" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="-6" dy="14" stdDeviation="14" flood-color="#5a3a10" flood-opacity=".18"/></filter></defs>
<text x="505" y="{title_y}" text-anchor="middle" class="title">Zoomez</text>{"".join(f'<circle cx="{858 + k * 34}" cy="{title_y - 11}" r="12" fill="#f5b31b"/>' for k in range(3))}
{h}
{chev}{tiny}
<image href="../../assets/logo-light.png" x="60" y="{H - 92}" width="150" height="36"/>
<text x="230" y="{H - 64}" class="sig">@neam.industry</text>
</svg></body></html>'''
    open(os.path.join(HERE, name), 'w').write(html)

page('zoom.html', 1350, 0, 250)
page('zoom-story.html', 1920, 230, 420)
print('ok')
