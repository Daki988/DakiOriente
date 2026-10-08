#!/usr/bin/env python3
"""Génère les maquettes HTML auto-contenues de Navigoal (importées ensuite dans Figma via html_to_figma).

Usage : python3 design/maquettes/build.py <dossier lucide-static/icons>
Sortie : design/maquettes/out/*.html
"""
import base64
import io
import json
import os
import re
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = os.path.join(ROOT, "web")
OUT = os.path.join(HERE, "out")
ICONS = sys.argv[1]
os.makedirs(OUT, exist_ok=True)


def ref(name):
    return json.load(open(os.path.join(ROOT, "data", "referentiels", name + ".json"), encoding="utf-8"))["items"]


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def img_b64(path, max_side=None, fmt="PNG"):
    im = Image.open(path)
    if max_side:
        im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    if fmt == "JPEG":
        im.convert("RGB").save(buf, "JPEG", quality=82)
        mime = "image/jpeg"
    else:
        im.save(buf, "PNG", optimize=True)
        mime = "image/png"
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


FONTS = os.path.join(WEB, "node_modules", "@fontsource-variable", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-wght-normal.woff2")
CAVEAT = os.path.join(WEB, "node_modules", "@fontsource", "caveat", "files", "caveat-latin-600-normal.woff2")
STUDENT = img_b64(os.path.join(WEB, "public", "images", "etudiante.webp"), 720)

ETABS = {e["id"]: e for e in ref("etablissements_superieurs")}
METIERS = {m["id"]: m for m in ref("metiers")}
FORMATIONS = {f["id"]: f for f in ref("formations")}


def logo(eid, size=40):
    e = ETABS[eid]
    if e.get("logo"):
        src = img_b64(os.path.join(ROOT, e["logo"]["fichier"]), 160)
        return f'<div class="logo" style="width:{size}px;height:{size}px"><img src="{src}" alt="{e["sigle"]}"></div>'
    return f'<div class="logo logo-txt" style="width:{size}px;height:{size}px;font-size:{size*0.28:.0f}px">{e["sigle"][:5]}</div>'


def icon(name, size=20, color="currentColor", stroke=2):
    svg = open(os.path.join(ICONS, name + ".svg")).read()
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S).strip()
    svg = svg.replace('width="24"', f'width="{size}"').replace('height="24"', f'height="{size}"')
    svg = svg.replace('stroke="currentColor"', f'stroke="{color}"').replace('stroke-width="2"', f'stroke-width="{stroke}"')
    svg = re.sub(r'class="[^"]*"', "", svg)
    return svg


CSS = f"""
@font-face {{ font-family: 'Plus Jakarta Sans'; src: url({b64(FONTS, 'font/woff2')}) format('woff2'); font-weight: 200 800; }}
@font-face {{ font-family: 'Caveat'; src: url({b64(CAVEAT, 'font/woff2')}) format('woff2'); font-weight: 600; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Plus Jakarta Sans', sans-serif; color: #0b1533; background: #f6f8fe; width: 1440px; }}
.page {{ width: 1440px; background: #f6f8fe; overflow: hidden; }}
.wrap {{ width: 1280px; margin: 0 auto; }}
a {{ color: inherit; text-decoration: none; }}
.row {{ display: flex; align-items: center; }}
.col {{ display: flex; flex-direction: column; }}
.between {{ justify-content: space-between; }}
.g4{{gap:4px}}.g6{{gap:6px}}.g8{{gap:8px}}.g10{{gap:10px}}.g12{{gap:12px}}.g16{{gap:16px}}.g20{{gap:20px}}.g24{{gap:24px}}.g32{{gap:32px}}.g40{{gap:40px}}
.btn {{ display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; padding: 13px 22px; font-size: 14px; font-weight: 700; white-space: nowrap; }}
.btn-primary {{ background: #1a47f5; color: #fff; box-shadow: 0 12px 30px -10px rgba(26,71,245,.7); }}
.btn-sun {{ background: #ffc21f; color: #0b1533; box-shadow: 0 12px 30px -12px rgba(249,168,6,.9); }}
.btn-ghost {{ background: #fff; color: #1336e0; border: 1.5px solid #bcd2ff; }}
.btn-white {{ background: #fff; color: #1336e0; }}
.card {{ background: #fff; border: 1px solid #e6eaf5; border-radius: 20px; box-shadow: 0 1px 2px rgba(11,21,51,.04), 0 10px 30px -12px rgba(11,21,51,.12); }}
.chip {{ display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 5px 11px; font-size: 12px; font-weight: 700; white-space: nowrap; }}
.chip-blue {{ background: #eef4ff; color: #1336e0; }}
.chip-green {{ background: #e8f8ef; color: #0f8a46; }}
.chip-sun {{ background: #fff3c4; color: #a55a00; }}
.chip-violet {{ background: #f1edff; color: #6a3df0; }}
.chip-rose {{ background: #ffecef; color: #d42a50; }}
.muted {{ color: #6b7493; }}
.soft {{ color: #3b4566; }}
h1 {{ font-size: 68px; line-height: 1.02; font-weight: 800; letter-spacing: -2.2px; }}
h2 {{ font-size: 40px; line-height: 1.1; font-weight: 800; letter-spacing: -1.2px; }}
h3 {{ font-size: 20px; font-weight: 800; letter-spacing: -.3px; }}
.eyebrow {{ font-size: 13px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: #1a47f5; }}
.sun {{ color: #f9a806; }}
.hand {{ font-family: 'Caveat', cursive; font-weight: 600; }}
.logo {{ background: #fff; border: 1px solid #e6eaf5; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 5px; flex-shrink: 0; }}
.logo img {{ max-width: 100%; max-height: 100%; object-fit: contain; }}
.logo-txt {{ background: linear-gradient(135deg,#1a47f5,#598bff); color: #fff; font-weight: 800; border: none; }}
.ic {{ display: flex; align-items: center; justify-content: center; border-radius: 14px; flex-shrink: 0; }}
.nav a {{ font-size: 14px; font-weight: 600; color: #3b4566; }}
.nav a.on {{ color: #1a47f5; }}
.search {{ background: #fff; border-radius: 18px; padding: 8px 8px 8px 22px; box-shadow: 0 20px 50px -18px rgba(11,21,51,.35); border: 1px solid #e6eaf5; }}
.bar {{ height: 8px; border-radius: 99px; background: #e8edfa; overflow: hidden; }}
.bar > div {{ height: 100%; border-radius: 99px; background: linear-gradient(90deg,#1a47f5,#598bff); }}
.ann {{ position: absolute; background: #ff3d7f; color: #fff; font-size: 11px; font-weight: 800; border-radius: 8px; padding: 4px 8px; white-space: nowrap; box-shadow: 0 6px 16px -6px rgba(255,61,127,.8); }}
"""

LOGO_SVG = """<svg width="38" height="38" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="url(#g)"/>
<path d="M20 8 L27 27 L20 23 L13 27 Z" fill="#fff"/><circle cx="20" cy="20" r="2.4" fill="#ffc21f"/>
<defs><linearGradient id="g" x1="0" y1="0" x2="40" y2="40"><stop stop-color="#1a47f5"/><stop offset="1" stop-color="#598bff"/></linearGradient></defs></svg>"""


def brand(dark=False, sub=None):
    c = "#fff" if dark else "#0b1533"
    s = f'<div style="font-size:10px;font-weight:700;color:{"#bcd2ff" if dark else "#6b7493"};letter-spacing:.4px">{sub}</div>' if sub else ""
    return f'<div class="row g10">{LOGO_SVG}<div class="col"><div style="font-size:21px;font-weight:800;letter-spacing:-.6px;color:{c}">Navi<span class="sun">goal</span></div>{s}</div></div>'


def header(active="Accueil"):
    items = ["Accueil", "Orientation", "Métiers", "Formations", "Établissements", "Pays", "Navilease", "Ressources", "Actualités"]
    links = "".join(f'<a class="{"on" if i == active else ""}">{i}</a>' for i in items)
    return f"""<div style="background:rgba(255,255,255,.85);border-bottom:1px solid #e6eaf5;position:relative;z-index:5">
<div class="wrap row between" style="height:76px">{brand()}<div class="row g24 nav">{links}</div>
<div class="row g10"><div class="ic" style="width:42px;height:42px;background:#f1f4fd">{icon('search',18,'#3b4566')}</div>
<a class="btn btn-ghost" style="padding:11px 18px">Se connecter</a><a class="btn btn-sun" style="padding:11px 18px">S'inscrire</a></div></div></div>"""


def footer():
    cols = [("Plateforme", ["Orientation", "Métiers", "Formations", "Établissements", "Navilease"]),
            ("Pays", ["Gabon", "Maroc", "Sénégal", "Bientôt : Côte d'Ivoire"]),
            ("Ressources", ["Annales", "Guides", "Actualités", "Bourses"]),
            ("Navigoal", ["À propos", "Établissements partenaires", "Bailleurs", "Contact"])]
    c = "".join(f'<div class="col g12"><div style="font-weight:800;font-size:14px">{t}</div>' + "".join(f'<a style="color:#a9b6e8;font-size:14px">{l}</a>' for l in ls) + "</div>" for t, ls in cols)
    return f"""<div style="background:#0b1a4f;color:#fff;padding:64px 0 32px"><div class="wrap col g40"><div class="row between" style="align-items:flex-start">
<div class="col g16" style="width:320px">{brand(True)}<p style="color:#a9b6e8;font-size:14px;line-height:1.6">De l'orientation à la formation, jusqu'au logement étudiant. Gabon · Maroc · Sénégal.</p></div>
<div class="row g40" style="gap:80px;align-items:flex-start">{c}</div></div>
<div class="row between" style="border-top:1px solid #1e2f73;padding-top:24px;color:#7f8fcf;font-size:13px"><div>© 2026 Navigoal — Navilease est un service Navigoal</div><div class="row g16"><span>Confidentialité</span><span>Mentions légales</span><span>CGU</span></div></div></div></div>"""


def cta_band(title="Construis ton avenir avec <span class=\"sun\">Navigoal</span>", sub="Orientation, formations, candidatures et logement : tout ton parcours au même endroit."):
    feats = [("graduation-cap", "Formations vérifiées"), ("building-2", "Établissements partenaires"), ("house", "Logements Navilease"), ("sparkles", "Recommandations IA")]
    f = "".join(f'<div class="col g8" style="align-items:center;width:120px;text-align:center"><div class="ic" style="width:52px;height:52px;background:rgba(255,255,255,.1);border-radius:50%">{icon(i,24,"#fff")}</div><div style="font-size:13px;font-weight:600">{t}</div></div>' for i, t in feats)
    return f"""<div class="wrap" style="margin:80px auto"><div style="position:relative;border-radius:28px;overflow:hidden;background:linear-gradient(115deg,#0b1a4f 0%,#162fb5 55%,#1a47f5 100%);padding:48px 56px;color:#fff">
<div style="position:absolute;right:-80px;top:-120px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(255,194,31,.35),transparent 70%)"></div>
<div class="row between" style="position:relative"><div class="col g16" style="width:560px"><div style="font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1.15">{title}</div>
<p style="color:#c9d6ff;font-size:16px;line-height:1.6">{sub}</p><div class="row g12" style="margin-top:8px"><a class="btn btn-sun">Créer mon compte gratuitement {icon('arrow-right',18,'#0b1533')}</a><a class="btn" style="color:#fff;border:1.5px solid rgba(255,255,255,.35)">Passer le test d'orientation</a></div></div>
<div class="row g16">{f}</div></div></div></div>"""


