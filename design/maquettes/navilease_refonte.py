#!/usr/bin/env python3
"""Refonte de Navilease (novembre 2026) : une identité propre, plus d'allure.

Direction : la marque Navilease (vert forêt et ocre du logo) sur fond crème, titres à empattements (Fraunces),
de vraies photos partout (villes du Maroc et résidences universitaires, chacune nommée), un ton rassurant pour
l'étudiant et pour ses parents. Les promesses restent celles du service : bailleurs vérifiés, paiement en séquestre
versé après l'entrée, contrat et état des lieux numériques, médiation.

Écrans :
1. Accueil (ordinateur)
2. Liste des logements (ordinateur)
3. Fiche d'un logement (ordinateur)
4. Accueil (téléphone)

Usage : python3 design/maquettes/navilease_refonte.py <dossier icônes lucide>
        → design/maquettes/out/navilease-refonte.html (un écran par <section class="ecran">)
"""
import base64
import io
import json
import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ICONES = sys.argv[1] if len(sys.argv) > 1 else ""
RES = {r["id"]: r for r in json.load(open(os.path.join(ROOT, "data/referentiels/residences_etudiantes.json"), encoding="utf-8"))["items"]}

VERT, VERT2, OCRE, CREME, ENCRE, SABLE = "#1f4d38", "#2b6a4c", "#e9a33a", "#f7f3ea", "#10231a", "#efe7d6"


def photo(chemin, largeur=900, ratio=None):
    im = Image.open(os.path.join(ROOT, chemin)).convert("RGB")
    if ratio:
        w, h = im.size
        if w / h > ratio:
            nw = int(h * ratio); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = int(w / ratio); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.thumbnail((largeur, largeur * 2))
    b = io.BytesIO(); im.save(b, "JPEG", quality=80)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def logo(nom):
    return "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "web/public/brand", nom), "rb").read()).decode()


def icon(nom, t=18, c="currentColor", ep=2):
    try:
        svg = open(os.path.join(ICONES, f"{nom}.svg"), encoding="utf-8").read()
    except OSError:
        return ""
    svg = svg.replace('width="24"', f'width="{t}"').replace('height="24"', f'height="{t}"').replace('stroke="currentColor"', f'stroke="{c}"').replace('stroke-width="2"', f'stroke-width="{ep}"')
    return svg.split("-->")[-1].strip()


def res_photo(rid, n=0, **k):
    return photo(RES[rid]["photos"][n]["fichier"], **k)


def ville(v, **k):
    return photo(f"assets/photos/villes/{v}.jpg", **k)


def dh(n):
    return f"{n:,}".replace(",", " ") + " DH"


LOGO = logo("navilease-horizontal.png")
SYMBOLE = logo("navilease-symbole.png")

CSS = f"""
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#d9d4c7;font-family:'Plus Jakarta Sans',sans-serif;color:{ENCRE};padding:40px;display:flex;flex-direction:column;gap:40px;align-items:center}}
.ecran{{background:{CREME};overflow:hidden;position:relative;box-shadow:0 30px 80px rgba(16,35,26,.18)}}
.titre-ecran{{font:700 13px 'Plus Jakarta Sans';letter-spacing:.12em;text-transform:uppercase;color:#5d5a4f;align-self:flex-start;margin-left:calc(50% - 720px)}}
.serif{{font-family:'Fraunces',serif;font-optical-sizing:auto;letter-spacing:-.02em}}
.chip{{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700}}
.btn{{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:14px 24px;font-weight:800;font-size:15px}}
.mute{{color:#5f6457}}
.eyebrow{{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:{OCRE}}}
.carte{{background:#fff;border-radius:22px;box-shadow:0 1px 0 rgba(16,35,26,.06),0 12px 30px -12px rgba(16,35,26,.18)}}
.img{{width:100%;height:100%;object-fit:cover;display:block}}
"""


def entete(actif="", mobile=False):
    if mobile:
        return f"""<div style="height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:{CREME}">
          <img src="{LOGO}" style="height:30px"><span style="display:flex;gap:10px">{rond(icon("search", 18, ENCRE))}{rond(icon("menu", 18, ENCRE))}</span></div>"""
    liens = "".join(f'<span style="font-weight:{800 if t == actif else 600};font-size:14.5px;color:{VERT if t == actif else "#3b4238"};{"border-bottom:2px solid " + OCRE + ";padding-bottom:4px" if t == actif else ""}">{t}</span>'
                    for t in ["Logements", "Résidences universitaires", "Comment ça marche", "Parents", "Bailleurs"])
    return f"""<div style="height:76px;display:flex;align-items:center;padding:0 56px;gap:36px;background:{CREME};border-bottom:1px solid #e6dfcd">
      <img src="{LOGO}" style="height:34px"><span style="display:flex;gap:28px;align-items:center;margin-left:16px">{liens}</span>
      <span style="margin-left:auto;display:flex;gap:12px;align-items:center">
        <span style="font-size:13.5px;font-weight:700;color:{VERT}">{icon("arrow-left", 15, VERT)} Navigoal</span>
        <span class="btn" style="padding:10px 18px;font-size:14px;border:1.5px solid {VERT};color:{VERT}">{icon("user", 16, VERT)}Mon espace</span>
        <span class="btn" style="padding:10px 18px;font-size:14px;background:{VERT};color:#fff">Publier une annonce</span></span></div>"""


