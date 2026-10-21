#!/usr/bin/env python3
"""Maquettes de la campagne « Trouve ta voie » (Gabon, déc. 2026 – févr. 2027), importées dans Figma via html_to_figma.

Usage : python3 design/maquettes/campagne.py <dossier des polices> <photo détourée avec contour>
  - polices : anton-latin-400-normal.woff2 et plus-jakarta-sans-latin-wght-normal.woff2
Sortie : design/maquettes/out/campagne.html (4 cadres .frame)
"""
import base64
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)
FONTS, STICKER = sys.argv[1], sys.argv[2]


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


ANTON = b64(os.path.join(FONTS, "anton-latin-400-normal.woff2"), "font/woff2")
JAKARTA = b64(os.path.join(FONTS, "plus-jakarta-sans-latin-wght-normal.woff2"), "font/woff2")
PHOTO = b64(STICKER, "image/png")
WORDMARK = b64(os.path.join(ROOT, "web", "public", "brand", "navigoal-wordmark.png"), "image/png")

# Coûts : modèle de devis Navigoal (MAD) converti au taux indicatif du référentiel.
couts = next(i for i in json.load(open(os.path.join(ROOT, "data", "referentiels", "couts_etudes.json")))["items"] if i["id"] == "MA")
TAUX = json.load(open(os.path.join(ROOT, "data", "referentiels", "couts_etudes.json")))["_meta"]["taux_change_indicatifs"]
XAF_PAR_MAD = TAUX["XAF"] / TAUX["MAD"]


def fcfa(mad):
    v = mad * XAF_PAR_MAD
    return f"{v / 1e6:.1f}".replace(".", ",") + " M" if v >= 1e6 else f"{round(v, -4):,.0f}".replace(",", " ")


S = couts["scolarite_annuelle"]
V = couts["vie_mensuelle"]
PRIX = [
    ("Vivre hors Casablanca, Rabat, Marrakech", f"{fcfa(V['autre_ville']['min'])} à {fcfa(V['autre_ville']['max'])}", "par mois"),
    ("Vivre à Casablanca, Rabat ou Marrakech", f"{fcfa(V['ville_chere']['min'])} à {fcfa(V['ville_chere']['max'])}", "par mois"),
    ("Institut, BTS, technicien spécialisé", f"{fcfa(S['institut']['min'])} à {fcfa(S['institut']['max'])}", "par an"),
    ("École d'ingénieurs", f"{fcfa(S['ecole_ingenieurs']['min'])} à {fcfa(S['ecole_ingenieurs']['max'])}", "par an"),
    ("École de commerce", f"{fcfa(S['ecole_commerce']['min'])} à {fcfa(S['ecole_commerce']['max'])}", "par an"),
]
ETABS = json.load(open(os.path.join(ROOT, "data", "referentiels", "etablissements_superieurs.json")))["items"]
N_ETABS = len(ETABS)
N_RECONNUS = sum(1 for e in ETABS if e.get("label") == "reconnu_etat")
N_HOMOLOGUES = sum(1 for e in ETABS if e.get("label") == "diplomes_homologues")

CSS = f"""
@font-face {{ font-family: 'Anton'; src: url({ANTON}) format('woff2'); }}
@font-face {{ font-family: 'Plus Jakarta Sans'; src: url({JAKARTA}) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #e9edf5; font-family: 'Plus Jakarta Sans', sans-serif; color: #0b1533; }}
.frame {{ position: relative; overflow: hidden; background: #fff; margin: 40px; }}
p, h1, h2, h3 {{ margin: 0; }}
.anton {{ font-family: 'Anton', sans-serif; letter-spacing: -1px; line-height: .95; }}
.hl {{ background: #FFE14D; color: #0A0A0A; padding: 0 12px; }}
.chip {{ display: inline-block; border: 3px solid #0A0A0A; border-radius: 12px; box-shadow: 6px 6px 0 #0A0A0A; padding: 12px 18px; font-weight: 800; font-size: 16px; color: #0A0A0A; white-space: nowrap; }}
.y {{ background: #FFE14D; }} .w {{ background: #fff; }} .o {{ background: #FF8A3D; }}
.btn {{ display: inline-block; border: 3px solid #0A0A0A; border-radius: 14px; box-shadow: 6px 6px 0 #0A0A0A; padding: 16px 26px; font-weight: 800; font-size: 18px; color: #0A0A0A; }}
.note {{ position: absolute; background: #ff4fa3; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 8px; max-width: 260px; line-height: 1.35; }}
.header {{ height: 76px; display: flex; align-items: center; padding: 0 64px; gap: 28px; border-bottom: 1px solid #e6eaf3; background: #fff; }}
.header nav {{ display: flex; gap: 22px; font-size: 14px; font-weight: 600; color: #3b4566; }}
.header .sp {{ flex: 1; }}
.ghost {{ padding: 10px 18px; border-radius: 12px; border: 1px solid #d6dcea; font-weight: 700; font-size: 14px; }}
.sun {{ padding: 10px 18px; border-radius: 12px; background: #ffc21f; font-weight: 800; font-size: 14px; }}
.sec {{ padding: 88px 64px; }}
.kicker {{ font-weight: 800; font-size: 14px; letter-spacing: 3px; color: #1a47f5; text-transform: uppercase; }}
.card {{ border-radius: 22px; border: 1px solid #e6eaf3; box-shadow: 0 1px 2px rgba(11,21,51,.04), 0 8px 24px -8px rgba(11,21,51,.10); background: #fff; }}
"""

