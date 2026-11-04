#!/usr/bin/env python3
"""Référentiel des établissements privés d'enseignement supérieur du Sénégal (destination « SN »).

Sources (data/sources/senegal/) :
- anaqsup_habilitations_*.json : habilitations institutionnelles (MESRI sur avis de l'ANAQ-Sup) ;
- anaqsup_accreditations_*.json : accréditations de programmes par l'ANAQ-Sup (valables 5 ans) ;
- liste_noire_mesri_*.json : établissements privés non reconnus par le MESRI (écartés) ;
- fiches_navigoal_2026-10.json : anciennes fiches Navigoal (site, logo, photos, coordonnées) et
  établissements inter-États (ESMT, EISMV, CESAG), régis par des conventions entre États.

Règle : seuls les établissements privés habilités (avis favorable) ou ayant au moins un programme accrédité
en cours de validité sont publiés. Labels : « Habilité par l'État » (reconnu_etat), « Programmes accrédités »
(diplomes_homologues), « Établissement inter-États » (reconnu_etat).

Sortie : data/referentiels/etablissements_superieurs_sn.json
"""
import datetime
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from build_etablissements_maroc import diplome, formation, norm  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "sources", "senegal")
REF = os.path.join(ROOT, "data", "referentiels")
ANNEE = 2026  # année de référence (rentrée 2026-2027)
VALIDITE = 5  # durée de validité d'une accréditation ANAQ-Sup

TYPE_LIBELLE = {"universite": "Université", "ecole_ingenieurs": "École d'ingénieurs", "ecole_commerce": "École de commerce / management",
                "ecole_sante": "École de santé", "institut": "Institut", "ecole_veterinaire": "École vétérinaire"}

