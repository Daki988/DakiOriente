#!/usr/bin/env python3
"""Maquettes « relais Navigoal » (administrateur) et « Premium établissements » (octobre 2026),
importées dans Figma via html_to_figma (cadres .frame).

Administrateur (relais pendant que écoles et bailleurs prennent la plateforme en main) :
1. Toutes les candidatures, toutes écoles, avec « sans réponse depuis » et « géré par »
2. Fil candidat ↔ école repris par Navigoal : réponse au nom de l'équipe, note interne, décision
3. Messagerie Navilease (bailleurs) et réglage du mode accompagné par école ou bailleur

Établissements Premium :
4. Candidatures reçues : filtres résultats scolaires, projet, capacité de financement
5. Vivier de candidats (profils anonymes, visibles avec leur accord) pour la prospection
6. Campagne de prospection : segment, message, aperçu, statistiques
7. Côté élève : « Mes attentes », visibilité, invitation reçue (mobile)
8. Offre Gratuit / Premium
9. Règles : confidentialité, consentement, traçabilité

Usage : python3 design/maquettes/premium.py <dossier icônes lucide>  → design/maquettes/out/premium.html
"""
import base64
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
WORDMARK = b64(os.path.join(WEB, "public", "brand", "navigoal-wordmark-ui.png"), "image/png")
LOGO = {k: b64(os.path.join(ROOT, "assets", "logos", "ma", f), m) for k, f, m in [
    ("uir", "ma-uir.jpg", "image/jpeg"), ("esa", "ma-esa-casa.png", "image/png"), ("uemf", "ma-ueuromed.png", "image/png"), ("emsi", "ma-emsi.png", "image/png")]}

CSS = f"""
@font-face {{ font-family: 'Plus Jakarta Sans'; src: url({JAKARTA}) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #e9edf5; font-family: 'Plus Jakarta Sans', sans-serif; color: #0b1533; }}
.frame {{ position: relative; overflow: hidden; background: #f6f8fe; margin: 40px; display: inline-block; vertical-align: top; }}
p, h1, h2, h3 {{ margin: 0; }}
.card {{ border-radius: 18px; border: 1px solid #e6eaf3; background: #fff; box-shadow: 0 1px 2px rgba(11,21,51,.04), 0 8px 24px -8px rgba(11,21,51,.10); }}
.chip {{ display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }}
.btn {{ display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 12px; padding: 10px 14px; font-weight: 800; font-size: 14px; white-space: nowrap; }}
.primary {{ background: #1A47F5; color: #fff; }} .ghost {{ border: 1px solid #d6dcea; background: #fff; color: #1a47f5; }} .sun {{ background: #ffc21f; color: #0b1533; }}
.mute {{ color: #5b6478; }} .small {{ font-size: 12px; }}
.b {{ background: #eef2ff; color: #1a47f5; }} .g {{ background: #e8f8ef; color: #0f8a46; }} .y {{ background: #fff3cc; color: #a55a00; }} .r {{ background: #ffecef; color: #d42a50; }} .v {{ background: #f1edff; color: #6a3df0; }} .n {{ background: #eef1f8; color: #3b4566; }}
.prem {{ background: linear-gradient(135deg,#ffd34a,#f9a806); color: #0b1533; }}
.note {{ position: absolute; background: #ff4f9a; color: #fff; font-size: 12px; font-weight: 700; border-radius: 10px; padding: 7px 10px; max-width: 250px; line-height: 1.35; box-shadow: 0 6px 16px rgba(255,79,154,.35); z-index: 5; }}
.titre-cadre {{ position: absolute; left: 0; top: -30px; font-size: 14px; font-weight: 800; color: #5b6478; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
th {{ text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6b7493; font-weight: 800; padding: 10px 12px; border-bottom: 1px solid #e6eaf3; }}
td {{ padding: 12px; border-bottom: 1px solid #eef1f8; vertical-align: middle; }}
.field {{ border: 1.5px solid #d6dcea; border-radius: 12px; padding: 9px 12px; font-size: 13.5px; background: #fff; display: flex; align-items: center; gap: 8px; }}
.label {{ font-size: 12px; font-weight: 800; color: #3b4566; margin-bottom: 6px; }}
.bar {{ height: 6px; border-radius: 9px; background: #e6eaf3; position: relative; }}
"""


def menu(items, actif, titre, badge=None):
    lignes = "".join(
        f'<div style="margin-top:{18 if i == 0 else 4}px;padding:9px 12px;border-radius:11px;font-weight:700;font-size:13.5px;display:flex;align-items:center;gap:9px;{"background:#eef2ff;color:#1a47f5" if t == actif else "color:#5b6478"}">{icon(ic, 16, "#1a47f5" if t == actif else "#6b7493")}{t}{f"<span class=\'chip prem\' style=\'margin-left:auto;padding:2px 7px;font-size:10px\'>PREMIUM</span>" if t in (badge or []) else ""}</div>'
        for i, (ic, t) in enumerate(items))
    return f"""<div style="position:absolute;left:0;top:0;bottom:0;width:240px;background:#fff;border-right:1px solid #e6eaf3;padding:20px 16px">
  <img src="{WORDMARK}" style="height:24px"><p class="small mute" style="margin-top:6px;font-weight:700">{titre}</p>{lignes}</div>"""


ADMIN = [("layout-dashboard", "Tableau de bord"), ("inbox", "Candidatures"), ("messages-square", "Messagerie"), ("building-2", "Établissements"), ("key-round", "Navilease"), ("credit-card", "Paiements"), ("users", "Utilisateurs"), ("scroll-text", "Journal")]
ECOLE = [("layout-dashboard", "Tableau de bord"), ("inbox", "Candidatures"), ("users-round", "Vivier de candidats"), ("megaphone", "Prospection"), ("graduation-cap", "Formations"), ("calendar", "Campagnes"), ("messages-square", "Messagerie"), ("store", "Fiche école")]


