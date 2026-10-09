#!/usr/bin/env python3
"""Maquettes v2 : fiche pays détaillée, fiche établissement (photos), comparateur, parcours métier,
page « valeur ajoutée ». Réutilise les composants de build.py.

Usage : python3 design/maquettes/build_v2.py <dossier lucide-static/icons>
"""
import json
import os

from build import (ETABS, FORMATIONS, METIERS, ROOT, brand, cta_band, doc, footer, header, icon, img_b64, logo, ref, save)

PAYS = {p["id"]: p for p in ref("pays_details")}
SERIES = {s["id"]: s for s in ref("series")}
DOMAINES = {d["id"]: d for d in ref("domaines")}
NOMS = {"GA": "Gabon", "MA": "Maroc", "SN": "Sénégal"}
STATUT = {"prive": "Privé", "prive_reconnu": "Privé reconnu par l'État", "prive_non_lucratif": "Privé à but non lucratif", "inter_etats": "Inter-États"}


def photo(eid, n=0, w=900):
    ph = ETABS[eid].get("photos") or []
    if len(ph) > n:
        return img_b64(os.path.join(ROOT, ph[n]["fichier"]), w, "JPEG")
    return None


def photo_box(eid, n=0, h=200, radius=18, extra=""):
    src = photo(eid, n)
    if src:
        return f'<div style="height:{h}px;border-radius:{radius}px;overflow:hidden;{extra}"><img src="{src}" style="width:100%;height:100%;object-fit:cover"></div>'
    return f'<div style="height:{h}px;border-radius:{radius}px;background:linear-gradient(135deg,#1a47f5,#8eb4ff);display:flex;align-items:center;justify-content:center;{extra}">{icon("building-2",64,"rgba(255,255,255,.6)",1.4)}</div>'


def credit(eid, n=0):
    ph = ETABS[eid].get("photos") or []
    if len(ph) > n:
        c = ph[n].get("credit") or ""
        lic = ph[n].get("licence") or ""
        return f"Photo : {c}{' · ' + lic if lic else ''}"[:90]
    return ""


def best(country, k=3, need_photo=True):
    xs = [e for e in ETABS.values() if e["pays"] == country]
    xs.sort(key=lambda e: (-(len(e.get("photos") or [])), -len(e["formations"])))
    return [e["id"] for e in xs if (e.get("photos") or not need_photo)][:k]


def fmt(n):
    return f"{n:,}".replace(",", " ")


def chip(t, cls="chip-blue"):
    return f'<span class="chip {cls}">{t}</span>'


# =====================================================================================
# 09. FICHE PAYS DÉTAILLÉE (Maroc)
# =====================================================================================
def pays_page(code="MA"):
    P = PAYS[code]
    etabs = [e for e in ETABS.values() if e["pays"] == code]
    tops = best(code, 4)
    collage = "".join(f'<div style="position:absolute;{pos}">{photo_box(eid, 0, h, 22, f"width:{w}px;border:5px solid #fff;box-shadow:0 30px 60px -24px rgba(11,21,51,.45)")}</div>'
                      for eid, pos, w, h in zip(tops, ["left:0;top:30px", "left:300px;top:0", "left:150px;top:250px", "left:420px;top:220px"], [280, 260, 290, 190], [200, 220, 200, 170]))
    chiffres = "".join(f'<div class="col g4"><span class="muted" style="font-size:12px;font-weight:700">{a}</span><b style="font-size:17px">{b}</b></div>'
                       for a, b in [("Population", P["chiffres"]["population"]), ("Capitale", P["chiffres"]["capitale"]), ("Monnaie", P["chiffres"]["monnaie"]),
                                    ("Langues", ", ".join(P["chiffres"]["langues"][:2])), ("Établissements privés", f"{len(etabs)} sur Navigoal")])
    pourquoi = "".join(f'<div class="card row g12" style="padding:18px;border-radius:18px;align-items:flex-start"><div class="ic" style="width:40px;height:40px;background:#e8f8ef;border-radius:12px">{icon("check",20,"#0f8a46",3)}</div><span class="soft" style="font-size:14px;line-height:1.55">{t}</span></div>' for t in P["pourquoi"])
    B = P["budget"]
    mx = max(l["max"] for l in B["lignes"])
    bars = "".join(f'''<div class="col g6"><div class="row between" style="font-size:13px;font-weight:700"><span>{l["poste"]}</span><span>{fmt(l["min"])} – {fmt(l["max"])} {B["devise"]}</span></div>
<div style="position:relative;height:12px;border-radius:99px;background:#e8edfa"><div style="position:absolute;left:{l["min"]/mx*100:.0f}%;width:{(l["max"]-l["min"])/mx*100:.0f}%;height:100%;border-radius:99px;background:linear-gradient(90deg,#1a47f5,#ffc21f)"></div></div></div>''' for l in B["lignes"])
    visa = "".join(f'<div class="row g16" style="align-items:flex-start"><div class="ic" style="width:40px;height:40px;border-radius:50%;background:#1a47f5;color:#fff;font-weight:800;font-size:15px">{k+1}</div><p class="soft" style="font-size:14px;line-height:1.6;flex:1;padding-top:8px">{t}</p></div>' for k, t in enumerate(P["visa"]))
    villes = "".join(f'<div class="card col g8" style="padding:20px;border-radius:20px;flex:1"><div class="row g8">{icon("map-pin",18,"#1a47f5")}<b style="font-size:16px">{v["nom"]}</b></div><span class="muted" style="font-size:13px;line-height:1.5">{v["profil"]}</span><span style="font-size:12px;font-weight:700;color:#1a47f5">{sum(1 for e in etabs if v["nom"].split(" ")[0] in e["ville"])} établissements →</span></div>' for v in P["villes"][:5])
    ecoles = "".join(f'<div class="card" style="border-radius:20px;overflow:hidden">{photo_box(eid, 0, 130, 0)}<div class="col g8" style="padding:14px 16px;position:relative"><div style="position:absolute;top:-26px;left:14px">{logo(eid, 48)}</div><b style="font-size:14px;margin-top:22px">{ETABS[eid]["nom"][:46]}</b><span class="muted" style="font-size:12px">{ETABS[eid]["ville"]} · {STATUT.get(ETABS[eid]["statut"], "Privé")}</span></div></div>' for eid in best(code, 8, False))
    F = P["frais_prive"]
    body = f"""{header("Pays")}
<div style="position:relative;overflow:hidden;background:radial-gradient(900px 500px at 85% 20%,#dae6ff,transparent 60%),radial-gradient(700px 400px at 0% 100%,#fff3c4,transparent 60%),#f6f8fe;padding:48px 0 56px">
<div class="wrap row between" style="align-items:center">
 <div class="col g20" style="width:600px">
  <div class="row g8 muted" style="font-size:13px">Accueil {icon('chevron-right',14,'#6b7493')} Pays {icon('chevron-right',14,'#6b7493')} {P["nom"]}</div>
  <div class="row g12"><div class="ic" style="width:64px;height:44px;border-radius:10px;background:#c1272d;box-shadow:0 6px 14px rgba(0,0,0,.18)">{icon('star',24,'#006233',2.5)}</div><span class="chip chip-sun">Destination n°1 des étudiants subsahariens</span></div>
  <h1>Étudier au <span style="color:#1a47f5">{P["nom"]}</span></h1>
  <p class="soft" style="font-size:18px;line-height:1.6">{P["accroche"]}</p>
  <div class="row g12"><a class="btn btn-primary">Voir les {len(etabs)} établissements {icon('arrow-right',18,'#fff')}</a><a class="btn btn-ghost">{icon('scale',16,'#1336e0')} Comparer des écoles</a></div>
 </div>
 <div style="position:relative;width:620px;height:460px">{collage}<div class="ann" style="right:0;top:-10px">Collage photos : parallaxe au scroll + apparition décalée</div></div>
</div></div>
<div class="wrap" style="margin-top:-28px;position:relative"><div class="card row between" style="padding:22px 28px;border-radius:22px">{chiffres}</div></div>
<div class="wrap row g40" style="margin-top:56px;align-items:flex-start">
 <div class="col g32" style="flex:1">
  <div class="col g16"><div class="eyebrow">Pourquoi le {P["nom"]} ?</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{pourquoi}</div></div>
  <div class="col g16"><div class="eyebrow">Système d'études</div><div class="card col g12" style="padding:24px;border-radius:22px"><p class="soft" style="line-height:1.6">{P["systeme"]}</p>
   <div class="row g10" style="padding:14px;border-radius:14px;background:#eef4ff;align-items:flex-start">{icon('shield-check',20,'#1a47f5')}<span style="font-size:14px;line-height:1.5"><b>Reconnaissance des diplômes :</b> {P["reconnaissance"]}</span></div>
   <div class="row g10" style="font-size:14px">{icon('calendar',18,'#a55a00')}<span><b>Calendrier :</b> {P["calendrier"]}</span></div></div></div>
  <div class="col g16"><div class="eyebrow">Visa et séjour</div><div class="card col g16" style="padding:24px;border-radius:22px">{visa}</div></div>
 </div>
 <div class="col g24" style="width:440px">
  <div class="card col g16" style="padding:24px;border-radius:24px;box-shadow:0 30px 60px -24px rgba(26,71,245,.35)"><div class="row between"><h3>Budget mensuel étudiant</h3>{chip("indicatif", "chip-sun")}</div>{bars}
   <div class="row between" style="padding:14px 16px;border-radius:14px;background:linear-gradient(90deg,#0b1a4f,#1336e0);color:#fff"><span style="font-weight:700">Total estimé</span><b style="font-size:20px">{fmt(B["total_mensuel"]["min"])} – {fmt(B["total_mensuel"]["max"])} {B["devise"]}</b></div>
   <span class="muted" style="font-size:12px">{B["note"]}</span><div class="ann" style="left:20px;top:-12px">Barres qui se remplissent + total en compteur</div></div>
  <div class="card col g10" style="padding:24px;border-radius:24px"><h3>Frais de scolarité (privé)</h3><div style="font-size:28px;font-weight:800;color:#1a47f5">{fmt(F["min"])} – {fmt(F["max"])} {F["devise"]}<span class="muted" style="font-size:14px"> {F["unite"]}</span></div><span class="muted" style="font-size:13px;line-height:1.5">{F["note"]}</span></div>
  <div class="card col g10" style="padding:24px;border-radius:24px"><h3>Bon à savoir</h3>{''.join(f'<div class="row g10" style="font-size:13px;align-items:flex-start">{icon(i,16,"#1a47f5")}<span class="soft">{t}</span></div>' for i, t in [("briefcase", P["travail"]), ("heart-pulse", P["sante"]), ("wallet", "Paiement : " + ", ".join(P["paiement"]))])}</div>
  <div class="card col g10" style="padding:24px;border-radius:24px;background:linear-gradient(160deg,#fff,#fff7dd)"><div class="row g10"><div class="ic" style="width:38px;height:38px;background:#ffc21f;border-radius:10px">{icon('key-round',18,'#0b1533')}</div><b>Se loger avec Navilease</b></div><span class="muted" style="font-size:13px">Studios et colocations vérifiés près des écoles, paiement protégé depuis ton pays.</span><a class="btn btn-primary" style="padding:10px">Voir les logements</a></div>
 </div></div>
<div class="wrap col g16" style="margin-top:56px"><div class="eyebrow">Villes étudiantes</div><div class="row g16">{villes}</div></div>
<div class="wrap col g16" style="margin-top:56px"><div class="row between"><div class="col g8"><div class="eyebrow">Établissements</div><h2>Écoles et universités privées</h2></div><a class="btn btn-ghost">Tout voir {icon('arrow-right',16,'#1336e0')}</a></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">{ecoles}</div></div>
{cta_band("Prêt·e à partir au <span class='sun'>" + P["nom"] + "</span> ?", "Compare les écoles, prépare ton visa et réserve ton logement : Navigoal t'accompagne de ton pays jusqu'à ta rentrée.")}
{footer()}"""
    save(f"09-pays-{code.lower()}", doc(f"Navigoal — Étudier au {P['nom']}", body))


