#!/usr/bin/env python3
"""Affiches A4 et flyers A5 / DL de Navigoal (novembre 2026).

Deux modèles :
  - « visuel » : arche marocaine, duo d'étudiants, QR « Scanne-moi », 4 atouts en photos ;
  - « parcours » : le parcours de l'élève sur la plateforme, en 9 étapes reliées par la route orange du logo.
Formats : A4 (210 × 297), A5 (148 × 210, mise en page de l'A4 réduite) et DL (99 × 210, mise en page propre).
Échelle de dessin : 4 px = 1 mm. Fond perdu de 3 mm ajouté autour de chaque format.

Usage : python3 design/maquettes/print_affiches.py <icônes lucide> <dossier des QR> <dossier de sortie HTML>
Puis : node <capture> (voir docs/affiches/README.md) pour les PDF et aperçus.
"""
import base64
import io
import json
import os
import sys

from PIL import Image

ICONS, QRDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = os.path.join(ROOT, "web")
RU = os.path.join(ROOT, "assets/photos/rollup")
os.makedirs(OUT, exist_ok=True)


def img(path, side, crop=None, blanc=False):
    im = Image.open(path)
    if crop:
        im = im.crop(crop)
    if blanc:
        im = im.convert("RGB").point(lambda v: 255 if v >= 232 else v)
    im.thumbnail((side, side))
    buf = io.BytesIO()
    if im.mode in ("RGBA", "LA", "P") or path.endswith(".png"):
        im.save(buf, "PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    im.convert("RGB").save(buf, "JPEG", quality=86)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def icon(name, size, color="currentColor", stroke=2):
    svg = open(os.path.join(ICONS, f"{name}.svg")).read()
    svg = svg.replace('width="24"', f'width="{size}"').replace('height="24"', f'height="{size}"')
    return svg.replace('stroke="currentColor"', f'stroke="{color}"').replace('stroke-width="2"', f'stroke-width="{stroke}"')


FONT = base64.b64encode(open(os.path.join(WEB, "node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2"), "rb").read()).decode()
LOGO = img(os.path.join(RU, "logo-navigoal-cercle.png"), 1400, crop=(70, 70, 1184, 1184), blanc=True)
OAPS = img(os.path.join(WEB, "public/brand/oaps-logo.webp"), 600)
NAVI = img(os.path.join(WEB, "public/brand/navi-fennec.png"), 400)
F = {k: img(os.path.join(RU, f"{k}.jpg"), 2600) for k in ["maroc-hassan2", "maroc-chefchaouen", "residence"]}
F["ecole"] = img(os.path.join(RU, "ecole-recadree.jpg"), 2000)
F["avion"] = img(os.path.join(ROOT, "assets/photos/navitravel/hublot.jpg"), 1400)
F["etudiant"] = img(os.path.join(RU, "etudiant.png"), 1400)
F["etudiante"] = img(os.path.join(WEB, "public/images/etudiante.webp"), 1400)
F["parent"] = img(os.path.join(RU, "parent.png"), 1400)

def trio(H, cx):
    """Père au centre (de face, en retrait), étudiant à gauche, étudiante devant à droite ; visages centrés sur cx (H = hauteur du père)."""
    f = "filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))"
    return (f'<img src="{F["parent"]}" style="position:absolute;left:{cx - 0.486 * H:.0f}px;bottom:0;height:{H:.0f}px;{f}">'
            f'<img src="{F["etudiant"]}" style="position:absolute;left:{cx - 0.82 * H:.0f}px;bottom:0;height:{0.95 * H:.0f}px;{f}">'
            f'<img src="{F["etudiante"]}" style="position:absolute;left:{cx + 0.10 * H:.0f}px;bottom:0;height:{0.78 * H:.0f}px;{f}">')

CR = json.load(open(os.path.join(RU, "credits.json")))
CREDITS = "Photos : " + " · ".join(f"{CR[k]['auteur']} ({CR[k]['licence']})" for k in ("maroc-hassan2", "ecole", "residence", "avion", "maroc-chefchaouen")) + ", Wikimedia Commons, Unsplash et Pexels."
QR = lambda support, modele: img(os.path.join(QRDIR, f"qr-{support}-{modele}.png"), 1200)  # noqa: E731

CSS = f"""@font-face {{ font-family: 'Jakarta'; src: url(data:font/woff2;base64,{FONT}) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; margin: 0; }} body {{ background: #e9edf5; font-family: 'Jakarta', sans-serif; color: #0b1533; }}
.page {{ position: relative; overflow: hidden; }} .trim {{ position: absolute; overflow: hidden; }}
.ombre {{ box-shadow: 0 10px 24px -10px rgba(11,26,79,.45); }}"""
NAVY, SUN, BLEU, ORANGE = "#0b1a4f", "#ffc21f", "#1a47f5", "#ff8a00"
WA = "+241 077 45 31 67"

ETAPES = [  # parcours de l'élève sur la plateforme (textes courts : une ligne de description)
    ("user-plus", "Crée ton compte", "gratuit, en 2 minutes"),
    ("compass", "Fais le test d'orientation", "10 questions en images"),
    ("briefcase", "Explore les métiers", "débouchés et durée des études"),
    ("shield-check", "Compare les écoles", "statut officiel vérifié, frais"),
    ("calculator", "Calcule ton budget", "scolarité, logement, vie, visa"),
    ("file-check-2", "Candidate en ligne", "un seul dossier, sans frais"),
    ("messages-square", "Échange avec l'école", "messagerie et entretien en visio"),
    ("house", "Trouve ton logement", "logements vérifiés (Navilease)"),
    ("plane", "Prépare ton départ", "billet, visa, accueil (NaviTravel)"),
]


def contacts(u, couleur="#fff", accent=SUN, wa_col="#25d366", grand=1.0):
    """Bloc des contacts (u = px par mm)."""
    t = lambda mm: f"{mm * u * grand:.1f}px"  # noqa: E731
    return f"""<b style="font-size:{t(9)};line-height:1;color:{accent};letter-spacing:-.01em">navigoal.net</b>
      <span style="font-size:{t(4.4)};color:{couleur};display:flex;align-items:center;gap:{t(1.6)};white-space:nowrap">{icon("message-circle", round(4.8 * u * grand), wa_col, 2.4)}<b>WhatsApp {WA}</b></span>
      <span style="font-size:{t(4)};color:{couleur};display:flex;align-items:center;gap:{t(1.6)};white-space:nowrap">{icon("mail", round(4.4 * u * grand), accent)}<b>contact@navigoal.net</b></span>"""


def oaps(u):
    return f"""<span style="display:flex;flex-direction:column;align-items:center;gap:{u * .6}px;background:#fff;border-radius:{u * 3}px;padding:{u * 1.6}px {u * 2.2}px"><span style="font-size:{u * 2.2}px;font-weight:800;color:#5b6478;letter-spacing:.2em">BY</span><img src="{OAPS}" style="width:{u * 17}px"></span>"""


# ------------------------------------------------------------------ Modèle « visuel », A4 (dessin 840 × 1188 px)
def visuel_a4(qr):
    u = 4
    atouts = [("ecole", "graduation-cap", "Des écoles vérifiées"), ("residence", "house", "Ton logement trouvé"),
              ("avion", "plane", "Billets à prix étudiant"), ("maroc-chefchaouen", "sparkles", "Accueil à l'arrivée")]
    cartes = "".join(f"""<div style="position:relative;height:{u * 31}px;border-radius:{u * 5}px;overflow:hidden" class="ombre">
      <img src="{F[p]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,79,0) 35%,rgba(11,26,79,.9))"></div>
      <span style="position:absolute;left:{u * 3}px;top:{u * 3}px;width:{u * 9}px;height:{u * 9}px;border-radius:{u * 2.5}px;background:{SUN};display:flex;align-items:center;justify-content:center">{icon(i, u * 5, "#0b1533", 2.2)}</span>
      <b style="position:absolute;left:{u * 3}px;right:{u * 2}px;bottom:{u * 3}px;font-size:{u * 4.6}px;line-height:1.1;color:#fff">{t}</b></div>""" for p, i, t in atouts)
    return f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#fff 0%,#fff 55%,#fff6df 75%,#eef3ff 100%)"></div>
  <div style="position:absolute;left:0;right:0;top:{u * 6}px;display:flex;justify-content:center"><img src="{LOGO}" style="mix-blend-mode:multiply;height:{u * 46}px"></div>
  <h1 style="position:absolute;left:{u * 10}px;right:{u * 10}px;top:{u * 55}px;text-align:center;font-size:{u * 13.5}px;line-height:1.02;font-weight:800;color:{NAVY};letter-spacing:-.02em">Trouve ta voie,<br><span style="color:{ORANGE}">étudie en confiance.</span></h1>
  <div style="position:absolute;left:{u * 14}px;right:{u * 14}px;top:{u * 89}px;height:{u * 92}px;border-radius:{u * 91}px {u * 91}px {u * 8}px {u * 8}px;overflow:hidden;border:{u * 2}px solid {SUN}" class="ombre">
    <img src="{F['maroc-hassan2']}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 25%">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,79,0) 50%,rgba(11,26,79,.5))"></div>
    {trio(290, 356)}</div>
  <span style="position:absolute;left:50%;transform:translateX(-50%);top:{u * 92}px;background:{NAVY};color:#fff;border-radius:999px;padding:{u * 1.6}px {u * 3.4}px;font-size:{u * 3.8}px;font-weight:800;display:flex;align-items:center;gap:{u * 1.4}px;white-space:nowrap">{icon("map-pin", u * 4, SUN, 2.4)}Étudier au Maroc</span>
  <div style="position:absolute;right:{u * 8}px;top:{u * 124}px;width:{u * 54}px;height:{u * 54}px;border-radius:50%;background:{SUN};border:{u * 1.6}px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:{u * .8}px" class="ombre">
    <span style="background:#fff;border-radius:{u * 3}px;padding:{u * 1.4}px;display:flex"><img src="{qr}" style="width:{u * 27}px;height:{u * 27}px"></span>
    <b style="font-size:{u * 4.6}px;line-height:1">Scanne-moi</b><span style="font-size:{u * 2.8}px;font-weight:700;line-height:1.1;text-align:center">test d'orientation<br>gratuit</span></div>
  <div style="position:absolute;left:{u * 14}px;right:{u * 14}px;top:{u * 188}px;display:grid;grid-template-columns:1fr 1fr;gap:{u * 4}px">{cartes}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:{u * 33}px;background:{NAVY};border-radius:{u * 10}px {u * 10}px 0 0"></div>
  <div style="position:absolute;left:{u * 12}px;right:{u * 12}px;bottom:{u * 7}px;display:flex;align-items:center;gap:{u * 4}px">
    <span style="display:flex;flex-direction:column;gap:{u * 1.4}px;flex:1">{contacts(u)}</span>{oaps(u)}</div>
  <p style="position:absolute;left:{u * 8}px;right:{u * 8}px;bottom:{u * 2}px;font-size:{u * 1.5}px;line-height:1.2;color:#8f9bc4;text-align:center">{CREDITS}</p>"""


# ------------------------------------------------------------------ Modèle « parcours », A4
def parcours_a4(qr):
    u = 4
    # route sinueuse : 9 étapes en 3 rangées de 3 (sens alterné), comme un plateau de jeu
    xs = [140, 420, 700]
    ys = [334, 532, 730]
    pos = []
    for r, y in enumerate(ys):
        rang = xs if r % 2 == 0 else xs[::-1]
        pos += [(x, y) for x in rang]
    d = f"M {pos[0][0]} {pos[0][1]}"
    for i in range(1, len(pos)):
        (x0, y0), (x1, y1) = pos[i - 1], pos[i]
        if y0 == y1:
            d += f" L {x1} {y1}"
        else:
            cote = 175 if x0 > 420 else -175
            d += f" C {x0 + cote} {y0} {x1 + cote} {y1} {x1} {y1}"
    etapes = ""
    for n, ((x, y), (ic, t, s)) in enumerate(zip(pos, ETAPES), 1):
        etapes += f"""<div style="position:absolute;left:{x - 118}px;top:{y - 44}px;width:236px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px">
      <span style="position:relative;width:88px;height:88px;border-radius:50%;background:{BLEU if n % 2 else NAVY};border:6px solid #fff;display:flex;align-items:center;justify-content:center" class="ombre">{icon(ic, 40, "#fff", 2)}
        <b style="position:absolute;right:-10px;top:-10px;width:36px;height:36px;border-radius:50%;background:{ORANGE};color:#fff;font-size:19px;display:flex;align-items:center;justify-content:center;border:3px solid #fff">{n}</b></span>
      <b style="font-size:20px;line-height:1.1;color:{NAVY}">{t}</b><span style="font-size:15px;line-height:1.25;color:#3b4566">{s}</span></div>"""
    return f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#fff 0%,#f6f8fe 40%,#fff6df 100%)"></div>
  <div style="position:absolute;left:{u * 10}px;right:{u * 10}px;top:{u * 8}px;display:flex;align-items:center;gap:{u * 6}px">
    <img src="{LOGO}" style="mix-blend-mode:multiply;height:{u * 40}px">
    <div style="display:flex;flex-direction:column;gap:{u * 2}px"><span style="font-size:{u * 4}px;font-weight:800;color:{ORANGE};letter-spacing:.08em;text-transform:uppercase">De l'orientation à l'arrivée</span>
      <h1 style="font-size:{u * 12}px;line-height:1;font-weight:800;color:{NAVY};letter-spacing:-.02em">Ton parcours<br>sur Navigoal</h1>
      <span style="font-size:{u * 4.2}px;color:#3b4566;line-height:1.3">9 étapes, une seule plateforme, gratuite pour les familles.</span></div></div>
  <svg style="position:absolute;left:0;top:0" width="840" height="1188" viewBox="0 0 840 1188"><path d="{d}" fill="none" stroke="#ffd56b" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="{d}" fill="none" stroke="{ORANGE}" stroke-width="5" stroke-dasharray="14 14" stroke-linecap="round"/></svg>
  {etapes}
  <div style="position:absolute;left:{u * 10}px;right:{u * 10}px;top:{u * 224}px;height:{u * 26}px;background:#fff;border-radius:{u * 6}px;display:flex;align-items:center;gap:{u * 4}px;padding:0 {u * 4}px" class="ombre">
    <img src="{NAVI}" style="width:{u * 19}px;height:{u * 19}px">
    <span style="flex:1;display:flex;flex-direction:column;gap:{u * .8}px"><b style="font-size:{u * 5}px;color:{NAVY};line-height:1.1">Navi, ton assistant IA, t'accompagne à chaque étape</b>
      <span style="font-size:{u * 3.4}px;color:#3b4566">Conseils d'orientation, lettre de motivation, budget, démarches : pose-lui tes questions sur navigoal.net.</span></span></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:{u * 39}px;background:{NAVY};border-radius:{u * 10}px {u * 10}px 0 0"></div>
  <div style="position:absolute;left:{u * 10}px;right:{u * 10}px;bottom:{u * 5}px;display:flex;align-items:center;gap:{u * 5}px">
    <span style="background:#fff;border-radius:{u * 3}px;padding:{u * 1.4}px;display:flex;flex-shrink:0"><img src="{qr}" style="width:{u * 26}px;height:{u * 26}px"></span>
    <span style="display:flex;flex-direction:column;gap:{u * 1.3}px;flex:1"><b style="font-size:{u * 4.2}px;color:#fff">Scanne et commence par le test d'orientation</b>{contacts(u, grand=.92)}</span>
    {oaps(u)}</div>"""


