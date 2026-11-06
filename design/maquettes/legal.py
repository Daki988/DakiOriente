#!/usr/bin/env python3
"""Maquettes « Pages légales, Pourquoi Navigoal et NaviTravel » (novembre 2026).

1. Pages légales Navigoal (CGU) : sélecteur de service, onglets, « l'essentiel » en cartes, sommaire, sections numérotées
2. Mentions légales : champs à compléter mis en évidence
3. Pages légales Navilease (logo et couleur Navilease)
4. Pages légales NaviTravel sur téléphone
5. Pied de page : liens légaux des trois services
6. Pourquoi Navigoal (ordinateur) : page imagée et détaillée
7. Pourquoi Navigoal (téléphone)
8. NaviTravel : page de présentation

Les textes viennent de web/src/content/legal/<service>/<page>.md (source unique pour les maquettes et le site).
Usage : python3 design/maquettes/legal.py <dossier icônes lucide>  → design/maquettes/out/legal.html
"""
import html
import os
import re
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (styles, icônes, logo)

icon, CSS, WORDMARK, b64 = P.icon, P.CSS, P.WORDMARK, P.b64
ROOT = P.ROOT
WEB = os.path.join(ROOT, "web")
NOTE = 'class="note"'
LEGAL = os.path.join(WEB, "src", "content", "legal")

SERVICES = {
    "navigoal": {"nom": "Navigoal", "c": "#1a47f5", "fond": "#eef2ff", "base": ""},
    "navilease": {"nom": "Navilease", "c": "#2b6a4c", "accent": "#e9a33a", "fond": "#e9f4ed", "base": "/navilease",
                  "menu": ["Logements", "Résidences universitaires", "Comment ça marche", "Bailleurs", "Aide"], "cta": "Publier une annonce", "perso": "Mes réservations"},
    "navitravel": {"nom": "NaviTravel", "c": "#246c88", "accent": "#ec7d5c", "fond": "#e5f1f6", "base": "/navitravel",
                  "menu": ["Billet d'avion", "Visa", "Accueil", "Assurance", "Comment ça marche", "Questions"], "cta": "Demander un devis", "perso": "Mes demandes"},
}
PAGES = [("cgu", "CGU"), ("confidentialite", "Confidentialité"), ("mentions-legales", "Mentions légales"), ("cookies", "Cookies")]


def photo(rel, w=1400):
    """Image du site ou des assets, réduite pour garder un fichier léger."""
    from io import BytesIO
    from PIL import Image
    p = rel if os.path.isabs(rel) else os.path.join(ROOT, rel)
    im = Image.open(p)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    im.thumbnail((w, w))
    buf = BytesIO()
    if im.mode == "RGBA":
        im.save(buf, "PNG", optimize=True); mime = "image/png"
    else:
        im.save(buf, "JPEG", quality=78); mime = "image/jpeg"
    import base64
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


def lire(service, page):
    t = open(os.path.join(LEGAL, service, f"{page}.md"), encoding="utf-8").read()
    _, fm, corps = t.split("---", 2)
    meta = dict(re.findall(r"^(\w+): (.*)$", fm, re.M))
    return meta, corps.strip()


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\[à compléter : ([^\]]+)\]", r'<span class="ac">à compléter : \1</span>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a style="color:#1a47f5;font-weight:700;text-decoration:underline">\1</a>', s)
    return s