HEADER = f"""<div class="header"><img src="{WORDMARK}" style="height:34px" alt="Navigoal"><nav><span>Métiers</span><span>Formations</span><span>Établissements</span><span>Orientation</span><span>Devis parents</span><span>Navilease</span><span>Étudier au Maroc</span></nav><div class="sp"></div><span class="ghost">Se connecter</span><span class="sun">S'inscrire</span></div>"""

prix_rows = "".join(f"""<div style="display:flex;align-items:center;padding:18px 0;border-bottom:1px solid #e6eaf3"><p style="flex:1;font-weight:600;font-size:17px">{a}</p><p class="anton" style="font-size:34px;color:#0A0A0A">{b} <span style="font-family:'Plus Jakarta Sans';font-size:15px;font-weight:700;letter-spacing:0;color:#3b4566">F CFA {c}</span></p></div>""" for a, b, c in PRIX)

ETAPES = [
    ("1", "Trouve ton métier", "Le test d'orientation : 5 minutes, gratuit. Ton profil et les métiers qui te ressemblent.", "Faire le test"),
    ("2", "Choisis ta filière", "96 fiches métiers : missions, niveau d'études, filières qui y mènent.", "Voir les métiers"),
    ("3", "Compare les écoles", f"{N_ETABS} établissements au Maroc, statut officiel affiché, comparés côte à côte.", "Ouvrir le comparateur"),
]
etapes = "".join(f"""<div class="card" style="flex:1;padding:32px"><p class="anton" style="font-size:64px;color:#1a47f5">{n}</p><h3 style="font-size:24px;font-weight:800;margin-top:12px">{t}</h3><p style="font-size:16px;line-height:1.6;color:#3b4566;margin-top:10px">{d}</p><p style="font-weight:800;color:#1a47f5;margin-top:18px">{c} →</p></div>""" for n, t, d, c in ETAPES)

POURQUOI = [
    ("Des diplômes qui comptent", f"{N_RECONNUS} écoles reconnues par l'État et {N_HOMOLOGUES} aux diplômes homologués sur Navigoal."),
    ("Des démarches expliquées", "Entrée, carte de séjour étudiant, assurance : chaque étape détaillée selon ta nationalité."),
    ("Un budget prévisible", "Le devis complet en F CFA, scolarité et vie comprises, avant de signer."),
    ("Une communauté sur place", "Des étudiants gabonais à Rabat, Casablanca et Fès, et des ambassadeurs pour répondre."),
]
pourquoi = "".join(f"""<div style="flex:1;border:3px solid #0A0A0A;border-radius:18px;box-shadow:6px 6px 0 #0A0A0A;background:#fff;padding:26px"><h3 style="font-size:20px;font-weight:800;color:#0A0A0A">{t}</h3><p style="font-size:15px;line-height:1.6;color:#3b4566;margin-top:10px">{d}</p></div>""" for t, d in POURQUOI)

