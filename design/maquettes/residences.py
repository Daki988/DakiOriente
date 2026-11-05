#!/usr/bin/env python3
"""Maquettes « Résidences universitaires » dans Navilease (novembre 2026).

Les résidences étudiantes (Twenty Campus, Bayt Al Maârifa, The Student House, résidences de l'UM6SS…) sont présentées
avec leurs photos, leurs loyers et leurs conditions, relevés sur leurs sites officiels. La réservation se fait sur la
plateforme officielle de chaque résidence : Navilease oriente, sans encaisser de paiement.

1. Accueil Navilease : nouvelle rangée « Résidences universitaires »
2. Liste des résidences : filtres ville, budget, public ; carte « à partir de… »
3. Fiche résidence : photos, logements et loyers, inclus, frais, conditions, bouton vers le site officiel
4. Fiche résidence sur téléphone
5. Résidence réservée à une université (RESU / UM6SS) et résidence complète

Usage : python3 design/maquettes/residences.py <dossier icônes lucide>  → design/maquettes/out/residences.html
"""
import json
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (styles, icônes, logo)

icon, CSS, WORDMARK, b64 = P.icon, P.CSS, P.WORDMARK, P.b64
NOTE = 'class="note"'
DOC = json.load(open(os.path.join(P.ROOT, "data", "referentiels", "residences_etudiantes.json"), encoding="utf-8"))
R = {r["id"]: r for r in DOC["items"]}


def img(rid, n=0):
    return b64(os.path.join(P.ROOT, R[rid]["photos"][n]["fichier"]), "image/jpeg")


def prix(n):
    return f"{n:,}".replace(",", " ") + " DH"


def entete():
    liens = "".join(f'<span style="font-weight:{800 if t == "Résidences" else 700};font-size:14px;color:{"#1a47f5" if t == "Résidences" else "#5b6478"}">{t}</span>' for t in ["Logements", "Résidences", "Comment ça marche", "Bailleurs"])
    return f"""<div style="height:64px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:30px">
    <img src="{WORDMARK}" style="height:26px"><span class="chip" style="background:#fff3cc;color:#a55a00">Navilease</span>{liens}</div>"""


def officiel(r, petit=False):
    dom = r["reservation"]["url"].split("/")[2].replace("www.", "")
    return f'<span class="chip" style="background:#eef2ff;color:#1a47f5;font-size:{11 if petit else 12}px">{icon("external-link", 12, "#1a47f5")}Réservation sur {dom}</span>'


def carte(rid, large=330):
    r = R[rid]
    badge = '<span class="chip" style="position:absolute;top:10px;left:10px;background:#d42a50;color:#fff">Complet 2026-2027</span>' if r.get("statut") else ""
    public = '<span class="chip" style="background:#f1edff;color:#6a3df0;font-size:11px">Étudiants UM6SS</span>' if "UM6SS" in r["public"] else ""
    return f"""<div class="card" style="width:{large}px;overflow:hidden;display:flex;flex-direction:column">
      <div style="position:relative;height:170px"><img src="{img(rid)}" style="width:100%;height:100%;object-fit:cover">{badge}
        <span class="chip" style="position:absolute;bottom:10px;left:10px;background:rgba(11,21,51,.7);color:#fff">{icon("map-pin", 12, "#fff")}{r["ville"]}</span></div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:8px;flex:1">
        <b style="font-size:16px">{r["nom"]}</b><span class="small mute">{r["operateur"]}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">{officiel(r, True)}{public}</div>
        <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:end;border-top:1px solid #eef1f8;padding-top:10px">
          <span class="small mute">{r["capacite_lits"] or r["nb_logements"]} {"lits" if r["capacite_lits"] else "logements"}</span>
          <span><span class="small mute">à partir de </span><b style="font-size:18px;color:#0b1533">{prix(r["a_partir_de"])}</b><span class="small mute"> /mois</span></span></div>
      </div></div>"""


