#!/usr/bin/env python3
"""Planche de contrôle des illustrations de métiers : toutes les vignettes sur une image,
avec le nom du métier, pour vérifier d'un coup d'œil qu'aucune photo n'est hors sujet.

Usage : python3 scripts/planche_illustrations.py [sortie.jpg] [--colonnes 6]
"""
import argparse
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDITS = os.path.join(ROOT, "web", "public", "images", "credits-metiers.json")
PUBLIC = os.path.join(ROOT, "web", "public")
METIERS = os.path.join(ROOT, "data", "referentiels", "metiers.json")


def police(taille):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, taille)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sortie", nargs="?", default="planche-metiers.jpg")
    ap.add_argument("--colonnes", type=int, default=6)
    ap.add_argument("--largeur", type=int, default=320)
    a = ap.parse_args()

    credits = json.load(open(CREDITS, encoding="utf-8"))
    noms = {m["id"]: m["nom"] for m in json.load(open(METIERS, encoding="utf-8"))["items"]}
    ids = sorted(credits, key=lambda k: noms.get(k, k))
    tw, ih = a.largeur, round(a.largeur * 9 / 16)
    th = ih + 34
    cols = a.colonnes
    rows = (len(ids) + cols - 1) // cols
    planche = Image.new("RGB", (cols * tw, rows * th), (255, 255, 255))
    d = ImageDraw.Draw(planche)
    f = police(13)
    for i, k in enumerate(ids):
        x, y = (i % cols) * tw, (i // cols) * th
        chemin = PUBLIC + credits[k]["src"]
        if os.path.exists(chemin):
            planche.paste(Image.open(chemin).convert("RGB").resize((tw, ih)), (x, y))
        else:
            d.rectangle([x, y, x + tw, y + ih], fill=(240, 240, 240))
        nom = noms.get(k, k)
        d.text((x + 5, y + ih + 4), nom[:42], fill=(20, 20, 40), font=f)
        d.text((x + 5, y + ih + 19), (credits[k].get("banque") or credits[k].get("licence") or "")[:42], fill=(120, 120, 140), font=f)
    planche.save(a.sortie, "JPEG", quality=80)
    print(f"{len(ids)} vignettes → {a.sortie} ({planche.width}×{planche.height})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
