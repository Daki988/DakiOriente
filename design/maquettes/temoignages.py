#!/usr/bin/env python3
"""Maquettes « Ils racontent leur métier » (octobre 2026) : témoignages réels de professionnels, résumés par Navigoal,
avec une courte citation, le nom de la personne, la source et le lien vers l'original.

1. Fiche métier (ordinateur) : encart « Ils racontent leur métier » sous le parcours, puis « D'autres professionnels racontent »
2. Fiche métier (mobile) : carte de témoignage
3. Page « Témoignages » : tous les témoignages, filtres par domaine

Usage : python3 design/maquettes/temoignages.py <dossier icônes lucide>  → design/maquettes/out/temoignages.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (styles, icônes, logo)

icon, CSS, WORDMARK = P.icon, P.CSS, P.WORDMARK
NOTE = 'class="note"'

# Témoignages vérifiés sur la source (nom, rôle, lieu, citation exacte)
T = {
    "nicolas": dict(n="Nicolas Lombé Nsole", r="Opérateur sur plateforme pétrolière", l="Total Gabon · Gabon", c="#0f8a46", t="Article",
                    src="Confidentiel Afrique", d="juin 2018",
                    resume="Il travaille en haute mer, sur une plateforme au large du Gabon, au sein d'équipes qui se relaient jour et nuit. Il insiste sur le travail d'équipe et sur la pratique : au lycée technique, la théorie prenait presque toute la place.",
                    cit="Nous nous trouvons sur une sorte de petite île flottante et isolée dans l'océan Atlantique."),
    "ruben": dict(n="Ruben Sakande", r="Ingénieur minier", l="Burkina Faso", c="#a55a00", t="Article", src="Le Grand Frère", d="janv. 2023",
                  resume="Il choisit les méthodes pour extraire le minerai de façon rentable et supervise l'exploitation, de l'étude du gisement à la production. Il conseille de soigner ses stages : le marché de l'emploi est exigeant.",
                  cit="Le monde de l'emploi est très féroce."),
    "olivier": dict(n="Olivier Serrano", r="Géologue sédimentologue", l="BRGM · terrain en Mauritanie et au Congo", c="#6c3df4", t="Radio", src="ICI Orléans", d="oct. 2026",
                    resume="Il étudie les roches et les sédiments pour retracer l'histoire de la Terre et localiser les ressources. Sur le terrain, de la Mauritanie au Congo, il lui arrive de lécher une roche fraîchement cassée : mouillée, elle se voit mieux à la loupe, et le goût trahit certaines substances.",
                    cit="L'objectif de mon métier, c'est de lire les sédiments pour raconter l'histoire de la Terre."),
    "adjehi": dict(n="Adjéhi Koffi", r="Pisciculteur", l="Abengourou · Côte d'Ivoire", c="#0b7fb3", t="Article", src="FAO", d="déc. 2025",
                   resume="Chaque matin, il nourrit ses poissons et surveille ses bassins. Il produit une dizaine de tonnes par an et veut tripler sa production.",
                   cit="L'aquaculture est un métier noble, qui permet de faire de grandes choses."),
    "alain": dict(n="Alain Tchatchou", r="Agripreneur", l="Cameroun", c="#0f8a46", t="Article", src="Réseau FAR", d="févr. 2023",
                  resume="Élevage porcin et analyses de sols : il a lancé son activité avec un programme d'appui aux jeunes entrepreneurs et raconte ses espoirs comme ses déceptions.",
                  cit="Nous sommes capables de faire de grandes réalisations avec un accompagnement institutionnel de l'État."),
    "prisca": dict(n="Prisca Kouacou", r="Entrepreneuse du numérique", l="Côte d'Ivoire", c="#d42a50", t="Article", src="BBC Afrique", d="août 2017",
                   resume="Elle est partie d'une passion et d'un problème à résoudre, a créé un blog puis vendu des formations en ligne, sans bureau ni employés au départ.",
                   cit="Tout le reste n'est qu'habillage."),
    "royce": dict(n="Royce Namukonda", r="Enseignante du primaire", l="Lusaka · Zambie", c="#1a47f5", t="Article", src="UNESCO IICBA", d="juil. 2024",
                  resume="Elle enseigne en sixième année et a intégré l'éducation à la santé à ses cours, inspirée par sa propre maîtresse de première année.",
                  cit="Recevoir une éducation de base en matière de santé et de bien-être est un avantage pour les enfants de mon école."),
}


def initiales(n):
    return "".join(x[0] for x in n.split()[:2]).upper()


def avatar(k, s=52):
    x = T[k]
    return f'<span style="width:{s}px;height:{s}px;border-radius:{s // 3}px;background:{x["c"]};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:{s // 2.6:.0f}px;flex-shrink:0">{initiales(x["n"])}</span>'


def type_chip(t):
    ic = {"Article": "newspaper", "Vidéo": "circle-play", "Radio": "radio", "Podcast": "mic"}[t]
    return f'<span class="chip b" style="font-size:11px;padding:3px 8px">{icon(ic, 12, "#1a47f5")}{t}</span>'


def carte(k, large=False):
    x = T[k]
    lien = "Écouter" if x["t"] in ("Radio", "Podcast") else "Voir la vidéo" if x["t"] == "Vidéo" else "Lire le témoignage"
    return f"""<div class="card" style="padding:{24 if large else 18}px;display:flex;flex-direction:column;gap:14px;height:100%">
  <div style="display:flex;gap:12px;align-items:center">{avatar(k, 56 if large else 46)}
    <div style="flex:1;min-width:0"><b style="font-size:{17 if large else 15}px">{x["n"]}</b><p class="small mute" style="margin-top:2px">{x["r"]} · {x["l"]}</p></div>{type_chip(x["t"])}</div>
  <div style="position:relative;border-left:4px solid #ffc21f;background:#fffbea;border-radius:0 14px 14px 0;padding:{14 if large else 11}px {16 if large else 13}px">
    <span style="position:absolute;left:10px;top:-14px;font-size:44px;line-height:1;color:#ffc21f;font-weight:800">“</span>
    <p style="font-size:{18 if large else 14.5}px;font-weight:700;line-height:1.45;font-style:italic">« {x["cit"]} »</p></div>
  <p style="font-size:{14.5 if large else 13}px;line-height:1.6;color:#3b4566">{x["resume"]}</p>
  <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;border-top:1px solid #eef1f8">
    <span class="small mute">Source : <b style="color:#3b4566">{x["src"]}</b> · {x["d"]}</span>
    <span class="btn ghost" style="padding:7px 11px;font-size:12.5px">{lien}{icon("external-link", 13, "#1a47f5")}</span></div>