# ---------------------------------------------------------------- 1. Accueil Navilease
def accueil():
    cartes = "".join(carte(i, 318) for i in ["sh-tanger", "bam-casablanca", "twenty-casa-anfa", "sh-settat"])
    return f"""<div class="frame" style="width:1440px;height:820px;background:#fff"><div class="titre-cadre">1 · Accueil Navilease : nouvelle rangée « Résidences universitaires »</div>
  {entete()}
  <div style="padding:30px 48px;background:linear-gradient(135deg,#fff7dd,#fff 55%)">
    <p class="small mute" style="font-weight:800;letter-spacing:.08em">NAVILEASE · LOGEMENT ÉTUDIANT AU MAROC</p>
    <h1 style="font-size:40px;margin-top:6px">Ton logement près de ton école</h1>
    <p class="mute" style="margin-top:6px;font-size:16px">Studios et colocations de particuliers vérifiés, et résidences universitaires présentées avec leurs vrais prix.</p></div>
  <div style="padding:6px 48px">
    <div style="display:flex;justify-content:space-between;align-items:end"><div><p class="label" style="margin:0">RÉSIDENCES UNIVERSITAIRES</p>
      <h2 style="font-size:26px;margin-top:4px">14 résidences dans 10 villes, dès 650 DH par mois</h2>
      <p class="mute small" style="margin-top:4px">{icon("info", 12, "#5b6478")} Prix et conditions relevés sur les sites officiels (novembre 2026). Tu réserves directement auprès de la résidence.</p></div>
      <span class="btn ghost">Voir toutes les résidences{icon("arrow-right", 15, "#1a47f5")}</span></div>
    <div style="display:flex;gap:18px;margin-top:16px">{cartes}</div></div>
  <div {NOTE} style="left:1110px;top:110px;max-width:290px">Nouveau : rangée « Résidences universitaires » au-dessus des logements de particuliers</div>
  <div {NOTE} style="left:60px;top:770px;max-width:520px">Chaque carte rappelle que la réservation se fait sur le site officiel de la résidence (pas de paiement via Navilease)</div>
</div>"""


# ---------------------------------------------------------------- 2. Liste des résidences
def liste():
    ids = ["twenty-casa-anfa", "bam-rabat", "bam-casablanca", "sh-tanger", "sh-settat", "resu-ziraoui"]
    cartes = "".join(carte(i, 300) for i in ids)
    villes = "".join(f'<span class="chip" style="background:{"#1a47f5" if v == "Toutes" else "#fff"};color:{"#fff" if v == "Toutes" else "#3b4566"};border:1px solid #e6eaf3;padding:7px 12px">{v}</span>' for v in ["Toutes", "Casablanca", "Rabat", "Tanger", "Settat", "Meknès", "Marrakech", "Agadir", "El Jadida"])
    return f"""<div class="frame" style="width:1440px;height:980px"><div class="titre-cadre">2 · Liste des résidences : filtres ville, budget et public</div>
  {entete()}
  <div style="padding:24px 48px;display:grid;grid-template-columns:280px 1fr;gap:28px">
    <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:16px;height:fit-content">
      <b>Filtrer</b>
      <div><p class="label">Budget mensuel maximum</p><div style="height:6px;border-radius:9px;background:linear-gradient(90deg,#1a47f5 55%,#e6eaf3 55%)"></div><p class="small mute" style="margin-top:6px">jusqu'à 3 000 DH</p></div>
      <div><p class="label">Type de logement</p>{"".join(f'<p class="small" style="margin:6px 0">{icon("square", 13, "#5b6478")} {t}</p>' for t in ["Chambre partagée", "Chambre ou studio individuel", "Accès PMR"])}</div>
      <div><p class="label">Ouverture</p><p class="small" style="margin:6px 0">{icon("square-check", 13, "#1a47f5")} Ouvertes à tous les étudiants</p><p class="small mute" style="margin:6px 0">{icon("square", 13, "#5b6478")} Inclure les résidences d'une université</p></div>
      <div style="background:#f6f8fe;border-radius:12px;padding:10px" class="small mute">{icon("shield-check", 13, "#0f8a46")} Informations vérifiées sur les sites officiels, à reconfirmer avec la résidence à chaque rentrée.</div>
    </div>
    <div>
      <h1 style="font-size:30px">Résidences universitaires au Maroc</h1>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">{villes}</div>
      <p class="small mute" style="margin-top:12px"><b style="color:#0b1533">14 résidences</b> · triées par prix croissant</p>
      <div style="display:grid;grid-template-columns:repeat(3,300px);gap:18px;margin-top:12px">{cartes}</div>
    </div>
  </div>
  <div {NOTE} style="left:60px;top:560px;max-width:240px">Les résidences réservées aux étudiants d'une université (ex. UM6SS) sont signalées et filtrables</div>
</div>"""