def rond(svg, fond="#fff", t=40):
    return f'<span style="width:{t}px;height:{t}px;border-radius:50%;background:{fond};display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(16,35,26,.08)">{svg}</span>'


def recherche(mobile=False):
    champs = [("map-pin", "Ville", "Casablanca"), ("graduation-cap", "École", "ESA Casablanca"), ("wallet", "Budget / mois", "3 500 DH max.")]
    if mobile:
        lignes = "".join(f'<div style="display:flex;gap:12px;align-items:center;padding:12px 4px;border-bottom:1px solid #eee7d6">{icon(i, 18, VERT2)}<span><span style="display:block;font-size:11px;font-weight:700;color:#7a7a6c">{l}</span><b style="font-size:15px">{v}</b></span></div>' for i, l, v in champs)
        return f"""<div class="carte" style="padding:10px 16px 16px">{lignes}<div class="btn" style="margin-top:14px;width:100%;justify-content:center;background:{OCRE};color:{ENCRE}">{icon("search", 18, ENCRE)}Trouver mon logement</div></div>"""
    cases = "".join(f'<div style="flex:1;padding:14px 22px;{"border-left:1px solid #eee7d6" if k else ""}"><span style="display:flex;gap:8px;align-items:center;font-size:11.5px;font-weight:800;color:#7a7a6c;text-transform:uppercase;letter-spacing:.06em">{icon(i, 14, VERT2)}{l}</span><b style="display:block;margin-top:4px;font-size:16px">{v}</b></div>' for k, (i, l, v) in enumerate(champs))
    return f"""<div class="carte" style="display:flex;align-items:center;padding:8px;border-radius:999px">{cases}
      <span class="btn" style="background:{OCRE};color:{ENCRE};padding:18px 28px;font-size:16px">{icon("search", 19, ENCRE)}Rechercher</span></div>"""


def promesses(mobile=False):
    p = [("badge-check", "Bailleurs vérifiés", "Identité contrôlée, logement visité ou partenaire certifié."),
         ("shield-check", "Paiement en séquestre", "Ton argent n'est versé au bailleur qu'après ton entrée dans les lieux."),
         ("file-pen-line", "Contrat et état des lieux", "Signés en ligne, photos à l'appui, gardés dans ton espace."),
         ("users", "Parents associés", "Ils suivent, se portent garants et paient depuis leur pays.")]
    if mobile:
        p = p[:3]
    items = "".join(f"""<div style="display:flex;gap:14px;align-items:flex-start;flex:1">{rond(icon(i, 20, VERT), "#e9f4ed", 46)}
        <span><b style="display:block;font-size:15.5px">{t}</b><span class="mute" style="font-size:13.5px;line-height:1.5">{d}</span></span></div>""" for i, t, d in p)
    sens = "column" if mobile else "row"
    return f'<div style="display:flex;flex-direction:{sens};gap:{22 if mobile else 36}px">{items}</div>'


def carte_residence(rid, n=0, large=None):
    r = RES[rid]
    w = f"width:{large}px;" if large else ""
    return f"""<div class="carte" style="{w}overflow:hidden">
      <div style="position:relative;height:210px"><img class="img" src="{res_photo(rid, n, largeur=700, ratio=1.5)}">
        <span class="chip" style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);color:{ENCRE}">{icon("map-pin", 13, VERT)}{r["ville"]}</span>
        <span class="chip" style="position:absolute;top:12px;right:12px;background:{ENCRE};color:#fff">{icon("building-2", 13, "#fff")}Résidence</span></div>
      <div style="padding:16px 18px 18px">
        <b class="serif" style="font-size:20px;font-weight:600">{r["nom"]}</b>
        <div class="mute" style="font-size:13px;margin-top:4px">{r["operateur"]}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid #f0eadb">
          <span class="mute" style="font-size:12.5px">Réservation sur le site officiel</span>
          <span style="text-align:right"><span class="mute" style="font-size:12px">dès </span><b style="font-size:20px">{dh(r["a_partir_de"])}</b><span class="mute" style="font-size:12px"> /mois</span></span></div></div></div>"""


def carte_logement(titre, quartier, prix, eur, badge, trajet, img, tags, large=None, horizontal=False):
    w = f"width:{large}px;" if large else ""
    badge_c = {"Partenaire certifié": (OCRE, ENCRE), "Visité par Navilease": (VERT2, "#fff"), "Identité vérifiée": ("#fff", VERT)}[badge]
    t = "".join(f'<span class="chip" style="background:#f4efe3;color:#4b4a40;padding:5px 10px;font-weight:600">{x}</span>' for x in tags)
    return f"""<div class="carte" style="{w}overflow:hidden">
      <div style="position:relative;height:220px"><img class="img" src="{img}">
        <span class="chip" style="position:absolute;top:12px;left:12px;background:{badge_c[0]};color:{badge_c[1]}">{icon("badge-check", 13, badge_c[1])}{badge}</span>
        {rond(icon("heart", 17, ENCRE), "rgba(255,255,255,.92)", 36).replace('style="', 'style="position:absolute;top:10px;right:10px;', 1)}
        <span class="chip" style="position:absolute;bottom:12px;left:12px;background:rgba(16,35,26,.78);color:#fff">{icon("images", 13, "#fff")}1 / 8</span></div>
      <div style="padding:16px 18px 18px">
        <div style="display:flex;justify-content:space-between;gap:10px"><b class="serif" style="font-size:19px;font-weight:600">{titre}</b></div>
        <div class="mute" style="font-size:13px;margin-top:4px;display:flex;align-items:center;gap:5px">{icon("map-pin", 13, "#7a7a6c")}{quartier}</div>
        <div style="font-size:13px;margin-top:8px;color:{VERT2};font-weight:700;display:flex;gap:6px;align-items:center">{icon("footprints", 14, VERT2)}{trajet}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">{t}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid #f0eadb">
          <span style="font-size:12.5px;color:{VERT2};font-weight:700;display:flex;gap:6px;align-items:center">{icon("shield-check", 14, VERT2)}Paiement protégé</span>
          <span><b style="font-size:21px">{dh(prix)}</b><span class="mute" style="font-size:12px"> /mois · ≈ {eur}</span></span></div></div></div>"""