# =====================================================================================
# 10. FICHE ÉTABLISSEMENT
# =====================================================================================
def etab_page(eid):
    e = ETABS[eid]
    P = PAYS[e["pays"]]
    forms = [FORMATIONS[f] for f in e["formations"] if f in FORMATIONS]
    by_dom = {}
    for f in forms:
        by_dom.setdefault(f["domaine"], []).append(f)
    gallery = f"""<div class="row g12" style="height:420px">
<div style="flex:1.6;position:relative">{photo_box(eid, 0, 420, 24)}<span class="chip" style="position:absolute;left:16px;bottom:16px;background:rgba(11,21,51,.65);color:#fff">{credit(eid, 0)}</span></div>
<div class="col g12" style="flex:1">{photo_box(eid, 1, 204, 24)}<div style="position:relative">{photo_box(eid, 2, 204, 24)}<div style="position:absolute;inset:0;border-radius:24px;background:rgba(11,21,51,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;gap:8px">{icon('images',22,'#fff')} Voir toutes les photos</div></div></div></div>"""
    facts = "".join(f'<div class="col g4"><span class="muted" style="font-size:12px;font-weight:700">{a}</span><b style="font-size:15px">{b}</b></div>' for a, b in [
        ("Statut", STATUT.get(e["statut"], "Privé")), ("Ville", e["ville"]), ("Création", e.get("annee_creation") or "—"), ("Formations", f"{len(forms)} programmes"),
        ("Langue", "Français" + (" / anglais" if e["pays"] == "MA" else "")), ("Étudiants étrangers", "Accueillis ✓")])
    dom_blocks = ""
    for d, fs in list(by_dom.items())[:3]:
        rows = ""
        for f in fs[:3]:
            mets = "".join(chip(METIERS[m]["nom"][:30], "chip-violet") for m in f["metiers"][:3])
            rows += f'''<div class="row g16" style="padding:16px;border:1px solid #eef1f8;border-radius:16px;align-items:center">
<div class="col g6" style="width:330px"><b style="font-size:15px">{f["intitule"]}</b><span class="muted" style="font-size:12px">{f["diplome"]} · {f["duree_annees"]} ans · {"Sur concours" if f["mode_admission"] == "concours" else "Sur dossier"}</span></div>
<div class="col g6" style="flex:1"><span class="muted" style="font-size:11px;font-weight:800">MÈNE AUX MÉTIERS</span><div class="row g6" style="flex-wrap:wrap">{mets}</div></div>
<a class="btn btn-ghost" style="padding:8px 12px;font-size:13px">{icon('scale',14,'#1336e0')} Comparer</a></div>'''
        dom_blocks += f'<div class="col g12"><div class="row g10"><span class="chip chip-blue" style="font-size:13px;padding:7px 12px">{DOMAINES[d]["libelle"]}</span><span class="muted" style="font-size:13px">{len(fs)} programme(s)</span></div>{rows}</div>'
    similar = [x for x in ETABS.values() if x["id"] != eid and len(set(x["formations"]) & set(e["formations"])) >= 2]
    similar.sort(key=lambda x: -len(set(x["formations"]) & set(e["formations"])))
    sim = "".join(f'<div class="row g12" style="padding:12px;border:1px solid #eef1f8;border-radius:14px">{logo(x["id"],42)}<div class="col" style="flex:1"><b style="font-size:13px">{x["sigle"]}</b><span class="muted" style="font-size:12px">{x["ville"]}, {NOMS[x["pays"]]}</span></div><span class="chip chip-green">{len(set(x["formations"]) & set(e["formations"]))} formations communes</span></div>' for x in similar[:4])
    body = f"""{header("Établissements")}
<div class="wrap col g24" style="padding-top:28px">
 <div class="row g8 muted" style="font-size:13px">Accueil {icon('chevron-right',14,'#6b7493')} Établissements {icon('chevron-right',14,'#6b7493')} {e["sigle"]}</div>
 <div class="row between" style="align-items:flex-end"><div class="row g20">{logo(eid, 88)}<div class="col g8"><h1 style="font-size:44px;letter-spacing:-1.3px">{e["nom"]}</h1>
  <div class="row g8">{chip(STATUT.get(e["statut"], "Privé"), "chip-green")}{chip(e["type_libelle"])}{chip("📍 " + e["ville"] + ", " + NOMS[e["pays"]], "chip-sun")}</div></div></div>
  <div class="row g10"><a class="btn btn-ghost">{icon('heart',16,'#1336e0')} Suivre</a><a class="btn btn-ghost">{icon('scale',16,'#1336e0')} Ajouter au comparateur</a><a class="btn btn-primary">Candidater {icon('arrow-right',16,'#fff')}</a></div></div>
 <div style="position:relative">{gallery}<div class="ann" style="right:16px;top:16px">Galerie : zoom au survol, visionneuse plein écran (swipe mobile)</div></div>
 <div class="card row between" style="padding:20px 26px;border-radius:20px">{facts}</div>
</div>
<div class="wrap row g40" style="margin-top:40px;align-items:flex-start">
 <div class="col g32" style="flex:1">
  <div class="row g24" style="border-bottom:1px solid #e6eaf5">{''.join(f'<div style="padding:12px 0;font-size:14px;font-weight:700;color:{"#1a47f5" if k == 0 else "#6b7493"};border-bottom:{"3px solid #1a47f5" if k == 0 else "none"}">{t}</div>' for k, t in enumerate(["Formations & métiers", "Admission", "Frais & bourses", "Vie étudiante", "Logement", "Avis"]))}</div>
  <div class="col g8"><h2 style="font-size:28px">Formations et débouchés</h2><p class="muted">Chaque programme est relié aux métiers qu'il prépare et aux séries du bac qui y donnent accès.</p></div>
  {dom_blocks}
  <div class="card col g12" style="padding:24px;border-radius:22px"><h3>Admission des étudiants internationaux</h3>
   {''.join(f'<div class="row g12" style="align-items:flex-start"><div class="ic" style="width:30px;height:30px;border-radius:50%;background:#eef4ff;color:#1a47f5;font-weight:800;font-size:13px">{k+1}</div><span class="soft" style="font-size:14px;padding-top:4px">{t}</span></div>' for k, t in enumerate(["Dossier en ligne via Navigoal (bac ou relevés de notes, CV, lettre de motivation).", "Étude du dossier et, selon le programme, test ou entretien à distance.", "Admission, paiement des frais de réservation, attestation pour le visa.", "Arrivée : carte de séjour, logement Navilease, intégration."]))}</div>
 </div>
 <div class="col g20" style="width:380px">
  <div class="card col g14" style="padding:24px;border-radius:24px;box-shadow:0 30px 60px -24px rgba(26,71,245,.4);gap:14px"><div class="row between"><b>Ton budget annuel estimé</b>{chip("simulateur", "chip-sun")}</div>
   {''.join(f'<div class="row between" style="font-size:14px"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Frais de scolarité", "sur devis"), ("Vie (10 mois)", f'{fmt(P["budget"]["total_mensuel"]["min"]*10)} – {fmt(P["budget"]["total_mensuel"]["max"]*10)} {P["budget"]["devise"]}'), ("Visa & séjour", "voir fiche pays")])}
   <a class="btn btn-primary">Demander les frais exacts</a><span class="muted" style="font-size:12px;text-align:center">Réponse de l'établissement sous 72 h via Navigoal</span></div>
  <div class="card col g10" style="padding:22px;border-radius:22px"><b>Établissements comparables</b>{sim}<a class="btn btn-ghost" style="padding:10px">{icon('scale',16,'#1336e0')} Ouvrir le comparateur</a></div>
  <div class="card col g10" style="padding:22px;border-radius:22px;background:linear-gradient(160deg,#fff,#fff7dd)"><div class="row g10"><div class="ic" style="width:38px;height:38px;background:#ffc21f;border-radius:10px">{icon('key-round',18,'#0b1533')}</div><b>Logements à proximité</b></div><span class="muted" style="font-size:13px">12 logements vérifiés à moins de 20 min · dès {fmt(P["budget"]["lignes"][0]["min"])} {P["budget"]["devise"]}/mois</span><a class="btn btn-primary" style="padding:10px">Voir sur Navilease</a></div>
  <div class="card col g8" style="padding:22px;border-radius:22px"><b>Étudier au {P["nom"]}</b><span class="muted" style="font-size:13px">Visa, coût de la vie, reconnaissance des diplômes.</span><a style="font-size:13px;font-weight:700;color:#1a47f5">Lire la fiche pays →</a></div>
 </div></div>
{footer()}"""
    save(f"10-etablissement-{eid}", doc(f"Navigoal — {e['nom']}", body))