FAQ = ["C'est vraiment gratuit ?", "Je n'ai pas encore mon bac, je peux m'inscrire ?", "Navigoal garantit-il une admission ou une bourse ?", "Comment sont calculés les prix en F CFA ?", "Mes parents peuvent-ils suivre mon dossier ?"]
faq = "".join(f"""<div style="display:flex;align-items:center;padding:22px 0;border-bottom:1px solid #e6eaf3"><p style="flex:1;font-weight:700;font-size:18px">{q}</p><p style="font-size:24px;color:#1a47f5">+</p></div>""" for q in FAQ)

HERO_DESKTOP = f"""
<div style="position:relative;height:900px;background:#1A47F5;overflow:hidden">
  <div style="height:56px;background:#0A0A0A;display:flex;align-items:center;justify-content:center"><p class="anton" style="color:#FFE14D;font-size:24px;letter-spacing:3px">241 → 212 ✦ BAC EN POCHE ✦ TROUVE TA VOIE ✦ 241 → 212</p></div>
  <div style="position:absolute;left:64px;top:104px;width:760px">
    <span style="display:inline-block;background:#fff;border-radius:14px;padding:14px 20px;font-weight:600;font-size:20px;color:#0A0A0A">POV : t'as ton bac en vue mais zéro plan.</span>
    <p class="anton" style="font-size:150px;line-height:160px;color:#fff;margin-top:26px">TROUVE</p>
    <p class="anton" style="font-size:150px;line-height:160px;margin-top:8px"><span class="hl" style="display:inline-block;line-height:160px">TA VOIE</span></p>
    <p class="anton" style="font-size:150px;line-height:160px;color:#fff;margin-top:8px">AU MAROC.</p>
    <p style="font-size:20px;line-height:1.55;color:#dae6ff;margin-top:26px;width:600px">Ton métier, ta filière, ton école : Navigoal t'accompagne gratuitement, de Libreville jusqu'au campus.</p>
    <div style="margin-top:30px;display:flex;gap:22px"><span class="btn y">Faire le test · 5 min, gratuit</span><span class="btn w">Mon devis en F CFA</span></div>
  </div>
  <img src="{PHOTO}" style="position:absolute;right:-20px;bottom:-40px;width:640px" alt="Étudiante souriante">
  <div style="position:absolute;right:500px;top:150px;transform:rotate(-4deg)" class="chip y">+{N_ETABS - 3} ÉCOLES AU STATUT AFFICHÉ</div>
  <div style="position:absolute;right:80px;top:120px;width:190px;height:190px;border-radius:50%;background:#0A0A0A;transform:rotate(-12deg);text-align:center;padding-top:44px"><p class="anton" style="color:#FFE14D;font-size:44px">241→212</p><p style="color:#fff;font-weight:700;font-size:14px;margin-top:8px">DE LIBREVILLE<br>AU CAMPUS</p></div>
  <div style="position:absolute;right:470px;top:760px;transform:rotate(3deg)" class="chip o">TON BUDGET EN F CFA</div>
</div>"""

