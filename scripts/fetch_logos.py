#!/usr/bin/env python3
"""Télécharge les logos des établissements référencés dans Navigoal.

Stratégie, par ordre de priorité :
  0. URL fixée à la main (assets/logos/sources_manuelles.json) ;
  1. Wikidata — propriété P154 (logo), fichier Wikimedia Commons rendu en PNG 256 px ;
  2. site officiel — <img> dont src/alt/class/id contient « logo », puis apple-touch-icon, og:image, icône du site ;
  3. favicon haute résolution (service public de favicons) en dernier recours.

Chaque logo est enregistré dans assets/logos/<pays>/<id>.<ext> et décrit dans le JSON
(fichier, source_url, méthode, date). Les logos restent la propriété de leurs établissements :
ils servent à l'identification visuelle et doivent être confirmés lors de l'onboarding.

Usage : python3 scripts/fetch_logos.py [--force] [--only ID ...]
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
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels")
OUT = os.path.join(ROOT, "assets", "logos")
UA = "NavigoalBot/1.0 (referentiel educatif; contact: equipe Navigoal)"
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
TODAY = datetime.date.today().isoformat()
MIN_SIDE = 48
MAX_SIDE = 512

REJETS_PATH = os.path.join(OUT, "rejets.json")
# URL d'images écartées après revue visuelle (logo de partenaire, domaine expiré, favicon générique...)
REJETS = json.load(open(REJETS_PATH, encoding="utf-8")) if os.path.exists(REJETS_PATH) else {}

MANUELLES_PATH = os.path.join(OUT, "sources_manuelles.json")
# URL de logo fixées à la main quand la détection automatique échoue (prioritaires)
MANUELLES = json.load(open(MANUELLES_PATH, encoding="utf-8")) if os.path.exists(MANUELLES_PATH) else {}

session = requests.Session()


def get(url, timeout=25, ua=BROWSER_UA):
    return session.get(url, timeout=timeout, headers={"User-Agent": ua, "Accept-Language": "fr,en"}, allow_redirects=True)


def as_image(content):
    """Retourne (extension, octets) si le contenu est une image exploitable, sinon None."""
    head = content[:600].lstrip().lower()
    if head.startswith(b"<svg") or (head.startswith(b"<?xml") and b"<svg" in content[:2000].lower()):
        return "svg", content
    try:
        img = Image.open(io.BytesIO(content))
        img.load()
    except Exception:
        return None
    if min(img.size) < MIN_SIDE:
        return None
    if img.format in ("PNG", "JPEG", "WEBP") and max(img.size) <= MAX_SIDE and len(content) <= 150_000:
        return {"JPEG": "jpg"}.get(img.format, img.format.lower()), content
    # Autres formats (ICO, GIF, BMP...) ou images trop lourdes : PNG optimisé, 512 px max (faible consommation de données)
    img = img.convert("RGBA")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return "png", buf.getvalue()


WIKIDATA_LOGOS = {}


def load_wikidata_logos(qids):
    """Récupère en lot (50 par requête) le fichier logo P154 de chaque entité, pour respecter les limites de l'API."""
    qids = sorted({q for q in qids if q and q not in WIKIDATA_LOGOS})
    for i in range(0, len(qids), 50):
        url = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids=" + "|".join(qids[i:i + 50])
        for attempt in range(6):
            r = get(url, ua=UA)
            if r.status_code != 429:
                break
            time.sleep(int(r.headers.get("Retry-After", 0)) or 15 * (attempt + 1))
        r.raise_for_status()
        for qid, ent in r.json().get("entities", {}).items():
            claims = ent.get("claims", {}).get("P154", [])
            WIKIDATA_LOGOS[qid] = claims[0]["mainsnak"]["datavalue"]["value"] if claims else None
        time.sleep(1)


def from_wikidata(qid):
    filename = WIKIDATA_LOGOS.get(qid)
    if not filename:
        return None
    time.sleep(1)  # Commons : requêtes espacées
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(filename.replace(" ", "_")) + "?width=256"
    if url in REJETS:
        return None
    img = as_image(get(url, ua=UA).content)
    if img:
        return img, url, "wikidata_p154", "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(filename.replace(" ", "_"))
    return None


PARTNER_HINTS = re.compile(r"partenaire|partner|sponsor|accredit|certif|label|footer|client", re.I)


def candidates_from_html(html, base, keywords=()):
    """Liste ordonnée des images candidates : logos de l'en-tête correspondant à l'établissement d'abord,
    puis icônes déclarées par le site (apple-touch-icon, og:image, favicon)."""
    header_end = max(html.lower().find("</header>"), 0) or len(html) // 5
    keys = [k.lower() for k in keywords if k and len(k) >= 3]
    scored = []
    for m in re.finditer(r"<img\b[^>]*>", html, re.I):
        tag = m.group(0)
        src = re.search(r"""(?:data-src|src)\s*=\s*["']([^"']+)""", tag, re.I)
        if not src or not re.search(r"logo", tag, re.I):
            continue
        score = 0
        attrs = re.sub(r"""(?:data-src|src)\s*=\s*["'][^"']+["']""", "", tag)
        if re.search(r"logo", attrs, re.I):
            score += 2  # class / id / alt « logo »
        if m.start() <= header_end:
            score += 2
        if any(k in tag.lower() for k in keys):
            score += 3
        if PARTNER_HINTS.search(tag) or PARTNER_HINTS.search(html[max(0, m.start() - 300):m.start()]):
            score -= 4
        scored.append((-score, m.start(), src.group(1)))
    found = [u for _, _, u in sorted(scored)]
    for pat in [r"""<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>""",
                r"""<meta[^>]+property=["']og:image["'][^>]*>""",
                r"""<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>"""]:
        for m in re.finditer(pat, html, re.I):
            href = re.search(r"""(?:href|content)\s*=\s*["']([^"']+)""", m.group(0), re.I)
            if href:
                found.append(href.group(1))
    out = []
    for u in found:
        u = urllib.parse.urljoin(base, html_lib.unescape(u.strip()))
        if u.startswith("http") and u not in out:
            out.append(u)
    return out