# =====================================================================================
# 11. COMPARATEUR
# =====================================================================================
def comparateur(fid, ids):
    F = FORMATIONS[fid]
    cols = ""
    for k, eid in enumerate(ids):
        e = ETABS[eid]
        P = PAYS[e["pays"]]
        common = [f for f in e["formations"] if f in FORMATIONS and (f == fid or set(FORMATIONS[f]["metiers"]) & set(F["metiers"]))]
        best_tag = '<span class="chip chip-sun" style="position:absolute;right:12px;top:12px">★ Meilleur choix pour toi</span>' if k == 0 else ""
        cols += f'''<div class="col" style="flex:1;background:#fff;border-radius:24px;border:{"2.5px solid #1a47f5" if k == 0 else "1px solid #e6eaf5"};overflow:hidden;box-shadow:{"0 30px 60px -24px rgba(26,71,245,.45)" if k == 0 else "0 10px 30px -14px rgba(11,21,51,.15)"}">
<div style="position:relative">{photo_box(eid, 0, 150, 0)}{best_tag}<div style="position:absolute;left:16px;bottom:-26px">{logo(eid, 56)}</div></div>
<div class="col g4" style="padding:34px 18px 14px"><b style="font-size:16px">{e["nom"][:48]}</b><span class="muted" style="font-size:12px">{e["ville"]}, {NOMS[e["pays"]]}</span></div>
{"".join(f'<div class="col g4" style="padding:12px 18px;border-top:1px solid #eef1f8;min-height:{h}px;background:{bg}"><span class="muted" style="font-size:11px;font-weight:800">{lab}</span><div style="font-size:14px;font-weight:700">{val}</div></div>' for lab, val, h, bg in [
    ("COMPATIBILITÉ AVEC TON PROFIL", f'<div class="row g8"><div class="bar" style="flex:1"><div style="width:{92-k*7}%"></div></div><span style="color:#0f8a46">{92-k*7} %</span></div>', 56, "#fbfcff"),
    ("STATUT", STATUT.get(e["statut"], "Privé"), 56, "#fff"),
    ("PROGRAMME CORRESPONDANT", "<br>".join(FORMATIONS[f]["intitule"][:42] for f in common[:2]) or "—", 76, "#fbfcff"),
    ("DIPLÔME · DURÉE", f'{F["diplome"]} · {F["duree_annees"]} ans', 56, "#fff"),
    ("ADMISSION", "Dossier + entretien" if e["type"] == "ecole_commerce" else "Dossier / concours", 56, "#fbfcff"),
    ("FRAIS DE SCOLARITÉ", f'{fmt(P["frais_prive"]["min"])} – {fmt(P["frais_prive"]["max"])} {P["frais_prive"]["devise"]}/an', 56, "#fff"),
    ("COÛT DE LA VIE / MOIS", f'{fmt(P["budget"]["total_mensuel"]["min"])} – {fmt(P["budget"]["total_mensuel"]["max"])} {P["budget"]["devise"]}', 56, "#fbfcff"),
    ("VISA (étudiant gabonais)", "Dispensé · carte de séjour" if e["pays"] == "MA" else "CEMAC/Visa · carte de séjour" if e["pays"] == "GA" else "Visa étudiant · carte de séjour", 56, "#fff"),
    ("MÉTIERS VISÉS", " ".join(chip(METIERS[m]["nom"][:22], "chip-violet") for m in F["metiers"][:2]), 76, "#fbfcff"),
    ("LOGEMENT NAVILEASE", f'{14 - k*3} logements vérifiés à &lt; 20 min', 56, "#fff"),
    ("AUTRES FORMATIONS LIÉES", f'{len(common)} programme(s)', 56, "#fbfcff")])}
<div class="col g8" style="padding:16px 18px"><a class="btn {"btn-primary" if k == 0 else "btn-ghost"}">Candidater</a><a style="font-size:13px;font-weight:700;color:#1a47f5;text-align:center">Voir la fiche →</a></div></div>'''
    body = f"""{header("Formations")}
<div style="background:linear-gradient(180deg,#eef4ff,#f6f8fe);padding:40px 0 28px"><div class="wrap col g20">
 <div class="row between" style="align-items:flex-end"><div class="col g10"><div class="eyebrow">Comparateur</div><h2>Compare et choisis en confiance</h2><p class="muted" style="font-size:16px">Mêmes formations ou mêmes métiers visés : vois d'un coup d'œil les différences de coût, d'admission, de visa et de logement.</p></div>
 <div class="hand" style="font-size:28px;color:#1336e0;transform:rotate(-4deg)">Tu as vraiment le choix !</div></div>
 <div class="search row g12" style="padding:10px">
  <div class="row g8" style="padding:6px 10px;background:#eef4ff;border-radius:12px">{icon('target',16,'#1a47f5')}<span style="font-size:13px;font-weight:700;color:#1336e0">Comparer par</span></div>
  <div class="row" style="background:#f6f8fe;border-radius:12px;padding:3px">{''.join(f'<span style="padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;{"background:#fff;color:#1a47f5;box-shadow:0 2px 6px rgba(0,0,0,.08)" if k == 0 else "color:#6b7493"}">{t}</span>' for k, t in enumerate(["Formation", "Métier visé", "Établissements"]))}</div>
  <div class="row g10" style="flex:1;padding:6px 14px;border-left:1px solid #eef1f8">{icon('graduation-cap',18,'#1a47f5')}<b style="font-size:14px">{F["intitule"]}</b></div>
  <div class="row g8">{''.join(chip(NOMS[c], "chip-blue") for c in ["MA", "SN", "GA"])}</div>
  <a class="btn btn-primary">{icon('plus',16,'#fff')} Ajouter une école</a></div>
</div></div>
<div class="wrap" style="margin-top:12px;position:relative"><div class="row g16" style="align-items:stretch">{cols}</div>
<div class="ann" style="left:20px;top:-12px">Colonnes : entrée en cascade · lignes surlignées au survol · meilleure valeur par ligne en vert</div></div>
<div class="wrap row g16" style="margin-top:24px">{''.join(f'<div class="card row g12" style="flex:1;padding:18px;border-radius:18px"><div class="ic" style="width:42px;height:42px;background:{bg};border-radius:12px">{icon(i,20,fg)}</div><div class="col"><b style="font-size:14px">{t}</b><span class="muted" style="font-size:12px">{s}</span></div></div>' for i, bg, fg, t, s in [("share-2", "#eef4ff", "#1a47f5", "Partager la comparaison", "avec tes parents ou ton conseiller"), ("download", "#e8f8ef", "#0f8a46", "Exporter en PDF", "pour décider à tête reposée"), ("message-circle", "#fff3c4", "#a55a00", "Poser une question", "directement aux établissements")])}</div>
{footer()}"""
    save("11-comparateur", doc("Navigoal — Comparateur", body))