# (motif sur le nom normalisé, id, sigle, nom, ville ou None (ville ANAQ), type) — None comme id : établissement public écarté
E = [
    (r"^afi", "sn-afi", "AFI-L'UE", "AFI – L'Université de l'Entreprise", None, "universite"),
    (r"^aims", "sn-aims", "AIMS Sénégal", "Institut Africain des Sciences Mathématiques (AIMS Sénégal)", "Mbour", "institut"),
    (r"^akademia", "sn-akademia", "Akademia", "Akademia – École de Droit et de Sciences Politiques", None, "institut"),
    (r"^batisup", "sn-batisup", "BATISUP", "BATISUP – École supérieure du Bâtiment", None, "ecole_ingenieurs"),
    (r"^bem", "sn-bem", "BEM Dakar", "BEM Dakar – Bordeaux Management School", None, "ecole_commerce"),
    (r"^bji", "sn-bji", "BJI", "Bill Jobs Institute", None, "institut"),
    (r"^cat ", "sn-cat", "CAT", "Colombe Academy of Technology", None, "ecole_ingenieurs"),
    (r"^cefas", "sn-cefas", "CEFAS", "Centre de Formation Africain du Sénégal", None, "institut"),
    (r"^ciga", "sn-ciga", "CIGA", "Centre d'Informatique et de Gestion Appliquée", None, "institut"),
    (r"^cis paix", None, None, None, None, None),  # liste noire du MESRI
    (r"^ctd", None, None, None, None, None),  # centre de formation maritime public
    (r"^centre des hautes etudes de defense", None, None, None, None, None),
    (r"^daust", "sn-daust", "DAUST", "Dakar American University of Science and Technology", "Somone", "universite"),
    (r"^dit", "sn-dit", "DIT", "Dakar Institute of Technology", None, "ecole_ingenieurs"),
    (r"^ec2lt", "sn-ec2lt", "EC2LT", "École Centrale des Logiciels Libres et de Télécommunications", None, "ecole_ingenieurs"),
    (r"^ecpi", "sn-ecpi", "ECPI", "École Centrale Polytechnique d'Ingénieurs de Dakar", None, "ecole_ingenieurs"),
    (r"^edge", "sn-edge", "EDGE", "EDGE – École supérieure d'excellence à Dakar", None, "institut"),
    (r"^edi", "sn-edi", "EDI", "École Dentaire Internationale", None, "ecole_sante"),
    (r"^ehes", "sn-ehes", "EHES", "École des Hautes Études en Science", None, "institut"),
    (r"^eia", "sn-eia", "EIA", "École Internationale des Affaires", None, "ecole_commerce"),
    (r"^elite sante", "sn-elite-sante", "Élite Santé", "Élite Santé de Keur Massar", "Keur Massar", "ecole_sante"),
    (r"^eman", None, None, None, None, None),  # École nationale de la Marine (publique)
    (r"^emia", "sn-emia", "EMIA", "EMIA de Dakar", None, "institut"),
    (r"^ensup", "sn-ensup", "ENSUP Afrique", "ENSUP Afrique – Gestion, Finances et Administration", None, "ecole_commerce"),
    (r"^epf africa", "sn-epf-africa", "EPF Africa", "EPF Africa – École Polytechnique Féminine", None, "ecole_ingenieurs"),
    (r"^esaei", "sn-esaei", "ESAEI", "École Supérieure Africaine d'Études Islamiques", None, "institut"),
    (r"^escoa", "sn-escoa", "ESCOA", "École supérieure de commerce et de l'Administration", None, "ecole_commerce"),
    (r"^esebat", "sn-esebat", "ESEBAT", "École Supérieure d'Électricité, du Bâtiment et des Travaux Publics", None, "ecole_ingenieurs"),
    (r"^esge", "sn-esge", "ESGE", "École supérieure de Génies", None, "ecole_ingenieurs"),
    (r"^esgib", "sn-esgib", "ESGIB", "École Supérieure de Génie Industriel et Biologique", None, "ecole_ingenieurs"),
    (r"^esp 221", "sn-esp221", "ESP 221", "École Supérieure Professionnelle (ESP 221)", None, "institut"),
    (r"^essen", "sn-essen", "ESSEN", "École supérieure des sciences et de l'Entrepreneuriat", None, "institut"),
    (r"^estg", "sn-estg", "ESTG", "École Supérieure des Techniques de Gestion", None, "ecole_commerce"),
    (r"^esup sante", "sn-esup-sante", "ESUP Santé", "École supérieure de Formation Professionnelle en Santé", "Saint-Louis", "ecole_sante"),
    (r"^esup", "sn-esup", "ESUP Dakar", "ESUP – École Supérieure de Commerce et de Gestion de Dakar", None, "ecole_commerce"),
    (r"^ecole sun hi", "sn-sun-hitech", "Sun Hi-Tech", "École Sun Hi-tech3 Africa", None, "institut"),
    (r"^fbs", "sn-fbs", "FBS", "Finama Business School", None, "ecole_commerce"),
    (r"^hec", "sn-hec", "HEC Dakar", "HEC Dakar – Hautes Études de Commerce", None, "ecole_commerce"),
    (r"^hemi", "sn-hemi", "HEMI", "Haute École de Management et de l'Informatique", None, "institut"),
    (r"^hepo", "sn-hepo", "HEPO", "École des Hautes Études Polytechniques de Dakar", None, "ecole_ingenieurs"),
    (r"^hekima", "sn-hekima", "Hekima Santé", "Hekima Santé – Institut supérieur de Formation professionnelle", None, "ecole_sante"),
    (r"^iacd", "sn-iacd", "IACD Barack Obama", "Institut Africain pour le Commerce et le Développement Barack Obama", None, "institut"),
    (r"^iadl", "sn-iadl", "IADL", "Institut africain pour le Développement local", "Thiès", "institut"),
    (r"^iam ", "sn-iam", "IAM", "Institut Africain de Management", None, "ecole_commerce"),
    (r"^iasm", "sn-iasm", "IASM", "Institut Africain de Santé Moderne", None, "ecole_sante"),
    (r"^iass", "sn-iass", "IASS Mame Diarra Bousso", "Institut Africain des Sciences de la Santé Mame Diarra Bousso", None, "ecole_sante"),
    (r"^icagi", "sn-icagi", "ICAGI", "Institut Communautaire Africain de Gestion et d'Ingénierie Amadou Makhtar Mbow", None, "institut"),
    (r"^idt", "sn-idt", "IDT", "Institut Dakar Tech", None, "ecole_ingenieurs"),
    (r"^ifaa", "sn-ifaa", "IFAA", "Institut de Formation en Administration des Affaires", None, "ecole_commerce"),
    (r"^ifmen", "sn-ifmen", "IFMEN", "Institut de Formation aux Métiers de l'Enseignement", None, "institut"),
    (r"^ihed", "sn-ihed", "IHED", "Institut des Hautes Études de Dakar", None, "institut"),
    (r"^ihee", "sn-ihee", "IHEE", "Institut des Hautes Études en Énergie", None, "institut"),
    (r"^imem", "sn-imem", "IMEM", "Institut des Métiers de l'Environnement et de la Métrologie", None, "institut"),
    (r"^imes", "sn-imes", "IMES (UCAO)", "Institut Mariste d'Enseignement Supérieur (UCAO)", None, "institut"),
    (r"^ipaf", "sn-ipaf", "IPAF-SRDH", "Institut Panafricain de Formation en Santé de la Reproduction et du Développement Humain", None, "ecole_sante"),
    (r"^ipaim", "sn-ipaim", "IPAIM", "Institut Privé Africain en Informatique et Management de Thiès", "Thiès", "institut"),
    (r"^ipd", "sn-ipd", "IPD Thomas Sankara", "Institut Polytechnique de Dakar Thomas Sankara", None, "ecole_ingenieurs"),
    (r"^ipe ", "sn-ipe", "IPE", "Institut Professionnel de l'Entreprise", None, "institut"),
    (r"^ipformed", "sn-ipformed", "IPFORMED", "Institut Privé de Formation et de Recherches Médicales", None, "ecole_sante"),
    (r"^ipg", "sn-ipg-isti", "IPG/ISTI", "Institut Privé de Gestion – Institut Supérieur de Technologies Industrielles", None, "institut"),
    (r"^ipji", "sn-ipji", "IPJI", "Institut des Professions Juridiques et Immobilières", None, "institut"),
    (r"^ipp ", "sn-ipp", "IPP", "Institut Polytechnique Panafricain", None, "ecole_ingenieurs"),
    (r"^iprosi", "sn-iprosi", "IPROSI", "Institut Professionnel pour la Sécurité Informatique", None, "institut"),
    (r"^iscg ucao|^ucao iscg institut superieur catholique|^ucao iscg institut superieur catholique", "sn-ucao-ziguinchor", "UCAO – ISCG Ziguinchor",
     "UCAO – Institut supérieur catholique de Gestion Mgr Maixent Coly", "Ziguinchor", "ecole_commerce"),
    (r"^ucao iscg|^ucao sg st michel", "sn-ucao-saint-michel", "UCAO Saint-Michel", "UCAO – Institut supérieur de Gestion Saint-Michel", None, "ecole_commerce"),
    (r"^ucao isaet", "sn-ucao-thies", "UCAO – ISAET", "UCAO – Institut Supérieur d'Administration des Entreprises de Thiès", "Thiès", "ecole_commerce"),
    (r"^iscom", "sn-iscom", "ISCOM", "Institut Supérieur de Commerce et de Management", None, "ecole_commerce"),
    (r"^isdb", "sn-isdb", "ISDB", "Institut Supérieur Dakar Banlieue", None, "institut"),
    (r"^isdd", "sn-isdd", "ISDD", "Institut supérieur de Droit de Dakar", None, "institut"),
    (r"^isdl", "sn-isdl", "ISDL", "Institut Supérieur de Développement Local", None, "institut"),
    (r"^iseg", None, None, None, None, None),  # liste noire du MESRI
    (r"^isep|^institut superieur d ?enseignement professionnel", None, None, None, None, None),  # ISEP publics
    (r"^isf", "sn-isf", "ISF", "Institut supérieur de Finance", None, "ecole_commerce"),
    (r"^isi ", "sn-isi", "ISI", "Institut Supérieur d'Informatique", None, "ecole_ingenieurs"),
    (r"^isja", "sn-isja", "ISJA", "Institut Sainte Jeanne d'Arc Post-Bac", None, "institut"),
    (r"^ismo", "sn-ismo", "ISMO", "Institut Supérieur de Management des Organisations", None, "institut"),
    (r"^ism ", "sn-ism", "ISM", "Institut Supérieur de Management (ISM Dakar)", None, "ecole_commerce"),
    (r"^ispp", "sn-ispp", "ISPP", "Institut Santé Plus Privé", None, "ecole_sante"),
    (r"^iup sante", "sn-iup-sante", "IUP Santé", "Institut Universitaire Professionnel de Santé", None, "ecole_sante"),
    (r"^niit", "sn-niit", "NIIT", "National Institute of Information Technology", None, "institut"),
    (r"^performics", "sn-performics", "Performics", "Performics de Thiès", "Thiès", "institut"),
    (r"^smi", "sn-smi", "SMI", "Sup' Management Intelligentsia de Thiès", "Thiès", "institut"),
    (r"^soga", "sn-soga", "SOGA", "Senegal Oil and Gas Academy", None, "institut"),
    (r"^sup ?info", "sn-supinfo", "Sup'Info", "Sup'Info – École Supérieure d'Informatique", None, "institut"),
    (r"^supdeco", "sn-supdeco", "SUPDECO", "SUPDECO – École Supérieure de Commerce de Dakar", None, "ecole_commerce"),
    (r"^thelma", "sn-thelma", "THELMA", "THELMA – Institut Tourism Hospitality Event and Luxury Management", None, "institut"),
    (r"^(uadb|uasz|ucad|ugb|ussein|uvs|ucak)\b", None, None, None, None, None),  # universités publiques
    (r"^ucab", "sn-ucab", "UCAB", "Université Cheikh Ahmadou Bamba", None, "universite"),
    (r"^uahb", "sn-uahb", "UAHB", "Université Amadou Hampâté Bâ", None, "universite"),
    (r"^udb", "sn-udb", "UDB", "Université Dakar Bourguiba", None, "universite"),
    (r"^unipro", "sn-unipro", "UNIPRO", "UNIPRO – Univers Professionnel", None, "institut"),
    (r"^unis", "sn-unis", "UNIS", "Université du Sahel", None, "universite"),
    (r"^upoa", "sn-upoa", "UPOA", "Université Polytechnique de l'Ouest Africain", None, "universite"),
    (r"^us3t", "sn-us3t", "US3T", "Université des Sciences et Technologies Tamaro Touré", None, "universite"),
    (r"^ussd", "sn-ussd", "USSD", "Université des Sciences de la Santé de Dakar", None, "universite"),
    (r"^universite euromed", "sn-euromed", "Euromed Dakar", "Université Euromed de Dakar", None, "universite"),
]
# Anciennes fiches Navigoal correspondantes (sigle des fiches -> id)
ANCIENS = {"BEM Dakar": "sn-bem", "IAM": "sn-iam", "ISI": "sn-isi", "IPD": "sn-ipd", "DIT": "sn-dit", "DAUST": "sn-daust", "UAHB": "sn-uahb",
           "UDB": "sn-udb", "UNIS": "sn-unis", "USSD": "sn-ussd", "UCAO-USM": "sn-ucao-saint-michel", "EC2LT": "sn-ec2lt", "EUROMED": "sn-euromed",
           "Ensup": "sn-ensup", "HEC Dakar": "sn-hec", "ICAGI": "sn-icagi", "IPP": "sn-ipp", "IPFORMED": "sn-ipformed", "ISDD": "sn-isdd",
           "ESEBAT": "sn-esebat", "ESGE": "sn-esge", "BATISUP": "sn-batisup", "ISM": "sn-ism", "Sup de Co": "sn-supdeco"}