# ------------------------------------------------------------------ Modèle « visuel », DL (dessin 396 × 840 px)
def visuel_dl(qr):
    u = 4
    lignes = "".join(f"""<span style="display:flex;align-items:center;gap:{u * 2.4}px"><span style="width:{u * 8}px;height:{u * 8}px;border-radius:{u * 2.4}px;background:{SUN};display:flex;align-items:center;justify-content:center;flex-shrink:0">{icon(i, u * 4.6, "#0b1533", 2.2)}</span><b style="font-size:{u * 4}px;line-height:1.15;color:{NAVY}">{t}</b></span>""" for i, t in [
        ("compass", "Test d'orientation gratuit"), ("shield-check", "Écoles au statut vérifié"), ("file-check-2", "Candidature sans frais de dossier"),
        ("house", "Logement étudiant vérifié"), ("plane", "Billet à prix étudiant et visa")])
    return f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#fff 0%,#fff 60%,#fff6df 100%)"></div>
  <div style="position:absolute;left:0;right:0;top:{u * 5}px;display:flex;justify-content:center"><img src="{LOGO}" style="mix-blend-mode:multiply;height:{u * 30}px"></div>
  <h1 style="position:absolute;left:{u * 5}px;right:{u * 5}px;top:{u * 37}px;text-align:center;font-size:{u * 8.4}px;line-height:1.03;font-weight:800;color:{NAVY};letter-spacing:-.02em">Trouve ta voie,<br><span style="color:{ORANGE}">étudie en confiance.</span></h1>
  <div style="position:absolute;left:{u * 7}px;right:{u * 7}px;top:{u * 59}px;height:{u * 51}px;border-radius:{u * 43}px {u * 43}px {u * 6}px {u * 6}px;overflow:hidden;border:{u * 1.4}px solid {SUN}" class="ombre">
    <img src="{F['maroc-hassan2']}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 25%">
    {trio(164, 164)}</div>
  <div style="position:absolute;left:{u * 9}px;right:{u * 7}px;top:{u * 115}px;display:flex;flex-direction:column;gap:{u * 2.2}px">{lignes}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:{u * 42}px;background:{NAVY};border-radius:{u * 7}px {u * 7}px 0 0"></div>
  <div style="position:absolute;left:{u * 6}px;right:{u * 6}px;bottom:{u * 6}px;display:flex;align-items:center;gap:{u * 3}px">
    <span style="background:#fff;border-radius:{u * 2.4}px;padding:{u * 1.1}px;display:flex;flex-shrink:0"><img src="{qr}" style="width:{u * 23}px;height:{u * 23}px"></span>
    <span style="display:flex;flex-direction:column;gap:{u * 1}px;min-width:0">{contacts(u, grand=.62)}<span style="font-size:{u * 2.4}px;color:#c9d3f5">Scanne : test d'orientation gratuit</span></span></div>
  <div style="position:absolute;right:{u * 5}px;bottom:{u * 27}px">{oaps(u * .62)}</div>
  <p style="position:absolute;left:{u * 4}px;right:{u * 4}px;bottom:{u * 1.6}px;font-size:{u * 1.1}px;line-height:1.2;color:#8f9bc4;text-align:center">{CREDITS}</p>"""


# ------------------------------------------------------------------ Modèle « parcours », DL : frise verticale
def parcours_dl(qr):
    u = 4
    y0, pas = 170, 55
    etapes = "".join(f"""<div style="position:absolute;left:{u * 6}px;right:{u * 5}px;top:{y0 + i * pas}px;display:flex;align-items:flex-start;gap:{u * 3}px">
      <span style="position:relative;width:{u * 11}px;height:{u * 11}px;border-radius:50%;background:{BLEU if i % 2 == 0 else NAVY};border:{u * .9}px solid #fff;display:flex;align-items:center;justify-content:center;flex-shrink:0" class="ombre">{icon(ic, u * 5, "#fff", 2)}
        <b style="position:absolute;right:-{u * 1.6}px;top:-{u * 1.6}px;width:{u * 5}px;height:{u * 5}px;border-radius:50%;background:{ORANGE};color:#fff;font-size:{u * 2.8}px;display:flex;align-items:center;justify-content:center;border:2px solid #fff">{i + 1}</b></span>
      <span style="display:flex;flex-direction:column;gap:2px;padding-top:{u * .4}px"><b style="font-size:{u * 3.8}px;line-height:1.1;color:{NAVY}">{t}</b><span style="font-size:{u * 2.8}px;line-height:1.2;color:#3b4566">{s}</span></span></div>""" for i, (ic, t, s) in enumerate(ETAPES))
    return f"""<div style="position:absolute;inset:0;background:linear-gradient(180deg,#fff 0%,#f6f8fe 50%,#fff6df 100%)"></div>
  <div style="position:absolute;left:{u * 6}px;right:{u * 6}px;top:{u * 5}px;display:flex;align-items:center;gap:{u * 3}px">
    <img src="{LOGO}" style="mix-blend-mode:multiply;height:{u * 24}px"><div style="display:flex;flex-direction:column;gap:{u * .8}px"><span style="font-size:{u * 2.5}px;font-weight:800;color:{ORANGE};letter-spacing:.06em;text-transform:uppercase">De l'orientation à l'arrivée</span>
      <h1 style="font-size:{u * 7}px;line-height:1;font-weight:800;color:{NAVY};letter-spacing:-.02em">Ton parcours sur Navigoal</h1>
      <span style="font-size:{u * 2.6}px;line-height:1.25;color:#3b4566;display:flex;align-items:center;gap:{u * 1.2}px"><img src="{NAVI}" style="width:{u * 6}px">avec Navi, ton assistant IA, à chaque étape</span></div></div>
  <div style="position:absolute;left:{u * 11.5}px;top:{y0 + 30}px;height:{pas * 8}px;width:{u * 1.2}px;background:repeating-linear-gradient(180deg,{ORANGE} 0 8px,transparent 8px 16px);border-radius:3px"></div>
  {etapes}
  <div style="position:absolute;left:0;right:0;bottom:0;height:{u * 41}px;background:{NAVY};border-radius:{u * 7}px {u * 7}px 0 0"></div>
  <div style="position:absolute;left:{u * 6}px;right:{u * 6}px;bottom:{u * 5}px;display:flex;align-items:center;gap:{u * 3}px">
    <span style="background:#fff;border-radius:{u * 2.4}px;padding:{u * 1.1}px;display:flex;flex-shrink:0"><img src="{qr}" style="width:{u * 23}px;height:{u * 23}px"></span>
    <span style="display:flex;flex-direction:column;gap:{u * 1}px;min-width:0">{contacts(u, grand=.62)}<span style="font-size:{u * 2.4}px;color:#c9d3f5">Gratuit pour les familles</span></span></div>
  <div style="position:absolute;right:{u * 5}px;bottom:{u * 27}px">{oaps(u * .62)}</div>"""


FORMATS = {"a4": (210, 297), "a5": (148, 210), "dl": (99, 210)}
BLEED = 3


def fond(h, bandeau_mm):
    """Fond perdu : blanc, puis bleu nuit à partir du haut du bandeau des contacts (même hauteur relative que le dessin)."""
    stop = (BLEED + h * (1 - bandeau_mm)) / (h + 2 * BLEED) * 100
    return f"linear-gradient(180deg,#ffffff 0%,#ffffff {stop:.1f}%,#0b1a4f {stop:.1f}%,#0b1a4f 100%)"


def page(nom, contenu, base, w, h, fond):
    """Page à fond perdu : le dessin (base, en px à 4 px/mm) est mis à l'échelle du format fini w × h mm."""
    s = 4
    k = (w * s) / base[0]
    return f"""<div class="page" id="{nom}" style="width:{(w + 2 * BLEED) * s}px;height:{(h + 2 * BLEED) * s}px;background:{fond}">
  <div class="trim" style="left:{BLEED * s}px;top:{BLEED * s}px;width:{w * s}px;height:{h * s}px">
    <div style="position:absolute;left:0;top:0;width:{base[0]}px;height:{base[1]}px;transform:scale({k});transform-origin:0 0">{contenu}</div></div></div>"""