def statut(s):
    c = {"Pièce demandée": "r", "En vérification": "y", "En traitement": "v", "Envoyée": "b", "Acceptée": "g", "Dossier complet": "v"}[s]
    return f'<span class="chip {c}">{s}</span>'


# ---------------------------------------------------------------- 1. Admin : toutes les candidatures
def admin_candidatures():
    rows = [
        ("NG-2026-00412", "Amina M.", "GA", "UIR", LOGO["uir"], "Licence sciences infirmières", "Pièce demandée", "5 j", "Navigoal", True),
        ("NG-2026-00431", "Moussa K.", "SN", "ESA", LOGO["esa"], "Bachelor management", "Envoyée", "9 j", "À reprendre", True),
        ("NG-2026-00398", "Grâce O.", "CM", "UEMF", LOGO["uemf"], "Ingénieur informatique", "En traitement", "1 j", "École", False),
        ("NG-2026-00440", "Yann B.", "GA", "EMSI", LOGO["emsi"], "Ingénieur génie civil", "Envoyée", "4 j", "À reprendre", True),
        ("NG-2026-00377", "Fatou D.", "SN", "UIR", LOGO["uir"], "Master finance", "Acceptée", "—", "École", False),
        ("NG-2026-00445", "Kevin N.", "CG", "ESA", LOGO["esa"], "Bachelor marketing digital", "En vérification", "2 j", "Navigoal", False),
    ]
    tr = "".join(f"""<tr><td><b>{n}</b></td><td>{nom} <span class="mute small">· {p}</span></td>
      <td><div style="display:flex;align-items:center;gap:8px"><img src="{lg}" style="width:26px;height:26px;border-radius:7px;object-fit:contain;border:1px solid #eef1f8;background:#fff"><b>{e}</b></div></td>
      <td>{f}</td><td>{statut(s)}</td><td>{f'<b style="color:#d42a50">{d}</b>' if alerte else d}</td>
      <td>{'<span class="chip n">' + icon('building-2', 12, '#3b4566') + 'École</span>' if g == 'École' else '<span class="chip b">' + icon('life-buoy', 12, '#1a47f5') + 'Navigoal (relais)</span>' if g == 'Navigoal' else '<span class="btn ghost" style="padding:6px 10px;font-size:12px">Reprendre</span>'}</td></tr>"""
                 for n, nom, p, e, lg, f, s, d, g, alerte in rows)
    return f"""<div class="frame" style="width:1440px;height:860px"><div class="titre-cadre">1 · Administrateur : toutes les candidatures, toutes écoles</div>
  {menu(ADMIN, "Candidatures", "Back-office Navigoal")}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between"><div><h1 style="font-size:28px">Candidatures</h1><p class="mute" style="margin-top:4px">Toutes les écoles · 1 284 candidatures · 37 sans réponse de l'école depuis plus de 72 h</p></div>
      <span class="btn ghost">{icon('download', 16, '#1a47f5')}Exporter CSV</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">
      {''.join(f'<div class="card" style="padding:16px"><p class="small mute" style="font-weight:700">{a}</p><p style="font-size:26px;font-weight:800;margin-top:4px;color:{c}">{b}</p><p class="small mute">{d}</p></div>' for a, b, c, d in [("SANS RÉPONSE > 72 H", "37", "#d42a50", "à reprendre par l'équipe"), ("GÉRÉES PAR NAVIGOAL", "112", "#1a47f5", "mode accompagné : 9 écoles"), ("PIÈCES EN ATTENTE", "58", "#a55a00", "relance auto. à J+3"), ("DÉLAI MOYEN DE RÉPONSE", "2,4 j", "#0b1533", "objectif : 48 h")])}
    </div>
    <div class="card" style="margin-top:18px;padding:14px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div class="field" style="width:280px">{icon('search', 16, '#6b7493')}<span class="mute">Nom, n° de dossier, e-mail…</span></div>
      <div class="field">Établissement : toutes {icon('chevron-down', 14, '#6b7493')}</div><div class="field">Statut : tous {icon('chevron-down', 14, '#6b7493')}</div>
      <div class="field">Pays : tous {icon('chevron-down', 14, '#6b7493')}</div>
      <span class="chip r" style="padding:8px 12px">{icon('alarm-clock', 13, '#d42a50')}Sans réponse &gt; 72 h</span><span class="chip b" style="padding:8px 12px">Géré par Navigoal</span>
    </div>
    <div class="card" style="margin-top:14px;padding:4px 6px"><table><tr><th>N°</th><th>Candidat</th><th>École</th><th>Formation</th><th>Statut</th><th>Sans réponse</th><th>Géré par</th></tr>{tr}</table></div>
  </div>
  <div class="note" style="left:1080px;top:700px">« Reprendre » : l'équipe Navigoal traite le dossier au nom de l'école, l'école est prévenue et garde la main</div>
  <div class="note" style="left:300px;top:700px">L'admin voit toutes les candidatures et tous les échanges, avec les retards en rouge</div>
</div>"""


# ---------------------------------------------------------------- 2. Admin : fil repris par Navigoal
def bulle(qui, role, texte, heure, cote="g", style="#fff", bord="#e6eaf3", badge=""):
    align = "flex-start" if cote == "g" else "flex-end"
    return f"""<div style="display:flex;flex-direction:column;align-items:{align}">
  <p class="small mute" style="margin-bottom:4px"><b style="color:#0b1533">{qui}</b> · {role} · {heure} {badge}</p>
  <div style="max-width:560px;background:{style};border:1px solid {bord};border-radius:16px;padding:11px 14px;font-size:14px;line-height:1.5">{texte}</div></div>"""