# Établissements inter-États (conventions entre États membres), absents des listes ANAQ-Sup : offre relevée sur leur site officiel
INTER_ETATS = {
    "sn-esmt": dict(type="ecole_ingenieurs", description="École supérieure créée par plusieurs États d'Afrique de l'Ouest et du Centre, spécialisée dans les télécommunications, le numérique et le management des TIC.",
                    filieres=[("Licence Télécommunications et Réseaux", "Licence"), ("Licence Informatique", "Licence"), ("Diplôme d'ingénieur de conception en télécommunications", "Ingénieur"),
                              ("Master Cybersécurité", "Master"), ("Master Management des télécommunications et du numérique", "Master")]),
    "sn-eismv": dict(type="ecole_veterinaire", description="École Inter-États des Sciences et Médecine Vétérinaires, créée par des États d'Afrique francophone : doctorat vétérinaire et masters en santé animale et productions animales.",
                     filieres=[("Doctorat vétérinaire", "Doctorat"), ("Master Santé publique vétérinaire", "Master"), ("Master Productions animales et développement durable", "Master")]),
    "sn-cesag": dict(type="ecole_commerce", description="Centre Africain d'Études Supérieures en Gestion, institution de l'UEMOA : formations en gestion, finance, audit, banque et santé publique.",
                     filieres=[("Licence Banque Finance", "Licence"), ("Licence Audit et Contrôle de gestion", "Licence"), ("Master Audit et Contrôle de gestion", "Master"),
                               ("Master Banque Finance", "Master"), ("Master Gestion des Ressources Humaines", "Master"), ("Master Management des Services de Santé", "Master")]),
}
LABEL_LIBELLE = {"habilite": "Habilité par l'État", "accredite": "Programmes accrédités", "inter_etats": "Établissement inter-États"}