def doc(title, body, width=1440):
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{title}</title><style>{CSS} body{{width:{width}px}} .page{{width:{width}px}}</style></head><body><div class="page">{body}</div></body></html>"""


def save(name, html):
    with open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8") as f:
        f.write(html)
    print(name, f"{len(html)/1024:.0f} Ko")


# =====================================================================================
# 1. ACCUEIL
# =====================================================================================
def hero_visual(height=600):
    return f"""<div style="position:relative;width:600px;height:{height}px">
<div style="position:absolute;left:60px;top:40px;width:500px;height:500px;border-radius:42% 58% 70% 30% / 45% 45% 55% 55%;background:linear-gradient(140deg,#1a47f5,#598bff 60%,#8eb4ff)"></div>
<div style="position:absolute;left:330px;top:10px;width:220px;height:220px;border-radius:50%;background:#ffc21f;opacity:.9"></div>
<div style="position:absolute;left:20px;top:300px;width:120px;height:120px;border-radius:50%;border:3px dashed #ffc21f"></div>
<img src="{STUDENT}" style="position:absolute;left:40px;bottom:0;width:560px">
<div class="card row g12" style="position:absolute;left:-30px;top:120px;padding:14px 18px;border-radius:16px">
 <div class="ic" style="width:44px;height:44px;background:#e8f8ef">{icon('sparkles',22,'#0f8a46')}</div>
 <div class="col g4"><div style="font-size:12px" class="muted">Profil dominant</div><div style="font-weight:800;font-size:15px">Analyste · Organisateur</div></div></div>
<div class="card col g8" style="position:absolute;right:-20px;top:250px;padding:16px 18px;width:230px;border-radius:16px">
 <div class="row between"><div style="font-size:12px;font-weight:700">Licence Informatique</div><span class="chip chip-green">87 %</span></div>
 <div class="bar"><div style="width:87%"></div></div><div style="font-size:11px" class="muted">Compatibilité avec ton profil</div></div>
<div class="card row g10" style="position:absolute;left:10px;bottom:70px;padding:12px 16px;border-radius:16px">
 <div class="ic" style="width:38px;height:38px;background:#fff3c4">{icon('house',20,'#a55a00')}</div>
 <div class="col"><div style="font-weight:800;font-size:13px">Studio à 900 m de l'UCAD</div><div style="font-size:11px" class="muted">Navilease · vérifié ✓</div></div></div>
<div class="ann" style="left:200px;bottom:20px">Parallaxe souris + blob morphing 14 s</div>
<div class="ann" style="right:-10px;top:220px">Badges flottants (float 6 s)</div>
</div>"""


def accueil():
    stats = [("120+", "établissements référencés"), ("96", "fiches métiers"), ("93", "formations types"), ("3", "pays au lancement")]
    st = "".join(f'<div class="col g4"><div style="font-size:30px;font-weight:800;letter-spacing:-1px">{n}</div><div style="font-size:13px" class="muted">{l}</div></div>' for n, l in stats)
    quick = [("compass", "#e8f8ef", "#0f8a46", "Orientation", "Test & profil RIASEC"), ("briefcase", "#eef4ff", "#1a47f5", "Métiers", "96 fiches détaillées"),
             ("graduation-cap", "#fff3c4", "#a55a00", "Formations", "Licence, BTS, ingénieur…"), ("building-2", "#f1edff", "#6a3df0", "Établissements", "Compare et choisis"),
             ("house", "#ffecef", "#d42a50", "Navilease", "Logement étudiant")]
    qk = "".join(f'<div class="card row g12" style="padding:16px;flex:1;border-radius:18px"><div class="ic" style="width:46px;height:46px;background:{bg}">{icon(i,22,fg)}</div><div class="col g4"><div style="font-weight:800;font-size:15px">{t}</div><div style="font-size:12px" class="muted">{s}</div></div></div>' for i, bg, fg, t, s in quick)

    steps = [("user-round", "Je crée mon profil", "Niveau, série, pays, centres d'intérêt."), ("brain", "Je passe le test", "20 questions, profil RIASEC visuel."),
             ("target", "Je découvre mes voies", "Métiers, formations et écoles compatibles."), ("file-check-2", "Je candidate", "Dossier, paiement mobile, suivi en direct."),
             ("key-round", "Je m'installe", "Logement vérifié avec Navilease.")]
    stp = ""
    for k, (i, t, s) in enumerate(steps):
        stp += f'''<div class="col g12" style="flex:1;align-items:center;text-align:center;position:relative">
<div class="ic" style="width:72px;height:72px;border-radius:50%;background:{'#1a47f5' if k < 3 else '#fff'};border:{'none' if k < 3 else '2px solid #bcd2ff'};box-shadow:0 12px 30px -12px rgba(26,71,245,.6)">{icon(i,30,'#fff' if k < 3 else '#1a47f5')}</div>
<div style="font-size:12px;font-weight:800" class="sun">ÉTAPE {k+1}</div><div style="font-weight:800;font-size:16px">{t}</div><div style="font-size:13px;width:190px" class="muted">{s}</div></div>'''

    pays = [("GA", "Gabon", "Libreville · Franceville · Moanda", "#009e60", "#fcd116", "#3a75c4", 25, 31), ("MA", "Maroc", "Rabat · Casablanca · Marrakech · Fès", "#c1272d", "#006233", "#c1272d", 61, 3340),
            ("SN", "Sénégal", "Dakar · Thiès · Saint-Louis · Ziguinchor", "#00853f", "#fdef42", "#e31b23", 34, 32)]
    pc = ""
    for code, nom, villes, c1, c2, c3, sup, sec in pays:
        flag = f'<div class="row" style="width:54px;height:36px;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.15)"><div style="flex:1;height:100%;background:{c1}"></div><div style="flex:1;height:100%;background:{c2}"></div><div style="flex:1;height:100%;background:{c3}"></div></div>' if code != "GA" else '<div class="col" style="width:54px;height:36px;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,.15)"><div style="flex:1;background:#009e60"></div><div style="flex:1;background:#fcd116"></div><div style="flex:1;background:#3a75c4"></div></div>'
        if code == "MA":
            flag = f'<div class="ic" style="width:54px;height:36px;border-radius:8px;background:#c1272d;box-shadow:0 4px 10px rgba(0,0,0,.15)">{icon("star",20,"#006233",2.5)}</div>'
        logos = "".join(logo(e["id"], 34) for e in list(ETABS.values()) if e["pays"] == code and e.get("logo"))[:0]
        sel = [e["id"] for e in ETABS.values() if e["pays"] == code and e.get("logo")][:5]
        lg = "".join(f'<div style="margin-left:-8px">{logo(i,38)}</div>' for i in sel)
        pc += f'''<div class="card col g20" style="flex:1;padding:26px;border-radius:24px;position:relative;overflow:hidden">
<div style="position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:{c1};opacity:.08"></div>
<div class="row g16">{flag}<div class="col g4"><div style="font-size:22px;font-weight:800">{nom}</div><div style="font-size:13px" class="muted">{villes}</div></div></div>
<div class="row g24"><div class="col"><div style="font-size:24px;font-weight:800">{sup}</div><div style="font-size:12px" class="muted">établissements sup.</div></div>
<div class="col"><div style="font-size:24px;font-weight:800">{f"{sec:,}".replace(",", " ")}</div><div style="font-size:12px" class="muted">collèges & lycées</div></div></div>
<div class="row between"><div class="row" style="padding-left:8px">{lg}</div><a class="btn btn-ghost" style="padding:10px 14px">Explorer {icon('arrow-right',16,'#1336e0')}</a></div></div>'''

    domaines = [("stethoscope", "Santé", "#ffecef", "#d42a50", 10), ("code-xml", "Numérique", "#eef4ff", "#1a47f5", 12), ("cog", "Ingénierie", "#f1edff", "#6a3df0", 10),
                ("hard-hat", "BTP", "#fff3c4", "#a55a00", 6), ("pickaxe", "Mines & énergie", "#fef0e6", "#c2410c", 4), ("sprout", "Agriculture", "#e8f8ef", "#0f8a46", 7),
                ("landmark", "Finance", "#e6f6fb", "#0e7490", 8), ("scale", "Droit", "#f3f4f6", "#374151", 4)]
    dm = "".join(f'<div class="card col g12" style="padding:20px;border-radius:20px"><div class="ic" style="width:48px;height:48px;background:{bg}">{icon(i,24,fg)}</div><div style="font-weight:800">{t}</div><div style="font-size:12px" class="muted">{n} métiers · voir les formations</div></div>' for i, t, bg, fg, n in domaines)

    marquee_ids = ["sn-ucad", "ma-um5", "ga-uob", "ma-um6p", "sn-ugb", "ma-emi", "ma-aui", "sn-esp", "ga-ustm", "ma-inpt", "sn-cesag", "ma-hem", "sn-dit", "ma-uh2c", "ga-ista", "sn-uasz", "ma-ehtp", "ma-insea"]
    mq = "".join(f'<div class="row g10" style="background:#fff;border:1px solid #e6eaf5;border-radius:16px;padding:10px 16px 10px 10px;flex-shrink:0">{logo(i,44)}<div class="col"><div style="font-weight:800;font-size:14px">{ETABS[i]["sigle"]}</div><div style="font-size:11px" class="muted">{ETABS[i]["ville"].split("(")[0]}</div></div></div>' for i in marquee_ids)

    mets = ["met-data-analyst", "met-medecin-generaliste", "met-ingenieur-genie-civil", "met-developpeur-web-mobile", "met-ingenieur-mines", "met-avocat"]
    colors = ["#1a47f5", "#d42a50", "#a55a00", "#6a3df0", "#c2410c", "#0e7490"]
    icons_m = ["chart-line", "stethoscope", "hard-hat", "code-xml", "pickaxe", "scale"]
    mc = ""
    for k, mid in enumerate(mets):
        m = METIERS[mid]
        comps = "".join(f'<span class="chip chip-blue">{c.replace("cmp-","").replace("-"," ").capitalize()[:18]}</span>' for c in m["competences"][:2])
        mc += f'''<div class="card col g12" style="padding:20px;border-radius:20px;width:300px;flex-shrink:0">
<div class="row between"><div class="ic" style="width:48px;height:48px;background:{colors[k]};border-radius:14px">{icon(icons_m[k],24,'#fff')}</div><div class="ic" style="width:36px;height:36px;border-radius:50%;background:#f6f8fe">{icon('heart',18,'#6b7493')}</div></div>
<div style="font-weight:800;font-size:16px">{m["nom"]}</div><div style="font-size:13px;line-height:1.5;height:40px;overflow:hidden" class="muted">{m["description"]}</div>
<div class="row g6">{comps}</div><div class="row between" style="border-top:1px solid #eef1f8;padding-top:12px"><span style="font-size:12px" class="muted">Profil {"·".join(m["riasec"])} · {m["niveau_min"].replace("niv-","").replace("bac","Bac+").replace("Bac+7","Bac+7")}</span><span style="font-size:13px;font-weight:700;color:#1a47f5">Voir la fiche →</span></div></div>'''

    res = [r for r in ref("navilease_logements")][:0]
    navilease = f"""<div class="wrap" style="margin-top:96px"><div style="position:relative;border-radius:32px;overflow:hidden;background:linear-gradient(135deg,#fff7dd,#fff 55%);border:1px solid #ffe9a8;padding:56px">