# =====================================================================================
# 12. PARCOURS MÉTIER → FORMATIONS → ÉTABLISSEMENTS
# =====================================================================================
def parcours_metier(mid):
    m = METIERS[mid]
    forms = [FORMATIONS[f] for f in m["formations"] if f in FORMATIONS]
    series_ma = sorted({s for f in forms for s in f["series_recommandees"].get("GA", [])})[:6]
    steps = ""
    for f in forms[:4]:
        es = [ETABS[x] for x in f["etablissements"] if x in ETABS][:4]
        logos_ = "".join(f'<div class="row g8" style="padding:6px 10px 6px 6px;border:1px solid #eef1f8;border-radius:12px;background:#fff">{logo(x["id"],32)}<span style="font-size:12px;font-weight:700">{x["sigle"]}</span><span class="muted" style="font-size:11px">{NOMS[x["pays"]]}</span></div>' for x in es)
        steps += f'''<div class="card col g12" style="padding:20px;border-radius:20px"><div class="row between"><div class="col g4"><b style="font-size:16px">{f["intitule"]}</b><span class="muted" style="font-size:12px">{f["diplome"]} · {f["duree_annees"]} ans après le bac</span></div><span class="chip chip-green">{len(es)} écoles privées</span></div>
<div class="row g8" style="flex-wrap:wrap">{logos_ or '<span class="muted" style="font-size:13px">Bientôt disponible</span>'}</div>
<div class="row between"><span class="muted" style="font-size:12px">Compétences : {", ".join(f["competences"][:2]).replace("cmp-", "").replace("-", " ")}</span><a class="btn btn-ghost" style="padding:8px 12px;font-size:13px">{icon('scale',14,'#1336e0')} Comparer ces écoles</a></div></div>'''
    flow = "".join(f'''<div class="col g8" style="align-items:center;text-align:center;width:180px"><div class="ic" style="width:64px;height:64px;border-radius:50%;background:{bg};box-shadow:0 12px 30px -12px rgba(26,71,245,.5)">{icon(i,28,"#fff")}</div><b>{t}</b><span class="muted" style="font-size:12px">{s}</span></div>{'<div style="flex:1;height:3px;background:linear-gradient(90deg,#1a47f5,#ffc21f);margin-top:-40px"></div>' if k < 3 else ''}''' for k, (i, bg, t, s) in enumerate([
        ("school", "#6a3df0", "Série au lycée", ", ".join(SERIES[s]["code"] for s in series_ma) or "—"),
        ("graduation-cap", "#1a47f5", f"{len(forms)} formations", "BTS → Licence → Master"),
        ("building-2", "#0f8a46", f"{len({x for f in forms for x in f['etablissements'] if x in ETABS})} écoles", "au Gabon, Maroc, Sénégal"),
        ("briefcase", "#f9a806", m["nom"][:22], "ton futur métier")]))
    body = f"""{header("Métiers")}
<div style="background:linear-gradient(135deg,#eef4ff,#f6f8fe 70%);padding:40px 0 30px"><div class="wrap col g20">
 <div class="row g8 muted" style="font-size:13px">Accueil {icon('chevron-right',14,'#6b7493')} Métiers {icon('chevron-right',14,'#6b7493')} {m["nom"]}</div>
 <div class="row between"><div class="row g20"><div class="ic" style="width:80px;height:80px;border-radius:24px;background:#1a47f5">{icon('chart-line',40,'#fff')}</div><div class="col g8"><h1 style="font-size:48px">Devenir {m["nom"].lower()}</h1><p class="soft" style="font-size:17px;width:640px">{m["description"]}</p></div></div>
 <div class="card col g6" style="padding:18px 22px;border-radius:18px"><span class="muted" style="font-size:12px;font-weight:700">COMPATIBILITÉ AVEC TON PROFIL</span><div style="font-size:34px;font-weight:800;color:#0f8a46">92 %</div><span class="muted" style="font-size:12px">Profil {"·".join(m["riasec"])} · {m["niveau_min"].replace("niv-bac", "Bac+")}</span></div></div>
</div></div>
<div class="wrap" style="margin-top:28px;position:relative"><div class="card row" style="padding:30px 36px;border-radius:26px;align-items:center">{flow}</div><div class="ann" style="left:24px;top:-12px">Le chemin se dessine au scroll (ligne + étapes en cascade)</div></div>
<div class="wrap row g40" style="margin-top:36px;align-items:flex-start">
 <div class="col g16" style="flex:1"><h2 style="font-size:28px">Les formations et où les suivre</h2>{steps}</div>
 <div class="col g20" style="width:380px">
  <div class="card col g10" style="padding:22px;border-radius:22px"><h3>Missions</h3>{''.join(f'<div class="row g10" style="font-size:14px;align-items:flex-start">{icon("circle-check",16,"#0f8a46")}<span class="soft">{t}</span></div>' for t in m["missions"])}</div>
  <div class="card col g10" style="padding:22px;border-radius:22px"><h3>Où travailler ?</h3>{''.join(f'<div class="row g10" style="font-size:14px">{icon("building",16,"#1a47f5")}<span class="soft">{t}</span></div>' for t in m["secteurs"])}</div>
  <div class="card col g10" style="padding:22px;border-radius:22px;background:linear-gradient(140deg,#0b1a4f,#1336e0);color:#fff;border:none"><b style="font-size:18px">Compare les écoles qui mènent à ce métier</b><span style="color:#c9d6ff;font-size:13px">Frais, admission, visa, logement : côte à côte.</span><a class="btn btn-sun">{icon('scale',16,'#0b1533')} Ouvrir le comparateur</a></div>
 </div></div>
{footer()}"""
    save("12-parcours-metier", doc(f"Navigoal — Devenir {m['nom']}", body))