LANDING_DESKTOP = f"""
<div class="frame" style="width:1440px" data-name="Campagne · Page Trouve ta voie · ordinateur">
  {HEADER}
  {HERO_DESKTOP}
  <div class="note" style="left:1130px;top:1090px">Animation : le titre apparaît ligne par ligne, les stickers tombent en léger rebond (300 ms, décalés de 80 ms)</div>
  <div style="background:#FFE14D;border-top:3px solid #0A0A0A;border-bottom:3px solid #0A0A0A;padding:18px 64px;display:flex;align-items:center;gap:24px"><p class="anton" style="font-size:30px;color:#0A0A0A">JEU #TROUVETAVOIE</p><p style="flex:1;font-weight:700;font-size:16px">Du 1er au 21 février : fais le test, crée ton compte, partage ton profil. Tirage en direct le 24 février.</p><p style="font-weight:800;text-decoration:underline">Lire le règlement</p></div>
  <div class="note" style="left:64px;top:1070px">Bandeau visible seulement du 1er au 21 février 2027 (dates en configuration)</div>
  <div class="sec"><p class="kicker">Dans cet ordre</p><h2 style="font-size:44px;font-weight:800;margin-top:10px">Ton métier d'abord. Ta filière ensuite. Ton école enfin.</h2><div style="display:flex;gap:28px;margin-top:40px">{etapes}</div></div>
  <div class="sec" style="background:#f3f7ff;display:flex;gap:64px"><div style="width:470px"><p class="kicker">Le vrai prix</p><h2 style="font-size:44px;font-weight:800;margin-top:10px">Combien ça coûte vraiment, en F CFA ?</h2><p style="font-size:17px;line-height:1.6;color:#3b4566;margin-top:16px">Estimations Navigoal à partir des grilles publiées. Ton devis personnalisé utilise les frais réels de ton école et tient compte de toute la durée de la formation.</p><div style="margin-top:28px"><span class="btn y">Calculer mon devis</span></div></div><div class="card" style="flex:1;padding:12px 36px">{prix_rows}</div></div>
  <div class="sec"><p class="kicker">Pourquoi le Maroc</p><h2 style="font-size:44px;font-weight:800;margin-top:10px">Proche, francophone, et des diplômes reconnus.</h2><div style="display:flex;gap:24px;margin-top:40px">{pourquoi}</div></div>
  <div class="sec" style="background:#0b1533;color:#fff;display:flex;gap:64px;align-items:center"><div style="flex:1"><p class="kicker" style="color:#ffc21f">Parents</p><h2 style="font-size:44px;font-weight:800;margin-top:10px;color:#fff">Le vrai coût, avant de signer.</h2><p style="font-size:18px;line-height:1.6;color:#bcd2ff;margin-top:16px;width:620px">Devis complet en F CFA, statut officiel de chaque école, et un espace parent pour suivre candidatures, paiements et logement depuis Libreville.</p></div><span class="btn y">Créer mon espace parent</span></div>
  <div class="sec"><p class="kicker">Questions fréquentes</p><div style="margin-top:20px;width:900px">{faq}</div></div>
  <div style="background:#0A0A0A;padding:36px 64px;display:flex;align-items:center"><p class="anton" style="color:#FFE14D;font-size:30px;flex:1">TON TALENT ▸ TES OPPORTUNITÉS ▸ TON AVENIR</p><p style="color:#fff;font-weight:700">navigoal.net</p></div>
</div>"""

LANDING_MOBILE = f"""
<div class="frame" style="width:390px" data-name="Campagne · Page Trouve ta voie · mobile">
  <div style="height:60px;display:flex;align-items:center;padding:0 18px;border-bottom:1px solid #e6eaf3"><img src="{WORDMARK}" style="height:26px" alt="Navigoal"><div style="flex:1"></div><span class="sun" style="padding:8px 14px;font-size:13px">S'inscrire</span><span style="margin-left:14px;font-size:22px">☰</span></div>
  <div style="position:relative;height:760px;background:#1A47F5;overflow:hidden">
    <div style="height:40px;background:#0A0A0A;display:flex;align-items:center;justify-content:center"><p class="anton" style="color:#FFE14D;font-size:16px;letter-spacing:2px">241 → 212 ✦ BAC EN POCHE</p></div>
    <div style="padding:22px 18px">
      <span style="display:inline-block;background:#fff;border-radius:10px;padding:10px 12px;font-weight:600;font-size:14px;color:#0A0A0A">POV : t'as ton bac en vue mais zéro plan.</span>
      <p class="anton" style="font-size:72px;line-height:78px;color:#fff;margin-top:18px">TROUVE</p>
      <p class="anton" style="font-size:72px;line-height:78px;margin-top:4px"><span class="hl" style="display:inline-block;line-height:78px">TA VOIE</span></p>
      <p class="anton" style="font-size:72px;line-height:78px;color:#fff;margin-top:4px">AU MAROC.</p>
      <p style="font-size:16px;line-height:1.55;color:#dae6ff;margin-top:16px">Ton métier, ta filière, ton école : Navigoal t'accompagne gratuitement.</p>
      <div style="margin-top:18px"><span class="chip y" style="font-size:13px;transform:rotate(-2deg)">+{N_ETABS - 3} ÉCOLES</span> <span class="chip o" style="font-size:13px;transform:rotate(2deg);margin-left:6px">BUDGET EN F CFA</span></div>
    </div>
    <img src="{PHOTO}" style="position:absolute;right:-30px;bottom:-30px;width:300px" alt="Étudiante souriante">
  </div>
  <div style="padding:40px 18px"><p class="kicker">Dans cet ordre</p><h2 style="font-size:26px;font-weight:800;margin-top:8px">Ton métier d'abord. Ta filière ensuite. Ton école enfin.</h2>
    <div class="card" style="padding:20px;margin-top:20px"><p class="anton" style="font-size:40px;color:#1a47f5">1</p><h3 style="font-size:19px;font-weight:800;margin-top:6px">Trouve ton métier</h3><p style="font-size:14px;line-height:1.55;color:#3b4566;margin-top:6px">Le test d'orientation : 5 minutes, gratuit.</p></div>
    <div class="card" style="padding:20px;margin-top:14px"><p class="anton" style="font-size:40px;color:#1a47f5">2</p><h3 style="font-size:19px;font-weight:800;margin-top:6px">Choisis ta filière</h3></div>
    <div class="card" style="padding:20px;margin-top:14px"><p class="anton" style="font-size:40px;color:#1a47f5">3</p><h3 style="font-size:19px;font-weight:800;margin-top:6px">Compare les écoles</h3></div>
  </div>
  <div style="position:sticky;bottom:0;background:#0A0A0A;padding:14px 18px"><span class="btn y" style="display:block;text-align:center;font-size:16px;padding:14px">Faire le test · 5 min</span></div>
  <div class="note" style="left:110px;top:1380px">Barre d'action collante en bas de l'écran sur mobile</div>
</div>"""

