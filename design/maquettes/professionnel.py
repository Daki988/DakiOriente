#!/usr/bin/env python3
"""Maquettes « Formation professionnelle » (novembre 2026).

Deux nouvelles familles d'établissements, dans la même liste que le supérieur, avec leur propre label :
  - école professionnelle accréditée par l'État (loi 13.00) : diplômes d'État — technicien spécialisé,
    technicien, qualification, spécialisation ;
  - centre de certification : prépare des certifications reconnues par la profession (Cisco, Microsoft,
    Autodesk, comptabilité, logistique, langues), sans diplôme d'État — la différence doit sauter aux yeux.

1. Public : /etablissements avec le filtre « Type d'établissement » (supérieur, professionnel, certification)
2. Public : fiche d'une école professionnelle accréditée (diplômes d'État, filières, arrêté)
3. Public : fiche d'un centre de certification (certifications préparées, certificateur, mise en garde)
4. Public : /formations — les formations professionnelles courtes dans la même liste que les licences
5. Administrateur : ajouter ou vérifier un établissement professionnel ou un centre certifiant (justificatif)

Usage : python3 design/maquettes/professionnel.py <dossier icônes lucide>
Sortie : design/maquettes/out/professionnel.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402

icon, CSS, menu, ADMIN, LOGO = P.icon, P.CSS, P.menu, P.ADMIN, P.LOGO
B = "#1a47f5"
VERT = "#0f8a46"
ORANGE = "#a55a00"
VIOLET = "#6c4bd8"
ADM = ADMIN[:4] + [("shield-check", "Homologations")] + ADMIN[4:]


def entete_public(actif="Établissements"):
    onglets = ["Accueil", "Métiers", "Formations", "Établissements", "Villes", "Orientation", "Ressources"]
    liens = "".join(
        f'<span style="font-size:13.5px;font-weight:700;color:{B if t == actif else "#3b4566"};'
        f'{"border-bottom:2px solid " + B + ";padding-bottom:3px" if t == actif else ""}">{t}</span>'
        for t in onglets)
    return f"""<div style="height:72px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;gap:26px;padding:0 36px">
  <img src="{P.WORDMARK}" style="height:26px"><div style="display:flex;gap:18px;align-items:center">{liens}</div>
  <span style="margin-left:auto;display:flex;gap:10px"><span class="btn ghost">Se connecter</span><span class="btn sun">S'inscrire</span></span></div>"""


def label_chip(kind):
    """Pastille de label : les deux nouveaux labels se distinguent au premier coup d'œil."""
    d = {
        "reconnu": ("shield-check", "Reconnu par l'État", "g", VERT),
        "homologue": ("badge-check", "Diplômes homologués", "g", VERT),
        "pro": ("hard-hat", "École professionnelle accréditée", "y", ORANGE),
        "certif": ("award", "Centre de certification", "v", VIOLET),
        "autorise": ("file-check", "Établissement autorisé", "b", B),
    }[kind]
    return f'<span class="chip {d[2]}">{icon(d[0], 13, d[3])}{d[1]}</span>'