# =====================================================================================
# 13. VALEUR AJOUTÉE PAR UTILISATEUR
# =====================================================================================
def valeur():
    personas = [
        ("user-round", "#1a47f5", "Élève (collège, lycée)", "Comprends ton profil et choisis ta série.", ["Test d'orientation visuel et gratuit", "Ma série au lycée : matières, métiers, études", "Annales, cours et préparation BEPC / BFEM / bac"], "1 élève sur 2 change de projet après le test"),
        ("plane", "#0f8a46", "Étudiant·e en mobilité", "Étudie au Maroc, au Sénégal ou au Gabon sans galérer.", ["Écoles privées accessibles aux étrangers, comparées côte à côte", "Fiches pays : visa, budget, reconnaissance des diplômes", "Candidature, paiement mobile et logement Navilease au même endroit"], "Un seul dossier pour toutes tes candidatures"),
        ("users-round", "#a55a00", "Parent / tuteur", "Accompagne et sécurise le projet de ton enfant.", ["Suivi du profil, des candidatures et des admissions", "Budget total (frais + vie) avant de s'engager", "Garant du logement, paiement en séquestre"], "Zéro caution versée à un faux bailleur"),
        ("building-2", "#6a3df0", "Établissement", "Recrute les bons candidats, partout en Afrique.", ["Vitrine : photos, programmes, métiers, frais", "Candidatures qualifiées (profil, série, budget validés)", "Statistiques et campagnes d'admission"], "Candidats déjà orientés vers vos programmes"),
        ("key-round", "#d42a50", "Bailleur Navilease", "Loue à des étudiants vérifiés, paiements garantis.", ["Locataires admis et identifiés", "Encaissement protégé, contrats et quittances automatiques", "Visibilité auprès des écoles partenaires"], "Taux d'occupation à la rentrée"),
    ]
    cards = "".join(f'''<div class="card col g16" style="padding:26px;border-radius:26px;{"grid-column:span 2;" if k == 1 else ""}{"background:linear-gradient(150deg,#fff 55%,#eef4ff)" if k == 1 else ""}">
<div class="row g12"><div class="ic" style="width:52px;height:52px;border-radius:16px;background:{c}">{icon(i,26,"#fff")}</div><div class="col"><span class="muted" style="font-size:12px;font-weight:800">POUR</span><b style="font-size:19px">{t}</b></div></div>
<div style="font-size:21px;font-weight:800;letter-spacing:-.4px;line-height:1.25">{s}</div>
{''.join(f'<div class="row g10" style="font-size:14px;align-items:flex-start">{icon("check",16,c,3)}<span class="soft">{x}</span></div>' for x in pts)}
<div class="row g8" style="margin-top:auto;padding:12px 14px;border-radius:14px;background:#f6f8fe;font-size:13px;font-weight:700">{icon("sparkles",16,c)}{kpi}</div></div>''' for k, (i, c, t, s, pts, kpi) in enumerate(personas))
    avant = ["Infos dispersées (sites, réseaux sociaux, bouche-à-oreille)", "Écoles publiques inaccessibles aux étrangers", "Impossible de comparer coûts, visa et logement", "Arnaques à la caution", "Dossiers envoyés un par un"]
    apres = ["Tout le parcours sur une seule plateforme", "79 écoles privées et inter-États qui accueillent les internationaux", "Comparateur : formation, métier, budget total, visa", "Logements vérifiés et paiement en séquestre", "Un dossier, plusieurs candidatures suivies en temps réel"]
    body = f"""{header()}
<div style="background:radial-gradient(900px 500px at 85% 0%,#dae6ff,transparent 60%),#f6f8fe;padding:56px 0 30px"><div class="wrap col g16" style="align-items:center;text-align:center">
 <div class="eyebrow">Pourquoi Navigoal</div><h1 style="font-size:56px;width:960px">Une seule plateforme, <span style="color:#1a47f5">de l'orientation</span> à <span class="sun">l'installation</span></h1>
 <p class="soft" style="font-size:18px;width:760px">Navigoal relie séries, métiers, formations, établissements, pays et logement pour que chacun prenne la bonne décision.</p></div></div>
<div class="wrap" style="margin-top:20px;position:relative"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">{cards}</div><div class="ann" style="right:20px;top:-12px">Cartes : révélation en cascade · onglets par profil sur mobile</div></div>
<div class="wrap row g24" style="margin-top:56px;align-items:stretch">
 <div class="card col g12" style="flex:1;padding:28px;border-radius:26px"><span class="chip chip-rose" style="align-self:flex-start">Sans Navigoal</span>{''.join(f'<div class="row g10" style="font-size:15px">{icon("x",18,"#d42a50",3)}<span class="soft">{t}</span></div>' for t in avant)}</div>
 <div class="card col g12" style="flex:1;padding:28px;border-radius:26px;border:2px solid #1a47f5;box-shadow:0 30px 60px -24px rgba(26,71,245,.4)"><span class="chip chip-green" style="align-self:flex-start">Avec Navigoal</span>{''.join(f'<div class="row g10" style="font-size:15px">{icon("check",18,"#0f8a46",3)}<span style="font-weight:600">{t}</span></div>' for t in apres)}</div></div>
<div class="wrap" style="margin-top:56px"><div class="card row" style="padding:30px;border-radius:26px;justify-content:space-around">{''.join(f'<div class="col g4" style="align-items:center"><b style="font-size:36px;color:#1a47f5">{n}</b><span class="muted" style="font-size:13px">{l}</span></div>' for n, l in [("79", "écoles privées & inter-États"), ("93", "formations reliées aux métiers"), ("96", "fiches métiers"), ("42", "séries du bac décryptées"), ("3", "pays, 1 parcours")])}</div></div>
{cta_band()}
{footer()}"""
    save("13-valeur-ajoutee", doc("Navigoal — Pourquoi Navigoal", body))


# =====================================================================================
# DEVIS PARENTS
# =====================================================================================
COUTS = {c["id"]: c for c in ref("couts_etudes")}
COUTS_META = json.load(open(os.path.join(ROOT, "data", "referentiels", "couts_etudes.json")))["_meta"]


def devis(eid, fid, origine="GA", logement="studio"):
    """Calcule un devis (min / max) sur toute la durée de la formation."""
    e = ETABS[eid]
    F = FORMATIONS[fid]
    C = COUTS[e["pays"]]
    H = COUTS_META["hypotheses"]
    years = max(1, min(F["duree_annees"], 5))
    typ = e["type"] if e["type"] in C["scolarite_annuelle"] else ("inter_etats" if e["statut"] == "inter_etats" and "inter_etats" in C["scolarite_annuelle"] else "universite")
    sco = C["scolarite_annuelle"][typ]
    ann = C["frais_annuels_annexes"]
    chere = any(v in e["ville"] for v in C["vie_mensuelle"]["villes_cheres"])
    vie = C["vie_mensuelle"]["ville_chere" if chere else "autre_ville"]
    lignes = []
    tot = [0, 0]
    rows = []
    for y in range(years):
        inf = (1 + H["inflation_annuelle"]) ** y
        a = [round(sco["min"] * inf), round(sco["max"] * inf)]
        b = [ann["min"], ann["max"]]
        v = [round(vie["min"] * H["mois_par_an"] * inf), round(vie["max"] * H["mois_par_an"] * inf)]
        r = [sum(x for x in (it["min"] for it in C["installation"] if it.get("annuel"))), sum(x for x in (it["max"] for it in C["installation"] if it.get("annuel")))]
        row = [a[i] + b[i] + v[i] + r[i] for i in (0, 1)]
        rows.append({"annee": y + 1, "scolarite": a, "annexes": b, "vie": v, "renouvellements": r, "total": row})
        tot = [tot[i] + row[i] for i in (0, 1)]
    inst = [sum(it["min"] for it in C["installation"] if not it.get("annuel")), sum(it["max"] for it in C["installation"] if not it.get("annuel"))]
    vol = C["billet_avion"].get(f"depuis_{origine}", {"min": 0, "max": 0})
    inst = [inst[0] + vol["min"] * 2, inst[1] + vol["max"] * 2]
    sub = [tot[i] + inst[i] for i in (0, 1)]
    imprevus = [round(sub[i] * H["marge_imprevus"]) for i in (0, 1)]
    transfert = [round(sub[i] * H["frais_transfert"]) for i in (0, 1)]
    total = [sub[i] + imprevus[i] + transfert[i] for i in (0, 1)]
    cats = {
        "Scolarité": [sum(r["scolarite"][i] + r["annexes"][i] for r in rows) for i in (0, 1)],
        "Vie quotidienne": [sum(r["vie"][i] for r in rows) for i in (0, 1)],
        "Installation & voyages": inst,
        "Séjour & assurance": [sum(r["renouvellements"][i] for r in rows) for i in (0, 1)],
        "Imprévus & transferts": [imprevus[i] + transfert[i] for i in (0, 1)],
    }
    return {"devise": C["devise"], "years": years, "rows": rows, "installation": inst, "total": total, "cats": cats,
            "typ": sco["libelle"], "chere": chere, "vie": vie, "sco": sco}


