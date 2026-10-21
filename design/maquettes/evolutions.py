#!/usr/bin/env python3
"""Maquettes des évolutions après l'audit fonctionnel (octobre 2026), importées dans Figma via html_to_figma.

1. Test d'orientation : réponse oubliée signalée (mobile)
2. Réservation : résumé du logement quand l'annonce est retirée (ordinateur)
3. Bouton « Conseiller sur WhatsApp » (mobile)
4. Page « Parents » : coût en F CFA, suivi, paiement, garant (ordinateur et mobile)
5. Paiement : Airtel Money et Moov Money nommés, montant en F CFA (mobile)

Usage : python3 design/maquettes/evolutions.py   → design/maquettes/out/evolutions.html (cadres .frame)
"""
import base64
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = os.path.join(ROOT, "web")
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


JAKARTA = b64(os.path.join(WEB, "node_modules", "@fontsource-variable", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-wght-normal.woff2"), "font/woff2")
WORDMARK = b64(os.path.join(WEB, "public", "brand", "navigoal-wordmark-ui.png"), "image/png")
MARK = b64(os.path.join(WEB, "public", "brand", "navigoal-mark-96.png"), "image/png")
ORIENT = {k: b64(os.path.join(WEB, "public", "images", "orientation", f"{k}.webp"), "image/webp") for k in ("9429550", "11679118", "3880749", "19915770")}
LOGEMENT = b64(os.path.join(WEB, "public", "photos", "villes", "rabat.jpg"), "image/jpeg")
PARENT = b64(os.path.join(WEB, "public", "images", "etudiante-840.webp"), "image/webp")

# Coûts : référentiel couts_etudes (MAD) au taux indicatif, comme la page de campagne.
REF = json.load(open(os.path.join(ROOT, "data", "referentiels", "couts_etudes.json")))
MA = next(i for i in REF["items"] if i["id"] == "MA")
T = REF["_meta"]["taux_change_indicatifs"]
XAF = T["XAF"] / T["MAD"]


def fcfa(mad):
    v = mad * XAF
    return f"{v / 1e6:.1f}".replace(".", ",") + " M" if v >= 1e6 else f"{round(v, -3):,.0f}".replace(",", " ")


S, V = MA["scolarite_annuelle"], MA["vie_mensuelle"]
INSTALL = (sum(p["min"] for p in MA["installation"]), sum(p["max"] for p in MA["installation"]))
FRAIS_MAD = 500  # frais de candidature de la formation de démonstration (ESA)

CSS = f"""
@font-face {{ font-family: 'Plus Jakarta Sans'; src: url({JAKARTA}) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #e9edf5; font-family: 'Plus Jakarta Sans', sans-serif; color: #0b1533; }}
.frame {{ position: relative; overflow: hidden; background: #f6f8fe; margin: 40px; }}
p, h1, h2, h3 {{ margin: 0; }}
.card {{ border-radius: 22px; border: 1px solid #e6eaf3; box-shadow: 0 1px 2px rgba(11,21,51,.04), 0 8px 24px -8px rgba(11,21,51,.10); background: #fff; }}
.chip {{ display: inline-block; border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 700; }}
.btn {{ display: inline-block; border-radius: 14px; padding: 13px 20px; font-weight: 800; font-size: 15px; text-align: center; }}
.primary {{ background: #1A47F5; color: #fff; }} .sun {{ background: #ffc21f; color: #0b1533; }} .ghost {{ border: 1px solid #d6dcea; background: #fff; color: #1a47f5; }}
.wa {{ background: #25D366; color: #0b1533; }}
.kicker {{ font-weight: 800; font-size: 13px; letter-spacing: 2px; color: #1a47f5; text-transform: uppercase; }}
.mute {{ color: #6b7493; }} .soft {{ color: #3b4566; }}
.phone {{ position: relative; width: 390px; height: 844px; overflow: hidden; background: #f6f8fe; flex: none; box-shadow: 0 0 0 1px #d6dcea; }}
.mob {{ width: fit-content; display: flex; gap: 24px; padding: 24px; background: #e9edf5; align-items: flex-start; }}
.side {{ display: flex; flex-direction: column; gap: 12px; width: 260px; }}
.side .note {{ position: static; max-width: none; }}
.note {{ position: absolute; background: #ff4fa3; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 8px; max-width: 250px; line-height: 1.35; z-index: 5; }}
.topm {{ height: 64px; display: flex; align-items: center; padding: 0 16px; gap: 10px; background: #fff; border-bottom: 1px solid #e6eaf3; }}
.topm .sp {{ flex: 1; }} .ico {{ width: 40px; height: 40px; border-radius: 12px; background: #f3f5fb; }}
.av {{ width: 36px; height: 36px; border-radius: 50%; background: #ffc21f; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }}
.tabbar {{ position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: #fff; border-top: 1px solid #e6eaf3; display: flex; justify-content: space-around; align-items: center; font-size: 11px; font-weight: 700; color: #6b7493; }}
.header {{ height: 72px; display: flex; align-items: center; padding: 0 64px; gap: 28px; border-bottom: 1px solid #e6eaf3; background: #fff; }}
.header nav {{ display: flex; gap: 22px; font-size: 14px; font-weight: 600; color: #3b4566; }}
.header .sp {{ flex: 1; }}
"""

TOPM = f"""<div class="topm"><img src="{MARK}" style="height:32px"><span class="sp"></span><span class="ico"></span><span class="ico"></span><span class="av">AM</span></div>"""
TABBAR = """<div class="tabbar"><span>Accueil</span><span style="color:#1a47f5">Orientation</span><span>Candidatures</span><span>Messages</span><span>Menu</span></div>"""


def mobile(nom, contenu, notes):
    """Écran de téléphone (390 × 844) avec les notes de comportement à côté, hors de l'écran."""
    side = "".join(f'<div class="note">{n}</div>' for n in notes)
    return f"""<div class="frame mob" data-name="{nom}"><div class="phone">{contenu}</div><div class="side">{side}</div></div>"""


APPHEADER = f"""<div class="header"><img src="{WORDMARK}" style="height:27px"><span style="font-size:13px;font-weight:700;background:#eaf0ff;color:#1a47f5;border-radius:999px;padding:4px 10px">Espace étudiant</span><span class="sp"></span><span class="ico"></span><span class="av">AM</span><span style="font-weight:700;font-size:14px">Amina</span></div>"""
HEADER = f"""<div class="header"><img src="{WORDMARK}" style="height:27px"><nav><span>Métiers</span><span>Formations</span><span>Établissements</span><span>Orientation</span><span>Navilease</span><span style="color:#1a47f5">Parents</span></nav><span class="sp"></span><span class="btn ghost" style="padding:9px 16px;font-size:14px">Se connecter</span><span class="btn sun" style="padding:9px 16px;font-size:14px">Créer un compte</span></div>"""

# 1. Test d'orientation ---------------------------------------------------------------------------
dots = "".join(f"""<span style="flex:1;height:8px;border-radius:4px;background:{'#ff8a3d' if i == 3 else '#1a47f5'}"></span>""" for i in range(10))
choix = [("Un match ou une randonnée", "9429550", True), ("Un atelier créatif ou un concert", "3880749", False), ("Organiser un événement associatif", "19915770", False), ("Un documentaire ou un jeu de logique", "11679118", False)]
cartes = "".join(f"""<div style="border-radius:16px;border:{'2px solid #1a47f5' if sel else '1px solid #e6eaf3'};background:#fff;overflow:hidden"><img src="{ORIENT[k]}" style="width:100%;height:96px;object-fit:cover;display:block"><p style="padding:8px 10px;font-size:13px;font-weight:700;line-height:1.3">{t}</p></div>""" for t, k, sel in choix)
TEST = mobile("Évolution · Test d'orientation : réponse oubliée (mobile)", f"""
  {TOPM}
  <div style="padding:18px 16px">
    <p style="font-size:22px;font-weight:800">Test d'orientation</p>
    <div class="card" style="margin-top:14px;padding:16px">
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>Question 10 sur 10</span><span class="mute">9 réponses sur 10</span></div>
      <div style="display:flex;gap:4px;margin-top:10px">{dots}</div>
      <p style="font-size:19px;font-weight:800;margin-top:16px">Un week-end idéal, c'est…</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">{cartes}</div>
      <div style="margin-top:14px;border-radius:14px;background:#fff4e8;border:1px solid #ffd2ad;padding:12px 14px;display:flex;gap:10px;align-items:center">
        <p style="flex:1;font-size:13px;font-weight:600;color:#8a4b00;line-height:1.4">Il te manque une réponse : <b>question 4</b> (tes matières préférées).</p>
        <span class="btn" style="background:#ff8a3d;color:#fff;padding:9px 12px;font-size:13px">Y aller</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:14px"><span class="btn ghost" style="flex:1">← Précédent</span><span class="btn sun" style="flex:1.4;opacity:.45">Voir mon profil</span></div>
    </div>
  </div>
  {TABBAR}
""", [
    'Pastilles visibles aussi sur mobile ; la question sans réponse est en orange et cliquable',
    "Le bandeau n'apparaît qu'à la dernière question s'il manque des réponses ; « Y aller » ouvre la question oubliée, puis revient à la fin",
])

# 2. Réservation : annonce retirée ----------------------------------------------------------------
etapes = [("Demande envoyée", True), ("Acceptée par le bailleur", True), ("Paiement protégé", True), ("Contrat signé", True), ("Entrée dans le logement", False)]
frise = "".join(f"""<div style="display:flex;align-items:center;gap:10px;padding:8px 0"><span style="width:22px;height:22px;border-radius:50%;background:{'#0f8a46' if ok else '#e6eaf3'};color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;font-weight:800">{'✓' if ok else ''}</span><span style="font-size:14px;font-weight:{700 if ok else 500}" class="{'' if ok else 'mute'}">{t}</span></div>""" for t, ok in etapes)
RESERVATION = f"""
<div class="frame" style="width:1440px;height:760px" data-name="Évolution · Réservation : résumé du logement (annonce retirée)">
  {APPHEADER}
  <div style="padding:36px 64px;display:flex;gap:28px">
    <div style="flex:1">
      <p class="mute" style="font-size:13px;font-weight:600">Mes réservations › NL-2026-00012</p>
      <p style="font-size:30px;font-weight:800;margin-top:6px">Réservation NL-2026-00012</p>
      <div class="card" style="margin-top:20px;overflow:hidden;display:flex">
        <img src="{LOGEMENT}" style="width:340px;height:250px;object-fit:cover">
        <div style="padding:24px;flex:1">
          <span class="chip" style="background:#fff4e8;color:#8a4b00">Annonce retirée par le bailleur</span>
          <p style="font-size:22px;font-weight:800;margin-top:12px">Studio meublé proche de l'ESA</p>
          <p class="soft" style="margin-top:4px">Rabat · Agdal · 22 m² · meublé · wifi, eau et électricité incluses</p>
          <div style="display:flex;gap:28px;margin-top:18px">
            <div><p class="mute" style="font-size:12px;font-weight:700">Loyer</p><p style="font-weight:800;font-size:18px">2 700 MAD<span class="mute" style="font-size:13px;font-weight:600"> · ≈ {fcfa(2700)} F CFA</span></p></div>
            <div><p class="mute" style="font-size:12px;font-weight:700">Entrée</p><p style="font-weight:800;font-size:18px">1er septembre 2027</p></div>
            <div><p class="mute" style="font-size:12px;font-weight:700">Durée</p><p style="font-weight:800;font-size:18px">9 mois</p></div>
          </div>
          <p class="soft" style="margin-top:16px;font-size:14px;line-height:1.5;background:#f3f7ff;border-radius:12px;padding:10px 14px">L'annonce n'est plus visible dans la recherche, mais <b>ta réservation reste valable</b> : adresse, contrat et paiements restent ici.</p>
        </div>
      </div>
      <div class="card" style="margin-top:18px;padding:20px 24px;display:flex;gap:40px">
        <div><p class="mute" style="font-size:12px;font-weight:700">Adresse (révélée après paiement)</p><p style="font-weight:700;margin-top:4px">12, rue Oued Fès, Agdal, Rabat</p></div>
        <div><p class="mute" style="font-size:12px;font-weight:700">Bailleur</p><p style="font-weight:700;margin-top:4px">Karim A. · identité vérifiée</p></div>
        <span style="flex:1"></span><span class="btn ghost" style="align-self:center;white-space:nowrap">Contrat (PDF)</span><span class="btn primary" style="align-self:center;white-space:nowrap">Écrire au bailleur</span>
      </div>
    </div>
    <div style="width:340px"><div class="card" style="padding:22px"><p style="font-weight:800;font-size:17px">Suivi</p><div style="margin-top:10px">{frise}</div></div></div>
  </div>
  <div class="note" style="left:1100px;top:420px">Avant : le lien menait à « Logement introuvable ». Le résumé est désormais enregistré avec la réservation et affiché même si l'annonce est archivée</div>
</div>"""

# 3. Bouton WhatsApp -------------------------------------------------------------------------------
WHATSAPP = mobile("Évolution · Bouton Conseiller sur WhatsApp (mobile)", f"""
  <div class="topm"><img src="{WORDMARK}" style="height:24px"><span class="sp"></span><span class="ico"></span><span class="ico"></span></div>
  <div style="padding:22px 16px">
    <p class="kicker">Formation</p>
    <p style="font-size:24px;font-weight:800;margin-top:6px;line-height:1.25">Bachelor Commerce et Gestion des Entreprises</p>
    <p class="soft" style="margin-top:6px">ESA · Casablanca · 3 ans · reconnu par l'État</p>
    <div class="card" style="margin-top:18px;padding:16px"><p class="mute" style="font-size:12px;font-weight:700">Scolarité</p><p style="font-weight:800;font-size:18px">60 000 à 75 000 MAD / an</p><p class="soft" style="font-size:13px">≈ {fcfa(60000)} à {fcfa(75000)} F CFA</p></div>
    <div class="card" style="margin-top:12px;padding:16px;height:220px"><p style="font-weight:800">Admission</p><p class="soft" style="font-size:14px;margin-top:6px;line-height:1.5">Bac toutes séries, dossier et entretien. Candidature en ligne sur Navigoal, réponse sous 3 semaines.</p></div>
  </div>
  <div style="position:absolute;left:16px;right:16px;bottom:24px;display:flex;gap:10px;align-items:center">
    <span class="btn primary" style="flex:1">Candidater</span>
    <span class="btn wa" style="display:flex;gap:8px;align-items:center;padding:13px 16px">Une question ?</span>
  </div>
""", [
    "Ouvre WhatsApp avec un message prérempli : « Bonjour, j'ai une question sur [formation] (navigoal.net/…) ». Numéro du conseiller à fournir",
    'Présent sur les fiches formation, établissement, devis et la page Parents ; pas dans les espaces connectés (messagerie intégrée)',
])

# 4. Page Parents -----------------------------------------------------------------------------------
tuiles = [
    ("Scolarité par an", f"{fcfa(S['institut']['min'])} à {fcfa(S['ecole_commerce']['max'])}", "selon l'école (institut → école de commerce)"),
    ("Vie sur place par mois", f"{fcfa(V['autre_ville']['min'])} à {fcfa(V['ville_chere']['max'])}", "logement, repas, transport"),
    ("Installation (une fois)", f"{fcfa(INSTALL[0])} à {fcfa(INSTALL[1])}", "caution, carte de séjour, assurance, équipement"),
]
tuiles_html = "".join(f"""<div class="card" style="flex:1;padding:22px"><p class="mute" style="font-size:13px;font-weight:700">{a}</p><p style="font-size:26px;font-weight:800;margin-top:6px">{b} <span style="font-size:15px">F CFA</span></p><p class="soft" style="font-size:13px;margin-top:4px">{c}</p></div>""" for a, b, c in tuiles)
peut = [
    ("Suivre chaque candidature", "Statut, pièces demandées, réponse de l'école : vous êtes prévenu en même temps que votre enfant."),
    ("Payer en Airtel Money ou Moov Money", "Frais de dossier et réservation du logement, en F CFA, avec reçu. Les sommes du logement restent bloquées jusqu'à l'entrée."),
    ("Valider le logement comme garant", "Votre accord est demandé avant toute réservation d'un mineur ; adresse et contrat visibles après paiement."),
    ("Parler à un conseiller", "Au téléphone ou sur WhatsApp, pour comparer les écoles, le budget et les démarches."),
]
peut_html = "".join(f"""<div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid #eef1f7"><span style="width:34px;height:34px;flex:none;border-radius:10px;background:#eaf0ff;color:#1a47f5;font-weight:800;display:flex;align-items:center;justify-content:center">{i + 1}</span><div><p style="font-weight:800">{t}</p><p class="soft" style="font-size:14px;margin-top:3px;line-height:1.5">{d}</p></div></div>""" for i, (t, d) in enumerate(peut))
faq = ["Les diplômes sont-ils reconnus ?", "Faut-il un visa pour le Maroc ?", "Mon enfant est mineur : comment ça marche ?", "Que se passe-t-il si l'école refuse le dossier ?"]
faq_html = "".join(f"""<div style="padding:14px 0;border-bottom:1px solid #eef1f7;display:flex"><p style="flex:1;font-weight:700">{q}</p><span class="mute">+</span></div>""" for q in faq)
PARENTS = f"""
<div class="frame" style="width:1440px" data-name="Évolution · Page Parents (ordinateur)">
  {HEADER}
  <div style="display:flex;gap:40px;padding:64px 64px 40px;background:linear-gradient(135deg,#0b1f6b,#1a47f5);color:#fff;position:relative">
    <div style="flex:1;max-width:720px">
      <p class="kicker" style="color:#ffc21f">Parents et tuteurs</p>
      <p style="font-size:52px;font-weight:800;line-height:1.1;margin-top:14px">Votre enfant étudie au Maroc. Vous gardez la main.</p>
      <p style="font-size:18px;line-height:1.6;color:#dae6ff;margin-top:16px">Budget réel en F CFA, écoles reconnues par l'État, suivi des candidatures et paiement sécurisé en mobile money, depuis Libreville.</p>
      <div style="display:flex;gap:12px;margin-top:26px"><span class="btn sun">Créer mon compte parent</span><span class="btn wa">Parler à un conseiller</span></div>
      <p style="font-size:13px;color:#b9c8ff;margin-top:14px">Gratuit · votre enfant vous invite depuis son espace, ou vous l'invitez avec son numéro</p>
    </div>
    <img src="{PARENT}" style="width:380px;position:absolute;right:80px;bottom:0">
  </div>
  <div style="padding:48px 64px 20px"><p style="font-size:28px;font-weight:800">Combien ça coûte vraiment ?</p><p class="soft" style="margin-top:6px">Fourchettes indicatives au taux de {T['MAD']} MAD pour 1 € (1 € = 655,957 F CFA). Le devis détaillé se fait école par école.</p>
    <div style="display:flex;gap:18px;margin-top:20px">{tuiles_html}</div>
    <span class="btn ghost" style="margin-top:18px">Faire un devis détaillé</span></div>
  <div style="display:flex;gap:40px;padding:36px 64px 64px">
    <div style="flex:1.2"><p style="font-size:28px;font-weight:800">Ce que vous pouvez faire</p><div style="margin-top:10px">{peut_html}</div></div>
    <div style="flex:1"><p style="font-size:28px;font-weight:800">Vos questions</p><div style="margin-top:10px">{faq_html}</div></div>
  </div>
  <div class="note" style="left:300px;top:772px">Montants calculés depuis le référentiel des coûts, comme le devis</div>
  <div class="note" style="left:1100px;top:560px">« Payer en Airtel Money ou Moov Money » : à afficher seulement une fois l'agrégateur de paiement choisi</div>
</div>"""

PARENTS_M = mobile("Évolution · Page Parents (mobile)", f"""
  <div class="topm"><img src="{WORDMARK}" style="height:24px"><span class="sp"></span><span class="ico"></span><span class="ico"></span></div>
  <div style="padding:28px 16px 0;background:linear-gradient(135deg,#0b1f6b,#1a47f5);color:#fff;height:430px;position:relative;overflow:hidden">
    <p class="kicker" style="color:#ffc21f">Parents et tuteurs</p>
    <p style="font-size:30px;font-weight:800;line-height:1.15;margin-top:10px">Votre enfant étudie au Maroc. Vous gardez la main.</p>
    <p style="font-size:15px;line-height:1.55;color:#dae6ff;margin-top:12px">Budget en F CFA, écoles reconnues, suivi des candidatures, paiement en mobile money.</p>
    <img src="{PARENT}" style="width:200px;position:absolute;right:-10px;bottom:0">
  </div>
  <div style="padding:18px 16px;display:flex;flex-direction:column;gap:10px">{"".join(f'<div class="card" style="padding:14px 16px"><p class="mute" style="font-size:12px;font-weight:700">{t}</p><p style="font-size:20px;font-weight:800">{v} F CFA</p></div>' for t, v, _ in tuiles)}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e6eaf3;padding:12px 16px;display:flex;gap:10px"><span class="btn sun" style="flex:1">Créer mon compte</span><span class="btn wa">WhatsApp</span></div>
""", [
    "Barre d'action collante en bas, comme la page de campagne",
])

# 5. Paiement ------------------------------------------------------------------------------------------
moyens = [("Airtel Money", "#e40000", "#fff", "Code de confirmation sur ton téléphone", True), ("Moov Money", "#0057b8", "#fff", "Code de confirmation sur ton téléphone", False), ("Carte bancaire", "#0b1533", "#fff", "Visa, Mastercard", False), ("Virement", "#e6eaf3", "#0b1533", "Délai 2 à 3 jours", False)]
moyens_html = "".join(f"""<div style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:{'2px solid #1a47f5' if sel else '1px solid #e6eaf3'};background:#fff;margin-top:10px"><span style="width:44px;height:44px;border-radius:12px;background:{bg};color:{fg};font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1">{n.split()[0]}</span><div style="flex:1"><p style="font-weight:800">{n}</p><p class="mute" style="font-size:12px">{d}</p></div><span style="width:20px;height:20px;border-radius:50%;border:{'6px solid #1a47f5' if sel else '2px solid #c5cde0'}"></span></div>""" for n, bg, fg, d, sel in moyens)
PAIEMENT = mobile("Évolution · Paiement : Airtel Money et Moov Money (mobile)", f"""
  <div class="topm"><img src="{WORDMARK}" style="height:24px"><span class="sp"></span></div>
  <div style="padding:20px 16px">
    <p class="mute" style="font-size:13px;font-weight:700">Frais de candidature · ESA Casablanca</p>
    <div class="card" style="margin-top:10px;padding:18px"><p style="font-size:30px;font-weight:800">{fcfa(FRAIS_MAD)} F CFA</p><p class="soft" style="font-size:13px;margin-top:2px">soit {FRAIS_MAD} MAD versés à l'école · frais de service inclus</p></div>
    <p style="font-weight:800;margin-top:20px">Payer avec</p>
    {moyens_html}
    <div style="margin-top:12px;border-radius:12px;background:#f3f7ff;padding:12px;font-size:13px" class="soft">Numéro Airtel Money : <b style="color:#0b1533">+241 07 00 00 01</b> · <span style="color:#1a47f5;font-weight:700">modifier</span></div>
    <span class="btn primary" style="display:block;margin-top:16px">Payer {fcfa(FRAIS_MAD)} F CFA</span>
    <p class="mute" style="font-size:12px;text-align:center;margin-top:10px">Paiement sécurisé · reçu par e-mail et dans ton espace</p>
  </div>
""", [
    "Montant affiché d'abord en F CFA pour un payeur au Gabon ; le montant en dirhams reste visible",
    "Liste selon le pays du payeur (Gabon : Airtel, Moov) ; dépend de l'agrégateur retenu",
])

html = f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Navigoal · évolutions après l'audit</title><style>{CSS}</style></head><body>{TEST}{RESERVATION}{WHATSAPP}{PARENTS}{PARENTS_M}{PAIEMENT}</body></html>"
open(os.path.join(OUT, "evolutions.html"), "w", encoding="utf-8").write(html)
print(os.path.join(OUT, "evolutions.html"), f"{len(html) / 1e6:.1f} Mo")