<div class="row between" style="align-items:center"><div class="col g20" style="width:520px">
<div class="row g10"><div class="ic" style="width:44px;height:44px;background:#ffc21f;border-radius:12px">{icon('key-round',22,'#0b1533')}</div><div style="font-size:24px;font-weight:800">Navi<span style="color:#1a47f5">lease</span></div><span class="chip chip-sun">Nouveau</span></div>
<h2>Admis ? Trouve ton logement <span style="color:#1a47f5">en toute sécurité.</span></h2>
<p class="soft" style="font-size:16px;line-height:1.6">Studios, colocations, résidences et cités universitaires près de ton établissement. Bailleurs vérifiés, paiement en séquestre, contrat numérique et quittances.</p>
<div class="row g16">{''.join(f'<div class="row g8" style="font-size:14px;font-weight:700">{icon("badge-check",18,"#0f8a46")}{t}</div>' for t in ["Bailleurs vérifiés", "Paiement protégé", "Garant parent"])}</div>
<div class="row g12"><a class="btn btn-primary">Chercher un logement {icon('arrow-right',18,'#fff')}</a><a class="btn btn-ghost">Je suis bailleur</a></div></div>
<div style="position:relative;width:560px;height:380px">
 <div class="card" style="position:absolute;left:0;top:20px;width:340px;border-radius:24px;overflow:hidden">
  <div style="height:170px;background:linear-gradient(135deg,#8eb4ff,#1a47f5);position:relative"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{icon('building',80,'rgba(255,255,255,.55)',1.5)}</div>
  <span class="chip chip-green" style="position:absolute;left:14px;top:14px">✓ Visité par Navilease</span></div>
  <div class="col g8" style="padding:18px"><div class="row between"><div style="font-weight:800">Studio meublé · Agdal</div><div style="font-weight:800;color:#1a47f5">2 800 MAD<span class="muted" style="font-size:11px">/mois</span></div></div>
  <div class="row g8 muted" style="font-size:12px">{icon('map-pin',14,'#6b7493')} 8 min à pied de l'ENSIAS</div>
  <div class="row g6"><span class="chip chip-blue">Wifi</span><span class="chip chip-blue">Meublé</span><span class="chip chip-blue">Gardien 24h</span></div></div></div>
 <div class="card col g10" style="position:absolute;right:0;top:0;width:250px;padding:18px;border-radius:20px">
  <div style="font-size:12px;font-weight:800" class="muted">RÉSERVATION NL-2026-00342</div>
  {''.join(f'<div class="row g10" style="font-size:13px;font-weight:600"><div class="ic" style="width:22px;height:22px;border-radius:50%;background:{"#1a47f5" if d else "#e8edfa"}">{icon("check",13,"#fff" if d else "#b0b8d4",3)}</div>{t}</div>' for t, d in [("Demande acceptée", 1), ("Paiement en séquestre", 1), ("Contrat signé", 1), ("Entrée dans les lieux", 0)])}</div>
 <div class="card row g12" style="position:absolute;right:30px;bottom:20px;padding:14px 18px;border-radius:18px">
  <div class="ic" style="width:40px;height:40px;background:#e8f8ef;border-radius:50%">{icon('shield-check',22,'#0f8a46')}</div><div class="col"><div style="font-weight:800;font-size:14px">Paiement protégé</div><div style="font-size:12px" class="muted">Airtel Money · Wave · Orange Money</div></div></div>
 <div class="ann" style="left:120px;top:-6px">Cartes empilées : entrée en cascade au scroll</div>
</div></div></div></div>"""

    news = [("Bourses", "chip-sun", "Bourses d'études 2026 : 10 opportunités pour les étudiants africains", "10 oct. 2026", "#1a47f5,#598bff", "award"),
            ("Orientation", "chip-green", "Comment bien choisir sa série après le BEPC, le BFEM ou le tronc commun ?", "08 oct. 2026", "#0f8a46,#34d399", "compass"),
            ("International", "chip-violet", "Étudier au Maroc quand on est Gabonais : démarches, coûts et logement", "06 oct. 2026", "#6a3df0,#a78bfa", "plane")]
    nw = "".join(f'''<div class="card" style="flex:1;border-radius:22px;overflow:hidden"><div style="height:170px;background:linear-gradient(135deg,{g});display:flex;align-items:center;justify-content:center">{icon(i,64,"rgba(255,255,255,.7)",1.5)}</div>
<div class="col g10" style="padding:20px"><div class="row between"><span class="chip {c}">{t}</span><span style="font-size:12px" class="muted">{d}</span></div><div style="font-weight:800;font-size:17px;line-height:1.35">{h}</div><div style="font-size:13px;font-weight:700;color:#1a47f5">Lire l'article →</div></div></div>''' for t, c, h, d, g, i in news)

    body = f"""{header()}
<div style="position:relative;background:radial-gradient(1200px 600px at 85% 20%,#dae6ff 0%,transparent 60%),radial-gradient(800px 500px at 0% 100%,#fff3c4 0%,transparent 60%),#f6f8fe">
<div class="wrap row between" style="padding:40px 0 30px;position:relative">
 <div class="col g24" style="width:620px">
  <div class="row g10"><span class="chip chip-blue">{icon('sparkles',14,'#1336e0')} Nouveau : test d'orientation IA</span><span class="chip chip-sun">🇬🇦 🇲🇦 🇸🇳 3 pays</span></div>
  <h1>Ton avenir<br>commence <span style="background:linear-gradient(90deg,#ffc21f,#f9a806);-webkit-background-clip:text;color:transparent">ici.</span></h1>
  <p class="soft" style="font-size:19px;line-height:1.6">La plateforme panafricaine d'<b>orientation</b>, de <b>formation</b>, de <b>candidature</b> et de <b>logement étudiant</b>. Découvre qui tu es, ce que tu peux devenir et où te former.</p>
  <div class="search row between"><div class="row g12" style="flex:1">{icon('search',20,'#6b7493')}<span class="muted" style="font-size:15px">Un métier, une formation, un établissement… ex : « informatique Dakar »</span></div><a class="btn btn-primary" style="padding:14px 22px">Rechercher</a></div>
  <div class="row g8" style="font-size:13px"><span class="muted">Populaire :</span>{''.join(f'<span class="chip" style="background:#fff;border:1px solid #e6eaf5;color:#3b4566">{t}</span>' for t in ["Médecine", "Data analyst", "UCAD", "Écoles d'ingénieurs Maroc", "BTS Libreville"])}</div>
  <div class="row g40" style="margin-top:12px">{st}</div>
  <div class="ann" style="left:330px;top:6px">Titre : mots en cascade (stagger 60 ms) · « ici. » soulignement animé</div>
 </div>
 {hero_visual()}
 <div class="hand" style="position:absolute;right:0;top:30px;font-size:26px;color:#1336e0;transform:rotate(-6deg);width:200px;line-height:1.1">« S'orienter aujourd'hui pour construire l'Afrique de demain. »</div>
</div>
<div class="wrap row g16" style="padding-bottom:40px">{qk}</div>
</div>
<div style="background:#fff;border-top:1px solid #eef1f8;border-bottom:1px solid #eef1f8;padding:28px 0;position:relative">
 <div class="wrap row g16" style="margin-bottom:14px"><div class="eyebrow" style="color:#6b7493">Ils sont sur Navigoal</div><div style="flex:1;height:1px;background:#eef1f8"></div></div>
 <div class="row g16" style="padding-left:80px;overflow:hidden">{mq}</div>
 <div class="ann" style="right:80px;top:20px">Marquee infini 40 s · pause au survol</div>
</div>
<div class="wrap col g40" style="margin-top:96px;position:relative"><div class="col g12" style="align-items:center;text-align:center"><div class="eyebrow">Ton parcours</div><h2>De « je ne sais pas » à « je suis installé·e »</h2><p class="muted" style="font-size:16px;width:620px">Navigoal t'accompagne à chaque étape, sur ton téléphone, même avec peu de données.</p></div>
<div style="position:relative"><div style="position:absolute;left:130px;right:130px;top:36px;height:4px;border-radius:4px;background:linear-gradient(90deg,#1a47f5 0%,#1a47f5 55%,#e8edfa 55%)"></div><div class="row" style="position:relative">{stp}</div></div>
<div class="ann" style="left:520px;top:330px">La ligne se remplit au scroll (scroll-linked)</div></div>
<div class="wrap col g32" style="margin-top:96px"><div class="row between" style="align-items:flex-end"><div class="col g12"><div class="eyebrow">Lancement</div><h2>Explore 3 pays, un seul parcours</h2></div><a class="btn btn-ghost">Tous les pays {icon('arrow-right',16,'#1336e0')}</a></div><div class="row g24">{pc}</div></div>
<div class="wrap col g32" style="margin-top:96px"><div class="row between" style="align-items:flex-end"><div class="col g12"><div class="eyebrow">Domaines</div><h2>Que veux-tu faire plus tard ?</h2></div><div class="row g8"><span class="chip chip-blue">Tous</span><span class="chip" style="background:#fff;border:1px solid #e6eaf5">Bac+2</span><span class="chip" style="background:#fff;border:1px solid #e6eaf5">Bac+3</span><span class="chip" style="background:#fff;border:1px solid #e6eaf5">Bac+5</span></div></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">{dm}</div></div>
<div class="col g32" style="margin-top:96px"><div class="wrap row between" style="align-items:flex-end"><div class="col g12"><div class="eyebrow">Métiers</div><h2>Des métiers qui recrutent en Afrique</h2></div><div class="row g10"><div class="ic" style="width:46px;height:46px;border-radius:50%;background:#fff;border:1px solid #e6eaf5">{icon('arrow-left',20,'#0b1533')}</div><div class="ic" style="width:46px;height:46px;border-radius:50%;background:#1a47f5">{icon('arrow-right',20,'#fff')}</div></div></div>
<div class="row g20" style="padding-left:80px">{mc}</div></div>
{navilease}
<div class="wrap col g32" style="margin-top:96px"><div class="row between" style="align-items:flex-end"><div class="col g12"><div class="eyebrow">Actualités</div><h2>Bourses, concours, conseils</h2></div><a class="btn btn-ghost">Toutes les actualités {icon('arrow-right',16,'#1336e0')}</a></div><div class="row g24">{nw}</div></div>
{cta_band()}
{footer()}"""
    save("01-accueil", doc("Navigoal — Accueil", body))


# =====================================================================================
# 2. TEST D'ORIENTATION + RÉSULTAT
# =====================================================================================
def app_shell(active, content, title_right=""):
    items = [("layout-dashboard", "Tableau de bord"), ("user-round", "Mon profil"), ("compass", "Mon orientation"), ("briefcase", "Métiers"), ("graduation-cap", "Formations"),
             ("building-2", "Établissements"), ("file-text", "Mes candidatures"), ("folder", "Mes documents"), ("house", "Mon logement"), ("message-circle", "Messages"), ("settings", "Paramètres")]
    side = "".join(f'<div class="row g12" style="padding:11px 14px;border-radius:12px;font-size:14px;font-weight:{700 if t == active else 600};background:{"#eef4ff" if t == active else "transparent"};color:{"#1a47f5" if t == active else "#3b4566"}">{icon(i,18,"#1a47f5" if t == active else "#6b7493")}{t}{"<span class=chip style=background:#ffc21f;margin-left:auto;padding:2px 8px>2</span>" if t == "Messages" else ""}</div>' for i, t in items)
    return f"""<div class="row" style="align-items:stretch;min-height:1000px">