def ecran_accueil():
    villes = [("casablanca", "Casablanca", "4 résidences · 2 logements", "dès 1 200 DH"), ("rabat", "Rabat", "2 résidences", "dès 1 400 DH"),
              ("marrakech", "Marrakech", "1 résidence", "dès 1 500 DH"), ("tanger", "Tanger", "1 résidence", "dès 1 600 DH"),
              ("agadir", "Agadir", "1 résidence", "dès 1 500 DH")]
    cartes_villes = "".join(f"""<div style="position:relative;border-radius:22px;overflow:hidden;{"grid-row:span 2" if k == 0 else ""}">
        <img class="img" src="{ville(v, largeur=900)}"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,35,26,0) 40%,rgba(16,35,26,.82))"></div>
        <div style="position:absolute;left:22px;right:22px;bottom:18px;color:#fff;display:flex;justify-content:space-between;align-items:flex-end">
          <span><b class="serif" style="font-size:{34 if k == 0 else 26}px;font-weight:600;display:block">{n}</b><span style="font-size:13.5px;opacity:.9">{s}</span></span>
          <span class="chip" style="background:rgba(255,255,255,.95);color:{ENCRE}">{p}{icon("arrow-right", 13, ENCRE)}</span></div></div>""" for k, (v, n, s, p) in enumerate(villes))
    etapes = [("search", "Je cherche", "Par école, ville et budget. Chaque annonce indique le trajet jusqu'à ton établissement."),
              ("calendar-check", "Je réserve", "Demande en ligne, pièces du dossier ; un parent valide si tu es mineur."),
              ("shield-check", "Je paie en séquestre", "Mobile money, carte ou espèces : les fonds restent protégés jusqu'à ton entrée."),
              ("pen-line", "Je signe", "Contrat numérique et état des lieux photographié à l'arrivée."),
              ("key-round", "J'emménage", "Quittances chaque mois, médiation en cas de désaccord.")]
    frise = "".join(f"""<div style="flex:1;position:relative">
        <div style="display:flex;align-items:center;gap:12px"><span class="serif" style="font-size:44px;font-weight:600;color:{OCRE}">0{k + 1}</span>
          {rond(icon(i, 20, "#fff"), "rgba(255,255,255,.12)", 44).replace("box-shadow:0 2px 8px rgba(16,35,26,.08)", "")}</div>
        <b style="display:block;font-size:17px;margin-top:14px;color:#fff">{t}</b><span style="display:block;margin-top:6px;font-size:13.5px;line-height:1.55;color:#c9d8cf">{d}</span></div>""" for k, (i, t, d) in enumerate(etapes))
    logements = (carte_logement("Studio meublé Maârif", "Maârif, Casablanca", 3200, "295 €", "Partenaire certifié", "12 min à pied de l'ESA", res_photo("twenty-casa-anfa", 5, largeur=700, ratio=1.45), ["Meublé", "Wifi", "28 m²"])
                 + carte_logement("Chambre en colocation", "Gauthier, Casablanca", 2300, "212 €", "Visité par Navilease", "15 min en tram de l'ESA", res_photo("resu-anfa-city", 3, largeur=700, ratio=1.45), ["Colocation", "Filles", "Wifi"])
                 + carte_logement("Studio lumineux Agdal", "Agdal, Rabat", 2900, "267 €", "Identité vérifiée", "8 min à pied de l'UIR", res_photo("resu-ziraoui", 0, largeur=700, ratio=1.45), ["Meublé", "Balcon", "Gardien"]))
    return f"""<section class="ecran" style="width:1440px">
    {entete()}
    <div style="display:grid;grid-template-columns:1.02fr 1fr;gap:56px;padding:64px 56px 40px;align-items:center">
      <div>
        <span class="chip" style="background:#fff;color:{VERT};border:1px solid #e6dfcd">{icon("sparkles", 14, OCRE)}Un service Navigoal · Maroc</span>
        <h1 class="serif" style="font-size:76px;line-height:1.02;font-weight:600;margin-top:22px">Ton chez-toi au Maroc, <em style="color:{VERT2};font-style:italic">trouvé avant</em> même d'atterrir.</h1>
        <p class="mute" style="font-size:18.5px;line-height:1.6;margin-top:22px;max-width:560px">Studios, colocations et résidences universitaires près de ton école. Bailleurs vérifiés, paiement protégé jusqu'à ton entrée, et tes parents à tes côtés à chaque étape.</p>
        <div style="margin-top:34px">{recherche()}</div>
        <div style="display:flex;gap:30px;margin-top:30px;align-items:center">
          <span style="display:flex;align-items:center"><span style="display:flex">{"".join(f'<img src="{res_photo(r, n, largeur=120, ratio=1)}" style="width:38px;height:38px;border-radius:50%;border:3px solid {CREME};margin-left:{0 if k == 0 else -10}px;object-fit:cover">' for k, (r, n) in enumerate([("twenty-casa-anfa", 0), ("twenty-casa-anfa", 5), ("bam-rabat", 1)]))}</span>
            <span style="margin-left:12px;font-size:13.5px"><b>14 résidences</b> <span class="mute">et des logements vérifiés dans 10 villes</span></span></span></div>
      </div>
      <div style="position:relative;height:640px">
        <div style="position:absolute;right:0;top:0;width:470px;height:560px;border-radius:200px 200px 28px 28px;overflow:hidden"><img class="img" src="{res_photo("twenty-casa-anfa", 1, largeur=1000)}"></div>
        <div style="position:absolute;left:0;bottom:0;width:250px;height:300px;border-radius:24px;overflow:hidden;border:8px solid {CREME}"><img class="img" src="{res_photo("twenty-casa-anfa", 3, largeur=600, ratio=.83)}"></div>
        <div class="carte" style="position:absolute;left:30px;top:70px;padding:16px 18px;display:flex;gap:12px;align-items:center;width:260px">
          {rond(icon("shield-check", 20, "#fff"), VERT2, 42)}<span><b style="display:block;font-size:14.5px">Paiement en séquestre</b><span class="mute" style="font-size:12.5px">versé au bailleur après ton entrée</span></span></div>
        <div class="carte" style="position:absolute;right:24px;bottom:110px;padding:14px 16px;width:230px">
          <span style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">Twenty Campus</b><span class="chip" style="background:#e9f4ed;color:{VERT};padding:4px 8px">Casablanca</span></span>
          <span style="display:block;margin-top:6px;font-size:13px" class="mute">dès <b style="color:{ENCRE};font-size:17px">6 200 DH</b> /mois</span></div>
        <span class="chip" style="position:absolute;right:30px;top:24px;background:{OCRE};color:{ENCRE};font-size:13px">{icon("badge-check", 14, ENCRE)}Logements vérifiés</span>
        <span style="position:absolute;right:0;bottom:6px;font-size:11px" class="mute">Photos : Twenty Campus, Casablanca</span>
      </div>
    </div>
    <div style="margin:10px 56px 0;padding:30px 36px;border-radius:26px;background:#fff">{promesses()}</div>

    <div style="padding:84px 56px 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Explorer par ville</span>
        <h2 class="serif" style="font-size:48px;font-weight:600;margin-top:10px;line-height:1.08">Où vas-tu étudier ?</h2></div>
        <span style="font-weight:800;color:{VERT};display:flex;gap:8px;align-items:center">Toutes les villes {icon("arrow-right", 17, VERT)}</span></div>
      <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;grid-template-rows:260px 260px;gap:18px;margin-top:30px">{cartes_villes}</div>
    </div>

    <div style="padding:90px 56px 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Logements vérifiés</span>
        <h2 class="serif" style="font-size:48px;font-weight:600;margin-top:10px;line-height:1.08">Près de ton école, <em style="font-style:italic;color:{VERT2}">vraiment</em>.</h2>
        <p class="mute" style="margin-top:10px;font-size:16px">Chaque annonce affiche le temps de trajet jusqu'à ton établissement.</p></div>
        <span class="btn" style="border:1.5px solid {VERT};color:{VERT}">Voir les logements {icon("arrow-right", 16, VERT)}</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:30px">{logements}</div>
    </div>

    <div style="padding:90px 56px 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Résidences universitaires</span>
        <h2 class="serif" style="font-size:48px;font-weight:600;margin-top:10px;line-height:1.08">14 résidences, loyers officiels.</h2>
        <p class="mute" style="margin-top:10px;font-size:16px">Prix et conditions relevés sur leurs sites. Tu réserves directement auprès de la résidence.</p></div>
        <span class="btn" style="border:1.5px solid {VERT};color:{VERT}">Toutes les résidences {icon("arrow-right", 16, VERT)}</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:30px">{carte_residence("bam-el-jadida", 0)}{carte_residence("sh-tanger", 0)}{carte_residence("bam-rabat", 4)}{carte_residence("resu-anfa-city", 1)}</div>
    </div>

    <div style="margin:96px 0 0;background:{VERT};padding:80px 56px;position:relative;overflow:hidden">
      <img src="{SYMBOLE}" style="position:absolute;right:-60px;top:-40px;width:380px;opacity:.06;filter:grayscale(1) brightness(3)">
      <span class="eyebrow">Comment ça marche</span>
      <h2 class="serif" style="font-size:52px;font-weight:600;margin-top:10px;color:#fff;line-height:1.05;max-width:760px">Réserver à distance, <em style="font-style:italic;color:{OCRE}">sans arnaque</em>, en cinq étapes.</h2>
      <div style="display:flex;gap:34px;margin-top:48px">{frise}</div>
      <div style="display:flex;gap:14px;margin-top:46px"><span class="btn" style="background:{OCRE};color:{ENCRE}">Comprendre les protections</span><span class="btn" style="border:1.5px solid rgba(255,255,255,.5);color:#fff">Questions fréquentes</span></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0">
      <div style="position:relative;min-height:520px"><img class="img" src="{res_photo("twenty-casa-anfa", 2, largeur=1000)}" style="position:absolute;inset:0">
        <span style="position:absolute;left:20px;bottom:16px;font-size:11px;color:#fff;opacity:.8">Twenty Campus, Casablanca</span></div>
      <div style="padding:72px 64px;background:{SABLE}">
        <span class="eyebrow">Pour les parents</span>
        <h2 class="serif" style="font-size:44px;font-weight:600;margin-top:10px;line-height:1.08">Vous suivez tout, depuis Libreville, Dakar ou Douala.</h2>
        <div style="display:flex;flex-direction:column;gap:18px;margin-top:28px">
          {"".join(f'<div style="display:flex;gap:14px">{rond(icon(i, 19, VERT), "#fff", 42)}<span><b style="display:block;font-size:16px">{t}</b><span class="mute" style="font-size:14px;line-height:1.55">{d}</span></span></div>' for i, t, d in [("eye", "Le même dossier que votre enfant", "Annonce, contrat, état des lieux et quittances, partagés dans votre espace parent."), ("hand-coins", "Payez depuis votre pays", "Airtel Money, Moov Money, carte ou espèces, en F CFA ; versé au bailleur après l'entrée."), ("bell-ring", "Un rappel avant chaque loyer", "2, 3, 5 ou 7 jours avant l'échéance, et le jour même si vous le souhaitez.")])}
        </div>
        <span class="btn" style="margin-top:32px;background:{VERT};color:#fff">Créer mon espace parent {icon("arrow-right", 16, "#fff")}</span>
      </div>
    </div>

    <div style="margin:0;padding:70px 56px;display:flex;align-items:center;justify-content:space-between;gap:40px;background:{CREME}">
      <div style="display:flex;gap:22px;align-items:center">{rond(icon("key-round", 26, ENCRE), OCRE, 64)}
        <span><b class="serif" style="font-size:32px;font-weight:600;display:block">Vous louez à des étudiants ?</b><span class="mute" style="font-size:16px">Locataires sérieux, loyers garantis par le séquestre, visibilité auprès de 103 écoles.</span></span></div>
      <span class="btn" style="background:{ENCRE};color:#fff">Publier une annonce gratuitement {icon("arrow-right", 16, "#fff")}</span></div>
    {pied()}
    </section>"""


