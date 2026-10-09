#!/usr/bin/env python3
"""Collecte des photos des établissements (campus, bâtiments, salles) pour les fiches Navigoal.

Sources, par ordre de priorité :
  1. Wikidata P18 (image) → fichier Wikimedia Commons, avec auteur et licence (attribution obligatoire) ;
  2. site officiel → image de partage (og:image / twitter:image) et grandes images du bandeau d'accueil.

Les images sont redimensionnées (1000 px de large maximum, JPEG) dans assets/photos/<pays>/<id>-<n>.jpg
et décrites dans data/referentiels/etablissements_superieurs.json (champ « photos »).
Les photos issues des sites restent la propriété des établissements : elles servent à présenter leur cadre
d'enseignement et doivent être confirmées (ou remplacées) lors de l'onboarding.

Usage : python3 scripts/fetch_photos.py [--force] [--only ID ...] [--max 3]
"""
import argparse
import datetime
import glob
import html as html_lib
import io
import json
import os
import re
import sys
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutTimeout

import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels", "etablissements_superieurs.json")
OUT = os.path.join(ROOT, "assets", "photos")
REJETS_PATH = os.path.join(OUT, "rejets.json")
UA = "NavigoalBot/1.0 (referentiel educatif)"
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TODAY = datetime.date.today().isoformat()
MAX_W = 1000
REJETS = json.load(open(REJETS_PATH, encoding="utf-8")) if os.path.exists(REJETS_PATH) else {}
BAD_HINTS = re.compile(r"logo|icon|favicon|avatar|sprite|placeholder|loader|banner-text|flag|badge|partner|partenaire", re.I)

session = requests.Session()
COMMONS_LOCK = threading.Lock()  # Wikimedia : une requête à la fois (limites de débit)


def get(url, ua=BROWSER_UA, timeout=15):
    for attempt in range(4):
        r = requests.get(url, timeout=(8, timeout), headers={"User-Agent": ua, "Accept-Language": "fr,en"}, allow_redirects=True, stream=True)
        r._content = b"".join(_limited(r, time.time() + timeout))
        if r.status_code != 429:
            return r
        time.sleep(int(r.headers.get("Retry-After", 0) or 0) or 15 * (attempt + 1))
    return r


def _limited(r, deadline, max_bytes=8_000_000):
    """Lit la réponse en respectant une échéance globale et une taille maximale (serveurs lents)."""
    size = 0
    for chunk in r.iter_content(65536):
        size += len(chunk)
        yield chunk
        if time.time() > deadline or size > max_bytes:
            break


