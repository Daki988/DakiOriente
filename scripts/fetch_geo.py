#!/usr/bin/env python3
"""Localisation et mobilité des établissements (OpenStreetMap / Nominatim).

Pour chaque campus : coordonnées, quartier, quartiers voisins, arrêts de tramway et de bus et gares
les plus proches. Résultat : data/sources/maroc/geo.json (fusionné par build_etablissements_maroc.py).
Données © contributeurs OpenStreetMap (ODbL). Nominatim : 1 requête par seconde au plus.
Usage : python3 scripts/fetch_geo.py [--force] [--only ID ...]
"""
import argparse, json, math, os, re, time, urllib.parse

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels", "etablissements_superieurs.json")
OUT = os.path.join(ROOT, "data", "sources", "maroc", "geo.json")
UA = "NavigoalBot/1.0 (referentiel educatif Navigoal)"
session = requests.Session()
_last = [0.0]


def nominatim(path, **params):
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    params.update(format="jsonv2", **{"accept-language": "fr"})
    try:
        r = session.get(f"https://nominatim.openstreetmap.org/{path}?" + urllib.parse.urlencode(params),
                        headers={"User-Agent": UA}, timeout=30)
        return r.json() if r.ok else None
    except Exception:
        return None


def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return round(6371000 * 2 * math.asin(math.sqrt(h)))


def latin(s):
    """Garde la partie en caractères latins d'un nom OSM multilingue (« Maârif المعاريف » → « Maârif »)."""
    parts = [p.strip() for p in re.split(r"[؀-ۿⴰ-⵿]+", s or "") if p.strip(" -–,")]
    return parts[0].strip(" -–,") if parts else None


PRECIS = {"amenity", "building", "house", "university", "college", "school", "office", "road", "residential", "neighbourhood",
          "quarter", "suburb", "city_district", "commercial", "industrial", "retail", "square", "pedestrian", "tertiary", "secondary", "primary"}


def geocode(item):
    """Adresse complète, puis nom de l'établissement, puis chaque segment de l'adresse (rue, quartier) dans la ville."""
    ville = item["ville"]
    a = item.get("adresse") or ""
    essais = []
    if a:
        essais += [(f"{a}, {ville}, Maroc", "adresse")]
    essais += [(f"{item['nom'].split(' – ')[0]}, {ville}", "adresse")]
    segs = [x.strip() for x in re.split(r"[,–-]", a) if len(x.strip()) > 3 and not re.fullmatch(r"(n°\s*)?[\d\s bis]+", x.strip(), flags=re.I)]
    for seg in segs:
        seg = re.sub(r"^(n°\s*)?\d+\s*(bis|ter)?\s*,?\s*", "", seg, flags=re.I)
        if seg and seg.lower() != ville.lower():
            essais.append((f"{seg}, {ville}, Maroc", "quartier"))
    for q, precision in essais:
        res = nominatim("search", q=q, countrycodes="ma", limit=1)
        if res:
            r = res[0]
            if r.get("addresstype") not in PRECIS and r.get("type") not in PRECIS:
                continue  # résultat trop vague (ville, région)
            return float(r["lat"]), float(r["lon"]), q, precision
    return None


def quartier_de(addr):
    return latin(addr.get("neighbourhood") or addr.get("quarter") or addr.get("suburb") or addr.get("city_district") or "")


def proches(pt, requete, rayon, types=None):
    lat, lon = pt
    d = rayon / 111000
    vb = f"{lon - d / math.cos(math.radians(lat))},{lat + d},{lon + d / math.cos(math.radians(lat))},{lat - d}"
    res = nominatim("search", q=requete, viewbox=vb, bounded=1, limit=15) or []
    out = {}
    for r in res:
        if types and r.get("type") not in types:
            continue
        nom = latin(r.get("name") or "") or latin((r.get("display_name") or "").split(",")[0])
        if not nom:
            continue
        m = dist(pt, (float(r["lat"]), float(r["lon"])))
        if m <= rayon and (nom not in out or m < out[nom]):
            out[nom] = m
    return sorted(({"nom": k, "distance_m": v} for k, v in out.items()), key=lambda x: x["distance_m"])


def collect(item):
    g = geocode(item)
    if not g:
        return {"precision": "introuvable"}
    lat, lon, q, precision = g
    pt = (lat, lon)
    rev = nominatim("reverse", lat=lat, lon=lon, zoom=17) or {}
    addr = rev.get("address", {})
    quartier = quartier_de(addr)
    voisins = []
    for dlat, dlon in ((0.009, 0), (-0.009, 0), (0, 0.011), (0, -0.011)):
        a = (nominatim("reverse", lat=lat + dlat, lon=lon + dlon, zoom=16) or {}).get("address", {})
        n = quartier_de(a)
        if n and n != quartier and n not in voisins:
            voisins.append(n)
    tram = proches(pt, "tram stop", 2000, {"tram_stop", "station", "stop"})[:3]
    bus = proches(pt, "bus stop", 600, {"bus_stop", "platform", "stop_position"})
    gares = [x for x in proches(pt, "railway station", 5000, {"station", "halt"}) if x["nom"] not in {t["nom"] for t in tram}][:2]
    return {
        "coordonnees": {"lat": round(lat, 6), "lon": round(lon, 6)},
        "precision": precision,
        "requete": q,
        "quartier": quartier,
        "arrondissement": re.sub(r"^Préfecture d'arrondissements de |^Arrondissement de ", "", latin(addr.get("city_district") or "") or "") or None,
        "quartiers_voisins": voisins[:4],
        "tramway": tram,
        "bus": {"arrets_600m": len(bus), "plus_proche": bus[0] if bus else None},
        "gares": gares,
        "source": "OpenStreetMap (Nominatim), © contributeurs OSM, ODbL",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--retry", action="store_true", help="relance les campus introuvables")
    args = ap.parse_args()
    data = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    items = json.load(open(REF, encoding="utf-8"))["items"]
    # Campus des réseaux regroupés : chaque campus est localisé séparément
    cibles = []
    for it in items:
        for c in it.get("campus") or [it]:
            cibles.append({**c, "nom": it["nom"]} if c is not it else it)
    for it in cibles:
        if args.only and it["id"] not in args.only:
            continue
        if it["id"] in data and not args.force and not (args.retry and data[it["id"]].get("precision") == "introuvable"):
            continue
        data[it["id"]] = collect(it)
        r = data[it["id"]]
        print(f"{it['id']:32} {r.get('precision'):10} {r.get('quartier') or ''} | tram {len(r.get('tramway') or [])} | gares {len(r.get('gares') or [])}", flush=True)
        json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(sum(1 for v in data.values() if v.get("precision") in ("adresse", "quartier")), "/", len(data), "localisés")


if __name__ == "__main__":
    main()