<div class="col g24" style="width:260px;background:#fff;border-right:1px solid #e6eaf5;padding:24px 16px">{brand()}<div class="col g4">{side}</div>
<div style="margin-top:auto;border-radius:18px;padding:18px;background:linear-gradient(135deg,#1a47f5,#598bff);color:#fff" class="col g8"><div style="font-weight:800">Besoin d'aide ?</div><div style="font-size:12px;color:#dae6ff">Échange avec un conseiller d'orientation.</div><a class="btn btn-sun" style="padding:9px 12px;font-size:13px">Prendre rendez-vous</a></div></div>
<div class="col" style="flex:1"><div class="row between" style="height:76px;padding:0 32px;background:#fff;border-bottom:1px solid #e6eaf5">
<div class="row g10" style="width:420px;background:#f6f8fe;border-radius:12px;padding:11px 16px">{icon('search',18,'#6b7493')}<span class="muted" style="font-size:14px">Rechercher…</span></div>
<div class="row g16">{title_right}<div class="ic" style="width:42px;height:42px;background:#f6f8fe;border-radius:12px;position:relative">{icon('bell',20,'#3b4566')}<div style="position:absolute;right:9px;top:9px;width:8px;height:8px;border-radius:50%;background:#ff3d7f"></div></div>
<div class="row g10"><div class="ic" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#ffc21f,#f9a806);font-weight:800;color:#0b1533">AM</div><div class="col"><div style="font-weight:700;font-size:14px">Amina Mba</div><div style="font-size:12px" class="muted">Terminale C · Libreville</div></div></div></div></div>
<div style="padding:32px">{content}</div></div></div>"""


def orientation():
    choices = [("users", "Travailler en équipe sur des projets", "#eef4ff", "#1a47f5", True), ("cpu", "Résoudre des problèmes techniques", "#f1edff", "#6a3df0", False),
               ("palette", "Exprimer ma créativité", "#ffecef", "#d42a50", False), ("clipboard-list", "Organiser et planifier des activités", "#e8f8ef", "#0f8a46", False)]
    ch = "".join(f'''<div class="col g16" style="flex:1;padding:22px;border-radius:22px;background:#fff;border:{"2.5px solid #1a47f5" if s else "1.5px solid #e6eaf5"};box-shadow:{"0 18px 40px -16px rgba(26,71,245,.55)" if s else "none"};position:relative">
{"<div class=ic style='position:absolute;right:14px;top:14px;width:28px;height:28px;border-radius:50%;background:#1a47f5'>" + icon("check",16,"#fff",3) + "</div>" if s else ""}
<div class="ic" style="width:100%;height:150px;border-radius:16px;background:{bg}">{icon(i,64,fg,1.6)}</div><div style="font-weight:800;font-size:15px;line-height:1.35">{t}</div></div>''' for i, t, bg, fg, s in choices)
    test = f"""<div class="card col g24" style="padding:36px;border-radius:28px;position:relative">
<div class="row between"><div class="col g6"><div class="eyebrow">Test d'orientation · Lycée</div><h2 style="font-size:30px">Quelle activité préfères-tu ?</h2><div class="muted">Choisis la réponse qui te correspond le plus. Il n'y a pas de mauvaise réponse.</div></div>
<div class="col g8" style="width:220px;align-items:flex-end"><div style="font-size:13px;font-weight:700">Question 3 sur 20</div><div class="bar" style="width:220px"><div style="width:15%"></div></div></div></div>
<div class="row g20">{ch}</div>
<div class="row between"><a class="btn btn-ghost">{icon('arrow-left',16,'#1336e0')} Précédent</a><div class="row g8">{''.join(f'<div style="width:{22 if k == 2 else 8}px;height:8px;border-radius:8px;background:{"#1a47f5" if k <= 2 else "#e8edfa"}"></div>' for k in range(8))}</div><a class="btn btn-primary">Suivant {icon('arrow-right',16,'#fff')}</a></div>
<div class="ann" style="left:300px;top:-12px">Transition question : slide + fade (spring) · sélection = pop + check</div></div>"""

    # radar
    vals = {"R": 45, "I": 88, "A": 40, "S": 55, "E": 60, "C": 82}
    import math
    cx, cy, r = 170, 170, 130
    pts, axes, labels, grid = [], "", "", ""
    for lvl in (0.25, 0.5, 0.75, 1):
        gp = " ".join(f"{cx + r*lvl*math.cos(math.pi/2*3 + k*math.pi/3):.1f},{cy + r*lvl*math.sin(math.pi/2*3 + k*math.pi/3):.1f}" for k in range(6))
        grid += f'<polygon points="{gp}" fill="none" stroke="#dbe3f7" stroke-width="1"/>'
    for k, (code, v) in enumerate(vals.items()):
        a = math.pi / 2 * 3 + k * math.pi / 3
        pts.append(f"{cx + r*v/100*math.cos(a):.1f},{cy + r*v/100*math.sin(a):.1f}")
        axes += f'<line x1="{cx}" y1="{cy}" x2="{cx + r*math.cos(a):.1f}" y2="{cy + r*math.sin(a):.1f}" stroke="#dbe3f7"/>'
        labels += f'<text x="{cx + (r+22)*math.cos(a):.1f}" y="{cy + (r+22)*math.sin(a)+5:.1f}" text-anchor="middle" font-size="14" font-weight="800" fill="{"#1a47f5" if v > 70 else "#6b7493"}" font-family="Plus Jakarta Sans">{code}</text>'
    radar = f'<svg width="340" height="340" viewBox="0 0 340 340">{grid}{axes}<polygon points="{" ".join(pts)}" fill="rgba(26,71,245,.22)" stroke="#1a47f5" stroke-width="3" stroke-linejoin="round"/>{"".join(f"<circle cx={p.split(",")[0]} cy={p.split(",")[1]} r=5 fill=#fff stroke=#1a47f5 stroke-width=3 />" for p in pts)}{labels}</svg>'

    doms = [("code-xml", "Informatique & numérique", 92), ("landmark", "Finance & comptabilité", 86), ("briefcase", "Gestion & management", 78), ("chart-line", "Statistique & data", 75)]
    dm = "".join(f'<div class="row g12"><div class="ic" style="width:40px;height:40px;background:#eef4ff;border-radius:12px">{icon(i,20,"#1a47f5")}</div><div class="col g6" style="flex:1"><div class="row between" style="font-size:14px;font-weight:700"><span>{t}</span><span style="color:#1a47f5">{v} %</span></div><div class="bar"><div style="width:{v}%"></div></div></div></div>' for i, t, v in doms)
    mets = ["met-data-analyst", "met-controleur-gestion", "met-auditeur", "met-chef-projet", "met-analyste-financier", "met-ingenieur-logiciel"]
    mt = "".join(f'<div class="row g12" style="padding:12px;border:1px solid #eef1f8;border-radius:16px"><div class="ic" style="width:42px;height:42px;background:linear-gradient(135deg,#1a47f5,#598bff);border-radius:12px">{icon("briefcase",20,"#fff")}</div><div class="col" style="flex:1"><div style="font-weight:800;font-size:14px">{METIERS[m]["nom"]}</div><div style="font-size:12px" class="muted">{len(METIERS[m]["formations"])} formations · {METIERS[m]["niveau_min"].replace("niv-bac","Bac+")}</div></div><span class="chip chip-green">{95-k*4} %</span></div>' for k, m in enumerate(mets))
    frm = [("frm-licence-informatique", "sn-ucad"), ("frm-ingenieur-informatique", "ma-ensias"), ("frm-master-finance-audit", "ga-bbs"), ("frm-ingenieur-statistique", "ma-insea")]
    fr = "".join(f'<div class="row g12" style="padding:12px;border:1px solid #eef1f8;border-radius:16px">{logo(e,46)}<div class="col" style="flex:1"><div style="font-weight:800;font-size:14px">{FORMATIONS[f]["intitule"][:44]}</div><div style="font-size:12px" class="muted">{ETABS[e]["sigle"]} · {ETABS[e]["ville"].split("(")[0]}</div></div><span class="chip chip-green">{91-k*3} %</span></div>' for k, (f, e) in enumerate(frm))

    result = f"""<div class="col g24"><div class="row between"><div class="col g6"><div class="eyebrow">Résultat · passé le 08 oct. 2026</div><h2 style="font-size:30px">Mon profil d'orientation</h2></div><div class="row g10"><a class="btn btn-ghost">{icon('download',16,'#1336e0')} Télécharger mon rapport PDF</a><a class="btn btn-primary">{icon('share-2',16,'#fff')} Partager avec mes parents</a></div></div>
