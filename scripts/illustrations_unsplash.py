#!/usr/bin/env python3
"""Illustrations des métiers : téléchargement des photos Unsplash choisies et relues.

Entrée : un fichier JSON { "photos": { "<metier sans le préfixe met->": {
             "id": …, "url": <urls.raw>, "auteur": …, "pseudo": …, "alt": …, "page": … } } }
produit par la sélection Unsplash (recherche + relecture de chaque photo, puis `download_asset`
pour déclarer le téléchargement comme le demande Unsplash).

Sortie : web/public/images/metiers/<metier>.webp (1000 px de large, cadrage 16/9)
         + web/public/images/credits-metiers.json (auteur, lien, source, date).

Usage : python3 scripts/illustrations_unsplash.py choix.json [--remplacer]
"""
import argparse
import datetime
import io
import json
import os
import sys
import time

import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METIERS = os.path.join(ROOT, "data", "referentiels", "metiers.json")
OUT_DIR = os.path.join(ROOT, "web", "public", "images", "metiers")
CREDITS = os.path.join(ROOT, "web", "public", "images", "credits-metiers.json")
UA = "NavigoalBot/1.0 (https://navigoal.net; contact@navigoal.net)"
MAX_W = 1000
TODAY = datetime.date.today().isoformat()


def noms():
    d = json.load(open(METIERS, encoding="utf-8"))
    return {m["id"]: m["nom"] for m in d.get("items", [])}


def telecharger(url):
    """Photo au format utile : 1200 px de large suffisent pour un bandeau de carte."""
    sep = "&" if "?" in url else "?"
    r = requests.get(f"{url}{sep}fm=jpg&q=82&w=1400&fit=max", headers={"User-Agent": UA}, timeout=60)
    r.raise_for_status()
    im = Image.open(io.BytesIO(r.content)).convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    cible = round(im.width * 9 / 16)
    if im.height > cible:
        haut = round((im.height - cible) * 0.35)  # un peu au-dessus du centre : les visages y sont
        im = im.crop((0, haut, im.width, haut + cible))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("choix", help="fichier JSON des photos retenues")
    ap.add_argument("--remplacer", action="store_true", help="réécrire les images déjà présentes")
    a = ap.parse_args()

    choix = json.load(open(a.choix, encoding="utf-8"))
    photos = choix.get("photos", choix)
    nom = noms()
    credits = json.load(open(CREDITS, encoding="utf-8")) if os.path.exists(CREDITS) else {}
    os.makedirs(OUT_DIR, exist_ok=True)
    vus, faits, erreurs = set(), 0, []
    for court, p in sorted(photos.items()):
        mid = court if court.startswith("met-") else f"met-{court}"
        if p.get("id") in vus:
            erreurs.append(f"{mid} : photo en double ({p['id']})")
            continue
        dest = os.path.join(OUT_DIR, f"{mid.replace('met-', '')}.webp")
        if os.path.exists(dest) and not a.remplacer and credits.get(mid, {}).get("banque") == "Unsplash":
            continue
        try:
            im = telecharger(p["url"])
        except Exception as e:
            erreurs.append(f"{mid} : téléchargement impossible ({str(e)[:70]})")
            continue
        im.save(dest, "WEBP", quality=82, method=5)
        vus.add(p.get("id"))
        credits[mid] = {
            "src": f"/images/metiers/{os.path.basename(dest)}",
            "alt": nom.get(mid, mid),
            "credit": p.get("auteur") or p.get("pseudo") or "Unsplash",
            "licence": "Unsplash",
            "banque": "Unsplash",
            "page": p.get("page") or (f"https://unsplash.com/photos/{p['id']}" if p.get("id") else ""),
            "source": p["url"],
            "titre": (p.get("alt") or "")[:120],
            "verifie": TODAY,
        }
        faits += 1
        print(f"  · {nom.get(mid, mid)} … ok ({im.width}×{im.height}, {credits[mid]['credit']} — « {credits[mid]['titre'][:50]} »)")
        time.sleep(0.2)
    json.dump(credits, open(CREDITS, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
    manquants = [m for m in nom if m not in credits]
    print(f"{faits} photo(s) enregistrée(s) · {len(credits)} métiers illustrés sur {len(nom)}")
    for e in erreurs:
        print("  !", e)
    if manquants:
        print("sans illustration :", " ".join(manquants))
    return 0


if __name__ == "__main__":
    sys.exit(main())
