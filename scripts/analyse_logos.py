#!/usr/bin/env python3
"""Lisibilité des logos : repère ceux qui disparaîtraient sur un fond blanc (logo blanc ou très clair,
sur fond transparent) et ceux qui portent déjà leur propre fond sombre.

Sortie : data/referentiels/logos_fond.json → { "ma-uit": "sombre", … }
  « sombre » : logo clair, à poser sur un aplat sombre pour rester lisible ;
  « plein »  : le logo a déjà un fond opaque (pas de cadre blanc à ajouter).
Les logos lisibles tels quels ne sont pas listés.

Usage : python3 scripts/analyse_logos.py
"""
import glob
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS = os.path.join(ROOT, "assets", "logos")
SORTIE = os.path.join(ROOT, "data", "referentiels", "logos_fond.json")


def mesurer(f):
    im = Image.open(f).convert("RGBA")
    im.thumbnail((140, 140))
    px = list(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata())
    visibles = [(r, g, b) for r, g, b, a in px if a > 140]
    if not visibles:
        return None
    lum = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in visibles]
    return {
        "moyenne": sum(lum) / len(lum),
        "part_claire": sum(1 for l in lum if l > 225) / len(lum),
        "part_opaque": len(visibles) / len(px),
    }


def main():
    res = {}
    for f in sorted(glob.glob(os.path.join(LOGOS, "*", "*"))):
        if f.endswith(".json"):
            continue
        ident = os.path.splitext(os.path.basename(f))[0]
        try:
            m = mesurer(f)
        except Exception:
            continue  # SVG ou format non lisible : laissé tel quel
        if not m:
            continue
        if m["part_opaque"] > 0.92:
            # Image pleine (fond opaque) : elle porte son propre fond, clair ou sombre.
            res[ident] = "plein"
        elif m["part_claire"] > 0.55 or m["moyenne"] > 215:
            # Logo blanc ou très clair détouré : invisible sur blanc.
            res[ident] = "sombre"
    json.dump(res, open(SORTIE, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
    clairs = sum(1 for v in res.values() if v == "sombre")
    print(f"{len(res)} logos particuliers : {clairs} à poser sur fond sombre, {len(res) - clairs} avec fond intégré.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