def to_eur(v, dev):
    return round(v / COUTS_META["taux_change_indicatifs"][dev])


def to_xaf(v, dev):
    return round(to_eur(v, dev) * COUTS_META["taux_change_indicatifs"]["XAF"])


def donut(cats, size=220):
    import math
    colors = ["#1a47f5", "#ffc21f", "#0f8a46", "#6a3df0", "#d42a50"]
    total = sum(v[1] for v in cats.values())
    r, c = 80, size / 2
    acc, segs = 0, ""
    for (k, v), col in zip(cats.items(), colors):
        frac = v[1] / total
        a0, a1 = acc * 2 * math.pi - math.pi / 2, (acc + frac) * 2 * math.pi - math.pi / 2
        large = 1 if frac > 0.5 else 0
        segs += f'<path d="M {c + r*math.cos(a0):.1f} {c + r*math.sin(a0):.1f} A {r} {r} 0 {large} 1 {c + r*math.cos(a1):.1f} {c + r*math.sin(a1):.1f}" stroke="{col}" stroke-width="34" fill="none"/>'
        acc += frac
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">{segs}</svg>', colors


def devis_page(eid, fid):
    e = ETABS[eid]
    F = FORMATIONS[fid]
    P = PAYS[e["pays"]]
    C = COUTS[e["pays"]]
    D = devis(eid, fid, "GA")
    dev = D["devise"]
    svg, colors = donut(D["cats"])
    legend = "".join(f'<div class="row between" style="font-size:14px"><span class="row g8"><span style="width:12px;height:12px;border-radius:4px;background:{col}"></span>{k}</span><b>{fmt(v[0])} – {fmt(v[1])}</b></div>' for (k, v), col in zip(D["cats"].items(), colors))
    table = "".join(f'<tr style="border-top:1px solid #eef1f8"><td style="padding:12px 8px;font-weight:700">Année {r["annee"]}</td>' + "".join(f'<td style="padding:12px 8px;text-align:right">{fmt(r[k][0])} – {fmt(r[k][1])}</td>' for k in ("scolarite", "vie", "renouvellements")) + f'<td style="padding:12px 8px;text-align:right;font-weight:800;color:#1a47f5">{fmt(r["total"][0])} – {fmt(r["total"][1])}</td></tr>' for r in D["rows"])
    steps = "".join(f'<div class="row g12" style="align-items:flex-start"><div class="col" style="align-items:center"><div class="ic" style="width:34px;height:34px;border-radius:50%;background:{"#1a47f5" if k < 3 else "#fff"};border:{"none" if k < 3 else "2px solid #bcd2ff"};font-size:11px;font-weight:800;color:{"#fff" if k < 3 else "#1a47f5"}">{icon("check",15,"#fff",3) if k < 3 else k+1}</div>{"<div style=width:2px;height:22px;background:#dbe3f7></div>" if k < len(C["demarches"]) - 1 else ""}</div><div class="col g2" style="flex:1;padding-top:6px"><span class="chip chip-sun" style="align-self:flex-start;padding:3px 8px">{d["quand"]}</span><span class="soft" style="font-size:13px;margin-top:4px">{d["etape"]}</span></div></div>' for k, d in enumerate(C["demarches"]))
    qual = [("shield-check", "Reconnaissance", "Privé reconnu par l'État — diplôme équivalent au diplôme national" if e["statut"] == "prive_reconnu" else "Établissement agréé ; vérifier l'accréditation du programme"),
            ("calendar", "Ancienneté", f"Créé en {e['annee_creation']}" if e.get("annee_creation") else "Date de création à confirmer"),
            ("graduation-cap", "Programmes", f"{len(e['formations'])} programmes, reliés à {len({m for f in e['formations'] if f in FORMATIONS for m in FORMATIONS[f]['metiers']})} métiers"),
            ("handshake", "Ouverture internationale", "Accueil des étudiants étrangers, accompagnement visa et logement via Navigoal")]
    env = C["environnement"]
    body = f"""{header()}
<div style="background:linear-gradient(135deg,#0b1a4f,#1336e0 60%,#598bff);padding:40px 0 90px;color:#fff;position:relative;overflow:hidden">
<div style="position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(255,194,31,.35),transparent 70%)"></div>
<div class="wrap col g16" style="position:relative"><span class="chip" style="align-self:flex-start;background:rgba(255,255,255,.15);color:#fff">{icon('users-round',14,'#fff')} Espace parents</span>
<h1 style="font-size:50px">Combien coûtent vraiment <span class="sun">ses études</span> ?</h1>
<p style="color:#c9d6ff;font-size:17px;width:720px">Un devis complet sur toute la durée de la formation : scolarité, vie quotidienne, installation, visa et carte de séjour. Pour décider sereinement, avant de vous engager.</p></div></div>
<div class="wrap" style="margin-top:-60px;position:relative"><div class="card row g16" style="padding:18px;border-radius:24px;align-items:flex-end;box-shadow:0 30px 60px -24px rgba(11,21,51,.35)">
{''.join(f'<div class="col g6" style="flex:{fl}"><span class="muted" style="font-size:12px;font-weight:700">{lab}</span><div class="row between" style="padding:12px 14px;border:1.5px solid #e6eaf5;border-radius:12px;font-weight:700;font-size:14px">{val}{icon("chevron-down",16,"#6b7493")}</div></div>' for lab, val, fl in [("Votre enfant part de", "🇬🇦 Gabon (Libreville)", 1), ("Établissement", e["sigle"] + " · " + e["ville"], 1.2), ("Formation", F["intitule"][:34], 1.6), ("Logement", "Studio meublé", .9), ("Devise d'affichage", "F CFA (XAF)", .8)])}
<a class="btn btn-primary btn-shine" style="padding:14px 20px">{icon('calculator',18,'#fff')} Calculer</a></div><div class="ann" style="right:20px;top:-12px">Chaque changement recalcule le devis en direct (compteurs animés)</div></div>
<div class="wrap row g24" style="margin-top:28px;align-items:flex-start">
 <div class="col g24" style="flex:1">
  <div class="card col g20" style="padding:28px;border-radius:26px">
   <div class="row between"><div class="col g4"><span class="muted" style="font-size:13px;font-weight:700">COÛT TOTAL ESTIMÉ · {D["years"]} ANS · {F["diplome"].upper()}</span>
    <div style="font-size:40px;font-weight:800;letter-spacing:-1.4px">{fmt(to_xaf(D["total"][0], dev))} – {fmt(to_xaf(D["total"][1], dev))} <span style="font-size:20px">F CFA</span></div>
    <span class="muted" style="font-size:14px">soit {fmt(D["total"][0])} – {fmt(D["total"][1])} {dev} · {fmt(to_eur(D["total"][0], dev))} – {fmt(to_eur(D["total"][1], dev))} € · environ {fmt(round(to_xaf(D["total"][0], dev) / (D["years"] * 12)))} – {fmt(round(to_xaf(D["total"][1], dev) / (D["years"] * 12)))} F CFA par mois</span></div>
    <div class="col g8" style="align-items:flex-end"><span class="chip chip-green">{icon('badge-check',14,'#0f8a46')} Frais confirmés par l'établissement</span><span class="chip chip-sun">Mis à jour le 09/10/2026</span></div></div>
   <div class="row g32" style="align-items:center"><div style="position:relative;width:220px;height:220px">{svg}<div class="col" style="position:absolute;inset:0;align-items:center;justify-content:center"><span class="muted" style="font-size:12px">par an</span><b style="font-size:18px">{fmt(round(to_xaf(D["total"][1], dev) / D["years"]))}</b><span class="muted" style="font-size:11px">F CFA max.</span></div></div><div class="col g12" style="flex:1"><span class="muted" style="font-size:12px;font-weight:700">RÉPARTITION ({dev})</span>{legend}</div></div>
   <div class="ann" style="left:24px;top:-12px">Donut qui se dessine + total en compteur</div>
  </div>
  <div class="card col g12" style="padding:24px;border-radius:24px"><div class="row between"><h3>Échéancier année par année</h3><span class="muted" style="font-size:12px">inflation {int(COUTS_META["hypotheses"]["inflation_annuelle"]*100)} %/an incluse · montants en {dev}</span></div>
   <table style="width:100%;border-collapse:collapse;font-size:14px"><tr class="muted" style="font-size:12px;font-weight:800"><td style="padding:8px">ANNÉE</td><td style="padding:8px;text-align:right">SCOLARITÉ + FRAIS</td><td style="padding:8px;text-align:right">VIE (10 MOIS)</td><td style="padding:8px;text-align:right">SÉJOUR & ASSURANCE</td><td style="padding:8px;text-align:right">TOTAL</td></tr>{table}
   <tr style="border-top:2px solid #e6eaf5"><td style="padding:12px 8px;font-weight:700">Installation & voyages</td><td colspan="3" class="muted" style="padding:12px 8px;font-size:13px">visa, billets A/R, caution logement, équipement</td><td style="padding:12px 8px;text-align:right;font-weight:800">{fmt(D["installation"][0])} – {fmt(D["installation"][1])}</td></tr></table></div>
  <div class="row g20" style="align-items:stretch">
   <div class="card col g12" style="flex:1;padding:24px;border-radius:24px"><h3>Qualité de la formation</h3>{''.join(f'<div class="row g12" style="align-items:flex-start"><div class="ic" style="width:38px;height:38px;background:#eef4ff;border-radius:12px">{icon(i,18,"#1a47f5")}</div><div class="col"><b style="font-size:14px">{t}</b><span class="muted" style="font-size:13px">{s}</span></div></div>' for i, t, s in qual)}</div>
   <div class="card col g12" style="flex:1;padding:24px;border-radius:24px"><h3>Cadre de vie à {e["ville"].split(" ")[0]}</h3>{''.join(f'<div class="row g12" style="align-items:flex-start"><div class="ic" style="width:38px;height:38px;background:#e8f8ef;border-radius:12px">{icon(i,18,"#0f8a46")}</div><div class="col"><b style="font-size:14px">{t}</b><span class="muted" style="font-size:13px">{env[k]}</span></div></div>' for i, t, k in [("shield", "Sécurité", "securite"), ("heart-pulse", "Santé", "sante"), ("bus", "Transports", "transports"), ("users", "Communauté", "communaute")])}</div>
  </div>
 </div>
 <div class="col g20" style="width:400px">
  <div class="card col g12" style="padding:22px;border-radius:24px;box-shadow:0 30px 60px -24px rgba(26,71,245,.4)"><b style="font-size:17px">Votre devis</b>
   <a class="btn btn-primary btn-shine">{icon('file-down',18,'#fff')} Télécharger le devis PDF</a>
   <a class="btn btn-ghost">{icon('share-2',16,'#1336e0')} Envoyer à la famille (WhatsApp, e-mail)</a>
   <a class="btn btn-ghost">{icon('message-circle',16,'#1336e0')} Demander les frais exacts à l'école</a>
   <div class="row g10" style="padding:12px;border-radius:14px;background:#fff7dd;font-size:13px;align-items:flex-start">{icon('lightbulb',18,'#a55a00')}<span><b>Astuce :</b> comparez ce devis avec 2 autres écoles qui mènent au même métier.</span></div></div>
  <div class="card col g14" style="padding:22px;border-radius:24px;gap:14px"><div class="row between"><b style="font-size:17px">Démarches de régularisation</b>{chip(P["nom"], "chip-blue")}</div>{steps}<div class="ann" style="left:16px;top:-12px">Frise : étapes cochées au fil de l'avancement</div></div>
 </div></div>
<div class="wrap" style="margin-top:20px"><p class="muted" style="font-size:12px;line-height:1.6">Estimation Navigoal basée sur les frais publiés par l'établissement lorsqu'ils sont disponibles, sur des grilles publiques et sur le coût de la vie observé ({", ".join(u.split("/")[2] for u in COUTS_META["sources"][:4])}). Taux indicatif 1 € = 655,957 F CFA = {COUTS_META["taux_change_indicatifs"]["MAD"]} MAD. Marge d'imprévus {int(COUTS_META["hypotheses"]["marge_imprevus"]*100)} % et frais de transfert {int(COUTS_META["hypotheses"]["frais_transfert"]*100)} % inclus.</p></div>
{footer()}"""
    save("14-devis-parents", doc("Navigoal — Devis études", body))
    return D