# ---------------------------------------------------------------- 1. Liste publique
def liste():
    familles = [("graduation-cap", "Enseignement supérieur", "103", False),
                ("hard-hat", "Formation professionnelle", "38", True),
                ("award", "Centres de certification", "12", False)]
    tuiles = "".join(
        f'''<div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:12px;
        {"border-color:#1a47f5;box-shadow:0 0 0 3px #eef2ff" if on else ""}">
        {icon(ic, 22, B if on else "#5b6478")}<span><b style="font-size:14px">{t}</b>
        <span class="small mute" style="display:block">{n} établissements</span></span></div>'''
        for ic, t, n, on in familles)

    def carte(nom, sigle, ville, logo, kind, lignes, prix, extra=""):
        return f"""<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <img src="{logo}" style="width:46px;height:46px;border-radius:12px;object-fit:contain;border:1px solid #eef1f8;background:#fff">
        <span style="min-width:0"><b style="font-size:16px">{sigle}</b><span class="small mute" style="display:block">{nom}</span></span>
      </div>
      {label_chip(kind)}
      <div style="display:flex;flex-direction:column;gap:5px;font-size:13px;color:#3b4566">{lignes}</div>
      <div style="border-top:1px solid #eef1f8;padding-top:9px;display:flex;justify-content:space-between;align-items:center">
        <span class="small mute">{icon("map-pin", 13, "#8a93a8")} {ville}</span><b style="font-size:13px">{prix}</b></div>{extra}</div>"""

    l1 = carte("Institut spécialisé de technologie appliquée privé — Casablanca", "ISTA Privé Casa", "Casablanca", LOGO["esa"], "pro",
               "<span>Technicien spécialisé · 2 ans après le bac</span><span>6 filières accréditées</span>", "24 000 MAD/an")
    l2 = carte("Centre de formation et de certification réseaux", "NetSkills Academy", "Rabat", LOGO["emsi"], "certif",
               "<span>Cisco CCNA, Microsoft Azure</span><span>Certifications de la profession, pas un diplôme d'État</span>", "9 500 MAD / parcours")
    l3 = carte("École supérieure d'ingénierie — campus de Casablanca", "EMSI", "Casablanca", LOGO["emsi"], "homologue",
               "<span>Ingénieur d'État · 5 ans</span><span>20 filières homologuées</span>", "44 000 MAD/an")
    l4 = carte("Institut de management hôtelier privé", "IMH Privé", "Marrakech", LOGO["uir"], "pro",
               "<span>Technicien · 2 ans après la 3ᵉ</span><span>Cuisine, service, réception</span>", "18 000 MAD/an")

    return f"""<div class="frame" style="width:1440px;height:1180px"><div class="titre-cadre">1 · Public : les trois familles dans la même liste</div>
  {entete_public()}
  <div style="padding:24px 36px;display:flex;flex-direction:column;gap:18px">
    <div><b style="font-size:28px">Établissements au Maroc</b>
      <p class="mute" style="font-size:14px;margin-top:4px">153 établissements privés vérifiés : universités et écoles supérieures, écoles professionnelles accréditées par l'État, centres de certification.</p></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">{tuiles}</div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="field" style="width:320px">{icon("search", 16, "#8a93a8")}<span class="mute">Nom, sigle, filière…</span></span>
      <span class="field" style="width:170px">Ville : toutes</span>
      <span class="field" style="width:210px">Diplôme : tous</span>
      <span class="field" style="width:190px">Budget : tous</span>
      <span class="chip y">{icon("hard-hat", 13, ORANGE)}Formation professionnelle {icon("x", 12, ORANGE)}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">{l1}{l4}{l2}{l3}</div>
    <div class="card" style="padding:16px;display:flex;gap:12px;align-items:flex-start;background:#fffaf0;border-color:#f3e6bd">
      {icon("info", 20, ORANGE)}<span style="font-size:13.5px;line-height:1.6;color:#3b4566">
      <b>Comment lire les labels.</b> « École professionnelle accréditée » : l'État a accrédité ses filières, le diplôme est un diplôme d'État
      (technicien spécialisé, technicien). « Centre de certification » : l'organisme prépare à une certification reconnue par la profession
      (Cisco, Microsoft, comptabilité, langues) — utile sur un CV, mais ce n'est pas un diplôme d'État et il n'y a pas d'équivalence automatique.</span></div>
  </div>
  <div class="note" style="left:36px;top:690px">Un seul parcours : les trois familles se candidatent de la même façon, et apparaissent dans la même recherche.</div>
</div>"""


