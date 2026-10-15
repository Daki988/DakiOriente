#!/usr/bin/env python3
"""Relevé du texte des sites officiels des établissements (accueil + pages utiles : formations, admission,
frais, présentation, contact). Sert de base vérifiable à l'extraction des informations : chaque donnée
retenue dans data/sources/maroc/sites/<id>.json doit figurer mot pour mot dans ce texte.
Usage : python3 scripts/crawl_sites.py --out DOSSIER [--only ID ...] [--pages 10]
"""
import argparse, json, os, re, urllib.parse
from concurrent.futures import ThreadPoolExecutor

import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "referentiels", "etablissements_superieurs.json")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
MOTS = [(r"frais|tarif|scolarit|fees|tuition|prix", 9), (r"admission|inscri|candidat|concours|apply", 8),
        (r"formation|programme|filiere|cursus|cycle|licence|master|bachelor|ingenieur|mba|diplome|bts|dut|specialit", 7),
        (r"presentation|propos|about|qui-sommes|ecole|histoire|mot-du", 5), (r"contact|campus|acces|localisation", 4),
        (r"bourse|international|logement|residence|vie-etudiant|partenaires|scholar", 4)]
EXCLUS = re.compile(r"\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4)$|/(wp-admin|wp-login|feed|tag|author|category)/|#|mailto:|tel:|javascript:|facebook|instagram|linkedin|youtube|twitter|whatsapp|/en/|/ar/|lang=en|lang=ar", re.I)
session = requests.Session()


def get(url):
    try:
        r = session.get(url, headers={"User-Agent": UA, "Accept-Language": "fr,en"}, timeout=25, allow_redirects=True)
        if r.ok and "html" in r.headers.get("content-type", ""):
            r.encoding = r.apparent_encoding if r.encoding in (None, "ISO-8859-1") else r.encoding
            return r.url, r.text
    except Exception:
        pass
    return None, None


def texte(html, garder_pied=False):
    soup = BeautifulSoup(html, "html.parser")
    for t in soup(["script", "style", "noscript", "svg", "iframe", "form"]):
        t.decompose()
    if not garder_pied:
        for t in soup(["nav", "header", "footer"]):
            t.decompose()
    lignes = [re.sub(r"\s+", " ", l).strip() for l in soup.get_text("\n").split("\n")]
    out, vu = [], set()
    for l in lignes:
        if len(l) < 3 or l in vu:
            continue
        vu.add(l)
        out.append(l)
    return "\n".join(out), soup


def liens(base, html):
    soup = BeautifulSoup(html, "html.parser")
    host = urllib.parse.urlparse(base).netloc.replace("www.", "")
    res = {}
    for a in soup.find_all("a", href=True):
        u = urllib.parse.urljoin(base, a["href"]).split("#")[0]
        p = urllib.parse.urlparse(u)
        if p.netloc.replace("www.", "") != host or EXCLUS.search(u) or u.rstrip("/") == base.rstrip("/"):
            continue
        cible = (p.path + " " + a.get_text(" ")).lower()
        cible = re.sub(r"[éèê]", "e", cible)
        score = sum(w for m, w in MOTS if re.search(m, cible))
        if score:
            res[u] = max(score, res.get(u, 0))
    return sorted(res, key=lambda u: (-res[u], len(u)))


def releve(item, n_pages, out):
    site = item.get("site_web")
    if not site:
        return item["id"], 0, 0
    url, html = get(site)
    if not html and site.startswith("https://"):
        url, html = get("http://" + site[8:])
    chemin = os.path.join(out, item["id"] + ".txt")
    if not html:
        open(chemin, "w").write(f"# {item['id']} — SITE INACCESSIBLE : {site}\n")
        return item["id"], 0, 0
    accueil, _ = texte(html, garder_pied=True)
    blocs = [f"=== PAGE : {url}\n{accueil[:12000]}"]
    total = len(accueil)
    for u in liens(url, html)[:n_pages]:
        u2, h = get(u)
        if not h:
            continue
        t, _ = texte(h)
        if len(t) < 200:
            continue
        blocs.append(f"=== PAGE : {u2}\n{t[:9000]}")
        total += len(t)
    open(chemin, "w").write(f"# {item['id']} — {item['nom']} — {site}\n\n" + "\n\n".join(blocs))
    return item["id"], len(blocs), total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--pages", type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    items = [i for i in json.load(open(REF, encoding="utf-8"))["items"] if not a.only or i["id"] in a.only]
    with ThreadPoolExecutor(8) as ex:
        for id_, n, t in ex.map(lambda i: releve(i, a.pages, a.out), items):
            print(f"{id_:32} {n:2} pages {t:7} car.", flush=True)


if __name__ == "__main__":
    main()