def pied(mobile=False):
    cols = [("Navilease", ["Logements", "Résidences universitaires", "Comment ça marche", "Parents", "Bailleurs"]), ("Aide", ["Questions fréquentes", "Aide et règles", "Signaler une annonce", "contact@navigoal.net"])]
    if mobile:
        return f'<div style="background:{ENCRE};color:#c9d8cf;padding:34px 20px;font-size:13px"><img src="{LOGO}" style="height:46px;background:#fff;border-radius:14px;padding:8px 14px"><p style="margin-top:14px;line-height:1.6">Se loger en toute sécurité. Un service Navigoal, édité par OAPS Consulting Group.</p></div>'
    c = "".join(f'<div><b style="color:#fff;font-size:14px">{t}</b>{"".join(f"<div style=margin-top:10px>{x}</div>" for x in l)}</div>' for t, l in cols)
    return f"""<div style="background:{ENCRE};color:#c9d8cf;padding:56px 56px 36px;font-size:14px">
      <div style="display:flex;justify-content:space-between;gap:40px"><div style="max-width:380px"><img src="{LOGO}" style="height:58px;background:#fff;border-radius:16px;padding:10px 16px">
        <p style="margin-top:16px;line-height:1.65">Se loger en toute sécurité au Maroc. Un service de la plateforme Navigoal, avec le même compte.</p></div>
        <div style="display:flex;gap:80px">{c}</div></div>
      <div style="border-top:1px solid rgba(255,255,255,.12);margin-top:36px;padding-top:20px;display:flex;justify-content:space-between;font-size:12.5px"><span>© 2026 Navilease · un service Navigoal, édité par OAPS Consulting Group</span><span>Conditions · Confidentialité · Mentions légales · Cookies</span></div></div>"""