# ---------------------------------------------------------------- 2. Fiche école professionnelle
def fiche_pro():
    filieres = [("Développement digital", "Technicien spécialisé", "2 ans", "2029-2030"),
                ("Gestion des entreprises", "Technicien spécialisé", "2 ans", "2029-2030"),
                ("Électromécanique des systèmes automatisés", "Technicien spécialisé", "2 ans", "2028-2029"),
                ("Agent technique de vente", "Technicien", "2 ans", "2028-2029"),
                ("Froid et génie thermique", "Qualification", "1 an", "2027-2028")]
    tr = "".join(f"""<tr><td><b>{f}</b></td><td>{d}</td><td>{du}</td>
      <td><span class="chip g">{icon("check", 12, VERT)}Accréditée jusqu'en {fin}</span></td></tr>""" for f, d, du, fin in filieres)
    return f"""<div class="frame" style="width:1440px;height:1100px"><div class="titre-cadre">2 · Public : fiche d'une école professionnelle accréditée</div>
  {entete_public()}
  <div style="padding:24px 36px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;gap:16px;align-items:flex-start">
      <img src="{LOGO['esa']}" style="width:76px;height:76px;border-radius:18px;object-fit:contain;border:1px solid #eef1f8;background:#fff">
      <div style="flex:1"><b style="font-size:26px">ISTA Privé Casablanca</b>
        <p class="mute" style="font-size:14px;margin-top:3px">Institut spécialisé de technologie appliquée privé · Casablanca, Maroc</p>
        <div style="display:flex;gap:8px;margin-top:9px">{label_chip("pro")}
          <span class="chip b">{icon("hard-hat", 13, B)}Formation professionnelle</span>
          <span class="chip b">{icon("calendar", 13, B)}Créé en 2008</span></div></div>
      <span class="btn primary">Candidater</span><span class="btn ghost">Comparer</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px">
          <b style="font-size:17px">Ce que vaut le diplôme</b>
          <div style="display:flex;gap:10px;align-items:flex-start;background:#e8f8ef;border-radius:14px;padding:13px">
            {icon("shield-check", 20, VERT)}<span style="font-size:13.5px;line-height:1.6;color:#13603a">
            <b>Diplôme d'État.</b> Les filières ci-dessous sont accréditées par le département de la Formation professionnelle :
            le diplôme délivré est le diplôme national de <b>technicien spécialisé</b> (bac+2), reconnu par les employeurs et par l'administration.</span></div>
          <span class="small mute">Accréditation : arrêté n° 2317.24 du 12 juin 2024, publié au Bulletin officiel n° 7312. Navigoal republie l'information telle qu'elle figure à l'arrêté.</span>
        </div>
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:10px"><b style="font-size:17px">Filières accréditées</b>
            <span class="chip b">5 filières</span></div>
          <table><thead><tr><th>Filière</th><th>Diplôme</th><th>Durée</th><th>Accréditation</th></tr></thead><tbody>{tr}</tbody></table>
          <span class="small mute">Une filière dont l'accréditation est arrivée à échéance n'est pas publiée tant que le renouvellement n'est pas paru.</span>
        </div>
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px">
          <b style="font-size:17px">Admission</b>
          <div style="display:flex;gap:12px">
            <span class="chip b">{icon("file-text", 13, B)}Sur dossier</span>
            <span class="chip b">{icon("graduation-cap", 13, B)}Bac ou niveau bac selon la filière</span>
            <span class="chip b">{icon("calendar-check", 13, B)}Rentrée : septembre</span></div>
          <span style="font-size:13.5px;color:#3b4566;line-height:1.6">Dossier : pièce d'identité, photo, acte de naissance, relevés de notes.
          La candidature sur Navigoal est gratuite.</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px">
          <b style="font-size:16px">Coût des études</b>
          <div><span class="small mute">Scolarité annuelle publiée par l'école</span><div><b style="font-size:22px">24 000 MAD</b> <span class="small mute">/ an</span></div>
            <span class="small" style="color:{VERT};font-weight:700">≈ 1 480 000 F CFA</span></div>
          <span class="small mute">Souvent deux à trois fois moins cher qu'une licence privée, pour deux ans d'études.</span>
          <span class="btn ghost">Estimer mon budget complet</span>
        </div>
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:8px">
          <b style="font-size:16px">Après le diplôme</b>
          <span style="font-size:13.5px;color:#3b4566;line-height:1.6">Entrée dans la vie active, ou poursuite en licence professionnelle
          dans un établissement supérieur partenaire (passerelle sur dossier).</span>
          <span class="small" style="color:{B};font-weight:800">Voir les métiers préparés</span>
        </div>
      </div>
    </div>
  </div>
</div>"""