# ---------------------------------------------------------------- 3. Fiche résidence
def fiche(rid="twenty-casa-anfa"):
    r = R[rid]
    lignes = "".join(f'<tr><td><b>{l["type"]}</b></td><td class="mute">{l.get("surface") or "—"}</td><td><b>{prix(l["loyer_min"])}</b> <span class="mute small">{l["unite"]}</span></td><td class="mute">{prix(l["partage"]) + " / pers. à deux" if l.get("partage") else "—"}</td></tr>' for l in r["logements"])
    inclus = "".join(f'<span class="chip" style="background:#e8f8ef;color:#0f8a46">{icon("check", 12, "#0f8a46")}{t}</span>' for t in r["inclus"])
    frais = "".join(f'<p class="small" style="margin:4px 0">{f["libelle"]} : <b>{prix(f["montant"])}</b></p>' for f in r["frais"]) or '<p class="small mute">Aucun frais publié</p>'
    galerie = f"""<div style="display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:170px 170px;gap:8px;border-radius:18px;overflow:hidden">
      <img src="{img(rid, 0)}" style="grid-row:span 2;width:100%;height:100%;object-fit:cover"><img src="{img(rid, 1)}" style="width:100%;height:100%;object-fit:cover">
      <img src="{img(rid, 2)}" style="width:100%;height:100%;object-fit:cover"><img src="{img(rid, 3)}" style="width:100%;height:100%;object-fit:cover">
      <div style="position:relative"><img src="{img(rid, 4)}" style="width:100%;height:100%;object-fit:cover"><span class="chip" style="position:absolute;right:8px;bottom:8px;background:#fff;color:#0b1533">{icon("images", 12, "#0b1533")}5 photos</span></div></div>"""
    return f"""<div class="frame" style="width:1440px;height:1180px"><div class="titre-cadre">3 · Fiche résidence : photos, loyers, inclus, conditions, réservation sur le site officiel</div>
  {entete()}
  <div style="padding:22px 48px">
    <p class="small mute">Navilease › Résidences › {r["ville"]} › {r["nom"]}</p>
    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:10px"><div><h1 style="font-size:32px">{r["nom"]}</h1>
      <p class="mute" style="margin-top:4px">{icon("map-pin", 14, "#5b6478")} {r["adresse"]}, {r["ville"]} · {r["operateur"]}</p></div>{officiel(r)}</div>
    <div style="margin-top:16px">{galerie}</div>
    <p class="small mute" style="margin-top:6px">Photos : © {r["operateur"]} (site officiel)</p>
    <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;margin-top:18px">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div><p class="label">LOGEMENTS ET LOYERS</p><div class="card" style="padding:4px 6px"><table><tr><th>Logement</th><th>Surface</th><th>Loyer</th><th>À deux</th></tr>{lignes}</table></div></div>
        <div><p class="label">COMPRIS DANS LE LOYER</p><div style="display:flex;gap:6px;flex-wrap:wrap">{inclus}</div></div>
        <div><p class="label">À PROXIMITÉ</p><p class="small">{" · ".join(r["proximite"])}</p></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="padding:18px"><span class="small mute">À partir de</span><p style="font-size:28px;font-weight:800">{prix(r["a_partir_de"])}<span class="small mute"> / mois</span></p>
          <p class="small mute">≈ 370 000 F CFA · selon ta monnaie</p>{frais}
          <p class="small" style="margin-top:6px">{icon("calendar", 12, "#5b6478")} {r["duree"]}</p>
          <span class="btn primary" style="width:100%;margin-top:12px">{r["reservation"]["libelle"]}{icon("external-link", 15, "#fff")}</span>
          <p class="small mute" style="margin-top:8px">{icon("info", 12, "#5b6478")} La réservation et le paiement se font sur le site officiel de la résidence. Navilease ne perçoit aucun paiement pour cette résidence.</p></div>
        <div class="card" style="padding:16px"><b>Contact de la résidence</b><p class="small" style="margin-top:6px">{r["contact"]["telephone"]}<br>{r["contact"]["email"]}</p></div>
        <div class="card" style="padding:16px;background:#f6f8fe;box-shadow:none"><b>Écoles proches sur Navigoal</b><p class="small" style="margin-top:6px;color:#1a47f5;font-weight:700">ESCA École de Management →</p></div>
      </div>
    </div>
    <p class="small mute" style="margin-top:14px">Source : {", ".join(r["sources"])} · vérifié le 5 novembre 2026 · <span style="color:#1a47f5">signaler une information à corriger</span></p>
  </div>
  <div {NOTE} style="left:1100px;top:330px;max-width:300px">Bouton principal : ouvre le site officiel dans un nouvel onglet (lien suivi pour nos statistiques, sans donnée personnelle)</div>
  <div {NOTE} style="left:60px;top:1120px;max-width:560px">Sources et date de vérification affichées sur chaque fiche ; montants convertis dans la monnaie du visiteur comme ailleurs sur Navigoal</div>
</div>"""