def ecran_liste():
    filtres = ["Tous", "Studios", "Colocations", "Chambres", "Résidences", "Chez l'habitant"]
    pastilles = "".join(f'<span class="chip" style="padding:9px 16px;font-size:13.5px;{"background:" + ENCRE + ";color:#fff" if k == 0 else "background:#fff;color:#3b4238;border:1px solid #e6dfcd"}">{f}</span>' for k, f in enumerate(filtres))
    autres = "".join(f'<span class="chip" style="padding:9px 14px;font-size:13.5px;background:#fff;border:1px solid #e6dfcd;color:#3b4238">{icon(i, 14, "#3b4238")}{t}{icon("chevron-down", 14, "#7a7a6c")}</span>' for i, t in [("wallet", "Budget"), ("sofa", "Équipements"), ("users", "Colocation"), ("badge-check", "Vérification")])
    cartes = (carte_logement("Studio meublé Maârif", "Maârif, Casablanca", 3200, "295 €", "Partenaire certifié", "12 min à pied de l'ESA", res_photo("twenty-casa-anfa", 5, largeur=700, ratio=1.45), ["Meublé", "Wifi", "28 m²"])
              + carte_logement("Chambre en colocation", "Gauthier, Casablanca", 2300, "212 €", "Visité par Navilease", "15 min en tram de l'ESA", res_photo("resu-anfa-city", 3, largeur=700, ratio=1.45), ["Colocation", "Filles", "Wifi"])
              + carte_residence("resu-ziraoui", 0) + carte_residence("bam-casablanca", 5))
    carte_plan = f"""<div style="position:relative;border-radius:24px;overflow:hidden;height:100%;background:#e8e2d2">
        <svg width="100%" height="100%" style="position:absolute;inset:0"><defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#ddd5c1" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/>
          <path d="M-20 180 C 120 160, 220 260, 420 230 S 600 120, 700 160" stroke="#fff" stroke-width="16" fill="none"/><path d="M180 -10 L 260 900" stroke="#fff" stroke-width="12"/><path d="M-10 520 L 700 450" stroke="#fff" stroke-width="10"/>
          <path d="M60 760 C 200 700, 300 640, 520 660" stroke="{OCRE}" stroke-width="4" stroke-dasharray="8 8" fill="none"/>
          <circle cx="330" cy="380" r="120" fill="{VERT2}" fill-opacity=".08" stroke="{VERT2}" stroke-dasharray="6 6"/></svg>
        <span style="position:absolute;left:300px;top:350px">{rond(icon("graduation-cap", 22, "#fff"), VERT, 56)}</span>
        {"".join(f'<span class="chip" style="position:absolute;left:{x}px;top:{y}px;background:{ENCRE if a else "#fff"};color:{"#fff" if a else ENCRE};font-size:13.5px;padding:8px 13px;box-shadow:0 6px 16px rgba(16,35,26,.18)">{p}</span>' for x, y, p, a in [(150, 250, "3 200 DH", True), (420, 300, "2 300 DH", False), (230, 520, "1 300 DH", False), (470, 600, "1 500 DH", False)])}
        <span class="chip" style="position:absolute;left:16px;bottom:16px;background:#fff;color:#4b4a40">{icon("info", 13, "#4b4a40")}Positions approchées (≈ 500 m)</span></div>"""
    return f"""<section class="ecran" style="width:1440px">
    {entete("Logements")}
    <div style="padding:34px 56px 0">
      <div class="mute" style="font-size:13px">Navilease › Logements › Casablanca</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px">
        <h1 class="serif" style="font-size:52px;font-weight:600;line-height:1.05">Se loger à <em style="font-style:italic;color:{VERT2}">Casablanca</em></h1>
        <span class="btn" style="border:1.5px solid {VERT};color:{VERT};padding:11px 18px;font-size:14px">{icon("bell", 16, VERT)}Créer une alerte</span></div>
      <p class="mute" style="font-size:16px;margin-top:8px">2 logements vérifiés et 4 résidences universitaires · triés par distance de l'ESA Casablanca</p>
      <div style="margin-top:24px">{recherche()}</div>
      <div style="display:flex;gap:10px;margin-top:22px;align-items:center;flex-wrap:wrap">{pastilles}<span style="width:1px;height:26px;background:#ddd5c1;margin:0 6px"></span>{autres}
        <span style="margin-left:auto;display:flex;gap:6px;background:#fff;border-radius:999px;padding:5px;border:1px solid #e6dfcd"><span class="chip" style="background:{VERT};color:#fff">{icon("layout-grid", 14, "#fff")}Liste</span><span class="chip" style="color:#3b4238">{icon("map", 14, "#3b4238")}Carte</span></span></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 540px;gap:26px;padding:28px 56px 60px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">{cartes}</div>
      <div style="position:relative">{carte_plan}</div>
    </div>
    <div style="margin:0 56px 60px;padding:22px 26px;border-radius:20px;background:#fff8e8;border:1px solid #f3dfb2;display:flex;gap:14px;align-items:center">
      {icon("shield-alert", 22, "#a55a00")}<span style="font-size:14.5px"><b>Ne payez jamais en dehors de Navilease.</b> <span class="mute">L'adresse exacte et les coordonnées du bailleur sont communiquées après le paiement en séquestre.</span></span></div>
    {pied()}</section>"""