# ---------------------------------------------------------------- 3. Fiche centre de certification
def fiche_certif():
    certifs = [("Cisco CCNA – Networking", "Cisco", "3 ans", "Examen 200-301, passé au centre"),
               ("Microsoft Azure Fundamentals (AZ-900)", "Microsoft", "À vie", "Examen en ligne surveillé"),
               ("Autodesk AutoCAD Certified User", "Autodesk", "3 ans", "Examen au centre"),
               ("TOEIC – anglais professionnel", "ETS", "2 ans", "Session mensuelle")]
    tr = "".join(f"""<tr><td><b>{c}</b></td><td>{o}</td><td>{v}</td><td class="mute">{m}</td></tr>""" for c, o, v, m in certifs)
    return f"""<div class="frame" style="width:1440px;height:1020px"><div class="titre-cadre">3 · Public : fiche d'un centre de certification</div>
  {entete_public()}
  <div style="padding:24px 36px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;gap:16px;align-items:flex-start">
      <img src="{LOGO['emsi']}" style="width:76px;height:76px;border-radius:18px;object-fit:contain;border:1px solid #eef1f8;background:#fff">
      <div style="flex:1"><b style="font-size:26px">NetSkills Academy</b>
        <p class="mute" style="font-size:14px;margin-top:3px">Centre de formation et de certification · Rabat, Maroc</p>
        <div style="display:flex;gap:8px;margin-top:9px">{label_chip("certif")}
          <span class="chip b">{icon("wifi", 13, B)}Réseaux et cloud</span>
          <span class="chip b">{icon("clock", 13, B)}Parcours de 3 à 9 mois</span></div></div>
      <span class="btn primary">Demander une place</span>
    </div>
    <div class="card" style="padding:16px;display:flex;gap:12px;align-items:flex-start;background:#f7f4ff;border-color:#e2d9ff">
      {icon("triangle-alert", 20, VIOLET)}<span style="font-size:13.5px;line-height:1.6;color:#3b4566">
      <b>Ce n'est pas un diplôme d'État.</b> Ce centre prépare à des certifications délivrées par des entreprises ou des organismes
      (Cisco, Microsoft, Autodesk, ETS). Elles sont très regardées par les employeurs du secteur, mais elles ne donnent pas d'équivalence
      avec un diplôme marocain et ne remplacent pas un bac+2 ou une licence. Navigoal vérifie que le centre figure bien dans l'annuaire
      officiel de chaque organisme certificateur.</span></div>
    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px">
      <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px">
        <b style="font-size:17px">Certifications préparées</b>
        <table><thead><tr><th>Certification</th><th>Délivrée par</th><th>Validité</th><th>Examen</th></tr></thead><tbody>{tr}</tbody></table>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip g">{icon("check-check", 12, VERT)}Centre vérifié dans l'annuaire Cisco</span>
          <span class="chip g">{icon("check-check", 12, VERT)}Centre vérifié chez Autodesk</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:9px">
          <b style="font-size:16px">Coût</b>
          <div><b style="font-size:22px">9 500 MAD</b> <span class="small mute">/ parcours CCNA</span>
            <span class="small" style="display:block;color:{VERT};font-weight:700">≈ 585 000 F CFA</span></div>
          <span class="small mute">Frais d'examen de l'organisme en sus, payés directement au certificateur.</span>
        </div>
        <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:9px">
          <b style="font-size:16px">À qui ça sert</b>
          <span style="font-size:13.5px;color:#3b4566;line-height:1.6">Compléter un diplôme, se spécialiser vite, ou se remettre à niveau
          pendant ses études. À ne pas choisir comme <b>seule</b> formation après le bac.</span>
        </div>
      </div>
    </div>
  </div>
</div>"""


