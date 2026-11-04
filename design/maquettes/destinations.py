#!/usr/bin/env python3
"""Maquettes « plusieurs pays de destination » (novembre 2026) : le Sénégal rejoint le Maroc, puis Côte d'Ivoire,
Tunisie, Cameroun, Bénin et Togo sur le même modèle (établissements privés reconnus seulement).

1. Accueil : « Où veux-tu étudier ? » (choix de la destination, pays à venir signalés)
2. Établissements : filtre par pays, labels propres à chaque pays, frais en F CFA
3. Fiche établissement (Sénégal) : habilitation et programmes accrédités par l'ANAQ-Sup, avec l'année
4. Fiche pays Sénégal : villes, visa et séjour, monnaie, coût de la vie, reconnaissance des diplômes
5. Labels : ce qu'ils signifient dans chaque pays

Usage : python3 design/maquettes/destinations.py <dossier icônes lucide>  → design/maquettes/out/destinations.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (styles, icônes, logo)

icon, CSS, WORDMARK, b64 = P.icon, P.CSS, P.WORDMARK, P.b64
NOTE = 'class="note"'
LOGOS = os.path.join(P.ROOT, "assets", "logos")
L = {k: b64(os.path.join(LOGOS, d, f), m) for k, d, f, m in [
    ("iam", "sn", "sn-iam.png", "image/png"), ("ism", "sn", "sn-ism.png", "image/png"), ("supdeco", "sn", "sn-supdeco.png", "image/png"),
    ("dit", "sn", "sn-dit.jpg", "image/jpeg"), ("bem", "sn", "sn-bem.png", "image/png"), ("ucao", "sn", "sn-ucao.png", "image/png"),
    ("esmt", "sn", "sn-esmt.png", "image/png"), ("uir", "ma", "ma-uir.jpg", "image/jpeg")]}


def logo(k, s=44):
    return f'<img src="{L[k]}" style="width:{s}px;height:{s}px;border-radius:{s // 4}px;object-fit:contain;border:1px solid #eef1f8;background:#fff">'


def drapeau(pays, s=28):
    # Drapeaux simplifiés (bandes), sans image externe
    bandes = {"MA": None, "SN": ["#00853f", "#fdef42", "#e31b23"], "CI": ["#f77f00", "#ffffff", "#009e60"], "TN": None,
              "CM": ["#007a5e", "#ce1126", "#fcd116"], "BJ": None, "TG": None}
    if pays == "MA":
        return f'<span style="display:inline-flex;width:{s * 1.4:.0f}px;height:{s}px;border-radius:6px;background:#c1272d;align-items:center;justify-content:center">{icon("star", s // 2, "#006233")}</span>'
    if pays == "TN":
        return f'<span style="display:inline-flex;width:{s * 1.4:.0f}px;height:{s}px;border-radius:6px;background:#e70013;align-items:center;justify-content:center"><span style="width:{s // 1.6:.0f}px;height:{s // 1.6:.0f}px;border-radius:99px;background:#fff"></span></span>'
    if pays in ("BJ", "TG"):
        c = ["#008751", "#fcd116", "#e8112d"]
        return f'<span style="display:inline-flex;width:{s * 1.4:.0f}px;height:{s}px;border-radius:6px;overflow:hidden"><span style="width:40%;background:{c[0]}"></span><span style="flex:1;display:flex;flex-direction:column"><span style="flex:1;background:{c[1]}"></span><span style="flex:1;background:{c[2]}"></span></span></span>'
    c = bandes[pays]
    return f'<span style="display:inline-flex;width:{s * 1.4:.0f}px;height:{s}px;border-radius:6px;overflow:hidden">{"".join(f"<span style=flex:1;background:{x}></span>" for x in c)}</span>'


def entete(actif="Établissements"):
    liens = "".join(f'<span style="font-weight:{800 if t == actif else 700};font-size:14px;color:{"#1a47f5" if t == actif else "#5b6478"}">{t}</span>' for t in ["S'orienter", "Formations", "Métiers", "Établissements", "Pays", "Parents"])
    return f"""<div style="height:64px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:30px">
    <img src="{WORDMARK}" style="height:26px">{liens}<span style="margin-left:auto" class="chip b">{drapeau("SN", 14)} Destination : Sénégal {icon("chevron-down", 13, "#1a47f5")}</span></div>"""


def label_chip(t, ton):
    c = {"g": ("#e8f8ef", "#0f8a46", "badge-check"), "b": ("#eef2ff", "#1a47f5", "award"), "y": ("#fff3cc", "#a55a00", "globe")}[ton]
    return f'<span class="chip" style="background:{c[0]};color:{c[1]};font-size:11.5px">{icon(c[2], 12, c[1])}{t}</span>'


# ---------------------------------------------------------------- 1. Accueil : choix de la destination
def accueil():
    actifs = [("MA", "Maroc", "103 établissements privés · 17 villes", "Labels : reconnu par l'État, diplômes homologués"),
              ("SN", "Sénégal", "≈ 85 établissements privés · Dakar, Thiès, Saint-Louis", "Labels : habilité par l'État, programmes accrédités ANAQ-Sup")]
    bientot = [("CI", "Côte d'Ivoire"), ("TN", "Tunisie"), ("CM", "Cameroun"), ("BJ", "Bénin"), ("TG", "Togo")]
    cartes = "".join(f"""<div class="card" style="padding:20px;display:flex;gap:16px;align-items:center;{'border:2px solid #1a47f5' if c == 'SN' else ''}">{drapeau(c, 34)}
      <div style="flex:1"><b style="font-size:19px">{n}</b><p class="small mute" style="margin-top:3px">{a}</p><p class="small" style="margin-top:6px;color:#0f8a46;font-weight:700">{icon("shield-check", 12, "#0f8a46")} {b}</p></div>
      <span class="btn {'primary' if c == 'SN' else 'ghost'}">Explorer{icon("arrow-right", 15, "#fff" if c == "SN" else "#1a47f5")}</span></div>""" for c, n, a, b in actifs)
    prochains = "".join(f'<span class="chip" style="background:#fff;border:1px dashed #c9d2e6;color:#5b6478;padding:8px 12px;font-size:13px">{drapeau(c, 14)} {n} · bientôt</span>' for c, n in bientot)
    return f"""<div class="frame" style="width:1440px;height:860px;background:#fff"><div class="titre-cadre">1 · Accueil : choix de la destination</div>
  {entete("")}
  <div style="padding:46px 48px 0;background:linear-gradient(135deg,#eef2ff,#fff 60%)">
    <p class="small mute" style="font-weight:800;letter-spacing:.08em">ORIENTER · FORMER · CONSTRUIRE DEMAIN</p>
    <h1 style="font-size:52px;letter-spacing:-.03em;margin-top:10px">Ton avenir commence ici.</h1>
    <p style="font-size:18px;color:#3b4566;margin-top:10px;max-width:760px">La plateforme d'orientation et de candidature pour étudier en Afrique, dans des écoles privées reconnues.</p>
    <p class="label" style="margin-top:30px">OÙ VEUX-TU ÉTUDIER ?</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:6px;max-width:1100px">{cartes}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;align-items:center"><span class="small mute" style="font-weight:700">Prochaines destinations :</span>{prochains}</div>
    <p class="small mute" style="margin-top:22px;max-width:900px">{icon("info", 13, "#5b6478")} Le choix est mémorisé : formations, écoles, comparateur, devis et Navi s'adaptent à la destination. On peut aussi tout voir, tous pays confondus.</p>
  </div>
  <div {NOTE} style="left:1150px;top:300px;max-width:250px">Nouveau : la destination devient un choix (Maroc par défaut pour les visiteurs actuels)</div>
  <div {NOTE} style="left:900px;top:640px;max-width:420px">Pays « bientôt » affichés sans lien : ils s'activent quand leur référentiel est prêt</div>