<div class="row g24" style="align-items:stretch">
<div class="card col g16" style="flex:1.1;padding:28px;border-radius:24px;background:linear-gradient(160deg,#fff 55%,#eef4ff);position:relative"><div class="row g24"><div>{radar}</div>
<div class="col g16" style="flex:1"><div class="muted" style="font-size:13px;font-weight:700">PROFIL DOMINANT</div><div style="font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1.1">Analyste <span class="sun">/</span> Organisateur</div>
<p class="soft" style="font-size:14px;line-height:1.6">Tu aimes analyser, structurer, résoudre des problèmes et travailler sur des projets concrets. Tu as un bon esprit logique et le sens de l'organisation.</p>
<div class="row g8" style="flex-wrap:wrap">{''.join(f'<span class="chip chip-violet">{t}</span>' for t in ["Analyse", "Organisation", "Esprit logique", "Rigueur", "Résolution de problèmes"])}</div></div></div>
<div class="ann" style="left:40px;top:-12px">Radar : tracé animé (pathLength 0→1, 1,2 s) · scores en compteur</div></div>
<div class="card col g16" style="flex:.9;padding:28px;border-radius:24px"><h3>Domaines recommandés</h3>{dm}</div></div>
<div class="row g24" style="align-items:stretch"><div class="card col g12" style="flex:1;padding:24px;border-radius:24px"><div class="row between"><h3>Métiers recommandés</h3><span style="font-size:13px;font-weight:700;color:#1a47f5">Voir tout</span></div>{mt}</div>
<div class="card col g12" style="flex:1;padding:24px;border-radius:24px"><div class="row between"><h3>Formations recommandées</h3><span style="font-size:13px;font-weight:700;color:#1a47f5">Voir tout</span></div>{fr}
<div class="row g10" style="margin-top:6px;padding:14px;border-radius:16px;background:#fff7dd"><div class="ic" style="width:36px;height:36px;background:#ffc21f;border-radius:10px">{icon('lightbulb',18,'#0b1533')}</div><div style="font-size:13px"><b>Conseil :</b> ta série C t'ouvre aussi les CPGE au Maroc et les concours d'écoles d'ingénieurs.</div></div></div></div></div>"""
    save("02-orientation-test", doc("Navigoal — Test d'orientation", app_shell("Mon orientation", test)))
    save("03-orientation-resultat", doc("Navigoal — Résultat d'orientation", app_shell("Mon orientation", result)))


# =====================================================================================
# 3. RECHERCHE DE FORMATIONS + FICHE FORMATION
# =====================================================================================
def formations():
    filtres = [("Pays", ["Gabon", "Maroc", "Sénégal"], [0, 1, 2]), ("Niveau", ["Bac+2 (BTS, DUT)", "Bac+3 (Licence)", "Bac+5 (Master, Ingénieur)", "Doctorat"], [1, 2]),
               ("Domaine", ["Numérique", "Santé", "Ingénierie", "Gestion", "Finance"], [0]), ("Statut", ["Public", "Privé"], [0, 1]), ("Admission", ["Sur dossier", "Concours", "De droit"], [])]
    fl = ""
    for t, opts, on in filtres:
        fl += f'<div class="col g10"><div style="font-weight:800;font-size:14px">{t}</div>' + "".join(f'<div class="row g10" style="font-size:14px"><div class="ic" style="width:20px;height:20px;border-radius:6px;background:{"#1a47f5" if k in on else "#fff"};border:{"none" if k in on else "1.5px solid #cdd5ea"}">{icon("check",13,"#fff",3) if k in on else ""}</div>{o}</div>' for k, o in enumerate(opts)) + "</div>"
    items = [("frm-licence-informatique", "sn-ucad", 94, "Dakar", "3 ans", "Public", "Gratuit (+ frais d'inscription)"), ("frm-ingenieur-informatique", "ma-ensias", 91, "Rabat", "3 ans après CPGE", "Public", "Concours CNC"),
             ("frm-licence-genie-logiciel", "sn-isi", 88, "Dakar", "3 ans", "Privé", "1 650 000 FCFA/an"), ("frm-master-data-science-ia", "ma-um6p", 86, "Benguerir", "2 ans", "Privé non lucratif", "Bourses disponibles"),
             ("frm-dut-reseaux-telecoms", "sn-esmt", 82, "Dakar", "2 ans", "Inter-États", "Sur dossier"), ("frm-licence-informatique", "ga-ustm", 80, "Franceville", "3 ans", "Public", "Sur dossier")]
    cards = ""
    for k, (f, e, c, v, d, s, p) in enumerate(items):
        F = FORMATIONS[f]
        cards += f'''<div class="card row g20" style="padding:18px;border-radius:22px;{"box-shadow:0 24px 50px -20px rgba(26,71,245,.45);border-color:#bcd2ff" if k == 0 else ""}">
<div style="width:150px;height:118px;border-radius:16px;background:linear-gradient(135deg,{["#1a47f5,#598bff","#6a3df0,#a78bfa","#0e7490,#22d3ee","#c2410c,#fb923c","#0f8a46,#34d399","#1336e0,#8eb4ff"][k]});display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0">{icon("graduation-cap",48,"rgba(255,255,255,.75)",1.6)}<div style="position:absolute;left:10px;bottom:-14px">{logo(e,44)}</div></div>
<div class="col g8" style="flex:1"><div class="row between"><div class="col g4"><div style="font-weight:800;font-size:17px">{F["intitule"]}</div><div class="soft" style="font-size:14px;font-weight:600">{ETABS[e]["nom"]}</div></div><div class="ic" style="width:38px;height:38px;border-radius:50%;background:{"#ffecef" if k == 0 else "#f6f8fe"}">{icon("heart",18,"#d42a50" if k == 0 else "#6b7493")}</div></div>
<div class="row g8 muted" style="font-size:13px">{icon("map-pin",14,"#6b7493")}{v}, {ETABS[e]["pays"].replace("SN","Sénégal").replace("MA","Maroc").replace("GA","Gabon")}</div>
<div class="row between"><div class="row g6"><span class="chip chip-blue">{F["diplome"]}</span><span class="chip" style="background:#f6f8fe;color:#3b4566">{icon("clock",12,"#3b4566")} {d}</span><span class="chip" style="background:#f6f8fe;color:#3b4566">{s}</span><span class="chip chip-green">{icon("sparkles",12,"#0f8a46")} {c} % compatible</span></div>
<a class="btn {"btn-primary" if k == 0 else "btn-ghost"}" style="padding:10px 16px">Voir la formation</a></div></div></div>'''
    body = f"""{header("Formations")}
<div style="background:linear-gradient(180deg,#eef4ff,#f6f8fe);padding:40px 0 30px"><div class="wrap col g20"><div class="row g8 muted" style="font-size:13px">Accueil {icon('chevron-right',14,'#6b7493')} Formations</div>
<div class="row between"><div class="col g8"><h2>Rechercher une formation</h2><div class="muted" style="font-size:16px">93 formations types · 120 établissements · recommandations selon ton profil</div></div><div class="hand" style="font-size:28px;color:#1336e0;transform:rotate(-4deg)">Trouve ta voie →</div></div>
<div class="search row g12" style="padding:10px"><div class="row g10" style="flex:1.4;padding:10px 14px;border-right:1px solid #eef1f8">{icon('search',18,'#6b7493')}<span style="font-weight:600">Informatique</span></div>
{''.join(f'<div class="col" style="flex:1;padding:4px 14px;border-right:1px solid #eef1f8"><span style="font-size:11px;font-weight:700" class="muted">{a}</span><div class="row between" style="font-weight:700;font-size:14px">{b}{icon("chevron-down",16,"#6b7493")}</div></div>' for a, b in [("Pays", "Tous (3)"), ("Ville", "Toutes"), ("Niveau", "Licence, Master")])}
<a class="btn btn-primary">Rechercher</a></div></div></div>
<div class="wrap row g32" style="align-items:flex-start;margin-top:24px;margin-bottom:80px">
<div class="card col g24" style="width:290px;padding:24px;border-radius:22px"><div class="row between"><h3>Filtres</h3><span style="font-size:13px;font-weight:700;color:#1a47f5">Réinitialiser</span></div>{fl}<a class="btn btn-primary">Appliquer les filtres</a></div>
<div class="col g16" style="flex:1"><div class="row between"><div style="font-weight:800">124 formations trouvées</div><div class="row g10"><span class="muted" style="font-size:14px">Trier par</span><span class="chip" style="background:#fff;border:1px solid #e6eaf5;padding:8px 14px">Compatibilité {icon('chevron-down',14,'#3b4566')}</span><div class="row" style="background:#fff;border:1px solid #e6eaf5;border-radius:10px;padding:3px"><div class="ic" style="width:34px;height:30px;background:#eef4ff;border-radius:8px">{icon('list',16,'#1a47f5')}</div><div class="ic" style="width:34px;height:30px">{icon('map',16,'#6b7493')}</div></div></div></div>
{cards}<div class="ann" style="position:relative;align-self:flex-start">Résultats : apparition en stagger + layout animé au filtrage</div></div></div>
{footer()}"""
    save("04-formations", doc("Navigoal — Formations", body))

    F = FORMATIONS["frm-licence-informatique"]
    e = ETABS["sn-ucad"]
    tabs = ["Présentation", "Conditions d'admission", "Programme", "Frais", "Débouchés", "Documents", "Logement", "Avis"]
    fiche = f"""{header("Formations")}
<div style="position:relative;height:320px;background:linear-gradient(120deg,#0b1a4f,#1336e0 60%,#598bff);overflow:hidden">
<div style="position:absolute;inset:0" class="row"><div style="position:absolute;right:120px;top:40px">{icon('building-2',260,'rgba(255,255,255,.12)',1)}</div><div style="position:absolute;left:-100px;bottom:-200px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,194,31,.35),transparent 70%)"></div></div>
<div class="wrap col g16" style="position:relative;padding-top:40px;color:#fff"><div class="row g8" style="font-size:13px;color:#bcd2ff">Accueil {icon('chevron-right',14,'#bcd2ff')} Formations {icon('chevron-right',14,'#bcd2ff')} Licence en informatique</div>
<div class="row g20">{logo('sn-ucad',84)}<div class="col g8"><h1 style="font-size:46px;letter-spacing:-1.4px">Licence en Informatique</h1><div class="row g16" style="color:#dae6ff;font-size:15px;font-weight:600"><span>{e["nom"]}</span>·<span class="row g6">{icon('map-pin',16,'#dae6ff')} Dakar, Sénégal</span>·<span>Public</span></div></div></div></div></div>
<div class="wrap row g32" style="align-items:flex-start;margin-top:-56px;position:relative;margin-bottom:60px">
<div class="col g24" style="flex:1"><div class="card row g24" style="padding:20px 24px;border-radius:22px">{''.join(f'<div class="col g4"><span style="font-size:12px" class="muted">{a}</span><span style="font-weight:800">{b}</span></div>' for a, b in [("Diplôme", "Licence (LMD)"), ("Durée", "3 ans"), ("Admission", "De droit / Campusen"), ("Séries conseillées", "S1, S2, S3"), ("Rentrée", "Novembre 2026")])}</div>
<div class="row g24" style="border-bottom:1px solid #e6eaf5">{''.join(f'<div style="padding:12px 0;font-size:14px;font-weight:700;color:{"#1a47f5" if k == 0 else "#6b7493"};border-bottom:{"3px solid #1a47f5" if k == 0 else "none"}">{t}</div>' for k, t in enumerate(tabs))}</div>
<div class="card col g16" style="padding:28px;border-radius:22px"><h3>Présentation de la formation</h3><p class="soft" style="line-height:1.7">La Licence en informatique forme des professionnels capables de concevoir, développer et gérer des solutions informatiques adaptées aux besoins des entreprises et des organisations africaines : développement logiciel, bases de données, réseaux et initiation à la data et à l'IA.</p>
<h3 style="margin-top:8px">Objectifs</h3>{''.join(f'<div class="row g10 soft">{icon("circle-check",18,"#0f8a46")}{t}</div>' for t in ["Former des experts en développement et systèmes d'information", "Acquérir des compétences en réseaux et sécurité", "Maîtriser les bases de la data et de l'IA", "Préparer à l'insertion professionnelle ou au master"])}</div>
<div class="row g20"><div class="card col g12" style="flex:1;padding:24px;border-radius:22px"><h3>Compétences visées</h3><div class="row g8" style="flex-wrap:wrap">{''.join(f'<span class="chip chip-blue">{c}</span>' for c in ["Programmation", "Bases de données & SQL", "Raisonnement mathématique", "Résolution de problèmes", "Réseaux", "Anglais technique"])}</div></div>
<div class="card col g12" style="flex:1;padding:24px;border-radius:22px"><h3>Débouchés</h3>{''.join(f'<div class="row between" style="font-size:14px;font-weight:600"><span class="row g8">{icon("briefcase",16,"#1a47f5")}{METIERS[m]["nom"]}</span>{icon("arrow-up-right",16,"#6b7493")}</div>' for m in F["metiers"][:4])}</div></div></div>
<div class="col g20" style="width:380px">
<div class="card col g16" style="padding:24px;border-radius:24px;box-shadow:0 30px 60px -24px rgba(26,71,245,.45)"><div class="row between"><span class="chip chip-green" style="font-size:14px;padding:8px 14px">{icon('sparkles',16,'#0f8a46')} 94 % compatible</span><span class="muted" style="font-size:12px">avec ton profil</span></div>
<div class="bar"><div style="width:94%"></div></div><div class="col g8" style="font-size:13px">{''.join(f'<div class="row g8">{icon("check",14,"#0f8a46",3)}{t}</div>' for t in ["Ta série (S1) est acceptée", "Correspond à ton profil Analyste", "Dans ton budget"])}</div>
<a class="btn btn-primary" style="width:100%">Candidater maintenant {icon('arrow-right',16,'#fff')}</a><a class="btn btn-ghost" style="width:100%">{icon('heart',16,'#1336e0')} Ajouter aux favoris</a>
<div class="row g8 muted" style="font-size:12px;justify-content:center">{icon('calendar',14,'#6b7493')} Candidatures jusqu'au 15 nov. 2026</div>
<div class="ann" style="left:-40px;top:-14px">Carte sticky · bouton « shine » au survol</div></div>
<div class="card col g12" style="padding:22px;border-radius:22px;background:linear-gradient(160deg,#fff,#fff7dd)"><div class="row g10"><div class="ic" style="width:38px;height:38px;background:#ffc21f;border-radius:10px">{icon('key-round',18,'#0b1533')}</div><div style="font-weight:800">Se loger près de l'UCAD</div></div>
{''.join(f'<div class="row between" style="font-size:13px;padding:10px 12px;background:#fff;border-radius:12px;border:1px solid #f3e6bd"><span class="col"><b>{a}</b><span class="muted">{b}</span></span><b style="color:#1a47f5">{c}</b></div>' for a, b, c in [("Campus social UCAD (COUD)", "Cité universitaire · sur dossier", "Public"), ("Chambre en colocation · Fann", "6 min · vérifiée ✓", "75 000 F"), ("Studio meublé · Point E", "12 min · visitée ✓", "140 000 F")])}
<a style="font-size:13px;font-weight:700;color:#1a47f5">Voir les logements Navilease →</a></div></div></div>
{footer()}"""
    save("05-fiche-formation", doc("Navigoal — Fiche formation", fiche))