# ---------------------------------------------------------------- 4. Formations
def formations():
    lignes = [("Technicien spécialisé en développement digital", "pro", "Diplôme d'État · technicien spécialisé", "2 ans", "14 écoles", "à partir de 18 000 MAD/an"),
              ("Licence en informatique", "homologue", "Diplôme homologué · licence", "3 ans", "22 écoles", "à partir de 35 000 MAD/an"),
              ("Cisco CCNA – administration réseaux", "certif", "Certification de la profession · Cisco", "6 mois", "5 centres", "à partir de 8 000 MAD"),
              ("Technicien en électromécanique", "pro", "Diplôme d'État · technicien", "2 ans", "9 écoles", "à partir de 16 000 MAD/an")]
    cartes = "".join(f"""<div class="card" style="padding:16px;display:flex;gap:14px;align-items:center">
      <span style="width:52px;height:52px;border-radius:14px;background:{"#fff3cc" if k == "pro" else "#f1ecff" if k == "certif" else "#eef2ff"};
        display:flex;align-items:center;justify-content:center">{icon("hard-hat" if k == "pro" else "award" if k == "certif" else "graduation-cap", 24,
                                                                      ORANGE if k == "pro" else VIOLET if k == "certif" else B)}</span>
      <span style="flex:1"><b style="font-size:16px">{t}</b>
        <span class="small mute" style="display:block;margin-top:2px">{d} · {du}</span></span>
      {label_chip(k)}
      <span style="text-align:right"><b style="font-size:13.5px">{n}</b><span class="small mute" style="display:block">{p}</span></span>
      {icon("chevron-right", 18, "#8a93a8")}</div>""" for t, k, d, du, n, p in lignes)
    return f"""<div class="frame" style="width:1440px;height:620px"><div class="titre-cadre">4 · Public : les formations professionnelles dans la même liste</div>
  {entete_public("Formations")}
  <div style="padding:24px 36px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:flex-end;gap:16px">
      <div><b style="font-size:26px">Rechercher une formation</b>
        <p class="mute" style="font-size:14px;margin-top:3px">Licences, cycles ingénieur, diplômes professionnels d'État et certifications métiers.</p></div>
      <span style="margin-left:auto;display:flex;gap:9px">
        <span class="chip b">{icon("graduation-cap", 13, B)}Supérieur</span>
        <span class="chip y">{icon("hard-hat", 13, ORANGE)}Professionnel</span>
        <span class="chip v">{icon("award", 13, VIOLET)}Certification</span></span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">{cartes}</div>
  </div>
</div>"""