def md(corps, couleur="#1a47f5", limite=None):
    """Markdown simple → HTML (titres numérotés, listes, tableaux)."""
    out, i, n = [], 0, 0
    lignes = corps.split("\n")
    while i < len(lignes):
        l = lignes[i]
        if l.startswith("## "):
            n += 1
            if limite and n > limite:
                out.append(f'<div class="small mute" style="padding:8px 0">… {sum(1 for x in lignes if x.startswith("## ")) - limite} autres sections</div>')
                break
            out.append(f'<h2 class="lh2"><span class="num" style="background:{couleur}">{n}</span>{inline(l[3:])}</h2>')
        elif l.startswith("|"):
            rows = []
            while i < len(lignes) and lignes[i].startswith("|"):
                if not re.match(r"^\|[-| ]+\|$", lignes[i]):
                    rows.append([c.strip() for c in lignes[i].strip("|").split("|")])
                i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in rows[0])
            tb = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:])
            out.append(f'<div class="ltab"><table><thead><tr>{th}</tr></thead><tbody>{tb}</tbody></table></div>')
            continue
        elif re.match(r"^(- |\d+\. )", l):
            ordre = bool(re.match(r"^\d+\. ", l))
            items = []
            while i < len(lignes) and re.match(r"^(- |\d+\. )", lignes[i]):
                items.append(re.sub(r"^(- |\d+\. )", "", lignes[i])); i += 1
            tag = "ol" if ordre else "ul"
            out.append(f'<{tag} class="lst">' + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        elif l.strip():
            out.append(f'<p class="lp">{inline(l)}</p>')
        i += 1
    return "".join(out)


EXTRA_CSS = """
.lh2 { display:flex; align-items:center; gap:12px; font-size:22px; font-weight:800; letter-spacing:-.01em; margin:30px 0 10px; scroll-margin-top:90px; }
.lh2 .num { flex:none; width:30px; height:30px; border-radius:10px; color:#fff; font-size:14px; display:flex; align-items:center; justify-content:center; }
.lp { font-size:15.5px; line-height:1.75; color:#2b3550; margin:8px 0; }
.lst { margin:8px 0 8px 4px; padding-left:20px; font-size:15.5px; line-height:1.7; color:#2b3550; } .lst li { margin:4px 0; padding-left:4px; }
.ltab { overflow:hidden; border:1px solid #e6eaf3; border-radius:14px; margin:12px 0; background:#fff; }
.ltab table { width:100%; border-collapse:collapse; font-size:14px; } .ltab th { text-align:left; background:#f6f8fe; color:#3b4566; font-size:12px; text-transform:uppercase; letter-spacing:.04em; padding:10px 14px; }
.ltab td { padding:10px 14px; border-top:1px solid #eef1f8; vertical-align:top; line-height:1.5; color:#2b3550; }
.ac { background:#fff1a8; border:1px dashed #d4a300; color:#7a5a00; border-radius:6px; padding:1px 6px; font-weight:800; font-size:.92em; }
.logo-ph { display:inline-flex; align-items:center; gap:8px; border:2px dashed; border-radius:12px; padding:6px 12px; font-weight:800; font-size:14px; }
.h-disp { font-size:58px; font-weight:800; letter-spacing:-.03em; line-height:1.05; }
.eyebrow { font-size:12px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
.ph { width:100%; height:100%; object-fit:cover; display:block; }
"""


LOGOS = {k: photo(f"web/public/brand/{k}-horizontal.png", 900) for k in ["navilease", "navitravel"]}
LOGOS_V = {k: photo(f"web/public/brand/{k}-logo.png", 700) for k in ["navilease", "navitravel"]}


def logo(service, h=26, clair=False):
    if service == "navigoal":
        return f'<img src="{WORDMARK}" style="height:{h}px">'
    return f'<img src="{LOGOS[service]}" style="height:{round(h * 1.55)}px">'


def barre_services(actif, mobile=False):
    """Barre fine au-dessus de l'en-tête : passer d'un service à l'autre."""
    it = "".join(f'<span style="display:flex;align-items:center;gap:6px;padding:0 {10 if mobile else 14}px;height:34px;font-size:{11.5 if mobile else 12.5}px;font-weight:{800 if k == actif else 600};'
                 f'color:{"#fff" if k == actif else "#aab3c8"};{"background:rgba(255,255,255,.12);" if k == actif else ""}"><span style="width:8px;height:8px;border-radius:3px;background:{v["c"] if k != "navigoal" else "#4f7bff"}"></span>{v["nom"]}</span>' for k, v in SERVICES.items())
    return f'<div style="height:34px;background:#0b1533;display:flex;align-items:center;padding:0 {8 if mobile else 48}px">{it}{"" if mobile else "<span style=\"margin-left:auto;color:#7d88a6;font-size:12px\">Un seul compte pour les trois services</span>"}</div>'


def entete_service(service):
    """En-tête propre à Navilease ou NaviTravel : logo, menu et options du service."""
    s = SERVICES[service]
    liens = "".join(f'<span style="font-weight:{800 if k == 0 else 600};font-size:14px;color:{s["c"] if k == 0 else "#3b4566"}">{t}</span>' for k, t in enumerate(s["menu"]))
    return f"""{barre_services(service)}<div style="height:72px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:26px">
    {logo(service, 26)}<span style="width:1px;height:28px;background:#e6eaf3"></span>{liens}
    <span style="margin-left:auto;display:flex;gap:10px;align-items:center"><span style="font-weight:700;font-size:14px;color:#3b4566;display:flex;gap:6px;align-items:center">{icon("user-round", 16, "#3b4566")}{s["perso"]}</span>
    <span class="btn" style="background:{s["c"]};color:#fff">{s["cta"]}</span></span></div>"""


def entete_site(actif=None):
    liens = "".join(f'<span style="font-weight:{800 if t == actif else 600};font-size:14px;color:{"#1a47f5" if t == actif else "#3b4566"}">{t}</span>'
                    for t in ["Accueil", "Métiers", "Formations", "Établissements", "Villes", "Orientation", "Navilease", "Parents"])
    return barre_services("navigoal") + f"""<div style="height:68px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 48px;gap:28px">
    <img src="{WORDMARK}" style="height:28px">{liens}<span style="margin-left:auto" class="btn" style="background:#ffc21a">S'inscrire</span></div>"""


# ---------------------------------------------------------------- 1-4. Pages légales
def bandeau_legal(service, page, mobile=False):
    s = SERVICES[service]
    sel = "".join(f'<span class="chip" style="padding:7px 12px;font-size:13px;{"background:" + v["c"] + ";color:#fff" if k == service else "background:#fff;border:1px solid #e6eaf3;color:#3b4566"}">{v["nom"]}</span>' for k, v in SERVICES.items())
    onglets = "".join(f'<span style="padding:12px 2px;font-weight:{800 if k == page else 600};font-size:14px;color:{s["c"] if k == page else "#5b6478"};border-bottom:3px solid {s["c"] if k == page else "transparent"}">{t}</span>' for k, t in PAGES)
    if mobile:
        return f"""<div style="background:{s["fond"]};padding:18px 16px 0">
      <div style="display:flex;gap:6px;flex-wrap:wrap">{sel}</div>
      <div style="display:flex;gap:16px;overflow:hidden;margin-top:12px;white-space:nowrap">{onglets}</div></div>"""
    return f"""<div style="background:{s["fond"]};padding:26px 48px 0;border-bottom:1px solid #e6eaf3">
      <div style="display:flex;align-items:center;gap:14px"><span class="small mute" style="font-weight:800">Service :</span>{sel}
        <span style="margin-left:auto" class="small mute">Centre juridique · {s["nom"]}</span></div>
      <div style="display:flex;gap:28px;margin-top:14px">{onglets}</div></div>"""


def essentiel(meta, s, cartes):
    cs = "".join(f"""<div class="card" style="padding:16px;display:flex;gap:12px;align-items:flex-start;box-shadow:none">
      <span style="flex:none;width:38px;height:38px;border-radius:12px;background:{s["fond"]};display:flex;align-items:center;justify-content:center">{icon(ic, 19, s["c"])}</span>
      <span><b style="font-size:14px">{t}</b><span class="small mute" style="display:block;margin-top:3px;line-height:1.45">{d}</span></span></div>""" for ic, t, d in cartes)
    return f"""<div style="border-radius:20px;background:#fff;border:1px solid #e6eaf3;padding:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">{icon("sparkles", 18, s["c"])}<b>L'essentiel en 30 secondes</b></div>
      <p class="lp" style="margin:0 0 14px">{inline(meta["bref"])}</p>
      <div style="display:grid;grid-template-columns:repeat({len(cartes)},1fr);gap:12px">{cs}</div></div>"""


def page_legale(service, page, cartes, titre_cadre, num, hauteur, limite, note=""):
    s = SERVICES[service]
    meta, corps = lire(service, page)
    toc = [re.sub(r"\*\*", "", l[3:]) for l in corps.split("\n") if l.startswith("## ")]
    toc_html = "".join(f'<span style="display:flex;gap:10px;padding:7px 10px;border-radius:10px;font-size:13.5px;{"background:" + s["fond"] + ";color:" + s["c"] + ";font-weight:800" if k == 0 else "color:#3b4566"}"><span style="color:#8a93a8;width:18px">{k + 1}.</span>{t}</span>' for k, t in enumerate(toc))
    return f"""<div class="frame" style="width:1440px;height:{hauteur}px;background:#f6f8fe"><div class="titre-cadre">{num} · {titre_cadre}</div>
  {entete_site() if service == "navigoal" else entete_service(service)}{bandeau_legal(service, page)}
  <div style="display:grid;grid-template-columns:290px 1fr 250px;gap:40px;padding:34px 48px">
    <aside class="card" style="padding:16px;height:fit-content;display:flex;flex-direction:column;gap:2px">
      <span class="small" style="font-weight:800;color:#8a93a8;letter-spacing:.08em;margin:0 0 6px 10px">SOMMAIRE</span>{toc_html}
      <div style="border-top:1px solid #eef1f8;margin-top:10px;padding:12px 10px 4px;display:flex;flex-direction:column;gap:8px">
        <span class="small" style="display:flex;gap:8px;align-items:center;font-weight:700">{icon("printer", 15, "#5b6478")}Imprimer</span>
        <span class="small" style="display:flex;gap:8px;align-items:center;font-weight:700">{icon("download", 15, "#5b6478")}Télécharger en PDF</span></div></aside>
    <article style="display:flex;flex-direction:column;gap:14px;max-width:780px">
      <div style="display:flex;align-items:center;gap:14px">{logo(service, 30)}</div>
      <h1 style="font-size:44px;font-weight:800;letter-spacing:-.025em;line-height:1.1">{meta["titre"]}</h1>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip" style="background:#eef1f8;color:#3b4566">Version 2.0</span>
        <span class="chip" style="background:{s["fond"]};color:{s["c"]}">En vigueur au 06/11/2026</span>
        <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:#5b6478">{icon("clock", 12, "#5b6478")}Lecture : {max(3, len(corps.split()) // 220)} min</span></div>
      {essentiel(meta, s, cartes)}
      <div>{md(corps, s["c"], limite)}</div>
    </article>
    <aside style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:8px">{icon("mail", 22, s["c"])}<b>Une question ?</b>
        <span class="small mute" style="line-height:1.5">Données personnelles, réclamation, retrait d'un contenu : nous répondons sous 10 jours ouvrés.</span>
        <span class="btn" style="background:{s["c"]};color:#fff;margin-top:4px">contact@navigoal.net</span></div>
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:none">{icon("history", 20, "#5b6478")}<b style="font-size:14px">Historique</b>
        <span class="small mute">v2.0 · 06/11/2026 : réécriture complète, pages propres à Navilease et NaviTravel</span><span class="small mute">v1.0 · 09/10/2026</span></div>
    </aside>
  </div>{note}
</div>"""


def legal_navigoal():
    return page_legale("navigoal", "cgu", [
        ("gift", "Gratuit pour les familles", "Orientation, comparateur, devis et candidature sans frais d'inscription."),
        ("shield-check", "Vos documents protégés", "Transmis uniquement aux écoles où vous candidatez."),
        ("school", "L'école décide", "L'admission et les frais exacts relèvent de l'établissement."),
    ], "Pages légales Navigoal : CGU (nouveau gabarit)", 1, 3460, 9,
        f'<div {NOTE} style="left:540px;top:150px">Sélecteur de service : chaque service a ses 4 pages</div>'
        f'<div {NOTE} style="left:1180px;top:430px">« L\'essentiel » : 3 points clés avant le texte</div>'
        f'<div {NOTE} style="left:60px;top:900px;max-width:200px">Sommaire fixe, section en cours surlignée</div>')


def mentions():
    return page_legale("navigoal", "mentions-legales", [
        ("building-2", "OAPS Consulting Group", "SARLU de droit gabonais, Libreville · RCCM GA-LBV-01-2021-B13-00360."),
        ("server", "Hébergé en Europe", "LWS (Paris) et Neon (Francfort)."),
        ("copyright", "Crédits et retraits", "Chaque photo est créditée ; retrait sur demande."),
    ], "Mentions légales : champs à compléter (en jaune) avec vos informations", 2, 2480, None,
        f'<div {NOTE} style="left:1180px;top:820px;max-width:230px">En jaune : reste à fournir (NIF, directeur de la publication, récépissé CNPDCP)</div>')


def legal_navilease():
    return page_legale("navilease", "cgu", [
        ("lock", "Paiement en séquestre", "Le bailleur est payé après votre entrée dans les lieux."),
        ("badge-check", "Annonces vérifiées", "Chaque annonce est relue avant publication."),
        ("external-link", "Résidences : site officiel", "Réservation directe, sans paiement via Navilease."),
    ], "Pages légales Navilease : logo et couleur Navilease", 3, 2240, 5,
        f'<div {NOTE} style="left:900px;top:40px">Menu et options propres à Navilease</div>')


def legal_navitravel_mobile():
    s = SERVICES["navitravel"]
    meta, corps = lire("navitravel", "confidentialite")
    return f"""<div class="frame" style="width:390px;height:1800px;background:#f6f8fe"><div class="titre-cadre">4 · NaviTravel sur téléphone : confidentialité</div>
  {barre_services("navitravel", True)}<div style="height:58px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 16px;gap:10px">{logo("navitravel", 22)}<span style="margin-left:auto">{icon("menu", 22, "#0b1533")}</span></div>
  {bandeau_legal("navitravel", "confidentialite", True)}
  <div style="padding:18px 16px;display:flex;flex-direction:column;gap:12px">
    <img src="{LOGOS_V["navitravel"]}" style="height:96px;width:fit-content">
    <h1 style="font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1">{meta["titre"]}</h1>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="background:#eef1f8;color:#3b4566">Version 2.0</span><span class="chip" style="background:{s["fond"]};color:{s["c"]}">06/11/2026</span></div>
    <div class="card" style="padding:14px;background:{s["fond"]};border:none;box-shadow:none"><b style="font-size:14px">L'essentiel</b><p class="small" style="line-height:1.55;margin-top:6px">{inline(meta["bref"])}</p></div>
    <div class="card" style="padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:none">{icon("list", 18, s["c"])}<b style="font-size:14px">Sommaire (7 sections)</b><span style="margin-left:auto">{icon("chevron-down", 18, "#5b6478")}</span></div>
    <div style="zoom:.9">{md(corps, s["c"], 3)}</div>
  </div>
  <div {NOTE} style="left:200px;top:470px;max-width:170px">Sommaire repliable sur téléphone</div>
</div>"""


def pied():
    cols = "".join(f"""<div style="display:flex;flex-direction:column;gap:9px"><b style="color:#fff;font-size:14px;display:flex;align-items:center;gap:8px">
      <span style="width:10px;height:10px;border-radius:3px;background:{v["c"]}"></span>{v["nom"]}</b>
      {"".join(f'<span style="color:#aab3c8;font-size:13px">{t if k != "cgu" else "Conditions d" + chr(39) + "utilisation"}</span>' for k, t in PAGES)}</div>""" for v in SERVICES.values())
    return f"""<div class="frame" style="width:1440px;height:330px;background:#0b1533"><div class="titre-cadre">5 · Pied de page : liens légaux des trois services</div>
  <div style="padding:40px 48px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px">
    <div style="display:flex;flex-direction:column;gap:12px"><b style="color:#fff;font-size:18px">Centre juridique</b>
      <span style="color:#aab3c8;font-size:13px;line-height:1.6">Chaque service a ses propres conditions, sa politique de confidentialité, ses mentions légales et sa politique cookies.</span></div>{cols}</div>
  <div style="margin:0 48px;border-top:1px solid #24304f;padding-top:18px;display:flex;justify-content:space-between;color:#7d88a6;font-size:12px">
    <span>© 2026 Navigoal · Navilease · NaviTravel</span><span style="font-weight:800;color:#fff">BY OAPS</span></div></div>"""


# ---------------------------------------------------------------- 0. Menus des services
def menus():
    def tiroir(service, options, perso):
        sv = SERVICES[service]
        li = "".join(f'<span style="display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid #eef1f8;font-weight:700;font-size:15px">{icon(ic, 19, sv["c"])}{t}<span style="margin-left:auto">{icon("chevron-right", 16, "#8a93a8")}</span></span>' for ic, t in options)
        pe = "".join(f'<span style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:#3b4566">{icon(ic, 17, "#5b6478")}{t}</span>' for ic, t in perso)
        return f"""<div class="frame" style="width:390px;height:820px;background:#fff;margin:0 20px 0 0"><div class="titre-cadre" style="top:-26px">Menu {sv["nom"]} (téléphone)</div>
      {barre_services(service, True)}<div style="height:58px;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 16px">{logo(service, 22)}<span style="margin-left:auto">{icon("x", 22, "#0b1533")}</span></div>
      <div style="padding:10px 18px;display:flex;flex-direction:column">{li}</div>
      <div style="margin:6px 18px;border-radius:16px;background:{sv["fond"]};padding:14px;display:flex;flex-direction:column;gap:12px"><span class="small" style="font-weight:800;color:{sv["c"]}">MON ESPACE</span>{pe}</div>
      <div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px"><span class="btn" style="background:{sv["c"]};color:#fff;padding:13px">{sv["cta"]}</span>
        <span class="small mute" style="text-align:center">Conditions · Confidentialité · Mentions · Cookies</span></div></div>"""
    lease = tiroir("navilease", [("search", "Chercher un logement"), ("building", "Résidences universitaires"), ("shield-check", "Comment ça marche"), ("key-round", "Espace bailleurs"), ("circle-help", "Aide et litiges")],
                   [("calendar-check", "Mes réservations"), ("bell", "Mes alertes logement"), ("heart", "Logements favoris"), ("file-text", "Mes contrats et quittances")])
    travel = tiroir("navitravel", [("plane", "Billet d'avion"), ("stamp", "Visa et démarches"), ("hand-helping", "Accueil à l'arrivée"), ("heart-pulse", "Assurance"), ("list-checks", "Comment ça marche"), ("circle-help", "Questions")],
                    [("inbox", "Mes demandes et devis"), ("folder-open", "Mes documents de voyage"), ("ticket", "Mes billets"), ("message-circle", "Mon conseiller")])
    goal = f"""<div class="frame" style="width:1440px;height:150px;background:#f6f8fe;margin:0 0 50px 0"><div class="titre-cadre" style="top:-26px">Navigoal</div>{entete_site()}</div>"""
    return f"""<div class="frame" style="width:1520px;height:1180px;background:#fff;padding:40px"><div class="titre-cadre">0 · Chaque service a son menu et ses options (barre de services commune en haut)</div>
  <div style="display:flex;flex-direction:column;gap:56px;margin-top:20px">
    <div style="position:relative"><b style="display:block;margin-bottom:10px">Navigoal : orientation, formations, écoles, candidatures</b><div style="border:1px solid #e6eaf3;border-radius:14px;overflow:hidden">{entete_site()}</div></div>
    <div><b style="display:block;margin-bottom:10px">Navilease : logements, résidences, bailleurs · bouton « Publier une annonce » · « Mes réservations »</b><div style="border:1px solid #e6eaf3;border-radius:14px;overflow:hidden">{entete_service("navilease")}</div></div>
    <div><b style="display:block;margin-bottom:10px">NaviTravel : billet, visa, accueil, assurance · bouton « Demander un devis » · « Mes demandes »</b><div style="border:1px solid #e6eaf3;border-radius:14px;overflow:hidden">{entete_service("navitravel")}</div></div>
    <div style="display:flex;gap:30px;align-items:flex-start">{lease}{travel}
      <div class="card" style="padding:22px;width:560px;display:flex;flex-direction:column;gap:12px;box-shadow:none"><b style="font-size:18px">Règles</b>
        {"".join(f'<span style="display:flex;gap:10px;font-size:14px;line-height:1.5">{icon("check", 17, "#0f8a46")}{t}</span>' for t in [
            "Barre sombre commune en haut : on passe d'un service à l'autre en un clic ; le service ouvert est mis en avant.",
            "Chaque service a son logo, sa couleur, son menu, son bouton principal et son pied de page avec ses 4 pages légales.",
            "Un seul compte Navigoal pour les trois services : « Mon espace » montre les options du service ouvert.",
            "Adresses : /navilease/… et /navitravel/… ; pages légales : /navilease/cgu, /navitravel/confidentialite, etc.",
            "Navilease garde ses pages actuelles (logements, résidences, réservations, espace bailleur), avec son propre en-tête.",
        ])}</div></div>
  </div></div>"""


# ---------------------------------------------------------------- 6-7. Pourquoi Navigoal
def pourquoi():
    hero = photo("web/public/images/etudiante.webp", 900)
    campus = photo("web/public/photos/ma/ma-uir-1.jpg")
    casa = photo("web/public/photos/villes/casablanca.jpg")
    rabat = photo("web/public/photos/villes/rabat.jpg")
    groupe = photo("web/public/images/communaute.webp")
    etude = photo("web/public/images/laptop.webp")
    parents = photo("assets/photos/pourquoi/parents.jpg")
    chambre = photo("assets/photos/residences/sh-tanger-2.jpg")
    avion = photo("assets/photos/navitravel/hublot.jpg")
    equipe = photo("web/public/images/education.webp")

    etapes = [
        ("compass", "#1a47f5", "1. Je découvre qui je suis", "Un test d'orientation visuel de 10 minutes relie tes goûts, ta série et les métiers qui recrutent. Résultat : un profil clair et des pistes concrètes.", etude, "Test d'orientation · fiches métiers · séries décryptées"),
        ("graduation-cap", "#6a3df0", "2. Je choisis une école sûre", "Chaque établissement affiche son statut officiel, vérifié sur les textes publiés : reconnu par l'État, diplômes homologués, établissement professionnel ou simplement autorisé.", campus, "103 écoles · labels vérifiés · comparateur"),
        ("wallet", "#0f8a46", "3. Je connais le vrai coût", "Scolarité publiée par l'école, logement, vie sur place, billets d'avion et imprévus : le devis complet, en F CFA ou dans ta monnaie, avant de t'engager.", parents, "Devis sur toute la formation · taux du jour"),
        ("send", "#e04f2b", "4. Je candidate une seule fois", "Un dossier unique, plusieurs écoles. Tu suis chaque candidature en temps réel, tu réponds aux demandes de pièces et tu paies les frais par mobile money.", groupe, "Un dossier · suivi en direct · paiement mobile"),
        ("house", "#2b6a4c", "5. Je me loge sans arnaque", "Navilease : résidences universitaires officielles et logements vérifiés, avec paiement en séquestre libéré seulement après ton entrée dans les lieux.", chambre, "Navilease · 14 résidences · séquestre"),
        ("plane", "#246c88", "6. Je pars l'esprit tranquille", "NaviTravel : billet d'avion, visa, accueil à l'aéroport et assurance, organisés pour toi et suivis par un conseiller.", avion, "NaviTravel · billet · visa · accueil · assurance"),
    ]
    blocs = ""
    for k, (ic, c, t, d, img, tag) in enumerate(etapes):
        texte = f"""<div style="display:flex;flex-direction:column;gap:14px;justify-content:center">
          <span style="width:52px;height:52px;border-radius:16px;background:{c};display:flex;align-items:center;justify-content:center">{icon(ic, 26, "#fff")}</span>
          <b style="font-size:30px;letter-spacing:-.02em">{t}</b><p style="font-size:17px;line-height:1.65;color:#3b4566">{d}</p>
          <span class="chip" style="background:#fff;border:1px solid #e6eaf3;color:{c};width:fit-content">{icon("check", 13, c)}{tag}</span></div>"""
        image = f'<div style="height:340px;border-radius:28px;overflow:hidden;box-shadow:0 30px 60px -28px rgba(11,21,51,.45)"><img class="ph" src="{img}"></div>'
        blocs += f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">{image + texte if k % 2 == 0 else texte + image}</div>'

    personas = [
        (etude, "#1a47f5", "Élèves", "Trouve ta série, ton métier et ta formation, gratuitement."),
        (groupe, "#0f8a46", "Étudiants en mobilité", "Étudie au Maroc dans une école au statut vérifié."),
        (parents, "#a55a00", "Parents", "Le budget réel, le suivi des candidatures et la sécurité du logement."),
        (campus, "#6a3df0", "Établissements", "Des candidats déjà orientés vers vos programmes, partout en Afrique."),
        (chambre, "#d42a50", "Bailleurs et résidences", "Des locataires étudiants vérifiés, un paiement garanti."),
    ]
    pcards = "".join(f"""<div class="card" style="overflow:hidden;display:flex;flex-direction:column">
      <div style="height:150px;position:relative"><img class="ph" src="{img}"><span class="chip" style="position:absolute;left:12px;bottom:12px;background:{c};color:#fff">{t}</span></div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:8px"><span style="font-size:14.5px;line-height:1.5;color:#2b3550">{d}</span>
      <b style="font-size:13px;color:{c}">Découvrir →</b></div></div>""" for img, c, t, d in personas)

    labels = [("#0f8a46", "Reconnu par l'État", "Établissement reconnu : ses diplômes ont la même valeur que ceux du public."),
              ("#1a47f5", "Diplômes homologués", "Une ou plusieurs filières homologuées par arrêté ministériel."),
              ("#6a3df0", "Établissement professionnel", "Formation professionnelle agréée, diplômes de l'État."),
              ("#a55a00", "Établissement autorisé", "École autorisée, diplômes propres à l'établissement : nous le disons clairement.")]
    lcards = "".join(f"""<div style="border-radius:20px;background:#fff;border:1px solid #e6eaf3;padding:18px;display:flex;flex-direction:column;gap:8px">
      <span class="chip" style="background:{c};color:#fff;width:fit-content">{icon("badge-check", 13, "#fff")}{t}</span><span class="small" style="line-height:1.55;color:#3b4566;font-size:13.5px">{d}</span></div>""" for c, t, d in labels)

    confiance = [("shield-check", "Données protégées", "Hébergement en Europe, documents partagés seulement avec les écoles choisies, jamais revendus."),
                 ("lock", "Paiements sécurisés", "Mobile money, carte ou agence ; séquestre pour les logements Navilease."),
                 ("file-search", "Sources officielles", "Statuts et frais issus des textes et sites officiels, datés et vérifiés."),
                 ("users", "Des humains à l'écoute", "Conseillers sur WhatsApp et dans la messagerie, en plus de Navi.")]
    ccards = "".join(f"""<div style="display:flex;gap:14px;align-items:flex-start"><span style="flex:none;width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center">{icon(ic, 22, "#ffc21a")}</span>
      <span><b style="color:#fff;font-size:16px">{t}</b><span style="display:block;color:#c9d2ea;font-size:14px;line-height:1.55;margin-top:4px">{d}</span></span></div>""" for ic, t, d in confiance)

    eco = [("#1a47f5", "Navigoal", "S'orienter, comparer, candidater", "compass"), ("#6a3df0", "Navi", "L'assistant qui répond 24 h/24", "message-circle"),
           ("#2b6a4c", "Navilease", "Se loger en toute sécurité", "house"), ("#246c88", "NaviTravel", "Voyager et s'installer", "plane")]
    ecards = "".join(f"""<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px;border-top:5px solid {c}">
      <span style="display:flex;align-items:center;gap:10px">{icon(ic, 22, c)}<b style="font-size:19px">{n}</b></span><span class="mute" style="font-size:14px">{d}</span></div>""" for c, n, d, ic in eco)

    faq = [("Navigoal est-il vraiment gratuit ?", "Oui pour les élèves, étudiants et parents : orientation, comparateur, devis et dossier de candidature. Seuls les frais de dossier fixés par certaines écoles, et les services Navilease ou NaviTravel choisis, sont payants, toujours annoncés avant."),
           ("Comment savez-vous qu'une école est reconnue ?", "Nous partons des textes officiels (arrêtés, listes des ministères) et indiquons la date de vérification sur chaque fiche."),
           ("Qui décide de mon admission ?", "Toujours l'établissement. Navigoal transmet ton dossier complet et t'aide à le suivre."),
           ("Mes parents peuvent-ils suivre mon dossier ?", "Oui : en liant leur compte au tien, ils voient tes candidatures, paiements et rendez-vous, et donnent leur accord si tu es mineur.")]
    fcards = "".join(f"""<div class="card" style="padding:18px 20px;box-shadow:none"><b style="display:flex;justify-content:space-between;font-size:16px">{q}{icon("plus", 18, "#1a47f5")}</b>
      {f'<p class="small" style="font-size:14px;line-height:1.6;color:#3b4566;margin-top:8px">{r}</p>' if k == 0 else ""}</div>""" for k, (q, r) in enumerate(faq))

    chiffres = [("103", "écoles privées au statut vérifié"), ("12", "villes étudiantes"), ("1 500+", "formations reliées aux métiers"), ("14", "résidences universitaires"), ("1", "dossier pour toutes tes candidatures")]
    ch = "".join(f'<div style="text-align:center"><b style="font-size:46px;color:#1a47f5;letter-spacing:-.02em">{n}</b><div class="mute" style="font-size:13.5px">{t}</div></div>' for n, t in chiffres)

    return f"""<div class="frame" style="width:1440px;height:6440px;background:#fff"><div class="titre-cadre">6 · Pourquoi Navigoal (ordinateur) : page imagée et détaillée</div>
  {entete_site()}
  <section style="position:relative;height:640px;background:radial-gradient(900px 520px at 85% 10%,#dae6ff,transparent 60%),#f6f8fe;overflow:hidden">
    <div style="position:absolute;left:48px;top:90px;width:640px;display:flex;flex-direction:column;gap:20px">
      <span class="eyebrow" style="color:#1a47f5">Pourquoi Navigoal</span>
      <h1 class="h-disp">Étudier au Maroc, <span style="color:#1a47f5">de l'orientation</span> à <span style="color:#f5a300">l'installation</span>.</h1>
      <p style="font-size:19px;line-height:1.6;color:#3b4566">Une seule plateforme pour choisir sa voie, trouver une école au statut vérifié, connaître le vrai coût, candidater, se loger et voyager. Pensée pour les élèves d'Afrique et leurs familles.</p>
      <div style="display:flex;gap:12px"><span class="btn" style="background:#1a47f5;color:#fff;padding:14px 20px">Passer le test gratuit {icon("arrow-right", 16, "#fff")}</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:14px 20px">Voir le parcours</span></div>
    </div>
    <div style="position:absolute;right:300px;top:70px;width:330px;height:470px;border-radius:30px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(11,21,51,.5)"><img class="ph" src="{casa}"></div>
    <div style="position:absolute;right:48px;top:150px;width:260px;height:300px;border-radius:30px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(11,21,51,.5)"><img class="ph" src="{campus}"></div>
    <img src="{hero}" style="position:absolute;right:170px;bottom:0;height:470px">
    <div class="card" style="position:absolute;right:500px;bottom:60px;padding:12px 14px;display:flex;gap:10px;align-items:center">{icon("badge-check", 22, "#0f8a46")}<span><b style="font-size:14px">Statut vérifié</b><span class="small mute" style="display:block">sur les textes officiels</span></span></div>
    <div class="card" style="position:absolute;right:40px;bottom:90px;padding:12px 14px;display:flex;gap:10px;align-items:center">{icon("wallet", 22, "#1a47f5")}<span><b style="font-size:14px">≈ 2,2 M F CFA / an</b><span class="small mute" style="display:block">scolarité publiée</span></span></div>
  </section>
  <section style="padding:70px 48px 40px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center">
    <div style="display:flex;flex-direction:column;gap:16px"><span class="eyebrow" style="color:#d42a50">Le constat</span>
      <b style="font-size:38px;letter-spacing:-.02em;line-height:1.15">Partir étudier, c'est souvent un saut dans l'inconnu.</b>
      <p style="font-size:17px;line-height:1.65;color:#3b4566">Des informations éparpillées sur les réseaux sociaux, des écoles dont on ignore si le diplôme est reconnu, des frais découverts trop tard, des cautions envoyées à des inconnus… Navigoal remet de l'ordre et de la confiance dans ce parcours.</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      {"".join(f'<div style="border-radius:20px;background:#fff5f6;padding:18px;display:flex;flex-direction:column;gap:6px">{icon("circle-x", 22, "#d42a50")}<b style="font-size:15px">{t}</b><span class="small mute" style="line-height:1.5">{d}</span></div>' for t, d in [("Infos dispersées", "Sites, groupes WhatsApp, bouche-à-oreille."), ("Statut flou", "Diplôme reconnu ou non ? Difficile à vérifier."), ("Budget sous-estimé", "Logement, visa et vie sur place oubliés."), ("Arnaques au logement", "Cautions versées pour des logements fictifs.")])}
    </div></section>
  <section style="padding:40px 48px;display:flex;flex-direction:column;gap:70px">
    <div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center"><span class="eyebrow" style="color:#1a47f5">Le parcours</span><b style="font-size:42px;letter-spacing:-.02em">Six étapes, une seule plateforme</b><span class="mute" style="font-size:17px">Chaque étape est reliée à la suivante : rien à ressaisir, tout est suivi.</span></div>
    {blocs}</section>
  <section style="padding:60px 48px;background:#f6f8fe;margin-top:40px"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:24px"><div><span class="eyebrow" style="color:#1a47f5">Pour chacun</span><b style="display:block;font-size:38px;letter-spacing:-.02em;margin-top:8px">Une plateforme, cinq publics</b></div></div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px">{pcards}</div></section>
  <section style="padding:60px 48px;display:grid;grid-template-columns:420px 1fr;gap:48px;align-items:center">
    <div style="display:flex;flex-direction:column;gap:14px"><span class="eyebrow" style="color:#0f8a46">La transparence</span><b style="font-size:36px;letter-spacing:-.02em;line-height:1.15">Le statut de chaque école, expliqué simplement</b>
      <p style="font-size:16px;line-height:1.65;color:#3b4566">Nous ne présentons que des établissements privés et inter-États qui accueillent les étudiants internationaux, avec leur statut exact et la date de vérification.</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{lcards}</div></section>
  <section style="margin:20px 48px;border-radius:32px;background:#0b1533;padding:48px;display:grid;grid-template-columns:1fr 1.2fr;gap:48px;align-items:center;position:relative;overflow:hidden">
    <div style="display:flex;flex-direction:column;gap:14px"><span class="eyebrow" style="color:#ffc21a">La confiance</span><b style="font-size:36px;color:#fff;letter-spacing:-.02em;line-height:1.15">Votre projet et vos données sont entre de bonnes mains</b>
      <div style="height:220px;border-radius:22px;overflow:hidden;margin-top:8px"><img class="ph" src="{equipe}"></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">{ccards}</div></section>
  <section style="padding:60px 48px;display:flex;flex-direction:column;gap:24px"><div style="text-align:center"><span class="eyebrow" style="color:#1a47f5">L'écosystème</span><b style="display:block;font-size:38px;letter-spacing:-.02em;margin-top:8px">Quatre services qui se parlent</b></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">{ecards}</div></section>
  <section style="margin:0 48px;border-radius:28px;border:1px solid #e6eaf3;padding:34px;display:grid;grid-template-columns:repeat(5,1fr);gap:20px">{ch}</section>
  <section style="padding:60px 48px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
    <div class="card" style="padding:28px;display:flex;gap:22px;align-items:center;box-shadow:none;background:#f6f8fe;border:none">
      <img src="{b64(os.path.join(WEB, 'public', 'brand', 'oaps-logo.webp'), 'image/webp')}" style="height:90px;border-radius:14px;background:#fff;padding:8px">
      <span><span class="eyebrow" style="color:#1a47f5">By OAPS</span><b style="display:block;font-size:22px;margin:6px 0">Conçu par OAPS Consulting Group</b><span class="mute" style="font-size:14.5px;line-height:1.55">« L'efficience au service de vos ambitions » : une équipe de conseil engagée pour la mobilité étudiante africaine.</span></span></div>
    <div style="display:flex;flex-direction:column;gap:10px"><b style="font-size:24px">Questions fréquentes</b>{fcards}</div></section>
  <section style="margin:0 48px 60px;border-radius:32px;overflow:hidden;position:relative;height:300px">
    <img class="ph" src="{rabat}" style="position:absolute;inset:0;filter:brightness(.45)">
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center">
      <b style="font-size:40px;color:#fff;letter-spacing:-.02em">Ton avenir commence par le bon choix.</b>
      <div style="display:flex;gap:12px"><span class="btn" style="background:#ffc21a;padding:14px 22px">Créer mon compte gratuit</span><span class="btn" style="background:rgba(255,255,255,.14);color:#fff;padding:14px 22px">Parler à un conseiller</span></div></div></section>
  <div {NOTE} style="left:760px;top:600px">Photos : campus réel, villes, résidence, étudiants</div>
  <div {NOTE} style="left:620px;top:1380px">Le parcours en 6 étapes illustrées, en alternance image / texte</div>
  <div {NOTE} style="left:1180px;top:3720px">Labels expliqués (transparence)</div>
</div>"""


def pourquoi_mobile():
    hero = photo("web/public/images/etudiante.webp", 600)
    casa = photo("web/public/photos/villes/casablanca.jpg", 800)
    etude = photo("web/public/images/laptop.webp", 800)
    chambre = photo("assets/photos/residences/sh-tanger-2.jpg", 800)
    etapes = [("compass", "#1a47f5", "Je découvre qui je suis", etude), ("house", "#2b6a4c", "Je me loge sans arnaque", chambre)]
    bl = "".join(f"""<div class="card" style="overflow:hidden"><div style="height:170px"><img class="ph" src="{img}"></div>
      <div style="padding:14px;display:flex;gap:10px;align-items:center"><span style="flex:none;width:38px;height:38px;border-radius:12px;background:{c};display:flex;align-items:center;justify-content:center">{icon(ic, 19, "#fff")}</span><b style="font-size:16px">{t}</b></div></div>""" for ic, c, t, img in etapes)
    return f"""<div class="frame" style="width:390px;height:1640px;background:#fff"><div class="titre-cadre">7 · Pourquoi Navigoal (téléphone)</div>
  <div style="height:56px;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 16px"><img src="{WORDMARK}" style="height:22px"><span style="margin-left:auto">{icon("menu", 22, "#0b1533")}</span></div>
  <div style="position:relative;height:520px;background:radial-gradient(500px 300px at 80% 0%,#dae6ff,transparent 60%),#f6f8fe;overflow:hidden;padding:24px 16px">
    <span class="eyebrow" style="color:#1a47f5">Pourquoi Navigoal</span>
    <h1 style="font-size:34px;font-weight:800;letter-spacing:-.025em;line-height:1.08;margin-top:10px">Étudier au Maroc, <span style="color:#1a47f5">de l'orientation</span> à <span style="color:#f5a300">l'installation</span>.</h1>
    <div style="position:absolute;left:16px;right:120px;bottom:24px;height:200px;border-radius:24px;overflow:hidden"><img class="ph" src="{casa}"></div>
    <img src="{hero}" style="position:absolute;right:0;bottom:0;height:290px"></div>
  <div style="padding:22px 16px;display:flex;flex-direction:column;gap:14px">
    <b style="font-size:24px;letter-spacing:-.02em">Six étapes, une seule plateforme</b>
    <div style="display:flex;gap:6px;overflow:hidden">{"".join(f'<span class="chip" style="background:{"#1a47f5" if k == 0 else "#eef1f8"};color:{"#fff" if k == 0 else "#3b4566"}">{k + 1}</span>' for k in range(6))}</div>
    {bl}
    <span class="small mute" style="text-align:center">Fais glisser pour voir les 6 étapes →</span>
    <div style="border-radius:22px;background:#0b1533;padding:18px;display:flex;flex-direction:column;gap:12px">
      <b style="color:#fff;font-size:18px">La confiance</b>{"".join(f'<span style="display:flex;gap:10px;color:#c9d2ea;font-size:13.5px">{icon(ic, 18, "#ffc21a")}{t}</span>' for ic, t in [("shield-check", "Données hébergées en Europe, jamais revendues"), ("lock", "Paiements sécurisés et séquestre logement"), ("file-search", "Statuts vérifiés sur les textes officiels")])}</div>
    <span class="btn" style="background:#ffc21a;padding:14px">Créer mon compte gratuit</span></div>
  <div {NOTE} style="left:200px;top:820px;max-width:170px">Étapes en carrousel à faire glisser</div>
</div>"""


# ---------------------------------------------------------------- 8. NaviTravel
def navitravel():
    s = SERVICES["navitravel"]
    arrivee, aeroport, passeport, hublot = (photo(f"assets/photos/navitravel/{n}.jpg") for n in ["arrivee", "aeroport", "passeport", "hublot"])
    services = [("plane", "Billet d'avion", "Le meilleur trajet depuis Libreville, Dakar, Douala ou Abidjan, au tarif étudiant, avec les bons bagages.", aeroport),
                ("stamp", "Visa et démarches", "Liste des pièces selon ta nationalité, vérification du dossier, rendez-vous, puis carte de séjour à l'arrivée.", passeport),
                ("hand-helping", "Accueil à l'arrivée", "Quelqu'un t'attend à l'aéroport, t'accompagne jusqu'à ton logement et t'aide pour la carte SIM et la banque.", arrivee),
                ("heart-pulse", "Assurance voyage et santé", "Une assurance adaptée aux étudiants et aux exigences du visa, avec un assureur agréé.", hublot)]
    sc = "".join(f"""<div class="card" style="overflow:hidden;display:flex;flex-direction:column"><div style="height:200px;position:relative"><img class="ph" src="{img}">
      <span style="position:absolute;left:14px;top:14px;width:44px;height:44px;border-radius:14px;background:{s["c"]};display:flex;align-items:center;justify-content:center">{icon(ic, 22, "#fff")}</span></div>
      <div style="padding:18px;display:flex;flex-direction:column;gap:8px"><b style="font-size:19px">{t}</b><span style="font-size:14.5px;line-height:1.55;color:#3b4566">{d}</span></div></div>""" for ic, t, d, img in services)
    etapes = [("clipboard-list", "Tu décris ton projet", "Dates, ville de départ, école, logement."), ("file-text", "Tu reçois un devis clair", "Chaque prestation et son prix, sans surprise."),
              ("credit-card", "Tu valides et tu paies", "Mobile money, carte, virement ou agence."), ("smile", "On s'occupe du reste", "Un conseiller te suit jusqu'à ton installation.")]
    ec = "".join(f"""<div style="display:flex;flex-direction:column;gap:10px;align-items:flex-start"><span style="width:50px;height:50px;border-radius:16px;background:{s["fond"]};display:flex;align-items:center;justify-content:center">{icon(ic, 24, s["c"])}</span>
      <b style="font-size:17px">{k + 1}. {t}</b><span class="mute" style="font-size:14px;line-height:1.5">{d}</span></div>""" for k, (ic, t, d) in enumerate(etapes))
    champs = "".join(f'<div style="display:flex;flex-direction:column;gap:6px"><span class="label">{l}</span><div style="height:44px;border:1px solid #dfe4ef;border-radius:12px;background:#fff;padding:0 12px;display:flex;align-items:center;color:#8a93a8;font-size:14px">{p}</div></div>' for l, p in [("Ville de départ", "Libreville (LBV)"), ("Date d'arrivée souhaitée", "Début septembre 2027"), ("École", "ESSEM Business School · Casablanca")])
    besoins = "".join(f'<span class="chip" style="padding:9px 12px;font-size:13px;{"background:" + s["c"] + ";color:#fff" if on else "background:#fff;border:1px solid #dfe4ef;color:#3b4566"}">{icon("check" if on else "plus", 13, "#fff" if on else "#5b6478")}{t}</span>' for t, on in [("Billet", True), ("Visa", True), ("Accueil", True), ("Assurance", False)])
    return f"""<div class="frame" style="width:1440px;height:3060px;background:#fff"><div class="titre-cadre">8 · NaviTravel : page de présentation</div>
  {entete_service("navitravel")}
  <section style="position:relative;height:620px;overflow:hidden"><img class="ph" src="{hublot}" style="position:absolute;inset:0;object-position:center 65%;filter:brightness(.5)">
    <div style="position:absolute;left:48px;top:120px;width:660px;display:flex;flex-direction:column;gap:18px">
      <span class="chip" style="background:rgba(255,255,255,.16);color:#fff;width:fit-content">{icon("sparkles", 13, "#fff")}Nouveau service Navigoal</span>
      <h1 class="h-disp" style="color:#fff">Ton départ, organisé de A à Z.</h1>
      <p style="font-size:19px;line-height:1.6;color:#e3e9f7">Billet d'avion, visa, accueil à l'aéroport et assurance : NaviTravel prépare ton voyage vers ton école au Maroc, avec un conseiller qui te suit jusqu'à ton installation.</p>
      <div style="display:flex;gap:12px"><span class="btn" style="background:{s["accent"]};color:#fff;padding:14px 22px">Demander mon devis gratuit</span><span class="btn" style="background:rgba(255,255,255,.16);color:#fff;padding:14px 22px">Voir les services</span></div></div>
    <div class="card" style="position:absolute;right:60px;bottom:60px;padding:16px 18px;display:flex;flex-direction:column;gap:8px;width:300px">
      <span class="small mute" style="font-weight:800">TON VOYAGE</span>
      {"".join(f'<span style="display:flex;gap:10px;align-items:center;font-size:14px">{icon(ic, 17, s["c"])}{t}<span style="margin-left:auto">{icon("circle-check", 17, "#0f8a46")}</span></span>' for ic, t in [("plane", "Libreville → Casablanca"), ("stamp", "Visa étudiant"), ("hand-helping", "Accueil à l'aéroport")])}</div>
  </section>
  <section style="padding:70px 48px;display:flex;flex-direction:column;gap:26px"><div style="text-align:center"><span class="eyebrow" style="color:{s["c"]}">Les services</span><b style="display:block;font-size:40px;letter-spacing:-.02em;margin-top:8px">Tout ce qu'il faut pour partir sereinement</b></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px">{sc}</div></section>
  <section style="padding:60px 48px;background:{s["fond"]}"><div style="text-align:center;margin-bottom:34px"><span class="eyebrow" style="color:{s["c"]}">Comment ça marche</span><b style="display:block;font-size:38px;letter-spacing:-.02em;margin-top:8px">Quatre étapes, un seul interlocuteur</b></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px">{ec}</div></section>
  <section style="padding:70px 48px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:16px"><span class="eyebrow" style="color:{s["c"]}">Relié à ton dossier Navigoal</span><b style="font-size:34px;letter-spacing:-.02em;line-height:1.15">Ton admission, ton logement et ton voyage au même endroit</b>
      <p style="font-size:16.5px;line-height:1.65;color:#3b4566">Ta lettre d'admission, ton logement Navilease et tes documents sont déjà dans ton espace : NaviTravel s'en sert pour ton visa et ton accueil, sans rien ressaisir. Tes parents suivent chaque étape.</p>
      {"".join(f'<span style="display:flex;gap:10px;font-size:15px">{icon("check", 18, s["c"])}{t}</span>' for t in ["Devis gratuit et sans engagement", "Prix détaillés, frais consulaires annoncés à part", "Partenaires agréés pour le transport et l'assurance", "Le visa reste décidé par le consulat : nous t'aidons à mettre toutes les chances de ton côté"])}</div>
    <div class="card" style="padding:26px;display:flex;flex-direction:column;gap:14px"><b style="font-size:20px">Demander un devis</b>{champs}
      <span class="label" style="margin-top:4px">De quoi as-tu besoin ?</span><div style="display:flex;gap:8px;flex-wrap:wrap">{besoins}</div>
      <span class="btn" style="background:{s["c"]};color:#fff;padding:14px;margin-top:6px">Recevoir mon devis</span><span class="small mute" style="text-align:center">Réponse d'un conseiller sous 48 h ouvrées</span></div></section>
  <section style="padding:10px 48px 60px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
    {"".join(f'<div class="card" style="padding:18px 20px;box-shadow:none"><b style="display:flex;justify-content:space-between;font-size:16px">{q}{icon("plus", 18, s["c"])}</b></div>' for q in ["Le visa est-il garanti ?", "Combien coûte l'accompagnement ?", "Mes parents peuvent-ils payer ?", "Et si mon vol change ?"])}</section>
  <div style="background:#0b1533;padding:26px 48px;display:flex;align-items:center;gap:22px;color:#aab3c8;font-size:13px"><span style="background:#fff;border-radius:12px;padding:6px 10px">{logo("navitravel", 18)}</span><span style="margin-left:auto">Conditions d'utilisation</span><span>Confidentialité</span><span>Mentions légales</span><span>Cookies</span><b style="color:#fff">BY OAPS</b></div>
  <div {NOTE} style="left:700px;top:50px">Barre des services + menu NaviTravel</div>
  <div {NOTE} style="left:1100px;top:2120px;max-width:220px">Formulaire de devis : enregistré dans l'espace élève et traité par un conseiller</div>
</div>"""


html_out = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Pages légales, Pourquoi, NaviTravel</title><style>{CSS}{EXTRA_CSS}</style></head><body>
{menus()}{legal_navigoal()}{mentions()}{legal_navilease()}{legal_navitravel_mobile()}{pied()}{pourquoi()}{pourquoi_mobile()}{navitravel()}
</body></html>"""
open(os.path.join(P.OUT, "legal.html"), "w").write(html_out)
print("→", os.path.join(P.OUT, "legal.html"), f"({len(html_out) // 1024} Ko)")