# =====================================================================================
# 4. NAVILEASE
# =====================================================================================
def navilease():
    logements = [("Studio meublé", "Agdal, Rabat", "2 800 MAD", "8 min · ENSIAS", "visite", "#1a47f5,#598bff", "building"),
                 ("Chambre en colocation", "Fann, Dakar", "75 000 FCFA", "6 min · UCAD", "identite", "#0f8a46,#34d399", "users"),
                 ("Résidence étudiante privée", "Maârif, Casablanca", "3 500 MAD", "15 min · EHTP", "partenaire", "#6a3df0,#a78bfa", "hotel"),
                 ("Chambre chez l'habitant", "Akébé, Libreville", "90 000 FCFA", "10 min · UOB", "visite", "#c2410c,#fb923c", "house"),
                 ("Studio", "Sacré-Cœur, Dakar", "150 000 FCFA", "18 min · ESP", "identite", "#0e7490,#22d3ee", "building-2"),
                 ("Appartement 2 chambres (coloc)", "Guéliz, Marrakech", "2 200 MAD", "12 min · UCA", "partenaire", "#d42a50,#fb7185", "house")]
    badge = {"visite": ("chip-green", "✓ Visité par Navilease"), "identite": ("chip-blue", "Identité vérifiée"), "partenaire": ("chip-sun", "★ Partenaire certifié")}
    cards = ""
    for k, (t, q, p, d, b, g, i) in enumerate(logements):
        c, l = badge[b]
        cards += f'''<div class="card" style="border-radius:22px;overflow:hidden"><div style="height:180px;background:linear-gradient(135deg,{g});position:relative;display:flex;align-items:center;justify-content:center">{icon(i,74,"rgba(255,255,255,.6)",1.4)}
<span class="chip {c}" style="position:absolute;left:12px;top:12px">{l}</span><div class="ic" style="position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;background:#fff">{icon("heart",16,"#d42a50" if k == 1 else "#6b7493")}</div>
<div class="row g4" style="position:absolute;left:12px;bottom:12px">{"".join(f"<div style='width:{14 if j == 0 else 6}px;height:6px;border-radius:6px;background:{'#fff' if j == 0 else 'rgba(255,255,255,.55)'}'></div>" for j in range(4))}</div></div>
<div class="col g8" style="padding:16px 18px"><div class="row between"><div style="font-weight:800">{t}</div><div class="row g4" style="font-size:13px;font-weight:700">{icon("star",14,"#f9a806")}4,{8-k%3}</div></div>
<div class="row g6 muted" style="font-size:13px">{icon("map-pin",14,"#6b7493")}{q}</div><div class="row g6" style="font-size:13px;font-weight:600;color:#0f8a46">{icon("footprints",14,"#0f8a46")}{d}</div>
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:12px"><div><b style="font-size:18px;color:#1a47f5">{p}</b><span class="muted" style="font-size:12px"> /mois</span></div><a class="btn btn-ghost" style="padding:8px 12px;font-size:13px">Réserver</a></div></div></div>'''
    map_pins = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px" class="col" ><div class="chip" style="background:{"#1a47f5" if k == 0 else "#fff"};color:{"#fff" if k == 0 else "#0b1533"};box-shadow:0 8px 20px -8px rgba(0,0,0,.4);padding:6px 10px">{p}</div></div>' for k, (x, y, p) in enumerate([(120, 160, "2 800"), (260, 90, "3 100"), (210, 300, "2 400"), (330, 230, "3 500"), (80, 380, "1 900")]))
    steps = [("search", "Je cherche", "Par établissement, budget, type de logement."), ("calendar-check", "Je réserve", "Demande + pièces ; validation parent si mineur."),
             ("shield-check", "Je paie en séquestre", "Mobile money ou carte, fonds protégés."), ("signature", "Je signe", "Contrat numérique et état des lieux photo."), ("key-round", "J'emménage", "Quittances mensuelles, médiation en cas de litige.")]
    stp = "".join(f'<div class="col g10" style="flex:1"><div class="row g10"><div class="ic" style="width:48px;height:48px;border-radius:14px;background:{"#ffc21f" if k == 2 else "#fff"};border:1px solid #f3e6bd">{icon(i,22,"#0b1533")}</div><div style="font-size:28px;font-weight:800;color:#f3e6bd">0{k+1}</div></div><div style="font-weight:800">{t}</div><div style="font-size:13px" class="muted">{s}</div></div>' for k, (i, t, s) in enumerate(steps))
    body = f"""{header("Navilease")}
<div style="position:relative;background:radial-gradient(900px 500px at 80% 30%,#fff1c2,transparent 60%),linear-gradient(180deg,#fffaf0,#f6f8fe);padding:56px 0 40px;overflow:hidden">
<div class="wrap row between" style="align-items:center"><div class="col g20" style="width:640px">
<div class="row g10"><div class="ic" style="width:48px;height:48px;background:#ffc21f;border-radius:14px">{icon('key-round',24,'#0b1533')}</div><div style="font-size:28px;font-weight:800;letter-spacing:-.8px">Navi<span style="color:#1a47f5">lease</span></div><span class="chip chip-blue">par Navigoal</span></div>
<h1 style="font-size:60px">Ton logement étudiant,<br><span style="color:#1a47f5">vérifié</span> et <span class="sun">sécurisé.</span></h1>
<p class="soft" style="font-size:18px;line-height:1.6">Studios, colocations, résidences et cités universitaires près de ton établissement au Gabon, au Maroc et au Sénégal.</p>
<div class="search row g12" style="padding:10px"><div class="row g10" style="flex:1.5;padding:10px 14px;border-right:1px solid #eef1f8">{icon('graduation-cap',18,'#1a47f5')}<div class="col"><span style="font-size:11px;font-weight:700" class="muted">Mon établissement</span><b style="font-size:14px">ENSIAS — Rabat</b></div></div>
<div class="col" style="flex:1;padding:4px 14px;border-right:1px solid #eef1f8"><span style="font-size:11px;font-weight:700" class="muted">Budget max</span><b style="font-size:14px">3 000 MAD</b></div><div class="col" style="flex:1;padding:4px 14px"><span style="font-size:11px;font-weight:700" class="muted">Type</span><b style="font-size:14px">Studio, coloc</b></div><a class="btn btn-primary">{icon('search',16,'#fff')} Chercher</a></div>
<div class="row g24">{''.join(f'<div class="col"><b style="font-size:22px">{a}</b><span class="muted" style="font-size:13px">{b}</span></div>' for a, b in [("22", "cités universitaires publiques"), ("3", "pays couverts"), ("100 %", "paiements protégés")])}</div></div>
<div style="position:relative;width:540px;height:520px"><div style="position:absolute;inset:20px 0 0 40px;border-radius:32px;background:linear-gradient(160deg,#dae6ff,#eef4ff);overflow:hidden;border:6px solid #fff;box-shadow:0 40px 80px -30px rgba(11,21,51,.35)">
<svg width="500" height="500" style="position:absolute;inset:0"><path d="M0 120 C120 100 200 180 320 150 S480 60 520 90" stroke="#fff" stroke-width="14" fill="none"/><path d="M60 0 C90 160 40 300 150 520" stroke="#fff" stroke-width="10" fill="none"/><path d="M0 330 C150 300 300 380 520 320" stroke="#fff" stroke-width="12" fill="none"/><circle cx="250" cy="240" r="90" fill="rgba(26,71,245,.08)" stroke="#1a47f5" stroke-dasharray="6 6"/></svg>
<div style="position:absolute;left:225px;top:208px" class="col"><div class="ic" style="width:52px;height:52px;border-radius:50%;background:#1a47f5;border:4px solid #fff;box-shadow:0 10px 24px -6px rgba(26,71,245,.7)">{icon('graduation-cap',24,'#fff')}</div></div>{map_pins}</div>
<div class="card row g12" style="position:absolute;left:0;bottom:30px;padding:14px 16px;border-radius:18px;width:300px">{logo('ma-ensias',46)}<div class="col"><b style="font-size:14px">38 logements à moins de 20 min</b><span class="muted" style="font-size:12px">de l'ENSIAS · 12 vérifiés</span></div></div>
<div class="ann" style="right:0;top:0">Pins qui « tombent » sur la carte (spring) · cercle pulsé</div></div></div></div>
<div class="wrap col g24" style="margin-top:48px"><div class="row between"><div class="row g8">{''.join(f'<span class="chip {"chip-blue" if k == 0 else ""}" style="padding:9px 14px;{"" if k == 0 else "background:#fff;border:1px solid #e6eaf5;color:#3b4566"}">{t}</span>' for k, t in enumerate(["Tous", "Studios", "Colocations", "Résidences privées", "Cités universitaires", "Chez l'habitant", "Vérifiés uniquement"]))}</div><span class="muted" style="font-size:14px">164 logements · Rabat</span></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">{cards}</div></div>
<div class="wrap" style="margin-top:80px"><div style="border-radius:28px;background:#fffaf0;border:1px solid #f3e6bd;padding:44px" class="col g32"><div class="col g8"><div class="eyebrow" style="color:#a55a00">Comment ça marche</div><h2>Réserver sans arnaque, en 5 étapes</h2></div><div class="row g24" style="align-items:flex-start">{stp}</div></div></div>
<div class="wrap row g24" style="margin-top:80px;align-items:stretch">
<div class="card col g16" style="flex:1;padding:32px;border-radius:26px;background:linear-gradient(140deg,#0b1a4f,#1336e0);color:#fff;border:none"><div class="ic" style="width:52px;height:52px;background:rgba(255,255,255,.12);border-radius:14px">{icon('house-plus',26,'#ffc21f')}</div><div style="font-size:26px;font-weight:800">Vous êtes bailleur ?</div><p style="color:#c9d6ff;line-height:1.6">Louez à des étudiants vérifiés, encaissez en sécurité et générez contrats et quittances automatiquement.</p><a class="btn btn-sun" style="align-self:flex-start">Publier mon logement</a></div>
<div class="card col g16" style="flex:1;padding:32px;border-radius:26px"><div class="ic" style="width:52px;height:52px;background:#e8f8ef;border-radius:14px">{icon('users-round',26,'#0f8a46')}</div><div style="font-size:26px;font-weight:800">Parents, gardez la main</div><p class="soft" style="line-height:1.6">Validez la réservation de votre enfant, devenez garant et suivez les paiements depuis votre espace parent.</p><a class="btn btn-ghost" style="align-self:flex-start">Découvrir l'espace parent</a></div></div>
{cta_band("Prêt·e à <span class=\"sun\">t'installer</span> ?", "Navilease est intégré à ton parcours Navigoal : dès ton admission, on te propose les logements proches de ton établissement.")}
{footer()}"""
    save("06-navilease", doc("Navilease — Logement étudiant", body))


