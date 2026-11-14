#!/usr/bin/env python3
"""Illustrations des métiers et des domaines : une photo différente par métier.

Source : Openverse (api.openverse.org), qui agrège Wikimedia Commons, Flickr, Rawpixel… ;
seules les licences libres sont retenues (CC0, domaine public, CC BY, CC BY-SA), avec auteur et lien.

Chaque photo n'est utilisée qu'une seule fois : deux métiers n'ont jamais la même image.
Sortie : web/public/images/metiers/<id>.webp + web/public/images/credits-metiers.json

Usage : python3 scripts/fetch_illustrations.py [--only met-xxx ...] [--force] [--max 96]
"""
import argparse
import datetime
import io
import json
import os
import re
import sys
import time

import threading
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METIERS = os.path.join(ROOT, "data", "referentiels", "metiers.json")
OUT_DIR = os.path.join(ROOT, "web", "public", "images", "metiers")
CREDITS = os.path.join(ROOT, "web", "public", "images", "credits-metiers.json")
API = "https://api.openverse.org/v1/images/"
UA = "NavigoalBot/1.0 (https://navigoal.net; contact@navigoal.net)"
LICENCES = "cc0,pdm,by,by-sa"
MAX_W = 1000
TODAY = datetime.date.today().isoformat()

# Requêtes par métier : termes concrets, en anglais (meilleure couverture d'Openverse),
# choisis pour montrer le geste professionnel plutôt qu'un décor.
REQUETES = {
    "met-medecin-generaliste": "doctor consultation patient",
    "met-medecin-specialiste": "surgeon operating theatre",
    "met-pharmacien": "pharmacy medicines shelves pharmacist",
    "met-chirurgien-dentiste": "dentist dental chair treatment",
    "met-infirmier": "nurse hospital ward care",
    "met-sage-femme": "midwife mother newborn",
    "met-technicien-laboratoire": "medical laboratory microscope samples",
    "met-kinesitherapeute": "physiotherapy rehabilitation exercise",
    "met-epidemiologiste": "public health vaccination campaign",
    "met-veterinaire": "veterinarian examining cattle",
    "met-developpeur-web-mobile": "programmer writing code screen",
    "met-ingenieur-logiciel": "software team whiteboard architecture",
    "met-data-analyst": "data analyst dashboard computer",
    "met-data-scientist": "data science computer programming",
    "met-admin-reseaux": "network server room cables",
    "met-expert-cybersecurite": "cybersecurity padlock computer",
    "met-ingenieur-telecoms": "telecom antenna tower technician",
    "met-ux-ui-designer": "wireframe sketch interface design",
    "met-chef-projet-digital": "project planning sticky notes team",
    "met-technicien-support": "computer repair technician desk",
    "met-electricien-electrotechnicien": "electrician electrical panel wiring",
    "met-technicien-maintenance": "industrial maintenance machine factory",
    "met-ingenieur-electricien": "electrical substation engineer",
    "met-ingenieur-mecanique": "machine workshop engineer",
    "met-ingenieur-genie-industriel": "factory production line workers",
    "met-ingenieur-procedes": "chemical plant process engineer",
    "met-automaticien": "industrial robot arm automation",
    "met-mecanicien-auto": "car mechanic garage engine",
    "met-ingenieur-textile": "textile factory sewing machines",
    "met-ingenieur-genie-civil": "civil engineering bridge construction",
    "met-conducteur-travaux": "construction site supervisor plans",
    "met-architecte": "architect office drawing plans",
    "met-urbaniste": "city planning aerial view",
    "met-geometre-topographe": "surveyor theodolite field",
    "met-dessinateur-projeteur": "technical drawing CAD blueprint",
    "met-geologue": "geologist rock samples field",
    "met-ingenieur-mines": "mining open pit machinery",
    "met-ingenieur-petrolier": "oil refinery pipes",
    "met-technicien-energies-renouvelables": "solar panels technician installation",
    "met-ingenieur-agronome": "agronomist crop field research",
    "met-technicien-agricole": "farmer tractor field africa",
    "met-entrepreneur-agricole": "market vegetables farmer selling",
    "met-ingenieur-eaux-forets": "forest ranger trees",
    "met-charge-environnement": "environmental monitoring water sampling",
    "met-technicien-peche": "fishing boat harbour nets",
    "met-statisticien": "statistics economist chart analysis",
    "met-chercheur": "researcher laboratory science experiment",
    "met-actuaire": "insurance risk calculation documents",
    "met-comptable": "accounting ledger calculator",
    "met-expert-comptable": "auditor financial documents review",
    "met-auditeur": "audit meeting documents review",
    "met-controleur-gestion": "business performance report meeting",
    "met-analyste-financier": "stock market trading screens",
    "met-charge-clientele-banque": "bank branch counter customer",
    "met-agent-mobile-money": "mobile money agent phone africa",
    "met-chef-projet": "team meeting planning board",
    "met-responsable-rh": "job interview office",
    "met-assistant-direction": "office assistant desk telephone",
    "met-entrepreneur": "small business owner shop africa",
    "met-consultant": "consultant presentation flipchart",
    "met-commercial": "salesperson customer handshake",
    "met-responsable-marketing": "marketing brainstorming campaign",
    "met-community-manager": "social media phone content creator",
    "met-gestionnaire-ecommerce": "online shop packages parcels",
    "met-logisticien": "warehouse forklift pallets",
    "met-transitaire": "container port customs",
    "met-pilote-ligne": "airplane cockpit pilot",
    "met-controleur-aerien": "air traffic control tower",
    "met-technicien-maintenance-aero": "aircraft maintenance hangar engineer",
    "met-avocat": "lawyer courtroom robe",
    "met-magistrat": "judge courtroom justice trial",
    "met-notaire": "signing contract notary documents",
    "met-juriste-entreprise": "legal books contract office",
    "met-administrateur-civil": "government office administration",
    "met-diplomate": "diplomacy conference flags",
    "met-inspecteur-impots": "tax office documents stamp",
    "met-enseignant-secondaire": "teacher classroom blackboard secondary",
    "met-instituteur": "primary school children classroom africa",
    "met-conseiller-orientation": "career guidance counselling student",
    "met-psychologue": "counselling session two people talking",
    "met-travailleur-social": "social worker community support",
    "met-sociologue": "social research interview survey",
    "met-traducteur-interprete": "interpreter headphones conference",
    "met-bibliothecaire-documentaliste": "library books shelves",
    "met-coach-sportif": "sports coach training athletes stadium",
    "met-officier-militaire": "police officer gendarmerie patrol",
    "met-journaliste": "journalist microphone interview",
    "met-charge-communication": "press conference communication team",
    "met-realisateur-monteur": "video editing timeline studio",
    "met-graphiste": "graphic designer workspace sketches",
    "met-artiste-plasticien": "artist painting studio canvas",
    "met-gestionnaire-patrimoine-culturel": "museum heritage exhibition visitors",
    "met-styliste": "fashion designer fabric atelier",
    "met-gestionnaire-hotel": "hotel lobby reception",
    "met-agent-tourisme": "tour guide tourists monument",
    "met-chef-cuisinier": "chef kitchen cooking restaurant",
}

