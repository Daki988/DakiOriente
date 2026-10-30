#!/usr/bin/env python3
"""Maquettes de l'assistant IA Navigoal (octobre 2026), importées dans Figma via html_to_figma (cadres .frame).

1. Bouton et accueil de l'assistant (mobile)
2. Recherche guidée : profil + budget → formations et écoles réelles, coût en F CFA (mobile)
3. Suivi de dossier, utilisateur connecté : statut et action suivante (ordinateur, panneau latéral)
4. Parent : devis express en F CFA puis passage à un conseiller (mobile)
5. Règles de l'assistant : sources, confidentialité, limites (planche de notes)

Usage : python3 design/maquettes/chatbot.py <dossier icônes lucide>  → design/maquettes/out/chatbot.html
"""
import base64
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = os.path.join(ROOT, "web")
OUT = os.path.join(HERE, "out")
ICONS = sys.argv[1] if len(sys.argv) > 1 else "/tmp/icons/node_modules/lucide-static/icons"
os.makedirs(OUT, exist_ok=True)


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def icon(name, size=18, color="currentColor", stroke=2):
    svg = open(os.path.join(ICONS, f"{name}.svg")).read()
    svg = svg.replace('width="24"', f'width="{size}"').replace('height="24"', f'height="{size}"')
    return svg.replace('stroke="currentColor"', f'stroke="{color}"').replace('stroke-width="2"', f'stroke-width="{stroke}"')


