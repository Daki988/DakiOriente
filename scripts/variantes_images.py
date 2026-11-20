#!/usr/bin/env python3
"""Variantes légères des photos du site : une même image servie à la taille où elle s'affiche.

Les vignettes (cartes de métiers, de formations, colonnes de filtres) chargeaient la photo en
1000 px de large alors qu'elles l'affichent en 40 à 360 px : près d'un mégaoctet pour la seule page
« Métiers ». On produit donc, à côté de chaque photo, une version 160 px et une version 400 px ;
le navigateur choisit la plus petite qui lui suffit (srcset + sizes, voir components/ui/Illustration).

Usage : python3 scripts/variantes_images.py [--forcer]
Sortie : web/public/images/**/<nom>-160/400/640/840.webp et assets/photos/**/<nom>-400/840.webp (les originaux ne sont pas touchés).
Elles sont servies par web/image-loader.js (next/image) et par le srcset de components/ui/Illustration.
"""
import argparse
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "web", "public", "images")
LARGEURS = (160, 400, 640, 840)
SUFFIXES = tuple(f"-{l}.webp" for l in LARGEURS)
# Photos des écoles, des villes et des résidences (assets/photos, copiées dans web/public/photos par sync-data) :
# JPEG d'origine gardés pour les grands écrans, variantes WebP 400 et 840 px servies par srcset (lib/photo-variantes.ts).
PHOTOS = os.path.join(ROOT, "assets", "photos")
LARGEURS_PHOTOS = (400, 840)


def originaux():
    """Photos de référence : les .webp qui ne sont pas eux-mêmes des variantes.

    Conséquence à respecter : une photo source ne doit JAMAIS s'appeler « nom-160/400/640/840.webp »,
    sinon elle est prise pour une variante, aucune variante n'est produite pour elle, et le srcset
    pointe vers des fichiers absents (l'image ne s'affiche plus). D'où « etudiante-cadree.webp ».
    """
    for dossier, _, fichiers in os.walk(IMAGES):
        for f in sorted(fichiers):
            if f.endswith(".webp") and not f.endswith(SUFFIXES):
                yield os.path.join(dossier, f)


def variantes(chemin):
    if chemin.startswith(PHOTOS):
        base = os.path.splitext(chemin)[0]
        return [(l, f"{base}-{l}.webp") for l in LARGEURS_PHOTOS]
    base = chemin[: -len(".webp")]
    return [(l, f"{base}-{l}.webp") for l in LARGEURS]


# Photos d'impression (roll-up, affiches, flyers) : jamais servies par le site, donc sans variantes web.
HORS_SITE = os.path.join(PHOTOS, "rollup")


def photos():
    for dossier, _, fichiers in os.walk(PHOTOS):
        if dossier.startswith(HORS_SITE):
            continue
        for f in sorted(fichiers):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                yield os.path.join(dossier, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--forcer", action="store_true", help="réécrire les variantes existantes")
    ap.add_argument("--verifier", action="store_true", help="ne rien écrire : sortir en erreur s'il en manque")
    a = ap.parse_args()

    faits, manquantes, octets = 0, [], 0
    for src in [*originaux(), *photos()]:
        for largeur, dest in variantes(src):
            if os.path.exists(dest) and not a.forcer:
                continue
            if a.verifier:
                manquantes.append(os.path.relpath(dest, ROOT))
                continue
            from PIL import Image  # seulement pour produire : le contrôle (--verifier) tourne sans Pillow (CI, mise en ligne)
            im = Image.open(src)
            # Transparence conservée (ex. étudiante détourée de l'accueil) : sinon le fond devient noir.
            im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") and "A" in im.convert("RGBA").getbands() and im.convert("RGBA").getextrema()[3][0] < 255 else im.convert("RGB")
            if im.width <= largeur:
                im.save(dest, "WEBP", quality=80 if not src.startswith(PHOTOS) else 76, method=5)  # déjà petite : copie à sa taille
            else:
                im.resize((largeur, max(1, round(im.height * largeur / im.width))), Image.LANCZOS).save(dest, "WEBP", quality=78, method=5)
            octets += os.path.getsize(dest)
            faits += 1
    if a.verifier:
        if manquantes:
            print(f"{len(manquantes)} variante(s) manquante(s) : lancez python3 scripts/variantes_images.py", file=sys.stderr)
            for m in manquantes[:10]:
                print("  -", m, file=sys.stderr)
            return 1
        print("Variantes d'images : complètes.")
        return 0
    print(f"{faits} variante(s) écrite(s) ({octets // 1024} Ko au total).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
