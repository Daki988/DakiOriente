#!/usr/bin/env python3
"""Maquettes « Dossier de candidature » et « Audience » (novembre 2026).

1. Fiche formation : ce que contient le dossier, fiche de candidature de l'école à télécharger
2. Élève : constituer son dossier (pièces demandées, téléversement, fiche à remplir puis à renvoyer)
3. Élève sur téléphone : téléverser une pièce (photo ou fichier)
4. Établissement : réglages du dossier (pièces exigées, pièces propres à l'école, fiche PDF)
5. Établissement : dossier reçu (pièces, fiche remplie, demander une pièce)
6. Administrateur : audience (pages vues, pays, pages les plus visitées, sources, appareils, services)
7. Règles : catalogue des pièces et mesure d'audience sans cookie

Usage : python3 design/maquettes/dossier.py <dossier icônes lucide>  → design/maquettes/out/dossier.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402

icon, CSS, WORDMARK, menu, ADMIN, ECOLE = P.icon, P.CSS, P.WORDMARK, P.menu, P.ADMIN, P.ECOLE
NOTE = 'class="note"'
B = "#1a47f5"

# Catalogue des pièces : (code, libellé, phase)
PIECES = [
    ("fiche_candidature", "Fiche de candidature de l'école, remplie et signée", "candidature"),
    ("identite", "Passeport ou carte d'identité", "candidature"),
    ("photo", "Photo d'identité récente", "candidature"),
    ("acte_naissance", "Acte de naissance", "candidature"),
    ("bulletins", "Bulletins des deux dernières années (1re et terminale)", "candidature"),
    ("releve_bac", "Relevé de notes du bac (ou attestation de réussite)", "candidature"),
    ("diplome", "Diplôme du bac, copie certifiée conforme", "candidature"),
    ("cv", "CV", "candidature"),
    ("lettre_motivation", "Lettre de motivation", "candidature"),
    ("prise_en_charge", "Engagement de prise en charge (parent ou tuteur)", "candidature"),
    ("equivalence_bac", "Équivalence du bac (bac étranger)", "inscription"),
    ("certificat_medical", "Certificat médical", "inscription"),
    ("originaux", "Originaux du bac et des relevés", "inscription"),
]


def pastille(etat):
    return {"ok": ("Déposée", "g"), "manque": ("À déposer", "r"), "fiche": ("À remplir", "y"), "attente": ("En vérification", "y")}[etat]


def entete():
    liens = "".join(f'<span style="font-weight:600;font-size:14px;color:#3b4566">{t}</span>' for t in ["Accueil", "Métiers", "Formations", "Établissements", "Villes", "Orientation", "Ressources", "Navilease", "NaviTravel", "Parents"])
    return f'<div style="height:68px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:24px"><img src="{WORDMARK}" style="height:28px">{liens}<span class="btn" style="margin-left:auto;background:#ffc21a">S\'inscrire</span></div>'


# ---------------------------------------------------------------- 1. Fiche formation
def fiche_formation():
    lignes = "".join(f"""<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #eef1f8">{icon("file-check-2", 17, B)}<span style="font-size:14px">{l}</span>
      {'<span class="chip" style="margin-left:auto;background:#fff3c4;color:#a55a00;font-size:11px">propre à l\'école</span>' if c in ("prise_en_charge", "fiche_candidature") else ""}</div>""" for c, l, ph in PIECES if ph == "candidature")
    insc = "".join(f'<span style="display:flex;gap:8px;font-size:13.5px;color:#3b4566">{icon("clock-3", 15, "#6b7493")}{l}</span>' for c, l, ph in PIECES if ph == "inscription")
    return f"""<div class="frame" style="width:1440px;height:1020px;background:#f6f8fe"><div class="titre-cadre">1 · Fiche formation : le dossier de candidature et la fiche de l'école</div>
  {entete()}
  <div style="padding:30px 48px;display:grid;grid-template-columns:1fr 380px;gap:32px">
    <div style="display:flex;flex-direction:column;gap:16px">
      <span class="small mute">Formations › Bachelor en Business Administration › IIHEM, Rabat</span>
      <b style="font-size:34px;letter-spacing:-.02em">Bachelor en Business Administration · IIHEM</b>
      <div class="card" style="padding:24px;display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:10px">{icon("folder-open", 22, B)}<b style="font-size:20px">Dossier de candidature</b><span class="chip" style="margin-left:auto;background:#e8f8ef;color:#0f8a46">{icon("badge-check", 12, "#0f8a46")}Liste vérifiée sur le site de l'école · 06/11/2026</span></div>
        <p class="small mute" style="margin:4px 0 6px">Pièces à joindre à ta candidature (format PDF, JPG ou PNG, 8 Mo maximum chacune). Tu les déposes une fois dans « Mes documents » : elles servent pour toutes tes candidatures.</p>
        {lignes}
        <div style="margin-top:14px;border-radius:14px;background:#f6f8fe;padding:14px;display:flex;flex-direction:column;gap:8px"><b style="font-size:14px">À fournir plus tard, à l'inscription définitive</b>{insc}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px;border:2px solid {B}">
        <div style="display:flex;gap:12px;align-items:center"><span style="width:52px;height:64px;border-radius:8px;background:#fdecec;display:flex;align-items:center;justify-content:center;font-weight:800;color:#d42a50;font-size:12px">PDF</span>
          <span><b>Fiche de candidature IIHEM</b><span class="small mute" style="display:block">7 pages · 412 Ko · source : iihem.ac.ma</span></span></div>
        <span class="btn" style="background:{B};color:#fff">{icon("download", 16, "#fff")}Télécharger la fiche</span>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#3b4566">
          <span style="display:flex;gap:8px"><b style="color:{B}">1</b>Télécharge et imprime la fiche (ou remplis-la sur ton ordinateur)</span>
          <span style="display:flex;gap:8px"><b style="color:{B}">2</b>Remplis, date et signe (« lu et approuvé »)</span>
          <span style="display:flex;gap:8px"><b style="color:{B}">3</b>Scanne-la ou prends-la en photo, puis téléverse-la dans ta candidature</span></div>
      </div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:8px"><b>Frais de dossier</b><span style="font-size:24px;font-weight:800">200 MAD</span><span class="small mute">≈ 12 200 F CFA · payés en ligne à l'envoi</span>
        <span class="btn" style="background:#ffc21a;margin-top:6px">Candidater à cette formation</span></div>
    </div>
  </div>
  <div {NOTE} style="left:560px;top:170px">Liste propre à l'école (sinon : liste standard Navigoal)</div>
  <div {NOTE} style="left:1150px;top:560px">Fiche de l'école : affichée seulement si elle en a une</div>