# ---------------------------------------------------------------- 5. Back-office
def backoffice():
    att = [("Institut privé de gestion de Fès", "IPG Fès", "École professionnelle", "Arrêté 2317.24 · BO 7312", "À vérifier"),
           ("NetSkills Academy", "NetSkills", "Centre de certification", "Annuaire Cisco · ID 8821", "Vérifié"),
           ("Centre Atlas Logistique", "Atlas Log", "Centre de certification", "Aucun justificatif", "Refusé")]
    tr = "".join(f"""<tr><td><b>{s}</b><span class="small mute" style="display:block">{n}</span></td><td>{t}</td><td class="mute">{j}</td>
      <td><span class="chip {"y" if e == "À vérifier" else "g" if e == "Vérifié" else "r"}">{e}</span></td>
      <td style="text-align:right"><span class="btn ghost" style="padding:7px 11px;font-size:12.5px">Ouvrir</span></td></tr>""" for n, s, t, j, e in att)
    return f"""<div class="frame" style="width:1440px;height:1000px"><div class="titre-cadre">5 · Administrateur : ajouter et vérifier un établissement professionnel</div>
  {menu(ADM, "Homologations", "Administration")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:26px 34px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:flex-end;gap:14px">
      <div><b style="font-size:25px">Établissements professionnels et centres de certification</b>
        <p class="mute" style="font-size:13.5px;margin-top:3px">Aucun répertoire officiel n'est publié pour la formation professionnelle privée :
        chaque établissement est saisi ici, avec son justificatif, et n'est publié qu'une fois vérifié.</p></div>
      <span style="margin-left:auto" class="btn primary">{icon("plus", 16, "#fff")}Ajouter un établissement</span>
    </div>
    <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:14px">
      <b style="font-size:17px">Nouvel établissement</b>
      <div style="display:flex;gap:12px">
        <div style="flex:1"><div class="label">Famille</div>
          <div style="display:flex;gap:9px">
            <span class="chip y" style="padding:9px 13px">{icon("hard-hat", 14, ORANGE)}École professionnelle accréditée</span>
            <span class="chip" style="padding:9px 13px;border:1px solid #e6eaf3;color:#5b6478">{icon("award", 14, "#5b6478")}Centre de certification</span></div></div>
      </div>
      <div style="display:flex;gap:12px">
        <div style="flex:2"><div class="label">Nom officiel</div><div class="field">Institut privé de gestion de Fès</div></div>
        <div style="flex:1"><div class="label">Sigle</div><div class="field">IPG Fès</div></div>
        <div style="flex:1"><div class="label">Ville</div><div class="field">Fès</div></div>
      </div>
      <div style="display:flex;gap:12px">
        <div style="flex:1"><div class="label">Numéro et date de l'arrêté d'accréditation</div><div class="field">2317.24 · 12 juin 2024</div></div>
        <div style="flex:1"><div class="label">Bulletin officiel</div><div class="field">n° 7312</div></div>
        <div style="flex:1"><div class="label">Fin d'accréditation</div><div class="field">2029-2030</div></div>
      </div>
      <div><div class="label">Justificatif (obligatoire)</div>
        <div class="field" style="justify-content:space-between;background:#f6f8fe">{icon("file-text", 16, B)}
          <span style="flex:1">arrete-accreditation-ipg-fes-2024.pdf</span><span class="small mute">1,2 Mo</span>{icon("eye", 15, "#8a93a8")}</div>
        <span class="small mute" style="display:block;margin-top:5px">Arrêté publié au Bulletin officiel, décision d'accréditation, ou page de l'annuaire
        de l'organisme certificateur. Sans justificatif, l'établissement reste invisible du public.</span></div>
      <div><div class="label">Filières accréditées</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip b">Développement digital · technicien spécialisé {icon("x", 11, B)}</span>
          <span class="chip b">Gestion des entreprises · technicien spécialisé {icon("x", 11, B)}</span>
          <span class="chip" style="border:1px dashed #c9d0de;color:#5b6478">{icon("plus", 12, "#5b6478")}Ajouter une filière</span></div></div>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="btn primary">Enregistrer et publier</span>
        <span class="btn ghost">Enregistrer sans publier</span>
        <span class="small mute">La publication est tracée dans le journal d'audit (qui, quand, sur quelle pièce).</span></div>
    </div>
    <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:17px">Demandes en attente</b><span class="chip y">3</span></div>
      <table><thead><tr><th>Établissement</th><th>Famille</th><th>Justificatif</th><th>État</th><th></th></tr></thead><tbody>{tr}</tbody></table>
    </div>
  </div>
  <div class="note" style="left:980px;top:150px">Les écoles peuvent aussi demander leur rattachement depuis leur espace : l'admin vérifie la pièce.</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Formation professionnelle</title>
<style>{CSS}</style></head><body>
{liste()}{fiche_pro()}{fiche_certif()}{formations()}{backoffice()}
</body></html>"""
open(os.path.join(P.OUT, "professionnel.html"), "w").write(html)
print("→", os.path.join(P.OUT, "professionnel.html"), f"({len(html) // 1024} Ko)")
