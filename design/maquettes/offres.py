#!/usr/bin/env python3
"""Maquettes « offres payantes des établissements » (octobre 2026) : services réellement fonctionnels et gérés par l'admin.

1. Administrateur : offres et abonnements (catalogue et tarifs, abonnements actifs, échéances, encaissements)
2. Administrateur : activer ou prolonger un service pour une école (durée, montant, règlement)
3. Site public : écoles mises en avant (liste des établissements, accueil), signalées « Partenaire Navigoal »
4. Site public : résultats de recherche de formations (offres des écoles partenaires en tête)
5. Établissement : « Mon offre » (services actifs, échéances, statistiques de visibilité)

Usage : python3 design/maquettes/offres.py <dossier icônes lucide>  → design/maquettes/out/offres.html
"""
import base64
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (styles, icônes, logos ; régénère aussi premium.html)

icon, CSS, LOGO, WORDMARK, menu, ECOLE, ADMIN, b64 = P.icon, P.CSS, P.LOGO, P.WORDMARK, P.menu, P.ECOLE, P.ADMIN, P.b64
L = {k: b64(os.path.join(P.ROOT, "assets", "logos", "ma", f), m) for k, f, m in [
    ("hem", "ma-hem.png", "image/png"), ("esca", "ma-esca.png", "image/png"), ("um6p", "ma-um6p.png", "image/png"), ("supdeco", "ma-supdeco-marrakech.png", "image/png")]}
L.update(LOGO)
ADMIN_OFFRES = ADMIN[:4] + [("crown", "Offres et abonnements")] + ADMIN[4:]
ECOLE_OFFRE = ECOLE + [("crown", "Mon offre")]
NOTE = 'class="note"'


def logo(k, s=34):
    return f'<img src="{L[k]}" style="width:{s}px;height:{s}px;border-radius:{s // 4}px;object-fit:contain;border:1px solid #eef1f8;background:#fff">'


def partenaire():
    return f'<span class="chip" style="background:#fff3cc;color:#a55a00;font-size:11px;padding:3px 8px">{icon("star", 11, "#a55a00")}Partenaire Navigoal</span>'