def admin_fil():
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">2 · Administrateur : l'équipe Navigoal reprend l'échange au nom de l'école</div>
  {menu(ADMIN, "Messagerie", "Back-office Navigoal")}
  <div style="position:absolute;left:240px;top:0;bottom:0;width:330px;background:#fff;border-right:1px solid #e6eaf3;padding:18px 14px">
    <div style="display:flex;gap:6px">{''.join(f'<span class="chip {c}">{t}</span>' for t, c in [("Candidatures 214", "b"), ("Navilease 63", "n"), ("Conseil 18", "n")])}</div>
    <div class="field" style="margin-top:12px">{icon('search', 15, '#6b7493')}<span class="mute">Rechercher</span></div>
    {''.join(f'''<div style="margin-top:10px;padding:12px;border-radius:14px;{"background:#eef2ff;border:1px solid #c9d6ff" if i == 0 else "border:1px solid #eef1f8"}">
      <div style="display:flex;justify-content:space-between"><b style="font-size:13.5px">{a}</b><span class="small {"" if not r else ""}" style="color:{"#d42a50" if r else "#6b7493"};font-weight:700">{h}</span></div>
      <p class="small mute" style="margin-top:3px">{b}</p><p class="small" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{c}</p></div>''' for i, (a, b, c, h, r) in enumerate([
        ("Moussa K. ↔ ESA", "Bachelor management · NG-2026-00431", "Bonjour, ma candidature est-elle complète ?", "9 j", True),
        ("Yann B. ↔ EMSI", "Ingénieur génie civil · NG-2026-00440", "Quand commencent les cours ?", "4 j", True),
        ("Amina M. ↔ UIR", "Sciences infirmières · NG-2026-00412", "Navigoal : relevé de notes reçu, merci !", "2 h", False),
        ("Grâce O. ↔ UEMF", "Ingénieur informatique", "UEMF : entretien fixé le 6 novembre", "1 j", False)]))}
  </div>
  <div style="position:absolute;left:570px;right:340px;top:0;bottom:0;display:flex;flex-direction:column">
    <div style="padding:16px 22px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;gap:12px">
      <img src="{LOGO['esa']}" style="width:38px;height:38px;border-radius:10px;object-fit:contain;border:1px solid #eef1f8">
      <div style="flex:1"><b>Moussa K. ↔ ESA Casablanca</b><p class="small mute">Bachelor management · candidature NG-2026-00431 · envoyée le 21 oct.</p></div>
      <span class="chip b">{icon('life-buoy', 12, '#1a47f5')}Repris par Navigoal</span>
    </div>
    <div style="flex:1;padding:20px 22px;display:flex;flex-direction:column;gap:14px">
      {bulle("Moussa K.", "candidat", "Bonjour, j'ai envoyé ma candidature le 21 octobre et payé les frais. Mon dossier est-il complet ? Merci.", "21 oct. 10:12")}
      <div style="align-self:center" class="chip n">{icon('clock', 12, '#3b4566')}Aucune réponse de l'école depuis 9 jours · repris par Fatima (Navigoal) le 30 oct.</div>
      {bulle("Fatima, équipe Navigoal", "pour le compte de l'ESA", "Bonjour Moussa, je suis Fatima de l'équipe Navigoal. Votre dossier est complet et le paiement est confirmé. Je l'ai transmis au service admissions de l'ESA, qui vous répond sous 5 jours ouvrés. Je reste votre contact d'ici là.", "30 oct. 14:05", "d", "#eef2ff", "#c9d6ff", '<span class="chip b" style="padding:2px 7px;font-size:10.5px">NAVIGOAL</span>')}
      {bulle("Note interne", "visible de l'équipe et de l'école uniquement", "Appelé le service admissions ESA (Mme Bennani) : dossiers reçus, comité le 4 nov. Relancer le 5 si pas de décision.", "30 oct. 14:09", "d", "#fff7dd", "#ffe59a", '<span class="chip y" style="padding:2px 7px;font-size:10.5px">NOTE INTERNE</span>')}
    </div>
    <div style="padding:14px 22px;background:#fff;border-top:1px solid #e6eaf3">
      <div style="display:flex;gap:6px;margin-bottom:10px"><span class="chip b">Répondre au candidat</span><span class="chip n">Note interne</span></div>
      <div class="field" style="height:70px;align-items:flex-start"><span class="mute">Votre message (signé « Équipe Navigoal, pour le compte de l'ESA »)…</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px"><span class="small mute">{icon('mail', 13, '#6b7493')} Copie e-mail au candidat et à l'école</span><span class="btn primary">{icon('send', 15, '#fff')}Envoyer</span></div>
    </div>
  </div>
  <div style="position:absolute;right:0;top:0;bottom:0;width:340px;background:#fff;border-left:1px solid #e6eaf3;padding:20px">
    <b style="font-size:15px">Dossier NG-2026-00431</b>
    <div style="margin-top:10px">{statut("Envoyée")} <span class="chip g">Frais payés</span></div>
    <p class="label" style="margin-top:18px">PIÈCES</p>
    {''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0"><span>{d}</span>{icon("circle-check", 16, "#0f8a46")}</div>' for d in ["Pièce d'identité", "Relevés de notes", "Diplôme (bac)", "Photo d'identité"])}
    <p class="label" style="margin-top:16px">AGIR AU NOM DE L'ÉCOLE</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <span class="btn ghost" style="justify-content:flex-start">{icon('file-search', 16, '#1a47f5')}Passer « en vérification »</span>
      <span class="btn ghost" style="justify-content:flex-start">{icon('file-plus', 16, '#1a47f5')}Demander une pièce</span>
      <span class="btn ghost" style="justify-content:flex-start;color:#6b7493">{icon('gavel', 16, '#6b7493')}Décision finale : réservée à l'école</span>
    </div>
    <p class="label" style="margin-top:18px">RELAIS</p>
    <div class="card" style="padding:12px;box-shadow:none;font-size:12.5px;line-height:1.5">L'école est prévenue de chaque action de Navigoal et peut <b>reprendre la main</b> à tout moment. Tout est tracé dans le journal.</div>
    <span class="btn ghost" style="margin-top:10px;width:100%">{icon('undo-2', 16, '#1a47f5')}Rendre le dossier à l'école</span>
  </div>
  <div class="note" style="left:860px;top:480px">Le candidat voit clairement que c'est Navigoal qui répond, jamais une fausse signature de l'école</div>
  <div class="note" style="left:1110px;top:610px">Acceptation ou refus : seulement l'école (Navigoal ne décide pas d'une admission)</div>
</div>"""


# ---------------------------------------------------------------- 3. Admin : Navilease et mode accompagné
def admin_relais():
    ecoles = [("ESA Casablanca", LOGO["esa"], "Accompagné", "37 dossiers · 9 j de délai", True), ("EMSI", LOGO["emsi"], "Accompagné", "12 dossiers · 4 j", True), ("UIR", LOGO["uir"], "Autonome", "délai 1,2 j", False), ("UEMF", LOGO["uemf"], "Autonome", "délai 0,8 j", False)]
    return f"""<div class="frame" style="width:1440px;height:660px"><div class="titre-cadre">3 · Administrateur : bailleurs Navilease et mode accompagné</div>
  {menu(ADMIN, "Navilease", "Back-office Navigoal")}
  <div style="position:absolute;left:270px;top:28px;width:560px">
    <h1 style="font-size:24px">Mode accompagné</h1><p class="mute" style="margin-top:4px;font-size:14px">Navigoal répond aux candidats et locataires à la place des comptes qui ne sont pas encore à l'aise avec la plateforme.</p>
    <div class="card" style="margin-top:16px;padding:6px 16px">
      {''.join(f'''<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eef1f8">
        <img src="{lg}" style="width:34px;height:34px;border-radius:9px;object-fit:contain;border:1px solid #eef1f8"><div style="flex:1"><b style="font-size:14px">{n}</b><p class="small mute">{d}</p></div>
        <span class="chip {"b" if on else "n"}">{m}</span>
        <span style="width:42px;height:24px;border-radius:20px;background:{"#1a47f5" if on else "#d6dcea"};position:relative;display:inline-block"><span style="position:absolute;top:3px;{"right" if on else "left"}:3px;width:18px;height:18px;border-radius:20px;background:#fff"></span></span></div>''' for n, lg, m, d, on in ecoles)}
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0">{icon('key-round', 30, '#6a3df0')}<div style="flex:1"><b style="font-size:14px">Karim A. · bailleur, Casablanca</b><p class="small mute">3 annonces · 2 demandes sans réponse</p></div><span class="chip b">Accompagné</span>
        <span style="width:42px;height:24px;border-radius:20px;background:#1a47f5;position:relative;display:inline-block"><span style="position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:20px;background:#fff"></span></span></div>
    </div>
    <div class="card" style="margin-top:14px;padding:14px 16px;font-size:13px;line-height:1.55;background:#f0f4ff;border-color:#dbe4ff">{icon('info', 15, '#1a47f5')} <b>Bascule automatique proposée</b> quand un compte ne répond pas sous 72 h (candidature) ou 24 h (demande de logement). L'école ou le bailleur reçoit un e-mail et peut refuser.</div>
  </div>
  <div style="position:absolute;left:860px;right:30px;top:28px">
    <h1 style="font-size:24px">Échanges Navilease</h1><p class="mute" style="margin-top:4px;font-size:14px">Tous les fils locataire ↔ bailleur</p>
    {''.join(f'''<div class="card" style="margin-top:12px;padding:14px">
      <div style="display:flex;justify-content:space-between"><b style="font-size:14px">{a}</b><span class="chip {c}">{s}</span></div>
      <p class="small mute" style="margin-top:4px">{b}</p><p style="font-size:13px;margin-top:8px">{t}</p>
      <div style="display:flex;gap:8px;margin-top:10px"><span class="btn ghost" style="padding:7px 10px;font-size:12.5px">Ouvrir le fil</span><span class="btn primary" style="padding:7px 10px;font-size:12.5px">Répondre au nom de Navigoal</span></div></div>''' for a, b, t, s, c in [
        ("Amina M. ↔ Karim A.", "Studio meublé · Maarif · réservation NL-2026-00342", "« Le logement est-il disponible au 1er septembre ? »", "Sans réponse 2 j", "r"),
        ("Moussa K. ↔ Résidence Al Andalous", "Chambre en résidence · Rabat Agdal", "« Puis-je visiter en visio avant de payer ? »", "Sans réponse 1 j", "r"),
        ("Grâce O. ↔ Leila S.", "Colocation · Fès", "Bailleur : « Oui, contrat envoyé. »", "À jour", "g")])}
  </div>
  <div class="note" style="left:300px;top:575px">Interrupteur par école ou par bailleur : Navigoal prend le relais, puis rend la main</div>
</div>"""


# ---------------------------------------------------------------- 4. Établissement Premium : candidatures filtrées
def jauge(v, c="#1a47f5"):
    return f'<div class="bar" style="width:70px;display:inline-block;vertical-align:middle"><span style="position:absolute;left:0;top:0;bottom:0;width:{v}%;border-radius:9px;background:{c}"></span></div>'


def ecole_candidats():
    rows = [
        ("Grâce O.", "CM", "Bac C · 2026", "15,8", "Bien", "Ingénieur logiciel", "Informatique", 92, "Couvert", "g", "Garant vérifié"),
        ("Yann B.", "GA", "Bac D · 2026", "14,2", "Bien", "Data scientist", "Informatique", 81, "Couvert", "g", "Justificatif validé"),
        ("Koffi A.", "CI", "Bac C · 2026", "13,5", "Assez bien", "Ingénieur réseaux", "Informatique", 74, "Partiel", "y", "Bourse demandée"),
        ("Sara E.", "SN", "Bac S1 · 2025", "12,9", "Assez bien", "Chef de projet IT", "Management", 66, "Déclaré", "n", "Non vérifié"),
    ]
    tr = "".join(f"""<tr><td><b>{n}</b> <span class="mute small">· {p}</span><p class="small mute">{bac}</p></td>
      <td><b style="font-size:15px">{moy}</b><span class="mute small">/20</span><p class="small mute">{men}</p></td>
      <td>{proj}<p class="small mute">{dom}</p></td>
      <td>{jauge(sc)} <b style="margin-left:6px">{sc} %</b></td>
      <td><span class="chip {c}">{fin}</span><p class="small mute" style="margin-top:4px">{pr}</p></td>
      <td>{icon('chevron-right', 18, '#6b7493')}</td></tr>""" for n, p, bac, moy, men, proj, dom, sc, fin, c, pr in rows)
    filtre = lambda t, body: f'<div style="margin-top:16px"><p class="label">{t}</p>{body}</div>'
    return f"""<div class="frame" style="width:1440px;height:760px"><div class="titre-cadre">4 · Établissement Premium : candidatures reçues filtrées (résultats, projet, financement)</div>
  {menu(ECOLE, "Candidatures", "Espace établissement · UIR", ["Vivier de candidats", "Prospection"])}
  <div style="position:absolute;left:240px;top:0;bottom:0;width:300px;background:#fff;border-right:1px solid #e6eaf3;padding:20px 18px">
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">Filtres</b><span class="chip prem">{icon('crown', 12, '#0b1533')}Premium</span></div>
    {filtre("RÉSULTATS SCOLAIRES", f'''<p class="small" style="font-weight:700">Moyenne au bac (ou de terminale) : 13 à 20</p>
      <div class="bar" style="margin-top:12px"><span style="position:absolute;left:65%;right:0;top:0;bottom:0;background:#1a47f5;border-radius:9px"></span><span style="position:absolute;left:63%;top:-6px;width:18px;height:18px;border-radius:9px;background:#fff;border:3px solid #1a47f5"></span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px"><span class="chip b">Bac C / S1</span><span class="chip b">Bac D</span><span class="chip n">Mention ≥ Bien</span></div>''')}
    {filtre("PROJET D'ÉTUDES ET PROFESSIONNEL", '''<div class="field">Domaine : Informatique, Data</div><div class="field" style="margin-top:8px">Métier visé : tous</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="chip b">Profil RIASEC compatible</span><span class="chip n">Rentrée 2027</span></div>''')}
    {filtre("CAPACITÉ DE FINANCEMENT", f'''<div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
      {"".join(f'<label style="display:flex;gap:8px;align-items:center">{icon("square-check" if on else "square", 17, "#1a47f5" if on else "#9aa3b8")}{t}</label>' for t, on in [("Budget ≥ frais de la formation", True), ("Garant (parent) identifié", True), ("Justificatif de ressources validé", False), ("Bourse ou prêt demandé", False)])}</div>''')}
    <span class="btn primary" style="margin-top:22px;width:100%">Appliquer · 24 candidats</span>
    <span class="btn ghost" style="margin-top:8px;width:100%">{icon('bookmark', 15, '#1a47f5')}Enregistrer ce filtre</span>
  </div>
  <div style="position:absolute;left:570px;right:30px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:26px">Candidatures · Ingénieur informatique</h1><p class="mute" style="margin-top:4px">24 candidats sur 139 correspondent à vos critères · triés par adéquation</p></div>
      <span class="btn ghost">{icon('download', 16, '#1a47f5')}Exporter</span></div>
    <div class="card" style="margin-top:18px;padding:4px 6px"><table><tr><th>Candidat</th><th>Résultats</th><th>Projet</th><th>Adéquation</th><th>Financement</th><th></th></tr>{tr}</table></div>
    <div class="card" style="margin-top:16px;padding:16px;display:flex;gap:14px;align-items:center;background:#fffbea;border-color:#ffe59a">{icon('shield-check', 22, '#a55a00')}
      <p style="font-size:13px;line-height:1.5"><b>Financement :</b> « Couvert » = budget déclaré ≥ coût annuel estimé ET pièce validée par Navigoal (garant ou justificatif). Le montant exact des ressources n'est jamais montré à l'école.</p></div>
  </div>
  <div class="note" style="left:258px;top:600px">Moyenne et mention saisies par l'élève, vérifiées sur le relevé de notes déposé</div>
  <div class="note" style="left:1100px;top:545px">Score d'adéquation : résultats + série + projet + test d'orientation + budget</div>
</div>"""


# ---------------------------------------------------------------- 5. Vivier de candidats
def vivier():
    profils = [
        ("Élève · Gabon", "Bac D attendu juin 2027", "14 – 15", "Santé · infirmier, sage-femme", "5 – 7 M F CFA/an", "Rabat, Fès", "Parent garant", "rentrée 2027"),
        ("Étudiant · Sénégal", "Bac S1 2025 · L1 en cours", "15 – 16", "Ingénierie · informatique", "6 – 9 M F CFA/an", "Casablanca, Rabat", "Bourse recherchée", "rentrée 2027"),
        ("Élève · Côte d'Ivoire", "Bac C attendu 2027", "13 – 14", "Commerce · marketing digital", "4 – 6 M F CFA/an", "Casablanca", "Parent garant", "rentrée 2027"),
        ("Élève · Cameroun", "Bac C attendu 2027", "16 – 17", "Ingénierie · génie civil", "8 – 10 M F CFA/an", "Rabat", "Justificatif validé", "rentrée 2027"),
    ]
    cartes = "".join(f"""<div class="card" style="padding:16px">
      <div style="display:flex;align-items:center;gap:10px"><span style="width:38px;height:38px;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:center">{icon('user-round', 18, '#1a47f5')}</span>
        <div style="flex:1"><b style="font-size:14px">{a}</b><p class="small mute">{b}</p></div><span class="chip g">{icon('check', 12, '#0f8a46')}Accepte d'être contacté</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin-top:12px;font-size:12.5px">
        <div><p class="small mute">Moyenne</p><b>{m}/20</b></div><div><p class="small mute">Projet</p><b>{p}</b></div>
        <div><p class="small mute">Budget annuel</p><b>{bu}</b></div><div><p class="small mute">Villes souhaitées</p><b>{v}</b></div>
        <div><p class="small mute">Financement</p><b>{f}</b></div><div><p class="small mute">Rentrée</p><b>{r}</b></div></div>
      <div style="display:flex;gap:8px;margin-top:14px"><span class="btn primary" style="padding:8px 12px;font-size:13px;flex:1">{icon('send', 14, '#fff')}Inviter à candidater</span><span class="btn ghost" style="padding:8px 12px;font-size:13px">{icon('bookmark', 14, '#1a47f5')}</span></div>
    </div>""" for a, b, m, p, bu, v, f, r in profils)
    return f"""<div class="frame" style="width:1440px;height:990px"><div class="titre-cadre">5 · Établissement Premium : vivier de candidats (profils anonymes, avec leur accord)</div>
  {menu(ECOLE, "Vivier de candidats", "Espace établissement · UIR", ["Vivier de candidats", "Prospection"])}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:28px">Vivier de candidats</h1><p class="mute" style="margin-top:4px">4 812 élèves et étudiants ont choisi d'être visibles des écoles · noms et coordonnées masqués jusqu'à leur réponse</p></div>
      <span class="btn primary">{icon('megaphone', 16, '#fff')}Créer une campagne avec ces 318 profils</span></div>
    <div class="card" style="margin-top:18px;padding:14px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      {''.join(f'<div class="field">{t} {icon("chevron-down", 14, "#6b7493")}</div>' for t in ["Pays : Gabon, Sénégal, Cameroun +3", "Domaine : Ingénierie, Santé", "Moyenne ≥ 13", "Budget ≥ coût de vos formations", "Rentrée 2027", "Villes : Rabat"])}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px">
      {''.join(f'<div class="card" style="padding:14px"><p class="small mute" style="font-weight:700">{a}</p><p style="font-size:24px;font-weight:800;margin-top:4px">{b}</p><p class="small mute">{c}</p></div>' for a, b, c in [("PROFILS CORRESPONDANTS", "318", "sur 4 812 visibles"), ("BUDGET COUVRANT VOS FRAIS", "61 %", "budget déclaré ≥ coût estimé"), ("MOYENNE MÉDIANE", "14,1", "sur 20"), ("DÉJÀ INTÉRESSÉS PAR L'UIR", "42", "favoris ou fiche consultée")])}
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:16px">{cartes}</div>
  </div>
  <div class="note" style="left:270px;top:905px;max-width:420px">Seuls les élèves qui ont coché « Être visible des établissements » apparaissent ; pour un mineur, l'accord du parent est requis</div>
  <div class="note" style="left:850px;top:905px;max-width:420px">L'école ne voit ni nom, ni e-mail, ni téléphone : ils sont révélés seulement si l'élève accepte l'invitation</div>
</div>"""


# ---------------------------------------------------------------- 6. Campagne de prospection
def campagne():
    return f"""<div class="frame" style="width:1440px;height:780px"><div class="titre-cadre">6 · Établissement Premium : campagne de prospection</div>
  {menu(ECOLE, "Prospection", "Espace établissement · UIR", ["Vivier de candidats", "Prospection"])}
  <div style="position:absolute;left:270px;top:28px;width:620px">
    <h1 style="font-size:26px">Nouvelle campagne</h1><p class="mute" style="margin-top:4px">Les messages arrivent dans l'espace Navigoal des élèves (avec un e-mail de notification), jamais dans leur boîte personnelle.</p>
    <div class="card" style="margin-top:16px;padding:18px">
      <p class="label">1 · CIBLE</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">{''.join(f'<span class="chip b">{t}</span>' for t in ["Gabon, Sénégal, Cameroun", "Ingénierie · informatique", "Moyenne ≥ 13", "Budget ≥ 6 M F CFA", "Rentrée 2027"])}</div>
      <p style="margin-top:10px;font-size:13.5px"><b>318 profils</b> · dont 41 mineurs (avec accord parental) · <span class="mute">les élèves déjà contactés par l'UIR depuis 30 jours sont exclus</span></p>
      <p class="label" style="margin-top:18px">2 · OFFRE</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">{''.join(f'<span class="chip {c}" style="padding:8px 12px">{icon(i, 13, col)}{t}</span>' for t, i, c, col in [("Invitation à candidater", "file-pen-line", "b", "#1a47f5"), ("Journée portes ouvertes en ligne", "video", "n", "#3b4566"), ("Bourse ou réduction", "percent", "n", "#3b4566"), ("Concours d'entrée", "trophy", "n", "#3b4566")])}</div>
      <p class="label" style="margin-top:18px">3 · MESSAGE</p>
      <div class="field" style="flex-direction:column;align-items:stretch;gap:6px"><b>Objet : Ingénieur informatique à l'UIR, rentrée 2027</b><span style="font-size:13.5px;line-height:1.5">Bonjour {{prénom}}, votre projet en informatique correspond au cycle ingénieur de l'Université Internationale de Rabat. Candidatures ouvertes jusqu'au 15 mars, frais de dossier offerts aux élèves invités…</span></div>
      <div style="display:flex;gap:10px;margin-top:10px"><div class="field" style="flex:1">{icon('link', 15, '#6b7493')}Lien : formation Ingénieur informatique (Navigoal)</div><div class="field">{icon('calendar', 15, '#6b7493')}Envoi : 4 nov. 9 h</div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px"><span class="small mute">Crédits : 318 / 2 000 envois ce mois · validation par Navigoal sous 24 h</span><span class="btn primary">{icon('send', 15, '#fff')}Envoyer pour validation</span></div>
    </div>
  </div>
  <div style="position:absolute;left:920px;right:30px;top:28px">
    <p class="label">APERÇU CÔTÉ ÉLÈVE</p>
    <div class="card" style="padding:16px">
      <div style="display:flex;gap:10px;align-items:center"><img src="{LOGO['uir']}" style="width:40px;height:40px;border-radius:10px;object-fit:contain;border:1px solid #eef1f8"><div><b>Université Internationale de Rabat</b><p class="small mute">Invitation · <span class="chip g" style="padding:2px 7px;font-size:10.5px">Reconnu par l'État</span></p></div></div>
      <p style="margin-top:12px;font-size:13.5px;line-height:1.5">Bonjour Yann, votre projet en informatique correspond au cycle ingénieur de l'UIR…</p>
      <div style="display:flex;gap:8px;margin-top:12px"><span class="btn primary" style="flex:1;font-size:13px">Ça m'intéresse</span><span class="btn ghost" style="font-size:13px">Non merci</span></div>
      <p class="small mute" style="margin-top:10px">Pourquoi je reçois ce message ? · Ne plus être contacté par les écoles</p>
    </div>
    <p class="label" style="margin-top:22px">CAMPAGNE PRÉCÉDENTE · « Portes ouvertes octobre »</p>
    <div class="card" style="padding:16px">
      {''.join(f'<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0"><span style="font-size:13.5px">{a}</span><span style="display:flex;align-items:center;gap:10px">{jauge(p, c)}<b style="width:44px;text-align:right">{v}</b></span></div>' for a, v, p, c in [("Envoyés", "412", 100, "#1a47f5"), ("Lus", "287", 70, "#1a47f5"), ("Intéressés", "64", 16, "#0f8a46"), ("Candidatures", "23", 6, "#0f8a46"), ("Désinscriptions", "3", 1, "#d42a50")])}
    </div>
  </div>
  <div class="note" style="left:270px;top:680px">Chaque campagne est relue par Navigoal (pas de spam, pas de fausse promesse)</div>
  <div class="note" style="left:920px;top:540px">« Ça m'intéresse » révèle le profil complet à l'école et ouvre un fil de discussion</div>
</div>"""


# ---------------------------------------------------------------- 7. Côté élève (mobile)
def eleve():
    attentes = f"""<div class="frame" style="width:390px;height:880px"><div class="titre-cadre">7 · Élève : mes attentes et ma visibilité</div>
  <div style="padding:16px 18px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;gap:10px">{icon('arrow-left', 20, '#0b1533')}<b>Mon profil</b></div>
  <div style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">
    <div class="card" style="padding:16px">
      <b>Mes résultats</b>
      <div style="display:flex;gap:10px;margin-top:10px"><div style="flex:1"><p class="label">Série</p><div class="field">Bac D</div></div><div style="flex:1"><p class="label">Moyenne /20</p><div class="field">14,6</div></div></div>
      <p class="small" style="margin-top:10px;color:#0f8a46;font-weight:700">{icon('circle-check', 13, '#0f8a46')} Vérifiée sur ton relevé de notes</p>
    </div>
    <div class="card" style="padding:16px"><b>Mon projet</b>
      <div class="field" style="margin-top:10px">Domaine : Santé</div><div class="field" style="margin-top:8px">Métier visé : infirmière</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="chip b">Rentrée 2027</span><span class="chip b">Rabat</span><span class="chip b">Fès</span></div></div>
    <div class="card" style="padding:16px"><b>Mon financement</b>
      <div class="field" style="margin-top:10px">Budget par an : 5 à 7 M F CFA</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="chip g">Parent garant</span><span class="chip n">Bourse : oui, si possible</span></div>
      <p class="small mute" style="margin-top:8px">Les écoles voient seulement si ton budget couvre leurs frais, jamais le montant.</p></div>
    <div class="card" style="padding:16px;border:2px solid #1a47f5">
      <div style="display:flex;align-items:center;gap:10px"><b style="flex:1">Être visible des établissements</b>
        <span style="width:46px;height:26px;border-radius:20px;background:#1a47f5;position:relative;display:inline-block"><span style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:20px;background:#fff"></span></span></div>
      <p class="small mute" style="margin-top:8px;line-height:1.5">Les écoles reconnues peuvent t'inviter à candidater. Ton nom et tes coordonnées restent cachés tant que tu n'acceptes pas. Tu peux arrêter à tout moment.</p>
      <p class="small" style="margin-top:8px;color:#a55a00;font-weight:700">{icon('users', 13, '#a55a00')} Tu as moins de 18 ans : ton parent doit confirmer (demande envoyée à Jean-Paul M.)</p>
    </div>
  </div>
  <div class="note" style="left:18px;top:810px;max-width:300px">Nouvelle section du profil élève</div>
</div>"""
    invitation = f"""<div class="frame" style="width:390px;height:880px"><div class="titre-cadre">7 bis · Élève : invitations reçues</div>
  <div style="padding:16px 18px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;gap:10px">{icon('arrow-left', 20, '#0b1533')}<b>Invitations des écoles</b><span class="chip b" style="margin-left:auto">2 nouvelles</span></div>
  <div style="padding:16px 18px;display:flex;flex-direction:column;gap:12px">
    {''.join(f'''<div class="card" style="padding:16px">
      <div style="display:flex;gap:10px;align-items:center"><img src="{lg}" style="width:42px;height:42px;border-radius:11px;object-fit:contain;border:1px solid #eef1f8"><div style="flex:1"><b style="font-size:14px">{n}</b><p class="small mute">{o}</p></div></div>
      <p style="margin-top:10px;font-size:13.5px;line-height:1.5">{t}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">{tags}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><span class="btn primary" style="flex:1;font-size:13px">Ça m'intéresse</span><span class="btn ghost" style="font-size:13px">Non merci</span></div></div>''' for lg, n, o, t, tags in [
        (LOGO["uir"], "Université Internationale de Rabat", "Licence sciences infirmières · rentrée 2027", "Ton projet d'infirmière correspond à notre licence. Frais de dossier offerts jusqu'au 15 mars.", '<span class="chip g">Reconnu par l\'État</span><span class="chip y">Frais de dossier offerts</span>'),
        (LOGO["uemf"], "Université Euromed de Fès", "Portes ouvertes en ligne · 20 nov.", "Découvre notre faculté de santé lors d'une session en visio avec les enseignants.", '<span class="chip g">Reconnu par l\'État</span><span class="chip b">Fès</span>')])}
    <div class="card" style="padding:14px;background:#f0f4ff;border-color:#dbe4ff;font-size:12.5px;line-height:1.5">{icon('shield-check', 15, '#1a47f5')} En cliquant « Ça m'intéresse », l'école voit ton prénom, ton nom et ton profil, et peut t'écrire dans ta messagerie Navigoal.</div>
  </div>
</div>"""
    return attentes + invitation


# ---------------------------------------------------------------- 8. Offre
def offre():
    lignes = [
        ("Fiche école, formations, campagnes d'admission", True, True),
        ("Réception et traitement des candidatures", True, True),
        ("Messagerie avec les candidats", True, True),
        ("Mode accompagné par Navigoal (prise en main)", True, True),
        ("Filtres : résultats scolaires, projet, financement", False, True),
        ("Score d'adéquation et filtres enregistrés", False, True),
        ("Vivier de candidats (profils anonymes consentants)", False, True),
        ("Campagnes de prospection (2 000 envois / mois)", False, True),
        ("Statistiques de campagne et export", False, True),
        ("Mise en avant sur les pages formations", False, True),
    ]
    ok = icon('check', 18, '#0f8a46')
    non = icon('minus', 18, '#c3c9d6')
    return f"""<div class="frame" style="width:1440px;height:760px;padding:40px 60px"><div class="titre-cadre">8 · Offre établissements : Gratuit / Premium</div>
  <h1 style="font-size:30px">Navigoal pour les établissements</h1><p class="mute" style="margin-top:6px">L'offre Premium est activée par l'équipe Navigoal (facturation annuelle), puis visible dans l'espace de l'école.</p>
  <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:0;margin-top:26px" class="card">
    <div style="padding:22px 24px;border-bottom:1px solid #e6eaf3"></div>
    <div style="padding:22px 24px;border-bottom:1px solid #e6eaf3;border-left:1px solid #e6eaf3"><b style="font-size:20px">Gratuit</b><p class="mute small" style="margin-top:4px">Pour recevoir des candidatures</p><p style="font-size:26px;font-weight:800;margin-top:10px">0 MAD</p></div>
    <div style="padding:22px 24px;border-bottom:1px solid #e6eaf3;border-left:1px solid #e6eaf3;background:#fffbea"><b style="font-size:20px">Premium</b> <span class="chip prem">{icon('crown', 12, '#0b1533')}Recommandé</span><p class="mute small" style="margin-top:4px">Pour choisir et attirer les bons profils</p><p style="font-size:26px;font-weight:800;margin-top:10px">Tarif à définir <span class="small mute" style="font-weight:600">/ an</span></p></div>
    {''.join(f'<div style="padding:11px 24px;border-bottom:1px solid #eef1f8;font-size:14px">{t}</div><div style="padding:11px 24px;border-bottom:1px solid #eef1f8;border-left:1px solid #e6eaf3">{ok if a else non}</div><div style="padding:11px 24px;border-bottom:1px solid #eef1f8;border-left:1px solid #e6eaf3;background:#fffbea">{ok if b else non}</div>' for t, a, b in lignes)}
  </div>
  <div class="note" style="left:1110px;top:24px">Montant à fixer par vous ; le paiement en ligne de l'abonnement pourra venir ensuite</div>
</div>"""


# ---------------------------------------------------------------- 9. Règles
def regles():
    blocs = [
        ("Relais Navigoal", ["L'admin voit toutes les candidatures, tous les fils candidat ↔ école et locataire ↔ bailleur", "Il répond toujours sous le nom « Équipe Navigoal, pour le compte de… », jamais en se faisant passer pour l'école", "Il peut faire avancer un dossier (vérification, pièce demandée), pas accepter ni refuser une admission", "Chaque action est tracée et l'école ou le bailleur est prévenu"]),
        ("Données des élèves", ["Moyenne et série saisies par l'élève, vérifiées sur le relevé de notes", "Financement : l'école voit « couvert / partiel / déclaré », jamais le montant ni les justificatifs", "Filtres Premium sur les candidatures reçues : uniquement les élèves qui ont candidaté chez l'école"]),
        ("Vivier et prospection", ["Visible uniquement si l'élève active « Être visible des établissements »", "Mineur : accord du parent lié au compte, sinon invisible", "Profil anonyme jusqu'à « Ça m'intéresse » ; pas d'export de coordonnées", "Campagnes relues par Navigoal, 1 message par école et par élève tous les 30 jours, désinscription en 1 clic"]),
        ("Cadre légal", ["Consentement explicite et retirable (loi 09-08, déclaration à la CNDP ; RGPD pour les élèves en Europe)", "Mentions dans la politique de confidentialité et les CGU établissements", "Écoles Premium : uniquement des comptes vérifiés, labels Navigoal"]),
    ]
    return f"""<div class="frame" style="width:1440px;height:490px;padding:40px"><div class="titre-cadre">9 · Règles : relais, confidentialité et prospection</div>
  <h1 style="font-size:28px">Règles de fonctionnement</h1>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:24px">{''.join(f'<div class="card" style="padding:22px"><b style="font-size:17px">{t}</b>{"".join(f"<p style=\'margin-top:11px;font-size:13.5px;line-height:1.5\'>• {x}</p>" for x in l)}</div>' for t, l in blocs)}</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Relais admin et Premium établissements</title><style>{CSS}</style></head><body>
{admin_candidatures()}{admin_fil()}{admin_relais()}{ecole_candidats()}{vivier()}{campagne()}{eleve()}{offre()}{regles()}
</body></html>"""
open(os.path.join(OUT, "premium.html"), "w").write(html)
print("→", os.path.join(OUT, "premium.html"), f"({len(html) // 1024} Ko)")