# part de la hauteur occupée par le bandeau des contacts dans chaque dessin
B_VIS_A4, B_PAR_A4, B_VIS_DL, B_PAR_DL = 33 / 297, 39 / 297, 47 / 210, 41 / 210
pages = {
    "affiche-a4-visuel": page("affiche-a4-visuel", visuel_a4(QR("affiche-a4", "visuel")), (840, 1188), 210, 297, fond(297, B_VIS_A4)),
    "affiche-a4-parcours": page("affiche-a4-parcours", parcours_a4(QR("affiche-a4", "parcours")), (840, 1188), 210, 297, fond(297, B_PAR_A4)),
    "flyer-a5-visuel": page("flyer-a5-visuel", visuel_a4(QR("flyer-a5", "visuel")), (840, 1188), 148, 210, fond(210, B_VIS_A4)),
    "flyer-a5-parcours": page("flyer-a5-parcours", parcours_a4(QR("flyer-a5", "parcours")), (840, 1188), 148, 210, fond(210, B_PAR_A4)),
    "flyer-dl-visuel": page("flyer-dl-visuel", visuel_dl(QR("flyer-dl", "visuel")), (396, 840), 99, 210, fond(210, B_VIS_DL)),
    "flyer-dl-parcours": page("flyer-dl-parcours", parcours_dl(QR("flyer-dl", "parcours")), (396, 840), 99, 210, fond(210, B_PAR_DL)),
}
for nom, p in pages.items():
    w, h = FORMATS[nom.split("-")[1]]
    open(os.path.join(OUT, f"{nom}.html"), "w").write(f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{nom}</title><style>{CSS}
@page {{ size: {w + 2 * BLEED}mm {h + 2 * BLEED}mm; margin: 0; }} html, body {{ margin: 0; background: #fff; }}</style></head><body>{p}</body></html>""")
    print(nom)