# ---------------------------------------------------------------- 1. Admin : offres et abonnements
def admin_offres():
    catalogue = [
        ("crown", "Premium", "5 000 MAD / an", "Sélection des candidats, vivier, prospection (2 000 envois / mois), mise en avant incluse", "21 écoles", True),
        ("star", "Mise en avant seule", "Tarif à fixer · 3, 6 ou 12 mois", "Badge « Partenaire Navigoal », en tête des listes, accueil, pages villes et formations", "4 écoles", False),
        ("life-buoy", "Mode accompagné", "Inclus (prise en main)", "Navigoal répond aux candidats et traite les dossiers au nom de l'école", "9 écoles", False),
    ]
    rows = [
        ("uir", "UIR", "Premium", "12 janv. 2026", "12 janv. 2027", "Actif", "g", "5 000 MAD", "VIR-2026-014"),
        ("hem", "HEM", "Premium", "3 nov. 2025", "3 nov. 2026", "Expire dans 4 j", "r", "5 000 MAD", "VIR-2025-088"),
        ("esca", "ESCA", "Mise en avant · 6 mois", "1 sept. 2026", "1 mars 2027", "Actif", "g", "— MAD", "CHQ-2026-003"),
        ("esa", "ESA", "Premium", "15 oct. 2025", "15 oct. 2026", "Expiré", "n", "5 000 MAD", "VIR-2025-071"),
        ("emsi", "EMSI", "Premium", "28 oct. 2026", "28 oct. 2027", "Actif", "g", "5 000 MAD", "MM-2026-112"),
    ]
    tr = "".join(f"""<tr><td><div style="display:flex;align-items:center;gap:10px">{logo(k, 28)}<b>{n}</b></div></td><td>{s}</td><td class="mute">{d}</td><td><b>{f}</b></td>
      <td><span class="chip {c}">{st}</span></td><td>{m}<p class="small mute">{ref}</p></td>
      <td><span class="btn ghost" style="padding:6px 10px;font-size:12.5px">{"Prolonger" if c != "g" else "Gérer"}</span></td></tr>""" for k, n, s, d, f, st, c, m, ref in rows)
    return f"""<div class="frame" style="width:1440px;height:1000px"><div class="titre-cadre">1 · Administrateur : offres et abonnements des établissements</div>
  {menu(ADMIN_OFFRES, "Offres et abonnements", "Back-office Navigoal")}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:28px">Offres et abonnements</h1><p class="mute" style="margin-top:4px">Services payants des établissements : activation, échéances, encaissements</p></div>
      <div style="display:flex;gap:10px"><span class="btn ghost">{icon('download', 16, '#1a47f5')}Exporter (CSV)</span><span class="btn primary">{icon('plus', 16, '#fff')}Activer un service</span></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">
      {''.join(f'<div class="card" style="padding:16px"><p class="small mute" style="font-weight:700">{a}</p><p style="font-size:26px;font-weight:800;margin-top:4px;color:{c}">{b}</p><p class="small mute">{d}</p></div>' for a, b, c, d in [("ABONNEMENTS ACTIFS", "25", "#0b1533", "21 Premium · 4 mise en avant"), ("ENCAISSÉ EN 2026", "107 500 MAD", "#0f8a46", "saisi à chaque activation"), ("EXPIRENT SOUS 30 JOURS", "3", "#d42a50", "rappel e-mail à J-30 et J-7"), ("ÉCOLES MISES EN AVANT", "25", "#a55a00", "visibles sur le site public")])}
    </div>
    <p class="label" style="margin-top:22px">CATALOGUE ET TARIFS</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      {''.join(f'''<div class="card" style="padding:16px;{"border:2px solid #ffd34a;background:#fffbea" if hl else ""}">
        <div style="display:flex;align-items:center;gap:10px"><span style="width:34px;height:34px;border-radius:10px;background:#eef2ff;display:flex;align-items:center;justify-content:center">{icon(i, 17, "#1a47f5")}</span><b style="flex:1">{t}</b>{icon("pencil", 15, "#6b7493")}</div>
        <p style="font-size:18px;font-weight:800;margin-top:10px">{prix}</p><p class="small mute" style="margin-top:4px;line-height:1.5">{d}</p><p class="small" style="margin-top:8px;font-weight:700;color:#1a47f5">{n}</p></div>''' for i, t, prix, d, n, hl in catalogue)}
    </div>
    <div class="card" style="margin-top:16px;padding:12px 16px;display:flex;gap:8px;align-items:center">
      <span class="chip b" style="padding:8px 12px">Tous</span><span class="chip n" style="padding:8px 12px">Actifs</span><span class="chip r" style="padding:8px 12px">Expirent sous 30 j</span><span class="chip n" style="padding:8px 12px">Expirés</span>
      <div class="field" style="margin-left:auto;width:280px">{icon('search', 15, '#6b7493')}<span class="mute">Établissement, référence…</span></div></div>
    <div class="card" style="margin-top:12px;padding:4px 6px"><table><tr><th>École</th><th>Service</th><th>Début</th><th>Fin</th><th>État</th><th>Montant · référence</th><th></th></tr>{tr}</table></div>
  </div>
  <div {NOTE} style="left:860px;top:930px;max-width:360px">Prix modifiables ici (le tarif de la mise en avant seule est à fixer par vous)</div>
  <div {NOTE} style="left:300px;top:930px;max-width:520px">À l'échéance, le service s'arrête tout seul (plus de badge, plus d'accès Premium) ; l'école et l'admin sont prévenus 30 et 7 jours avant</div>
</div>"""


