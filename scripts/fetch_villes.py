#!/usr/bin/env python3
"""Photo de couverture de chaque ville étudiante (Wikimedia Commons, via Wikidata P18), avec auteur et licence.
Sert de couverture aux fiches dont l'établissement n'a pas encore fourni de photos. Résultat : champ « couverture »
de data/referentiels/mobilite_villes.json et fichiers assets/photos/villes/<ville>.jpg."""
import io, json, os, re, time, unicodedata, urllib.parse
import requests
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels", "mobilite_villes.json")
OUT = os.path.join(ROOT, "assets", "photos", "villes")
UA = {"User-Agent": "NavigoalBot/1.0 (referentiel educatif)"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()).strip("-")


def jget(url, **kw):
    for k in range(4):
        r = requests.get(url, headers=UA, timeout=30, **kw)
        try:
            return r.json()
        except ValueError:
            time.sleep(5 * (k + 1))
    raise RuntimeError(f"réponse invalide : {url}")


def main():
    doc = json.load(open(REF, encoding="utf-8"))
    for ville, v in doc["items"].items():
        if v.get("couverture"):
            continue
        # Identifiant Wikidata : premier résultat dont la description situe la ville au Maroc
        res = jget("https://www.wikidata.org/w/api.php", params={"action": "wbsearchentities", "search": ville, "language": "fr", "type": "item", "limit": 10, "format": "json"})
        qid = next((r["id"] for r in res.get("search", []) if "maroc" in (r.get("description") or "").lower() or "morocco" in (r.get("description") or "").lower()), None)
        if not qid:
            print("— introuvable", ville); continue
        ent = jget(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
        claims = ent["entities"][qid]["claims"]
        if "P18" not in claims:
            print("—", ville); continue
        fn = claims["P18"][0]["mainsnak"]["datavalue"]["value"]
        meta = jget("https://commons.wikimedia.org/w/api.php", params={"action": "query", "titles": "File:" + fn, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1280, "format": "json"})
        info = next(iter(meta["query"]["pages"].values()))["imageinfo"][0]
        em = info.get("extmetadata", {})
        auteur = re.sub(r"<[^>]+>", "", em.get("Artist", {}).get("value", "")).strip() or "Wikimedia Commons"
        img = None
        for k in range(3):
            try:
                img = Image.open(io.BytesIO(requests.get(info["thumburl"], headers=UA, timeout=60).content)).convert("RGB"); break
            except Exception:
                time.sleep(6 * (k + 1))
        if img is None:
            print("— image indisponible", ville); continue
        img.thumbnail((1400, 1400))
        path = os.path.join(OUT, slug(ville) + ".jpg")
        img.save(path, quality=82)
        v["couverture"] = {"fichier": os.path.relpath(path, ROOT), "credit": f"{auteur[:80]} (Wikimedia Commons)", "licence": em.get("LicenseShortName", {}).get("value"),
                           "page_source": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(fn.replace(" ", "_"))}
        print("OK", ville, fn, flush=True)
        json.dump(doc, open(REF, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        time.sleep(2)
    json.dump(doc, open(REF, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