</div>"""


# ---------------------------------------------------------------- 2. Élève : constituer son dossier
def eleve_dossier():
    etats = {"fiche_candidature": "fiche", "identite": "ok", "photo": "ok", "acte_naissance": "manque", "bulletins": "ok", "releve_bac": "ok", "diplome": "attente", "prise_en_charge": "manque"}
    rows = ""
    for c, l, ph in PIECES:
        if c not in etats:
            continue
        t, k = pastille(etats[c])
        if etats[c] == "ok":
            act = f'<span class="small" style="display:flex;gap:6px;align-items:center;color:#3b4566">{icon("file-text", 14, "#6b7493")}{c}.pdf</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:7px 10px;font-size:12px">Remplacer</span>'
        elif etats[c] == "fiche":
            act = f'<span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:7px 10px;font-size:12px">{icon("download", 13, B)}Télécharger la fiche</span><span class="btn" style="background:{B};color:#fff;padding:7px 10px;font-size:12px">{icon("upload", 13, "#fff")}Téléverser remplie</span>'
        elif etats[c] == "attente":
            act = f'<span class="small mute">Diplôme attendu en juillet : dépose ton attestation de réussite dès réception</span>'
        else:
            act = f'<span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:7px 10px;font-size:12px">{icon("folder-open", 13, B)}Choisir dans mes documents</span><span class="btn" style="background:{B};color:#fff;padding:7px 10px;font-size:12px">{icon("upload", 13, "#fff")}Téléverser</span>'
        rows += f'<tr><td style="width:36%"><b style="font-size:13.5px">{l}</b></td><td><span class="chip {k}">{t}</span></td><td><div style="display:flex;gap:8px;align-items:center;justify-content:flex-end">{act}</div></td></tr>'
    return f"""<div class="frame" style="width:1440px;height:860px"><div class="titre-cadre">2 · Élève : constituer son dossier de candidature</div>
  {menu([("layout-dashboard", "Tableau de bord"), ("send", "Mes candidatures"), ("folder-open", "Mes documents"), ("compass", "Orientation"), ("house", "Logement"), ("credit-card", "Paiements"), ("message-circle", "Conseiller")], "Mes candidatures", "Espace élève")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:flex;flex-direction:column;gap:16px">
    <span class="small mute">Mes candidatures › IIHEM · Bachelor en Business Administration</span>
    <div style="display:flex;align-items:center;gap:14px"><b style="font-size:26px">Mon dossier pour l'IIHEM</b><span class="chip y">Brouillon</span></div>
    <div class="card" style="padding:16px 18px;display:flex;align-items:center;gap:18px">
      <span style="font-size:30px;font-weight:800;color:{B}">5/8</span><div style="flex:1"><b>pièces prêtes</b><div class="bar" style="margin-top:8px"><span style="position:absolute;left:0;top:0;bottom:0;width:62%;border-radius:9px;background:{B}"></span></div></div>
      <span class="small mute" style="max-width:330px">Il reste la fiche de candidature, l'acte de naissance et l'engagement de prise en charge.</span></div>
    <div class="card" style="padding:4px 8px"><table><thead><tr><th>Pièce demandée par l'école</th><th>État</th><th style="text-align:right">Action</th></tr></thead><tbody>{rows}</tbody></table></div>
    <div style="display:flex;gap:12px;align-items:center"><span class="btn" style="background:#e6eaf3;color:#8a93a8">Envoyer ma candidature (200 MAD)</span><span class="small mute">Le bouton s'active quand toutes les pièces obligatoires sont déposées.</span>
      <span class="btn" style="margin-left:auto;background:#fff;border:1px solid #e6eaf3">{icon("message-circle", 15, B)}Une question à l'école</span></div>
  </div>
  <div {NOTE} style="left:900px;top:190px">Fiche de l'école : télécharger, remplir, signer, renvoyer</div>
  <div {NOTE} style="left:900px;top:520px">Pièces déjà déposées réutilisées d'une candidature à l'autre</div>
</div>"""


# ---------------------------------------------------------------- 3. Téléphone : téléverser
def mobile():
    return f"""<div class="frame" style="width:390px;height:820px;background:#fff"><div class="titre-cadre">3 · Téléphone : téléverser une pièce</div>
  <div style="height:56px;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 16px;gap:10px">{icon("arrow-left", 20, "#0b1533")}<b>Fiche de candidature</b></div>
  <div style="padding:18px 16px;display:flex;flex-direction:column;gap:14px">
    <div style="border-radius:16px;background:#fff7dd;padding:14px;font-size:13px;line-height:1.5;color:#6b3d00">Remplis et signe la fiche de l'IIHEM, puis envoie-la ici. Toutes les pages dans un seul PDF, ou une photo par page.</div>
    <div style="border:2px dashed #bcd2ff;border-radius:18px;padding:22px;display:flex;flex-direction:column;align-items:center;gap:10px;background:#f6f8fe">{icon("camera", 34, B)}<b>Prendre en photo</b><span class="small mute">Pose la feuille à plat, bien éclairée</span></div>
    <div style="border:1.5px solid #e6eaf3;border-radius:18px;padding:16px;display:flex;align-items:center;gap:12px">{icon("file-up", 26, B)}<span><b>Choisir un fichier</b><span class="small mute" style="display:block">PDF, JPG ou PNG · 8 Mo maximum</span></span></div>
    <b style="font-size:14px;margin-top:4px">Pages ajoutées</b>
    <div style="display:flex;gap:10px">{"".join(f'<div style="width:80px;height:104px;border-radius:10px;background:#eef1f8;display:flex;align-items:flex-end;justify-content:center;padding:6px;font-size:11px;font-weight:700;color:#5b6478">Page {n}</div>' for n in (1, 2, 3))}<div style="width:80px;height:104px;border-radius:10px;border:2px dashed #d6dcea;display:flex;align-items:center;justify-content:center">{icon("plus", 22, "#8a93a8")}</div></div>
    <span class="btn" style="background:{B};color:#fff;padding:14px;margin-top:8px">Envoyer (3 pages réunies en un PDF)</span>
  </div>
  <div {NOTE} style="left:190px;top:420px;max-width:180px">Plusieurs photos réunies en un seul PDF</div>
</div>"""


# ---------------------------------------------------------------- 4. Établissement : réglages du dossier
def ecole_reglages():
    coches = [("fiche_candidature", True), ("identite", True), ("photo", True), ("acte_naissance", True), ("bulletins", True), ("releve_bac", True), ("diplome", True), ("cv", False), ("lettre_motivation", False), ("prise_en_charge", True)]
    lib = dict((c, l) for c, l, _ in PIECES)
    cs = "".join(f'<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;border:1px solid {"#bcd2ff" if on else "#e6eaf3"};background:{"#f3f6ff" if on else "#fff"}"><span style="width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:{B if on else "#fff"};border:1.5px solid {B if on else "#c9d0de"}">{icon("check", 12, "#fff") if on else ""}</span><span style="font-size:13.5px">{lib[c]}</span></div>' for c, on in coches)
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">4 · Établissement : réglages du dossier de candidature</div>
  {menu(ECOLE + [("folder-cog", "Dossier de candidature")], "Dossier de candidature", "IIHEM · Rabat")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:grid;grid-template-columns:1fr 400px;gap:28px">
    <div style="display:flex;flex-direction:column;gap:14px">
      <b style="font-size:26px">Dossier de candidature</b><span class="small mute">Ces réglages s'appliquent à toutes vos formations, sauf si une formation a sa propre liste.</span>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px"><b>Pièces demandées</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">{cs}</div>
        <b style="margin-top:8px">Pièces propres à votre école</b>
        <div style="display:flex;gap:8px"><div class="field" style="flex:1">Attestation de niveau d'anglais (TOEFL, si disponible)</div><span class="chip" style="background:#eef1f8;color:#3b4566">facultative</span>{icon("trash-2", 16, "#8a93a8")}</div>
        <span class="btn" style="background:#fff;border:1px dashed #bcd2ff;color:{B};width:fit-content">{icon("plus", 14, B)}Ajouter une pièce</span>
        <b style="margin-top:8px">À l'inscription définitive</b><div style="display:flex;gap:8px;flex-wrap:wrap">{"".join(f'<span class="chip" style="background:#eef2ff;color:{B}">{icon("check", 12, B)}{l}</span>' for c, l, ph in PIECES if ph == "inscription")}</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px"><b>Votre fiche de candidature</b>
        <div style="display:flex;gap:12px;align-items:center;border:1px solid #e6eaf3;border-radius:14px;padding:12px"><span style="width:44px;height:54px;border-radius:8px;background:#fdecec;display:flex;align-items:center;justify-content:center;font-weight:800;color:#d42a50;font-size:11px">PDF</span>
          <span style="flex:1"><b style="font-size:14px">dossier_inscription_IIHEM.pdf</b><span class="small mute" style="display:block">mise en ligne le 06/11/2026 · 1 248 téléchargements</span></span>{icon("eye", 18, "#6b7493")}</div>
        <span class="btn" style="background:{B};color:#fff">{icon("upload", 15, "#fff")}Remplacer par une nouvelle version</span>
        <span class="small mute">PDF uniquement, 8 Mo maximum. Les candidats qui ont déjà téléchargé l'ancienne version sont prévenus.</span></div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:8px;background:#f6f8fe;box-shadow:none"><b style="font-size:14px">Ce que voit le candidat</b><span class="small mute">8 pièces obligatoires, 1 facultative, et votre fiche à télécharger, remplir et renvoyer.</span><span class="small" style="color:{B};font-weight:800">Voir l'aperçu →</span></div>
    </div>
  </div>
  <div {NOTE} style="left:1050px;top:120px">L'école met en ligne sa fiche (ou Navigoal la récupère sur son site)</div>
</div>"""


# ---------------------------------------------------------------- 5. Établissement : dossier reçu
def ecole_dossier():
    pieces = [("Fiche de candidature remplie", "fiche_IIHEM_remplie.pdf", "g"), ("Passeport", "passeport.pdf", "g"), ("Photo d'identité", "photo.jpg", "g"), ("Acte de naissance", "acte_naissance.pdf", "g"), ("Bulletins 1re et terminale", "bulletins.pdf", "g"), ("Relevé de notes du bac", "releve_bac.pdf", "g"), ("Diplôme du bac", "—", "y"), ("Engagement de prise en charge", "prise_en_charge.pdf", "g")]
    rows = "".join(f'<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #eef1f8">{icon("file-check-2" if k == "g" else "file-clock", 18, "#0f8a46" if k == "g" else "#a55a00")}<b style="font-size:13.5px;width:230px">{t}</b><span class="small mute" style="flex:1">{f}</span>{icon("eye", 17, "#6b7493") if k == "g" else ""}{icon("download", 17, "#6b7493") if k == "g" else '<span class="chip y">attendu en juillet</span>'}</div>' for t, f, k in pieces)
    return f"""<div class="frame" style="width:1440px;height:820px"><div class="titre-cadre">5 · Établissement : dossier reçu</div>
  {menu(ECOLE, "Candidatures", "IIHEM · Rabat")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:grid;grid-template-columns:1fr 380px;gap:26px">
    <div style="display:flex;flex-direction:column;gap:14px">
      <span class="small mute">Candidatures › Amina Mba · Bachelor en Business Administration</span>
      <div style="display:flex;gap:12px;align-items:center"><b style="font-size:26px">Amina Mba</b><span class="chip v">En vérification</span><span class="chip" style="background:#eef1f8;color:#3b4566">Gabon · bac D 2027</span></div>
      <div class="card" style="padding:8px 20px">{rows}</div>
      <div style="display:flex;gap:10px"><span class="btn" style="background:#fff;border:1px solid #e6eaf3">{icon("download", 15, B)}Tout télécharger (ZIP)</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3">{icon("printer", 15, B)}Imprimer le dossier</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px"><b>Demander une pièce</b><div class="field">Acte de naissance traduit en français</div><div class="field" style="height:70px;align-items:flex-start;color:#8a93a8">Message au candidat (facultatif)</div>
        <span class="btn" style="background:{B};color:#fff">Envoyer la demande</span></div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px"><b>Décision</b><div style="display:flex;gap:8px"><span class="btn" style="background:#0f8a46;color:#fff;flex:1">Dossier complet</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3;flex:1">Refuser</span></div></div>
    </div>
  </div>
</div>"""


# ---------------------------------------------------------------- 6. Admin : audience
def audience():
    kpis = [("Visiteurs", "18 420", "+12 %"), ("Pages vues", "96 310", "+9 %"), ("Pages par visite", "5,2", "+0,3"), ("Inscriptions", "612", "3,3 % des visiteurs")]
    kp = "".join(f'<div class="card" style="padding:16px"><span class="small mute">{t}</span><b style="display:block;font-size:26px;margin-top:4px">{v}</b><span class="small" style="color:#0f8a46;font-weight:700">{d}</span></div>' for t, v, d in kpis)
    pts = [30, 34, 31, 38, 44, 41, 47, 52, 49, 58, 62, 60, 66, 72, 70, 76, 81, 79, 88, 92, 90, 97, 101, 98, 104, 110, 108, 115, 121, 118]
    w, h = 700, 150
    poly = " ".join(f"{i * w / (len(pts) - 1):.0f},{h - p * h / 130:.0f}" for i, p in enumerate(pts))
    pays = [("GA", "Gabon", 6120), ("MA", "Maroc", 3410), ("CM", "Cameroun", 2380), ("SN", "Sénégal", 1960), ("CI", "Côte d'Ivoire", 1540), ("CG", "Congo", 980), ("FR", "France", 720)]
    mx = pays[0][2]
    pr = "".join(f'<div style="display:flex;align-items:center;gap:10px;font-size:13px"><span class="chip" style="background:#eef1f8;color:#3b4566;width:34px;justify-content:center;padding:3px">{c}</span><span style="width:96px">{n}</span><div class="bar" style="flex:1"><span style="position:absolute;left:0;top:0;bottom:0;width:{v / mx * 100:.0f}%;border-radius:9px;background:{B}"></span></div><b style="width:52px;text-align:right">{v:,}</b></div>'.replace(",", " ") for c, n, v in pays)
    pages = [("/", "Accueil", 18200), ("/orientation/", "Test d'orientation", 9420), ("/etablissements/", "Établissements", 8130), ("/formations/", "Formations", 6970), ("/navilease/residences/", "Résidences universitaires", 4210), ("/etablissements/ma-um6ss/", "UM6SS", 2980), ("/devis/", "Devis parents", 2640), ("/navitravel/", "NaviTravel", 1890)]
    pg = "".join(f'<tr><td><b style="font-size:13px">{t}</b><span class="small mute" style="display:block">{u}</span></td><td style="text-align:right;font-weight:800">{v:,}</td></tr>'.replace(",", " ") for u, t, v in pages)
    sources = [("Recherche Google", 38), ("Direct", 24), ("WhatsApp", 14), ("Facebook", 11), ("Campagne « Trouve ta voie »", 9), ("Autres", 4)]
    sr = "".join(f'<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #eef1f8"><span>{t}</span><b>{v} %</b></div>' for t, v in sources)
    return f"""<div class="frame" style="width:1440px;height:1120px"><div class="titre-cadre">6 · Administrateur : audience</div>
  {menu(ADMIN[:1] + [("chart-line", "Audience")] + ADMIN[1:], "Audience", "Administration")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:12px"><b style="font-size:26px">Audience</b><span class="chip" style="background:#e8f8ef;color:#0f8a46">{icon("radio", 12, "#0f8a46")}43 visiteurs en ce moment</span>
      <span style="margin-left:auto;display:flex;gap:6px">{"".join(f'<span class="chip" style="padding:7px 12px;{"background:#0b1533;color:#fff" if t == "30 jours" else "background:#fff;border:1px solid #e6eaf3;color:#3b4566"}">{t}</span>' for t in ["Aujourd'hui", "7 jours", "30 jours", "12 mois"])}</span>
      <span class="chip" style="padding:7px 12px;background:#fff;border:1px solid #e6eaf3;color:#3b4566">Tous les services {icon("chevron-down", 13, "#3b4566")}</span><span class="chip" style="padding:7px 12px;background:#fff;border:1px solid #e6eaf3;color:#3b4566">Tous les pays {icon("chevron-down", 13, "#3b4566")}</span>
      <span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:7px 12px">{icon("download", 14, B)}CSV</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">{kp}</div>
    <div class="card" style="padding:18px"><b>Visiteurs par jour</b><svg width="100%" height="170" viewBox="0 0 {w} {h + 10}" preserveAspectRatio="none" style="margin-top:10px"><polyline points="{poly}" fill="none" stroke="{B}" stroke-width="2.5"/><polygon points="0,{h} {poly} {w},{h}" fill="{B}" fill-opacity=".08"/></svg></div>
    <div style="display:grid;grid-template-columns:1.1fr 1fr 0.8fr;gap:14px">
      <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px"><b>Pays des visiteurs</b>{pr}</div>
      <div class="card" style="padding:8px 14px"><b style="display:block;padding:10px 0 2px">Pages les plus visitées</b><table><tbody>{pg}</tbody></table></div>
      <div style="display:flex;flex-direction:column;gap:14px"><div class="card" style="padding:18px"><b>Provenance</b><div style="margin-top:6px">{sr}</div></div>
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:8px"><b>Appareils</b>{"".join(f'<div style="display:flex;justify-content:space-between;font-size:13px"><span style="display:flex;gap:6px">{icon(i, 15, "#6b7493")}{t}</span><b>{v} %</b></div>' for i, t, v in [("smartphone", "Téléphone", 81), ("monitor", "Ordinateur", 16), ("tablet", "Tablette", 3)])}</div></div>
    </div>
    <div class="card" style="padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">{"".join(f'<div style="border-left:4px solid {c};padding-left:12px"><b>{n}</b><span class="small mute" style="display:block">{v} pages vues · {p}</span></div>' for c, n, v, p in [(B, "Navigoal", "78 420", "81 %"), ("#2b6a4c", "Navilease", "13 960", "14 %"), ("#246c88", "NaviTravel", "3 930", "4 %")])}</div>
  </div>
  <div {NOTE} style="left:1180px;top:60px">Filtres : période, service, pays</div>
  <div {NOTE} style="left:330px;top:640px">Pays déduit de l'adresse IP (base locale, sans transmettre l'adresse à un tiers)</div>
</div>"""


# ---------------------------------------------------------------- 7. Règles
def regles():
    return f"""<div class="frame" style="width:1440px;height:560px;padding:40px"><div class="titre-cadre">7 · Règles : pièces et mesure d'audience</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
    <div class="card" style="padding:22px"><b style="font-size:17px">Dossier de candidature</b><p class="small" style="line-height:1.8;margin-top:8px">
      • Liste standard Navigoal (si l'école n'a rien précisé) : passeport ou CNI, photo, acte de naissance, bulletins de 1re et terminale, relevé de notes du bac, diplôme du bac.<br>
      • Chaque école coche ses pièces, en ajoute d'autres (obligatoires ou facultatives) et peut fixer une liste par formation.<br>
      • Fiche de candidature de l'école : mise en ligne par l'école ou récupérée par Navigoal sur son site officiel (avec la source et la date).<br>
      • L'élève dépose chaque pièce une seule fois (« Mes documents ») et la réutilise d'une candidature à l'autre.<br>
      • Pièces de l'inscription définitive (équivalence, certificat médical, originaux) demandées seulement après l'admission.<br>
      • L'envoi de la candidature n'est possible que lorsque toutes les pièces obligatoires sont déposées.</p></div>
    <div class="card" style="padding:22px"><b style="font-size:17px">Mesure d'audience</b><p class="small" style="line-height:1.8;margin-top:8px">
      • Outil intégré à Navigoal, sans cookie et sans service tiers : aucun bandeau de consentement nécessaire.<br>
      • Chaque page vue enregistre l'adresse de la page, la provenance, le type d'appareil, le pays et le service (Navigoal, Navilease, NaviTravel).<br>
      • Le pays est déduit de l'adresse IP par une base installée sur le serveur ; l'adresse IP n'est jamais conservée.<br>
      • Visiteurs uniques comptés par une empreinte anonyme qui change chaque jour.<br>
      • Robots exclus ; données détaillées gardées 13 mois, puis agrégées.<br>
      • Politique cookies et confidentialité mises à jour en conséquence.</p></div>
  </div></div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Dossier de candidature et audience</title><style>{CSS}</style></head><body>
{fiche_formation()}{eleve_dossier()}{mobile()}{ecole_reglages()}{ecole_dossier()}{audience()}{regles()}
</body></html>"""
open(os.path.join(P.OUT, "dossier.html"), "w").write(html)
print("→", os.path.join(P.OUT, "dossier.html"), f"({len(html) // 1024} Ko)")