# ---------------------------------------------------------------- 2. Admin : activer un service
def admin_activer():
    champ = lambda l, v, w="100%": f'<div style="width:{w}"><p class="label">{l}</p><div class="field">{v}</div></div>'
    return f"""<div class="frame" style="width:1440px;height:760px"><div class="titre-cadre">2 · Administrateur : activer ou prolonger un service</div>
  <div style="position:absolute;inset:0;background:rgba(11,21,51,.35)"></div>
  <div class="card" style="position:absolute;left:440px;top:60px;width:560px;padding:26px">
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">Activer un service</b>{icon('x', 20, '#6b7493')}</div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:18px">
      {champ("Établissement", f'{logo("hem", 22)} HEM Business School · Casablanca')}
      <div><p class="label">Service</p><div style="display:flex;gap:8px"><span class="chip b" style="padding:9px 12px">{icon('crown', 13, '#1a47f5')}Premium</span><span class="chip n" style="padding:9px 12px">{icon('star', 13, '#3b4566')}Mise en avant seule</span></div></div>
      <div style="display:flex;gap:12px">{champ("Durée", "12 mois", "50%")}{champ("Du", "3 nov. 2026 → 3 nov. 2027", "50%")}</div>
      <p class="small" style="color:#1a47f5;font-weight:700;margin-top:-6px">Prolongation : la période démarre à la fin de l'abonnement en cours (3 nov. 2026)</p>
      <div style="display:flex;gap:12px">{champ("Montant encaissé", "5 000 MAD", "50%")}{champ("Règlement", "Virement bancaire", "50%")}</div>
      {champ("Référence du règlement", "VIR-2026-131")}
      {champ("Note interne", '<span class="mute">Ex. : remise salon de Libreville…</span>')}
      <div class="card" style="padding:12px 14px;box-shadow:none;background:#f0f4ff;border-color:#dbe4ff;font-size:12.5px;line-height:1.5">{icon('info', 14, '#1a47f5')} L'école est prévenue par e-mail ; les fonctions Premium et le badge « Partenaire Navigoal » s'activent immédiatement.</div>
      <div style="display:flex;justify-content:flex-end;gap:10px"><span class="btn ghost">Annuler</span><span class="btn primary">Activer jusqu'au 3 nov. 2027</span></div>
    </div>
  </div>
  <div {NOTE} style="left:1030px;top:240px;max-width:260px">Chaque activation garde une trace : montant, règlement, référence, auteur (journal et export comptable)</div>
</div>"""