def devis_pdf(eid, fid, D):
    e = ETABS[eid]
    F = FORMATIONS[fid]
    C = COUTS[e["pays"]]
    dev = D["devise"]
    lines = "".join(f'<tr><td style="padding:9px 10px;border-bottom:1px solid #e6eaf5">{k}</td><td style="padding:9px 10px;border-bottom:1px solid #e6eaf5;text-align:right">{fmt(v[0])}</td><td style="padding:9px 10px;border-bottom:1px solid #e6eaf5;text-align:right">{fmt(v[1])}</td></tr>' for k, v in D["cats"].items())
    yrs = "".join(f'<tr><td style="padding:7px 10px;border-bottom:1px solid #eef1f8">Année {r["annee"]}</td><td style="padding:7px 10px;border-bottom:1px solid #eef1f8;text-align:right">{fmt(r["total"][0])}</td><td style="padding:7px 10px;border-bottom:1px solid #eef1f8;text-align:right">{fmt(r["total"][1])}</td></tr>' for r in D["rows"])
    body = f"""<div style="width:794px;min-height:1123px;background:#fff;padding:48px 52px;font-size:13px;color:#0b1533">
<div class="row between" style="border-bottom:3px solid #1a47f5;padding-bottom:18px">{brand()}<div class="col" style="align-items:flex-end"><b style="font-size:20px">DEVIS D'ÉTUDES</b><span class="muted">N° NG-2026-10-00428 · émis le 09/10/2026</span><span class="muted">Valable 60 jours</span></div></div>
<div class="row g24" style="margin-top:22px;align-items:flex-start">
 <div class="col g4" style="flex:1;padding:14px;border-radius:12px;background:#f6f8fe"><span class="muted" style="font-size:11px;font-weight:800">ÉTUDIANT·E</span><b>Amina Mba</b><span>Née en 2008 · nationalité gabonaise</span><span>Départ : Libreville (Gabon)</span><span>Responsable financier : M. Jean-Paul Mba (père)</span></div>
 <div class="col g4" style="flex:1;padding:14px;border-radius:12px;background:#f6f8fe"><span class="muted" style="font-size:11px;font-weight:800">FORMATION</span><b>{F["intitule"]}</b><span>{e["nom"]}</span><span>{e["ville"]}, {NOMS[e["pays"]]} · {STATUT.get(e["statut"], "Privé")}</span><span>{F["diplome"]} · {D["years"]} ans · rentrée septembre 2027</span></div></div>
<h3 style="margin-top:24px;font-size:15px">1. Synthèse des coûts sur {D["years"]} ans ({dev})</h3>
<table style="width:100%;border-collapse:collapse;margin-top:8px"><tr style="background:#0b1a4f;color:#fff;font-size:12px"><td style="padding:9px 10px">Poste</td><td style="padding:9px 10px;text-align:right">Minimum</td><td style="padding:9px 10px;text-align:right">Maximum</td></tr>{lines}
<tr style="font-weight:800;background:#eef4ff"><td style="padding:11px 10px">TOTAL ({dev})</td><td style="padding:11px 10px;text-align:right">{fmt(D["total"][0])}</td><td style="padding:11px 10px;text-align:right">{fmt(D["total"][1])}</td></tr>
<tr style="font-weight:800;color:#1a47f5"><td style="padding:9px 10px">Équivalent F CFA</td><td style="padding:9px 10px;text-align:right">{fmt(to_xaf(D["total"][0], dev))}</td><td style="padding:9px 10px;text-align:right">{fmt(to_xaf(D["total"][1], dev))}</td></tr></table>
<div class="row g24" style="margin-top:22px;align-items:flex-start">
 <div class="col" style="flex:1"><h3 style="font-size:15px">2. Échéancier annuel ({dev})</h3><table style="width:100%;border-collapse:collapse;margin-top:8px"><tr class="muted" style="font-size:11px;font-weight:800"><td style="padding:7px 10px">ANNÉE</td><td style="padding:7px 10px;text-align:right">MIN.</td><td style="padding:7px 10px;text-align:right">MAX.</td></tr>{yrs}
 <tr><td style="padding:7px 10px">Installation (une fois)</td><td style="padding:7px 10px;text-align:right">{fmt(D["installation"][0])}</td><td style="padding:7px 10px;text-align:right">{fmt(D["installation"][1])}</td></tr></table></div>
 <div class="col g6" style="flex:1"><h3 style="font-size:15px">3. Démarches et calendrier</h3>{''.join(f'<div class="row g8" style="font-size:12px;align-items:flex-start"><b style="width:74px;color:#1a47f5;flex-shrink:0">{d["quand"]}</b><span>{d["etape"]}</span></div>' for d in C["demarches"])}</div></div>
<h3 style="margin-top:22px;font-size:15px">4. Ce qui est inclus</h3>
<p style="line-height:1.6">Frais de scolarité ({D["typ"].lower()}), inscription et dossier, loyer et vie quotidienne sur 10 mois par an ({"ville à coût élevé" if D["chere"] else "ville à coût modéré"}), carte de séjour et assurance santé chaque année, visa, billets d'avion aller-retour, caution du logement, équipement, marge d'imprévus de 8 % et frais de transfert de 2 %.</p>
<div class="row g12" style="margin-top:18px;padding:14px;border-radius:12px;background:#fff7dd;align-items:flex-start">{icon('info',18,'#a55a00')}<span style="font-size:12px;line-height:1.55">Devis indicatif établi par Navigoal. Les frais de scolarité définitifs sont ceux confirmés par écrit par l'établissement. Les règles de visa et de séjour dépendent de la nationalité et doivent être vérifiées auprès des autorités consulaires. Taux de change indicatif : 1 € = 655,957 F CFA.</span></div>
<div class="row between" style="margin-top:36px;border-top:1px solid #e6eaf5;padding-top:14px;font-size:11px" ><span class="muted">Navigoal · navigoal.netlify.app · contact@navigoal.com</span><div class="row g8 muted">{icon('qr-code',36,'#0b1533',1.5)}<span>Vérifier ce devis<br>en ligne</span></div></div>
</div>"""
    save("15-devis-pdf", doc("Navigoal — Devis PDF", f'<div style="background:#e6eaf5;padding:40px;display:flex;justify-content:center">{body}</div>', 874))