def ecran_fiche():
    g = [res_photo("twenty-casa-anfa", i, largeur=900 if i == 5 else 500) for i in (5, 1, 4, 2, 0)]
    equip = "".join(f'<span style="display:flex;gap:10px;align-items:center;font-size:14.5px">{icon(i, 18, VERT2)}{t}</span>' for i, t in [("wifi", "Wifi fibre"), ("zap", "Électricité incluse"), ("droplet", "Eau courante"), ("sofa", "Entièrement meublé"), ("cooking-pot", "Cuisine équipée"), ("shield", "Immeuble gardé"), ("lamp-desk", "Espace de travail"), ("washing-machine", "Lave-linge")])
    lignes = "".join(f'<div style="display:flex;justify-content:space-between;font-size:14.5px;padding:7px 0"><span class="mute">{a}</span><b>{b}</b></div>' for a, b in [("Premier loyer", "3 200 DH"), ("Charges (dont wifi)", "300 DH"), ("Caution (restituée)", "3 200 DH"), ("Frais de service (5 %)", "160 DH")])
    return f"""<section class="ecran" style="width:1440px">
    {entete("Logements")}
    <div style="padding:30px 56px 0">
      <div class="mute" style="font-size:13px">Navilease › Casablanca › Maârif › Studio</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px">
        <div><h1 class="serif" style="font-size:50px;font-weight:600;line-height:1.05">Studio meublé Maârif</h1>
          <div style="display:flex;gap:10px;margin-top:12px;align-items:center"><span class="chip" style="background:{OCRE};color:{ENCRE}">{icon("badge-check", 13, ENCRE)}Partenaire certifié</span><span class="mute" style="font-size:14px;display:flex;gap:6px;align-items:center">{icon("map-pin", 14, "#7a7a6c")}Maârif, Casablanca · adresse exacte après paiement</span></div></div>
        <span style="display:flex;gap:10px"><span class="btn" style="border:1.5px solid #ddd5c1;background:#fff;color:{ENCRE};padding:11px 18px;font-size:14px">{icon("share-2", 16, ENCRE)}Partager à mes parents</span><span class="btn" style="border:1.5px solid #ddd5c1;background:#fff;color:{ENCRE};padding:11px 18px;font-size:14px">{icon("heart", 16, ENCRE)}Garder</span></span></div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:230px 230px;gap:12px;margin-top:24px;border-radius:26px;overflow:hidden">
        <div style="grid-row:span 2;position:relative"><img class="img" src="{g[0]}"></div><img class="img" src="{g[1]}"><img class="img" src="{g[2]}"><img class="img" src="{g[3]}">
        <div style="position:relative"><img class="img" src="{g[4]}"><span class="chip" style="position:absolute;right:14px;bottom:14px;background:#fff;color:{ENCRE};padding:9px 14px">{icon("images", 14, ENCRE)}Voir les 8 photos</span></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 420px;gap:40px;padding:36px 56px 70px">
      <div style="display:flex;flex-direction:column;gap:30px">
        <div style="display:flex;gap:30px;padding-bottom:26px;border-bottom:1px solid #e6dfcd">
          {"".join(f'<span style="display:flex;gap:12px;align-items:center">{rond(icon(i, 19, VERT), "#fff", 44)}<span><span class="mute" style="font-size:12px;display:block">{a}</span><b style="font-size:15.5px">{b}</b></span></span>' for i, a, b in [("house", "Type", "Studio meublé"), ("ruler", "Surface", "28 m²"), ("user", "Occupants", "1 personne"), ("calendar", "Disponible", "1er septembre"), ("clock", "Durée min.", "6 mois")])}</div>
        <div><h2 class="serif" style="font-size:30px;font-weight:600">Le logement</h2><p style="font-size:16px;line-height:1.7;margin-top:10px;color:#3b4238">Studio lumineux de 28 m² entièrement meublé : coin cuisine équipé, salle d'eau, bureau face à la fenêtre. Immeuble gardé à 12 minutes à pied de l'ESA, commerces et tram à proximité.</p></div>
        <div><h2 class="serif" style="font-size:30px;font-weight:600">Équipements</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px">{equip}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
          <div class="carte" style="padding:24px"><h3 class="serif" style="font-size:22px;font-weight:600">Trajet vers ton école</h3>
            {"".join(f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:12px 14px;border-radius:14px;background:#f7f3ea"><b style="font-size:14px">{e}</b><span style="font-size:13px;color:{VERT2};font-weight:700;display:flex;gap:6px;align-items:center">{icon(i, 14, VERT2)}{t}</span></div>' for e, i, t in [("ESA Casablanca", "footprints", "12 min à pied"), ("ESCA École de Management", "tram-front", "18 min en tram")])}</div>
          <div class="carte" style="padding:24px"><h3 class="serif" style="font-size:22px;font-weight:600">Le bailleur</h3>
            <div style="display:flex;gap:14px;align-items:center;margin-top:14px"><span style="width:52px;height:52px;border-radius:50%;background:{OCRE};display:flex;align-items:center;justify-content:center;font-weight:800">RM</span><span><b>Résidences Maârif</b><span class="mute" style="display:block;font-size:13px">Agence · sur Navilease depuis 2026</span></span></div>
            <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><span class="chip" style="background:#e9f4ed;color:{VERT}">{icon("badge-check", 13, VERT)}Identité vérifiée</span><span class="chip" style="background:#e9f4ed;color:{VERT}">{icon("message-circle", 13, VERT)}Répond sous 24 h</span></div></div></div>
      </div>
      <div><div class="carte" style="padding:26px;position:sticky;top:20px">
        <div><b class="serif" style="font-size:38px;font-weight:600">3 200 DH</b><span class="mute"> /mois · ≈ 295 €</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px">
          {"".join(f'<div style="border:1.5px solid #e6dfcd;border-radius:14px;padding:10px 14px"><span class="mute" style="font-size:11.5px;font-weight:700;display:block">{a}</span><b style="font-size:15px">{b}</b></div>' for a, b in [("Arrivée", "1er sept. 2026"), ("Durée", "10 mois")])}</div>
        <div style="margin-top:16px">{lignes}</div>
        <div style="margin-top:12px;padding:16px 18px;border-radius:16px;background:{ENCRE};color:#fff;display:flex;justify-content:space-between;align-items:center"><b>À payer à la réservation</b><b class="serif" style="font-size:24px">6 860 DH</b></div>
        <div class="btn" style="margin-top:14px;width:100%;justify-content:center;background:{OCRE};color:{ENCRE};font-size:16px;padding:16px">Demander une réservation</div>
        <div style="margin-top:14px;padding:14px 16px;border-radius:14px;background:#e9f4ed;font-size:13px;line-height:1.55;display:flex;gap:10px">{icon("shield-check", 20, VERT)}<span><b style="color:{VERT}">Paiement en séquestre.</b> Rien n'est versé au bailleur avant ton entrée dans les lieux ; la caution reste bloquée jusqu'à ta sortie.</span></div>
        <div class="mute" style="margin-top:12px;font-size:12.5px;display:flex;gap:8px;align-items:center">{icon("users", 15, "#7a7a6c")}Un parent peut se porter garant et payer depuis son pays.</div>
      </div></div>
    </div>
    {pied()}</section>"""