# ---------------------------------------------------------------- 3. Public : liste des établissements + accueil
def public_ecoles():
    carte = lambda k, s, n, v, lab, part: f"""<div class="card" style="padding:16px;{"border:2px solid #ffd34a" if part else ""}">
      <div style="display:flex;gap:12px;align-items:center">{logo(k, 46)}<div style="flex:1"><b style="font-size:15px">{s}</b><p class="small mute">{n}</p></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">{partenaire() if part else ""}<span class="chip g" style="font-size:11px;padding:3px 8px">{lab}</span><span class="chip n" style="font-size:11px;padding:3px 8px">{v}</span></div></div>"""
    return f"""<div class="frame" style="width:1440px;height:960px;background:#fff"><div class="titre-cadre">3 · Site public : écoles mises en avant (liste et accueil)</div>
  <div style="padding:20px 60px;display:flex;align-items:center;gap:30px;border-bottom:1px solid #eef1f8"><img src="{WORDMARK}" style="height:26px">{''.join(f'<span style="font-size:14px;font-weight:600;color:{"#1a47f5" if t == "Établissements" else "#3b4566"}">{t}</span>' for t in ["Métiers", "Formations", "Établissements", "Villes", "Parents"])}</div>
  <div style="padding:30px 60px">
    <h1 style="font-size:32px">Établissements au Maroc</h1><p class="mute" style="margin-top:6px">103 écoles privées aux diplômes reconnus ou homologués par l'État</p>
    <div style="display:flex;gap:10px;margin-top:18px"><div class="field" style="width:380px">{icon('search', 16, '#6b7493')}<span class="mute">Nom, sigle, ville…</span></div><div class="field">Ville {icon('chevron-down', 14, '#6b7493')}</div><div class="field">Label {icon('chevron-down', 14, '#6b7493')}</div></div>
    <p class="label" style="margin-top:22px">{icon('star', 13, '#a55a00')} ÉCOLES PARTENAIRES</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">{carte("uir", "UIR", "Université Internationale de Rabat", "Rabat", "Reconnu par l'État", True)}{carte("hem", "HEM", "HEM Business School", "Casablanca +5", "Reconnu par l'État", True)}{carte("esca", "ESCA", "ESCA École de Management", "Casablanca", "Reconnu par l'État", True)}{carte("emsi", "EMSI", "École Marocaine des Sciences de l'Ingénieur", "Casablanca +4", "Diplômes homologués", True)}</div>
    <p class="label" style="margin-top:22px">TOUS LES ÉTABLISSEMENTS (ordre alphabétique)</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">{carte("supdeco", "Sup de Co", "Sup de Co Marrakech", "Marrakech", "Établissement autorisé", False)}{carte("um6p", "UM6P", "Université Mohammed VI Polytechnique", "Ben Guérir", "Reconnu par l'État", False)}{carte("uemf", "UEMF", "Université Euromed de Fès", "Fès", "Reconnu par l'État", False)}{carte("esa", "ESA", "École Supérieure des Affaires", "Casablanca", "Reconnu par l'État", False)}</div>
    <div class="card" style="margin-top:26px;padding:18px;display:flex;gap:16px;align-items:center;background:#f6f8fe"><b style="font-size:15px">Accueil · « Écoles partenaires »</b><div style="display:flex;gap:12px">{''.join(logo(k, 52) for k in ["uir", "hem", "esca", "emsi"])}</div><span class="small mute">bandeau défilant, logos cliquables vers la fiche</span></div>
  </div>
  <div {NOTE} style="left:960px;top:120px;max-width:320px">Les écoles mises en avant passent en tête, avec la mention « Partenaire Navigoal » (transparence : contenu promu signalé)</div>
  <div {NOTE} style="left:960px;top:880px;max-width:320px">Les labels et l'ordre alphabétique restent intacts pour les autres : la mise en avant n'efface aucune école</div>
</div>"""


# ---------------------------------------------------------------- 4. Public : recherche de formations
def public_formations():
    ligne = lambda k, s, f, v, part: f"""<div class="card" style="padding:14px 16px;display:flex;gap:14px;align-items:center;{"border:2px solid #ffd34a" if part else ""}">{logo(k, 40)}
      <div style="flex:1"><b>{f}</b><p class="small mute">{s} · {v}</p><div style="display:flex;gap:6px;margin-top:6px">{partenaire() if part else ""}<span class="chip g" style="font-size:11px;padding:3px 8px">Reconnu par l'État</span><span class="chip b" style="font-size:11px;padding:3px 8px">Bac+3 · 3 ans</span></div></div>
      <span class="btn ghost" style="font-size:13px">Voir la formation</span></div>"""
    return f"""<div class="frame" style="width:1440px;height:700px;background:#fff"><div class="titre-cadre">4 · Site public : recherche de formations</div>
  <div style="padding:30px 60px">
    <h1 style="font-size:28px">Formations · « management »</h1><p class="mute" style="margin-top:4px">46 formations dans 31 établissements</p>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:20px;width:900px">
      {ligne("hem", "HEM", "Bachelor en management", "Casablanca", True)}{ligne("esca", "ESCA", "Bachelor Business Administration", "Casablanca", True)}{ligne("esa", "ESA", "Bachelor en management", "Casablanca", False)}{ligne("uir", "UIR", "Licence en management", "Rabat", False)}
    </div>
  </div>
  <div {NOTE} style="left:1010px;top:150px;max-width:300px">À pertinence égale, les formations des écoles partenaires apparaissent en premier (3 au plus en tête de liste)</div>
  <div {NOTE} style="left:1010px;top:300px;max-width:300px">Mêmes règles sur les pages Villes et Domaines, et dans les suggestions de Navi (signalées « partenaire »)</div>
</div>"""