def from_website(item):
    site = item.get("site_web")
    if not site:
        return None
    try:
        r = get(site, timeout=20)
        html = r.text if "html" in r.headers.get("content-type", "") else ""
        base = r.url
    except Exception:
        return None
    keywords = [item.get("sigle") or "", item["id"].split("-", 1)[1]] + re.findall(r"[A-Za-zÀ-ÿ]{5,}", item["nom"])[-2:]
    for u in [c for c in candidates_from_html(html, base, keywords) if c not in REJETS][:8]:
        try:
            img = as_image(get(u, timeout=20).content)
        except Exception:
            continue
        if img:
            return img, u, "site_officiel", base
    return None


def from_favicon(site):
    if not site:
        return None
    host = urllib.parse.urlparse(site).netloc
    url = f"https://www.google.com/s2/favicons?domain={host}&sz=256"
    if url in REJETS:
        return None
    try:
        r = get(url)
    except Exception:
        return None
    if r.status_code != 200:
        return None
    img = as_image(r.content)
    if img:
        return img, url, "favicon", site
    return None


def from_manual(item):
    url = MANUELLES.get(item["id"])
    if not url:
        return None
    img = as_image(get(url).content)
    return (img, url, "source_manuelle", item.get("site_web")) if img else None


def fetch(item):
    for step in (lambda: from_manual(item),
                 lambda: from_wikidata(item.get("wikidata")),
                 lambda: from_website(item),
                 lambda: from_favicon(item.get("site_web"))):
        try:
            res = step()
        except Exception:
            res = None
        if res:
            (ext, content), url, method, page = res
            folder = os.path.join(OUT, item["pays"].lower())
            os.makedirs(folder, exist_ok=True)
            for old in os.listdir(folder):
                if old.rsplit(".", 1)[0] == item["id"]:
                    os.remove(os.path.join(folder, old))
            path = os.path.join(folder, f"{item['id']}.{ext}")
            with open(path, "wb") as f:
                f.write(content)
            return {"fichier": os.path.relpath(path, ROOT), "source_url": url, "page_source": page,
                    "methode": method, "date_collecte": TODAY, "a_verifier": method not in ("wikidata_p154", "source_manuelle")}
    return None


def process(name, args, select):
    path = os.path.join(REF, name + ".json")
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    load_wikidata_logos(it.get("wikidata") for it in doc["items"] if select(it))
    todo = [it for it in doc["items"] if select(it) and (not args.only or it["id"] in args.only)
            and (args.force or not it.get("logo") or it["logo"]["source_url"] in REJETS
                 or (it["id"] in MANUELLES and it["logo"]["source_url"] != MANUELLES[it["id"]])
                 or (WIKIDATA_LOGOS.get(it.get("wikidata")) and it["logo"]["methode"] not in ("wikidata_p154", "source_manuelle")))]
    # Les logos Wikimedia sont téléchargés en série (limites de débit), les sites web en parallèle.
    serial = [it for it in todo if WIKIDATA_LOGOS.get(it.get("wikidata"))]
    parallel = [it for it in todo if not WIKIDATA_LOGOS.get(it.get("wikidata"))]
    results = {it["id"]: fetch(it) for it in serial}
    with ThreadPoolExecutor(max_workers=12) as pool:
        results.update(zip([it["id"] for it in parallel], pool.map(fetch, parallel)))
    results = [results[it["id"]] for it in todo]
    for it, logo in zip(todo, results):
        it["logo"] = logo
        if not logo:
            for old in glob.glob(os.path.join(OUT, it["pays"].lower(), it["id"] + ".*")):
                os.remove(old)
        print(f"{'OK ' if logo else '-- '} {it['id']:32s} {logo['methode'] if logo else 'aucun logo trouvé'}")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    total = [it for it in doc["items"] if select(it)]
    print(f"{name}: {sum(1 for it in total if it.get('logo'))}/{len(total)} logos")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-télécharge même si un logo existe")
    ap.add_argument("--only", nargs="*", help="limiter à ces identifiants")
    args = ap.parse_args()
    process("etablissements_superieurs", args, lambda it: True)
    # Secondaire : établissements curés, ou disposant d'un site / d'un QID Wikidata avec logo potentiel
    process("etablissements_secondaires", args, lambda it: it.get("source") == "curation" or it.get("site_web"))


if __name__ == "__main__":
    sys.exit(main())