</div>"""


# ---------------------------------------------------------------- 2. Liste des établissements, filtre pays
def liste():
    ecoles = [("iam", "IAM", "Institut Africain de Management", "Dakar", [("Habilité par l'État", "g"), ("12 programmes accrédités", "b")], "1,6 – 3,2 M F CFA / an"),
              ("supdeco", "SUP DE CO", "École supérieure de commerce de Dakar", "Dakar", [("9 programmes accrédités", "b")], "1,8 – 3,5 M F CFA / an"),
              ("dit", "DIT", "Dakar Institute of Technology", "Dakar", [("Habilité par l'État", "g"), ("2 programmes accrédités", "b")], "2,0 – 3,0 M F CFA / an"),
              ("ism", "ISM", "Institut Supérieur de Management", "Dakar", [("Programmes accrédités", "b")], "1,9 – 4,0 M F CFA / an"),
              ("ucao", "UCAO Saint Michel", "Institut supérieur de gestion Saint-Michel", "Dakar", [("Habilité par l'État", "g"), ("11 programmes accrédités", "b")], "0,9 – 1,6 M F CFA / an"),
              ("esmt", "ESMT", "École supérieure multinationale des télécommunications", "Dakar", [("Établissement inter-États", "y")], "1,5 – 2,8 M F CFA / an")]
    cartes = "".join(f"""<div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:12px;align-items:center">{logo(k, 48)}<div style="flex:1"><b style="font-size:16px">{s}</b><p class="small mute">{n}</p></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">{"".join(label_chip(t, c) for t, c in lab)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eef1f8;padding-top:10px"><span class="small mute">{icon("map-pin", 12, "#5b6478")} {v}, Sénégal</span><b style="font-size:13px;color:#0b1533">{p}</b></div></div>""" for k, s, n, v, lab, p in ecoles)
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">2 · Établissements : filtre par pays et labels du pays</div>
  {entete()}
  <div style="padding:26px 48px">
    <h1 style="font-size:32px">Établissements au Sénégal</h1><p class="mute" style="margin-top:4px">Écoles privées reconnues : habilitation institutionnelle ou programmes accrédités par l'ANAQ-Sup. Les établissements de la liste noire du ministère sont exclus.</p>
    <div style="display:flex;gap:8px;margin-top:16px;align-items:center">
      <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#3b4566;padding:8px 12px">Tous les pays</span>
      <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#3b4566;padding:8px 12px">{drapeau("MA", 13)} Maroc</span>
      <span class="chip" style="background:#1a47f5;color:#fff;padding:8px 12px">{drapeau("SN", 13)} Sénégal · 85</span>
      <span style="width:1px;height:26px;background:#e6eaf3;margin:0 6px"></span>
      <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#3b4566;padding:8px 12px">Ville : Dakar {icon("chevron-down", 12, "#5b6478")}</span>
      <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#3b4566;padding:8px 12px">Label {icon("chevron-down", 12, "#5b6478")}</span>
      <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#3b4566;padding:8px 12px">Domaine {icon("chevron-down", 12, "#5b6478")}</span>
      <span style="margin-left:auto" class="small mute">Frais affichés en F CFA (devise du visiteur sinon)</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:20px">{cartes}</div>
  </div>
  <div {NOTE} style="left:1110px;top:150px;max-width:290px">Les labels dépendent du pays : au Sénégal, habilitation et accréditation ANAQ-Sup ; au Maroc, inchangés</div>
  <div {NOTE} style="left:60px;top:830px;max-width:520px">Montants d'exemple dans la maquette : les vraies fourchettes viendront des sites des écoles, comme pour le Maroc</div>
</div>"""


# ---------------------------------------------------------------- 3. Fiche établissement (Sénégal)
def fiche():
    progs = [("Licence en droit des affaires", "2026"), ("Master en Marketing et Intelligence d'affaires", "2025"), ("Master en Informatique de gestion", "2025"),
             ("Licence professionnelle en Informatique de gestion", "2025"), ("Master Management de la qualité", "2025")]
    lignes = "".join(f'<tr><td>{p}</td><td><span class="chip g" style="font-size:11px">{icon("check", 11, "#0f8a46")}Accrédité</span></td><td class="mute">{a}</td></tr>' for p, a in progs)
    return f"""<div class="frame" style="width:1440px;height:960px"><div class="titre-cadre">3 · Fiche établissement (Sénégal)</div>
  {entete()}
  <div style="padding:26px 48px;display:grid;grid-template-columns:1fr 380px;gap:24px">
    <div>
      <p class="small mute">Établissements › Sénégal › Dakar › IAM</p>
      <div style="display:flex;gap:18px;align-items:center;margin-top:12px">{logo("iam", 84)}<div><h1 style="font-size:30px">Institut Africain de Management</h1>
        <p class="mute" style="margin-top:4px">{drapeau("SN", 13)} Dakar, Sénégal · École de management et d'informatique</p>
        <div style="display:flex;gap:6px;margin-top:10px">{label_chip("Habilité par l'État (2024)", "g")}{label_chip("12 programmes accrédités ANAQ-Sup", "b")}</div></div></div>
      <div class="card" style="padding:18px;margin-top:20px"><b>Reconnaissance des diplômes</b>
        <p style="font-size:14px;color:#3b4566;margin-top:8px;line-height:1.6">Au Sénégal, un diplôme privé est reconnu par l'État quand l'établissement a reçu l'<b>habilitation institutionnelle</b> et que le programme est <b>accrédité par l'ANAQ-Sup</b> (Autorité nationale d'assurance qualité). L'accréditation vaut 5 ans.</p>
        <p class="small mute" style="margin-top:8px">{icon("external-link", 12, "#5b6478")} Source : bases officielles de l'ANAQ-Sup (anaqsup.sn), consultées le 4 novembre 2026</p></div>
      <p class="label" style="margin-top:20px">PROGRAMMES ACCRÉDITÉS (12)</p>
      <div class="card" style="padding:4px 6px"><table><tr><th>Programme</th><th>Décision ANAQ-Sup</th><th>Année</th></tr>{lignes}</table></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="padding:18px"><b>Coût indicatif</b><p style="font-size:24px;font-weight:800;margin-top:6px">1,6 – 3,2 M F CFA<span class="small mute"> / an</span></p><p class="small mute">≈ 2 440 – 4 880 € · scolarité seule</p>
        <span class="btn primary" style="margin-top:12px;width:100%">{icon("calculator", 15, "#fff")}Estimer le budget complet</span></div>
      <div class="card" style="padding:18px"><b>Vivre à Dakar</b><p class="small" style="margin-top:8px;line-height:1.7">Logement étudiant : 75 000 – 200 000 F CFA / mois<br>Vie quotidienne : 100 000 – 150 000 F CFA / mois<br>Transport : bus Dakar Dem Dikk, BRT, TER</p></div>
      <div class="card" style="padding:18px;background:#e8f8ef;box-shadow:none"><b style="color:#0f8a46">Venir du Gabon</b><p class="small" style="margin-top:6px;line-height:1.6">Visa et séjour selon ton pays d'origine (vérifié pays par pays avant la mise en ligne). Monnaie : 1 F CFA (CEMAC) = 1 F CFA (UEMOA), même parité avec l'euro.</p></div>
      <span class="btn sun">{icon("send", 15, "#0b1533")}Candidater</span>
    </div>
  </div>
  <div {NOTE} style="left:60px;top:900px;max-width:560px">Chaque programme affiche la décision et l'année de l'ANAQ-Sup ; les programmes « non accrédités » ne sont jamais proposés</div>
  <div {NOTE} style="left:1040px;top:880px;max-width:360px">Le bloc « Venir de… » s'adapte au pays d'origine de l'élève</div>
</div>"""


# ---------------------------------------------------------------- 4. Fiche pays Sénégal
def pays():
    villes = [("Dakar", "≈ 75 écoles", "Capitale, plateau des affaires, Point E, Mermoz, Almadies"), ("Thiès", "≈ 8 écoles", "À 70 km, TER vers Dakar, vie moins chère"), ("Saint-Louis", "quelques écoles", "Ville universitaire historique, au nord")]
    cartes = "".join(f'<div class="card" style="padding:16px"><b style="font-size:16px">{v}</b><p class="small" style="color:#1a47f5;font-weight:800;margin-top:2px">{n}</p><p class="small mute" style="margin-top:6px">{d}</p></div>' for v, n, d in villes)
    faits = [("languages", "Langue d'enseignement", "Français"), ("wallet", "Monnaie", "Franc CFA (XOF) · 1 € = 655,957 F CFA"), ("plane", "Visa", "Pas de visa pour les ressortissants CEDEAO et de nombreux pays africains ; carte de séjour sur place"),
             ("calendar", "Rentrée", "Octobre – novembre"), ("shield-check", "Qualité", "ANAQ-Sup (accréditation) · CAMES (reconnaissance régionale)"), ("sun", "Climat", "Tropical sec, saison des pluies de juillet à octobre")]
    lignes = "".join(f'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #eef1f8">{icon(i, 18, "#1a47f5")}<div><b style="font-size:14px">{t}</b><p class="small mute" style="margin-top:2px">{v}</p></div></div>' for i, t, v in faits)
    return f"""<div class="frame" style="width:1440px;height:900px;background:#fff"><div class="titre-cadre">4 · Fiche pays : Sénégal</div>
  {entete("Pays")}
  <div style="padding:30px 48px;background:linear-gradient(135deg,#e8f8ef,#fff 60%)">
    <div style="display:flex;gap:16px;align-items:center">{drapeau("SN", 46)}<div><h1 style="font-size:38px">Étudier au Sénégal</h1><p class="mute" style="font-size:16px;margin-top:4px">Un grand pôle d'enseignement supérieur francophone d'Afrique de l'Ouest, à quelques heures de vol de toute la région.</p></div></div>
    <div style="display:grid;grid-template-columns:1fr 420px;gap:24px;margin-top:24px">
      <div><p class="label">VILLES ÉTUDIANTES</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">{cartes}</div>
        <p class="label" style="margin-top:20px">BUDGET MENSUEL INDICATIF (HORS SCOLARITÉ)</p>
        <div class="card" style="padding:16px;display:flex;gap:30px"><div><p class="small mute">Dakar</p><b style="font-size:20px">180 000 – 350 000 F CFA</b></div><div><p class="small mute">Thiès</p><b style="font-size:20px">120 000 – 230 000 F CFA</b></div></div>
        <p class="label" style="margin-top:20px">DIPLÔMES RECONNUS</p><p style="font-size:14px;color:#3b4566;line-height:1.6">Navigoal ne présente que les écoles <b>habilitées</b> ou dont les programmes sont <b>accrédités par l'ANAQ-Sup</b>. Celles de la liste noire du ministère (octobre 2026) sont exclues.</p></div>
      <div class="card" style="padding:6px 18px">{lignes}</div>
    </div>
  </div>
  <div {NOTE} style="left:1000px;top:120px;max-width:400px">Même gabarit que la fiche Maroc ; chiffres à sourcer comme pour le Maroc (coûts de la vie, visa par pays d'origine)</div>
</div>"""


# ---------------------------------------------------------------- 5. Labels par pays
def labels():
    lignes = [("Maroc", "Reconnu par l'État", "Université ou établissement reconnu par décret", "Diplômes homologués", "Filières accréditées par arrêté (Bulletin officiel)"),
              ("Sénégal", "Habilité par l'État", "Habilitation institutionnelle (MESRI, sur avis de l'ANAQ-Sup) à délivrer licence, master, doctorat", "Programmes accrédités", "Programme accrédité par l'ANAQ-Sup (valable 5 ans)"),
              ("Côte d'Ivoire, Cameroun, Bénin, Togo", "à définir", "Agrément / habilitation du ministère", "à définir", "Reconnaissance CAMES des diplômes"),
              ("Tunisie", "à définir", "Université privée agréée", "à définir", "Diplômes homologués (équivalence)")]
    tr = "".join(f'<tr><td><b>{p}</b></td><td>{label_chip(a, "g") if a != "à définir" else "<span class=mute>à définir</span>"}</td><td class="mute">{b}</td><td>{label_chip(c, "b") if c != "à définir" else "<span class=mute>à définir</span>"}</td><td class="mute">{d}</td></tr>' for p, a, b, c, d in lignes)
    return f"""<div class="frame" style="width:1440px;height:560px"><div class="titre-cadre">5 · Labels Navigoal : sens dans chaque pays</div>
  <div style="padding:34px 48px"><h1 style="font-size:28px">Deux niveaux de reconnaissance, adaptés à chaque pays</h1>
    <p class="mute" style="margin-top:6px">Niveau 1 (vert) : l'établissement lui-même est reconnu. Niveau 2 (bleu) : certains de ses programmes le sont. Plus les écoles inter-États (ESMT, CESAG…) signalées à part.</p>
    <div class="card" style="padding:4px 6px;margin-top:18px"><table><tr><th>Pays</th><th>Niveau 1</th><th>Ce que ça veut dire</th><th>Niveau 2</th><th>Ce que ça veut dire</th></tr>{tr}</table></div></div>
  <div {NOTE} style="left:1000px;top:470px;max-width:400px">Les filtres « Label » restent les mêmes partout ; seul le libellé change selon le pays</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Plusieurs destinations</title><style>{CSS}</style></head><body>
{accueil()}{liste()}{fiche()}{pays()}{labels()}
</body></html>"""
open(os.path.join(P.OUT, "destinations.html"), "w").write(html)
print("→", os.path.join(P.OUT, "destinations.html"), f"({len(html) // 1024} Ko)")