def charger(motif):
    f = sorted(glob.glob(os.path.join(SRC, motif)))[-1]
    return json.load(open(f, encoding="utf-8")), os.path.basename(f)


def canon(nom):
    n = norm(nom) + " "
    for motif, *rest in E:
        if re.search(motif, n):
            return rest
    raise SystemExit(f"Établissement non répertorié dans E : {nom!r}")


def ville_std(v):
    v = re.sub(r"\s*\(.*\)", "", v or "").strip()
    return {"Thies": "Thiès"}.get(v, v) or "Dakar"


def filiere(intitule, annee, etab_type, texte):
    intitule = re.sub(r"\s+", " ", intitule).strip().rstrip(".;, ")
    intitule = re.sub(r"^(\d+\s*-\s*|la |le |l')", "", intitule, flags=re.I)
    intitule = intitule[:1].upper() + intitule[1:]
    t = norm(intitule)
    dip, duree, niv = diplome(intitule, "", etab_type, None)
    if not dip and re.match(r"e ?x[eé]cutive master", t):
        dip, duree, niv = "Master", 2, "niv-bac5"
    if not dip and "docteur en medecine" in t:
        dip, duree, niv = "Doctorat en médecine", 7, "niv-bac7"
    if not dip and "docteur en pharmacie" in t:
        dip, duree, niv = "Doctorat en pharmacie", 6, "niv-bac7"
    if not dip and re.match(r"diplome d ?ingenieur", t):
        dip, duree, niv = ("Diplôme d'ingénieur technologue (Bac+4)", 4, "niv-bac3") if "technologue" in t else ("Diplôme d'ingénieur", 5, "niv-bac5")
    if not dip and re.match(r"(?i)^(dut|dts|bts)\b", intitule):
        dip, duree, niv = "Diplôme de technicien supérieur (Bac+2)", 2, "niv-bac2"
    if not dip and re.match(r"(?i)^doctorat", intitule):
        dip, duree, niv = "Doctorat", 3, "niv-bac8"
    frm, dom = formation(intitule, "", dip, etab_type)
    a = min(int(annee), ANNEE)
    fin = a + VALIDITE
    return dict(intitule=intitule, options=None, composante=None, ville=None, diplome=dip, duree_annees=duree, niveau=niv, formation=frm, domaine=dom,
                homologation=dict(statut="accreditee" if fin > ANNEE else "echue", fin=str(fin), texte=f"{texte} {a}"))