def as_photo(content):
    """Retourne des octets JPEG si l'image ressemble à une photo exploitable (paysage, assez grande)."""
    try:
        im = Image.open(io.BytesIO(content))
        im.load()
    except Exception:
        return None
    w, h = im.size
    if w < 600 or h < 300 or not (1.15 <= w / h <= 2.6):
        return None
    im = im.convert("RGB")
    # Écarte les visuels quasi unis (bannières texte sur fond plat)
    small = im.resize((32, 16))
    colors = len(set(small.getdata()))
    if colors < 120:
        return None
    if w > MAX_W:
        im = im.resize((MAX_W, round(h * MAX_W / w)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=74, optimize=True, progressive=True)
    return buf.getvalue()


def commons_candidates(qids):
    """P18 (image) et P8592 (vue aérienne) des entités Wikidata, avec auteur et licence Commons."""
    out = {}
    qids = [q for q in qids if q]
    for i in range(0, len(qids), 50):
        r = get("https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids=" + "|".join(qids[i:i + 50]), ua=UA)
        for qid, ent in r.json().get("entities", {}).items():
            files = []
            for prop in ("P18", "P8592", "P3451"):
                for c in ent.get("claims", {}).get(prop, []):
                    v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
                    if isinstance(v, str):
                        files.append(v)
            out[qid] = files
        time.sleep(1)
    return out


def commons_fetch(filename):
    with COMMONS_LOCK:
        return _commons_fetch(filename)


def _commons_fetch(filename):
    title = "File:" + filename
    r = get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": MAX_W, "format": "json"}), ua=UA)
    pages = r.json().get("query", {}).get("pages", {})
    info = next(iter(pages.values()), {}).get("imageinfo", [{}])[0]
    url = info.get("thumburl") or info.get("url")
    if not url or url in REJETS:
        return None
    meta = info.get("extmetadata", {})
    strip = lambda s: re.sub(r"<[^>]+>", "", html_lib.unescape(s or "")).strip()
    time.sleep(1.5)
    img = as_photo(get(url, ua=UA).content)
    if not img:
        return None
    return img, {
        "source_url": url, "page_source": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
        "credit": strip(meta.get("Artist", {}).get("value")) or "Wikimedia Commons",
        "licence": strip(meta.get("LicenseShortName", {}).get("value")) or None,
        "methode": "wikimedia_commons", "a_verifier": False,
    }


def site_candidates(site):
    try:
        r = get(site, timeout=20)
        page = r.text if "html" in r.headers.get("content-type", "") else ""
        base = r.url
    except Exception:
        return [], None
    urls = []
    for pat in (r"""<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>""",):
        for m in re.finditer(pat, page, re.I):
            c = re.search(r"""content\s*=\s*["']([^"']+)""", m.group(0), re.I)
            if c:
                urls.append(c.group(1))
    # grandes images (bandeaux, sliders, sections campus)
    for m in re.finditer(r"<img\b[^>]*>", page, re.I):
        tag = m.group(0)
        src = re.search(r"""(?:data-src|data-lazy-src|src)\s*=\s*["']([^"']+\.(?:jpe?g|webp|png)[^"']*)""", tag, re.I)
        if src and not BAD_HINTS.search(tag):
            urls.append(src.group(1))
    for m in re.finditer(r"""background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+\.(?:jpe?g|webp))""", page, re.I):
        urls.append(m.group(1))
    out = []
    for u in urls:
        u = urllib.parse.urljoin(base, html_lib.unescape(u.strip()))
        if u.startswith("http") and u not in out and u not in REJETS and not BAD_HINTS.search(u.rsplit("/", 1)[-1]):
            out.append(u)
    return out[:14], base


def collect(item, max_photos):
    photos = []
    for f in item.pop("_commons", []):
        if len(photos) >= max_photos:
            break
        try:
            res = commons_fetch(f)
        except Exception:
            res = None
        if res:
            photos.append(res)
    if len(photos) < max_photos and item.get("site_web"):
        cands, base = site_candidates(item["site_web"])
        seen_sizes = set()
        for u in cands:
            if len(photos) >= max_photos:
                break
            try:
                img = as_photo(get(u, timeout=20).content)
            except Exception:
                img = None
            if img and len(img) not in seen_sizes:
                seen_sizes.add(len(img))
                photos.append((img, {"source_url": u, "page_source": base, "credit": f"© {item['nom']}", "licence": None,
                                     "methode": "site_officiel", "a_verifier": True}))
    folder = os.path.join(OUT, item["pays"].lower())
    os.makedirs(folder, exist_ok=True)
    for old in glob.glob(os.path.join(folder, item["id"] + "-*.jpg")):
        os.remove(old)
    result = []
    for n, (img, meta) in enumerate(photos, 1):
        path = os.path.join(folder, f"{item['id']}-{n}.jpg")
        with open(path, "wb") as fh:
            fh.write(img)
        result.append({"fichier": os.path.relpath(path, ROOT), **meta, "date_collecte": TODAY})
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--max", type=int, default=3)
    args = ap.parse_args()
    doc = json.load(open(REF, encoding="utf-8"))
    todo = [it for it in doc["items"] if (not args.only or it["id"] in args.only) and (args.force or args.only or not it.get("photos"))]
    commons = commons_candidates([it.get("wikidata") for it in todo])
    for it in todo:
        it["_commons"] = commons.get(it.get("wikidata"), [])
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {it["id"]: pool.submit(collect, it, args.max) for it in todo}
        for it in todo:
            try:
                it["photos"] = futures[it["id"]].result(timeout=240)
            except FutTimeout:
                it["photos"] = it.get("photos") or []
            except Exception:
                it["photos"] = []
            it.pop("_commons", None)
            print(f"{len(it['photos'])} photo(s)  {it['id']}  {[p['methode'] for p in it['photos']]}", flush=True)
    with open(REF, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    total = sum(1 for it in doc["items"] if it.get("photos"))
    print(f"{total}/{len(doc['items'])} établissements avec au moins une photo")


if __name__ == "__main__":
    sys.exit(main())