# Repli par domaine quand un métier ne donne rien : une scène du secteur, jamais un pictogramme.
SECOURS = {
    "dom-sante": "hospital staff care", "dom-numerique": "computer office work", "dom-ingenierie": "engineering workshop",
    "dom-btp": "construction site", "dom-energie-mines": "industrial plant", "dom-agri-env": "agriculture field work",
    "dom-sciences": "laboratory research", "dom-finance": "office documents desk", "dom-gestion": "business meeting",
    "dom-commerce": "shop customers", "dom-transport-logistique": "warehouse logistics", "dom-droit": "law books court",
    "dom-admin-publique": "public administration office", "dom-education": "classroom teaching", "dom-shs": "people talking interview",
    "dom-lettres-langues": "books reading library", "dom-securite-defense": "training field exercise",
    "dom-communication": "press microphone", "dom-arts-design": "art studio creative", "dom-tourisme": "hotel restaurant service",
}
MOTS_INTERDITS = ("logo", "icon", "clipart", "diagram", "chart of", "map of", "coat of arms", "flag of", "stamp of", "poster")


def metiers():
    d = json.load(open(METIERS, encoding="utf-8"))
    return d.get("items", d.get("metiers", []))


def get(url, **kw):
    """GET avec reprise : Openverse et Wikimedia renvoient souvent 429 ou 504 en rafale."""
    err = None
    for essai in range(3):
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=45, **kw)
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(2 * (essai + 1))
                err = f"{r.status_code}"
                continue
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            err = str(e)[:80]
            time.sleep(2 * (essai + 1))
    raise RuntimeError(err or "échec")


def pertinent(x, mots):
    """La photo parle-t-elle bien du métier ? Son titre, ses mots-clés ou sa description doivent reprendre
    deux mots de la recherche (un seul quand la recherche est courte) : la pertinence d'Openverse ramène
    trop de photos hors sujet, et un mot commun (« session », « office ») suffirait à en laisser passer.""" 
    champs = " ".join([x.get("title") or "", x.get("description") or "",
                       " ".join(t.get("name", "") for t in (x.get("tags") or []))]).lower()
    return sum(1 for m in mots if m in champs) >= min(2, len(mots))