# ---------------------------------------------------------------- 5. École : mon offre
def ecole_offre():
    return f"""<div class="frame" style="width:1440px;height:860px"><div class="titre-cadre">5 · Établissement : mon offre</div>
  {menu(ECOLE_OFFRE, "Mon offre", "Espace établissement · UIR", ["Vivier de candidats", "Prospection"])}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <h1 style="font-size:28px">Mon offre</h1><p class="mute" style="margin-top:4px">Vos services Navigoal, leurs échéances et ce qu'ils vous rapportent</p>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-top:20px">
      <div class="card" style="padding:20px;border:2px solid #ffd34a;background:#fffbea">
        <div style="display:flex;align-items:center;gap:10px"><span class="chip prem">{icon('crown', 12, '#0b1533')}PREMIUM</span><b style="font-size:17px">Actif jusqu'au 12 janv. 2027</b></div>
        <p class="small mute" style="margin-top:8px">Souscrit le 12 janv. 2026 · 5 000 MAD · renouvellement à demander à l'équipe Navigoal</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;font-size:14px">{''.join(f'<span>{icon("circle-check", 16, "#0f8a46")} {t}</span>' for t in ["Sélection des candidats (résultats, projet, financement)", "Vivier de candidats et campagnes (1 412 / 2 000 envois ce mois)", "Mise en avant : badge « Partenaire Navigoal », en tête des listes et sur l'accueil"])}</div>
        <span class="btn ghost" style="margin-top:16px">{icon('mail', 15, '#1a47f5')}Demander le renouvellement</span>
      </div>
      <div class="card" style="padding:20px"><b style="font-size:16px">Visibilité ce mois-ci</b>
        {''.join(f'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eef1f8"><span style="font-size:14px">{a}</span><span><b style="font-size:18px">{b}</b> <span class="small" style="color:#0f8a46;font-weight:700">{c}</span></span></div>' for a, b, c in [("Affichages en tête de liste", "8 940", "▲ 32 %"), ("Clics vers votre fiche", "612", "▲ 18 %"), ("Candidatures reçues", "47", "▲ 9 %"), ("Élèves intéressés (prospection)", "64", "")])}
        <p class="small mute" style="margin-top:10px">Comptés par Navigoal sur le site public (sans données personnelles)</p>
      </div>
    </div>
    <p class="label" style="margin-top:22px">HISTORIQUE</p>
    <div class="card" style="padding:4px 6px"><table><tr><th>Service</th><th>Période</th><th>Montant</th><th>Référence</th></tr>
      <tr><td>Premium</td><td>12 janv. 2026 → 12 janv. 2027</td><td>5 000 MAD</td><td>VIR-2026-014</td></tr>
      <tr><td>Mise en avant · 3 mois</td><td>1 sept. 2025 → 1 déc. 2025</td><td>—</td><td>CHQ-2025-021</td></tr></table></div>
  </div>
  <div {NOTE} style="left:900px;top:560px;max-width:300px">Statistiques réelles : affichages et clics comptés sur les cartes mises en avant</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Offres des établissements</title><style>{CSS}</style></head><body>
{admin_offres()}{admin_activer()}{public_ecoles()}{public_formations()}{ecole_offre()}
</body></html>"""
open(os.path.join(P.OUT, "offres.html"), "w").write(html)
print("→", os.path.join(P.OUT, "offres.html"), f"({len(html) // 1024} Ko)")