# =====================================================================================
# 5. TABLEAU DE BORD ÉTUDIANT
# =====================================================================================
def dashboard():
    steps = ["Profil complété", "Test d'orientation", "Recommandations", "Candidatures", "Admission", "Logement"]
    sp = ""
    for k, t in enumerate(steps):
        done, cur = k < 2, k == 2
        sp += f'<div class="col g8" style="align-items:center;flex:1;position:relative"><div class="ic" style="width:40px;height:40px;border-radius:50%;background:{"#0f8a46" if done else "#1a47f5" if cur else "#fff"};border:{"none" if done or cur else "2px solid #dbe3f7"};{"box-shadow:0 0 0 6px #dae6ff" if cur else ""}">{icon("check",18,"#fff",3) if done else f"<b style=color:{chr(35)}{'fff' if cur else '9aa3c0'}>{k+1}</b>"}</div><div style="font-size:12px;font-weight:700;text-align:center;color:{"#0b1533" if done or cur else "#9aa3c0"}">{t}</div></div>'
    actions = [("brain", "Repasser le test", "#1a47f5,#598bff"), ("briefcase", "Découvrir les métiers", "#0f8a46,#34d399"), ("graduation-cap", "Rechercher une formation", "#f9a806,#ffc21f"), ("key-round", "Trouver un logement", "#6a3df0,#a78bfa")]
    ac = "".join(f'<div style="flex:1;height:130px;border-radius:20px;padding:18px;background:linear-gradient(135deg,{g});color:#fff;position:relative;overflow:hidden" class="col between"><div style="position:absolute;right:-20px;bottom:-30px;opacity:.25">{icon(i,120,"#fff",1.5)}</div><div class="ic" style="width:40px;height:40px;background:rgba(255,255,255,.22);border-radius:12px">{icon(i,20,"#fff")}</div><div class="row between" style="font-weight:800">{t}{icon("arrow-up-right",18,"#fff")}</div></div>' for i, t, g in actions)
    recos = [("frm-licence-informatique", "ga-uob", 87), ("frm-ingenieur-informatique", "ma-emi", 85), ("frm-master-data-science-ia", "ma-um6p", 83)]
    rc = "".join(f'<div class="card col g10" style="flex:1;padding:16px;border-radius:18px"><div class="row g10">{logo(e,44)}<div class="col"><b style="font-size:14px">{FORMATIONS[f]["intitule"][:30]}</b><span class="muted" style="font-size:12px">{ETABS[e]["sigle"]} · {ETABS[e]["ville"].split("(")[0]}</span></div></div><div class="row between"><span class="chip chip-green">{c} % compatible</span>{icon("heart",16,"#6b7493")}</div></div>' for f, e, c in recos)
    cands = [("Licence en Informatique", "ga-uob", "Soumise", "chip-blue", 2), ("Cycle ingénieur — CPGE", "ma-emi", "En cours de traitement", "chip-sun", 3), ("Licence en Gestion", "ga-insg", "Acceptée", "chip-green", 5)]
    cd = ""
    for t, e, s, c, n in cands:
        dots = "".join(f'<div style="flex:1;height:6px;border-radius:6px;background:{"#1a47f5" if j < n else "#e8edfa"}"></div>' for j in range(5))
        cd += f'<div class="row g16" style="padding:14px;border:1px solid #eef1f8;border-radius:16px">{logo(e,46)}<div class="col g8" style="flex:1"><div class="row between"><b style="font-size:14px">{t}</b><span class="chip {c}">{s}</span></div><div class="row g4">{dots}</div></div></div>'
    content = f"""<div class="col g24"><div class="row between"><div class="col g6"><h2 style="font-size:32px">Bienvenue Amina 👋</h2><div class="muted">Continue ton parcours vers ton avenir.</div></div>
<div class="card row g16" style="padding:16px 20px;border-radius:18px;width:340px"><div style="position:relative;width:56px;height:56px"><svg width="56" height="56"><circle cx="28" cy="28" r="23" stroke="#e8edfa" stroke-width="7" fill="none"/><circle cx="28" cy="28" r="23" stroke="#1a47f5" stroke-width="7" fill="none" stroke-dasharray="144.5" stroke-dashoffset="29" stroke-linecap="round" transform="rotate(-90 28 28)"/></svg><b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px">80%</b></div><div class="col"><b>Profil complété à 80 %</b><span class="muted" style="font-size:12px">Ajoute ton relevé de notes</span></div></div></div>
<div class="card col g20" style="padding:24px;border-radius:24px;position:relative"><b>Mon parcours</b><div style="position:relative"><div style="position:absolute;left:8%;right:8%;top:19px;height:3px;background:linear-gradient(90deg,#0f8a46 0 33%,#1a47f5 33% 42%,#e8edfa 42%)"></div><div class="row" style="position:relative">{sp}</div></div><div class="ann" style="right:20px;top:-12px">Progression animée à l'arrivée · confettis à chaque étape</div></div>
<div class="row g16">{ac}</div>
<div class="row g24" style="align-items:stretch"><div class="col g16" style="flex:1.3"><div class="row between"><h3>Recommandations pour toi</h3><span style="font-size:13px;font-weight:700;color:#1a47f5">Voir tout</span></div><div class="row g8">{''.join(f'<span class="chip {"chip-blue" if k == 0 else ""}" style="{"" if k == 0 else "background:#fff;border:1px solid #e6eaf5"}">{t}</span>' for k, t in enumerate(["Formations", "Métiers", "Établissements", "Logements"]))}</div><div class="row g16">{rc}</div>
<div class="card col g12" style="padding:20px;border-radius:22px"><div class="row between"><h3>Mes candidatures</h3><span style="font-size:13px;font-weight:700;color:#1a47f5">Suivre</span></div>{cd}</div></div>
<div class="col g16" style="flex:.7"><div class="card col g12" style="padding:20px;border-radius:22px"><h3>Échéances</h3>{''.join(f'<div class="row g12"><div class="col" style="width:48px;align-items:center;padding:6px;border-radius:12px;background:{bg}"><b style="font-size:18px">{d}</b><span style="font-size:10px;font-weight:700">{m}</span></div><div class="col"><b style="font-size:13px">{t}</b><span class="muted" style="font-size:12px">{s}</span></div></div>' for d, m, t, s, bg in [("15", "NOV", "Clôture UOB", "Licence Informatique", "#ffecef"), ("22", "NOV", "Concours CNC", "Inscriptions Maroc", "#fff3c4"), ("03", "DÉC", "Résultats BBS", "Admission", "#eef4ff")])}</div>
<div class="card col g12" style="padding:20px;border-radius:22px;background:linear-gradient(160deg,#fff,#fff7dd)"><div class="row g10"><div class="ic" style="width:38px;height:38px;background:#ffc21f;border-radius:10px">{icon('key-round',18,'#0b1533')}</div><b>Mon logement</b></div><div class="muted" style="font-size:13px">Admise en Licence de Gestion à l'INSG ? 14 logements vérifiés à moins de 15 min.</div><a class="btn btn-primary" style="padding:10px">Voir sur Navilease</a></div>
<div class="card col g10" style="padding:20px;border-radius:22px"><b>Mon conseiller</b><div class="row g10"><div class="ic" style="width:42px;height:42px;border-radius:50%;background:#e8f8ef;font-weight:800;color:#0f8a46">JN</div><div class="col"><b style="font-size:14px">Jean Ndong</b><span class="muted" style="font-size:12px">Conseiller · répond en ~2 h</span></div></div><a class="btn btn-ghost" style="padding:10px">{icon('message-circle',16,'#1336e0')} Écrire</a></div></div></div></div>"""
    save("07-tableau-de-bord", doc("Navigoal — Tableau de bord", app_shell("Tableau de bord", content)))