def ecran_mobile():
    return f"""<section class="ecran" style="width:390px">
    {entete(mobile=True)}
    <div style="padding:14px 18px 0">
      <div style="position:relative;height:300px;border-radius:150px 150px 24px 24px;overflow:hidden"><img class="img" src="{res_photo("twenty-casa-anfa", 1, largeur=700)}">
        <div class="carte" style="position:absolute;left:12px;bottom:12px;padding:10px 12px;display:flex;gap:10px;align-items:center">{rond(icon("shield-check", 16, "#fff"), VERT2, 32)}<span style="font-size:12px"><b style="display:block">Paiement en séquestre</b><span class="mute">versé après ton entrée</span></span></div></div>
      <h1 class="serif" style="font-size:40px;line-height:1.05;font-weight:600;margin-top:22px">Ton chez-toi au Maroc, <em style="color:{VERT2}">trouvé avant</em> d'atterrir.</h1>
      <p class="mute" style="font-size:15.5px;line-height:1.55;margin-top:12px">Logements vérifiés près de ton école, paiement protégé, parents à tes côtés.</p>
      <div style="margin-top:20px">{recherche(True)}</div>
      <div style="margin-top:28px">{promesses(True)}</div>
      <div style="margin-top:36px"><span class="eyebrow">Explorer par ville</span><h2 class="serif" style="font-size:30px;font-weight:600;margin-top:6px">Où vas-tu étudier ?</h2></div>
      <div style="display:flex;gap:12px;margin-top:16px;overflow:hidden">
        {"".join(f'<div style="flex:0 0 220px;height:260px;border-radius:20px;overflow:hidden;position:relative"><img class="img" src="{ville(v, largeur=500)}"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(16,35,26,.85))"></div><span style="position:absolute;left:16px;bottom:14px;color:#fff"><b class="serif" style="font-size:24px;display:block">{n}</b><span style="font-size:12.5px">{s}</span></span></div>' for v, n, s in [("casablanca", "Casablanca", "4 résidences · dès 1 200 DH"), ("rabat", "Rabat", "2 résidences · dès 1 400 DH")])}</div>
      <div style="margin-top:36px"><span class="eyebrow">Logements vérifiés</span><h2 class="serif" style="font-size:30px;font-weight:600;margin-top:6px">Près de ton école.</h2></div>
      <div style="margin-top:16px">{carte_logement("Studio meublé Maârif", "Maârif, Casablanca", 3200, "295 €", "Partenaire certifié", "12 min à pied de l'ESA", res_photo("twenty-casa-anfa", 5, largeur=700, ratio=1.45), ["Meublé", "Wifi", "28 m²"])}</div>
    </div>
    <div style="margin-top:36px;background:{VERT};padding:36px 20px">
      <span class="eyebrow">Comment ça marche</span><h2 class="serif" style="font-size:30px;font-weight:600;color:#fff;margin-top:6px;line-height:1.1">Réserver à distance, <em style="color:{OCRE}">sans arnaque</em>.</h2>
      {"".join(f'<div style="display:flex;gap:14px;margin-top:20px"><span class="serif" style="font-size:30px;color:{OCRE};font-weight:600;width:44px">0{k + 1}</span><span><b style="color:#fff;display:block">{t}</b><span style="color:#c9d8cf;font-size:13.5px">{d}</span></span></div>' for k, (t, d) in enumerate([("Je cherche", "Par école, ville et budget."), ("Je réserve", "Demande en ligne et dossier."), ("Je paie en séquestre", "Protégé jusqu'à ton entrée."), ("Je signe", "Contrat et état des lieux en ligne."), ("J'emménage", "Quittances et médiation.")]))}
    </div>
    <div style="position:sticky;bottom:0;display:flex;justify-content:space-around;padding:10px 0 14px;background:#fff;border-top:1px solid #e6dfcd;font-size:11px;font-weight:700">
      {"".join(f'<span style="display:flex;flex-direction:column;align-items:center;gap:4px;color:{VERT if k == 0 else "#7a7a6c"}">{icon(i, 20, VERT if k == 0 else "#7a7a6c")}{t}</span>' for k, (i, t) in enumerate([("search", "Chercher"), ("building-2", "Résidences"), ("heart", "Favoris"), ("calendar-check", "Réservations"), ("user", "Compte")]))}</div>
    {pied(True)}
    </section>"""


def main():
    out = os.path.join(ROOT, "design/maquettes/out/navilease-refonte.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    corps = "".join(f'<div class="titre-ecran">{t}</div>{e}' for t, e in [("1 · Accueil Navilease", ecran_accueil()), ("2 · Logements à Casablanca", ecran_liste()), ("3 · Fiche d'un logement", ecran_fiche()), ("4 · Accueil sur téléphone", ecran_mobile())])
    open(out, "w", encoding="utf-8").write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navilease : refonte</title><style>{CSS}</style></head><body>{corps}</body></html>')
    print(out, round(os.path.getsize(out) / 1e6, 1), "Mo")


if __name__ == "__main__":
    main()