# ---------------------------------------------------------------- 4. Mobile
def mobile(rid="sh-tanger"):
    r = R[rid]
    lignes = "".join(f'<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eef1f8"><span class="small"><b>{l["type"]}</b></span><b class="small">{prix(l["loyer_min"])}</b></div>' for l in r["logements"])
    return f"""<div class="frame" style="width:390px;height:1000px;background:#fff"><div class="titre-cadre">4 · Fiche résidence sur téléphone</div>
  <div style="height:56px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid #e6eaf3"><img src="{WORDMARK}" style="height:22px"></div>
  <div style="position:relative;height:240px"><img src="{img(rid)}" style="width:100%;height:100%;object-fit:cover"><span class="chip" style="position:absolute;right:10px;bottom:10px;background:#fff;color:#0b1533">1 / 4</span></div>
  <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
    <h1 style="font-size:22px">{r["nom"]}</h1><p class="small mute">{icon("map-pin", 12, "#5b6478")} {r["adresse"]}</p>{officiel(r, True)}
    <p class="label" style="margin-top:6px">LOGEMENTS ET LOYERS</p>{lignes}
    <p class="label" style="margin-top:6px">COMPRIS</p><p class="small">{" · ".join(r["inclus"][:5])}</p>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;padding:12px 16px;background:#fff;border-top:1px solid #e6eaf3;display:flex;align-items:center;gap:12px">
    <div><span class="small mute">dès</span><b style="font-size:18px"> {prix(r["a_partir_de"])}</b><span class="small mute">/mois</span></div>
    <span class="btn primary" style="flex:1">Réserver {icon("external-link", 14, "#fff")}</span></div>
  <div {NOTE} style="left:200px;top:640px;max-width:170px">Bouton fixe en bas : site officiel</div>
</div>"""


# ---------------------------------------------------------------- 5. Cas particuliers
def cas():
    return f"""<div class="frame" style="width:1440px;height:560px"><div class="titre-cadre">5 · Cas particuliers : résidence d'une université et résidence complète</div>
  <div style="padding:34px 48px;display:grid;grid-template-columns:1fr 1fr;gap:28px">
    <div class="card" style="padding:20px;display:flex;gap:16px"><img src="{img("resu-anfa-city")}" style="width:220px;height:160px;object-fit:cover;border-radius:14px">
      <div style="display:flex;flex-direction:column;gap:8px"><b style="font-size:18px">RESU Anfa City · Casablanca</b>
        <span class="chip" style="background:#f1edff;color:#6a3df0;width:fit-content">{icon("graduation-cap", 12, "#6a3df0")}Réservée aux étudiants de l'UM6SS</span>
        <p class="small">Chambre double 1 500 DH · triple 1 200 DH · individuelle 3 500 DH (places très limitées)</p>
        <p class="small mute">Demande après l'inscription définitive à l'UM6SS, sur resu.ma ou dans leurs bureaux. Contrat de 10 mois, ouvert du 1er septembre au 31 juillet.</p>
        <span class="btn ghost" style="width:fit-content">Voir l'UM6SS sur Navigoal{icon("arrow-right", 14, "#1a47f5")}</span></div></div>
    <div class="card" style="padding:20px;display:flex;gap:16px"><img src="{img("bam-rabat")}" style="width:220px;height:160px;object-fit:cover;border-radius:14px">
      <div style="display:flex;flex-direction:column;gap:8px"><b style="font-size:18px">Bayt Al Maârifa · Rabat</b>
        <span class="chip" style="background:#ffecef;color:#d42a50;width:fit-content">Complet pour 2026-2027</span>
        <p class="small">Chambre double dès 1 400 DH · individuelle dès 2 300 DH · PMR 2 600 DH</p>
        <p class="small mute">L'annonce reste visible avec la mention « complet » et propose les autres résidences de la ville.</p>
        <span class="btn ghost" style="width:fit-content">Autres résidences à Rabat{icon("arrow-right", 14, "#1a47f5")}</span></div></div>
  </div>
  <div style="padding:0 48px"><div class="card" style="padding:16px;background:#fff7dd;box-shadow:none"><b>Règles de présentation</b>
    <p class="small" style="margin-top:6px;line-height:1.7">• Prix uniquement s'ils sont publiés par la résidence (sinon « tarif sur demande »), avec la date de vérification.<br>
    • Photos des sites officiels, créditées à l'opérateur ; retrait sur simple demande.<br>
    • Aucune réservation ni paiement via Navilease pour ces résidences : le bouton mène au site officiel.<br>
    • Les logements de particuliers restent réservables sur Navilease (séquestre, contrat, état des lieux), comme aujourd'hui.</p></div></div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navilease · Résidences universitaires</title><style>{CSS}</style></head><body>
{accueil()}{liste()}{fiche()}{mobile()}{cas()}
</body></html>"""
open(os.path.join(P.OUT, "residences.html"), "w").write(html)
print("→", os.path.join(P.OUT, "residences.html"), f"({len(html) // 1024} Ko)")
