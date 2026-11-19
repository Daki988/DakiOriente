#!/usr/bin/env python3
"""Mises en situation du roll-up (novembre 2026) : scène « studio » et roll-up posé sur un campus.

Usage : python3 design/maquettes/rollup_situation.py <aperçu du roll-up .png> <sortie.html>
Puis capture par Playwright (voir docs/roll-up/README.md).
"""
import base64
import io
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
src, out = sys.argv[1], sys.argv[2]


def b64(path, side=None, fmt="PNG", q=88):
    im = Image.open(path)
    if side:
        im.thumbnail((side, side))
    buf = io.BytesIO()
    if fmt == "JPEG":
        im.convert("RGB").save(buf, "JPEG", quality=q)
    else:
        im.save(buf, "PNG", optimize=True)
    return f"data:image/{'jpeg' if fmt == 'JPEG' else 'png'};base64," + base64.b64encode(buf.getvalue()).decode()


ROLL = b64(src, 2400)
# Campus recadré : aucune banderole ni panneau d'établissement (consigne du 19/11/2026)
CAMPUS = b64(os.path.join(ROOT, "assets/photos/rollup/ecole-recadree.jpg"), 2600, "JPEG")


def rollup(h):
    """Roll-up à l'échelle h (hauteur de la toile en px) : barre haute, toile, cassette alu, ombre au sol."""
    w = round(h * 850 / 2000)
    return f"""<div style="position:relative;width:{w + 40}px;height:{h + 70}px">
  <div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:{w * 1.5}px;height:{h * 0.07}px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.42),rgba(0,0,0,0));filter:blur(4px)"></div>
  <div style="position:absolute;left:20px;top:0;width:{w}px;height:{h}px;box-shadow:0 30px 60px -20px rgba(0,0,0,.45)">
    <img src="{ROLL}" style="width:100%;height:100%;display:block">
    <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.10) 0%,rgba(255,255,255,.06) 18%,rgba(255,255,255,0) 40%,rgba(0,0,0,.05) 75%,rgba(0,0,0,.14) 100%)"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0) 30%)"></div></div>
  <div style="position:absolute;left:{20 - w * 0.01}px;top:-{h * 0.006}px;width:{w * 1.02}px;height:{max(6, h * 0.012)}px;border-radius:4px;background:linear-gradient(180deg,#f2f3f5,#9ea3ab 55%,#c9ccd2)"></div>
  <div style="position:absolute;left:{20 - w * 0.04}px;top:{h - 2}px;width:{w * 1.08}px;height:{h * 0.045}px;border-radius:{h * 0.01}px {h * 0.01}px 6px 6px;background:linear-gradient(180deg,#e9ebee 0%,#b7bbc2 45%,#8c9098 100%);box-shadow:0 6px 10px rgba(0,0,0,.3)"></div>
  <div style="position:absolute;left:{20 + w * 0.02}px;top:{h + h * 0.04}px;width:{w * 0.12}px;height:{h * 0.012}px;border-radius:3px;background:#6c7079;transform:rotate(-12deg)"></div>
  <div style="position:absolute;left:{20 + w * 0.86}px;top:{h + h * 0.04}px;width:{w * 0.12}px;height:{h * 0.012}px;border-radius:3px;background:#6c7079;transform:rotate(12deg)"></div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Roll-up en situation</title>
<style>body{{margin:0;background:#ddd;font-family:sans-serif}} .scene{{position:relative;overflow:hidden}}</style></head><body>
<div class="scene" id="studio" style="width:1600px;height:1200px;background:linear-gradient(180deg,#f3f4f7 0%,#e9ebf0 74%,#c9cdd5 74%,#d8dbe1 100%)">
  <div style="position:absolute;inset:0;background:radial-gradient(900px 700px at 52% 38%,rgba(255,255,255,.9),rgba(255,255,255,0) 70%)"></div>
  <div style="position:absolute;left:0;right:0;top:74%;height:2px;background:rgba(0,0,0,.08)"></div>
  <div style="position:absolute;left:50%;top:70px;transform:translateX(-50%)">{rollup(950)}</div>

</div>
<div class="scene" id="campus" style="width:1600px;height:1200px">
  <div style="position:absolute;inset:-20px;background:url({CAMPUS}) center 45%/cover;filter:blur(2.2px) saturate(1.05)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0) 55%,rgba(0,0,0,.12))"></div>
  <div style="position:absolute;left:560px;top:110px">{rollup(990)}</div>
</div>
</body></html>"""
open(out, "w").write(html)
print(out)