def main():
    hab, f_hab = charger("anaqsup_habilitations_*.json")
    acc, f_acc = charger("anaqsup_accreditations_*.json")
    noire, f_noire = charger("liste_noire_mesri_*.json")
    fiches, f_fiches = charger("fiches_navigoal_*.json")
    noire_norm = {norm(re.sub(r"\s*\(.*", "", x)) for x in noire["items"]}
    anciens = {ANCIENS.get(x["sigle"], x["id"]): x for x in fiches["items"]}

    etabs = {}

    def etab(nom, loc):
        r = canon(nom)
        if r[0] is None:
            return None
        id_, sigle, nom_, ville, typ = r
        if norm(sigle) in noire_norm:
            raise SystemExit(f"{sigle} figure sur la liste noire du MESRI")
        e = etabs.setdefault(id_, dict(id=id_, sigle=sigle, nom=nom_, ville=ville or ville_std(loc), type=typ, hab=None, filieres={}, non_acc=0))
        return e

    for h in hab:
        e = etab(h["nom_hab"], h.get("localisation_hab"))
        if not e:
            continue
        favorable = (h.get("avis_acc") or "").lower().endswith("favorable") and "defavorable" not in norm(h.get("avis_acc"))
        if favorable and (not e["hab"] or int(h["annee_hab"]) > int(e["hab"])):
            e["hab"] = h["annee_hab"]
        if favorable:
            for p in h.get("list_prog_hab") or []:
                fi = filiere(p, h["annee_hab"], e["type"], "Habilitation de l'établissement par le MESRI, sur avis de l'ANAQ-Sup,")
                old = e["filieres"].get(norm(fi["intitule"]))
                if not old or old["homologation"]["fin"] < fi["homologation"]["fin"]:
                    e["filieres"][norm(fi["intitule"])] = fi
    for a in acc:
        if a.get("type_acc") != "Privé":
            continue
        e = etab(a["nom_acc"], a.get("localisation_acc"))
        if not e:
            continue
        if "non" in norm(a.get("decision_acc")):
            e["non_acc"] += 1
            continue
        fi = filiere(a["diplome_acc"], a["annee_acc"], e["type"], "Programme accrédité par l'ANAQ-Sup en")
        old = e["filieres"].get(norm(fi["intitule"]))
        if not old or old["homologation"]["fin"] < fi["homologation"]["fin"]:
            e["filieres"][norm(fi["intitule"])] = fi

    items, ecartes = [], []
    for e in etabs.values():
        en_cours = sorted((f for f in e["filieres"].values() if f["homologation"]["statut"] == "accreditee"), key=lambda f: (f["niveau"] or "", f["intitule"]))
        echues = sorted((f for f in e["filieres"].values() if f["homologation"]["statut"] == "echue"), key=lambda f: f["intitule"])
        if e["hab"]:
            label, lib = "reconnu_etat", LABEL_LIBELLE["habilite"]
            rec = f"Habilitation institutionnelle du MESRI sur avis favorable de l'ANAQ-Sup ({e['hab']})"
        elif en_cours:
            label, lib = "diplomes_homologues", LABEL_LIBELLE["accredite"]
            rec = f"{len(en_cours)} programme{'s' if len(en_cours) > 1 else ''} accrédité{'s' if len(en_cours) > 1 else ''} par l'ANAQ-Sup"
        else:
            ecartes.append(e["sigle"])
            continue
        old = anciens.get(e["id"], {})
        items.append(item(e["id"], e["nom"], e["sigle"], e["ville"], e["type"], "prive", label, lib, rec, en_cours, echues, old,
                          ["ANAQ-Sup (anaqsup.sn) — habilitations et accréditations", "MESRI — liste des établissements privés non reconnus (contrôle)"]))

    for id_, x in INTER_ETATS.items():
        old = anciens[id_]
        fil = []
        for intitule, niv in x["filieres"]:
            dip, duree, nv = diplome(intitule, "", x["type"], None)
            if niv == "Ingénieur":
                dip, duree, nv = "Diplôme d'ingénieur", 5, "niv-bac5"
            if niv == "Doctorat":
                dip, duree, nv = "Doctorat vétérinaire", 6, "niv-bac7"
            frm, dom = formation(intitule, "", dip, x["type"])
            fil.append(dict(intitule=intitule, options=None, composante=None, ville=None, diplome=dip, duree_annees=duree, niveau=nv, formation=frm, domaine=dom,
                            homologation=dict(statut="accreditee", fin="—", texte="Diplôme reconnu par les États membres de l'institution")))
        it = item(id_, old["nom"], old["sigle"], old["ville"], x["type"], "inter_etats", "reconnu_etat", LABEL_LIBELLE["inter_etats"],
                  "Institution inter-États créée par convention entre États africains", fil, [], old, ["Site officiel de l'établissement"])
        it["description"] = x["description"]
        items.append(it)

    items.sort(key=lambda i: (i["ville"] != "Dakar", i["nom"]))
    out = {
        "_meta": {
            "referentiel": "etablissements_superieurs", "version": "1.0.0", "date": datetime.date.today().isoformat(), "plateforme": "Navigoal",
            "destination": "SN", "annee_reference": f"{ANNEE}-{ANNEE + 1}",
            "regle": "Établissements privés habilités par le MESRI sur avis favorable de l'ANAQ-Sup (« Habilité par l'État ») ou ayant au moins un programme accrédité "
                     "par l'ANAQ-Sup en cours de validité, 5 ans (« Programmes accrédités ») ; établissements inter-États. Établissements de la liste noire du MESRI écartés.",
            "labels": LABEL_LIBELLE, "types": TYPE_LIBELLE,
            "sources": [f"data/sources/senegal/{n}" for n in (f_hab, f_acc, f_noire, f_fiches)] + ["https://anaqsup.sn"],
            "ecartes_sans_programme_en_cours": sorted(ecartes),
        },
        "items": items,
    }
    json.dump(out, open(os.path.join(REF, "etablissements_superieurs_sn.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    n = sum(len(i["filieres"]) for i in items)
    print(f"{len(items)} établissements ({sum(i['label'] == 'reconnu_etat' for i in items)} habilités ou inter-États), {n} programmes en cours ; écartés : {', '.join(sorted(ecartes)) or 'aucun'}")


def item(id_, nom, sigle, ville, typ, statut, label, lib, rec, filieres, echues, old, sources):
    return dict(
        id=id_, nom=nom, sigle=sigle, pays="SN", ville=ville, type=typ, type_libelle=TYPE_LIBELLE[typ], statut=statut,
        label=label, label_libelle=lib, reconnaissance=rec, reconnaissance_en_cours=False,
        site_web=old.get("site_web"), annee_creation=old.get("annee_creation"), adresse=None, autorisation=None, description=None,
        coordonnees=old.get("coordonnees"), wikidata=old.get("wikidata"),
        formations=sorted({f["formation"] for f in filieres if f["formation"]}), filieres=filieres, filieres_echues=echues, offre_indicative=False,
        logo=old.get("logo"), photos=old.get("photos", []), geo=None, sources=sources,
    )


if __name__ == "__main__":
    main()