ARTICLES = [
    ("Article 1 · Organisateur", "Le jeu est organisé par Navigoal (raison sociale, adresse et numéro d'immatriculation à compléter)."),
    ("Article 2 · Dates", "Du lundi 1er février 2027 à 00 h au dimanche 21 février 2027 à 23 h 59, heure de Libreville. Tirage au sort le mercredi 24 février 2027 en direct."),
    ("Article 3 · Participants", "Ouvert aux élèves et étudiants résidant au Gabon, âgés de 18 ans ou plus, ou mineurs avec autorisation écrite d'un parent. Une participation par personne."),
    ("Article 4 · Comment participer", "1. Faire le test d'orientation sur navigoal.net. 2. Créer un compte élève ou étudiant. 3. Partager son profil avec #TrouveTaVoie. Le partage est facultatif si le participant n'a pas accès aux réseaux sociaux : la création du compte suffit."),
    ("Article 5 · Dotation", "Un « pack départ » : frais de candidature pris en charge, accompagnement personnalisé par un conseiller, ordinateur portable (valeur et modèle à préciser)."),
    ("Article 6 · Tirage et annonce", "Tirage parmi les comptes valides, sous contrôle d'un témoin. Le gagnant est prévenu par e-mail et WhatsApp et annoncé avec son accord."),
    ("Article 7 · Données personnelles", "Les données servent uniquement à la gestion du jeu et du compte Navigoal (voir la politique de confidentialité)."),
]
articles = "".join(f"""<div style="padding:22px 0;border-bottom:1px solid #e6eaf3"><h3 style="font-size:19px;font-weight:800">{t}</h3><p style="font-size:16px;line-height:1.65;color:#3b4566;margin-top:8px">{d}</p></div>""" for t, d in ARTICLES)

REGLEMENT = f"""
<div class="frame" style="width:1440px" data-name="Campagne · Règlement du jeu #TrouveTaVoie">
  {HEADER}
  <div style="background:#FFE14D;border-bottom:3px solid #0A0A0A;padding:56px 64px"><p class="kicker" style="color:#0A0A0A">Jeu-concours</p><p class="anton" style="font-size:96px;line-height:110px;color:#0A0A0A;margin-top:18px">RÈGLEMENT DU JEU #TROUVETAVOIE</p><p style="font-weight:700;font-size:18px;margin-top:14px">Du 1er au 21 février 2027 · Tirage le 24 février</p></div>
  <div style="padding:40px 64px 80px;width:980px">{articles}</div>
  <div class="note" style="left:1100px;top:330px">Texte provisoire : à faire relire juridiquement avant publication</div>
</div>"""

SOURCES = [("lycee-lm", "Lycée (QR code)", 31), ("whatsapp", "Chaîne WhatsApp", 18), ("parrain", "Parrainage", 14), ("google", "Google", 9), ("tiktok", "TikTok", 6), ("fb", "Facebook", 5), ("direct", "Accès direct", 4)]
maxs = max(n for _, _, n in SOURCES)
src_rows = "".join(f"""<div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid #eef1f7"><p style="width:180px;font-weight:600;font-size:15px">{l}</p><div style="flex:1;height:14px;background:#eef1f7;border-radius:7px"><div style="width:{n / maxs * 100:.0f}%;height:14px;background:#1a47f5;border-radius:7px"></div></div><p style="width:40px;text-align:right;font-weight:800">{n}</p></div>""" for _, l, n in SOURCES)