</div>"""


def entete(titre, desc, couleur="#0f8a46", ic="flame"):
    return f"""<div style="height:64px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:34px">
    <img src="{WORDMARK}" style="height:26px"><span class="mute" style="font-weight:700;font-size:14px">S'orienter</span><span class="mute" style="font-weight:700;font-size:14px">Formations</span><span style="font-weight:800;font-size:14px;color:#1a47f5">Métiers</span><span class="mute" style="font-weight:700;font-size:14px">Établissements</span><span class="mute" style="font-weight:700;font-size:14px">Parents</span></div>
  <div style="padding:30px 48px 26px;background:linear-gradient(135deg,#e8f8ef,#f6f8fe 70%)">
    <p class="small mute">Accueil › Métiers › {titre}</p>
    <div style="display:flex;gap:18px;align-items:center;margin-top:14px"><span style="width:72px;height:72px;border-radius:22px;background:{couleur};display:flex;align-items:center;justify-content:center">{icon(ic, 36, "#fff")}</span>
      <div><h1 style="font-size:34px;letter-spacing:-.02em">Devenir {titre.lower()}</h1><p class="mute" style="font-size:16px;margin-top:6px;max-width:760px">{desc}</p></div></div></div>"""


# ---------------------------------------------------------------- 1. Fiche métier (ordinateur)
def fiche():
    autres = "".join(f"""<div class="card" style="padding:14px;display:flex;gap:12px;align-items:center">{avatar(k, 42)}<div style="flex:1;min-width:0"><b style="font-size:14px">{T[k]["n"]}</b><p class="small mute">{T[k]["r"]}</p><p class="small" style="margin-top:4px;font-style:italic;color:#3b4566">« {T[k]["cit"] if len(T[k]["cit"]) <= 62 else T[k]["cit"][:60].rsplit(" ", 1)[0] + "…"} »</p></div>{icon("arrow-right", 16, "#1a47f5")}</div>""" for k in ("ruben", "olivier"))
    return f"""<div class="frame" style="width:1440px;height:1180px;background:#fff"><div class="titre-cadre">1 · Fiche métier : « Ils racontent leur métier » (ordinateur)</div>
  {entete("Ingénieur pétrolier / gazier", "Conçoit et pilote l'exploration et la production de pétrole et de gaz, à terre comme en mer.")}
  <div style="padding:22px 48px"><div class="card" style="padding:16px 22px;display:flex;justify-content:space-between;font-size:13px">{''.join(f'<span><b>{a}</b><span class="mute"> · {b}</span></span>' for a, b in [("Série au lycée", "SM, PC"), ("6 formations", "Bac+3 → Bac+5"), ("14 écoles", "au Maroc"), ("Ingénieur pétrolier", "ton futur métier")])}</div></div>
  <div style="padding:6px 48px 0">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><p class="chip y" style="font-size:11px">{icon("message-square-quote", 12, "#a55a00")}TÉMOIGNAGE</p>
      <h2 style="font-size:28px;margin-top:10px;letter-spacing:-.02em">Ils racontent leur métier</h2><p class="mute" style="margin-top:4px">Des professionnels parlent de leur quotidien. Résumé par Navigoal, avec un lien vers le témoignage original.</p></div></div>
    <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:22px;margin-top:18px;align-items:stretch">
      {carte("nicolas", large=True)}
      <div style="display:flex;flex-direction:column;gap:12px"><p class="label" style="margin:0">D'AUTRES PROFESSIONNELS DU DOMAINE RACONTENT</p>{autres}
        <span class="btn ghost" style="align-self:flex-start">{icon("library", 16, "#1a47f5")}Tous les témoignages</span>
        <div class="card" style="padding:14px;background:#f6f8fe;box-shadow:none"><p class="small mute" style="line-height:1.5">{icon("shield-check", 13, "#0f8a46")} Témoignages publics vérifiés sur leur source. Vous êtes l'une de ces personnes ? Écrivez-nous pour corriger ou retirer votre témoignage.</p></div></div>
    </div>
    <h2 style="font-size:28px;margin-top:40px;letter-spacing:-.02em">Les formations et où les suivre</h2>
    <div class="card" style="height:150px;margin-top:14px;opacity:.55;display:flex;align-items:center;justify-content:center"><span class="mute">(formations et écoles, inchangé)</span></div>
  </div>
  <div {NOTE} style="left:930px;top:370px">Nouvel encart, placé juste sous le parcours : le témoignage passe avant les listes de formations</div>
  <div {NOTE} style="left:60px;top:1000px;max-width:420px">Citation courte et exacte, entre guillemets ; le résumé est rédigé par Navigoal ; nom, média, date et lien vers l'original (nouvel onglet)</div>
  <div {NOTE} style="left:1110px;top:870px">Aucune photo des personnes : initiales en couleur (droits à l'image)</div>
</div>"""


# ---------------------------------------------------------------- 2. Mobile
def mobile():
    return f"""<div class="frame" style="width:390px;height:1000px;background:#fff"><div class="titre-cadre">2 · Fiche métier (mobile)</div>
  <div style="height:56px;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;justify-content:space-between;padding:0 16px"><img src="{WORDMARK}" style="height:22px">{icon("menu", 22, "#0b1533")}</div>
  <div style="padding:18px 16px;background:linear-gradient(135deg,#fff3cc,#f6f8fe 70%)"><p class="small mute">Métiers › Ingénieur des mines</p><h1 style="font-size:24px;margin-top:8px">Devenir ingénieur des mines</h1></div>
  <div style="padding:18px 16px"><p class="chip y" style="font-size:11px">{icon("message-square-quote", 12, "#a55a00")}TÉMOIGNAGE</p><h2 style="font-size:21px;margin-top:8px">Ils racontent leur métier</h2>
    <div style="margin-top:12px">{carte("ruben")}</div>
    <div style="display:flex;justify-content:center;gap:6px;margin-top:12px"><span style="width:18px;height:6px;border-radius:9px;background:#1a47f5"></span><span style="width:6px;height:6px;border-radius:9px;background:#d6dcea"></span></div>
    <p class="small mute" style="text-align:center;margin-top:8px">Faites glisser pour le témoignage suivant</p></div>
  <div {NOTE} style="left:180px;top:930px;max-width:200px">Plusieurs témoignages : défilement horizontal</div>
</div>"""


# ---------------------------------------------------------------- 3. Page Témoignages
def page():
    filtres = ["Tous", "Santé", "Numérique", "Industrie et énergie", "Agriculture et environnement", "Droit et administration", "Gestion et commerce", "Éducation et social", "Arts et médias"]
    return f"""<div class="frame" style="width:1440px;height:1250px;background:#fff"><div class="titre-cadre">3 · Page « Ils racontent leur métier » (/temoignages/)</div>
  <div style="height:64px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:34px"><img src="{WORDMARK}" style="height:26px"><span class="mute" style="font-weight:700;font-size:14px">S'orienter</span><span class="mute" style="font-weight:700;font-size:14px">Formations</span><span style="font-weight:800;font-size:14px;color:#1a47f5">Métiers</span><span class="mute" style="font-weight:700;font-size:14px">Établissements</span></div>
  <div style="padding:34px 48px 22px;background:linear-gradient(135deg,#fff3cc,#f6f8fe 70%)"><p class="small mute">Accueil › Métiers › Témoignages</p>
    <h1 style="font-size:38px;margin-top:12px;letter-spacing:-.02em">Ils racontent leur métier</h1>
    <p class="mute" style="font-size:16px;margin-top:6px;max-width:780px">Plus de 80 professionnels, d'Afrique et d'ailleurs, présentent leur quotidien et racontent leurs anecdotes. Choisis un domaine, puis ouvre la fiche du métier.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">{''.join(f'<span class="chip" style="padding:8px 13px;font-size:13px;{"background:#1a47f5;color:#fff" if i == 0 else "background:#fff;color:#3b4566;border:1px solid #e6eaf3"}">{f}</span>' for i, f in enumerate(filtres))}</div></div>
  <div style="padding:26px 48px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
    {''.join(f'<div>{carte(k)}<p class="small" style="margin-top:8px;font-weight:800;color:#1a47f5">{icon("briefcase", 12, "#1a47f5")} Fiche métier : {m} →</p></div>' for k, m in [("nicolas", "Ingénieur pétrolier"), ("adjehi", "Technicien des pêches et de l'aquaculture"), ("royce", "Instituteur"), ("prisca", "Entrepreneur"), ("alain", "Entrepreneur agricole"), ("olivier", "Géologue")])}
  </div>
  <div {NOTE} style="left:1000px;top:160px">Témoignages d'Afrique mis en avant ; filtres par domaine des métiers</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Ils racontent leur métier</title><style>{CSS}</style></head><body>
{fiche()}{mobile()}{page()}
</body></html>"""
open(os.path.join(P.OUT, "temoignages.html"), "w").write(html)
print("→", os.path.join(P.OUT, "temoignages.html"), f"({len(html) // 1024} Ko)")