JAKARTA = b64(os.path.join(WEB, "node_modules", "@fontsource-variable", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-wght-normal.woff2"), "font/woff2")
MARK = b64(os.path.join(WEB, "public", "brand", "navigoal-mark-96.png"), "image/png")
WORDMARK = b64(os.path.join(WEB, "public", "brand", "navigoal-wordmark-ui.png"), "image/png")
LOGO = {k: b64(os.path.join(ROOT, "assets", "logos", "ma", f), m) for k, f, m in [
    ("uemf", "ma-ueuromed.png", "image/png"), ("uir", "ma-uir.jpg", "image/jpeg"), ("um6ss", "ma-um6ss.png", "image/png")]}

# Coûts réels : référentiel couts_etudes (MAD), convertis en F CFA au taux indicatif + 3 % de prudence (comme le site).
REF = json.load(open(os.path.join(ROOT, "data", "referentiels", "couts_etudes.json")))
MA = next(i for i in REF["items"] if i["id"] == "MA")
T = REF["_meta"]["taux_change_indicatifs"]
XAF = T["XAF"] / T["MAD"] * 1.03
U = MA["scolarite_annuelle"]["universite"]
CHERE, AUTRE = MA["vie_mensuelle"]["ville_chere"], MA["vie_mensuelle"]["autre_ville"]


def m_fcfa(mad):
    return f"{mad * XAF / 1e6:.1f}".replace(".", ",")


def an(vie):
    return U["min"] + vie["min"] * 10, U["max"] + vie["max"] * 10


FES, RABAT = an(AUTRE), an(CHERE)

CSS = f"""
@font-face {{ font-family: 'Plus Jakarta Sans'; src: url({JAKARTA}) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #e9edf5; font-family: 'Plus Jakarta Sans', sans-serif; color: #0b1533; }}
.frame {{ position: relative; overflow: hidden; background: #f6f8fe; margin: 40px; display: inline-block; vertical-align: top; }}
p, h1, h2, h3 {{ margin: 0; }}
.card {{ border-radius: 20px; border: 1px solid #e6eaf3; background: #fff; box-shadow: 0 1px 2px rgba(11,21,51,.04), 0 8px 24px -8px rgba(11,21,51,.10); }}
.chip {{ display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 700; }}
.btn {{ display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; padding: 11px 14px; font-weight: 800; font-size: 14px; }}
.primary {{ background: #1A47F5; color: #fff; }} .ghost {{ border: 1px solid #d6dcea; background: #fff; color: #1a47f5; }} .wa {{ background: #25D366; color: #0b1533; }}
.bot {{ display: flex; gap: 10px; align-items: flex-start; }}
.avatar {{ width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg,#1a47f5,#5b7bff); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.bulle {{ background: #fff; border: 1px solid #e6eaf3; border-radius: 4px 18px 18px 18px; padding: 12px 14px; font-size: 14.5px; line-height: 1.5; }}
.moi {{ margin-left: auto; max-width: 82%; background: #1A47F5; color: #fff; border-radius: 18px 4px 18px 18px; padding: 12px 14px; font-size: 14.5px; line-height: 1.5; }}
.mute {{ color: #5b6478; }} .small {{ font-size: 12px; }}
.lab {{ background: #e8f8ef; color: #0f8a46; font-size: 11px; padding: 4px 9px; }}
.note {{ position: absolute; background: #ff4f9a; color: #fff; font-size: 12px; font-weight: 700; border-radius: 10px; padding: 7px 10px; max-width: 230px; line-height: 1.35; box-shadow: 0 6px 16px rgba(255,79,154,.35); }}
.titre-cadre {{ position: absolute; left: 0; top: -30px; font-size: 14px; font-weight: 800; color: #5b6478; }}
"""


def entete(ferme=True):
    return f"""<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e6eaf3;background:#fff">
  <div class="avatar">{icon('sparkles', 17, '#fff')}</div>
  <div style="flex:1"><b style="font-size:15px">Assistant Navigoal</b><div class="small mute" style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:9px;background:#22c55e;display:inline-block"></span>Répond à partir des données de la plateforme</div></div>
  {icon('x', 20, '#5b6478') if ferme else ''}
</div>"""


def saisie(placeholder="Pose ta question…"):
    return f"""<div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e6eaf3;padding:12px 14px 22px">
  <div style="display:flex;align-items:center;gap:8px;border:1.5px solid #d6dcea;border-radius:14px;padding:10px 12px">
    <span class="mute" style="flex:1;font-size:14.5px">{placeholder}</span>{icon('mic', 18, '#5b6478')}
    <span style="width:34px;height:34px;border-radius:10px;background:#1A47F5;display:flex;align-items:center;justify-content:center">{icon('send', 16, '#fff')}</span>
  </div>
  <p class="small mute" style="margin-top:8px;text-align:center">Réponses générées par une IA à partir des données Navigoal. Vérifie toujours avant de payer.</p>
</div>"""


def bot(html):
    return f"""<div class="bot"><div class="avatar" style="width:28px;height:28px;border-radius:9px">{icon('sparkles', 14, '#fff')}</div><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">{html}</div></div>"""


def ecole(logo, sigle, nom, ville, cout, tag=None, fond="#fff"):
    return f"""<div class="card" style="padding:12px;border-radius:16px;display:flex;gap:10px;align-items:center">
  <img src="{logo}" style="width:38px;height:38px;border-radius:10px;object-fit:contain;background:{fond};border:1px solid #eef1f8;padding:3px">
  <div style="flex:1;min-width:0"><b style="font-size:14px">{sigle}</b> <span class="mute small">· {ville}</span>{f' <span class="chip" style="background:#fff3cc;color:#a55a00;font-size:11px;padding:3px 8px">{tag}</span>' if tag else ''}
    <div class="small mute" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{nom}</div>
    <div style="display:flex;gap:6px;align-items:center;margin-top:5px;white-space:nowrap"><span class="chip lab">Reconnu par l'État</span><b style="font-size:12px;color:#1a47f5">≈ {cout} M F CFA/an</b></div></div>
  {icon('arrow-right', 18, '#1a47f5')}
</div>"""


# ---------------------------------------------------------------- 1. Accueil (mobile)
def accueil():
    chips = [("graduation-cap", "Trouver ma formation"), ("calculator", "Combien ça coûte ?"), ("file-check", "Où en est mon dossier ?"), ("map-pin", "Trouver un logement"), ("scale", "Comparer des écoles")]
    return f"""<div class="frame" style="width:390px;height:844px"><div class="titre-cadre">1 · Accueil de l'assistant (mobile)</div>
  <div style="position:absolute;inset:0;background:#f6f8fe;filter:blur(1px);opacity:.5;padding:18px"><img src="{WORDMARK}" style="height:26px"><div class="card" style="height:220px;margin-top:20px"></div><div class="card" style="height:160px;margin-top:14px"></div></div>
  <div style="position:absolute;inset:0;background:rgba(11,21,51,.35)"></div>
  <div style="position:absolute;left:0;right:0;top:56px;bottom:0;background:#f6f8fe;border-radius:24px 24px 0 0;overflow:hidden">
    {entete()}
    <div style="padding:18px 16px;display:flex;flex-direction:column;gap:14px">
      {bot('<div class="bulle">Bonjour 👋 Je suis l\'assistant de Navigoal. Dis-moi ton projet en une phrase, je te montre directement les formations, les écoles et le budget qui te correspondent.</div>')}
      <p class="small mute" style="font-weight:700;margin:4px 0 0 38px">SUGGESTIONS</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:38px">{''.join(f'<span class="chip ghost" style="border:1px solid #d6dcea;background:#fff;color:#0b1533">{icon(i, 15, "#1a47f5")}{t}</span>' for i, t in chips)}</div>
      <div class="card" style="margin-left:38px;padding:12px 14px;border-radius:14px;display:flex;gap:10px;align-items:center;background:#f0f4ff;border-color:#dbe4ff">{icon('shield-check', 18, '#1a47f5')}<span class="small"><b>Connecte-toi</b> pour que l'assistant suive tes candidatures, tes paiements et ton logement.</span></div>
    </div>
    {saisie("Ex. : bac D, je veux devenir infirmière…")}
  </div>
  <div class="note" style="left:200px;top:8px">Ouvert depuis le bouton flottant présent sur toutes les pages</div>
</div>
<div class="frame" style="width:390px;height:844px"><div class="titre-cadre">1 bis · Bouton flottant (mobile)</div>
  <div style="padding:18px"><img src="{WORDMARK}" style="height:26px">
    <h1 style="font-size:28px;margin-top:26px;line-height:1.2">Licence en sciences infirmières</h1><p class="mute" style="margin-top:8px">6 établissements au Maroc · Licence · 3 ans</p>
    <div class="card" style="height:180px;margin-top:18px"></div><div class="card" style="height:140px;margin-top:14px"></div></div>
  <div style="position:absolute;right:16px;bottom:96px;display:flex;align-items:center;gap:10px">
    <span class="card" style="padding:9px 12px;border-radius:14px;font-size:13px;font-weight:700">Une question sur cette formation ?</span>
    <span style="width:58px;height:58px;border-radius:20px;background:linear-gradient(135deg,#1a47f5,#5b7bff);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 28px -8px rgba(26,71,245,.7)">{icon('sparkles', 26, '#fff')}</span>
  </div>
  <div class="note" style="left:20px;bottom:180px">L'assistant connaît la page ouverte : ici la formation « Licence en sciences infirmières »</div>
</div>"""


# ---------------------------------------------------------------- 2. Recherche guidée (mobile)
def recherche():
    return f"""<div class="frame" style="width:390px;height:1010px"><div class="titre-cadre">2 · Recherche guidée : du projet aux écoles en 1 message</div>
  {entete()}
  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <div class="moi">J'ai un bac D au Gabon, je veux devenir infirmière. Budget : 6 millions F CFA par an.</div>
    {bot(f'''<div class="bulle">Le métier d'<b>infirmier·e</b> passe au Maroc par la <b>Licence en sciences infirmières</b> (3 ans), ouverte avec un bac scientifique comme le tien. 6 universités reconnues par l'État la proposent. Les plus proches de ton budget :</div>
      {ecole(LOGO['uemf'], 'UEMF', "Université Euromed de Fès", 'Fès', f"{m_fcfa(FES[0])} – {m_fcfa(FES[1])}", 'le moins cher', '#0b1533')}
      {ecole(LOGO['uir'], 'UIR', "Université Internationale de Rabat", 'Rabat', f"{m_fcfa(RABAT[0])} – {m_fcfa(RABAT[1])}")}
      {ecole(LOGO['um6ss'], 'UM6SS', "Université Mohammed VI des Sciences de la Santé", 'Casablanca', f"{m_fcfa(RABAT[0])} – {m_fcfa(RABAT[1])}")}
      <div class="bulle" style="background:#fff7dd;border-color:#ffe59a"><b>Ton budget de 6 M F CFA</b> couvre le bas de la fourchette à Fès (scolarité + vie sur place). Les frais exacts sont confirmés par l'école quand tu candidates.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="btn primary">{icon('scale', 16, '#fff')}Comparer les 3</span><span class="btn ghost">{icon('calculator', 16, '#1a47f5')}Devis détaillé</span></div>''')}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:38px">
      <span class="chip" style="background:#eef2ff;color:#1a47f5">Quelles bourses ?</span><span class="chip" style="background:#eef2ff;color:#1a47f5">Logement à Fès</span><span class="chip" style="background:#eef2ff;color:#1a47f5">Faut-il un visa ?</span></div>
  </div>
  {saisie()}
  <div class="note" style="left:60px;top:8px;max-width:270px">Écoles, formation et coûts lus dans la base Navigoal (jamais inventés)</div>
  <div class="note" style="left:60px;top:848px;max-width:300px">Chaque bouton ouvre la page déjà filtrée : le parcours passe de 6 écrans à 1</div>
</div>"""


# ---------------------------------------------------------------- 3. Suivi de dossier (ordinateur)
def suivi():
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">3 · Utilisateur connecté : suivi de dossier et action suivante (ordinateur)</div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:250px;background:#fff;border-right:1px solid #e6eaf3;padding:22px"><img src="{WORDMARK}" style="height:26px">
    {''.join(f'<div style="margin-top:{22 if i == 0 else 8}px;padding:10px 12px;border-radius:12px;font-weight:700;font-size:14px;{"background:#eef2ff;color:#1a47f5" if i == 1 else "color:#5b6478"}">{t}</div>' for i, t in enumerate(["Tableau de bord", "Mes candidatures", "Mon orientation", "Mes documents", "Logement", "Paiements"]))}</div>
  <div style="position:absolute;left:280px;top:30px;right:470px"><h1 style="font-size:28px">Mes candidatures</h1>
    {''.join(f'<div class="card" style="margin-top:16px;padding:18px;display:flex;justify-content:space-between;align-items:center"><div><b>{a}</b><p class="mute small" style="margin-top:4px">{b}</p></div><span class="chip" style="background:{c[0]};color:{c[1]}">{s}</span></div>' for a, b, s, c in [("Licence en sciences infirmières · UIR", "N° NG-2026-00412 · envoyée le 21 oct.", "Pièce demandée", ("#fff3cc", "#a55a00")), ("Licence en sciences infirmières · UEMF", "N° NG-2026-00398 · envoyée le 18 oct.", "En étude", ("#eef2ff", "#1a47f5"))])}</div>
  <div style="position:absolute;right:0;top:0;bottom:0;width:440px;background:#f6f8fe;border-left:1px solid #e6eaf3;box-shadow:-20px 0 40px -20px rgba(11,21,51,.18)">
    {entete()}
    <div style="padding:18px;display:flex;flex-direction:column;gap:12px">
      <div class="moi">Où en est ma candidature à l'UIR ?</div>
      {bot(f'''<div class="bulle">Ta candidature <b>NG-2026-00412</b> (Licence en sciences infirmières, UIR) est en attente d'<b>une pièce</b> : l'école demande ton <b>relevé de notes de terminale</b> (demande du 27 oct.).</div>
        <div class="card" style="padding:14px;border-radius:16px">
          <div style="display:flex;align-items:center;gap:8px"><span class="chip" style="background:#fff3cc;color:#a55a00;font-size:12px">{icon('clock', 13, '#a55a00')}Pièce demandée</span><span class="small mute">il y a 3 jours</span></div>
          <p style="font-size:14px;margin-top:10px">Relevé de notes de terminale (PDF ou photo)</p>
          <span class="btn primary" style="margin-top:12px;width:100%">{icon('upload', 16, '#fff')}Déposer la pièce maintenant</span>
        </div>
        <div class="bulle">Une fois la pièce déposée, l'école reprend l'étude. Ta candidature à l'UEMF est en cours d'étude, rien à faire pour l'instant.</div>''')}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:38px"><span class="chip" style="background:#eef2ff;color:#1a47f5">Écrire à l'école</span><span class="chip" style="background:#eef2ff;color:#1a47f5">Mes paiements</span><span class="chip" style="background:#eef2ff;color:#1a47f5">Logement à Rabat</span></div>
    </div>
    {saisie()}
  </div>
  <div class="note" style="left:640px;top:520px">Connecté : l'assistant ne lit que les données de cet utilisateur (ses candidatures, ses paiements, ses réservations)</div>
  <div class="note" style="left:640px;top:610px">Le bouton mène directement au dépôt de la pièce : 1 clic au lieu de 4</div>
</div>"""


# ---------------------------------------------------------------- 4. Parent (mobile)
def parent():
    tot = (RABAT[0] * 3, RABAT[1] * 3)
    return f"""<div class="frame" style="width:390px;height:1010px"><div class="titre-cadre">4 · Parent : devis express et passage à un conseiller</div>
  {entete()}
  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <div class="moi">Combien me coûteront 3 ans d'études à l'UM6SS, depuis Libreville ?</div>
    {bot(f'''<div class="card" style="padding:14px;border-radius:16px">
        <p class="small mute" style="font-weight:700">ESTIMATION · 3 ANS · UM6SS CASABLANCA</p>
        <p style="font-size:24px;font-weight:800;margin-top:6px">{m_fcfa(tot[0])} – {m_fcfa(tot[1])} M F CFA</p>
        <p class="small mute">soit {f"{tot[0]:,}".replace(",", " ")} – {f"{tot[1]:,}".replace(",", " ")} MAD · scolarité et vie sur place · taux du jour + 3 %</p>
        <span class="btn ghost" style="margin-top:12px;width:100%">{icon('calculator', 16, '#1a47f5')}Voir le devis complet (visa, billets…)</span>
      </div>''')}
    <div class="moi">Je préfère en parler avec quelqu'un.</div>
    {bot(f'''<div class="bulle">Bien sûr. Un conseiller Navigoal vous répond sur WhatsApp, avec le résumé de cette conversation pour ne rien vous faire répéter.</div>
      <span class="btn wa" style="width:100%">{icon('message-circle', 17, '#0b1533')}Continuer sur WhatsApp</span>''')}
  </div>
  {saisie()}
  <div class="note" style="left:60px;top:8px;max-width:280px">Mêmes calculs que la page Devis (montants jamais inventés par l'IA)</div>
  <div class="note" style="left:60px;top:640px;max-width:280px">Passage à un humain à tout moment, ou quand l'assistant n'est pas sûr</div>
</div>"""


# ---------------------------------------------------------------- 5. Règles
def regles():
    blocs = [
        ("Ce que l'assistant sait", ["Catalogue : 103 établissements, formations, métiers, villes, guides", "Coûts et devis (mêmes calculs que le site), conversion dans la monnaie de l'utilisateur", "Utilisateur connecté : ses candidatures, documents demandés, paiements, réservations, rendez-vous"]),
        ("Ce qu'il fait", ["Comprend une demande en langage naturel (français)", "Cherche dans la base Navigoal par des outils dédiés, puis répond", "Propose l'action suivante avec un lien direct vers la bonne page, déjà filtrée"]),
        ("Ce qu'il ne fait jamais", ["Lire les données d'un autre utilisateur", "Payer, candidater ou modifier un dossier à la place de l'utilisateur", "Inventer une école, un frais ou un statut : s'il ne sait pas, il le dit et propose un conseiller"]),
        ("Garde-fous", ["Limite de messages par jour et par utilisateur (coût maîtrisé)", "Conversations non utilisées pour entraîner un modèle", "Mention « Réponse générée par une IA » sur chaque échange"]),
    ]
    return f"""<div class="frame" style="width:1440px;height:620px;padding:40px"><div class="titre-cadre">5 · Règles de l'assistant</div>
  <div style="display:flex;align-items:center;gap:12px"><div class="avatar" style="width:44px;height:44px;border-radius:14px">{icon('sparkles', 22, '#fff')}</div><h1 style="font-size:30px">Assistant Navigoal · règles de fonctionnement</h1></div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:28px">{''.join(f'<div class="card" style="padding:22px"><b style="font-size:17px">{t}</b>{"".join(f"<p style=\'margin-top:12px;font-size:14px;line-height:1.5\'>• {x}</p>" for x in l)}</div>' for t, l in blocs)}</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Assistant IA</title><style>{CSS}</style></head><body>
{accueil()}{recherche()}{parent()}{suivi()}{regles()}
</body></html>"""
open(os.path.join(OUT, "chatbot.html"), "w").write(html)
print("→", os.path.join(OUT, "chatbot.html"), f"({len(html) // 1024} Ko)")
