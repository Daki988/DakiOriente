#!/usr/bin/env python3
"""Maquettes de novembre 2026 :

1. Roll-up Navigoal (85 × 200 cm, 1 px = 1 mm ; impression : PDF vectoriel à l'échelle, 2 mm de fond perdu)
2. Article d'actualité : même structure que les guides (bandeau, fil d'Ariane, photo de couverture créditée, cartes)
3. Liste des actualités : vignettes photo au lieu des aplats de couleur
4. Page « Bourses » : bourses publiques + bourses et réductions publiées par les écoles (relevées sur leurs sites officiels)
5. Pied de page : lien « Bourses » dans la colonne Plateforme

Usage : python3 design/maquettes/editorial.py <dossier icônes lucide> <qr.png>  → design/maquettes/out/editorial.html
"""
import base64
import io
import json
import os
import sys

from PIL import Image

QR = sys.argv[2]
sys.argv = sys.argv[:2]
import premium as P  # noqa: E402

icon, CSS, WORDMARK = P.icon, P.CSS, P.WORDMARK
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = os.path.join(ROOT, "web")


def img(path, side=1400, q=84):
    im = Image.open(path)
    im.thumbnail((side, side))
    buf = io.BytesIO()
    if im.mode in ("RGBA", "LA", "P"):
        im.save(buf, "PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    im.convert("RGB").save(buf, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


PUB = lambda p: os.path.join(WEB, "public", p)  # noqa: E731
LOGO_FULL = img(PUB("brand/navigoal-logo.png"), 1600)
MARK = img(PUB("brand/navigoal-mark.png"), 600)
OAPS = img(PUB("brand/oaps-logo.webp"), 500)
ETUDIANTE = img(PUB("images/etudiante.webp"), 1600)
PHOTOS = {k: img(PUB(f"images/{k}.webp"), 1200) for k in ["laptop", "education", "social", "data", "btp"]}
PHOTOS["maroc"] = img(os.path.join(ROOT, "assets/photos/villes/rabat.jpg"), 1200)
QRB = img(QR, 900)
ETABS = {e["id"]: e for e in json.load(open(os.path.join(ROOT, "data/referentiels/etablissements_superieurs.json")))["items"]}


def logo(eid, s=46):
    e = ETABS[eid]
    return f'<span style="width:{s}px;height:{s}px;border-radius:12px;border:1px solid #e6eaf3;background:#fff;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0"><img src="{img(os.path.join(ROOT, e["logo"]["fichier"]), 160)}" style="max-width:86%;max-height:86%"></span>'


def entete(actif=""):
    items = ["Métiers", "Formations", "Établissements", "Villes", "Orientation", "Ressources", "Navilease", "NaviTravel", "Parents"]
    liens = "".join(f'<span style="font-weight:{800 if i == actif else 600};font-size:14px;color:{"#1a47f5" if i == actif else "#3b4566"}">{i}</span>' for i in items)
    return f"""<div style="height:72px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 56px;gap:26px">
  <img src="{WORDMARK}" style="height:30px;margin-right:40px">{liens}<span style="flex:1"></span>
  <span class="btn" style="background:#eef1f8;padding:10px">{icon("search", 16, "#3b4566")}</span><span class="btn sun">S'inscrire</span></div>"""


def pied():
    cols = [("Plateforme", ["Orientation", "Métiers", "Formations", "Établissements", "<b style='color:#ffc21f'>Bourses</b>", "Comparateur", "Navilease", "NaviTravel"]),
            ("Étudier au Maroc", ["Visa et séjour", "Toutes les villes", "Étudier à Casablanca", "Étudier à Rabat", "Reconnus par l'État"]),
            ("Ressources", ["Guides et outils", "Espace parents", "Devis parents", "Calculateur de moyenne", "Actualités"]),
            ("Navigoal", ["Pourquoi Navigoal", "Mon espace", "Bailleurs", "Crédits des photos", "Contact"])]
    c = "".join(f'<div style="display:flex;flex-direction:column;gap:11px"><b style="color:#fff;font-size:14px">{t}</b>{"".join(f"<span style=\'color:#b9c3e6;font-size:14px\'>{x}</span>" for x in l)}</div>' for t, l in cols)
    return f"""<div style="background:#0b1a4f;padding:48px 56px;display:flex;gap:70px;position:relative">
  <div style="width:300px;display:flex;flex-direction:column;gap:14px"><img src="{WORDMARK}" style="height:30px;align-self:flex-start;filter:brightness(0) invert(1)"><span style="color:#b9c3e6;font-size:14px;line-height:1.6">De l'orientation à la formation, jusqu'au logement étudiant.</span></div>{c}
  <span class="note" style="right:60px;top:30px">« Bourses » ajouté au pied de page, colonne Plateforme</span></div>"""


# ------------------------------------------------------------------ 1. Roll-up 850 × 2000 (version photo)
RU = os.path.join(ROOT, "assets", "photos", "rollup")
CREDITS_RU = json.load(open(os.path.join(RU, "credits.json")))
FOTO = {}


def charger_photos(side):
    for k in ["maroc-hassan2", "maroc-chefchaouen", "residence", "chambre2"]:
        FOTO[k] = img(os.path.join(RU, k + ".jpg"), side)
    # Campus recadré : aucune banderole ni aucun logo d'établissement visible (consigne du 19/11/2026)
    FOTO["ecole"] = img(os.path.join(RU, "ecole-recadree.jpg"), side)
    FOTO["etudiant"] = img(os.path.join(RU, "etudiant.png"), side)
    FOTO["etudiante"] = img(PUB("images/etudiante.webp"), side)
    FOTO["avion"] = img(os.path.join(ROOT, "assets/photos/navitravel/hublot.jpg"), side)


charger_photos(1400)


def tuile(photo, ic, titre, texte, pos="center"):
    return f"""<div style="position:relative;border-radius:30px;overflow:hidden;height:265px;box-shadow:0 18px 40px -18px rgba(0,0,0,.6)">
      <img src="{FOTO[photo]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:{pos}">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,79,0) 30%,rgba(11,26,79,.92) 100%)"></div>
      <span style="position:absolute;left:18px;top:18px;width:58px;height:58px;border-radius:17px;background:#ffc21f;display:flex;align-items:center;justify-content:center">{icon(ic, 32, "#0b1533", 2.2)}</span>
      <div style="position:absolute;left:20px;right:18px;bottom:18px;display:flex;flex-direction:column;gap:4px"><b style="font-size:29px;line-height:1.08;color:#fff">{titre}</b><span style="font-size:19px;line-height:1.25;color:#dbe3ff">{texte}</span></div></div>"""


def rollup():
    puces = "".join(f'<span style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:10px 16px;font-size:19px;font-weight:700;color:#fff">{icon(i, 21, "#ffc21f", 2.2)}{t}</span>' for i, t in [
        ("compass", "Test d'orientation"), ("calculator", "Devis complet"), ("file-check-2", "Candidature gratuite"), ("stamp", "Aide au visa"), ("plane-landing", "Accueil à l'arrivée")])
    credits = " · ".join(f"{v['auteur']} ({v['licence']})" for k, v in CREDITS_RU.items() if k in ("maroc-hassan2", "ecole", "residence", "avion"))
    return f"""<div class="frame" style="width:850px;height:2000px;background:#0b1a4f;margin-top:80px">
  <span class="titre-cadre">1 · Roll-up 85 × 200 cm (échelle 1 px = 1 mm)</span>
  <div style="position:absolute;inset:0;background:radial-gradient(800px 700px at 110% 70%, #1a47f5 0%, transparent 60%)"></div>
  <div style="position:absolute;left:0;right:0;top:0;height:300px;background:#fff;display:flex;align-items:center;justify-content:center;z-index:2;border-radius:0 0 60px 60px;box-shadow:0 20px 40px -20px rgba(0,0,0,.5)">
    <img src="{LOGO_FULL}" style="height:250px"></div>
  <div style="position:absolute;left:0;right:0;top:240px;height:780px;overflow:hidden">
    <img src="{FOTO['maroc-hassan2']}" style="width:100%;height:100%;object-fit:cover;object-position:center 30%">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,79,.05) 35%,rgba(11,26,79,.55) 62%,#0b1a4f 100%)"></div>
    <span style="position:absolute;left:60px;top:96px;background:#ffc21f;color:#0b1533;border-radius:999px;padding:12px 22px;font-size:24px;font-weight:800;display:flex;align-items:center;gap:10px;box-shadow:0 10px 26px rgba(0,0,0,.35)">{icon("map-pin", 24, "#0b1533", 2.4)}Étudier au Maroc</span>
    <div style="position:absolute;left:60px;right:50px;top:170px;display:flex;flex-direction:column;gap:12px;z-index:2">
      <h1 style="font-size:68px;line-height:1.04;font-weight:800;color:#fff;letter-spacing:-.02em;text-shadow:0 4px 30px rgba(0,0,0,.55)">Trouve ta voie,<br>étudie <span style="color:#ffc21f">en confiance.</span></h1></div></div>
  <div style="position:absolute;left:0;right:0;top:560px;height:490px;z-index:3;overflow:hidden">
    <img src="{FOTO['etudiant']}" style="position:absolute;left:95px;bottom:0;height:470px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.5))">
    <img src="{FOTO['etudiante']}" style="position:absolute;left:390px;bottom:0;height:405px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.5))"></div>
  <div style="position:absolute;left:60px;right:60px;top:1050px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
    {tuile("ecole", "graduation-cap", "Des écoles vérifiées", "statut officiel et filières accréditées")}
    {tuile("residence", "house", "Ton logement trouvé", "résidences et logements vérifiés", "center 40%")}
    {tuile("avion", "plane", "Billets d'avion à prix étudiant", "on compare les vols pour toi", "center 45%")}
    {tuile("maroc-chefchaouen", "sparkles", "Un nouveau pays à vivre", "accueil, installation, vie sur place", "center 55%")}
  </div>
  <div style="position:absolute;left:60px;right:60px;top:1640px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center">{puces}</div>
  <div style="position:absolute;left:50px;right:50px;top:1785px;height:180px;background:#fff;border-radius:34px;display:flex;align-items:center;gap:24px;padding:0 26px">
    <img src="{QRB}" style="width:140px;height:140px">
    <span style="display:flex;flex-direction:column;gap:6px;flex:1"><b style="font-size:44px;color:#1a47f5;letter-spacing:-.01em">navigoal.net</b>
      <span style="font-size:24px;color:#0b1533;display:flex;align-items:center;gap:10px;white-space:nowrap">{icon("mail", 25, "#1a47f5")}<b>contact@navigoal.net</b></span>
      <span style="font-size:19px;color:#5b6478">Scanne : test d'orientation gratuit</span></span>
    <span style="display:flex;flex-direction:column;align-items:center;gap:4px"><span style="font-size:14px;font-weight:800;color:#5b6478;letter-spacing:.2em">BY</span><img src="{OAPS}" style="width:100px"></span></div>
  <p style="position:absolute;left:50px;right:50px;top:1972px;font-size:9px;line-height:1.3;color:#8f9bc4;text-align:center">Photos : {credits} et Badr Rachadi (CC BY-SA 4.0), Wikimedia Commons, Unsplash et Pexels.</p>
  <span class="note" style="left:880px;top:20px;max-width:330px">Grande photo du Maroc (Mosquée Hassan II) sous le logo, un étudiant et une étudiante au premier plan, puis 4 photos : école, logement, avion, ville. Aucun WhatsApp, aucun logo ni panneau d'établissement.</span>
  <span class="note" style="left:880px;top:1300px;max-width:330px">« Billets d'avion à prix étudiant » reprend la promesse de la page NaviTravel (« au tarif étudiant »), sans chiffre de réduction.</span>
  <span class="note" style="left:880px;top:1800px;max-width:330px">Crédits des photos en bas (obligatoires pour les licences CC BY-SA).</span>
</div>"""


# ------------------------------------------------------------------ 2. Article
def article():
    return f"""<div class="frame" style="width:1440px">
  <span class="titre-cadre">2 · Article d'actualité (même structure que les guides)</span>{entete("Ressources")}
  <div style="background:linear-gradient(135deg,#eef2ff 0%,#f6f8fe 55%,#fff7dd 100%);padding:34px 56px 40px;display:flex;flex-direction:column;gap:14px;position:relative">
    <span class="small mute" style="display:flex;gap:8px;align-items:center">Accueil {icon("chevron-right", 13, "#8a93ad")} Actualités {icon("chevron-right", 13, "#8a93ad")} Bourses</span>
    <span class="chip y" style="align-self:flex-start">{icon("award", 13, "#a55a00")}Bourses</span>
    <h1 style="font-size:46px;line-height:1.1;font-weight:800;max-width:980px;letter-spacing:-.02em">Bourses d'études 2026 : 10 opportunités pour les étudiants africains</h1>
    <p style="font-size:19px;color:#3b4566;max-width:900px">Une sélection de bourses disponibles en Afrique et à l'international pour poursuivre vos études.</p>
    <span class="small mute" style="display:flex;gap:16px;align-items:center"><span style="display:flex;gap:6px;align-items:center">{icon("pen-line", 14, "#5b6478")}Rédaction Navigoal</span><span style="display:flex;gap:6px;align-items:center">{icon("calendar", 14, "#5b6478")}10 octobre 2026</span><span style="display:flex;gap:6px;align-items:center">{icon("clock-3", 14, "#5b6478")}4 min de lecture</span></span>
    <span class="note" style="right:56px;top:40px">Bandeau, fil d'Ariane et métadonnées : même gabarit que /ressources/[guide]</span></div>
  <div style="display:grid;grid-template-columns:1fr 340px;gap:32px;padding:32px 56px 60px">
    <div style="display:flex;flex-direction:column;gap:22px">
      <figure style="margin:0;position:relative"><img src="{PHOTOS['laptop']}" style="width:100%;height:400px;object-fit:cover;border-radius:24px">
        <figcaption class="small mute" style="margin-top:8px">Photo : crédit et licence affichés, comme pour les métiers (page /credits/)</figcaption>
        <span class="note" style="left:20px;top:20px">Photo de couverture propre à chaque article (fonds photo déjà crédité du site)</span></figure>
      <div class="card" style="padding:26px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:24px">Où chercher</h2>
        <p style="font-size:16px;line-height:1.7;color:#3b4566">Les bourses proviennent des écoles elles-mêmes (mérite, excellence, fratrie), des agences nationales de bourses et des programmes de coopération.</p></div>
      <div class="card" style="padding:26px;display:flex;flex-direction:column;gap:12px"><h2 style="font-size:24px">Nos conseils</h2>
        {"".join(f'<p style="display:flex;gap:10px;font-size:16px;color:#3b4566">{icon("circle-check", 19, "#0f8a46")}{t}</p>' for t in ["Préparez vos relevés de notes et une lettre de motivation dès la Première.", "Vérifiez les dates limites : la plupart des campagnes ferment entre mars et juin.", "Sur Navigoal, suivez une bourse pour être prévenu avant la date limite."])}</div>
      <div class="card" style="padding:22px;display:flex;gap:18px;align-items:center;background:linear-gradient(135deg,#0b1a4f,#1a47f5);border:0">
        <span style="width:56px;height:56px;border-radius:16px;background:#ffc21f;display:flex;align-items:center;justify-content:center">{icon("hand-coins", 28, "#0b1533")}</span>
        <span style="flex:1;color:#fff"><b style="font-size:18px">Les bourses pour toi</b><p style="color:#c9d3f5;font-size:14px;margin-top:4px">Bourses publiques et bourses des écoles, classées selon ton profil.</p></span><span class="btn sun">Voir les bourses</span></div>
      <div style="display:flex;gap:12px;align-items:flex-start;border:1px solid #f6dd9a;background:#fff7dd;border-radius:18px;padding:18px">{icon("lightbulb", 22, "#a55a00")}<span style="font-size:14px"><b>À retenir</b><br>Comparez les écoles et faites un devis complet avant de vous engager. <b style="color:#1a47f5">Simuler mon devis →</b></span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:8px"><span class="small" style="font-weight:800;color:#5b6478;text-transform:uppercase">Sommaire</span><span style="font-size:14px">1. Où chercher</span><span style="font-size:14px">2. Nos conseils</span></div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px"><b>Va plus loin</b><span class="btn primary">Passer le test d'orientation</span><span class="btn ghost">Comparer des écoles</span></div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px"><b style="display:flex;gap:8px;align-items:center">{icon("newspaper", 17, "#1a47f5")}À lire aussi</b>
        {"".join(f'<span style="display:flex;gap:10px;align-items:center"><img src="{PHOTOS[p]}" style="width:64px;height:48px;object-fit:cover;border-radius:10px"><span style="font-size:13.5px;font-weight:700;line-height:1.3">{t}</span></span>' for p, t in [("education", "Bien choisir sa série après le BEPC"), ("maroc", "Étudier au Maroc : démarches et coûts"), ("social", "Réussir sa première année")])}</div>
    </div></div>{pied()}</div>"""


# ------------------------------------------------------------------ 3. Liste des actualités
def liste():
    arts = [("laptop", "y", "Bourses", "Bourses d'études 2026 : 10 opportunités pour les étudiants africains", "10 oct. 2026"),
            ("education", "g", "Orientation", "Comment bien choisir sa série après le BEPC, le BFEM ou le tronc commun ?", "08 oct. 2026"),
            ("maroc", "v", "International", "Étudier au Maroc quand on est Gabonais : démarches, coûts et logement", "06 oct. 2026"),
            ("social", "r", "Vie étudiante", "Vie étudiante : 7 conseils pour réussir sa première année", "04 oct. 2026"),
            ("data", "b", "Innovation", "L'intelligence artificielle au service de l'éducation en Afrique", "03 oct. 2026"),
            ("btp", "y", "Métiers", "Métiers du bâtiment : des opportunités pour les jeunes africains", "29 sept. 2026")]
    cartes = "".join(f"""<div class="card" style="overflow:hidden;display:flex;flex-direction:column">
      <img src="{PHOTOS[p]}" style="width:100%;height:200px;object-fit:cover">
      <div style="padding:18px;display:flex;flex-direction:column;gap:10px"><span style="display:flex;justify-content:space-between"><span class="chip {t}">{c}</span><span class="small mute">{d}</span></span>
      <b style="font-size:17px;line-height:1.3">{ti}</b><span style="font-size:13px;font-weight:800;color:#1a47f5">Lire l'article →</span></div></div>""" for p, t, c, ti, d in arts)
    return f"""<div class="frame" style="width:1440px">
  <span class="titre-cadre">3 · Actualités : une photo par article</span>{entete()}
  <div style="padding:34px 56px 20px"><h1 style="font-size:52px;font-weight:800">Actualités</h1><p class="mute" style="font-size:18px;margin-top:8px">Reste informé sur l'éducation, l'orientation, les formations et les opportunités en Afrique.</p></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:10px 56px 60px;position:relative">{cartes}
    <span class="note" style="right:70px;top:-10px">Photos réelles (fonds crédité du site) au lieu des aplats de couleur avec icône</span></div></div>"""


# ------------------------------------------------------------------ 4. Bourses
def bourses():
    ecoles = [("ma-ecc", "Bourses de la Fondation Mastercard (cycle ingénieur)", "Scolarité prise en charge à 100 %, logement à la résidence du campus, frais de vie, assurance santé, matériel et billet d'avion, pour des jeunes du Maroc et d'Afrique subsaharienne.", "100 %", "g"),
              ("ma-ueuromed", "Bourses d'excellence et bourses sociales", "Bourses couvrant 25 %, 50 %, 75 % et jusqu'à 100 % des frais de scolarité ; attribuées pour un an, renouvelables. Réduction de 5 % pour paiement intégral.", "25 à 100 %", "g"),
              ("ma-averroes", "Bourse d'excellence et bourse de mérite sociale", "De 20 % à 100 % des frais d'inscription et de scolarité.", "20 à 100 %", "g"),
              ("ma-esca", "Bourses de mérite et prêt études", "Bourses partielles dès 15/20 (bac et entretien) ; prêt études jusqu'à 50 000 MAD par an auprès de banques partenaires.", "Dès 15/20", "b"),
              ("ma-uiass", "Bourse d'excellence en santé", "Scolarité complète pour les bacheliers scientifiques avec au moins 19/20 (médecine, dentaire, pharmacie, vétérinaire), sous réserve de réussite au concours.", "100 %", "g"),
              ("ma-um6p", "Bourses sociales et d'excellence", "Bourses chaque année pour les candidats marocains et d'Afrique, sur critères sociaux et d'excellence ; boursiers de la Mastercard Foundation accueillis.", "Jusqu'à 100 %", "g")]
    cartes = "".join(f"""<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:12px;align-items:center">{logo(e)}<span style="flex:1;min-width:0"><b style="font-size:15px">{ETABS[e]["sigle"]}</b><span class="small mute" style="display:block">{ETABS[e]["ville"]}</span></span><span class="chip {c}">{icon("percent", 12)}{badge}</span></div>
      <b style="font-size:16px;line-height:1.3">{t}</b><p style="font-size:13.5px;line-height:1.6;color:#3b4566">{d}</p>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eef1f8;padding-top:12px"><span class="small mute" style="display:flex;gap:6px;align-items:center">{icon("badge-check", 14, "#0f8a46")}Relevé sur le site officiel · nov. 2026</span><span style="font-size:13px;font-weight:800;color:#1a47f5">Voir l'école →</span></div></div>""" for e, t, d, badge, c in ecoles)
    publiques = "".join(f"""<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:8px"><span class="small" style="font-weight:800;color:#1a47f5;text-transform:uppercase">{o}</span><b style="font-size:17px">{n}</b><p style="font-size:13.5px;color:#3b4566">{p}</p><span class="small mute">{icon("globe", 13, "#5b6478")} {z}</span></div>""" for o, n, p, z in [
        ("ANBG", "Bourse d'études de l'État gabonais", "Élèves et étudiants de nationalité gabonaise, au Gabon ou à l'étranger.", "Gabon → tous pays d'études"),
        ("ANBG et pays partenaires", "Bourse de coopération", "Bacheliers gabonais visant un établissement public d'un pays partenaire.", "Gabon → établissements publics"),
        ("AMCI", "Bourse du Royaume du Maroc", "Étudiants étrangers admis dans un établissement public marocain.", "Tous pays → Maroc (public)")])
    filtres = "".join(f'<span class="chip {"b" if i == 0 else "n"}" style="padding:8px 14px;font-size:13px">{x}</span>' for i, x in enumerate(["Toutes", "Jusqu'à 100 %", "Mérite / excellence", "Sociales", "Prêt étudiant", "Réduction"]))
    return f"""<div class="frame" style="width:1440px">
  <span class="titre-cadre">4 · Page « Bourses » : bourses publiques et offres des écoles</span>{entete()}
  <div style="background:linear-gradient(135deg,#e8f8ef,#f6f8fe);padding:34px 56px 36px;display:flex;gap:40px;align-items:center">
    <div style="flex:1;display:flex;flex-direction:column;gap:12px"><span class="small mute">Accueil › Bourses</span><h1 style="font-size:48px;font-weight:800;letter-spacing:-.02em">Bourses d'études</h1>
      <p style="font-size:18px;color:#3b4566;max-width:760px">Bourses de l'État de ton pays, du pays d'études et <b>bourses et réductions des écoles</b> : conditions, montants et démarches, relevés sur les sources officielles.</p>
      <div style="display:flex;gap:24px;margin-top:6px">{"".join(f'<span style="display:flex;flex-direction:column"><b style="font-size:28px;color:#0f8a46">{n}</b><span class="small mute">{l}</span></span>' for n, l in [("3", "bourses publiques"), ("52", "écoles qui détaillent leurs bourses"), ("13", "écoles avec des bourses jusqu'à 100 %")])}</div></div>
    <img src="{PHOTOS['laptop']}" style="width:400px;height:250px;object-fit:cover;border-radius:24px"></div>
  <div style="padding:30px 56px 10px;display:flex;flex-direction:column;gap:16px;position:relative">
    <h2 style="font-size:28px">Bourses et réductions des écoles</h2>
    <p class="mute" style="font-size:15px;margin-top:-8px">Ce que chaque école annonce sur son site officiel. Conditions exactes et dates : à confirmer auprès de l'école.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">{filtres}<span class="field" style="margin-left:auto;width:260px">{icon("search", 15, "#8a93ad")}<span class="mute">Rechercher une école</span></span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">{cartes}</div>
    <span class="btn ghost" style="align-self:center;margin-top:6px">Voir les 52 écoles</span>
    <span class="note" style="right:56px;top:20px">Source : rubrique « bourses » des sites officiels des écoles (relevé de novembre 2026), lien vers la fiche école. Les campagnes « bourse » publiées par les écoles partenaires s'affichent en tête.</span></div>
  <div style="padding:30px 56px 60px;display:flex;flex-direction:column;gap:16px"><h2 style="font-size:28px">Bourses publiques</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">{publiques}</div></div>
  {pied()}</div>"""


# Fichier d'impression du roll-up : 856 × 2006 mm (3 mm de fond perdu de chaque côté), sans annotations, images en pleine définition.
def rollup_impression():
    r = rollup().replace('width:850px;height:2000px;background:#0b1a4f;margin-top:80px', 'width:856px;height:2006px;background:#0b1a4f;margin:0')
    import re as _re
    r = _re.sub(r'<span class="(?:note|titre-cadre)"[^>]*>.*?</span>', '', r, flags=_re.S)
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Roll-up Navigoal</title><style>{CSS}
@page {{ size: 856mm 2006mm; margin: 0; }} html, body {{ margin: 0; background: #0b1a4f; }} .frame {{ zoom: 3.7795; }}</style></head><body>{r}</body></html>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal — roll-up, articles, bourses</title><style>{CSS}</style></head>
<body><div style="display:flex;align-items:flex-start;flex-wrap:wrap">{rollup()}{article()}</div><div>{liste()}{bourses()}</div></body></html>"""
out = os.path.join(HERE, "out")
os.makedirs(out, exist_ok=True)
open(os.path.join(out, "editorial.html"), "w").write(html)
print("ok", len(html) // 1024, "Ko")
if os.environ.get("IMPRESSION"):
    LOGO_FULL, ETUDIANTE, OAPS = img(PUB("brand/navigoal-logo.png"), 4000), img(PUB("images/etudiante.webp"), 4000), img(PUB("brand/oaps-logo.webp"), 4000)
    charger_photos(3840)
    QRB = img(QR, 2000)
    open(os.path.join(out, "rollup-impression.html"), "w").write(rollup_impression())
    print("roll-up : out/rollup-impression.html")