def chercher(q, deja, pages=3):
    """Première photo libre, large, pertinente et pas déjà utilisée pour cette recherche."""
    mots = [m for m in re.findall(r"[a-zéèêàç]{4,}", q.lower()) if m not in ("avec", "dans", "pour")]
    for page in range(1, pages + 1):
        try:
            r = get(API, params={"q": q, "license": LICENCES, "category": "photograph",
                                 "page_size": 20, "page": page, "mature": "false"})
            res = r.json().get("results", [])
        except Exception as e:  # réseau, quota : on passe au métier suivant
            print(f"    ! recherche impossible ({e})")
            return None
        for x in res:
            url, titre = x.get("url") or "", (x.get("title") or "").lower()
            if not url or url in deja:
                continue
            if any(m in titre for m in MOTS_INTERDITS):
                continue
            if (x.get("width") or 0) < 800 or (x.get("height") or 0) < 450:
                continue
            if (x.get("height") or 0) > (x.get("width") or 1) * 1.1:  # portrait : mauvais cadrage en bandeau
                continue
            if not pertinent(x, mots):
                continue
            return x
        if not res:
            return None
    return None




def adresses(x):
    """Le relais d'Openverse d'abord : Wikimedia et Flickr refusent les téléchargements directs répétés."""
    t = x.get("thumbnail")
    return [u for u in ([f"{t}?full_size=true", t] if t else []) + [x.get("url")] if u]


def telecharger(x):
    derniere = None
    for u in adresses(x):
        try:
            r = get(u)
            break
        except Exception as e:
            derniere = e
    else:
        raise RuntimeError(derniere or "téléchargement impossible")
    im = Image.open(io.BytesIO(r.content))
    im = im.convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    # Cadrage 16/9 centré : les cartes affichent un bandeau large.
    cible = round(im.width * 9 / 16)
    if im.height > cible:
        haut = round((im.height - cible) * 0.35)  # un peu au-dessus du centre : les visages y sont
        im = im.crop((0, haut, im.width, haut + cible))
    return im


VERROU = threading.Lock()


def illustrer(m, credits, deja, force):
    """Cherche, télécharge et enregistre l'illustration d'un métier. Renvoie True si une image a été ajoutée."""
    mid = m["id"]
    dest = os.path.join(OUT_DIR, f"{mid.replace('met-', '')}.webp")
    if os.path.exists(dest) and not force and mid in credits:
        return False
    q = REQUETES.get(mid)
    if not q:
        print(f"  – {mid} : pas de requête définie")
        return False
    # Requête précise, puis repli sur les deux premiers mots, puis sur le domaine : on finit toujours par une image.
    x = None
    for essai in (q, " ".join(q.split()[:2]), SECOURS.get(m.get("domaine", ""), "students working")):
        with VERROU:
            vus = set(deja)
        x = chercher(essai, vus)
        if x:
            with VERROU:
                if x["url"] in deja:  # un autre fil vient de la prendre
                    x = None
                else:
                    deja.add(x["url"])
            if x:
                break
    if not x:
        print(f"  · {m['nom']} : aucune photo pertinente trouvée")
        return False
    try:
        im = telecharger(x)
    except Exception as e:
        print(f"  · {m['nom']} : téléchargement impossible ({e})")
        return False
    im.save(dest, "WEBP", quality=82, method=5)
    with VERROU:
        credits[mid] = {
            "src": f"/images/metiers/{os.path.basename(dest)}",
            "alt": m["nom"],
            "credit": (x.get("creator") or x.get("source") or "Openverse")[:80],
            "licence": (x.get("license") or "").upper() + (" " + (x.get("license_version") or "") if x.get("license_version") else ""),
            "page": x.get("foreign_landing_url") or x.get("url"),
            "source": x["url"],
            "titre": (x.get("title") or "")[:120],
            "verifie": TODAY,
        }
        json.dump(credits, open(CREDITS, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
    print(f"  · {m['nom']} … ok ({im.width}×{im.height}, {credits[mid]['credit']} — « {credits[mid]['titre'][:50]} »)")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=None)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--max", type=int, default=200)
    ap.add_argument("--fils", type=int, default=4)
    a = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    credits = json.load(open(CREDITS, encoding="utf-8")) if os.path.exists(CREDITS) else {}
    deja = {c["source"] for c in credits.values() if c.get("source")}
    liste = [m for m in metiers() if not a.only or m["id"] in a.only][: a.max]
    with ThreadPoolExecutor(max_workers=a.fils) as ex:
        faits = sum(1 for r in ex.map(lambda m: illustrer(m, credits, deja, a.force), liste) if r)
    json.dump(credits, open(CREDITS, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
    manquants = [m["id"] for m in metiers() if m["id"] not in credits]
    print(f"{faits} illustration(s) ajoutée(s) · {len(credits)} métiers illustrés sur {len(metiers())}")
    if manquants:
        print("sans illustration :", " ".join(manquants))
    return 0


if __name__ == "__main__":
    sys.exit(main())