PARRAINAGE = f"""
<div class="frame" style="width:1440px;background:#f6f8fe;padding:56px 64px;display:flex;gap:40px" data-name="Campagne · Parrainage (espace étudiant) et sources d'inscription (admin)">
  <div style="width:560px">
    <p class="kicker">Espace étudiant · tableau de bord</p>
    <div style="margin-top:16px;background:#1A47F5;border:3px solid #0A0A0A;border-radius:22px;box-shadow:8px 8px 0 #0A0A0A;padding:30px;color:#fff">
      <p class="anton" style="font-size:44px">PARRAINE 2 AMIS</p>
      <p style="font-size:16px;line-height:1.55;color:#dae6ff;margin-top:10px">Avec 2 amis inscrits grâce à ton code, tu obtiens un entretien prioritaire avec un conseiller Navigoal.</p>
      <div style="margin-top:20px;background:#fff;border-radius:14px;padding:16px 20px;display:flex;align-items:center"><p style="flex:1;color:#0A0A0A;font-weight:800;font-size:24px;letter-spacing:2px">DIMI-7K3Q</p><span style="font-weight:800;color:#1a47f5">Copier le lien</span></div>
      <div style="margin-top:16px;display:flex;gap:12px"><span class="chip y" style="font-size:14px">Partager sur WhatsApp</span><span class="chip w" style="font-size:14px">Envoyer par SMS</span></div>
      <div style="margin-top:22px;display:flex;align-items:center;gap:12px"><div style="flex:1;height:12px;background:rgba(255,255,255,.25);border-radius:6px"><div style="width:50%;height:12px;background:#FFE14D;border-radius:6px"></div></div><p style="font-weight:800">1 / 2 amis inscrits</p></div>
    </div>
    <div class="note" style="position:relative;margin-top:24px">Le lien partagé est navigoal.net/inscription?ref=DIMI-7K3Q. L'ami inscrit est rattaché au parrain ; la barre se remplit, puis l'entretien prioritaire apparaît dans l'espace.</div>
  </div>
  <div style="flex:1">
    <p class="kicker">Administration · Campagne</p>
    <div class="card" style="margin-top:16px;padding:30px">
      <div style="display:flex;align-items:baseline"><h3 style="font-size:24px;font-weight:800;flex:1">Inscriptions par source</h3><p style="font-weight:700;color:#3b4566">Campagne trouvetavoie · depuis le 1er déc.</p></div>
      <div style="display:flex;gap:16px;margin-top:20px">
        <div style="flex:1;background:#f3f7ff;border-radius:16px;padding:18px"><p style="font-size:13px;font-weight:700;color:#6b7493">Comptes créés</p><p class="anton" style="font-size:44px;margin-top:6px">87</p><p style="font-size:13px;color:#3b4566">objectif 200 au 1er mars</p></div>
        <div style="flex:1;background:#f3f7ff;border-radius:16px;padding:18px"><p style="font-size:13px;font-weight:700;color:#6b7493">Tests terminés</p><p class="anton" style="font-size:44px;margin-top:6px">341</p></div>
        <div style="flex:1;background:#f3f7ff;border-radius:16px;padding:18px"><p style="font-size:13px;font-weight:700;color:#6b7493">Comptes parents</p><p class="anton" style="font-size:44px;margin-top:6px">29</p></div>
      </div>
      <div style="margin-top:20px">{src_rows}</div>
      <p style="font-size:13px;color:#6b7493;margin-top:14px">Chiffres fictifs pour la maquette. Source = utm_source du premier lien suivi, ou « parrain » si un code ref a été utilisé. Export CSV.</p>
    </div>
  </div>
</div>"""

html = f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Navigoal · maquettes campagne Trouve ta voie</title><style>{CSS}</style></head><body>{LANDING_DESKTOP}{LANDING_MOBILE}{REGLEMENT}{PARRAINAGE}</body></html>"
open(os.path.join(OUT, "campagne.html"), "w", encoding="utf-8").write(html)
print(os.path.join(OUT, "campagne.html"), len(html))