def espace_parent(eid, fid, D):
    e = ETABS[eid]
    dev = D["devise"]
    C = COUTS[e["pays"]]
    paiements = [("Frais de réservation", "Payé", "chip-green", "15/03/2027", "Airtel Money"), ("Scolarité · 1er semestre", "Payé", "chip-green", "05/09/2027", "Virement"),
                 ("Loyer Navilease · octobre", "En séquestre", "chip-blue", "01/10/2027", "Airtel Money"), ("Scolarité · 2nd semestre", "À venir", "chip-sun", "05/02/2028", "—")]
    pay = "".join(f'<div class="row g12" style="padding:12px;border:1px solid #eef1f8;border-radius:14px"><div class="ic" style="width:38px;height:38px;background:#eef4ff;border-radius:12px">{icon("receipt",18,"#1a47f5")}</div><div class="col" style="flex:1"><b style="font-size:14px">{t}</b><span class="muted" style="font-size:12px">{d} · {m}</span></div><span class="chip {c}">{s}</span></div>' for t, s, c, d, m in paiements)
    dem = "".join(f'<div class="row g10" style="font-size:13px;padding:8px 0;border-bottom:1px solid #f1f4fb"><div class="ic" style="width:24px;height:24px;border-radius:50%;background:{"#0f8a46" if k < 6 else "#e8edfa"}">{icon("check",13,"#fff" if k < 6 else "#9aa3c0",3)}</div><span class="{"" if k < 6 else "muted"}" style="flex:1">{d["etape"][:70]}</span><span class="muted" style="font-size:11px">{d["quand"]}</span></div>' for k, d in enumerate(C["demarches"]))
    body = f"""<div class="row" style="align-items:stretch;min-height:1000px">
<div class="col g24" style="width:260px;background:#fff;border-right:1px solid #e6eaf5;padding:24px 16px">{brand()}<div class="col g4">{''.join(f'<div class="row g12" style="padding:11px 14px;border-radius:12px;font-size:14px;font-weight:{700 if k == 0 else 600};background:{"#eef4ff" if k == 0 else "transparent"};color:{"#1a47f5" if k == 0 else "#3b4566"}">{icon(i,18,"#1a47f5" if k == 0 else "#6b7493")}{t}</div>' for k, (i, t) in enumerate([("layout-dashboard", "Vue d'ensemble"), ("calculator", "Devis & budget"), ("wallet", "Paiements"), ("file-check-2", "Démarches"), ("graduation-cap", "Scolarité"), ("key-round", "Logement"), ("message-circle", "Messages")]))}</div></div>
<div class="col g24" style="flex:1;padding:32px">
 <div class="row between"><div class="col g6"><span class="chip chip-sun" style="align-self:flex-start">Espace parent</span><h2 style="font-size:30px">Bonjour M. Mba 👋</h2><span class="muted">Suivi d'Amina · {FORMATIONS[fid]["intitule"]} · {e["sigle"]}, {e["ville"]}</span></div>
 <div class="row g10"><a class="btn btn-ghost">{icon('file-down',16,'#1336e0')} Devis PDF</a><a class="btn btn-primary">{icon('wallet',16,'#fff')} Payer une échéance</a></div></div>
 <div class="row g16">{''.join(f'<div class="card col g6" style="flex:1;padding:20px;border-radius:20px"><span class="muted" style="font-size:12px;font-weight:700">{a}</span><b style="font-size:24px;color:{c}">{b}</b><span class="muted" style="font-size:12px">{s}</span></div>' for a, b, c, s in [("BUDGET TOTAL ESTIMÉ", f'{fmt(round(to_xaf(D["total"][1], dev)/1e6, 1)) if False else round(to_xaf(D["total"][1], dev)/1e6, 1)} M F CFA', "#0b1533", f'sur {D["years"]} ans (max.)'), ("DÉJÀ PAYÉ", "4,2 M F CFA", "#0f8a46", "3 paiements"), ("PROCHAINE ÉCHÉANCE", "05/02/2028", "#a55a00", "Scolarité 2nd semestre"), ("DÉMARCHES", "6 / 9", "#1a47f5", "carte de séjour en cours")])}</div>
 <div class="row g24" style="align-items:flex-start">
  <div class="card col g12" style="flex:1.2;padding:24px;border-radius:24px"><div class="row between"><h3>Paiements</h3><span class="muted" style="font-size:12px">fonds Navilease protégés en séquestre</span></div>{pay}</div>
  <div class="card col" style="flex:1;padding:24px;border-radius:24px"><div class="row between" style="margin-bottom:8px"><h3>Régularisation</h3>{chip(NOMS[e["pays"]], "chip-blue")}</div>{dem}</div></div>
 <div class="row g24" style="align-items:stretch">
  <div class="card row g16" style="flex:1;padding:20px;border-radius:22px">{photo_box(eid, 0, 110, 16, "width:160px")}<div class="col g6"><b>Résultats d'Amina</b><span class="muted" style="font-size:13px">Semestre 1 : 14,6/20 · assiduité 97 %</span><span class="chip chip-green" style="align-self:flex-start">Partagé par l'établissement</span></div></div>
  <div class="card row g16" style="flex:1;padding:20px;border-radius:22px;background:linear-gradient(160deg,#fff,#fff7dd)"><div class="ic" style="width:48px;height:48px;background:#ffc21f;border-radius:14px">{icon('key-round',22,'#0b1533')}</div><div class="col g6"><b>Logement : studio meublé, vérifié ✓</b><span class="muted" style="font-size:13px">Bail jusqu'au 30/06/2028 · vous êtes garant · quittance d'octobre disponible</span></div></div></div>
</div></div>"""
    save("16-espace-parent", doc("Navigoal — Espace parent", body))


if __name__ == "__main__":
    import sys
    pays_page("MA")
    ma = best("MA", 1)[0]
    etab_page(ma)
    cands = [x for x in ETABS.values() if "frm-ingenieur-informatique" in x["formations"]]
    cands.sort(key=lambda x: -(len(x.get("photos") or [])))
    pick = [c["id"] for c in cands if c["pays"] == "MA"][:2] + [c["id"] for c in cands if c["pays"] == "SN"][:1]
    comparateur("frm-ingenieur-informatique", pick)
    parcours_metier("met-data-analyst")
    valeur()
    D = devis_page(ma, next(f for f in ETABS[ma]["formations"] if FORMATIONS[f]["duree_annees"] >= 5) if any(FORMATIONS[f]["duree_annees"] >= 5 for f in ETABS[ma]["formations"]) else ETABS[ma]["formations"][0])
    fid_dev = next((f for f in ETABS[ma]["formations"] if FORMATIONS[f]["duree_annees"] >= 5), ETABS[ma]["formations"][0])
    devis_pdf(ma, fid_dev, D)
    espace_parent(ma, fid_dev, D)
    print("établissement :", ma, "comparateur :", pick, "devis :", fid_dev, D["total"], D["devise"])