# =====================================================================================
# 6. ACCUEIL MOBILE
# =====================================================================================
def mobile():
    body = f"""<div style="width:390px;background:#f6f8fe">
<div class="row between" style="padding:16px 20px;background:#fff">{brand()}<div class="ic" style="width:40px;height:40px;background:#f1f4fd;border-radius:12px">{icon('menu',20,'#0b1533')}</div></div>
<div style="position:relative;padding:24px 20px 0;background:radial-gradient(400px 300px at 90% 30%,#dae6ff,transparent 70%)">
<span class="chip chip-sun">🇬🇦 🇲🇦 🇸🇳 3 pays</span><h1 style="font-size:42px;letter-spacing:-1.4px;margin-top:14px">Ton avenir commence <span class="sun">ici.</span></h1>
<p class="soft" style="font-size:15px;line-height:1.55;margin-top:12px">Orientation, formations, candidatures et logement étudiant.</p>
<div class="search row g10" style="margin-top:18px;padding:8px 8px 8px 16px">{icon('search',18,'#6b7493')}<span class="muted" style="font-size:13px;flex:1">Métier, formation, école…</span><div class="ic" style="width:42px;height:42px;background:#1a47f5;border-radius:12px">{icon('arrow-right',18,'#fff')}</div></div>
<div style="position:relative;height:330px;margin-top:10px"><div style="position:absolute;left:40px;top:30px;width:300px;height:300px;border-radius:42% 58% 70% 30% / 45% 45% 55% 55%;background:linear-gradient(140deg,#1a47f5,#598bff)"></div><div style="position:absolute;right:10px;top:10px;width:120px;height:120px;border-radius:50%;background:#ffc21f"></div><img src="{STUDENT}" style="position:absolute;left:30px;bottom:0;width:330px">
<div class="card row g8" style="position:absolute;left:0;top:90px;padding:10px 12px;border-radius:14px"><div class="ic" style="width:32px;height:32px;background:#e8f8ef;border-radius:10px">{icon('sparkles',16,'#0f8a46')}</div><b style="font-size:12px">Analyste · Organisateur</b></div></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px">{''.join(f'<div class="card col g10" style="padding:16px;border-radius:18px"><div class="ic" style="width:42px;height:42px;background:{bg}">{icon(i,20,fg)}</div><b style="font-size:14px">{t}</b></div>' for i, bg, fg, t in [("compass", "#e8f8ef", "#0f8a46", "Orientation"), ("briefcase", "#eef4ff", "#1a47f5", "Métiers"), ("graduation-cap", "#fff3c4", "#a55a00", "Formations"), ("key-round", "#ffecef", "#d42a50", "Navilease")])}</div>
<div style="margin:0 20px;border-radius:24px;padding:22px;background:linear-gradient(135deg,#1a47f5,#598bff);color:#fff" class="col g12"><b style="font-size:20px">Passe le test d'orientation</b><span style="color:#dae6ff;font-size:13px">20 questions · 10 minutes · résultat visuel</span><a class="btn btn-sun" style="align-self:flex-start">Commencer {icon('arrow-right',16,'#0b1533')}</a></div>
<div class="row between" style="margin-top:24px;padding:14px 26px;background:#fff;border-top:1px solid #e6eaf5">{''.join(f'<div class="col g4" style="align-items:center;font-size:11px;font-weight:700;color:{"#1a47f5" if k == 0 else "#6b7493"}">{icon(i,22,"#1a47f5" if k == 0 else "#6b7493")}{t}</div>' for k, (i, t) in enumerate([("house", "Accueil"), ("compass", "Orientation"), ("search", "Explorer"), ("key-round", "Logement"), ("user-round", "Profil")]))}</div></div>"""
    save("08-accueil-mobile", doc("Navigoal — Accueil mobile", body, 390))


# =====================================================================================
# 7. GUIDE DES ANIMATIONS
# =====================================================================================
def motion_guide():
    specs = [
        ("Hero — titre", "Mots en cascade : translateY 24px→0 + flou 8px→0", "Chargement", "700 ms · stagger 60 ms", "ease-out-expo", "type"),
        ("Hero — visuel", "Blob qui se déforme en continu + parallaxe à la souris (±12 px)", "Continu / souris", "14 s boucle", "ease-in-out", "move-3d"),
        ("Badges flottants", "Lévitation douce, décalée entre badges", "Continu", "6 s boucle", "sine", "wind"),
        ("Compteurs", "Chiffres clés de 0 à la valeur quand ils entrent à l'écran", "Scroll (in-view)", "1,6 s", "ease-out", "hash"),
        ("Révélations", "Sections : fade + translateY 32px, cartes en stagger", "Scroll (in-view, une fois)", "600 ms · stagger 80 ms", "spring 120/20", "scroll-text"),
        ("Marquee logos", "Défilement infini des établissements, pause au survol", "Continu", "40 s boucle", "linéaire", "infinity"),
        ("Ligne de parcours", "La ligne de progression se remplit selon le scroll", "Scroll-linked", "—", "linéaire", "route"),
        ("Cartes", "Survol : élévation -6 px, ombre bleue, inclinaison 3D légère", "Survol", "250 ms", "spring", "mouse-pointer-2"),
        ("Boutons", "Reflet « shine » qui traverse + pression 0,97", "Survol / clic", "600 ms", "ease-out", "sparkles"),
        ("Test d'orientation", "Question suivante : slide horizontal + fade ; choix : pop + coche", "Clic", "350 ms", "spring 300/28", "list-checks"),
        ("Radar RIASEC", "Polygone tracé (pathLength 0→1) puis scores en compteur", "Arrivée sur le résultat", "1,2 s", "ease-in-out", "radar"),
        ("Carte Navilease", "Pins qui tombent en ressort, cercle de distance pulsé", "In-view", "500 ms · stagger 90 ms", "spring", "map-pin"),
        ("Navigation", "Header translucide (blur) qui se rétracte au scroll vers le bas", "Scroll", "300 ms", "ease", "panel-top"),
        ("Pages", "Transition fade + slide 12 px entre pages", "Navigation", "350 ms", "ease-out", "layers"),
        ("Barre de progression", "Fine barre jaune en haut qui suit la lecture de la page", "Scroll-linked", "—", "linéaire", "minus"),
        ("Accessibilité", "Tout est désactivé si « réduire les animations » est activé", "prefers-reduced-motion", "—", "—", "accessibility"),
    ]
    cards = "".join(f'''<div class="card col g12" style="padding:22px;border-radius:22px"><div class="row between"><div class="ic" style="width:46px;height:46px;background:#eef4ff;border-radius:14px">{icon(i,22,"#1a47f5")}</div><span class="chip chip-sun">{tr}</span></div>
<b style="font-size:17px">{n}</b><div class="soft" style="font-size:14px;line-height:1.5;height:42px">{d}</div><div class="row g8" style="border-top:1px solid #eef1f8;padding-top:12px"><span class="chip chip-blue">{icon("timer",12,"#1336e0")} {du}</span><span class="chip chip-violet">{e}</span></div></div>''' for n, d, tr, du, e, i in specs)
    palette = [("#1a47f5", "Bleu Navigoal", "brand-600"), ("#598bff", "Bleu clair", "brand-400"), ("#0b1a4f", "Nuit", "brand-950"), ("#ffc21f", "Soleil", "sun-400"), ("#f6f8fe", "Fond", "surface"), ("#0b1533", "Encre", "ink")]
    pal = "".join(f'<div class="col g8"><div style="width:150px;height:90px;border-radius:18px;background:{c};border:1px solid #e6eaf5"></div><b style="font-size:14px">{n}</b><span class="muted" style="font-size:12px">{c} · {t}</span></div>' for c, n, t in palette)
    body = f"""<div style="padding:64px 80px" class="col g40"><div class="row between">{brand()}<span class="chip chip-blue">Design system v1 · Motion</span></div>
<div class="col g12"><div class="eyebrow">Guide de motion</div><h1 style="font-size:56px">Animations & identité visuelle</h1><p class="soft" style="font-size:17px;width:820px;line-height:1.6">Toutes les animations seront implémentées avec Framer Motion (React) et CSS. Elles restent légères (transform/opacity uniquement) pour être fluides sur les smartphones d'entrée de gamme, et sont coupées si l'utilisateur demande moins d'animations.</p></div>
<div class="col g16"><h3>Couleurs</h3><div class="row g20">{pal}</div></div>
<div class="row g24" style="align-items:flex-start"><div class="col g12"><h3>Typographie</h3><div class="card col g10" style="padding:24px;border-radius:22px;width:560px"><div style="font-size:56px;font-weight:800;letter-spacing:-2px">Plus Jakarta Sans</div><div class="soft">Titres ExtraBold 800 · Texte 500/600 · Interlignage 1,6</div><div class="hand" style="font-size:34px;color:#1336e0">Caveat — touches manuscrites</div></div></div>
<div class="col g12" style="flex:1"><h3>Composants</h3><div class="card col g16" style="padding:24px;border-radius:22px"><div class="row g12"><a class="btn btn-primary">Bouton principal</a><a class="btn btn-sun">S'inscrire</a><a class="btn btn-ghost">Secondaire</a></div><div class="row g8"><span class="chip chip-blue">Licence</span><span class="chip chip-green">87 % compatible</span><span class="chip chip-sun">Nouveau</span><span class="chip chip-violet">Analyse</span><span class="chip chip-rose">Clôture proche</span></div><div class="bar" style="width:400px"><div style="width:65%"></div></div></div></div></div>
<div class="col g16"><h3>Animations prévues</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">{cards}</div></div></div>"""
    save("00-design-system-motion", doc("Navigoal — Motion & design system", body))


accueil()
orientation()
formations()
navilease()
dashboard()
mobile()
motion_guide()
