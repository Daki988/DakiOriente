#!/usr/bin/env python3
"""Maquettes v3 : authentification, espaces connectés (étudiant, parent, établissement, bailleur),
Navilease (recherche → réservation), back-office, recherche globale, pages éditoriales et mobile.
Écrans 17 à 50. Réutilise les composants de build.py / build_v2.py.

Usage : python3 design/maquettes/build_v3.py <dossier lucide-static/icons> [numéros d'écrans…]
Sortie : design/maquettes/out/NN-*.html
"""
import os
import re
import sys

from build import ETABS, FORMATIONS, METIERS, STUDENT, brand, doc, footer, header, icon, logo, save
from build_v2 import COUTS, NOMS, PAYS, SERIES, STATUT, chip, fmt, photo, photo_box, to_xaf

# -------------------------------------------------------------------------------------
# Styles complémentaires (insérés avant « body{width » pour être repris par les planches)
# -------------------------------------------------------------------------------------
EXTRA = """
.chip-gray{background:#f1f3f8;color:#3b4566}.chip-teal{background:#e6f6fb;color:#0e7490}.chip-ink{background:#0b1533;color:#fff}
.inp{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid #e1e6f3;border-radius:12px;background:#fff;font-size:14px;font-weight:600;min-height:46px}
.inp.focus{border-color:#1a47f5;box-shadow:0 0 0 4px #dae6ff}.inp.err{border-color:#d42a50;box-shadow:0 0 0 4px #ffe1e7}.inp.ok{border-color:#0f8a46}
.inp>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lbl{font-size:12px;font-weight:700;color:#3b4566}.ph{color:#9aa3c0;font-weight:500}.help{font-size:12px;color:#6b7493}
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;font-size:11px;font-weight:800;color:#6b7493;letter-spacing:.5px;text-transform:uppercase;padding:11px 14px;background:#f8f9fd;border-bottom:1px solid #eef1f8;white-space:nowrap}
.tbl td{padding:12px 14px;border-bottom:1px solid #eef1f8;vertical-align:middle}
.tbl tr.sel td{background:#f5f8ff}
.sep{height:1px;background:#eef1f8;width:100%}
.f1{flex:1}.wr{flex-wrap:wrap}.start{align-items:flex-start}.stretch{align-items:stretch}.center{justify-content:center}
.b{font-weight:800}.s12{font-size:12px}.s13{font-size:13px}.s14{font-size:14px}
.box{padding:12px 14px;border:1px solid #eef1f8;border-radius:14px;background:#fff}
.cb{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tgl{width:40px;height:23px;border-radius:99px;position:relative;flex-shrink:0}
.tgl>div{position:absolute;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.ann.rel{position:relative;align-self:flex-start}
.g2{gap:2px}.g14{gap:14px}.g28{gap:28px}.g48{gap:48px}
"""

INK, BLUE, SUN, GREEN, ROSE, VIOLET, TEAL, MUTED = "#0b1533", "#1a47f5", "#ffc21f", "#0f8a46", "#d42a50", "#6a3df0", "#0e7490", "#6b7493"


def page(title, body, width=1440):
    return doc(title, body, width).replace(" body{width", EXTRA + " body{width", 1)


def mad_xaf(v):
    return to_xaf(v, "MAD")


# -------------------------------------------------------------------------------------
# Petits composants
# -------------------------------------------------------------------------------------
def field(label, value="", ic=None, ph=False, state="", right="", help_="", flex=1):
    v = f'<span class="{"ph" if ph else ""}" style="flex:1">{value}</span>'
    i = icon(ic, 18, MUTED) if ic else ""
    h = f'<span class="help" style="{"color:#d42a50" if state == "err" else ""}">{help_}</span>' if help_ else ""
    return f'<div class="col g6" style="flex:{flex};min-width:0"><span class="lbl">{label}</span><div class="inp {state}">{i}{v}{right}</div>{h}</div>'


def select(label, value, ic=None, flex=1, help_=""):
    return field(label, value, ic, right=icon("chevron-down", 16, MUTED), flex=flex, help_=help_)


def cbox(text, on=True, color=BLUE, size=14):
    b = f'<div class="cb" style="background:{color if on else "#fff"};border:{"none" if on else "1.5px solid #cdd5ea"}">{icon("check", 13, "#fff", 3) if on else ""}</div>'
    return f'<div class="row g10 start" style="font-size:{size}px"><div style="padding-top:1px">{b}</div><span class="soft" style="line-height:1.45">{text}</span></div>'


def radio(text, on=False, color=BLUE):
    d = f'<div style="width:18px;height:18px;border-radius:50%;border:{"5px solid " + color if on else "1.5px solid #cdd5ea"};background:#fff;flex-shrink:0"></div>'
    return f'<div class="row g8" style="font-size:14px;font-weight:{700 if on else 600}">{d}{text}</div>'


def toggle(on=True, color=BLUE):
    return f'<div class="tgl" style="background:{color if on else "#d6dcec"}"><div style="left:{20 if on else 3}px"></div></div>'


def seg(items, active=0, color=BLUE, small=False):
    pad = "7px 12px" if small else "9px 16px"
    s = "".join(f'<span style="padding:{pad};border-radius:10px;font-size:13px;font-weight:700;{"background:#fff;color:" + color + ";box-shadow:0 2px 6px rgba(11,21,51,.1)" if k == active else "color:#6b7493"}">{t}</span>' for k, t in enumerate(items))
    return f'<div class="row" style="background:#eef1f8;border-radius:12px;padding:4px;align-self:flex-start">{s}</div>'


def tabs(items, active=0, color=BLUE):
    t = "".join(f'<div style="padding:12px 0;font-size:14px;font-weight:700;white-space:nowrap;color:{color if k == active else "#6b7493"};border-bottom:{"3px solid " + color if k == active else "3px solid transparent"}">{x}</div>' for k, x in enumerate(items))
    return f'<div class="row g24" style="border-bottom:1px solid #e6eaf5">{t}</div>'


def avatar(init, size=40, bg="linear-gradient(135deg,#ffc21f,#f9a806)", fg=INK):
    return f'<div class="ic" style="width:{size}px;height:{size}px;border-radius:50%;background:{bg};font-weight:800;color:{fg};font-size:{size*0.34:.0f}px">{init}</div>'


def ibox(name, bg, fg, size=40, isz=20, r=12):
    return f'<div class="ic" style="width:{size}px;height:{size}px;background:{bg};border-radius:{r}px">{icon(name, isz, fg)}</div>'


def kpi(label, value, sub="", ic="activity", bg="#eef4ff", fg=BLUE, delta=None, good=None):
    d = ""
    if delta:
        up = not delta.startswith("-") if good is None else good
        d = f'<span class="chip {"chip-green" if up else "chip-rose"}" style="padding:3px 8px">{icon("trending-up" if up else "trending-down", 12, GREEN if up else ROSE)} {delta}</span>'
    return f'''<div class="card col g10" style="flex:1;padding:18px 20px;border-radius:20px"><div class="row between">{ibox(ic, bg, fg, 40, 20)}{d}</div>
<div class="col g2"><span class="muted s12 b" style="letter-spacing:.3px">{label}</span><b style="font-size:26px;letter-spacing:-.8px">{value}</b><span class="muted s12">{sub}</span></div></div>'''


STATUTS = {
    "Brouillon": "chip-gray", "Soumise": "chip-blue", "Paiement confirmé": "chip-violet", "En vérification": "chip-sun", "Pièce demandée": "chip-rose",
    "Complet": "chip-teal", "En traitement": "chip-sun", "Acceptée": "chip-green", "Refusée": "chip-rose", "Liste d'attente": "chip-violet",
}


def st(s):
    return f'<span class="chip {STATUTS.get(s, "chip-gray")}">{s}</span>'


def stepper(steps, cur, color=BLUE, width=None):
    out = ""
    for k, t in enumerate(steps):
        done, on = k < cur, k == cur
        bub = icon("check", 15, "#fff", 3) if done else f'<b style="font-size:13px;color:{"#fff" if on else "#9aa3c0"}">{k+1}</b>'
        out += f'''<div class="row g10" style="flex-shrink:0"><div class="ic" style="width:32px;height:32px;border-radius:50%;background:{GREEN if done else color if on else "#fff"};border:{"none" if done or on else "2px solid #dbe3f7"};{"box-shadow:0 0 0 5px #dae6ff" if on else ""}">{bub}</div>
<span style="font-size:13px;font-weight:{800 if on else 700};color:{INK if done or on else "#9aa3c0"}">{t}</span></div>'''
        if k < len(steps) - 1:
            out += f'<div style="flex:1;min-width:24px;height:2px;background:{GREEN if done else "#dbe3f7"}"></div>'
    return f'<div class="row g12" style="{"width:" + str(width) + "px" if width else ""}">{out}</div>'


def upload_zone(title="Glisse tes fichiers ici", sub="PDF, JPG ou PNG · 10 Mo max.", h=150, color=BLUE):
    return f'''<div class="col g8" style="height:{h}px;border:2px dashed #bcd2ff;border-radius:18px;background:#f8faff;align-items:center;justify-content:center;text-align:center">
{ibox("cloud-upload", "#eef4ff", color, 48, 24, 14)}<b class="s14">{title}</b><span class="muted s12">{sub} · <span style="color:{color};font-weight:700">parcourir</span></span></div>'''


def doc_row(name, meta, status="Validé", cls="chip-green", ic="file-text", actions=True):
    a = f'<div class="row g6">{ibox("eye", "#f6f8fe", "#3b4566", 32, 16, 10)}{ibox("download", "#f6f8fe", "#3b4566", 32, 16, 10)}</div>' if actions else ""
    return f'<div class="row g12 box">{ibox(ic, "#eef4ff", BLUE, 38, 18)}<div class="col f1"><b class="s13">{name}</b><span class="muted s12">{meta}</span></div><span class="chip {cls}">{status}</span>{a}</div>'


def bar_svg(vals, labels, w=560, h=200, color=BLUE, hi=None, color2=None, vals2=None):
    mx = max(vals + (vals2 or [])) * 1.15
    n = len(vals)
    bw = (w - 40) / n
    out = ""
    for g in range(5):
        y = 10 + (h - 40) * g / 4
        out += f'<line x1="30" x2="{w}" y1="{y:.0f}" y2="{y:.0f}" stroke="#eef1f8"/><text x="0" y="{y+4:.0f}" font-size="10" fill="#9aa3c0" font-family="Plus Jakarta Sans">{round(mx*(1-g/4))}</text>'
    for k, v in enumerate(vals):
        x = 36 + k * bw
        bh = (h - 40) * v / mx
        if vals2:
            b2 = (h - 40) * vals2[k] / mx
            out += f'<rect x="{x + bw*0.18:.0f}" y="{h-30-bh:.0f}" width="{bw*0.3:.0f}" height="{bh:.0f}" rx="4" fill="{color}"/>'
            out += f'<rect x="{x + bw*0.52:.0f}" y="{h-30-b2:.0f}" width="{bw*0.3:.0f}" height="{b2:.0f}" rx="4" fill="{color2}"/>'
        else:
            out += f'<rect x="{x + bw*0.2:.0f}" y="{h-30-bh:.0f}" width="{bw*0.6:.0f}" height="{bh:.0f}" rx="6" fill="{color if hi is None or k == hi else "#c9d7ff"}"/>'
        out += f'<text x="{x + bw/2:.0f}" y="{h-10}" font-size="10" text-anchor="middle" fill="#6b7493" font-family="Plus Jakarta Sans" font-weight="700">{labels[k]}</text>'
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">{out}</svg>'


def line_svg(series, labels, w=560, h=200, colors=(BLUE, SUN, GREEN)):
    mx = max(max(s) for s in series) * 1.15
    n = len(labels)
    out = ""
    for g in range(5):
        y = 10 + (h - 40) * g / 4
        out += f'<line x1="34" x2="{w}" y1="{y:.0f}" y2="{y:.0f}" stroke="#eef1f8"/><text x="0" y="{y+4:.0f}" font-size="10" fill="#9aa3c0" font-family="Plus Jakarta Sans">{fmt(round(mx*(1-g/4)))}</text>'
    for k, lab in enumerate(labels):
        out += f'<text x="{40 + k*(w-50)/(n-1):.0f}" y="{h-8}" font-size="10" text-anchor="middle" fill="#6b7493" font-family="Plus Jakarta Sans" font-weight="700">{lab}</text>'
    for s, c in zip(series, colors):
        pts = [(40 + k * (w - 50) / (n - 1), 10 + (h - 40) * (1 - v / mx)) for k, v in enumerate(s)]
        d = " ".join(f"{x:.0f},{y:.0f}" for x, y in pts)
        area = f"40,{h-30} " + d + f" {pts[-1][0]:.0f},{h-30}"
        out += f'<polygon points="{area}" fill="{c}" opacity=".08"/><polyline points="{d}" fill="none" stroke="{c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
        out += f'<circle cx="{pts[-1][0]:.0f}" cy="{pts[-1][1]:.0f}" r="5" fill="#fff" stroke="{c}" stroke-width="3"/>'
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">{out}</svg>'


def hbar(label, val, mx, color=BLUE, right=None):
    return f'''<div class="col g6"><div class="row between s13"><span class="b">{label}</span><span class="muted b">{right or val}</span></div>
<div class="bar"><div style="width:{val/mx*100:.0f}%;background:{color}"></div></div></div>'''


def ring(pct, size=64, color=BLUE, label=None, stroke=7):
    r = size / 2 - stroke / 2 - 1
    c = 2 * 3.14159 * r
    return f'''<div style="position:relative;width:{size}px;height:{size}px;flex-shrink:0"><svg width="{size}" height="{size}"><circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" stroke="#e8edfa" stroke-width="{stroke}" fill="none"/>
<circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" stroke="{color}" stroke-width="{stroke}" fill="none" stroke-dasharray="{c:.1f}" stroke-dashoffset="{c*(1-pct/100):.1f}" stroke-linecap="round" transform="rotate(-90 {size/2} {size/2})"/></svg>
<b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:{size*0.22:.0f}px">{label or str(pct) + "%"}</b></div>'''


HOUSE_G = ["#1a47f5,#598bff", "#0f8a46,#34d399", "#6a3df0,#a78bfa", "#c2410c,#fb923c", "#0e7490,#22d3ee", "#d42a50,#fb7185"]


def house_ph(k=0, h=170, ic="building", radius=0, extra=""):
    """Visuel provisoire d'un logement (pas de photo réelle dans les référentiels)."""
    return f'''<div style="height:{h}px;border-radius:{radius}px;background:linear-gradient(135deg,{HOUSE_G[k % 6]});position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;{extra}">
<div style="position:absolute;right:-30px;bottom:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.12)"></div>{icon(ic, max(28, int(h*0.38)), "rgba(255,255,255,.6)", 1.4)}</div>'''


VERIF = {"visite": ("chip-green", "✓ Visité par Navilease"), "identite": ("chip-blue", "Identité vérifiée"), "partenaire": ("chip-sun", "★ Partenaire certifié"), "non": ("chip-gray", "Non vérifié")}


def ann(text, style):
    return f'<div class="ann" style="{style}">{text}</div>'


# -------------------------------------------------------------------------------------
# Coque des espaces connectés (une barre latérale par rôle)
# -------------------------------------------------------------------------------------
ROLES = {
    "etudiant": dict(acc=BLUE, soft="#eef4ff", label="Espace étudiant", user=("AM", "Amina Mba", "Terminale C · Libreville"), av="linear-gradient(135deg,#ffc21f,#f9a806)",
                     menu=[("layout-dashboard", "Tableau de bord", ""), ("user-round", "Mon profil", ""), ("compass", "Mon orientation", ""), ("file-text", "Mes candidatures", "4"),
                           ("folder-lock", "Mes documents", ""), ("wallet", "Paiements", ""), ("key-round", "Mon logement", ""), ("message-circle", "Messages", "3"),
                           ("bell", "Notifications", "5"), ("headset", "Conseiller", ""), ("settings", "Paramètres", "")],
                     help=("Besoin d'aide ?", "Échange avec un conseiller d'orientation.", "Prendre rendez-vous")),
    "parent": dict(acc="#c27803", soft="#fff3c4", label="Espace parent", user=("JM", "Jean-Paul Mba", "Parent · Libreville"), av="linear-gradient(135deg,#1a47f5,#598bff)",
                   menu=[("layout-dashboard", "Vue d'ensemble", ""), ("users-round", "Mes enfants", "2"), ("file-text", "Candidatures", ""), ("calculator", "Devis & budget", ""),
                         ("wallet", "Paiements", "1"), ("file-check-2", "Démarches", ""), ("key-round", "Logement", ""), ("message-circle", "Messages", ""), ("settings", "Paramètres", "")],
                   help=("Une question ?", "Nos conseillers répondent aussi aux parents.", "Contacter Navigoal")),
    "etablissement": dict(acc=VIOLET, soft="#f1edff", label="Espace établissement", user=("ESA", "Service admissions", "ESA Casablanca"), av="linear-gradient(135deg,#6a3df0,#a78bfa)",
                          menu=[("layout-dashboard", "Tableau de bord", ""), ("inbox", "Candidatures", "38"), ("graduation-cap", "Formations", ""), ("megaphone", "Campagnes", ""),
                                ("building-2", "Fiche établissement", ""), ("message-circle", "Messages", "6"), ("chart-column", "Statistiques", ""), ("users", "Équipe", ""), ("settings", "Paramètres", "")],
                          help=("Plan Partenaire", "Mise en avant + statistiques avancées jusqu'au 31/08/2027.", "Gérer mon offre")),
    "bailleur": dict(acc=GREEN, soft="#e8f8ef", label="Espace bailleur Navilease", user=("KB", "Karim Benjelloun", "Bailleur · Casablanca"), av="linear-gradient(135deg,#0f8a46,#34d399)",
                     menu=[("layout-dashboard", "Tableau de bord", ""), ("house", "Mes annonces", ""), ("inbox", "Demandes", "3"), ("calendar-check", "Réservations", ""),
                           ("hand-coins", "Encaissements", ""), ("receipt", "Contrats & quittances", ""), ("message-circle", "Messages", "2"), ("shield-check", "Vérification KYC", ""), ("settings", "Paramètres", "")],
                     help=("Devenez Partenaire certifié", "Visite Navilease + badge ★ : 2× plus de demandes.", "Planifier la visite")),
    "admin": dict(acc=SUN, soft="rgba(255,255,255,.1)", label="Back-office Navigoal", user=("SN", "Sarah Nzé", "Administratrice"), av="linear-gradient(135deg,#ff3d7f,#fb7185)",
                  menu=[("layout-dashboard", "Tableau de bord", ""), ("users", "Utilisateurs", ""), ("building-2", "Établissements", "7"), ("database", "Référentiels", ""),
                        ("key-round", "Navilease · modération", "12"), ("wallet", "Paiements", ""), ("newspaper", "Contenus", ""), ("compass", "Tests d'orientation", ""),
                        ("history", "Journal d'audit", ""), ("settings", "Paramètres", "")],
                  help=None),
}


def space(role, active, content, right="", search="Rechercher…", minh=1000):
    R = ROLES[role]
    dark = role == "admin"
    acc = R["acc"]
    items = ""
    for i, t, badge in R["menu"]:
        on = t == active
        if dark:
            bg, col, icol = ("rgba(255,255,255,.1)" if on else "transparent"), ("#fff" if on else "#a9b6e8"), (SUN if on else "#7f8fcf")
        else:
            bg, col, icol = (R["soft"] if on else "transparent"), (acc if on else "#3b4566"), (acc if on else MUTED)
        bd = f'<span class="chip" style="margin-left:auto;padding:2px 8px;background:{SUN if not on else acc};color:{INK if not on or dark else "#fff"}">{badge}</span>' if badge else ""
        items += f'<div class="row g12" style="padding:10px 14px;border-radius:12px;font-size:14px;font-weight:{700 if on else 600};background:{bg};color:{col}">{icon(i, 18, icol)}{t}{bd}</div>'
    help_ = ""
    if R["help"]:
        a, b, c = R["help"]
        help_ = f'''<div style="margin-top:auto;border-radius:18px;padding:18px;background:linear-gradient(135deg,{acc},{acc}cc);color:#fff" class="col g8"><div style="font-weight:800">{a}</div>
<div style="font-size:12px;color:rgba(255,255,255,.85)">{b}</div><a class="btn btn-sun" style="padding:9px 12px;font-size:13px">{c}</a></div>'''
    else:
        help_ = f'''<div style="margin-top:auto;border-radius:16px;padding:14px;background:rgba(255,255,255,.06);color:#c9d6ff" class="col g6 s12"><div class="row g8 b" style="color:#fff">{icon("shield-check", 16, SUN)} Session sécurisée</div>
<span>2FA activée · rôle Super-admin</span><span>Dernière connexion : 09/10/2026 08:12</span></div>'''
    side_bg = "#0b1a4f" if dark else "#fff"
    tb_bg = "#fff"
    u0, u1, u2 = R["user"]
    av = avatar(u0, 42, R["av"], "#fff" if role in ("etablissement", "bailleur", "admin") else INK)
    if role == "etablissement":
        av = logo("ma-esa-casa", 42)
    lab = f'<span class="chip" style="align-self:flex-start;background:{"rgba(255,194,31,.15)" if dark else R["soft"]};color:{SUN if dark else acc}">{R["label"]}</span>'
    return f"""<div class="row" style="align-items:stretch;min-height:{minh}px">
<div class="col g20" style="width:264px;flex-shrink:0;background:{side_bg};border-right:1px solid {"#1e2f73" if dark else "#e6eaf5"};padding:24px 16px">{brand(dark)}{lab}<div class="col g4">{items}</div>{help_}</div>
<div class="col" style="flex:1;min-width:0"><div class="row between" style="height:72px;padding:0 32px;background:{tb_bg};border-bottom:1px solid #e6eaf5;flex-shrink:0">
<div class="row g10" style="width:400px;background:#f6f8fe;border-radius:12px;padding:11px 16px">{icon('search', 18, MUTED)}<span class="muted s14">{search}</span><span class="chip chip-gray" style="margin-left:auto;padding:2px 7px;font-size:11px">⌘ K</span></div>
<div class="row g16 start">{right}<div class="ic" style="width:42px;height:42px;background:#f6f8fe;border-radius:12px;position:relative">{icon('bell', 20, '#3b4566')}<div style="position:absolute;right:9px;top:9px;width:8px;height:8px;border-radius:50%;background:#ff3d7f"></div></div>
<div class="row g10">{av}<div class="col"><div style="font-weight:700;font-size:14px">{u1}</div><div class="muted s12">{u2}</div></div>{icon("chevron-down", 16, MUTED)}</div></div></div>
<div style="padding:28px 32px">{content}</div></div></div>"""


def head(title, sub="", right="", eyebrow=""):
    e = f'<div class="eyebrow">{eyebrow}</div>' if eyebrow else ""
    return f'<div class="row between" style="margin-bottom:22px"><div class="col g6">{e}<h2 style="font-size:30px">{title}</h2>{f"<span class=muted>{sub}</span>" if sub else ""}</div><div class="row g10">{right}</div></div>'


def crumbs(*parts):
    sep = icon("chevron-right", 14, MUTED)
    return f'<div class="row g8 muted s13">{sep.join(parts)}</div>'


# =====================================================================================
# 17–20. AUTHENTIFICATION
# =====================================================================================
def auth_panel(title, sub, cards=True):
    floating = ""
    if cards:
        floating = f"""
<div class="card row g12" style="position:absolute;left:44px;top:330px;padding:12px 16px;border-radius:16px;color:{INK}">{ibox("badge-check", "#e8f8ef", GREEN, 40, 20)}<div class="col"><b class="s13">Candidature acceptée 🎉</b><span class="muted s12">ESA Casablanca · Bachelor business</span></div></div>
<div class="card row g12" style="position:absolute;right:36px;top:470px;padding:12px 16px;border-radius:16px;color:{INK}">{ibox("shield-check", "#fff3c4", "#a55a00", 40, 20)}<div class="col"><b class="s13">Paiement protégé</b><span class="muted s12">Airtel Money · Wave · Orange Money</span></div></div>
<div class="card row g10" style="position:absolute;left:60px;bottom:60px;padding:10px 14px;border-radius:14px;color:{INK}">{ibox("key-round", SUN, INK, 34, 16, 10)}<b class="s13">Studio vérifié à 8 min de ton école</b></div>"""
    return f"""<div style="width:600px;flex-shrink:0;position:relative;overflow:hidden;background:linear-gradient(150deg,#0b1a4f 0%,#1336e0 55%,#598bff 100%);color:#fff;padding:40px 48px">
<div style="position:absolute;right:-120px;top:-100px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(255,194,31,.4),transparent 70%)"></div>
<div style="position:absolute;left:150px;bottom:0;width:430px;height:430px;border-radius:42% 58% 70% 30% / 45% 45% 55% 55%;background:rgba(255,255,255,.1)"></div>
<img src="{STUDENT}" style="position:absolute;left:150px;bottom:0;width:470px">
<div class="col g16" style="position:relative">{brand(True)}<div style="font-size:36px;font-weight:800;letter-spacing:-1px;line-height:1.12;margin-top:28px;width:470px">{title}</div><p style="color:#c9d6ff;font-size:16px;line-height:1.55;width:440px">{sub}</p></div>
{floating}</div>"""


def auth_top(step=None):
    st_ = stepper(["Profil", "Informations", "Vérification"], step, width=560) if step is not None else ""
    return f'<div class="row between" style="padding:22px 48px;background:#fff;border-bottom:1px solid #e6eaf5">{brand()}{st_}<div class="row g10 s14"><span class="muted">Déjà inscrit·e ?</span><a class="btn btn-ghost" style="padding:10px 16px">Se connecter</a></div></div>'


def s17_connexion():
    form = f"""<div class="col g20" style="width:410px">
<div class="col g8"><h2 style="font-size:34px">Bon retour 👋</h2><span class="muted s14">Connecte-toi pour suivre ton orientation, tes candidatures et ton logement.</span></div>
{seg(["Mot de passe", "Code par SMS"], 0)}
{field("E-mail ou numéro de téléphone", "amina.mba@gmail.com", "at-sign", state="focus")}
{field("Mot de passe", "••••••••••••", "lock", right=icon("eye", 18, MUTED))}
<div class="row between">{cbox("Rester connecté·e", True)}<a class="s13 b" style="color:{BLUE}">Mot de passe oublié ?</a></div>
<a class="btn btn-primary" style="width:100%;padding:15px">Se connecter {icon("arrow-right", 18, "#fff")}</a>
<div class="row g12 muted s12"><div class="sep f1"></div>ou<div class="sep f1"></div></div>
<div class="row g10"><a class="btn btn-ghost f1" style="color:{INK};border-color:#e1e6f3">{icon("globe", 16, INK)} Google</a><a class="btn btn-ghost f1" style="color:{INK};border-color:#e1e6f3">{icon("smartphone", 16, INK)} Code par SMS</a></div>
<div class="s14" style="text-align:center"><span class="muted">Pas encore de compte ?</span> <b style="color:{BLUE}">Créer un compte gratuitement</b></div>
<div class="row g8 muted s12 center">{icon("shield-check", 14, GREEN)} Connexion chiffrée · tes données ne sont jamais revendues</div></div>"""
    sms = f"""<div class="col g14" style="width:290px;gap:14px;position:relative">
<span class="muted s12 b">VARIANTE · ONGLET « CODE PAR SMS »</span>
<div class="card col g14" style="padding:20px;border-radius:20px;gap:14px">{seg(["Mot de passe", "Code par SMS"], 1, small=True)}
<div class="col g6"><span class="lbl">Numéro de téléphone</span><div class="row g8"><div class="inp" style="width:112px;white-space:nowrap;gap:6px">🇬🇦 +241{icon("chevron-down", 14, MUTED)}</div><div class="inp f1">07 41 22 48</div></div></div>
<a class="btn btn-primary" style="padding:12px">Recevoir le code</a><span class="help">Un code à 6 chiffres arrive par SMS (ou WhatsApp si tu préfères).</span></div>
<span class="muted s12 b" style="margin-top:6px">ÉTAT · MOT DE PASSE OUBLIÉ</span>
<div class="card col g12" style="padding:20px;border-radius:20px">{ibox("key-round", "#fff3c4", "#a55a00", 40, 20)}<b>Réinitialiser le mot de passe</b><span class="muted s13">Saisis ton e-mail ou ton numéro : on t'envoie un lien valable 30 minutes.</span>{field("E-mail ou téléphone", "+241 07 41 22 48", "smartphone")}<a class="btn btn-ghost" style="padding:11px">Envoyer le lien</a></div>
<span class="muted s12 b" style="margin-top:6px">ÉTAT · ERREUR</span>
<div class="row g10" style="padding:12px 14px;border-radius:14px;background:#ffecef;color:{ROSE};font-size:13px;font-weight:600">{icon("circle-alert", 18, ROSE)}Identifiants incorrects · 2 essais restants</div>
{ann("Onglets : glissement du soulignement (layout animation)", "left:120px;top:-26px")}</div>"""
    body = f"""<div class="row" style="min-height:960px;align-items:stretch">{auth_panel("Ton avenir commence <span class='sun'>ici.</span>", "Orientation, formations, candidatures et logement étudiant : retrouve tout ton parcours, sur ordinateur ou sur ton téléphone.")}
<div class="col f1" style="background:#fff"><div class="row between" style="padding:24px 48px"><span></span><div class="row g8 s13 b soft">{icon("languages", 16, MUTED)} Français {icon("chevron-down", 14, MUTED)}</div></div>
<div class="row f1" style="justify-content:center;align-items:center;gap:36px;padding:0 32px 40px">{form}<div style="width:1px;align-self:stretch;background:#eef1f8"></div>{sms}</div></div></div>"""
    save("17-connexion", page("Navigoal — Connexion", body))


def s18_profil():
    profils = [
        ("school", BLUE, "#eef4ff", "Élève", "Collège ou lycée", ["Test d'orientation", "Choisir ma série", "Annales BEPC / BFEM / bac"], False),
        ("graduation-cap", VIOLET, "#f1edff", "Étudiant·e", "Bachelier ou en études supérieures", ["Candidater dans 79 écoles", "Suivre mes dossiers", "Logement Navilease"], True),
        ("users-round", "#c27803", "#fff3c4", "Parent / tuteur", "J'accompagne mon enfant", ["Suivre ses candidatures", "Devis et paiements", "Garant du logement"], False),
        ("building-2", GREEN, "#e8f8ef", "Établissement", "École, université, institut", ["Recevoir des candidatures", "Gérer mes formations", "Statistiques"], False),
        ("key-round", ROSE, "#ffecef", "Bailleur Navilease", "Je loue à des étudiants", ["Publier mes logements", "Paiement en séquestre", "Contrats & quittances"], False),
    ]
    cards = ""
    for i, c, bg, t, s, pts, on in profils:
        chk = f'<div class="ic" style="position:absolute;right:36px;top:36px;width:30px;height:30px;border-radius:50%;background:{c}">{icon("check", 16, "#fff", 3)}</div>' if on else f'<div style="position:absolute;right:36px;top:36px;width:26px;height:26px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.6)"></div>'
        cards += f'''<div class="col g16" style="flex:1;padding:24px;border-radius:26px;background:#fff;position:relative;border:{"2.5px solid " + c if on else "1.5px solid #e6eaf5"};box-shadow:{"0 26px 50px -20px rgba(106,61,240,.5)" if on else "0 10px 30px -18px rgba(11,21,51,.18)"};{"transform:translateY(-8px)" if on else ""}">
<div class="ic" style="height:120px;border-radius:18px;background:{bg};position:relative;overflow:hidden"><div style="position:absolute;right:-20px;bottom:-30px;width:110px;height:110px;border-radius:50%;background:{c};opacity:.12"></div>{icon(i, 56, c, 1.6)}</div>{chk}
<div class="col g4"><b style="font-size:19px">{t}</b><span class="muted s13">{s}</span></div>
<div class="col g8">{"".join(f'<div class="row g8 s13">{icon("check", 14, c, 3)}<span class="soft">{p}</span></div>' for p in pts)}</div></div>'''
    body = f"""{auth_top(0)}
<div style="background:radial-gradient(900px 500px at 85% 0%,#dae6ff,transparent 60%),radial-gradient(700px 400px at 0% 100%,#fff3c4,transparent 60%),#f6f8fe;padding:56px 0 64px;min-height:880px">
<div class="wrap col g32" style="position:relative"><div class="col g10" style="align-items:center;text-align:center"><span class="chip chip-blue">Étape 1 sur 3 · Ton profil</span><h1 style="font-size:52px">Qui es-tu ?</h1><p class="soft" style="font-size:17px;width:640px">Choisis ton profil : Navigoal adapte ton espace, tes outils et ce que tu vois. Tu pourras ajouter un autre rôle plus tard.</p></div>
<div class="row g20 stretch">{cards}</div>
{ann("Survol : élévation + teinte · sélection : ressort + coche qui « pop »", "left:470px;top:150px")}
<div class="row between" style="margin-top:8px"><div class="row g10 s13 muted">{icon("info", 16, MUTED)} Tu as moins de 18 ans ? Ton parent ou tuteur validera ton inscription.</div><div class="row g12"><a class="btn btn-ghost">Retour</a><a class="btn btn-primary" style="padding:14px 28px">Continuer en tant qu'étudiant·e {icon("arrow-right", 18, "#fff")}</a></div></div>
<div class="card row g16" style="padding:18px 22px;border-radius:20px"><div class="ic" style="width:44px;height:44px;border-radius:14px;background:#f1edff">{icon("building-2", 22, VIOLET)}</div><div class="col f1"><b class="s14">Vous représentez un établissement ou vous êtes bailleur ?</b><span class="muted s13">Votre compte sera activé après vérification par l'équipe Navigoal (agrément, pièce d'identité, titre de propriété) sous 48 h ouvrées.</span></div><span class="chip chip-sun">Vérification manuelle</span></div>
</div></div>"""
    save("18-inscription-profil", page("Navigoal — Inscription · profil", body))


def s19_formulaire():
    sc = SERIES["ga-bac-c"]
    sec = lambda n, t, ic: f'<div class="row g10"><div class="ic" style="width:30px;height:30px;border-radius:50%;background:#eef4ff;color:{BLUE};font-weight:800;font-size:13px">{n}</div><b style="font-size:17px">{t}</b><span style="margin-left:auto">{icon(ic, 18, "#bcd2ff")}</span></div>'
    strength = "".join(f'<div class="f1" style="height:5px;border-radius:5px;background:{GREEN if k < 3 else "#e8edfa"}"></div>' for k in range(4))
    form = f"""<div class="card col g20" style="flex:1;padding:32px;border-radius:26px">
{sec(1, "Identité", "user-round")}
<div class="row g16 start">{field("Prénom", "Amina")}{field("Nom", "Mba")}</div>
<div class="row g16 start">{field("Date de naissance", "14 / 03 / 2009", "calendar", help_="17 ans · compte mineur")}{select("Genre (facultatif)", "Féminin")}{select("Nationalité", "🇬🇦 Gabonaise")}</div>
<div class="sep"></div>{sec(2, "Où vis-tu ?", "map-pin")}
<div class="row g16 start">{select("Pays de résidence", "🇬🇦 Gabon", flex=1)}{select("Ville", "Libreville", "map-pin")}</div>
<div class="sep"></div>{sec(3, "Ta scolarité", "school")}
<div class="row g16 start">{select("Niveau actuel", "Terminale")}{select("Série", f"Bac {sc['code']} — {sc['intitule']}", flex=1.6)}</div>
<div class="row g16 start">{field("Établissement", "Lycée national Léon Mba", "school", help_="Recherche parmi 31 lycées du Gabon")}{select("Année du bac", "2027", flex=.6)}</div>
<div class="sep"></div>{sec(4, "Tes identifiants", "lock")}
{seg(["E-mail", "Téléphone"], 0, small=True)}
<div class="row g16 start">{field("Adresse e-mail", "amina.mba@gmail.com", "mail", state="ok", right=icon("circle-check", 18, GREEN))}<div class="col g6 f1"><span class="lbl">Mot de passe</span><div class="inp focus">{icon("lock", 18, MUTED)}<span class="f1">••••••••••</span>{icon("eye-off", 18, MUTED)}</div><div class="row g4">{strength}</div><span class="help" style="color:{GREEN}">Bon mot de passe · 10 caractères, 1 chiffre</span></div></div>
<div class="col g14" style="padding:20px;border-radius:20px;background:linear-gradient(160deg,#fff7dd,#fff);border:1.5px solid #ffe08a;gap:14px;position:relative">
<div class="row g10">{ibox("users-round", SUN, INK, 38, 18)}<div class="col"><b>Ton parent ou tuteur</b><span class="muted s12">Obligatoire car tu as moins de 18 ans</span></div><span class="chip chip-sun" style="margin-left:auto">Consentement parental</span></div>
<div class="row g16 start">{select("Lien", "Père", flex=.6)}{field("Nom complet", "Jean-Paul Mba")}{field("E-mail ou téléphone", "+241 06 12 34 56", "smartphone")}</div>
<div class="row g8 s13 soft start">{icon("info", 16, "#a55a00")}<span>Il recevra un lien pour <b>valider ton inscription</b>. En attendant, tu peux explorer Navigoal ; les candidatures et paiements seront activés après sa validation.</span></div>
{ann("Bloc affiché automatiquement si âge &lt; 18 ans (dépliage animé)", "right:16px;top:-12px")}</div>
<div class="col g10">{cbox("J'accepte les <b style='color:#1a47f5'>conditions générales d'utilisation</b> et la <b style='color:#1a47f5'>politique de confidentialité</b> de Navigoal.", True)}{cbox("Je souhaite recevoir les dates de concours, bourses et conseils d'orientation (facultatif).", False)}</div>
<div class="row between"><a class="btn btn-ghost">{icon("arrow-left", 16, "#1336e0")} Retour</a><a class="btn btn-primary" style="padding:14px 26px">Créer mon compte {icon("arrow-right", 18, "#fff")}</a></div></div>"""
    aside = f"""<div class="col g16" style="width:360px">
<div class="card col g12" style="padding:22px;border-radius:22px"><span class="muted s12 b">PROFIL CHOISI</span><div class="row g12">{ibox("graduation-cap", "#f1edff", VIOLET, 46, 22, 14)}<div class="col"><b>Étudiant·e</b><span class="muted s12">Bachelier ou futur bachelier</span></div><a class="s13 b" style="margin-left:auto;color:{BLUE}">Modifier</a></div></div>
<div class="card col g12" style="padding:22px;border-radius:22px"><b>Pourquoi ces informations ?</b>{"".join(f'<div class="row g10 s13 start">{ibox(i, "#eef4ff", BLUE, 30, 15, 9)}<span class="soft" style="padding-top:5px">{t}</span></div>' for i, t in [("target", "Ta série et ton niveau filtrent les formations auxquelles tu peux candidater."), ("map-pin", "Ton pays adapte les moyens de paiement et les démarches de visa."), ("shield-check", "Tes données restent privées : seules les écoles où tu candidates voient ton dossier.")])}</div>
<div class="card col g10" style="padding:22px;border-radius:22px;background:linear-gradient(140deg,#0b1a4f,#1336e0);color:#fff;border:none"><div class="row g8">{icon("sparkles", 18, SUN)}<b>Après l'inscription</b></div><span style="color:#c9d6ff;font-size:13px;line-height:1.55">Passe le test d'orientation (10 min) et découvre les métiers, formations et écoles qui te correspondent.</span></div>
<div class="row g8 muted s12">{icon("lock", 14, MUTED)} Conforme aux lois de protection des données du Gabon, du Maroc (loi 09-08) et du Sénégal (loi 2008-12).</div></div>"""
    body = f"""{auth_top(1)}<div style="background:#f6f8fe;padding:36px 0 56px"><div class="wrap col g20"><div class="col g6"><span class="chip chip-blue" style="align-self:flex-start">Étape 2 sur 3 · Tes informations</span><h2 style="font-size:34px">Faisons connaissance, Amina</h2></div>
<div class="row g24 start">{form}{aside}</div></div></div>"""
    save("19-inscription-formulaire", page("Navigoal — Inscription · formulaire", body))


def s20_otp():
    digits = ["4", "8", "1", "7", "", ""]
    boxes = "".join(f'<div class="ic" style="width:60px;height:70px;border-radius:16px;border:{"2.5px solid " + BLUE if k == 4 else "1.5px solid " + ("#bcd2ff" if d else "#e1e6f3")};background:{"#f5f8ff" if d else "#fff"};font-size:30px;font-weight:800;{"box-shadow:0 0 0 5px #dae6ff" if k == 4 else ""}">{d or ("<div style=width:2px;height:30px;background:#1a47f5></div>" if k == 4 else "")}</div>' for k, d in enumerate(digits))
    err_boxes = "".join(f'<div class="ic" style="width:34px;height:40px;border-radius:10px;border:1.5px solid {ROSE};background:#fff5f7;font-size:17px;font-weight:800;color:{ROSE}">{d}</div>' for d in "481709")
    ok_boxes = "".join(f'<div class="ic" style="width:34px;height:40px;border-radius:10px;border:1.5px solid {GREEN};background:#f1fbf5;font-size:17px;font-weight:800;color:{GREEN}">{d}</div>' for d in "481723")
    card = f"""<div class="card col g24" style="width:600px;padding:44px;border-radius:30px;align-items:center;text-align:center;position:relative;box-shadow:0 40px 80px -30px rgba(26,71,245,.35)">
<div style="position:relative">{ibox("smartphone", "#eef4ff", BLUE, 84, 40, 26)}<div class="ic" style="position:absolute;right:-8px;top:-8px;width:32px;height:32px;border-radius:50%;background:{SUN};border:3px solid #fff">{icon("message-square-text", 15, INK)}</div></div>
<div class="col g8"><h2 style="font-size:32px">Vérifie ton numéro</h2><span class="soft">Saisis le code à 6 chiffres envoyé par SMS au <b>+241 07 •• •• 48</b></span></div>
<div class="row g10">{boxes}</div>
<div class="row g8 s14"><div class="ic" style="width:26px;height:26px;border-radius:50%;background:#fff3c4">{icon("timer", 15, "#a55a00")}</div><span class="soft">Renvoyer le code dans <b>00:42</b></span></div>
<a class="btn btn-primary" style="width:100%;padding:15px;opacity:.55">Vérifier</a>
<div class="row g24 s13 b"><a style="color:{BLUE}">Modifier le numéro</a><span style="color:#d6dcec">|</span><a style="color:{BLUE}">Recevoir par WhatsApp</a><span style="color:#d6dcec">|</span><a style="color:{BLUE}">Utiliser mon e-mail</a></div>
{ann("Collage du code auto-détecté · passage automatique à la case suivante", "left:40px;top:-12px")}</div>"""
    states = f"""<div class="col g16" style="width:340px">
<span class="muted s12 b">ÉTATS</span>
<div class="card col g10" style="padding:20px;border-radius:20px"><div class="row g8">{icon("circle-x", 18, ROSE)}<b class="s14">Code incorrect</b></div><div class="row g6">{err_boxes}</div><span class="help" style="color:{ROSE}">Code incorrect · 2 tentatives restantes</span>{ann("Secousse horizontale (shake 300 ms)", "position:relative;align-self:flex-start;background:#ff3d7f")}</div>
<div class="card col g10" style="padding:20px;border-radius:20px"><div class="row g8">{icon("circle-check", 18, GREEN)}<b class="s14">Numéro vérifié</b></div><div class="row g6">{ok_boxes}</div><span class="help" style="color:{GREEN}">Redirection vers ton espace…</span></div>
<div class="card col g10" style="padding:20px;border-radius:20px"><div class="row g8">{icon("clock", 18, "#a55a00")}<b class="s14">Code expiré</b></div><span class="muted s13">Le code est valable 10 minutes. <b style="color:{BLUE}">Renvoyer un nouveau code</b></span></div>
<div class="card col g10" style="padding:20px;border-radius:20px;background:linear-gradient(160deg,#fff7dd,#fff)"><div class="row g8">{icon("users-round", 18, "#a55a00")}<b class="s14">Et ensuite ?</b></div><span class="muted s13">Ton père (Jean-Paul Mba) reçoit un SMS pour valider ton inscription. Tu seras notifiée dès sa validation.</span></div></div>"""
    body = f"""{auth_top(2)}<div style="background:radial-gradient(900px 500px at 50% 0%,#dae6ff,transparent 60%),#f6f8fe;padding:56px 0 70px;min-height:880px"><div class="row g40 start center">{card}{states}</div></div>"""
    save("20-verification-otp", page("Navigoal — Vérification OTP", body))


# =====================================================================================
# 21–28. ESPACE ÉTUDIANT
# =====================================================================================
def frow(*xs, gap=16):
    return f'<div class="row start" style="gap:{gap}px">{"".join(xs)}</div>'


def card(inner, pad=22, extra="", gap=14):
    return f'<div class="card col" style="padding:{pad}px;border-radius:22px;gap:{gap}px;{extra}">{inner}</div>'


def ctitle(t, right="", ic=None, color=BLUE, bg="#eef4ff"):
    i = ibox(ic, bg, color, 34, 17, 10) if ic else ""
    return f'<div class="row between"><div class="row g10">{i}<h3 style="font-size:17px">{t}</h3></div><div class="row g8">{right}</div></div>'


def link(t, color=BLUE):
    return f'<a class="s13 b" style="color:{color}">{t}</a>'


def kv(a, b):
    return f'<div class="col g2"><span class="muted s12 b">{a}</span><b class="s14">{b}</b></div>'


CANDS = [
    ("2026-00125", "ma-esa-casa", "frm-bachelor-business", "Acceptée", 6, "Admission conditionnelle · attestation du bac à fournir", "28/02/2027", "1 500 MAD"),
    ("2026-00131", "ma-uir", "frm-ingenieur-informatique", "En traitement", 5, "Entretien en visio prévu le 22/03/2027", "02/03/2027", "1 200 MAD"),
    ("2026-00140", "sn-esmt", "frm-ingenieur-telecoms", "Pièce demandée", 3, "Relevé de notes de 1re à ajouter avant le 30/03", "09/03/2027", "50 000 F CFA"),
    ("2026-00152", "ga-bbs", "frm-bachelor-business", "Paiement confirmé", 2, "Dossier transmis à BBS · vérification sous 5 jours", "14/03/2027", "35 000 F CFA"),
    ("2026-00158", "ma-emsi", "frm-ingenieur-informatique", "Brouillon", 0, "Il reste : lettre de motivation et paiement", "—", "1 000 MAD"),
]
STEPS7 = ["Brouillon", "Soumise", "Paiement confirmé", "En vérification", "Complet", "En traitement", "Acceptée"]


def mini_steps(n, color=BLUE, total=7):
    return "".join(f'<div style="flex:1;height:6px;border-radius:6px;background:{GREEN if n >= 6 else color if j < n else "#e8edfa"}"></div>' for j in range(total))


def s21_profil():
    e = ETABS
    comps = ["Raisonnement mathématique", "Résolution de problèmes", "Programmation (Python, Java, JavaScript...)", "Esprit d'analyse et de synthèse", "Organisation et gestion du temps", "Travail en équipe", "Anglais professionnel", "Bureautique (traitement de texte, tableur)"]
    notes = [("Mathématiques", "15,5"), ("Physique-chimie", "14,0"), ("SVT", "12,5"), ("Français", "13,0"), ("Anglais", "15,0"), ("Philosophie", "11,5")]
    ident = card(f"""{ctitle("Identité", link("Modifier"), "user-round")}
<div class="row g20">{avatar("AM", 84)}<div class="col g4 f1"><b style="font-size:22px">Amina Mba</b><span class="muted s14">Née le 14/03/2009 · 17 ans · Gabonaise</span><div class="row g8" style="margin-top:6px">{chip("Compte mineur", "chip-sun")}{chip("✓ Téléphone vérifié", "chip-green")}{chip("✓ E-mail vérifié", "chip-green")}</div></div></div>
<div class="row g24" style="padding-top:6px">{kv("E-MAIL", "amina.mba@gmail.com")}{kv("TÉLÉPHONE", "+241 07 41 22 48")}{kv("VILLE", "Libreville, Gabon")}{kv("LANGUES", "Français, anglais")}</div>""")
    scol = card(f"""{ctitle("Scolarité", link("Modifier"), "school", VIOLET, "#f1edff")}
<div class="row g24">{kv("NIVEAU", "Terminale")}{kv("SÉRIE", "Bac C · Maths & sciences physiques")}{kv("LYCÉE", "Lycée national Léon Mba")}{kv("BAC PRÉVU", "Juin 2027")}</div>
<div class="row g8">{"".join(f'<div class="col g2" style="padding:10px 12px;border-radius:12px;background:#f6f8fe;flex:1;min-width:0"><span class="muted s12">{m}</span><b style="font-size:17px">{n}<span class="muted s12">/20</span></b></div>' for m, n in notes)}</div>
<div class="row g10 s13" style="padding:12px 14px;border-radius:14px;background:#eef4ff">{icon("file-check-2", 18, BLUE)}<span class="soft">Moyenne générale 1er trimestre : <b>14,2/20</b> · bulletins de 1re et Terminale déposés dans <b>Mes documents</b></span></div>""")
    compet = card(f"""{ctitle("Compétences", link("+ Ajouter"), "sparkles", GREEN, "#e8f8ef")}
<div class="row g8 wr">{"".join(chip(c, "chip-blue" if k < 3 else "chip-gray") for k, c in enumerate(comps))}</div>
<span class="muted s12">Les 3 premières viennent de ton test d'orientation (profil Investigateur · Conventionnel). Les autres sont déclarées.</span>""")
    etud = card(f"""{ctitle("Préférences d'études", link("Modifier"), "target", "#a55a00", "#fff3c4")}
<div class="row g24 start"><div class="col g8 f1"><span class="muted s12 b">PAYS SOUHAITÉS (PAR ORDRE)</span>{"".join(f'<div class="row g10 box" style="padding:9px 12px"><b style="color:{BLUE}">{k+1}</b><span class="s14 b">{p}</span><span style="margin-left:auto">{icon("grip-vertical", 16, "#c3cbe0")}</span></div>' for k, p in enumerate(["🇲🇦 Maroc", "🇸🇳 Sénégal", "🇬🇦 Gabon"]))}</div>
<div class="col g12 f1"><span class="muted s12 b">BUDGET SCOLARITÉ MAX / AN</span><b style="font-size:22px">4 000 000 F CFA</b><div style="position:relative;height:8px;border-radius:9px;background:#e8edfa"><div style="width:62%;height:100%;border-radius:9px;background:linear-gradient(90deg,#1a47f5,#ffc21f)"></div><div style="position:absolute;left:62%;top:-6px;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid {BLUE};margin-left:-10px"></div></div>
<span class="muted s12 b" style="margin-top:6px">DOMAINES</span><div class="row g6 wr">{chip("Informatique & télécoms")}{chip("Gestion & management")}</div><span class="muted s12 b">STATUT</span><div class="row g6 wr">{chip("Privé reconnu", "chip-green")}{chip("Inter-États", "chip-green")}</div></div></div>""")
    loge = card(f"""{ctitle("Préférences logement", link("Modifier"), "key-round", ROSE, "#ffecef")}
<div class="row g24">{kv("TYPE", "Studio ou colocation")}{kv("BUDGET MAX", "3 000 MAD / mois")}{kv("DISTANCE", "≤ 20 min de l'école")}{kv("COLOCATION", "Entre filles uniquement")}</div>
<div class="row g6 wr">{"".join(chip(x, "chip-gray") for x in ["Meublé", "Wifi", "Gardiennage 24h/24", "Proche transports", "Espace de travail"])}</div>""")
    left = f'<div class="col g20 f1">{ident}{scol}<div class="row g20 stretch"><div class="f1 col">{compet}</div></div>{etud}{loge}</div>'
    checklist = [("Identité", True), ("Scolarité & notes", True), ("Test d'orientation", True), ("Compétences", True), ("Préférences d'études", True), ("Pièce d'identité", True), ("Attestation du bac", False), ("Photo de profil", False)]
    right = f"""<div class="col g20" style="width:360px">
{card(f'<div class="row g16">{ring(80, 78, BLUE)}<div class="col g4"><b style="font-size:17px">Profil complet à 80 %</b><span class="muted s13">Un profil complet = candidatures en 1 clic</span></div></div><div class="col g8">' + "".join(f'<div class="row g10 s13">{icon("circle-check" if ok else "circle-alert", 16, GREEN if ok else "#c27803")}<span class="{"soft" if ok else "b"}">{t}</span>{"" if ok else "<span style=margin-left:auto>" + link("Ajouter") + "</span>"}</div>' for t, ok in checklist) + '</div>' + ann("Anneau qui se remplit à chaque ajout", "right:14px;top:-12px"), extra="position:relative")}
{card(f'''{ctitle("Parent lié", "", "users-round", "#a55a00", "#fff3c4")}<div class="row g12">{avatar("JM", 46, "linear-gradient(135deg,#1a47f5,#598bff)", "#fff")}<div class="col f1"><b class="s14">Jean-Paul Mba</b><span class="muted s12">Père · +241 06 12 •• ••</span></div>{chip("✓ Consentement", "chip-green")}</div>
<div class="row g8 s12" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:#0f8a46;font-weight:700">{icon("shield-check", 16, GREEN)} Inscription validée le 12/09/2026 à 19:42</div>
<span class="muted s12 b">CE QUE TON PARENT PEUT FAIRE</span>{"".join(f'<div class="row between s13"><span class="soft">{t}</span>{toggle(on)}</div>' for t, on in [("Voir mes candidatures", True), ("Payer pour moi", True), ("Être garant de mon logement", True), ("Lire mes messages", False)])}''')}
{card(f'''{ctitle("Confidentialité", "", "lock", "#3b4566", "#f1f3f8")}{"".join(f'<div class="row between s13"><span class="soft">{t}</span>{toggle(on)}</div>' for t, on in [("Profil visible par les écoles où je candidate", True), ("Recevoir des propositions d'écoles", True), ("Partager mes résultats du test", False)])}<a class="s13 b" style="color:{ROSE}">Télécharger / supprimer mes données</a>''')}</div>"""
    content = head("Mon profil", "Ces informations pré-remplissent tes candidatures et tes réservations.", f'<a class="btn btn-ghost">{icon("eye", 16, "#1336e0")} Voir comme une école</a><a class="btn btn-primary">{icon("download", 16, "#fff")} Exporter mon CV Navigoal</a>') + f'<div class="row g24 start">{left}{right}</div>'
    save("21-etudiant-profil", page("Navigoal — Mon profil", space("etudiant", "Mon profil", content)))


def cand_row(c, selected=False):
    num, eid, fid, s, n, nxt, date, fee = c
    E, F = ETABS[eid], FORMATIONS[fid]
    act = {"Acceptée": ("btn-primary", "Confirmer mon inscription"), "Pièce demandée": ("btn-sun", "Déposer la pièce"), "Brouillon": ("btn-ghost", "Reprendre"), "En traitement": ("btn-ghost", "Voir le dossier"), "Paiement confirmé": ("btn-ghost", "Voir le dossier")}[s]
    warn = {"Pièce demandée": ROSE, "Brouillon": MUTED, "Acceptée": GREEN}.get(s, "#a55a00")
    return f'''<div class="card row g20" style="padding:18px 20px;border-radius:20px;{"border:2px solid " + BLUE + ";box-shadow:0 24px 50px -24px rgba(26,71,245,.5)" if selected else ""}">{logo(eid, 58)}
<div class="col g8 f1" style="min-width:0"><div class="row g10"><b style="font-size:16px">{F["intitule"]}</b>{st(s)}</div>
<div class="row g12 muted s13"><span class="b soft">{E["sigle"]}</span>·<span class="row g4">{icon("map-pin", 13, MUTED)}{E["ville"].split(" /")[0].split(" (")[0]}, {NOMS[E["pays"]]}</span>·<span>#{num}</span>·<span>{date}</span></div>
<div class="row g4" style="width:420px">{mini_steps(n)}</div>
<div class="row g8 s13" style="color:{warn};font-weight:700">{icon("circle-alert" if s in ("Pièce demandée", "Brouillon") else "info", 15, warn)}{nxt}</div></div>
<div class="col g8" style="align-items:flex-end;width:210px"><span class="muted s12">Frais de dossier</span><b class="s14">{fee} {"<span class='chip chip-green' style='padding:2px 8px'>payé</span>" if s not in ("Brouillon",) else "<span class='chip chip-gray' style='padding:2px 8px'>à payer</span>"}</b><a class="btn {act[0]}" style="padding:10px 14px;font-size:13px">{act[1]}</a></div></div>'''


def s22_candidatures():
    counts = [("Toutes", 5), ("En cours", 3), ("Action requise", 2), ("Acceptées", 1), ("Brouillons", 1)]
    pills = "".join(f'<span class="chip {"chip-blue" if k == 0 else ""}" style="padding:9px 14px;font-size:13px;{"" if k == 0 else "background:#fff;border:1px solid #e6eaf5;color:#3b4566"}">{t} <b style="opacity:.6">{n}</b></span>' for k, (t, n) in enumerate(counts))
    filters = f'''<div class="row g10">{"".join(f'<div class="inp" style="min-height:40px;padding:8px 12px;font-size:13px">{a}{icon("chevron-down", 14, MUTED)}</div>' for a in ["Pays : tous", "Statut : tous", "Rentrée 2027", "Trier : plus récentes"])}</div>'''
    rows = "".join(cand_row(c, k == 0) for k, c in enumerate(CANDS))
    side = f"""<div class="col g20" style="width:330px">
{card(f'''{ctitle("Échéances", "", "calendar-clock", ROSE, "#ffecef")}{"".join(f'<div class="row g12"><div class="col" style="width:50px;align-items:center;padding:6px;border-radius:12px;background:{bg}"><b style="font-size:18px">{d}</b><span style="font-size:10px;font-weight:800">{m}</span></div><div class="col"><b class="s13">{t}</b><span class="muted s12">{s}</span></div></div>' for d, m, t, s, bg in [("22", "MARS", "Entretien UIR (visio)", "10:00 · lien dans tes messages", "#eef4ff"), ("30", "MARS", "Pièce ESMT", "Relevé de notes de 1re", "#ffecef"), ("15", "AVR", "Confirmer ESA", "Frais de réservation 5 000 MAD", "#e8f8ef"), ("30", "AVR", "Clôture EMSI", "Ton brouillon expire", "#fff3c4")])}''')}
{card(f'''{ctitle("Légende des statuts", "", "info", "#3b4566", "#f1f3f8")}<div class="row g6 wr">{"".join(st(s) for s in STEPS7 + ["Pièce demandée", "Liste d'attente", "Refusée"])}</div>''')}
{card(f'''<div class="row g10">{ibox("users-round", SUN, INK, 38, 18)}<b>Ton père suit tes dossiers</b></div><span class="muted s13">Jean-Paul Mba voit les statuts et peut payer les frais. Il a été notifié de ton admission à l'ESA.</span>''', extra="background:linear-gradient(160deg,#fff7dd,#fff)")}</div>"""
    content = head("Mes candidatures", "5 candidatures · rentrée septembre 2027", f'<a class="btn btn-ghost">{icon("download", 16, "#1336e0")} Exporter</a><a class="btn btn-primary">{icon("plus", 16, "#fff")} Nouvelle candidature</a>') + f'''
<div class="row g24 start"><div class="col g16 f1"><div class="row between">{"<div class='row g8'>" + pills + "</div>"}</div>{filters}<div class="col g12" style="position:relative">{rows}{ann("Liste : réordonnancement animé au filtrage · statut qui change = pulse", "right:240px;top:-12px")}</div></div>{side}</div>'''
    save("22-etudiant-candidatures", page("Navigoal — Mes candidatures", space("etudiant", "Mes candidatures", content)))


def s23_candidature_detail():
    num, eid, fid = "2026-00125", "ma-esa-casa", "frm-bachelor-business"
    E, F = ETABS[eid], FORMATIONS[fid]
    tl = [("Brouillon", "Créée le 20/02/2027", "Dossier pré-rempli depuis ton profil", True), ("Soumise", "28/02/2027 · 18:04", "Bordereau n° 2026-00125 généré", True),
          ("Paiement confirmé", "28/02/2027 · 18:06", "1 500 MAD (90 270 F CFA) · Airtel Money · payé par Jean-Paul Mba", True),
          ("En vérification", "01/03/2027", "Vérification des pièces par Navigoal", True), ("Complet", "03/03/2027", "Dossier transmis à l'ESA Casablanca", True),
          ("En traitement", "05/03/2027", "Étude du dossier + entretien de motivation (visio, 12/03)", True), ("Acceptée", "18/03/2027 · 11:20", "Admission conditionnelle à l'obtention du bac", True)]
    tline = ""
    for k, (t, d, s, done) in enumerate(tl):
        last = k == len(tl) - 1
        tline += f'''<div class="row g14 start" style="gap:14px"><div class="col" style="align-items:center"><div class="ic" style="width:30px;height:30px;border-radius:50%;background:{GREEN if last else BLUE}">{icon("party-popper" if False else "check", 15, "#fff", 3)}</div>{"" if last else '<div style="width:2px;height:34px;background:#bcd2ff"></div>'}</div>
<div class="col g2 f1" style="padding-top:4px"><div class="row between"><b class="s14">{t}</b><span class="muted s12">{d}</span></div><span class="muted s12">{s}</span></div></div>'''
    pieces = "".join(doc_row(n, m, s_, c_, i_, False) for n, m, s_, c_, i_ in [
        ("Passeport", "PDF · 1,2 Mo · valide jusqu'au 2031", "Validé", "chip-green", "id-card"), ("Relevés de notes 1re & Terminale", "PDF · 2 fichiers", "Validé", "chip-green", "file-text"),
        ("Lettre de motivation", "Rédigée sur Navigoal · 412 mots", "Validé", "chip-green", "pen-line"), ("Attestation de prise en charge", "Signée par Jean-Paul Mba", "Validé", "chip-green", "file-check-2"),
        ("Attestation de réussite au bac", "Demandée le 18/03/2027", "Manquante", "chip-rose", "file-warning")])
    msgs = [("ESA", "Admissions ESA", "Félicitations Amina ! Votre admission en Bachelor est confirmée sous réserve de l'obtention du bac. Merci de déposer l'attestation dès réception.", "18/03 · 11:24", False),
            ("AM", "Moi", "Merci beaucoup ! Les résultats du bac au Gabon sont publiés mi-juillet, est-ce que ça convient ?", "18/03 · 12:02", True),
            ("ESA", "Admissions ESA", "Oui, vous avez jusqu'au 31/07. Votre place est réservée dès le paiement des frais de réservation.", "18/03 · 14:10", False)]
    th = "".join(f'''<div class="row g10 start" style="{"flex-direction:row-reverse" if me else ""}">{avatar(a, 34) if me else logo("ma-esa-casa", 34)}<div class="col g4" style="max-width:78%;{"align-items:flex-end" if me else ""}"><span class="muted s12 b">{n} · {d}</span><div style="padding:11px 14px;border-radius:{"16px 4px 16px 16px" if me else "4px 16px 16px 16px"};background:{BLUE if me else "#f1f4fb"};color:{"#fff" if me else INK};font-size:13px;line-height:1.5">{t}</div></div></div>''' for a, n, t, d, me in msgs)
    logs = [("Studio meublé · Maârif", "12 min à pied · 3 200 MAD", "visite", 0), ("Colocation 3 ch. · Gauthier", "8 min · 2 100 MAD / ch.", "partenaire", 1), ("Résidence Les Orangers · Bourgogne", "18 min · 3 800 MAD", "identite", 2)]
    lg = "".join(f'<div class="row g10 box" style="padding:8px">{house_ph(k, 56, "building", 10, "width:70px;flex-shrink:0")}<div class="col g2 f1"><b class="s13">{t}</b><span class="muted s12">{s}</span>{chip(VERIF[v][1], VERIF[v][0])}</div></div>' for t, s, v, k in logs)
    banner = f'''<div class="row g16" style="padding:16px 20px;border-radius:18px;background:#fff5f7;border:1.5px solid #ffc2cf;position:relative">{ibox("file-warning", "#ffecef", ROSE, 44, 22, 14)}<div class="col f1"><b>Pièce demandée par l'ESA : attestation de réussite au bac</b><span class="soft s13">À déposer avant le <b>31/07/2027</b> pour finaliser ton inscription. Tu peux aussi la transmettre plus tard depuis Mes documents.</span></div><a class="btn btn-ghost" style="padding:10px 14px">Plus tard</a><a class="btn" style="background:{ROSE};color:#fff;padding:11px 16px">{icon("upload", 16, "#fff")} Déposer la pièce</a>{ann("Bannière : glisse depuis le haut + vibration de l'icône", "right:20px;top:-12px")}</div>'''
    main = f'''<div class="col g20 f1">{banner}
<div class="row g20 start"><div class="f1 col g20">{card(ctitle("Suivi du dossier", chip("7 / 7 étapes", "chip-green"), "list-checks") + tline + ann("Timeline : chaque étape se coche en cascade", "right:18px;top:-12px"), extra="position:relative")}</div>
<div class="f1 col g20">{card(ctitle("Pièces jointes", link("Gérer"), "paperclip", VIOLET, "#f1edff") + pieces)}
{card(ctitle("Messages avec l'école", chip("3", "chip-blue"), "message-circle") + th + f'<div class="row g10 inp" style="padding:8px 8px 8px 14px">{icon("paperclip", 18, MUTED)}<span class="ph f1">Écrire à l\'ESA…</span><div class="ic" style="width:36px;height:36px;background:{BLUE};border-radius:10px">{icon("send-horizontal", 16, "#fff")}</div></div>')}</div></div></div>'''
    side = f'''<div class="col g20" style="width:340px">
{card(f"""<div class="row g12">{logo(eid, 52)}<div class="col"><b>{E["sigle"]} Casablanca</b><span class="muted s12">{STATUT[E["statut"]]} · IGENSIA Education</span></div></div>{photo_box(eid, 0, 120, 14)}
<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Formation", "Bachelor business"), ("Diplôme", f'{F["diplome"]} · {F["duree_annees"]} ans'), ("Rentrée", "Septembre 2027"), ("Mode d'admission", "Dossier + entretien"), ("Frais de dossier", "1 500 MAD · payé")])}</div>""")}
{card(f'''<div class="row g10">{ibox("badge-check", "#e8f8ef", GREEN, 40, 20)}<div class="col"><b>Tu es admise ! 🎉</b><span class="muted s12">Décision du 18/03/2027</span></div></div><a class="btn btn-primary">Confirmer mon inscription</a><span class="muted s12" style="text-align:center">Frais de réservation : 5 000 MAD · avant le 15/04/2027</span><div class="row g8"><a class="btn btn-ghost f1" style="padding:10px;font-size:13px">{icon("file-down", 15, "#1336e0")} Lettre d'admission</a><a class="btn btn-ghost f1" style="padding:10px;font-size:13px">{icon("receipt", 15, "#1336e0")} Bordereau PDF</a></div>''', extra="border:2px solid #bfe9cf")}
{card(f'''<div class="row g10">{ibox("key-round", SUN, INK, 38, 18)}<div class="col"><b>Logements Navilease proches</b><span class="muted s12">24 logements à moins de 20 min de l'ESA</span></div></div>{lg}<a class="btn btn-primary" style="padding:11px">Voir tous les logements</a>''', extra="background:linear-gradient(160deg,#fff,#fff7dd)")}</div>'''
    content = f'''<div class="col g16">{crumbs("Mes candidatures", f"#{num}")}
<div class="row between"><div class="row g16">{logo(eid, 64)}<div class="col g6"><div class="row g12"><h2 style="font-size:24px;white-space:nowrap">{F["intitule"]}</h2>{st("Acceptée")}</div><span class="muted">{E["nom"]} · Casablanca, Maroc · candidature #{num}</span></div></div>
<div class="row g10"><a class="btn btn-ghost">{icon("printer", 16, "#1336e0")} Imprimer</a><a class="btn btn-ghost">{icon("share-2", 16, "#1336e0")} Partager avec mon parent</a></div></div>
<div class="row g24 start" style="margin-top:6px">{main}{side}</div></div>'''
    save("23-candidature-detail", page("Navigoal — Candidature #2026-00125", space("etudiant", "Mes candidatures", content)))


def s24_assistant():
    eid, fid = "ma-uir", "frm-ingenieur-informatique"
    E, F = ETABS[eid], FORMATIONS[fid]
    def step_card(n, title, state, inner):
        col = {"done": GREEN, "cur": BLUE, "next": "#9aa3c0"}[state]
        lab = {"done": chip("✓ Terminé", "chip-green"), "cur": chip("En cours", "chip-blue"), "next": chip("À venir", "chip-gray")}[state]
        bd = f"border:2.5px solid {BLUE};box-shadow:0 30px 60px -28px rgba(26,71,245,.55)" if state == "cur" else ""
        return f'<div class="card col g16" style="padding:24px;border-radius:24px;{bd};position:relative"><div class="row between"><div class="row g10"><div class="ic" style="width:32px;height:32px;border-radius:50%;background:{col};color:#fff;font-weight:800;font-size:14px">{n}</div><h3 style="font-size:18px">{title}</h3></div>{lab}</div>{inner}</div>'
    c1 = step_card(1, "Vérifier les conditions", "done", f'''<div class="col g10">{"".join(f'<div class="row g12 box" style="padding:10px 12px">{icon("circle-check", 20, GREEN)}<div class="col f1"><b class="s13">{a}</b><span class="muted s12">{b}</span></div></div>' for a, b in [("Série acceptée", "Bac C · séries admises : C, D, E, F2, F3 (Gabon) · SM, PC (Maroc)"), ("Moyenne minimale", "Ta moyenne : 14,2/20 · exigée : 12/20 en maths et physique"), ("Âge et nationalité", "Étudiants internationaux acceptés · dispense de visa pour les Gabonais"), ("Date limite", "Candidatures ouvertes jusqu'au 30/04/2027")])}
<div class="row g8 s13" style="padding:10px 12px;border-radius:12px;background:#fff3c4;color:#a55a00;font-weight:600">{icon("info", 16, "#a55a00")}Admission sur concours : épreuve écrite + entretien (en ligne pour l'étranger)</div></div>''')
    c2 = step_card(2, "Ton dossier", "done", f'''<div class="row g16 start">{select("Formation", "Cycle ingénieur · informatique", flex=1.3)}{select("Campus", "Rabat-Shore (Salé)")}</div>
<div class="col g6"><div class="row between"><span class="lbl">Lettre de motivation</span><span class="muted s12">412 / 600 mots</span></div><div style="padding:14px;border:1.5px solid #e1e6f3;border-radius:12px;font-size:13px;line-height:1.6;color:#3b4566;height:118px;overflow:hidden">Passionnée par les mathématiques et l'informatique depuis le collège, j'ai découvert la programmation en Python grâce au club numérique du Lycée Léon Mba. Intégrer le cycle ingénieur de l'UIR me permettrait d'allier rigueur scientifique et ouverture internationale, afin de contribuer demain à la transformation numérique du Gabon…</div></div>
<div class="row g8">{chip("✓ Enregistré automatiquement", "chip-green")}{chip("Aide à la rédaction", "chip-violet")}</div>''')
    reuse = "".join(f'<div class="row g12 box" style="padding:10px 12px">{icon("file-text", 18, BLUE)}<div class="col f1"><b class="s13">{a}</b><span class="muted s12">{b}</span></div>{chip(c, k)}</div>' for a, b, c, k in [("Passeport", "Depuis Mes documents · validé", "Réutilisé", "chip-green"), ("Relevés de notes 1re & Tle", "Depuis Mes documents · validé", "Réutilisé", "chip-green"), ("Photo d'identité", "photo-amina.jpg · 420 Ko", "Envoi 68 %", "chip-blue"), ("Certificat de scolarité 2026-2027", "Requis par l'UIR", "À ajouter", "chip-rose")])
    c3 = step_card(3, "Pièces justificatives", "cur", f'''<div class="row g8 s13" style="padding:10px 12px;border-radius:12px;background:#eef4ff;color:#1336e0;font-weight:700">{icon("sparkles", 16, BLUE)}3 pièces sur 4 reprises de tes candidatures précédentes</div>{reuse}
<div class="bar"><div style="width:68%"></div></div>{upload_zone("Glisse ton certificat de scolarité ici", "PDF ou photo nette · 10 Mo max.", 120)}
<div class="row between"><a class="btn btn-ghost">{icon("arrow-left", 16, "#1336e0")} Étape précédente</a><a class="btn btn-primary">Continuer {icon("arrow-right", 16, "#fff")}</a></div>{ann("Glisser-déposer : zone qui s'illumine + barre de progression", "right:20px;top:-12px")}''')
    fee = 1200
    c4 = step_card(4, "Récapitulatif & frais de dossier", "next", f'''<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Établissement", "Université Internationale de Rabat"), ("Formation", "Cycle ingénieur informatique"), ("Pièces", "4 / 4"), ("Rentrée", "Septembre 2027")])}</div><div class="sep"></div>
<div class="col g8 s13"><div class="row between"><span class="muted">Frais de dossier (UIR)</span><b>{fmt(fee)} MAD</b></div><div class="row between"><span class="muted">Frais de service Navigoal</span><b>0 F CFA</b></div><div class="row between" style="padding:12px 14px;border-radius:12px;background:#0b1a4f;color:#fff"><span class="b">Total à payer</span><b style="font-size:18px">{fmt(round(mad_xaf(fee), -1))} F CFA</b></div><span class="muted s12">soit {fmt(fee)} MAD · taux indicatif 1 € = 10,9 MAD</span></div>
<span class="lbl">Payer avec</span><div class="row g8">{"".join(f'<div class="col g4 f1 box" style="align-items:center;padding:10px;{"border:2px solid " + BLUE if k == 0 else ""}">{icon(i, 20, c)}<span class="s12 b">{t}</span></div>' for k, (i, c, t) in enumerate([("smartphone", "#e11d48", "Airtel Money"), ("smartphone", BLUE, "Moov Money"), ("credit-card", INK, "Carte"), ("users-round", "#a55a00", "Mon parent")]))}</div>
<label class="row g8">{cbox("Je certifie l'exactitude des informations et j'accepte la transmission de mon dossier à l'UIR.", False, size=13)}</label>
<a class="btn btn-primary" style="opacity:.5">Soumettre et payer</a>''')
    content = f'''<div class="col g20">{crumbs("Mes candidatures", "Nouvelle candidature")}
<div class="row between"><div class="row g16">{logo(eid, 60)}<div class="col g4"><h2 style="font-size:28px">Candidater : {F["intitule"]}</h2><span class="muted">{E["nom"]} · Rabat (Salé), Maroc · {STATUT[E["statut"]]}</span></div></div><a class="btn btn-ghost">{icon("bookmark", 16, "#1336e0")} Enregistrer le brouillon</a></div>
<div class="card" style="padding:18px 26px;border-radius:20px">{stepper(["Conditions", "Dossier", "Pièces", "Récapitulatif & paiement"], 2)}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">{c1}{c2}{c3}{c4}</div></div>'''
    save("24-nouvelle-candidature", page("Navigoal — Nouvelle candidature", space("etudiant", "Mes candidatures", content)))


def pay_method(name, sub, color, on=False, logo_txt=None, ic="smartphone"):
    lg = f'<div class="ic" style="width:44px;height:44px;border-radius:12px;background:{color};color:#fff;font-weight:800;font-size:13px">{logo_txt or icon(ic, 20, "#fff")}</div>'
    return f'''<div class="row g12" style="padding:14px;border-radius:16px;background:#fff;border:{"2.5px solid " + BLUE if on else "1.5px solid #e6eaf5"};{"box-shadow:0 16px 30px -18px rgba(26,71,245,.6)" if on else ""}">{lg}<div class="col f1"><b class="s14">{name}</b><span class="muted s12">{sub}</span></div>
<div style="width:20px;height:20px;border-radius:50%;border:{"6px solid " + BLUE if on else "1.5px solid #cdd5ea"}"></div></div>'''


def s25_paiement():
    fee = 1500
    xaf = round(mad_xaf(fee), -1)
    top = f'<div class="row between" style="padding:20px 48px;background:#fff;border-bottom:1px solid #e6eaf5">{brand()}<div class="row g8 s13 b" style="color:{GREEN}">{icon("lock", 16, GREEN)} Paiement sécurisé · chiffrement TLS · PCI-DSS</div><a class="s13 b muted">Annuler et revenir</a></div>'
    methods_ga = "".join([pay_method("Airtel Money", "Paiement par USSD · confirmation sur ton téléphone", "#e11d48", True, "AM"), pay_method("Moov Money (Flooz)", "Gabon · confirmation par code", "#0057b8", False, "MM"),
                          pay_method("Carte bancaire", "Visa · Mastercard · 3-D Secure", INK, False, None, "credit-card"), pay_method("Virement bancaire", "RIB Navigoal · 2 à 3 jours ouvrés", "#3b4566", False, None, "landmark")])
    other = "".join(f'<div class="col g8 f1"><span class="muted s12 b">{p}</span><div class="row g6 wr">{"".join(chip(m, "chip-gray") for m in ms)}</div></div>' for p, ms in [("🇸🇳 SÉNÉGAL", ["Wave", "Orange Money", "Free Money", "Carte"]), ("🇲🇦 MAROC", ["Carte CMI", "Orange Money", "inwi money", "Cash Plus"])])
    checkout = f'''<div class="col g20" style="width:820px">
<div class="col g6"><span class="chip chip-blue" style="align-self:flex-start">Candidature #2026-00125 · ESA Casablanca</span><h2 style="font-size:32px">Payer les frais de dossier</h2><span class="muted">Moyens de paiement proposés selon ton pays de résidence : <b>Gabon</b> · <a style="color:{BLUE};font-weight:700">changer</a></span></div>
<div class="row g20 start"><div class="col g12 f1" style="position:relative">{methods_ga}
<div class="col g12" style="padding:18px;border-radius:18px;background:#fff;border:1px solid #e6eaf5">{field("Numéro Airtel Money", "+241 07 41 22 48", "smartphone", state="focus", help_="Tu recevras une demande de confirmation (code PIN) sur ce numéro.")}</div>
<div class="card col g10" style="padding:16px;border-radius:18px;box-shadow:none"><span class="muted s12 b">AUTRES PAYS</span><div class="row g16 start">{other}</div></div>
{ann("Moyens filtrés selon le pays · sélection : ressort + halo", "right:10px;top:-12px")}</div>
<div class="col g16" style="width:330px">
<div class="card col g12" style="padding:22px;border-radius:22px"><b>Récapitulatif</b><div class="row g10">{logo("ma-esa-casa", 44)}<div class="col"><b class="s13">Bachelor business</b><span class="muted s12">ESA Casablanca · rentrée 2027</span></div></div><div class="sep"></div>
{"".join(f'<div class="row between s13"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Frais de dossier", f"{fmt(fee)} MAD"), ("Conversion (1 € = 10,9 MAD)", f"{fmt(xaf)} F CFA"), ("Frais opérateur", "0 F CFA"), ("Frais de service Navigoal", "0 F CFA")])}
<div class="row between" style="padding:14px;border-radius:14px;background:linear-gradient(90deg,#0b1a4f,#1336e0);color:#fff"><b>Total</b><b style="font-size:20px">{fmt(xaf)} F CFA</b></div>
<a class="btn btn-primary" style="padding:15px">{icon("lock", 16, "#fff")} Payer {fmt(xaf)} F CFA</a><span class="muted s12" style="text-align:center">Non remboursable sauf annulation par l'établissement.</span></div>
<div class="card col g10" style="padding:18px;border-radius:20px;background:linear-gradient(160deg,#fff7dd,#fff);border:1.5px solid #ffe08a"><div class="row between"><div class="row g8">{icon("users-round", 18, "#a55a00")}<b class="s14">Payer pour mon enfant</b></div>{toggle(True, "#c27803")}</div><span class="muted s12">Vue parent : Jean-Paul Mba paie pour <b>Amina Mba</b> (fille). Le reçu est envoyé aux deux comptes.</span>
<div class="row g8 box" style="padding:8px 10px">{avatar("AM", 30)}<div class="col f1"><b class="s12">Amina Mba</b><span class="muted" style="font-size:11px">Candidature #2026-00125</span></div>{icon("chevron-down", 14, MUTED)}</div></div></div></div></div>'''
    success = f'''<div class="col g16" style="width:420px"><span class="muted s12 b">ÉCRAN SUIVANT · PAIEMENT RÉUSSI</span>
<div class="card col g16" style="padding:30px;border-radius:28px;align-items:center;text-align:center;position:relative;box-shadow:0 40px 80px -30px rgba(15,138,70,.45)">
<div class="ic" style="width:86px;height:86px;border-radius:50%;background:#e8f8ef;box-shadow:0 0 0 12px #f3fbf6">{icon("circle-check", 46, GREEN, 2.2)}</div>
<div class="col g6"><h2 style="font-size:26px">Paiement réussi !</h2><span class="soft s14">Ta candidature passe au statut <b>Paiement confirmé</b> et part en vérification.</span></div>
<div class="col g10" style="width:100%;padding:18px;border-radius:18px;background:#f6f8fe;text-align:left;position:relative">
<div class="row between"><span class="muted s12 b">REÇU N° NG-PAY-2027-004812</span>{icon("qr-code", 26, INK, 1.5)}</div>
{"".join(f'<div class="row between s13"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Montant", f"{fmt(xaf)} F CFA"), ("Équivalent", f"{fmt(fee)} MAD"), ("Moyen", "Airtel Money · •• 48"), ("Réf. opérateur", "AM-7731-0928-41"), ("Date", "28/02/2027 · 18:06"), ("Payé par", "Jean-Paul Mba (parent)"), ("Bénéficiaire", "ESA Casablanca via Navigoal")])}
<div style="position:absolute;left:-10px;top:52px;width:20px;height:20px;border-radius:50%;background:#fff"></div><div style="position:absolute;right:-10px;top:52px;width:20px;height:20px;border-radius:50%;background:#fff"></div></div>
<a class="btn btn-primary" style="width:100%">{icon("file-down", 16, "#fff")} Télécharger le reçu PDF</a><a class="btn btn-ghost" style="width:100%">Voir ma candidature</a>
<div class="row g8 muted s12">{icon("mail-check", 14, GREEN)} Reçu envoyé par e-mail et SMS · copie au parent</div>
{ann("Coche dessinée + confettis légers (1 s)", "left:30px;top:-12px")}</div></div>'''
    body = f'{top}<div style="background:#f6f8fe;padding:36px 48px 56px"><div class="row g40 start">{checkout}<div style="width:1px;align-self:stretch;background:#e1e6f3"></div>{success}</div></div>'
    save("25-paiement", page("Navigoal — Paiement", body))


def s26_documents():
    docs = [("Passeport", "id-card", "Validé", "chip-green", "Expire le 03/2031 · utilisé dans 4 candidatures", True), ("Acte de naissance", "file-text", "Validé", "chip-green", "Copie certifiée · 2 candidatures", True),
            ("Relevés de notes de 1re", "file-text", "Validé", "chip-green", "Bulletins T1-T3 · 5 candidatures", True), ("Relevés de notes de Terminale", "file-text", "Déposé", "chip-blue", "T1 · vérification en cours", True),
            ("Attestation de réussite au bac", "award", "Manquant", "chip-rose", "Demandé par ESA Casablanca · avant le 31/07", False), ("Photo d'identité", "camera", "Validé", "chip-green", "Fond clair · 35×45 mm", True),
            ("CV", "file-pen-line", "Validé", "chip-green", "Généré par Navigoal · 1 page", True), ("Certificat de scolarité 2026-2027", "school", "Déposé", "chip-blue", "Vérification en cours", True),
            ("Attestation de prise en charge", "hand-coins", "Validé", "chip-green", "Signée par le parent · valable 1 an", True), ("Certificat médical", "heart-pulse", "Facultatif", "chip-gray", "Exigé par certaines résidences", False)]
    cards = "".join(f'''<div class="card col g12" style="padding:18px;border-radius:20px;{"border:1.5px dashed #ffc2cf;background:#fffafb" if s == "Manquant" else ""}"><div class="row between">{ibox(i, "#ffecef" if s == "Manquant" else "#eef4ff", ROSE if s == "Manquant" else BLUE, 42, 20)}<span class="chip {c}">{s}</span></div>
<div class="col g4"><b class="s14">{t}</b><span class="muted s12">{m}</span></div>
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:10px">{chip("♻ Réutilisable", "chip-teal") if reu and s != "Facultatif" else "<span class='muted s12'>—</span>"}<div class="row g6">{(ibox("eye", "#f6f8fe", "#3b4566", 30, 15, 9) + ibox("ellipsis", "#f6f8fe", "#3b4566", 30, 15, 9)) if s not in ("Manquant", "Facultatif") else f'<a class="btn btn-ghost" style="padding:6px 10px;font-size:12px">{icon("upload", 13, "#1336e0")} Déposer</a>'}</div></div></div>''' for t, i, s, c, m, reu in docs)
    content = head("Mes documents", "Ton coffre-fort : dépose une fois, réutilise dans toutes tes candidatures et réservations.", f'<a class="btn btn-ghost">{icon("share-2", 16, "#1336e0")} Partager un lien sécurisé</a><a class="btn btn-primary">{icon("upload", 16, "#fff")} Ajouter un document</a>') + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("DOCUMENTS", "10", "dont 1 facultatif", "folder-lock")}{kpi("VALIDÉS", "6", "par Navigoal ou une école", "badge-check", "#e8f8ef", GREEN)}{kpi("EN VÉRIFICATION", "2", "délai moyen 24 h", "hourglass", "#fff3c4", "#a55a00")}{kpi("MANQUANTS", "1", "attestation du bac", "file-warning", "#ffecef", ROSE)}</div>
<div class="row g24 start"><div class="col g16 f1">{tabs(["Tous (10)", "Identité", "Scolarité", "Financier", "Logement"], 0)}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;position:relative">{cards}</div></div>
<div class="col g20" style="width:330px">{card(upload_zone("Glisse tes fichiers ici", "PDF, JPG, PNG · 10 Mo", 170) + '<div class="col g8">' + "".join(f'<div class="row g10 box" style="padding:9px 12px">{icon("file-text", 16, BLUE)}<div class="col f1 g4"><b class="s12">{n}</b><div class="bar" style="height:5px"><div style="width:{p}%"></div></div></div><span class="muted s12">{p}%</span></div>' for n, p in [("releve-tle-T2.pdf", 72), ("certificat-scolarite.jpg", 100)]) + "</div>" + ann("Upload : progression par fichier · aperçu miniature", "right:10px;top:-12px"), extra="position:relative")}
{card(f'''{ctitle("Stockage", "", "database", "#3b4566", "#f1f3f8")}<div class="bar"><div style="width:23%"></div></div><span class="muted s12">23 Mo utilisés sur 100 Mo</span>''')}
{card(f'''{ctitle("Sécurité", "", "shield-check", GREEN, "#e8f8ef")}{"".join(f'<div class="row g8 s13">{icon("check", 14, GREEN, 3)}<span class="soft">{t}</span></div>' for t in ["Fichiers chiffrés (AES-256)", "Visibles seulement par les écoles où tu candidates", "Liens de partage expirant sous 7 jours", "Historique des consultations"])}''')}</div></div>'''
    save("26-etudiant-documents", page("Navigoal — Mes documents", space("etudiant", "Mes documents", content)))


def s27_messagerie():
    convs = [("ma-esa-casa", "Admissions ESA Casablanca", "Candidature #2026-00125", "Oui, vous avez jusqu'au 31/07…", "14:10", 0, None),
             (None, "Karim Benjelloun", "Réservation NL-2026-00342", "Le studio est disponible dès le 1er sept…", "13:45", 2, ("KB", "linear-gradient(135deg,#0f8a46,#34d399)")),
             ("sn-esmt", "Scolarité ESMT", "Candidature #2026-00140", "Merci d'ajouter le relevé de 1re.", "Hier", 1, None),
             ("ma-uir", "Admissions UIR", "Candidature #2026-00131", "Votre entretien est fixé au 22/03.", "Lun.", 0, None),
             (None, "Jean Ndong · Conseiller", "Orientation", "Je te conseille de comparer avec l'EMSI…", "12/03", 0, ("JN", "#e8f8ef")),
             (None, "Support Navigoal", "Paiement NG-PAY-2027-004812", "Votre reçu est disponible.", "28/02", 0, ("NG", "linear-gradient(135deg,#1a47f5,#598bff)"))]
    cl = ""
    for k, (eid, n, ctx, last, t, unread, av) in enumerate(convs):
        a = logo(eid, 44) if eid else avatar(av[0], 44, av[1], "#fff" if "gradient" in av[1] else GREEN)
        on = k == 1
        cl += f'''<div class="row g12 start" style="padding:12px;border-radius:14px;{"background:#eef4ff" if on else ""}">{a}<div class="col g2 f1" style="min-width:0"><div class="row between"><b class="s13">{n}</b><span class="muted" style="font-size:11px">{t}</span></div>
<span class="chip {"chip-sun" if "NL-" in ctx else "chip-blue" if "Candidature" in ctx else "chip-gray"}" style="align-self:flex-start;padding:2px 8px;font-size:11px;margin:3px 0">{ctx}</span><div class="row between"><span class="muted s12" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">{last}</span>{f'<span class="chip" style="background:{BLUE};color:#fff;padding:1px 7px;font-size:11px">{unread}</span>' if unread else ""}</div></div></div>'''
    msgs = [("KB", "Karim", "Bonjour Amina, merci pour votre demande. Le studio est disponible dès le 1er septembre, la visite virtuelle est dans l'annonce.", "13:12", False, None),
            ("AM", "Moi", "Bonjour ! Est-ce que l'électricité est incluse dans les charges ? Et y a-t-il un bureau ?", "13:20", True, None),
            ("KB", "Karim", "Oui, eau et électricité incluses (350 MAD de charges). Il y a un bureau et le wifi fibre. Appelez-moi au +212 6•• •• •• •• pour en parler.", "13:41", False, "masked"),
            ("KB", "Karim", "Je vous envoie le règlement intérieur.", "13:45", False, "file")]
    th = ""
    for a, n, t, d, me, extra in msgs:
        bubble = f'<div style="padding:12px 15px;border-radius:{"18px 4px 18px 18px" if me else "4px 18px 18px 18px"};background:{BLUE if me else "#fff"};color:{"#fff" if me else INK};font-size:14px;line-height:1.55;{"" if me else "border:1px solid #e6eaf5"}">{t}</div>'
        if extra == "file":
            bubble = f'<div class="row g10" style="padding:12px 14px;border-radius:4px 18px 18px 18px;background:#fff;border:1px solid #e6eaf5">{ibox("file-text", "#ffecef", ROSE, 38, 18)}<div class="col"><b class="s13">Reglement-interieur-Maarif.pdf</b><span class="muted s12">PDF · 240 Ko</span></div>{icon("download", 18, MUTED)}</div>'
        warn = f'<div class="row g6 s12" style="color:#a55a00;font-weight:700">{icon("shield-alert", 14, "#a55a00")} Numéro masqué automatiquement par Navilease</div>' if extra == "masked" else ""
        th += f'<div class="row g10 start" style="{"flex-direction:row-reverse" if me else ""}">{avatar(a, 36, "linear-gradient(135deg,#ffc21f,#f9a806)" if me else "linear-gradient(135deg,#0f8a46,#34d399)", INK if me else "#fff")}<div class="col g6" style="max-width:70%;{"align-items:flex-end" if me else ""}"><span class="muted s12 b">{n} · {d}</span>{bubble}{warn}</div></div>'
    thread = f'''<div class="card col" style="flex:1;border-radius:22px;overflow:hidden;min-width:0">
<div class="row between" style="padding:16px 20px;border-bottom:1px solid #eef1f8"><div class="row g12">{avatar("KB", 44, "linear-gradient(135deg,#0f8a46,#34d399)", "#fff")}<div class="col"><div class="row g8"><b>Karim Benjelloun</b>{chip("Identité vérifiée", "chip-blue")}</div><span class="muted s12">Bailleur · répond en ~1 h · en ligne</span></div></div><div class="row g8">{ibox("phone", "#f6f8fe", "#c3cbe0", 38, 18)}{ibox("ellipsis-vertical", "#f6f8fe", "#3b4566", 38, 18)}</div></div>
<div class="row g10 s13" style="padding:12px 20px;background:#fff7dd;border-bottom:1px solid #ffe9a8;position:relative">{icon("shield-check", 18, "#a55a00")}<span class="soft"><b>Pour ta sécurité</b>, téléphones et e-mails sont masqués jusqu'à la signature du contrat. Ne paie jamais en dehors de Navilease : ton argent est protégé en séquestre.</span>{ann("Détection auto. des coordonnées (regex) → masquage + avertissement", "right:20px;bottom:-12px")}</div>
<div class="col g16" style="padding:20px;background:#f8f9fd;flex:1"><div class="row g8 center muted s12">{"<div class='sep f1'></div>"}Aujourd'hui{"<div class='sep f1'></div>"}</div>{th}<div class="row g8 muted s12">{avatar("KB", 22, "linear-gradient(135deg,#0f8a46,#34d399)", "#fff")}<i>Karim est en train d'écrire…</i></div></div>
<div class="row g10" style="padding:14px 16px;border-top:1px solid #eef1f8">{ibox("paperclip", "#f6f8fe", "#3b4566", 40, 18)}{ibox("image", "#f6f8fe", "#3b4566", 40, 18)}<div class="inp f1"><span class="ph">Écrire un message…</span></div><div class="ic" style="width:46px;height:46px;background:{BLUE};border-radius:12px">{icon("send-horizontal", 18, "#fff")}</div></div></div>'''
    ctxp = f'''<div class="col g16" style="width:260px;flex-shrink:0">{card(f"""<span class="muted s12 b">CONTEXTE</span>{house_ph(0, 120, "building", 14)}<div class="col g2"><b>Studio meublé · Maârif</b><span class="muted s12">Casablanca · 12 min de l'ESA</span></div>
<div class="row between s13"><span class="muted">Réservation</span><b>NL-2026-00342</b></div><div class="row between s13"><span class="muted">Statut</span>{chip("Demande envoyée", "chip-blue")}</div><div class="row between s13"><span class="muted">Loyer + charges</span><b>3 550 MAD</b></div><a class="btn btn-ghost" style="padding:10px">Voir la réservation</a>""", pad=18)}
{card(f'''<div class="row g8">{icon("flag", 16, ROSE)}<b class="s14">Signaler</b></div><span class="muted s12">Demande de paiement hors plateforme, comportement suspect ? Notre équipe de modération intervient sous 24 h.</span><a class="s13 b" style="color:{ROSE}">Signaler cette conversation</a>''', pad=18)}</div>'''
    content = f'''<div class="row g20 stretch" style="height:880px"><div class="card col g10" style="width:320px;flex-shrink:0;padding:16px;border-radius:22px"><div class="row between"><h3>Messages</h3>{ibox("square-pen", "#eef4ff", BLUE, 36, 17)}</div>{seg(["Tous", "Écoles", "Logement", "Conseiller"], 0, small=True)}<div class="col g4">{cl}</div></div>{thread}{ctxp}</div>'''
    save("27-messagerie", page("Navigoal — Messagerie", space("etudiant", "Messages", content)))


def s28_notifications_conseiller():
    notifs = [("Aujourd'hui", [("badge-check", GREEN, "#e8f8ef", "Tu es admise à l'ESA Casablanca 🎉", "Bachelor business · confirme ton inscription avant le 15/04", "11:20", True),
                               ("message-circle", BLUE, "#eef4ff", "Nouveau message de Karim Benjelloun", "Réservation NL-2026-00342", "13:45", True),
                               ("file-warning", ROSE, "#ffecef", "Pièce demandée par l'ESMT", "Relevé de notes de 1re · avant le 30/03", "09:02", True)]),
              ("Cette semaine", [("calendar-check", VIOLET, "#f1edff", "Entretien UIR confirmé", "22/03/2027 à 10:00 · visio", "Lun.", False),
                                 ("wallet", "#a55a00", "#fff3c4", "Paiement reçu", "35 000 F CFA · BBS · payé par ton père", "Dim.", False),
                                 ("sparkles", BLUE, "#eef4ff", "3 nouvelles formations pour ton profil", "Data science, cybersécurité, génie logiciel", "Sam.", False),
                                 ("megaphone", TEAL, "#e6f6fb", "Concours commun EMSI : inscriptions ouvertes", "Jusqu'au 30/04/2027", "Ven.", False)])]
    nl = ""
    for grp, items in notifs:
        nl += f'<span class="muted s12 b" style="margin-top:6px">{grp.upper()}</span>'
        for i, c, bg, t, s, d, new in items:
            nl += f'<div class="row g12 start" style="padding:12px;border-radius:14px;{"background:#f5f8ff" if new else ""}">{ibox(i, bg, c, 40, 19)}<div class="col g2 f1"><b class="s13">{t}</b><span class="muted s12">{s}</span></div><div class="col g6" style="align-items:flex-end"><span class="muted" style="font-size:11px">{d}</span>{f"<div style=width:8px;height:8px;border-radius:50%;background:{BLUE}></div>" if new else ""}</div></div>'
    prefs = "".join(f'<div class="row between s13"><span class="soft">{t}</span><div class="row g10">{"".join(f"<div class=row style=gap:6px>{toggle(on, GREEN)}</div>" for on in v)}</div></div>' for t, v in [("Candidatures", (True, True, True)), ("Messages", (True, False, True)), ("Logement", (True, True, False)), ("Bourses & concours", (False, True, False))])
    left = f'''<div class="col g20" style="width:470px">{card(f"""<div class="row between"><h3>Notifications</h3>{link("Tout lire")}</div>{seg(["Toutes", "Non lues (3)", "Candidatures", "Logement"], 0, small=True)}{nl}""")}
{card(f"""<div class="row between"><h3 style="font-size:16px">Recevoir par</h3><div class="row g10 muted s12 b"><span style="width:40px;text-align:center">App</span><span style="width:40px;text-align:center">SMS</span><span style="width:40px;text-align:center">E-mail</span></div></div>{prefs}<span class="muted s12">WhatsApp disponible pour les rappels d'échéance.</span>""")}</div>'''
    days = [("Lun", "22"), ("Mar", "23"), ("Mer", "24"), ("Jeu", "25"), ("Ven", "26")]
    slots = [["09:00", "10:30", "14:00"], ["11:00", "15:30"], ["09:30", "10:30", "16:00", "17:00"], ["—"], ["10:00", "14:30"]]
    cal = "".join(f'''<div class="col g8 f1"><div class="col" style="align-items:center;padding:8px;border-radius:12px;{"background:" + BLUE + ";color:#fff" if k == 2 else "background:#f6f8fe"}"><span class="s12 b" style="opacity:.8">{d}</span><b style="font-size:18px">{n}</b></div>
{"".join(f'<div class="s13 b" style="text-align:center;padding:9px 0;border-radius:10px;{"background:#eef4ff;color:#1336e0;border:2px solid " + BLUE if (k == 2 and s == "10:30") else "border:1.5px solid #e6eaf5;color:" + ("#c3cbe0" if s == "—" else INK)}">{s}</div>' for s in slots[k])}</div>''' for k, (d, n) in enumerate(days))
    hist = "".join(f'<div class="row g12 box">{ibox(i, "#f1f3f8", "#3b4566", 38, 18)}<div class="col f1"><b class="s13">{t}</b><span class="muted s12">{d}</span></div>{chip(s, c)}</div>' for i, t, d, s, c in [("video", "Choisir entre Maroc et Sénégal", "12/03/2027 · visio · 30 min · compte rendu disponible", "Terminé", "chip-green"), ("phone", "Résultats du test d'orientation", "02/11/2026 · téléphone · 20 min", "Terminé", "chip-green"), ("message-circle", "Préparer l'entretien UIR", "24/03/2027 · WhatsApp", "Annulé", "chip-gray")])
    right = f'''<div class="col g20 f1">{card(f"""<div class="row between"><div class="row g14">{avatar("JN", 60, "#e8f8ef", GREEN)}<div class="col g2"><b style="font-size:18px">Jean Ndong</b><span class="muted s13">Conseiller d'orientation · Libreville · 8 ans d'expérience</span><div class="row g6" style="margin-top:4px">{chip("★ 4,9 · 212 avis", "chip-sun")}{chip("Maroc · Sénégal · Gabon", "chip-blue")}</div></div></div>{chip("Inclus dans ton compte", "chip-green")}</div>
<div class="sep"></div><div class="col g8"><span class="lbl">Sujet du rendez-vous</span><div class="row g8 wr">{"".join(chip(t, "chip-blue" if k == 2 else "chip-gray") for k, t in enumerate(["Choix de série", "Choix de formation", "Préparer un entretien", "Dossier de candidature", "Budget & bourses", "Logement & installation"]))}</div></div>
<div class="col g8"><span class="lbl">Mode</span><div class="row g10">{"".join(f'<div class="row g8 f1 box" style="justify-content:center;padding:12px;{"border:2px solid " + BLUE + ";background:#f5f8ff" if k == 0 else ""}">{icon(i, 18, BLUE if k == 0 else MUTED)}<b class="s13">{t}</b></div>' for k, (i, t) in enumerate([("video", "Visio"), ("phone", "Téléphone"), ("message-circle", "WhatsApp")]))}</div></div>
<div class="col g8" style="position:relative"><div class="row between"><span class="lbl">Créneau · semaine du 22 mars 2027 (heure de Libreville)</span><div class="row g6">{ibox("chevron-left", "#f6f8fe", "#3b4566", 30, 16, 9)}{ibox("chevron-right", "#f6f8fe", "#3b4566", 30, 16, 9)}</div></div><div class="row g10 start">{cal}</div>{ann("Créneau : sélection animée · fuseau horaire détecté", "right:0;top:-12px")}</div>
{field("Ta question (facultatif)", "Je voudrais m'entraîner pour l'entretien de motivation de l'UIR.", "pen-line")}
<div class="row between"><span class="muted s13">Mercredi 24 mars · 10:30 – 11:00 · visio Google Meet</span><a class="btn btn-primary">{icon("calendar-check", 16, "#fff")} Confirmer le rendez-vous</a></div>""", pad=26)}
{card(ctitle("Historique", link("Voir les comptes rendus"), "history", "#3b4566", "#f1f3f8") + hist)}</div>'''
    content = head("Notifications & conseiller", "Reste informée et fais-toi accompagner par un conseiller.", "") + f'<div class="row g24 start">{left}{right}</div>'
    save("28-notifications-conseiller", page("Navigoal — Notifications & conseiller", space("etudiant", "Conseiller", content)))


# =====================================================================================
# 29. ESPACE PARENT · LIER MON ENFANT
# =====================================================================================
def s29_parent_lier():
    code = "".join(f'<div class="ic" style="width:52px;height:60px;border-radius:14px;border:{"2.5px solid #c27803" if k == 6 else "1.5px solid #ffd666"};background:#fffbea;font-size:26px;font-weight:800">{c}</div>' for k, c in enumerate("NVG7K4Q"))
    link_card = f'''<div class="card col g20" style="padding:28px;border-radius:26px;flex:1.15;position:relative">
<div class="row g12">{ibox("link-2", "#fff3c4", "#a55a00", 46, 22, 14)}<div class="col"><h3>Lier un enfant</h3><span class="muted s13">Ton enfant te communique son code depuis son profil (Paramètres → Parent)</span></div></div>
{seg(["Code d'invitation", "Inviter par e-mail / SMS"], 0, "#c27803")}
<div class="col g8"><span class="lbl">Code d'invitation (7 caractères)</span><div class="row g8">{code}</div><span class="help" style="color:{GREEN};font-weight:700">✓ Code valide : Yann Mba · 3e · Collège Bessieux, Libreville</span></div>
<div class="col g12" style="padding:18px;border-radius:18px;background:#f8f9fd;border:1px solid #eef1f8"><div class="row g8">{icon("shield-check", 18, GREEN)}<b class="s14">Consentement parental</b>{chip("obligatoire · mineur de 14 ans", "chip-sun")}</div>
{cbox("Je certifie être le <b>parent ou le tuteur légal</b> de Yann Mba.", True, "#c27803", 13)}
{cbox("J'autorise Navigoal à traiter les données de mon enfant (profil, résultats du test, documents) pour son orientation.", True, "#c27803", 13)}
{cbox("J'accepte que les établissements où il candidate accèdent à son dossier.", True, "#c27803", 13)}
{cbox("Je souhaite valider ses candidatures et ses paiements avant envoi.", False, "#c27803", 13)}
<span class="muted s12">Tu peux retirer ton consentement à tout moment : le compte de l'enfant sera alors limité à la consultation.</span></div>
<div class="row between"><span class="muted s12 row g6">{icon("fingerprint", 14, MUTED)} Signature horodatée · 09/10/2026 · IP enregistrée</span><a class="btn" style="background:#c27803;color:#fff;padding:14px 22px">{icon("link", 16, "#fff")} Lier et donner mon consentement</a></div>
{ann("Saisie : cases qui se remplissent + validation en direct du code", "right:24px;top:-12px")}</div>'''
    def child(init, name, sub, bg, stats, consent, actions, extra=""):
        s = "".join(f'<div class="col g2 f1" style="padding:10px 12px;border-radius:12px;background:#f6f8fe"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><b class="s14">{b}</b></div>' for a, b in stats)
        return f'''<div class="card col g14" style="padding:22px;border-radius:24px;gap:14px"><div class="row g14">{avatar(init, 56, bg, "#fff" if "1a47f5" in bg else INK)}<div class="col g2 f1"><b style="font-size:18px">{name}</b><span class="muted s13">{sub}</span></div>{consent}</div><div class="row g8">{s}</div>{extra}<div class="row g8">{actions}</div></div>'''
    amina_extra = f'''<div class="row g10 box" style="padding:10px 12px">{logo("ma-esa-casa", 38)}<div class="col f1"><b class="s13">Admise : Bachelor business · ESA Casablanca</b><span class="muted s12">Frais de réservation 5 000 MAD à régler avant le 15/04</span></div><a class="btn btn-sun" style="padding:8px 12px;font-size:12px">Payer</a></div>
<div class="row g10 box" style="padding:10px 12px;background:#fffafb;border-color:#ffd5de">{ibox("key-round", "#ffecef", ROSE, 38, 18)}<div class="col f1"><b class="s13">Garant demandé : studio meublé · Maârif</b><span class="muted s12">Réservation NL-2026-00342 · 3 550 MAD / mois</span></div><a class="btn btn-ghost" style="padding:8px 12px;font-size:12px">Examiner</a></div>'''
    yann_extra = f'''<div class="row g10 box" style="padding:10px 12px">{ibox("compass", "#e8f8ef", GREEN, 38, 18)}<div class="col f1"><b class="s13">Test d'orientation collège à faire</b><span class="muted s12">Pour choisir sa série de seconde (BEPC juin 2027)</span></div><a class="btn btn-ghost" style="padding:8px 12px;font-size:12px">Rappeler</a></div>'''
    kids = f'''<div class="col g16" style="flex:1"><div class="row between"><h3>Mes enfants</h3><span class="muted s13">2 comptes liés</span></div>
{child("AM", "Amina Mba", "17 ans · Terminale C · Lycée national Léon Mba", "linear-gradient(135deg,#ffc21f,#f9a806)", [("PROFIL", "80 %"), ("CANDIDATURES", "5"), ("ADMISSIONS", "1"), ("PAYÉ", "1,1 M F")], chip("✓ Consentement le 12/09/2026", "chip-green"), f'<a class="btn btn-primary f1" style="padding:10px;font-size:13px">Voir son espace</a><a class="btn btn-ghost f1" style="padding:10px;font-size:13px">{icon("calculator", 15, "#1336e0")} Devis</a>', amina_extra)}
{child("YM", "Yann Mba", "14 ans · 3e · Collège Bessieux, Libreville", "linear-gradient(135deg,#1a47f5,#598bff)", [("PROFIL", "35 %"), ("TEST", "à faire"), ("SÉRIE VISÉE", "C ou D"), ("BEPC", "juin 2027")], chip("En cours de liaison", "chip-sun"), f'<a class="btn btn-ghost f1" style="padding:10px;font-size:13px">Voir son espace</a>', yann_extra)}</div>'''
    content = head("Lier mon enfant", "Suivez l'orientation, les candidatures et le logement de vos enfants, en toute transparence.", f'<a class="btn btn-ghost">{icon("user-plus", 16, "#1336e0")} Inviter l\'autre parent</a>', "Espace parent") + f'<div class="row g24 start">{link_card}{kids}</div>'
    save("29-parent-lier-enfant", page("Navigoal — Espace parent · Mes enfants", space("parent", "Mes enfants", content)))


# =====================================================================================
# 30–34. ESPACE ÉTABLISSEMENT (ESA Casablanca)
# =====================================================================================
APPLICANTS = [
    ("2026-00125", "Amina Mba", "AM", "🇬🇦", "Gabon", "Bachelor business", "Bac C · 14,2", "En traitement", "28/02/2027", "5/5"),
    ("2026-00119", "Moussa Diallo", "MD", "🇸🇳", "Sénégal", "Bachelor business", "Bac S2 · 13,1", "Complet", "26/02/2027", "5/5"),
    ("2026-00117", "Salma El Idrissi", "SE", "🇲🇦", "Maroc", "Master management", "Licence · 15,4", "Acceptée", "25/02/2027", "6/6"),
    ("2026-00113", "Grâce Ondo Mve", "GO", "🇬🇦", "Gabon", "MBA", "Master · 13,8", "Pièce demandée", "24/02/2027", "4/6"),
    ("2026-00110", "Yassine Benali", "YB", "🇲🇦", "Maroc", "Bachelor business", "Bac SE · 12,6", "En vérification", "24/02/2027", "5/5"),
    ("2026-00108", "Aïssatou Ndiaye", "AN", "🇸🇳", "Sénégal", "Master GRH", "Licence · 14,0", "Liste d'attente", "23/02/2027", "6/6"),
    ("2026-00104", "Kevin Mouélé", "KM", "🇨🇬", "Congo", "Bachelor business", "Bac D · 11,2", "Refusée", "22/02/2027", "5/5"),
    ("2026-00101", "Fatou Sow", "FS", "🇸🇳", "Sénégal", "Master management", "Licence · 13,5", "En traitement", "21/02/2027", "6/6"),
    ("2026-00097", "Omar Tazi", "OT", "🇲🇦", "Maroc", "Bachelor business", "Bac SM · 16,0", "Acceptée", "20/02/2027", "5/5"),
    ("2026-00094", "Christelle Nguema", "CN", "🇬🇦", "Gabon", "Master GRH", "Licence · 12,9", "Paiement confirmé", "19/02/2027", "6/6"),
    ("2026-00090", "Ibrahima Ba", "IB", "🇲🇱", "Mali", "MBA", "Master · 14,6", "Complet", "18/02/2027", "6/6"),
]
AV_BG = ["linear-gradient(135deg,#ffc21f,#f9a806)", "linear-gradient(135deg,#1a47f5,#598bff)", "linear-gradient(135deg,#6a3df0,#a78bfa)", "linear-gradient(135deg,#0f8a46,#34d399)", "linear-gradient(135deg,#d42a50,#fb7185)", "linear-gradient(135deg,#0e7490,#22d3ee)"]


def s30_etab_dashboard():
    weeks = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12"]
    y27 = [8, 12, 15, 19, 22, 24, 28, 31, 30, 36, 41, 46]
    y26 = [6, 9, 11, 12, 15, 17, 18, 22, 21, 24, 26, 29]
    pays = [("🇲🇦 Maroc", 112), ("🇸🇳 Sénégal", 64), ("🇬🇦 Gabon", 48), ("🇨🇮 Côte d'Ivoire", 31), ("🇨🇲 Cameroun", 22), ("🇲🇱 Mali", 18), ("Autres (9 pays)", 17)]
    pcols = [VIOLET, BLUE, GREEN, "#f9a806", TEAL, ROSE, "#9aa3c0"]
    forms = [("Bachelor en management / business administration", 148, 46, "31 %"), ("Master management / Programme grande école", 82, 24, "29 %"), ("MBA / Executive master", 46, 14, "30 %"), ("Master GRH", 36, 10, "28 %")]
    ft = "".join(f'<tr><td><b>{a}</b></td><td style="text-align:right">{b}</td><td style="text-align:right">{c}</td><td style="text-align:right"><span class="chip chip-green" style="padding:3px 8px">{d}</span></td><td style="width:140px"><div class="bar" style="height:6px"><div style="width:{b/148*100:.0f}%;background:{VIOLET}"></div></div></td></tr>' for a, b, c, d in forms)
    funnel = [("Vues de la fiche", 18400, "#efeaff"), ("Ajouts aux favoris", 2100, "#ddd3ff"), ("Brouillons", 640, "#c4b3ff"), ("Candidatures soumises", 312, "#a78bfa"), ("Admis", 94, "#8257f5"), ("Inscriptions confirmées", 67, VIOLET)]
    fn = "".join(f'<div class="row g12"><span class="s12 b" style="width:150px">{a}</span><div style="flex:1;height:30px;border-radius:8px;background:#f6f8fe;position:relative"><div style="width:{max(6, (b/18400)**0.45*100):.0f}%;height:100%;border-radius:8px;background:{c}"></div></div><b class="s13" style="width:60px;text-align:right">{fmt(b)}</b></div>' for a, b, c in funnel)
    acts = [("inbox", BLUE, "Nouvelle candidature de Moussa Diallo", "Bachelor business · il y a 12 min"), ("file-check-2", GREEN, "Grâce Ondo Mve a déposé une pièce", "Relevé de Master 1 · il y a 1 h"), ("wallet", "#a55a00", "Frais de réservation payés", "Omar Tazi · 5 000 MAD · il y a 3 h"), ("message-circle", VIOLET, "3 nouveaux messages", "Candidats Sénégal · aujourd'hui")]
    act = "".join(f'<div class="row g12">{ibox(i, "#f6f8fe", c, 36, 17)}<div class="col f1"><b class="s13">{a}</b><span class="muted s12">{b}</span></div></div>' for i, c, a, b in acts)
    content = head("Tableau de bord", "Campagne d'admission 2027 · session 1 · du 01/12/2026 au 30/04/2027", f'<div class="inp" style="min-height:40px;padding:8px 12px;font-size:13px">{icon("calendar", 15, MUTED)} 12 dernières semaines {icon("chevron-down", 14, MUTED)}</div><a class="btn btn-ghost" style="color:{VIOLET};border-color:#d9ccff">{icon("download", 16, VIOLET)} Rapport PDF</a>') + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("CANDIDATURES REÇUES", "312", "dont 46 cette semaine", "inbox", "#f1edff", VIOLET, "+18 %")}{kpi("DOSSIERS EN ATTENTE", "38", "à traiter · 9 en retard", "hourglass", "#fff3c4", "#a55a00")}{kpi("ADMIS", "94", "67 inscriptions confirmées", "badge-check", "#e8f8ef", GREEN, "+12 %")}{kpi("TAUX D'ADMISSION", "30 %", "objectif 28–32 %", "percent", "#eef4ff", BLUE)}{kpi("DÉLAI DE DÉCISION", "6,4 j", "vs 9,1 j en 2026", "timer", "#e6f6fb", TEAL, "-30 %", True)}</div>
<div class="row g20 stretch" style="margin-bottom:20px"><div class="card col g12" style="flex:1.5;padding:22px;border-radius:22px;position:relative">{ctitle("Candidatures par semaine", f'<span class="row g6 s12 b"><span class="dot" style="width:10px;height:10px;border-radius:3px;background:{VIOLET}"></span>2027</span><span class="row g6 s12 b muted"><span style="width:10px;height:10px;border-radius:3px;background:#ffc21f"></span>2026</span>', "chart-line", VIOLET, "#f1edff")}{line_svg([y27, y26], weeks, 640, 230, (VIOLET, SUN))}{ann("Courbes tracées au chargement · infobulle au survol", "right:20px;top:-12px")}</div>
<div class="card col g12" style="flex:1;padding:22px;border-radius:22px">{ctitle("Par pays d'origine", link("Détail", VIOLET), "globe", VIOLET, "#f1edff")}{"".join(hbar(a, b, 112, c, f"{b} · {round(b/312*100)} %") for (a, b), c in zip(pays, pcols))}</div></div>
<div class="row g20 stretch" style="margin-bottom:20px"><div class="card col g12" style="flex:1.5;padding:22px;border-radius:22px">{ctitle("Formations les plus demandées", link("Gérer les formations", VIOLET), "graduation-cap", VIOLET, "#f1edff")}<table class="tbl"><tr><th>Formation</th><th style="text-align:right">Candidatures</th><th style="text-align:right">Admis</th><th style="text-align:right">Taux</th><th></th></tr>{ft}</table></div>
<div class="card col g12" style="flex:1;padding:22px;border-radius:22px;background:linear-gradient(160deg,#fff,#fff7dd)">{ctitle("Besoins logement des admis", "", "key-round", "#a55a00", "#fff3c4")}
<div class="row g16">{ring(62, 92, "#f9a806", "62 %", 9)}<div class="col g4"><b class="s14">58 admis internationaux sur 94</b><span class="muted s12">cherchent un logement à Casablanca pour septembre 2027</span></div></div>
<div class="row g8">{"".join(f'<div class="col g2 f1 box" style="padding:10px"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><b class="s14">{b}</b></div>' for a, b in [("STUDIO", "41 %"), ("COLOCATION", "37 %"), ("RÉSIDENCE", "22 %")])}</div>
<div class="row between s13"><span class="muted">Budget médian</span><b>3 000 MAD / mois</b></div><div class="row between s13"><span class="muted">Déjà logés via Navilease</span><b style="color:{GREEN}">21 étudiants</b></div>
<a class="btn btn-primary" style="padding:11px">Recommander des logements aux admis</a></div></div>
<div class="row g20 stretch"><div class="card col g12" style="flex:1.5;padding:22px;border-radius:22px">{ctitle("Entonnoir de conversion", chip("Campagne 2027", "chip-violet"), "filter", VIOLET, "#f1edff")}{fn}</div>
<div class="card col g14" style="flex:1;padding:22px;border-radius:22px;gap:14px">{ctitle("Activité récente", link("Tout voir", VIOLET), "activity", VIOLET, "#f1edff")}{act}</div></div>'''
    save("30-etablissement-dashboard", page("Navigoal — Établissement · Tableau de bord", space("etablissement", "Tableau de bord", content)))


def s31_etab_candidatures():
    counts = [("Toutes", 312), ("À traiter", 38), ("Pièce demandée", 7), ("En traitement", 21), ("Acceptées", 94), ("Liste d'attente", 16), ("Refusées", 72)]
    pills = "".join(f'<span class="chip {"chip-violet" if k == 1 else ""}" style="padding:9px 14px;font-size:13px;{"" if k == 1 else "background:#fff;border:1px solid #e6eaf5;color:#3b4566"}">{t} <b style="opacity:.6">{n}</b></span>' for k, (t, n) in enumerate(counts))
    rows = ""
    for k, (num, name, init, fl, pays, form, serie, s, date, pcs) in enumerate(APPLICANTS):
        sel = k in (0, 1)
        cb = f'<div class="cb" style="background:{VIOLET if sel else "#fff"};border:{"none" if sel else "1.5px solid #cdd5ea"}">{icon("check", 12, "#fff", 3) if sel else ""}</div>'
        rows += f'''<tr class="{"sel" if sel else ""}"><td style="width:40px">{cb}</td><td style="white-space:nowrap"><b style="color:{VIOLET}">#{num}</b></td><td><div class="row g10">{avatar(init, 34, AV_BG[k % 6], "#fff" if k % 6 else INK)}<div class="col"><b>{name}</b><span class="muted s12">{fl} {pays}</span></div></div></td>
<td>{form}</td><td class="muted">{serie}</td><td>{st(s)}</td><td><span class="chip {"chip-green" if pcs.split("/")[0] == pcs.split("/")[1] else "chip-rose"}" style="padding:3px 8px">{pcs}</span></td><td class="muted">{date}</td>
<td><div class="row g6">{ibox("eye", "#f6f8fe", "#3b4566", 30, 15, 9)}{ibox("message-circle", "#f6f8fe", "#3b4566", 30, 15, 9)}{ibox("ellipsis", "#f6f8fe", "#3b4566", 30, 15, 9)}</div></td></tr>'''
    bulk = f'''<div class="row between" style="padding:12px 16px;border-radius:14px;background:#0b1533;color:#fff;position:relative"><div class="row g12 s13 b">{icon("check", 16, SUN, 3)} 2 dossiers sélectionnés</div><div class="row g8">{"".join(f'<a class="btn" style="padding:8px 12px;font-size:12px;background:rgba(255,255,255,.1);color:#fff">{icon(i, 14, "#fff")} {t}</a>' for i, t in [("user-check", "Assigner"), ("message-circle", "Message groupé"), ("calendar", "Planifier un entretien"), ("tag" if False else "flag", "Changer le statut")])}</div>{ann("Barre d'actions groupées : apparaît en glissant depuis le bas", "right:16px;top:-12px")}</div>'''
    content = head("Candidatures", "Campagne 2027 · 312 candidatures · 38 à traiter", f'<a class="btn btn-ghost" style="color:{VIOLET};border-color:#d9ccff">{icon("file-spreadsheet", 16, VIOLET)} Exporter CSV</a><a class="btn" style="background:{VIOLET};color:#fff">{icon("sliders-horizontal", 16, "#fff")} Critères d\'admission</a>') + f'''
<div class="col g16"><div class="row g8 wr">{pills}</div>
<div class="row g10"><div class="inp" style="width:250px;min-height:42px;padding:9px 12px">{icon("search", 16, MUTED)}<span class="ph s13">Nom, n° de dossier…</span></div>{"".join(f'<div class="inp" style="min-height:42px;padding:9px 12px;font-size:13px;white-space:nowrap">{a}{icon("chevron-down", 14, MUTED)}</div>' for a in ["Formation : toutes", "Pays : tous", "Série / niveau", "Rentrée 2027", "Assigné à : moi"])}<span class="s13 b" style="color:{VIOLET};margin-left:auto">Réinitialiser</span></div>
{bulk}
<div class="card" style="border-radius:20px;overflow:hidden"><table class="tbl"><tr><th></th><th>N° dossier</th><th>Candidat</th><th>Formation</th><th>Série · moyenne</th><th>Statut</th><th>Pièces</th><th>Soumise le</th><th>Actions</th></tr>{rows}</table>
<div class="row between" style="padding:14px 18px"><span class="muted s13">1–11 sur 38 dossiers à traiter</span><div class="row g6">{"".join(f'<div class="ic s13 b" style="width:34px;height:34px;border-radius:10px;{"background:" + VIOLET + ";color:#fff" if k == 1 else "background:#f6f8fe"}">{t}</div>' for k, t in enumerate(["‹", "1", "2", "3", "4", "›"]))}</div></div></div></div>'''
    save("31-etablissement-candidatures", page("Navigoal — Établissement · Candidatures", space("etablissement", "Candidatures", content)))


def s32_etab_dossier():
    docs = [("Passeport", "id-card", True), ("Relevés de notes 1re & Tle", "file-text", True), ("Lettre de motivation", "pen-line", True), ("Attestation de prise en charge", "hand-coins", True), ("Certificat de scolarité", "school", True)]
    dl = "".join(f'<div class="row g10" style="padding:10px 12px;border-radius:12px;{"background:#f1edff;border:1.5px solid " + VIOLET if k == 1 else "border:1px solid #eef1f8"}">{icon(i, 17, VIOLET if k == 1 else MUTED)}<span class="s13 b f1">{t}</span>{icon("circle-check", 16, GREEN)}</div>' for k, (t, i, ok) in enumerate(docs))
    marks = [("Mathématiques", "15,5", "16,0", "4"), ("Physique-chimie", "14,0", "13,5", "4"), ("SVT", "12,5", "12,0", "2"), ("Français", "13,0", "12,5", "3"), ("Anglais", "15,0", "15,5", "2"), ("Philosophie", "11,5", "12,0", "2"), ("Histoire-géographie", "13,5", "14,0", "2")]
    mt = "".join(f'<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">{a}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">{b}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">{c}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">{d}</td></tr>' for a, b, c, d in marks)
    viewer = f'''<div class="card col" style="flex:1;border-radius:22px;overflow:hidden;min-width:0"><div class="row between" style="padding:12px 16px;border-bottom:1px solid #eef1f8"><div class="row g10">{icon("file-text", 18, VIOLET)}<b class="s14">Relevés de notes 1re & Tle</b>{chip("Vérifié par Navigoal", "chip-green")}</div><div class="row g6">{"".join(ibox(i, "#f6f8fe", "#3b4566", 32, 16, 9) for i in ["chevron-left", "chevron-right", "rotate-ccw", "download", "printer"])}</div></div>
<div class="row f1" style="background:#e9edf7;padding:20px;justify-content:center;position:relative"><div style="width:440px;background:#fff;box-shadow:0 10px 30px -10px rgba(0,0,0,.25);padding:28px 30px;font-size:11px;color:#222;font-family:Georgia,serif">
<div class="row between" style="border-bottom:2px solid #222;padding-bottom:8px"><div class="col"><b style="font-size:10px">RÉPUBLIQUE GABONAISE</b><span style="font-size:9px">Ministère de l'Éducation nationale</span></div><div class="col" style="align-items:flex-end"><b style="font-size:10px">LYCÉE NATIONAL LÉON MBA</b><span style="font-size:9px">Libreville</span></div></div>
<div style="text-align:center;margin:12px 0"><b style="font-size:14px">BULLETIN DE NOTES — 1er TRIMESTRE</b><div style="font-size:10px">Année scolaire 2026-2027 · Classe : Terminale C</div></div>
<div style="font-size:10px;margin-bottom:8px">Élève : <b>MBA Amina</b> · née le 14/03/2009 à Libreville</div>
<table style="width:100%;border-collapse:collapse;font-size:10px"><tr style="background:#f1f1f1"><th style="padding:6px 8px;text-align:left">Matière</th><th style="padding:6px 8px">Moy. élève</th><th style="padding:6px 8px">Moy. 1re</th><th style="padding:6px 8px">Coef.</th></tr>{mt}</table>
<div class="row between" style="margin-top:12px;font-size:10px"><span>Moyenne générale : <b>14,2 / 20</b> · Rang : 4e / 38</span><span style="border:1.5px solid #1a3c8f;color:#1a3c8f;border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:8px;text-align:center;transform:rotate(-12deg)">LE PROVISEUR</span></div></div>
{ann("Visionneuse : zoom molette · annotations privées", "left:20px;top:12px")}</div>
<div class="row g8" style="padding:12px 16px;border-top:1px solid #eef1f8"><span class="muted s12 b">PIÈCES (5/5)</span></div><div class="col g6" style="padding:0 16px 16px">{dl}</div></div>'''
    profile = f'''<div class="col g16" style="width:290px;flex-shrink:0">{card(f"""<div class="row g12">{avatar("AM", 56)}<div class="col"><b style="font-size:17px">Amina Mba</b><span class="muted s12">17 ans · 🇬🇦 Gabonaise · Libreville</span></div></div>
<div class="row g6 wr">{chip("Mineure · parent garant", "chip-sun")}{chip("Identité vérifiée", "chip-green")}</div>
<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Série", "Bac C (Gabon)"), ("Moyenne T1", "14,2 / 20"), ("Maths / PC", "15,5 · 14,0"), ("Bac prévu", "Juin 2027"), ("Langues", "Français, anglais B2")])}</div>""", pad=18)}
{card(f"""<b class="s14">Profil d'orientation</b><div class="row g10">{ibox("compass", "#e8f8ef", GREEN, 38, 18)}<div class="col"><b class="s13">Investigateur · Conventionnel</b><span class="muted s12">Compatibilité Bachelor business : 78 %</span></div></div><div class="row g6 wr">{chip("Analyse")}{chip("Organisation")}{chip("Rigueur")}</div>""", pad=18)}
{card(f"""<b class="s14">Financement</b><div class="row between s13"><span class="muted">Budget déclaré</span><b>4 M F CFA / an</b></div><div class="row between s13"><span class="muted">Prise en charge</span><b>Père · justifiée</b></div><div class="row between s13"><span class="muted">Frais de dossier</span>{chip("Payé · 1 500 MAD", "chip-green")}</div>""", pad=18)}
{card(f"""<b class="s14">Entretien de motivation</b><div class="row between s13"><span class="muted">12/03/2027 · visio</span><b style="color:{GREEN}">16 / 20</b></div><span class="muted s12">« Très motivée, projet clair, bon niveau d'anglais. » — N. Alaoui</span>""", pad=18)}</div>'''
    decision = f'''<div class="col g16" style="width:330px;flex-shrink:0">{card(f"""<div class="row between"><b style="font-size:16px">Décision</b>{st("En traitement")}</div>
<div class="col g8">{"".join(f'<div class="row g10" style="padding:11px 12px;border-radius:12px;{"background:#e8f8ef;border:2px solid " + GREEN if k == 1 else "border:1.5px solid #e6eaf5"}"><div style="width:18px;height:18px;border-radius:50%;border:{"5px solid " + GREEN if k == 1 else "1.5px solid #cdd5ea"};background:#fff"></div>{icon(i, 16, c)}<b class="s13">{t}</b></div>' for k, (i, c, t) in enumerate([("circle-check", GREEN, "Accepter"), ("badge-check", GREEN, "Accepter sous condition"), ("hourglass", VIOLET, "Liste d'attente"), ("circle-x", ROSE, "Refuser"), ("file-warning", "#a55a00", "Demander une pièce")]))}</div>
{select("Condition", "Obtention du baccalauréat 2027")}{field("Pièce à fournir", "Attestation de réussite au bac · avant le 31/07/2027", "file-warning")}
<div class="col g6"><span class="lbl">Message au candidat</span><div style="padding:12px;border:1.5px solid #e1e6f3;border-radius:12px;font-size:13px;line-height:1.5;color:#3b4566">Félicitations Amina ! Votre admission en Bachelor est confirmée sous réserve de l'obtention du bac…</div><span class="muted s12">Modèle « Admission conditionnelle » · le parent est notifié</span></div>
<a class="btn" style="background:{GREEN};color:#fff;padding:13px">{icon("send", 16, "#fff")} Valider et notifier</a>{ann("Confirmation : modale + annulation possible 10 s", "right:16px;top:-12px")}""", extra="position:relative;border:2px solid #d9ccff")}
{card(f"""<div class="row between"><b class="s14">Note interne</b>{chip("Équipe uniquement", "chip-gray")}</div><div class="row g10 start">{avatar("NA", 30, AV_BG[2], "#fff")}<div class="col g2"><span class="s12 b">Nadia Alaoui · 12/03</span><span class="muted s12">Excellent dossier scientifique. Proposer aussi la bourse d'excellence Afrique (–20 %).</span></div></div><div class="inp"><span class="ph s13 f1">Ajouter une note…</span>{icon("send-horizontal", 16, VIOLET)}</div>""", pad=18)}
{card(f"""<b class="s14">Assignation & historique</b><div class="row between s13"><span class="muted">Responsable</span><b>Nadia Alaoui</b></div><div class="row between s13"><span class="muted">Dossier complet le</span><b>03/03/2027</b></div><div class="row between s13"><span class="muted">Délai restant (SLA)</span>{chip("2 jours", "chip-sun")}</div><a class="btn btn-ghost" style="padding:10px;color:{VIOLET};border-color:#d9ccff">{icon("message-circle", 15, VIOLET)} Écrire à la candidate</a>""", pad=18)}</div>'''
    content = f'''<div class="col g16">{crumbs("Candidatures", "#2026-00125")}<div class="row between"><div class="row g14"><h2 style="font-size:28px">Dossier de Amina Mba</h2>{st("En traitement")}{chip("Bachelor business · rentrée 2027", "chip-violet")}</div><div class="row g8">{ibox("chevron-left", "#fff", "#3b4566", 40, 18)}<span class="muted s13">Dossier 1 sur 38</span>{ibox("chevron-right", "#fff", "#3b4566", 40, 18)}</div></div>
<div class="row g20 start">{profile}{viewer}{decision}</div></div>'''
    save("32-etablissement-dossier", page("Navigoal — Établissement · Dossier candidat", space("etablissement", "Candidatures", content)))


def s33_etab_formations():
    E = ETABS["ma-esa-casa"]
    fl = [(f, n, a) for f, n, a in [("frm-bachelor-business", 148, True), ("frm-master-management", 82, True), ("frm-mba", 46, True), ("frm-master-grh", 36, False)]]
    lst = "".join(f'''<div class="col g8" style="padding:14px;border-radius:16px;{"background:#f1edff;border:2px solid " + VIOLET if k == 0 else "border:1px solid #eef1f8;background:#fff"}"><div class="row between"><b class="s14">{FORMATIONS[f]["intitule"]}</b>{toggle(a, VIOLET)}</div>
<div class="row g6">{chip(FORMATIONS[f]["diplome"], "chip-violet")}{chip(str(FORMATIONS[f]["duree_annees"]) + " ans", "chip-gray")}</div><span class="muted s12">{n} candidatures · {"active" if a else "masquée"} · rentrée sept. 2027</span></div>''' for k, (f, n, a) in enumerate(fl))
    F = FORMATIONS["frm-bachelor-business"]
    ser = {"MA": ["SE", "SGC", "SM A", "SM B", "PC", "SVT"], "GA": ["B", "C", "D", "G2", "G3"], "SN": ["L2", "S1", "S2", "G"]}
    series_html = "".join(f'<div class="row g10 start"><span class="s13 b" style="width:90px;padding-top:5px">{NOMS[p]}</span><div class="row g6 wr f1">{"".join(chip(x + " ✓", "chip-violet") for x in xs)}<span class="chip" style="border:1.5px dashed #cdd5ea;color:#6b7493;background:#fff">+ ajouter</span></div></div>' for p, xs in ser.items())
    pieces = ["Pièce d'identité / passeport", "Relevés de notes 1re & Terminale", "Attestation ou diplôme du bac", "Lettre de motivation", "CV", "Photo d'identité", "Attestation de prise en charge", "Certificat médical"]
    pc = "".join(f'<div style="width:48%">{cbox(p, k < 7, VIOLET, 13)}</div>' for k, p in enumerate(pieces))
    sec = lambda t, ic: f'<div class="row g10" style="margin-top:4px">{ibox(ic, "#f1edff", VIOLET, 30, 15, 9)}<b style="font-size:16px">{t}</b></div>'
    form = f'''<div class="card col g16" style="flex:1;padding:26px;border-radius:24px;min-width:0;position:relative"><div class="row between"><div class="col g4"><h3 style="font-size:20px">Modifier la formation</h3><span class="muted s13">Dernière modification le 02/10/2026 par Nadia Alaoui</span></div><div class="row g10"><span class="s13 b soft">Active</span>{toggle(True, VIOLET)}</div></div>
{sec("Rattachement au référentiel", "database")}
<div class="row g16 start">{select("Formation type (référentiel Navigoal)", F["intitule"], "link", flex=1.4, help_="Relie automatiquement les métiers, compétences et séries recommandées")}{field("Intitulé affiché", "Bachelor in Business Administration (BBA)")}</div>
<div class="row g8 s12 wr" style="padding:10px 12px;border-radius:12px;background:#f8f9fd"><span class="muted b">Métiers liés :</span>{"".join(chip(METIERS[m]["nom"][:32], "chip-gray") for m in F["metiers"])}</div>
<div class="row g16 start">{select("Diplôme", F["diplome"])}{select("Durée", f'{F["duree_annees"]} ans')}{select("Langue", "Français / anglais")}{select("Campus", "Casablanca · Maarif")}</div>
{sec("Frais", "wallet")}
<div class="row g16 start">{field("Scolarité min / an", "75 000")}{field("Scolarité max / an", "89 000")}{select("Devise", "MAD", flex=.6)}{field("Frais de dossier", "1 500 MAD")}{field("Frais de réservation", "5 000 MAD")}</div>
{sec("Conditions d'admission", "list-checks")}
{series_html}
<div class="row g16 start">{field("Note minimale", "12 / 20", help_="Moyenne générale de Terminale")}<div class="col g8 f1"><span class="lbl">Épreuves</span><div class="row g16">{"".join(f'<div class="row g8 s13 b">{toggle(on, VIOLET)}{t}</div>' for t, on in [("Concours écrit", False), ("Entretien", True), ("Test d'anglais", True)])}</div></div></div>
<div class="col g8"><span class="lbl">Pièces requises</span><div class="row wr" style="gap:10px 4%">{pc}</div></div>
{sec("Places & calendrier", "calendar")}
<div class="row g16 start">{field("Places", "120", "users")}{select("Rentrée", "Septembre 2027", "calendar")}{field("Date limite de candidature", "30/04/2027", "calendar-clock")}{select("Campagne", "Admission 2027 · session 1")}</div>
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:16px"><a class="s13 b" style="color:{ROSE}">Archiver la formation</a><div class="row g10"><a class="btn btn-ghost" style="color:{VIOLET};border-color:#d9ccff">Prévisualiser</a><a class="btn" style="background:{VIOLET};color:#fff">{icon("check", 16, "#fff", 3)} Enregistrer</a></div></div>
{ann("Champs liés au référentiel : auto-complétion + validation en direct", "right:24px;top:-12px")}</div>'''
    preview = f'''<div class="col g12" style="margin-top:8px"><span class="muted s12 b">APERÇU · CARTE CÔTÉ ÉTUDIANT</span><div class="card" style="border-radius:20px;overflow:hidden">{photo_box("ma-esa-casa", 1, 130, 0)}<div class="col g8" style="padding:16px"><div class="row g10">{logo("ma-esa-casa", 38)}<div class="col"><b class="s13">Bachelor in Business Administration</b><span class="muted s12">ESA · Casablanca</span></div></div><div class="row g6 wr">{chip("Bachelor")}{chip("3 ans", "chip-gray")}{chip("Dossier + entretien", "chip-gray")}</div><div class="col g2"><span class="muted s12">Scolarité</span><b class="s14" style="color:{BLUE}">75 000 – 89 000 MAD / an</b></div><a class="btn btn-primary" style="padding:10px;font-size:13px">Candidater</a></div></div>
{card(f'''<b class="s14">Qualité de la fiche</b><div class="row g10">{ring(92, 54, GREEN)}<span class="muted s12">Complète. Ajoutez une vidéo du campus pour +15 % de vues.</span></div>''', pad=18)}</div>'''
    content = head("Formations", f"{len(E['formations'])} formations publiées sur Navigoal · rattachées au référentiel national", f'<a class="btn" style="background:{VIOLET};color:#fff">{icon("plus", 16, "#fff")} Nouvelle formation</a>') + f'<div class="row g20 start"><div class="col g10" style="width:290px;flex-shrink:0"><div class="inp" style="min-height:42px">{icon("search", 16, MUTED)}<span class="ph s13">Rechercher</span></div>{lst}{preview}</div>{form}</div>'
    save("33-etablissement-formations", page("Navigoal — Établissement · Formations", space("etablissement", "Formations", content)))


def s34_etab_campagnes_fiche():
    months = ["Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août"]
    camps = [("Admission 2027 · session 1", "megaphone", VIOLET, 0, 5, "01/12/2026 → 30/04/2027", "En cours", "chip-green", "312 candidatures"),
             ("Admission 2027 · session 2", "megaphone", "#a78bfa", 5, 7.5, "01/05 → 15/07/2027", "Programmée", "chip-violet", "—"),
             ("Concours d'entrée (Master)", "trophy", "#f9a806", 5.5, 5.8, "18/05/2027 · en ligne", "Programmée", "chip-sun", "48 inscrits"),
             ("Portes ouvertes virtuelles", "video", BLUE, 3.4, 3.5, "14/03/2027 · 15:00 GMT", "Terminée", "chip-gray", "860 participants"),
             ("Tournée Afrique : Libreville & Dakar", "plane", TEAL, 4.3, 4.6, "10 → 18/04/2027", "Programmée", "chip-teal", "214 RDV")]
    rows = ""
    for t, i, c, a, b, d, s, sc, kp in camps:
        rows += f'''<div class="row g16" style="padding:10px 0;border-bottom:1px solid #eef1f8"><div class="row g10" style="width:290px;flex-shrink:0">{ibox(i, c + "22", c, 34, 16, 10)}<div class="col"><b class="s13">{t}</b><span class="muted s12">{d}</span></div></div>
<div class="f1" style="position:relative;height:28px;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(100%/9 - 1px),#eef1f8 calc(100%/9 - 1px),#eef1f8 calc(100%/9))"><div style="position:absolute;left:{a/9*100:.1f}%;width:{max(1.2, (b-a)/9*100):.1f}%;top:4px;height:20px;border-radius:7px;background:{c}"></div></div>
<div class="row g8" style="width:220px;justify-content:flex-end">{chip(s, sc)}<span class="muted s12" style="width:96px;text-align:right">{kp}</span></div></div>'''
    head_m = "".join(f'<span class="f1 s12 b muted" style="text-align:center">{m}</span>' for m in months)
    camp = f'''<div class="card col g8" style="padding:22px;border-radius:22px;position:relative">{ctitle("Campagnes & événements", f'<a class="btn" style="background:{VIOLET};color:#fff;padding:9px 14px;font-size:13px">{icon("plus", 15, "#fff")} Nouvelle campagne</a>', "megaphone", VIOLET, "#f1edff")}
<div class="row g16"><div style="width:290px"></div><div class="row f1">{head_m}</div><div style="width:220px"></div></div>{rows}
<div style="position:absolute;left:calc(290px + 38px + (100% - 290px - 220px - 76px) * 3.3 / 9);top:96px;bottom:22px;width:2px;background:{ROSE}"></div>{ann("Frise : glisser pour modifier les dates", "right:22px;top:-12px")}</div>'''
    photos = "".join(f'<div style="position:relative">{photo_box("ma-esa-casa", n, 120, 14)}<div class="row g4" style="position:absolute;right:8px;top:8px">{ibox("pencil", "#fff", INK, 26, 13, 8)}{ibox("trash-2", "#fff", ROSE, 26, 13, 8)}</div>{"<span class=chip style=position:absolute;left:8px;bottom:8px;background:#fff;color:#0b1533>★ Couverture</span>" if n == 0 else ""}</div>' for n in range(3))
    fiche = f'''<div class="card col g16" style="flex:1;padding:24px;border-radius:22px;min-width:0">{ctitle("Fiche établissement", f'<a class="btn btn-ghost" style="padding:9px 14px;font-size:13px;color:{VIOLET};border-color:#d9ccff">{icon("external-link", 15, VIOLET)} Voir la page publique</a>', "building-2", VIOLET, "#f1edff")}
<div class="row g16 start"><div class="col g6 f1"><span class="lbl">Logo</span><div class="row g12">{logo("ma-esa-casa", 64)}<a class="btn btn-ghost" style="padding:9px 12px;font-size:13px">Remplacer</a></div></div>{field("Nom officiel", "ESA Casablanca — École Supérieure des Affaires", flex=2)}</div>
<div class="col g6"><div class="row between"><span class="lbl">Description</span><span class="muted s12">612 / 1 500</span></div><div class="col g6" style="border:1.5px solid #e1e6f3;border-radius:12px;overflow:hidden"><div class="row g12" style="padding:8px 12px;background:#f8f9fd;border-bottom:1px solid #eef1f8">{"".join(icon(i, 16, "#3b4566") for i in ["bold", "italic", "list", "link", "heading-1"])}</div><div style="padding:12px;font-size:13px;line-height:1.6;color:#3b4566">Membre du groupe IGENSIA Education, l'ESA Casablanca forme depuis 1994 des managers à vocation internationale : Bachelor, Programme Grande École et MBA, en français et en anglais, avec des doubles diplômes en France…</div></div></div>
<div class="col g8"><div class="row between"><span class="lbl">Photos (3 / 12)</span><span class="muted s12">JPG ou PNG · 1 600 px min. · droits d'utilisation requis</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">{photos}<div class="col g6" style="height:120px;border:2px dashed #d9ccff;border-radius:14px;align-items:center;justify-content:center;background:#faf8ff">{icon("image-plus", 26, VIOLET)}<span class="s12 b" style="color:{VIOLET}">Ajouter</span></div></div></div>
<div class="row g16 start">{field("E-mail admissions", "admissions@esa-casablanca.ma", "mail")}{field("Téléphone", "+212 5 22 •• •• ••", "phone")}{field("WhatsApp", "+212 6 61 •• •• ••", "message-circle")}</div>
<div class="row g16 start">{field("Adresse", "Bd Abdelmoumen, Maârif, Casablanca", "map-pin", flex=2)}{field("Site web", "esa-casablanca.ma", "globe")}</div>
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:14px"><span class="muted s12">Les modifications importantes sont relues par Navigoal sous 24 h.</span><a class="btn" style="background:{VIOLET};color:#fff">Soumettre les modifications</a></div></div>'''
    verif = f'''<div class="col g16" style="width:330px;flex-shrink:0">{card(f"""<div class="row between"><b style="font-size:16px">Statut de vérification</b>{chip("✓ Vérifié", "chip-green")}</div>
{"".join(f'<div class="row g10 s13">{icon("circle-check", 18, GREEN)}<div class="col f1"><b>{a}</b><span class="muted s12">{b}</span></div></div>' for a, b in [("Revendication de la fiche", "Validée le 02/10/2026"), ("Agrément / reconnaissance", "Privé autorisé · ministère de l'Enseignement supérieur"), ("Représentant légal", "Pièce d'identité + mandat"), ("Coordonnées bancaires", "RIB vérifié pour les frais de dossier")])}
<div class="row g8 s12" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:{GREEN};font-weight:700">{icon("badge-check", 16, GREEN)} Badge « Établissement vérifié » affiché</div>""")}
{card(f"""<div class="row between"><b style="font-size:16px">Offre</b>{chip("Partenaire", "chip-violet")}</div><div class="row between s13"><span class="muted">Mise en avant</span><b>Pays Maroc · Gestion</b></div><div class="row between s13"><span class="muted">Fin de l'offre</span><b>31/08/2027</b></div><div class="row between s13"><span class="muted">Commission frais de dossier</span><b>0 %</b></div><a class="btn btn-ghost" style="padding:10px;color:{VIOLET};border-color:#d9ccff">Changer d'offre</a>""")}
{card(f"""<b style="font-size:16px">Équipe</b>{"".join(f'<div class="row g10">{avatar(i, 32, AV_BG[k + 1], "#fff")}<div class="col f1"><b class="s13">{n}</b><span class="muted s12">{r}</span></div></div>' for k, (i, n, r) in enumerate([("NA", "Nadia Alaoui", "Responsable admissions · admin"), ("YM", "Youssef Mansouri", "Chargé international"), ("LB", "Leïla Bennani", "Lecture seule")]))}""")}</div>'''
    content = head("Campagnes & fiche établissement", "Planifiez vos admissions et soignez votre vitrine sur Navigoal", "") + f'<div class="col g20">{camp}<div class="row g20 start">{fiche}{verif}</div></div>'
    save("34-etablissement-campagnes-fiche", page("Navigoal — Établissement · Campagnes & fiche", space("etablissement", "Campagnes", content)))


# =====================================================================================
# 35–41. NAVILEASE
# =====================================================================================
LOGS = [
    dict(t="Studio meublé · Maârif", q="Maârif, Casablanca", loyer=3200, ch=350, dist="12 min à pied", v="visite", typ="Studio", note="4,8", avis=23, ic="building", m2=28, genre="Mixte"),
    dict(t="Colocation 3 chambres · Gauthier", q="Gauthier, Casablanca", loyer=2100, ch=300, dist="8 min à pied", v="partenaire", typ="Colocation", note="4,9", avis=41, ic="users", m2=14, genre="Filles"),
    dict(t="Résidence Les Orangers · Bourgogne", q="Bourgogne, Casablanca", loyer=3800, ch=0, dist="18 min en tram", v="identite", typ="Résidence", note="4,6", avis=12, ic="hotel", m2=22, genre="Mixte"),
    dict(t="Chambre chez l'habitant · Racine", q="Racine, Casablanca", loyer=1900, ch=0, dist="15 min à pied", v="visite", typ="Chez l'habitant", note="4,7", avis=9, ic="house", m2=12, genre="Filles"),
    dict(t="Studio lumineux · Oasis", q="Oasis, Casablanca", loyer=2900, ch=250, dist="22 min en tram", v="identite", typ="Studio", note="4,5", avis=6, ic="building-2", m2=25, genre="Mixte"),
]


def logement_card_h(k, L, on=False):
    c, l = VERIF[L["v"]]
    return f'''<div class="card row" style="border-radius:20px;overflow:hidden;align-items:stretch;{"border:2px solid " + BLUE + ";box-shadow:0 24px 50px -24px rgba(26,71,245,.55)" if on else ""}">
<div style="width:210px;flex-shrink:0;position:relative">{house_ph(k, 186, L["ic"])}<span class="chip {c}" style="position:absolute;left:10px;top:10px">{l}</span><div class="ic" style="position:absolute;right:10px;top:10px;width:32px;height:32px;border-radius:50%;background:#fff">{icon("heart", 15, ROSE if on else MUTED)}</div>
<div class="row g4" style="position:absolute;left:10px;bottom:10px">{"".join(f"<div style='width:{14 if j == 0 else 6}px;height:6px;border-radius:6px;background:{'#fff' if j == 0 else 'rgba(255,255,255,.55)'}'></div>" for j in range(5))}</div></div>
<div class="col g8 f1" style="padding:14px 16px;min-width:0"><div class="row between"><b class="s14">{L["t"]}</b><span class="row g4 s12 b">{icon("star", 13, "#f9a806")}{L["note"]} <span class="muted">({L["avis"]})</span></span></div>
<div class="row g10 muted s12"><span class="row g4">{icon("map-pin", 13, MUTED)}{L["q"]}</span><span>{L["typ"]} · {L["m2"]} m²</span></div>
<div class="row g6 s12 b" style="color:{GREEN}">{icon("footprints", 14, GREEN)}{L["dist"]} de l'ESA Casablanca</div>
<div class="row g6 wr">{"".join(chip(x, "chip-gray") for x in ["Meublé", "Wifi", L["genre"]])}</div>
<div class="row between" style="margin-top:auto;border-top:1px solid #eef1f8;padding-top:10px"><div><b style="font-size:18px;color:{BLUE}">{fmt(L["loyer"])} MAD</b><span class="muted s12"> /mois {("+ " + str(L["ch"]) + " ch.") if L["ch"] else "charges incl."}</span></div><span class="muted s12">dispo. 01/09</span></div></div></div>'''


def map_box(h=640, w=None, pins=None, radius=22):
    pins = pins or [(150, 190, "3 200", True), (250, 120, "2 100", False), (300, 330, "3 800", False), (90, 300, "1 900", False), (330, 230, "2 900", False), (200, 430, "2 400", False), (60, 120, "2 600", False)]
    pp = "".join(f'<div class="chip" style="position:absolute;left:{x}px;top:{y}px;background:{BLUE if on else "#fff"};color:{"#fff" if on else INK};box-shadow:0 8px 20px -8px rgba(0,0,0,.4);padding:6px 10px;{"transform:scale(1.12)" if on else ""}">{p}</div>' for x, y, p, on in pins)
    return f'''<div style="position:relative;height:{h}px;{"width:" + str(w) + "px;" if w else ""}border-radius:{radius}px;overflow:hidden;background:linear-gradient(160deg,#e7eefc,#f3f6fd);border:1px solid #e6eaf5">
<svg width="100%" height="100%" style="position:absolute;inset:0" preserveAspectRatio="none" viewBox="0 0 400 640"><path d="M-10 160 C120 140 200 220 420 190" stroke="#fff" stroke-width="16" fill="none"/><path d="M80 -10 C110 200 60 380 170 650" stroke="#fff" stroke-width="12" fill="none"/>
<path d="M-10 420 C150 390 300 470 420 410" stroke="#fff" stroke-width="14" fill="none"/><path d="M300 -10 L260 650" stroke="#ffe08a" stroke-width="5" fill="none" stroke-dasharray="10 8"/><rect x="230" y="250" width="70" height="50" rx="10" fill="#d4f0dc"/><circle cx="185" cy="255" r="110" fill="rgba(26,71,245,.06)" stroke="#1a47f5" stroke-dasharray="6 6"/></svg>
<div class="col" style="position:absolute;left:162px;top:225px;align-items:center"><div class="ic" style="width:50px;height:50px;border-radius:50%;background:#fff;border:3px solid {BLUE};box-shadow:0 10px 24px -6px rgba(26,71,245,.7);overflow:hidden">{logo("ma-esa-casa", 40)}</div><span class="chip chip-ink" style="margin-top:4px;padding:3px 8px;font-size:11px">ESA</span></div>{pp}
<div class="col g6" style="position:absolute;right:12px;top:12px">{ibox("plus", "#fff", INK, 34, 16, 10)}{ibox("minus" if False else "layers", "#fff", INK, 34, 16, 10)}</div>
<div class="row g8 s12 b" style="position:absolute;left:12px;bottom:12px;background:#fff;border-radius:10px;padding:8px 10px;box-shadow:0 6px 16px -8px rgba(0,0,0,.3)">{icon("footprints", 14, GREEN)} Rayon 20 min à pied · tram T1 en pointillés</div></div>'''


def s35_navilease_recherche():
    filt = f'''<div class="card col g20" style="width:260px;flex-shrink:0;padding:22px;border-radius:22px"><div class="row between"><h3 style="font-size:17px">Filtres</h3>{link("Effacer")}</div>
<div class="col g8"><span class="lbl">Près de l'établissement</span><div class="row g8 box" style="padding:8px 10px">{logo("ma-esa-casa", 30)}<b class="s13 f1">ESA Casablanca</b>{icon("x", 14, MUTED)}</div><div class="row between s12"><span class="muted">Temps de trajet max.</span><b>20 min</b></div><div style="position:relative;height:6px;border-radius:6px;background:#e8edfa"><div style="width:45%;height:100%;border-radius:6px;background:{BLUE}"></div><div style="position:absolute;left:45%;top:-7px;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid {BLUE};margin-left:-10px"></div></div><div class="row g6">{chip("À pied", "chip-blue")}{chip("Tram / bus", "chip-gray")}</div></div>
<div class="col g8"><span class="lbl">Budget mensuel (MAD)</span><div style="position:relative;height:6px;border-radius:6px;background:#e8edfa;margin:8px 0"><div style="position:absolute;left:15%;width:50%;height:100%;border-radius:6px;background:{BLUE}"></div><div style="position:absolute;left:15%;top:-7px;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid {BLUE};margin-left:-10px"></div><div style="position:absolute;left:65%;top:-7px;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid {BLUE};margin-left:-10px"></div></div><div class="row between s12 b"><span>1 500</span><span>3 500</span></div></div>
<div class="col g8"><span class="lbl">Type de logement</span>{"".join(cbox(t, on, size=13) for t, on in [("Studio", True), ("Colocation", True), ("Résidence étudiante privée", True), ("Chambre chez l'habitant", False), ("Foyer / internat", False)])}</div>
<div class="col g8"><span class="lbl">Équipements</span><div class="row g6 wr">{"".join(chip(t, "chip-blue" if on else "chip-gray") for t, on in [("Meublé", True), ("Wifi", True), ("Électricité incluse", False), ("Climatisation", False), ("Gardiennage 24h/24", True), ("Cuisine équipée", False), ("Laverie", False), ("Espace de travail", False)])}</div></div>
<div class="col g8"><span class="lbl">Colocation / résidence</span>{seg(["Mixte", "Filles", "Garçons"], 1, small=True)}</div>
<div class="col g8"><span class="lbl">Niveau de vérification</span>{"".join(cbox(t, on, size=13) for t, on in [("★ Partenaire certifié", True), ("✓ Visité par Navilease", True), ("Identité vérifiée", True), ("Non vérifié", False)])}</div>
<a class="btn btn-primary">Afficher 24 logements</a></div>'''
    lst = "".join(logement_card_h(k, L, k == 0) for k, L in enumerate(LOGS[:4]))
    top = f'''<div class="search row g12" style="padding:10px"><div class="row g10" style="flex:1.4;padding:6px 14px;border-right:1px solid #eef1f8">{icon("graduation-cap", 18, BLUE)}<div class="col"><span class="muted" style="font-size:11px;font-weight:700">Mon établissement</span><b class="s14">ESA Casablanca · Maârif</b></div></div>
{"".join(f'<div class="col f1" style="padding:4px 14px;border-right:1px solid #eef1f8"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><div class="row between s14 b">{b}{icon("chevron-down", 15, MUTED)}</div></div>' for a, b in [("Entrée", "01/09/2027"), ("Durée", "10 mois"), ("Budget max", "3 500 MAD")])}<a class="btn btn-primary">{icon("search", 16, "#fff")} Rechercher</a></div>'''
    body = f"""{header("Navilease")}<div style="background:linear-gradient(180deg,#fffaf0,#f6f8fe 260px);padding:28px 0 56px"><div class="wrap col g20">
<div class="row between"><div class="col g6">{crumbs("Navilease", "Casablanca", "Près de l'ESA")}<h2 style="font-size:32px">24 logements près de l'ESA Casablanca</h2><span class="muted">Studios, colocations et résidences vérifiés · paiement protégé en séquestre</span></div><div class="row g10"><a class="btn btn-ghost">{icon("bell", 16, "#1336e0")} Créer une alerte</a></div></div>
{top}
<div class="row g20 start">{filt}<div class="col g12 f1" style="min-width:0"><div class="row between"><div class="row g8">{chip("Admis·e ESA : priorité", "chip-green")}{chip("Garant parent accepté", "chip-blue")}</div><div class="row g6 s13"><span class="muted">Trier</span><b>Distance</b>{icon("chevron-down", 14, MUTED)}</div></div>{lst}
<div class="row g10 s13" style="padding:12px 14px;border-radius:14px;background:#fff7dd;border:1px solid #ffe9a8">{icon("shield-check", 18, "#a55a00")}<span class="soft">Les adresses exactes et coordonnées des bailleurs sont communiquées après signature du contrat.</span></div></div>
<div class="col g10" style="width:400px;flex-shrink:0;position:relative">{map_box(720)}{ann("Survol d'une carte = pin qui rebondit · carte sticky", "left:14px;top:-12px")}</div></div></div></div>{footer()}"""
    save("35-navilease-recherche", page("Navilease — Recherche de logements", body))


def s36_navilease_fiche():
    L = LOGS[0]
    gal = f'''<div class="row g12" style="height:400px;position:relative"><div class="f1" style="flex:1.6;position:relative">{house_ph(0, 400, "sofa", 22)}<span class="chip chip-green" style="position:absolute;left:16px;top:16px">✓ Visité par Navilease le 14/08/2026</span></div>
<div class="col g12 f1">{house_ph(4, 194, "bed-double", 22)}<div class="row g12">{house_ph(1, 194, "utensils", 22, "flex:1")}<div class="f1" style="position:relative">{house_ph(2, 194, "bath", 22)}<div style="position:absolute;inset:0;border-radius:22px;background:rgba(11,21,51,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;gap:8px">{icon("images", 20, "#fff")} 14 photos · visite 360°</div></div></div></div>
{ann("Visuels provisoires : photos du bailleur vérifiées lors de la visite", "right:16px;top:-12px")}</div>'''
    facts = "".join(f'<div class="row g10">{ibox(i, "#eef4ff", BLUE, 40, 19)}<div class="col"><span class="muted s12">{a}</span><b class="s14">{b}</b></div></div>' for i, a, b in [("building", "Type", "Studio meublé"), ("ruler", "Surface", "28 m²"), ("layers", "Étage", "3e · ascenseur"), ("calendar", "Disponible", "01/09/2027"), ("clock", "Durée min.", "10 mois"), ("users", "Occupants", "1 personne")])
    equip = "".join(f'<div class="row g10 s13">{icon(i, 18, "#3b4566")}<span class="soft">{t}</span></div>' for i, t in [("sofa", "Meublé"), ("wifi", "Wifi fibre 100 Mb/s"), ("zap", "Électricité incluse"), ("droplets", "Eau courante"), ("snowflake", "Climatisation"), ("utensils", "Kitchenette équipée"), ("bath", "Salle d'eau privative"), ("shield-check", "Gardien 24h/24"), ("cctv", "Caméras parties communes"), ("washing-machine", "Laverie dans l'immeuble"), ("armchair", "Bureau + chaise"), ("bus", "Tram T1 à 4 min")])
    rules = "".join(f'<div class="row g10 s13">{icon(i, 16, c)}<span class="soft">{t}</span></div>' for i, c, t in [("ban", ROSE, "Non-fumeur"), ("clock", "#a55a00", "Visites jusqu'à 21 h"), ("users", BLUE, "Pas de sous-location"), ("check", GREEN, "Animaux non admis"), ("check", GREEN, "Préavis de départ : 1 mois")])
    reviews = "".join(f'''<div class="col g8 box" style="padding:14px"><div class="row between"><div class="row g10">{avatar(i, 34, AV_BG[k + 1], "#fff")}<div class="col"><b class="s13">{n}</b><span class="muted s12">{d}</span></div></div><span class="row g4 s12 b">{icon("star", 13, "#f9a806")}{r}</span></div><span class="soft s13" style="line-height:1.5">{t}</span><span class="chip chip-green" style="align-self:flex-start">✓ Séjour vérifié</span></div>''' for k, (i, n, d, r, t) in enumerate([("OT", "Ousmane T. · étudiant à l'ESCA", "Sept. 2025 – juin 2026", "5,0", "Studio propre et calme, Karim répond vite. Le tram est vraiment à 4 minutes, pratique pour les cours du matin."), ("ML", "Mariam L. · étudiante à l'ESA", "Sept. 2024 – juil. 2025", "4,6", "Très bien équipé, la clim est un plus en juin. Quelques coupures de wifi au début, réglées rapidement.")]))
    near = "".join(f'<div class="row between s13 box" style="padding:9px 12px"><span class="row g8">{logo(e, 28) if e else ibox(i, "#f6f8fe", "#3b4566", 28, 14, 8)}<b>{t}</b></span><span class="muted">{d}</span></div>' for e, i, t, d in [("ma-esa-casa", None, "ESA Casablanca", "12 min à pied"), ("ma-esca", None, "ESCA École de Management", "15 min"), ("ma-emsi", None, "EMSI Maârif", "9 min"), (None, "bus", "Tram T1 · Place Mohammed V", "4 min"), (None, "heart-pulse", "Clinique Badr", "7 min")])
    total = 3200 + 350 + 3200 + 142
    book = f'''<div class="card col g14" style="width:380px;flex-shrink:0;padding:24px;border-radius:24px;box-shadow:0 30px 60px -24px rgba(26,71,245,.45);gap:14px;position:relative">
<div class="row between"><div><b style="font-size:28px;color:{BLUE}">3 200 MAD</b><span class="muted s13"> / mois</span></div><span class="row g4 s13 b">{icon("star", 14, "#f9a806")}4,8 · 23 avis</span></div>
<div class="row g8">{field("Entrée", "01/09/2027", "calendar")}{select("Durée", "10 mois")}</div>
<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Loyer", "3 200 MAD"), ("Charges (eau, électricité, wifi)", "350 MAD"), ("Caution (1 mois, restituée)", "3 200 MAD"), ("Frais de service Navilease (4 %)", "142 MAD")])}</div>
<div class="row between" style="padding:12px 14px;border-radius:14px;background:#0b1a4f;color:#fff"><span class="b s13">À payer à la réservation</span><div class="col" style="align-items:flex-end"><b style="font-size:18px">{fmt(total)} MAD</b><span style="font-size:11px;color:#c9d6ff">≈ {fmt(round(mad_xaf(total), -2))} F CFA</span></div></div>
<a class="btn btn-primary" style="padding:15px">Demander une réservation</a>
<div class="row g8 s12 start" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:#0b5e30">{icon("shield-check", 16, GREEN)}<span><b>Paiement en séquestre :</b> le bailleur n'est payé que 48 h après ton entrée dans les lieux. Remboursé si la demande est refusée.</span></div>
<div class="row g8 muted s12">{icon("users-round", 14, MUTED)} Garant parent accepté · paiement depuis le Gabon possible</div>
{ann("Récap. recalculé en direct selon la durée", "left:20px;top:-12px")}</div>'''
    body = f"""{header("Navilease")}<div class="wrap col g20" style="padding:24px 0 56px">
{crumbs("Navilease", "Casablanca", "Maârif", "Studio meublé")}
<div class="row between"><div class="col g8"><h2 style="font-size:34px">Studio meublé lumineux · Maârif</h2><div class="row g10">{chip("✓ Visité par Navilease", "chip-green")}{chip("Identité vérifiée", "chip-blue")}<span class="row g6 muted s13">{icon("map-pin", 15, MUTED)} Maârif, Casablanca · <i>adresse exacte communiquée après signature</i></span></div></div><div class="row g10"><a class="btn btn-ghost">{icon("share-2", 16, "#1336e0")} Partager à mes parents</a><a class="btn btn-ghost">{icon("heart", 16, "#1336e0")} Favori</a></div></div>
{gal}
<div class="row g24 start"><div class="col g20 f1" style="min-width:0">
<div class="card" style="padding:20px 24px;border-radius:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">{facts}</div>
{card('<h3>Le logement</h3><p class="soft" style="line-height:1.7;font-size:14px">Studio entièrement rénové en 2025 au 3e étage d\'un immeuble sécurisé, à 12 minutes à pied de l\'ESA et à 4 minutes du tram T1. Coin nuit séparé, bureau face à la fenêtre, kitchenette équipée (plaques, réfrigérateur, micro-ondes) et salle d\'eau privative. Quartier animé et sûr, commerces et pharmacie au pied de l\'immeuble.</p>')}
<div class="row g20 stretch">{card('<h3>Équipements</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + equip + '</div>', extra="flex:1.4")}{card('<h3>Règlement</h3>' + rules, extra="flex:1")}</div>
<div class="row g20 stretch">{card('<h3>Distance de ton école</h3>' + map_box(220, None, [(250, 120, "Studio", True)], 16) + near, extra="flex:1")}{card(f'<div class="row between"><h3>Avis vérifiés</h3><span class="row g6 b">{icon("star", 18, "#f9a806")}4,8 / 5 · 23</span></div>' + "".join(hbar(a, b, 5, "#f9a806", str(b).replace(".", ",")) for a, b in [("Propreté", 4.9), ("Communication", 4.8), ("Emplacement", 4.9), ("Rapport qualité-prix", 4.5)]) + reviews, extra="flex:1")}</div>
{card(f'<div class="row g16">{avatar("KB", 60, "linear-gradient(135deg,#0f8a46,#34d399)", "#fff")}<div class="col g4 f1"><div class="row g8"><b style="font-size:17px">Karim B.</b>{chip("Identité vérifiée", "chip-blue")}{chip("Titre de propriété vérifié", "chip-green")}</div><span class="muted s13">Bailleur Navilease depuis 2025 · 3 logements · répond en ~1 h · taux d\'acceptation 92 %</span></div><a class="btn btn-ghost">{icon("message-circle", 16, "#1336e0")} Poser une question</a></div>')}
</div>{book}</div></div>{footer()}"""
    save("36-navilease-fiche-logement", page("Navilease — Fiche logement", body))


RES_STEPS = ["Demande", "Acceptée", "Paiement séquestre", "Contrat signé", "Entrée"]


def s37_navilease_demande():
    pieces = "".join(f'<div class="row g12 box">{ibox(i, bg, c, 40, 19)}<div class="col f1"><b class="s13">{t}</b><span class="muted s12">{s}</span></div>{chip(a, b)}</div>' for i, bg, c, t, s, a, b in [
        ("award", "#e8f8ef", GREEN, "Attestation d'admission", "ESA Casablanca · candidature #2026-00125 · ajoutée automatiquement", "✓ Jointe", "chip-green"),
        ("id-card", "#eef4ff", BLUE, "Pièce d'identité", "Passeport · depuis Mes documents", "✓ Jointe", "chip-green"),
        ("users-round", "#fff3c4", "#a55a00", "Garant : Jean-Paul Mba (père)", "Invitation envoyée par SMS le 19/03 · signature de l'acte de caution", "En attente", "chip-sun"),
        ("file-text", "#ffecef", ROSE, "Justificatif de revenus du garant", "3 derniers bulletins ou attestation employeur", "À ajouter", "chip-rose")])
    form = f'''<div class="card col g18" style="flex:1;padding:28px;border-radius:24px;gap:18px;position:relative;min-width:0">
<div class="col g4"><h3 style="font-size:20px">Ta demande de réservation</h3><span class="muted s13">Le bailleur a 48 h pour répondre. Aucun paiement n'est débité avant son acceptation.</span></div>
<div class="row g16 start">{field("Date d'entrée", "01/09/2027", "calendar")}{select("Durée", "10 mois (sept. → juin)")}{field("Date de sortie", "30/06/2028", "calendar")}{select("Occupants", "1")}</div>
<div class="col g6"><span class="lbl">Message au bailleur</span><div style="padding:12px 14px;border:1.5px solid #e1e6f3;border-radius:12px;font-size:13px;line-height:1.55;color:#3b4566">Bonjour, je suis admise en Bachelor à l'ESA Casablanca pour la rentrée 2027. Je suis calme et non-fumeuse ; mon père sera garant. J'arrive de Libreville fin août. Merci !</div></div>
<div class="col g10"><div class="row between"><span class="lbl">Pièces du dossier locataire</span><span class="muted s12">3 / 4</span></div>{pieces}</div>
{upload_zone("Dépose le justificatif de revenus du garant", "PDF ou photo · ou demande-le à ton père en 1 clic", 110)}
<div class="col g10">{cbox("J'ai lu le règlement intérieur et les conditions d'annulation Navilease.", True)}{cbox("Je comprends que mes coordonnées et l'adresse exacte seront partagées après signature du contrat.", True)}</div>
<div class="row between"><a class="btn btn-ghost">{icon("arrow-left", 16, "#1336e0")} Retour à l'annonce</a><a class="btn btn-primary" style="padding:14px 24px">Envoyer la demande {icon("send", 16, "#fff")}</a></div>
{ann("Pièces pré-remplies depuis le coffre-fort · garant notifié en temps réel", "right:24px;top:-12px")}</div>'''
    total = 3200 + 350 + 3200 + 142
    seq = [("Tu paies", "Après acceptation du bailleur, par Airtel Money, carte ou virement (toi ou ton parent).", "wallet"), ("Fonds bloqués", "Navilease conserve le montant en séquestre sur un compte dédié.", "lock-keyhole"), ("Tu entres", "État des lieux photo dans l'app le jour de l'entrée.", "key-round"), ("Bailleur payé", "48 h après ton entrée, sans litige signalé.", "hand-coins")]
    sq = "".join(f'<div class="row g12 start"><div class="col" style="align-items:center">{ibox(i, "#e8f8ef", GREEN, 34, 16, 10)}{"<div style=width:2px;height:18px;background:#bfe9cf></div>" if k < 3 else ""}</div><div class="col g2 f1"><b class="s13">{t}</b><span class="muted s12">{s}</span></div></div>' for k, (t, s, i) in enumerate(seq))
    side = f'''<div class="col g16" style="width:350px;flex-shrink:0">{card(f"""{house_ph(0, 130, "building", 14)}<div class="col g2"><b>Studio meublé · Maârif</b><span class="muted s12">Karim B. · ✓ Visité par Navilease · 12 min de l'ESA</span></div>
<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Loyer", "3 200 MAD"), ("Charges", "350 MAD"), ("Caution", "3 200 MAD"), ("Frais de service", "142 MAD")])}</div>
<div class="row between" style="padding:12px 14px;border-radius:14px;background:#0b1a4f;color:#fff"><b class="s13">Total en séquestre</b><b>{fmt(total)} MAD</b></div><span class="muted s12">≈ {fmt(round(mad_xaf(total), -2))} F CFA · loyers suivants payés chaque mois</span>""", pad=18)}
{card('<div class="row g8">' + icon("shield-check", 18, GREEN) + '<b>Comment marche le séquestre ?</b></div>' + sq, pad=18)}
{card(f'<div class="row g8">{icon("rotate-ccw", 16, "#a55a00")}<b class="s14">Annulation</b></div><span class="muted s12">Gratuite jusqu\'à 30 jours avant l\'entrée. Remboursement intégral si refus du visa ou de l\'admission (justificatif).</span>', pad=18)}</div>'''
    content = f'''<div class="col g20">{crumbs("Mon logement", "Studio meublé · Maârif", "Demande de réservation")}<div class="card" style="padding:18px 26px;border-radius:20px">{stepper(RES_STEPS, 0)}</div><div class="row g24 start">{form}{side}</div></div>'''
    save("37-navilease-demande-reservation", page("Navilease — Demande de réservation", space("etudiant", "Mon logement", content)))


def s38_navilease_reservation():
    rooms = [("Entrée & séjour", 4, 0), ("Coin nuit", 3, 4), ("Kitchenette", 3, 1), ("Salle d'eau", 2, 2)]
    edl = "".join(f'<div class="col g6"><div style="position:relative">{house_ph(k2, 92, ["sofa", "bed-double", "utensils", "bath"][k], 12)}<span class="chip" style="position:absolute;right:6px;top:6px;background:#fff;color:{INK};padding:2px 7px;font-size:11px">{icon("camera", 11, INK)} {n}</span></div><b class="s12">{t}</b></div>' for k, (t, n, k2) in enumerate(rooms))
    loyers = [("Sept. 2027", "3 550 MAD", "En séquestre", "chip-blue", "—"), ("Oct. 2027", "3 550 MAD", "À venir · 05/10", "chip-gray", "—"), ("Nov. 2027", "3 550 MAD", "À venir · 05/11", "chip-gray", "—")]
    lt = "".join(f'<tr><td style="white-space:nowrap"><b>{m}</b></td><td style="white-space:nowrap">{a}</td><td>{chip(s, c)}</td><td>{q if q != "—" else "<span class=muted>—</span>"}</td></tr>' for m, a, s, c, q in loyers)
    sig = "".join(f'<div class="row g10 s13">{avatar(i, 30, bg, "#fff" if i != "AM" else INK)}<b class="f1">{n}</b>{chip(s, c)}</div>' for i, bg, n, s, c in [("KB", "linear-gradient(135deg,#0f8a46,#34d399)", "Karim Benjelloun · bailleur", "✓ Signé 24/03", "chip-green"), ("JM", "linear-gradient(135deg,#1a47f5,#598bff)", "Jean-Paul Mba · garant", "✓ Signé 24/03", "chip-green"), ("AM", "linear-gradient(135deg,#ffc21f,#f9a806)", "Toi · locataire", "À signer", "chip-sun")])
    contrat = card(f'''{ctitle("Contrat de location", chip("Action requise", "chip-sun"), "signature", "#a55a00", "#fff3c4")}
<div class="row g16 start"><div style="width:150px;height:196px;flex-shrink:0;border-radius:10px;background:#fff;border:1px solid #e1e6f3;box-shadow:0 8px 20px -10px rgba(0,0,0,.25);padding:14px;font-size:7px;color:#555;line-height:1.6;overflow:hidden"><b style="font-size:9px;color:{INK}">CONTRAT DE BAIL MEUBLÉ ÉTUDIANT</b><br>Entre M. Karim Benjelloun (le bailleur) et Mlle Amina Mba (la locataire)…<br><br>Article 1 – Objet : studio meublé de 28 m², Maârif, Casablanca.<br>Article 2 – Durée : 10 mois, du 01/09/2027 au 30/06/2028.<br>Article 3 – Loyer : 3 200 MAD + 350 MAD de charges…<br>Article 4 – Dépôt de garantie : 3 200 MAD, conservé en séquestre Navilease…</div>
<div class="col g10 f1">{sig}<a class="btn btn-primary" style="margin-top:6px">{icon("pen-line", 16, "#fff")} Lire et signer électroniquement</a><span class="muted s12">Signature par code SMS · valeur légale (loi 53-05) · copie PDF envoyée à tous</span></div></div>''', extra="border:2px solid #ffe08a")
    content = f'''<div class="col g20">{crumbs("Mon logement", "Réservation NL-2026-00342")}
<div class="row between"><div class="row g16">{house_ph(0, 72, "building", 16, "width:96px")}<div class="col g6"><div class="row g10"><h2 style="font-size:28px">Studio meublé · Maârif</h2>{chip("Contrat à signer", "chip-sun")}</div><span class="muted">Réservation NL-2026-00342 · du 01/09/2027 au 30/06/2028 · bailleur Karim B.</span></div></div>
<div class="row g10"><a class="btn btn-ghost">{icon("message-circle", 16, "#1336e0")} Écrire au bailleur</a><a class="btn btn-ghost" style="color:{ROSE};border-color:#ffc2cf">{icon("triangle-alert", 16, ROSE)} Signaler un incident</a></div></div>
<div class="card" style="padding:18px 26px;border-radius:20px;position:relative">{stepper(RES_STEPS, 3)}{ann("Étape en cours pulsée · coches animées", "right:20px;top:-12px")}</div>
<div class="row g20 start"><div class="col g20 f1">{contrat}
{card(f'''{ctitle("État des lieux d'entrée", chip("Prévu le 01/09/2027", "chip-blue"), "camera", BLUE)}<span class="muted s13">Le jour de ton arrivée, prends les photos pièce par pièce dans l'app. Le bailleur valide ; en cas d'écart, Navilease arbitre.</span><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">{edl}</div>
<div class="row g10 wr">{"".join(chip(t, "chip-gray") for t in ["Compteur électrique", "Clés × 2", "Badge immeuble", "Inventaire du mobilier (24 éléments)"])}</div>''')}
<div class="row g20 stretch">{card(ctitle("Loyers & quittances", link("Tout voir"), "receipt", VIOLET, "#f1edff") + f'<table class="tbl"><tr><th>Mois</th><th>Montant</th><th>Statut</th><th>Quittance</th></tr>{lt}</table><span class="muted s12">Prélèvement automatique possible par Airtel Money (compte du garant).</span>', extra="flex:1.3")}
{card(f'''{ctitle("Signaler un incident", "", "triangle-alert", ROSE, "#ffecef")}{select("Catégorie", "Plomberie / eau")}<div style="padding:10px 12px;border:1.5px solid #e1e6f3;border-radius:12px;font-size:13px;color:#9aa3c0;height:62px">Décris le problème…</div><div class="row g8">{ibox("camera", "#f6f8fe", "#3b4566", 36, 17)}<span class="muted s12 f1">Ajoute des photos</span><a class="btn" style="background:{ROSE};color:#fff;padding:9px 14px;font-size:13px">Envoyer</a></div><span class="muted s12">Urgence (fuite, sécurité) : le bailleur est alerté par SMS ; médiation Navilease sous 24 h.</span>''', extra="flex:1")}</div></div>
<div class="col g16" style="width:330px;flex-shrink:0">{card(f"""<div class="row g10">{ibox("lock-keyhole", "#e8f8ef", GREEN, 42, 20)}<div class="col"><b>Fonds en séquestre</b><span class="muted s12">payés le 22/03/2027 par Jean-Paul Mba</span></div></div><b style="font-size:28px;letter-spacing:-.8px">6 892 MAD</b><span class="muted s12">≈ {fmt(round(mad_xaf(6892), -2))} F CFA · Airtel Money</span>
<div class="col g8 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("1er loyer + charges", "3 550 MAD"), ("Caution", "3 200 MAD"), ("Frais de service", "142 MAD")])}</div><div class="row g8 s12" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:#0b5e30;font-weight:600">{icon("info", 15, GREEN)} Versés au bailleur le 03/09/2027 si aucun incident</div><a class="btn btn-ghost" style="padding:10px">{icon("file-down", 15, "#1336e0")} Reçu de paiement</a>""")}
{card(f"""<b class="s14">Ton arrivée</b>{"".join(f'<div class="row g10 s13">{icon(i, 16, BLUE)}<span class="soft">{t}</span></div>' for i, t in [("plane", "Vol Libreville → Casablanca · 30/08"), ("key-round", "Remise des clés : 01/09 à 10:00"), ("map-pin", "Adresse : 14, rue •••, Maârif (après signature)"), ("phone", "Contact bailleur débloqué après signature")])}""")}
{card(f"""<div class="row g10">{ibox("users-round", SUN, INK, 36, 17)}<b class="s14">Ton père est garant</b></div><span class="muted s12">Il voit les paiements et les quittances, et reçoit les alertes d'incident.</span>""", extra="background:linear-gradient(160deg,#fff7dd,#fff)")}</div></div></div>'''
    save("38-navilease-ma-reservation", page("Navilease — Ma réservation", space("etudiant", "Mon logement", content)))


ANNONCES = [("Studio meublé · Maârif", 0, "building", 3200, "Publiée", "chip-green", "1 / 1", 1240, 9, "visite"),
            ("Colocation 3 chambres · Gauthier", 1, "users", 2100, "Publiée", "chip-green", "2 / 3", 2310, 14, "partenaire"),
            ("Résidence Les Orangers · Bourgogne (6 studios)", 2, "hotel", 3800, "En modération", "chip-sun", "5 / 6", 860, 4, "identite"),
            ("Chambre · Racine", 3, "house", 1900, "Brouillon", "chip-gray", "—", 0, 0, "non")]


def s39_bailleur_dashboard():
    months = ["Oct.", "Nov.", "Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept."]
    rev = [9.6, 9.6, 12.4, 12.4, 14.2, 14.2, 14.2, 14.2, 12.0, 4.2, 6.0, 15.9]
    ann_rows = "".join(f'''<tr><td><div class="row g12">{house_ph(k, 46, i, 10, "width:62px;flex-shrink:0")}<div class="col"><b>{t}</b><span class="muted s12">{fmt(p)} MAD / mois · {chip(VERIF[v][1], VERIF[v][0])}</span></div></div></td><td>{chip(s, c)}</td><td><b>{o}</b></td><td>{fmt(vu)}</td><td>{d}</td><td><div class="row g6">{ibox("pencil", "#f6f8fe", "#3b4566", 30, 15, 9)}{ibox("eye", "#f6f8fe", "#3b4566", 30, 15, 9)}{ibox("ellipsis", "#f6f8fe", "#3b4566", 30, 15, 9)}</div></td></tr>''' for t, k, i, p, s, c, o, vu, d, v in ANNONCES)
    reqs = "".join(f'<div class="row g12 box">{avatar(a, 38, AV_BG[k], "#fff" if k else INK)}<div class="col f1"><b class="s13">{n}</b><span class="muted s12">{s}</span></div>{chip(x, y)}</div>' for k, (a, n, s, x, y) in enumerate([("AM", "Amina Mba", "Studio Maârif · admise ESA · garant parent", "Expire dans 31 h", "chip-sun"), ("MD", "Moussa Diallo", "Coloc Gauthier · admis ESCA", "Nouvelle", "chip-blue"), ("SE", "Salma El Idrissi", "Les Orangers · studio 4", "Nouvelle", "chip-blue")]))
    kyc = "".join(f'<div class="row g10 s13">{icon("circle-check" if ok else "hourglass", 17, GREEN if ok else "#a55a00")}<span class="f1 {"soft" if ok else "b"}">{t}</span>{"" if ok else chip("En vérification", "chip-sun")}</div>' for t, ok in [("Pièce d'identité (CIN)", True), ("Selfie de vérification", True), ("Titre de propriété · Maârif", True), ("Titre de propriété · Les Orangers", False), ("RIB pour les versements", True)])
    content = head("Bonjour Karim 👋", "Voici l'activité de vos logements Navilease", f'<a class="btn" style="background:{GREEN};color:#fff">{icon("plus", 16, "#fff")} Publier une annonce</a>') + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("TAUX D'OCCUPATION", "83 %", "8 lits occupés sur 10 (hors brouillon)", "bed-double", "#e8f8ef", GREEN, "+11 pts")}{kpi("REVENUS · SEPTEMBRE", "15 900 MAD", "après frais Navilease (4 %)", "hand-coins", "#eef4ff", BLUE, "+12 %")}{kpi("DEMANDES EN ATTENTE", "3", "dont 1 expire dans 31 h", "inbox", "#fff3c4", "#a55a00")}{kpi("EN SÉQUESTRE", "6 892 MAD", "versement prévu le 03/09", "lock-keyhole", "#f1edff", VIOLET)}</div>
<div class="row g20 stretch" style="margin-bottom:20px"><div class="card col g12" style="flex:1.6;padding:22px;border-radius:22px;position:relative">{ctitle("Revenus mensuels (milliers de MAD)", seg(["12 mois", "Année scolaire"], 0, GREEN, True), "chart-column", GREEN, "#e8f8ef")}{bar_svg(rev, months, 600, 300, GREEN, 11)}{ann("Barres qui montent en cascade · infobulle détaillée", "right:20px;top:-12px")}</div>
<div class="col g20" style="flex:1">{card(ctitle("Demandes à traiter", link("Tout voir", GREEN), "inbox", "#a55a00", "#fff3c4") + reqs)}{card(f'<div class="row between"><b style="font-size:16px">Vérification KYC</b>{chip("4 / 5", "chip-green")}</div>' + kyc)}</div></div>
<div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Mes annonces", f'{seg(["Toutes (4)", "Publiées", "En modération", "Brouillons"], 0, GREEN, True)}', "house", GREEN, "#e8f8ef")}<table class="tbl"><tr><th>Annonce</th><th>Statut</th><th>Occupation</th><th>Vues (30 j)</th><th>Demandes</th><th>Actions</th></tr>{ann_rows}</table></div>'''
    save("39-bailleur-dashboard", page("Navilease — Espace bailleur · Tableau de bord", space("bailleur", "Tableau de bord", content)))


def s40_bailleur_annonce():
    sec = lambda n, t: f'<div class="row g10"><div class="ic" style="width:28px;height:28px;border-radius:50%;background:#e8f8ef;color:{GREEN};font-weight:800;font-size:13px">{n}</div><b style="font-size:17px">{t}</b></div>'
    photos = "".join(f'<div style="position:relative">{house_ph(k, 104, i, 14)}{"<span class=chip style=position:absolute;left:8px;bottom:8px;background:#fff;color:#0b1533;padding:2px 8px>★ Couverture</span>" if k == 0 else ""}<div class="row g4" style="position:absolute;right:8px;top:8px">{ibox("trash-2", "#fff", ROSE, 24, 12, 7)}</div></div>' for k, i in enumerate(["sofa", "bed-double", "utensils", "bath"]))
    eq = [("Meublé", True), ("Wifi", True), ("Eau courante", True), ("Électricité incluse", True), ("Groupe électrogène / onduleur", False), ("Climatisation", True), ("Ventilateur", False), ("Cuisine équipée", True), ("Salle d'eau privative", True), ("Gardiennage 24h/24", True), ("Caméras de surveillance", True), ("Parking", False), ("Laverie", True), ("Espace de travail", True), ("Proche transports", True), ("Accessible PMR", False)]
    eqh = "".join(f'<span class="chip" style="padding:8px 12px;{"background:#e8f8ef;color:#0f8a46;border:1.5px solid #9fdcb7" if on else "background:#fff;color:#3b4566;border:1.5px solid #e6eaf5"}">{"✓ " if on else "+ "}{t}</span>' for t, on in eq)
    cal = "".join(f'<div class="ic s12 b" style="height:30px;border-radius:8px;{"background:#e8f8ef;color:#0f8a46" if d >= 1 and d <= 30 and d != 0 else ""}{";background:" + GREEN + ";color:#fff" if d == 1 else ""}">{d if d > 0 else ""}</div>' for d in [0, 0, 1, 2, 3, 4, 5] + list(range(6, 31)) + [0, 0, 0])
    near = "".join(f'<div class="row g10 box" style="padding:8px 10px">{logo(e, 30)}<b class="s13 f1">{ETABS[e]["sigle"]}</b><span class="muted s12">{d}</span>{cbox("", on, GREEN)}</div>' for e, d, on in [("ma-esa-casa", "12 min à pied", True), ("ma-emsi", "9 min à pied", True), ("ma-esca", "15 min", True), ("ma-uic", "24 min tram", False), ("ma-hem", "19 min tram", False)])
    form = f'''<div class="card col g18" style="flex:1;padding:28px;border-radius:24px;gap:18px;min-width:0;position:relative">
<div class="row between"><div class="col g4"><h3 style="font-size:20px">Modifier l'annonce</h3><span class="muted s13">Studio meublé · Maârif · publiée le 15/08/2026</span></div><div class="row g8">{chip("Brouillon enregistré à 14:32", "chip-gray")}</div></div>
{tabs(["1 · Logement", "2 · Photos", "3 · Prix", "4 · Équipements", "5 · Disponibilité", "6 · Écoles proches"], 0, GREEN)}
{sec(1, "Le logement")}
<div class="row g16 start">{select("Type", "Studio / appartement individuel", "building")}{field("Titre de l'annonce", "Studio meublé lumineux · Maârif", flex=1.5)}</div>
<div class="row g16 start">{field("Surface", "28 m²", "ruler")}{select("Étage", "3e · ascenseur")}{select("Capacité", "1 personne")}{select("Public", "Mixte · étudiants uniquement")}</div>
<div class="row g16 start">{field("Adresse exacte (privée)", "14, rue Ibnou Mounir, Maârif", "map-pin", flex=2, help_="Jamais affichée : seuls le quartier et un rayon de 300 m sont visibles avant signature")}{select("Ville", "Casablanca")}</div>
{sec(2, "Photos")}<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">{photos}<div class="col g4" style="height:104px;border:2px dashed #9fdcb7;border-radius:14px;align-items:center;justify-content:center;background:#f6fcf8">{icon("image-plus", 24, GREEN)}<span class="s12 b" style="color:{GREEN}">Ajouter</span></div></div><span class="muted s12">8 photos min. recommandées · pas de visage ni de document visible · l'équipe vérifie la cohérence lors de la visite.</span>
{sec(3, "Prix")}
<div class="row g16 start">{field("Loyer mensuel", "3 200 MAD")}{field("Charges", "350 MAD", help_="Eau, électricité, wifi")}{field("Caution", "3 200 MAD", help_="Max. 2 mois · en séquestre")}{select("Devise", "MAD", flex=.6)}</div>
<div class="row g10 s13" style="padding:12px 14px;border-radius:14px;background:#e8f8ef;color:#0b5e30">{icon("info", 16, GREEN)}<span>Vous recevrez <b>3 408 MAD / mois</b> (loyer + charges – 4 % de frais de service). Prix moyen dans le quartier : 2 900 – 3 600 MAD.</span></div>
{sec(4, "Équipements")}<div class="row g8 wr">{eqh}</div>
{sec(5, "Disponibilité")}
<div class="row g20 start"><div class="col g12 f1">{field("Disponible à partir du", "01/09/2027", "calendar")}{select("Durée minimale", "10 mois (année universitaire)")}<div class="row between s13"><span class="soft">Accepter les garants parents à l'étranger</span>{toggle(True, GREEN)}</div><div class="row between s13"><span class="soft">Réservation instantanée (admis vérifiés)</span>{toggle(False, GREEN)}</div></div>
<div class="col g8" style="width:280px"><div class="row between s13 b"><span>Septembre 2027</span><span class="row g4">{icon("chevron-left", 15, MUTED)}{icon("chevron-right", 15, MUTED)}</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">{"".join(f'<span class="muted" style="font-size:10px;text-align:center;font-weight:800">{d}</span>' for d in "LMMJVSD")}{cal}</div></div></div>
{sec(6, "Établissements proches")}<span class="muted s13">Calculés automatiquement depuis l'adresse · votre annonce apparaît aux admis de ces écoles.</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{near}</div>
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:16px"><a class="btn btn-ghost">Prévisualiser</a><a class="btn" style="background:{GREEN};color:#fff;padding:13px 22px">Enregistrer et soumettre à la modération</a></div>
{ann("Sections repliables · progression sauvegardée automatiquement", "right:24px;top:-12px")}</div>'''
    kyc_steps = [("id-card", "Pièce d'identité", "CIN marocaine · BE••••92", "Validé", "chip-green"), ("scan-face", "Selfie de vérification", "Correspondance 98 %", "Validé", "chip-green"),
                 ("file-badge" if False else "file-check-2", "Titre de propriété / contrat de gérance", "titre-foncier-maarif.pdf · 2,1 Mo", "En vérification", "chip-sun"),
                 ("landmark", "RIB (versements)", "Attijariwafa bank · •••• 4417", "Validé", "chip-green"), ("house", "Visite Navilease (badge ✓)", "À planifier · gratuite", "Facultatif", "chip-gray")]
    ks = "".join(f'<div class="row g12 box">{ibox(i, "#e8f8ef" if s == "Validé" else "#fff3c4" if s == "En vérification" else "#f1f3f8", GREEN if s == "Validé" else "#a55a00" if s == "En vérification" else "#3b4566", 38, 18)}<div class="col f1"><b class="s13">{t}</b><span class="muted s12">{d}</span></div>{chip(s, c)}</div>' for i, t, d, s, c in kyc_steps)
    side = f'''<div class="col g16" style="width:360px;flex-shrink:0">{card(f"""<div class="row between"><b style="font-size:17px">Vérification KYC</b>{ring(75, 52, GREEN, "3/4")}</div><span class="muted s13">Obligatoire pour publier et recevoir des paiements. Données chiffrées, consultées uniquement par l'équipe conformité.</span>{ks}
{upload_zone("Remplacer le titre de propriété", "PDF · scan lisible", 104, GREEN)}""", extra="border:2px solid #bfe9cf")}
{card(f"""<b class="s14">Qualité de l'annonce</b><div class="row g12">{ring(86, 56, GREEN)}<div class="col g4 s12">{"".join(f'<span class="row g6">{icon("check" if ok else "circle-alert", 13, GREEN if ok else "#c27803", 3 if ok else 2)}{t}</span>' for t, ok in [("Titre et description", True), ("6 photos (8 recommandées)", False), ("Prix dans la moyenne", True), ("Établissements proches", True)])}</div></div>""")}
{card(f"""<div class="row g8">{icon("shield-check", 18, GREEN)}<b class="s14">Charte bailleur</b></div><span class="muted s12">Pas de paiement hors plateforme, annonce conforme à la réalité, caution ≤ 2 mois, logement décent. Tout manquement entraîne la suspension.</span>""")}</div>'''
    content = f'<div class="col g20">{crumbs("Mes annonces", "Studio meublé · Maârif", "Modifier")}<div class="row g24 start">{form}{side}</div></div>'
    save("40-bailleur-annonce-kyc", page("Navilease — Espace bailleur · Annonce & KYC", space("bailleur", "Mes annonces", content)))


def s41_bailleur_demandes():
    reqs = [("AM", "Amina Mba", "🇬🇦 Gabon · 17 ans · admise ESA Casablanca", "Studio meublé · Maârif", "01/09/2027 · 10 mois", "Expire dans 31 h", "chip-sun"),
            ("MD", "Moussa Diallo", "🇸🇳 Sénégal · 19 ans · admis ESCA", "Coloc Gauthier · ch. 2", "05/09/2027 · 10 mois", "Nouvelle", "chip-blue"),
            ("SE", "Salma El Idrissi", "🇲🇦 Maroc · 21 ans · Master ESA", "Les Orangers · studio 4", "01/10/2027 · 9 mois", "Nouvelle", "chip-blue")]
    rl = "".join(f'''<div class="row g12 start" style="padding:14px;border-radius:16px;{"background:#e8f8ef;border:2px solid " + GREEN if k == 0 else "border:1px solid #eef1f8;background:#fff"}">{avatar(a, 42, AV_BG[k], "#fff" if k else INK)}<div class="col g2 f1"><div class="row between"><b class="s14">{n}</b>{chip(x, y)}</div><span class="muted s12">{s}</span><span class="s12 b soft">{l} · {d}</span></div></div>''' for k, (a, n, s, l, d, x, y) in enumerate(reqs))
    detail = f'''<div class="card col g16" style="flex:1;padding:24px;border-radius:24px;min-width:0;position:relative">
<div class="row between"><div class="row g14">{avatar("AM", 58)}<div class="col g2"><b style="font-size:19px">Amina Mba</b><span class="muted s13">🇬🇦 Gabonaise · 17 ans · Bachelor business à l'ESA Casablanca</span></div></div>{chip("Profil vérifié par Navigoal", "chip-green")}</div>
<div class="row g10">{"".join(f'<div class="col g2 f1 box"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><b class="s13">{b}</b></div>' for a, b in [("LOGEMENT", "Studio · Maârif"), ("ENTRÉE", "01/09/2027"), ("DURÉE", "10 mois"), ("MONTANT", "6 892 MAD")])}</div>
<div class="col g8"><span class="lbl">Dossier locataire</span>{"".join(f'<div class="row g10 s13 box" style="padding:9px 12px">{icon(i, 16, BLUE)}<b class="f1">{t}</b>{chip(s, c)}{icon("eye", 16, MUTED)}</div>' for i, t, s, c in [("award", "Attestation d'admission ESA", "Vérifiée", "chip-green"), ("id-card", "Passeport", "Vérifié", "chip-green"), ("users-round", "Garant : Jean-Paul Mba (père)", "Acte de caution signé", "chip-green"), ("file-text", "Revenus du garant", "Vérifiés", "chip-green")])}</div>
<div class="col g6"><span class="lbl">Message</span><div style="padding:12px 14px;border-radius:12px;background:#f6f8fe;font-size:13px;line-height:1.55" class="soft">« Bonjour, je suis admise en Bachelor à l'ESA pour la rentrée 2027. Je suis calme et non-fumeuse ; mon père sera garant. J'arrive de Libreville fin août. Merci ! »</div></div>
<div class="row g10 s12" style="padding:10px 12px;border-radius:12px;background:#fff3c4;color:#7a4b00;font-weight:600">{icon("info", 15, "#a55a00")} Locataire mineure : le contrat sera co-signé par le garant. Sans réponse sous 31 h, la demande expire.</div>
<div class="row g10"><a class="btn" style="background:{GREEN};color:#fff;flex:1">{icon("check", 16, "#fff", 3)} Accepter et proposer le contrat</a><a class="btn btn-ghost" style="color:{ROSE};border-color:#ffc2cf">Refuser</a><a class="btn btn-ghost">{icon("message-circle", 16, "#1336e0")} Message</a></div>
{ann("Acceptation : contrat type pré-rempli + demande de paiement envoyée", "right:24px;top:-12px")}</div>'''
    res = [("Ousmane Touré", "Studio Maârif", "01/09/2026 → 30/06/2027", "Terminée", "chip-gray", "Caution restituée", "10 / 10"), ("Fatou Sow", "Coloc Gauthier · ch. 1", "05/09/2026 → 30/06/2027", "En cours", "chip-green", "Signé", "7 / 10"),
           ("Grâce Ondo Mve", "Coloc Gauthier · ch. 3", "05/09/2026 → 30/06/2027", "En cours", "chip-green", "Signé", "7 / 10"), ("Amina Mba", "Studio Maârif", "01/09/2027 → 30/06/2028", "Contrat à signer", "chip-sun", "2 / 3 signatures", "—")]
    rt = "".join(f'<tr><td><b>{n}</b></td><td>{l}</td><td class="muted">{d}</td><td>{chip(s, c)}</td><td>{ct}</td><td>{q}</td><td>{ibox("download", "#f6f8fe", "#3b4566", 30, 15, 9) if q != "—" else ""}</td></tr>' for n, l, d, s, c, ct, q in res)
    enc = [("Séquestre · Amina Mba", "6 892 MAD", "Bloqué · libération 03/09/2027", "chip-violet"), ("Loyer octobre · Fatou Sow", "2 400 MAD", "Versé le 07/10", "chip-green"), ("Loyer octobre · Grâce Ondo Mve", "2 400 MAD", "Versé le 07/10", "chip-green"), ("Caution · Ousmane Touré", "– 3 200 MAD", "Restituée le 05/07", "chip-gray")]
    et = "".join(f'<div class="row g12 box" style="padding:10px 12px">{ibox("hand-coins", "#e8f8ef", GREEN, 34, 16, 10)}<div class="col f1"><b class="s13">{t}</b><span class="muted s12">{s}</span></div><b class="s13">{a}</b></div>' for t, a, s, c in enc)
    content = head("Demandes & réservations", "3 demandes en attente · 3 réservations en cours", f'<a class="btn btn-ghost" style="color:{GREEN};border-color:#9fdcb7">{icon("file-spreadsheet", 16, GREEN)} Export comptable</a>') + f'''
<div class="row g20 start" style="margin-bottom:20px"><div class="col g10" style="width:360px;flex-shrink:0">{seg(["Demandes (3)", "Acceptées", "Refusées"], 0, GREEN, True)}{rl}</div>{detail}</div>
<div class="row g20 start" style="flex-direction:column;align-items:stretch"><div class="card col g12" style="padding:22px;border-radius:22px;min-width:0">{ctitle("Réservations & contrats", link("Tout voir", GREEN), "calendar-check", GREEN, "#e8f8ef")}<table class="tbl"><tr><th>Locataire</th><th>Logement</th><th>Période</th><th>Statut</th><th>Contrat</th><th>Quittances</th><th></th></tr>{rt}</table></div>
<div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Encaissements", "", "wallet", GREEN, "#e8f8ef")}<div class="row g10">{"".join(f'<div class="col g2 f1 box"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><b class="s14">{b}</b></div>' for a, b in [("EN SÉQUESTRE", "6 892 MAD"), ("VERSÉ EN OCT.", "4 800 MAD"), ("PROCHAIN VERSEMENT", "03/09/2027"), ("QUITTANCES ÉMISES", "24")])}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{et}</div></div></div>'''
    save("41-bailleur-demandes", page("Navilease — Espace bailleur · Demandes & réservations", space("bailleur", "Demandes", content)))


# =====================================================================================
# 42–47. BACK-OFFICE
# =====================================================================================
ADM = "#ff3d7f"


def s42_admin_dashboard():
    months = ["Nov.", "Déc.", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct."]
    ins = [1200, 1850, 2600, 3400, 4100, 3900, 3300, 4800, 5200, 4600, 6900, 6380]
    act = [800, 1300, 1900, 2500, 3100, 2900, 2600, 3500, 3700, 3300, 5100, 4900]
    funnel = [("Visiteurs uniques", 412000, "#dae6ff"), ("Inscriptions", 48230, "#bcd2ff"), ("Tests d'orientation", 31450, "#8eb4ff"), ("Candidatures", 6912, "#598bff"), ("Admissions", 1840, BLUE), ("Logements réservés", 412, "#ffc21f")]
    fn = ""
    prev = None
    for a, b, c in funnel:
        conv = f'{b/prev*100:.1f} %'.replace(".", ",") if prev else "—"
        fn += f'<div class="row g12"><span class="s13 b" style="width:150px">{a}</span><div class="f1" style="height:34px;border-radius:9px;background:#f6f8fe"><div style="width:{max(5, (b/412000)**0.32*100):.0f}%;height:100%;border-radius:9px;background:{c}"></div></div><b class="s13" style="width:70px;text-align:right">{fmt(b)}</b><span class="chip chip-gray" style="width:70px;justify-content:center">{conv}</span></div>'
        prev = b
    pays = [("🇬🇦 Gabon", 14820, 9610, 2110, 560), ("🇲🇦 Maroc", 16940, 10880, 2480, 690), ("🇸🇳 Sénégal", 12650, 8330, 1890, 470), ("Autres (14 pays)", 3820, 2630, 432, 120)]
    pt = "".join(f'<tr><td><b>{a}</b></td><td style="text-align:right">{fmt(b)}</td><td style="text-align:right">{fmt(c)}</td><td style="text-align:right">{fmt(d)}</td><td style="text-align:right">{fmt(e)}</td><td style="width:120px"><div class="bar" style="height:6px"><div style="width:{b/16940*100:.0f}%"></div></div></td></tr>' for a, b, c, d, e in pays)
    alerts = "".join(f'<div class="row g12 box">{ibox(i, bg, c, 36, 17)}<div class="col f1"><b class="s13">{t}</b><span class="muted s12">{s}</span></div><a class="s12 b" style="color:{BLUE}">Traiter</a></div>' for i, bg, c, t, s in [("building-2", "#f1edff", VIOLET, "7 revendications d'établissement", "dont ESMT, UIC, ISM Dakar"), ("house", "#fff3c4", "#a55a00", "12 annonces à modérer", "délai moyen 9 h"), ("shield-alert", "#ffecef", ROSE, "3 litiges Navilease ouverts", "1 urgent : fuite d'eau, Dakar"), ("flag", "#ffecef", ROSE, "2 signalements de messages", "paiement hors plateforme")])
    content = head("Tableau de bord", "Données au 09/10/2026 · 08:00 GMT · tous pays", f'{seg(["7 j", "30 j", "12 mois"], 2, INK, True)}<a class="btn btn-ghost" style="color:{INK};border-color:#d6dcec">{icon("download", 16, INK)} Export</a>', "Back-office") + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("INSCRITS", "48 230", "+6 380 ce mois", "users", "#eef4ff", BLUE, "+14 %")}{kpi("ACTIFS (30 J)", "19 870", "41 % des inscrits", "activity", "#e8f8ef", GREEN, "+9 %")}{kpi("TESTS RÉALISÉS", "31 450", "65 % des inscrits", "compass", "#e6f6fb", TEAL, "+11 %")}{kpi("CANDIDATURES", "6 912", "79 établissements", "file-text", "#f1edff", VIOLET, "+22 %")}{kpi("ADMISSIONS", "1 840", "taux 26,6 %", "badge-check", "#fff3c4", "#a55a00", "+18 %")}</div>
<div class="row g20 stretch" style="margin-bottom:20px"><div class="card col g12" style="flex:1.5;padding:22px;border-radius:22px;position:relative">{ctitle("Inscriptions et utilisateurs actifs", f'<span class="row g6 s12 b"><span style="width:10px;height:10px;border-radius:3px;background:{BLUE}"></span>Inscriptions</span><span class="row g6 s12 b muted"><span style="width:10px;height:10px;border-radius:3px;background:{GREEN}"></span>Actifs</span>', "chart-line")}{line_svg([ins, act], months, 640, 230, (BLUE, GREEN))}{ann("Pic de septembre : rentrée + campagne radio Gabon", "right:20px;top:-12px")}</div>
<div class="card col g12" style="flex:1;padding:22px;border-radius:22px">{ctitle("Alertes de modération", chip("24", "chip-rose"), "bell", ROSE, "#ffecef")}{alerts}</div></div>
<div class="row g20 stretch" style="margin-bottom:20px"><div class="card col g12" style="flex:1.5;padding:22px;border-radius:22px">{ctitle("Entonnoir de conversion", chip("12 mois", "chip-gray"), "filter")}{fn}<span class="muted s12">Taux global Visiteur → Logement : 0,1 % · Inscription → Admission : 3,8 %</span></div>
<div class="card col g14" style="flex:1;padding:22px;border-radius:22px;gap:14px;background:linear-gradient(160deg,#fff,#fff7dd)">{ctitle("Navilease", chip("3 pays", "chip-sun"), "key-round", "#a55a00", "#fff3c4")}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{"".join(f'<div class="col g2 box"><span class="muted" style="font-size:11px;font-weight:700">{a}</span><b style="font-size:20px">{b}</b><span class="muted s12">{c}</span></div>' for a, b, c in [("ANNONCES ACTIVES", "1 284", "+96 ce mois"), ("TAUX DE VÉRIFICATION", "71 %", "visitées ou certifiées"), ("LITIGES OUVERTS", "3", "0,7 % des séjours"), ("EN SÉQUESTRE", "1,9 M MAD", "≈ 114 M F CFA")])}</div>
{hbar("Délai moyen de réponse bailleur", 62, 100, "#f9a806", "5 h 40")}{hbar("Taux d'acceptation des demandes", 78, 100, GREEN, "78 %")}</div></div>
<div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Par pays", link("Rapport détaillé"), "globe")}<table class="tbl"><tr><th>Pays</th><th style="text-align:right">Inscrits</th><th style="text-align:right">Tests</th><th style="text-align:right">Candidatures</th><th style="text-align:right">Admissions</th><th></th></tr>{pt}</table></div>'''
    save("42-admin-dashboard", page("Navigoal — Back-office · Tableau de bord", space("admin", "Tableau de bord", content)))


def s43_admin_utilisateurs():
    users = [("Amina Mba", "AM", "Étudiant·e", "chip-blue", "🇬🇦", "12/09/2026", "Aujourd'hui 08:02", "Actif", "chip-green"),
             ("Jean-Paul Mba", "JM", "Parent", "chip-sun", "🇬🇦", "12/09/2026", "Hier", "Actif", "chip-green"),
             ("Service admissions ESMT", "ES", "Établissement", "chip-violet", "🇸🇳", "05/10/2026", "—", "À valider", "chip-sun"),
             ("Karim Benjelloun", "KB", "Bailleur", "chip-green", "🇲🇦", "02/08/2026", "Aujourd'hui 07:41", "Actif", "chip-green"),
             ("Ibrahima Fall", "IF", "Bailleur", "chip-green", "🇸🇳", "28/09/2026", "03/10/2026", "Suspendu", "chip-rose"),
             ("Moussa Diallo", "MD", "Étudiant·e", "chip-blue", "🇸🇳", "14/09/2026", "Hier", "Actif", "chip-green"),
             ("Yann Mba", "YM", "Élève", "chip-teal", "🇬🇦", "09/10/2026", "Aujourd'hui 07:55", "Attente parent", "chip-sun"),
             ("UIC — Admissions", "UI", "Établissement", "chip-violet", "🇲🇦", "07/10/2026", "—", "À valider", "chip-sun"),
             ("Salma El Idrissi", "SE", "Étudiant·e", "chip-blue", "🇲🇦", "20/09/2026", "07/10/2026", "Actif", "chip-green"),
             ("Compte inconnu", "??", "Bailleur", "chip-green", "🇨🇮", "08/10/2026", "08/10/2026", "Non vérifié", "chip-gray")]
    rows = "".join(f'''<tr class="{"sel" if k == 2 else ""}"><td><div class="row g10">{avatar(i, 34, AV_BG[k % 6], "#fff" if k % 6 else INK)}<div class="col"><b>{n}</b><span class="muted s12">{n.split()[0].lower().replace("—", "")}@•••.com</span></div></div></td><td>{chip(r, rc)}</td><td>{p}</td><td class="muted" style="white-space:nowrap">{l}</td><td>{chip(s, sc)}</td>
<td><div class="row g6">{(f'<a class="btn" style="padding:6px 10px;font-size:12px;background:{VIOLET};color:#fff">Valider</a>' if s == "À valider" else ibox("eye", "#f6f8fe", "#3b4566", 30, 15, 9))}{ibox("ban" if s != "Suspendu" else "rotate-ccw", "#f6f8fe", ROSE if s != "Suspendu" else GREEN, 30, 15, 9)}{"" if s == "À valider" else ibox("ellipsis", "#f6f8fe", "#3b4566", 30, 15, 9)}</div></td></tr>''' for k, (n, i, r, rc, p, d, l, s, sc) in enumerate(users))
    panel = f'''<div class="col g16" style="width:310px;flex-shrink:0">{card(f"""<div class="row g12">{logo("sn-esmt", 52)}<div class="col"><b>Service admissions ESMT</b><span class="muted s12">Rôle demandé : Établissement · Dakar</span></div></div><span class="s12" style="padding:8px 10px;border-radius:10px;background:#f1edff;color:#6a3df0;font-weight:700">Revendique : École Supérieure Multinationale des Télécommunications</span>
<div class="col g8">{"".join(f'<div class="row g10 s13">{icon(i, 17, c)}<span class="f1 soft">{t}</span></div>' for i, c, t in [("circle-check", GREEN, "E-mail sur le domaine officiel esmt.sn"), ("circle-check", GREEN, "Arrêté d'agrément / accord inter-États joint"), ("circle-alert", "#c27803", "Mandat du directeur : signature à vérifier"), ("circle-check", GREEN, "Téléphone vérifié (+221)")])}</div>
<div class="col g6"><span class="lbl">Note de validation</span><div class="inp"><span class="ph s13">Appel de contrôle effectué le…</span></div></div>
<div class="row g8"><a class="btn f1" style="background:{GREEN};color:#fff;padding:11px">Valider le compte</a><a class="btn btn-ghost" style="padding:11px;color:{ROSE};border-color:#ffc2cf">Refuser</a></div>{ann("Validation : journalisée dans l'audit", "right:16px;top:-12px")}""", extra="position:relative;border:2px solid #d9ccff")}
{card(f"""<div class="row g8">{icon("ban", 17, ROSE)}<b class="s14">Suspendre un compte</b></div>{select("Motif", "Demande de paiement hors plateforme")}{select("Durée", "30 jours")}{cbox("Prévenir l'utilisateur par e-mail et SMS", True, ROSE, 13)}<a class="btn" style="background:{ROSE};color:#fff;padding:10px">Suspendre</a>""")}</div>'''
    content = head("Utilisateurs", "48 230 comptes · 2 comptes établissement à valider", f'<a class="btn btn-ghost" style="color:{INK};border-color:#d6dcec">{icon("file-spreadsheet", 16, INK)} Export CSV</a><a class="btn" style="background:{INK};color:#fff">{icon("user-plus", 16, "#fff")} Inviter un admin</a>', "Back-office") + f'''
<div class="row g10" style="margin-bottom:16px"><div class="inp" style="width:260px;min-height:42px;padding:9px 12px">{icon("search", 16, MUTED)}<span class="ph s13">Nom, e-mail, téléphone…</span></div>{"".join(f'<div class="inp" style="min-height:42px;padding:9px 12px;font-size:13px;white-space:nowrap">{a}{icon("chevron-down", 14, MUTED)}</div>' for a in ["Rôle : tous", "Pays : tous", "Statut : tous", "Inscrit : 30 j"])}</div>
<div class="row g8 wr" style="margin-bottom:16px">{"".join(f'<span class="chip" style="padding:8px 12px;background:#fff;border:1px solid #e6eaf5;color:#3b4566">{t} <b style="opacity:.6">{n}</b></span>' for t, n in [("Élèves", "21 400"), ("Étudiant·e·s", "19 730"), ("Parents", "5 820"), ("Établissements", "86"), ("Bailleurs", "1 190"), ("Admins", "4")])}</div>
<div class="row g20 start"><div class="card f1" style="border-radius:20px;overflow:hidden;min-width:0"><table class="tbl"><tr><th>Utilisateur</th><th>Rôle</th><th>Pays</th><th>Connexion</th><th>Statut</th><th>Actions</th></tr>{rows}</table>
<div class="row between" style="padding:14px 18px"><span class="muted s13">1–10 sur 48 230</span><div class="row g6">{"".join(f'<div class="ic s13 b" style="width:34px;height:34px;border-radius:10px;{"background:" + INK + ";color:#fff" if k == 1 else "background:#f6f8fe"}">{t}</div>' for k, t in enumerate(["‹", "1", "2", "3", "…", "›"]))}</div></div></div>{panel}</div>'''
    save("43-admin-utilisateurs", page("Navigoal — Back-office · Utilisateurs", space("admin", "Utilisateurs", content)))


def s44_admin_etablissements():
    claims = [("sn-esmt", "Service admissions ESMT", "admissions@esmt.sn", "Domaine officiel ✓", "3 / 3", "À vérifier", "chip-sun"),
              ("ma-uic", "Direction communication UIC", "com@uic.ac.ma", "Domaine officiel ✓", "2 / 3", "Pièce manquante", "chip-rose"),
              ("sn-ism", "Responsable admissions ISM", "admissions@ism.sn", "Domaine officiel ✓", "3 / 3", "À vérifier", "chip-sun"),
              ("ga-bbs", "BBS — Scolarité", "scolarite.bbs@gmail.com", "Domaine générique ⚠", "3 / 3", "Contrôle renforcé", "chip-rose"),
              ("ma-emsi", "EMSI Casablanca", "admission@emsi.ma", "Domaine officiel ✓", "3 / 3", "Validée", "chip-green")]
    ct = "".join(f'<tr class="{"sel" if k == 0 else ""}"><td><div class="row g10">{logo(e, 36)}<div class="col"><b>{ETABS[e]["sigle"]}</b><span class="muted s12">{ETABS[e]["ville"].split(" /")[0]}, {NOMS[ETABS[e]["pays"]]}</span></div></div></td><td><div class="col"><b class="s13">{n}</b><span class="muted s12">{m}</span></div></td><td><span class="s12 b" style="color:{GREEN if "✓" in d else "#c27803"}">{d}</span></td><td>{p}</td><td>{chip(s, c)}</td><td>{ibox("eye", "#f6f8fe", "#3b4566", 30, 15, 9)}</td></tr>' for k, (e, n, m, d, p, s, c) in enumerate(claims))
    feat = [("🇲🇦 Maroc · Gestion", ["ma-esa-casa", "ma-hem", "ma-esca"]), ("🇸🇳 Sénégal · Numérique", ["sn-esmt", "sn-isi", "sn-dit"]), ("🇬🇦 Gabon · Accueil", ["ga-ista", "ga-esgis", "ga-ufgse"]), ("Page d'accueil", ["ma-um6p", "ma-uir", "sn-supdeco"])]
    ft = "".join(f'<div class="col g10 box" style="padding:14px"><div class="row between"><b class="s13">{t}</b><span class="muted s12">{len(ids)}/4 emplacements</span></div><div class="row g8">{"".join(logo(i, 40) for i in ids)}<div class="ic" style="width:40px;height:40px;border-radius:12px;border:2px dashed #cdd5ea">{icon("plus", 16, MUTED)}</div></div></div>' for t, ids in feat)
    plans = [("Gratuit", "0 F CFA", "61 établissements", ["Fiche vérifiée", "Candidatures en ligne", "Statistiques de base"], False), ("Partenaire", "350 000 F CFA / an", "14 établissements", ["Mise en avant pays/domaine", "Campagnes & événements", "Statistiques avancées"], True), ("Premium", "Sur devis", "4 établissements", ["Page d'accueil", "Tournées & salons", "Account manager"], False)]
    pl = "".join(f'<div class="col g10 f1" style="padding:18px;border-radius:18px;{"background:#0b1533;color:#fff" if on else "background:#fff;border:1px solid #e6eaf5"}"><div class="row between"><b>{t}</b>{chip(n, "chip-sun" if on else "chip-gray")}</div><b style="font-size:20px">{p}</b>{"".join(f"<div class='row g8 s12'>{icon('check', 13, SUN if on else GREEN, 3)}{x}</div>" for x in xs)}</div>' for t, p, n, xs, on in plans)
    content = head("Établissements", "79 établissements au catalogue · 7 revendications en attente", f'<a class="btn" style="background:{INK};color:#fff">{icon("plus", 16, "#fff")} Ajouter un établissement</a>', "Back-office") + f'''
{tabs(["Revendications (7)", "Catalogue (79)", "Mise en avant", "Plans & facturation", "Signalements (1)"], 0, INK)}
<div class="row g20 start" style="margin-top:20px;margin-bottom:20px"><div class="card f1" style="border-radius:20px;overflow:hidden;min-width:0"><table class="tbl"><tr><th>Établissement</th><th>Demandeur</th><th>E-mail</th><th>Pièces</th><th>Statut</th><th></th></tr>{ct}</table></div>
<div class="col g14" style="width:360px;flex-shrink:0;gap:14px">{card(f"""<div class="row g12">{logo("sn-esmt", 48)}<div class="col"><b>ESMT · revendication</b><span class="muted s12">reçue le 05/10/2026 · SLA 48 h</span></div></div>
{"".join(doc_row(n, m, s, c, i, False) for n, m, s, c, i in [("Accord inter-États / statut", "PDF · 4 pages", "Conforme", "chip-green", "scroll-text"), ("Mandat du directeur général", "Signé le 01/10/2026", "À vérifier", "chip-sun", "signature"), ("Pièce d'identité du mandataire", "Passeport sénégalais", "Conforme", "chip-green", "id-card")])}
<div class="row g8"><a class="btn f1" style="background:{GREEN};color:#fff;padding:11px">Approuver</a><a class="btn btn-ghost" style="padding:11px;color:{ROSE};border-color:#ffc2cf">Rejeter</a><a class="btn btn-ghost" style="padding:11px">Demander</a></div>{ann("Approbation = badge « vérifié » + accès à l'espace", "right:14px;top:-12px")}""", extra="position:relative")}</div></div>
<div class="col g20"><div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Mise en avant", link("Planifier"), "star", "#a55a00", "#fff3c4")}<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">{ft}</div></div>
<div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Plans", "", "award", VIOLET, "#f1edff")}<div class="row g10 stretch">{pl}</div></div></div>'''
    save("44-admin-etablissements", page("Navigoal — Back-office · Établissements", space("admin", "Établissements", content)))


def s45_admin_referentiels():
    fl = [f for f in FORMATIONS.values() if f["domaine"] == "dom-numerique"][:9]
    rows = "".join(f'<tr class="{"sel" if k == 2 else ""}"><td><div class="col"><b>{f["intitule"][:60]}</b><span class="muted s12">{f["id"]}</span></div></td><td>{chip(f["diplome"][:22], "chip-blue")}</td><td>{f["duree_annees"]} ans</td><td>{len(f["metiers"])}</td><td>{len(f["etablissements"])}</td><td>{ibox("pencil", "#f6f8fe", "#3b4566", 30, 15, 9)}</td></tr>' for k, f in enumerate(fl))
    F = fl[2]
    edit = card(f'''<div class="row between"><b style="font-size:16px">Modifier</b>{chip(F["id"], "chip-gray")}</div>{field("Intitulé", F["intitule"])}<div class="row g10 start">{select("Domaine", "Informatique, numérique…")}{select("Niveau", F["niveau"].replace("niv-bac", "Bac+"))}</div>
<div class="col g6"><span class="lbl">Métiers liés ({len(F["metiers"])})</span><div class="row g6 wr">{"".join(chip(METIERS[m]["nom"][:28] + " ×", "chip-violet") for m in F["metiers"])}</div></div>
<div class="col g6"><span class="lbl">Séries recommandées · Gabon</span><div class="row g6 wr">{"".join(chip(SERIES[s]["code"] + " ×", "chip-blue") for s in F["series_recommandees"].get("GA", []))}</div></div>
<div class="row g8 s12" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:#0b5e30;font-weight:600">{icon("circle-check", 15, GREEN)} Contrôle d'intégrité OK (identifiants, liens croisés)</div>
<div class="row g8"><a class="btn btn-ghost f1" style="padding:10px">Annuler</a><a class="btn f1" style="background:{INK};color:#fff;padding:10px">Enregistrer · v1.1.0</a></div>''', pad=20)
    hist = "".join(f'<div class="row g12 start"><div class="col" style="align-items:center"><div style="width:12px;height:12px;border-radius:50%;background:{INK if k == 0 else "#cdd5ea"};margin-top:4px"></div>{"<div style=width:2px;height:34px;background:#e6eaf5></div>" if k < 3 else ""}</div><div class="col g2 f1"><div class="row between"><b class="s13">{v}</b><span class="muted s12">{d}</span></div><span class="muted s12">{t}</span></div></div>' for k, (v, d, t) in enumerate([("formations v1.1.0 · brouillon", "09/10/2026", "Sarah Nzé · 1 modification (séries GA)"), ("formations v1.0.0", "08/10/2026", "Import JSON · 93 formations · validé"), ("métiers v1.0.0", "08/10/2026", "96 métiers · 77 compétences liées"), ("établissements v1.2.0", "07/10/2026", "79 privés / inter-États · logos & photos")]))
    content = head("Référentiels", "Données de référence partagées par tout Navigoal · contrôle : validate_referentiels.py", f'<a class="btn btn-ghost" style="color:{INK};border-color:#d6dcec">{icon("upload", 16, INK)} Importer CSV / JSON</a><a class="btn btn-ghost" style="color:{INK};border-color:#d6dcec">{icon("download", 16, INK)} Exporter</a><a class="btn" style="background:{INK};color:#fff">{icon("plus", 16, "#fff")} Ajouter</a>', "Back-office") + f'''
{tabs([f"Formations ({len(FORMATIONS)})", f"Métiers ({len(METIERS)})", f"Séries ({len(SERIES)})", "Compétences (77)", "Domaines (20)", "Établissements (79)", "Pays (3)", "Coûts"], 0, INK)}
<div class="row g10" style="margin:18px 0"><div class="inp" style="width:280px;min-height:42px;padding:9px 12px">{icon("search", 16, MUTED)}<span class="ph s13">Rechercher dans les formations</span></div>{"".join(f'<div class="inp" style="min-height:42px;padding:9px 12px;font-size:13px;white-space:nowrap">{a}{icon("chevron-down", 14, MUTED)}</div>' for a in ["Domaine : numérique", "Niveau : tous", "Admission : tous"])}<span class="row g6 s12 b" style="margin-left:auto;color:{GREEN}">{icon("circle-check", 15, GREEN)} 0 erreur · 2 avertissements</span></div>
<div class="row g20 start"><div class="col g20 f1" style="min-width:0"><div class="card" style="border-radius:20px;overflow:hidden"><table class="tbl"><tr><th>Intitulé · identifiant</th><th>Diplôme</th><th>Durée</th><th>Métiers</th><th>Écoles</th><th></th></tr>{rows}</table></div>
<div class="row g20 stretch">{card(ctitle("Import", "", "file-json", INK, "#f1f3f8") + upload_zone("Dépose un fichier CSV ou JSON", "Prévisualisation des changements avant publication", 120, INK) + '<div class="row g8 s12"><span class="chip chip-green">+ 3 ajouts</span><span class="chip chip-sun">~ 5 modifications</span><span class="chip chip-rose">– 0 suppression</span></div>', extra="flex:1")}
{card(ctitle("Historique des versions", link("Comparer"), "history", INK, "#f1f3f8") + hist, extra="flex:1")}</div></div>
<div class="col" style="width:340px;flex-shrink:0;position:relative">{edit}{ann("Tiroir d'édition : glisse depuis la droite", "right:14px;top:-12px")}</div></div>'''
    save("45-admin-referentiels", page("Navigoal — Back-office · Référentiels", space("admin", "Référentiels", content)))


def s46_admin_navilease():
    ann_cards = "".join(f'''<div class="card" style="border-radius:18px;overflow:hidden"><div class="row" style="height:110px">{house_ph(k, 110, i, 0, "flex:1.4")}<div class="col" style="flex:1">{house_ph(k + 2, 55, "bed-double", 0)}{house_ph(k + 3, 55, "bath", 0)}</div></div>
<div class="col g8" style="padding:14px"><b class="s13">{t}</b><span class="muted s12">{b} · {p}</span><div class="col g4 s12">{"".join(f"<span class='row g6'>{icon('circle-check' if ok else 'circle-alert', 13, GREEN if ok else '#c27803')}{x}</span>" for x, ok in checks)}</div>
<div class="row g6"><a class="btn f1" style="background:{GREEN};color:#fff;padding:8px;font-size:12px">Publier</a><a class="btn btn-ghost" style="padding:8px 10px;font-size:12px">Corriger</a><a class="btn btn-ghost" style="padding:8px 10px;font-size:12px;color:{ROSE};border-color:#ffc2cf">Rejeter</a></div></div></div>''' for k, (t, b, p, i, checks) in enumerate([
        ("Résidence Les Orangers · Bourgogne", "Karim B. · Casablanca", "3 800 MAD", "hotel", [("Photos cohérentes (6)", True), ("Prix dans la moyenne", True), ("Titre de propriété en vérification", False)]),
        ("Chambre · Mermoz", "Awa N. · Dakar", "85 000 F CFA", "house", [("Photos cohérentes (5)", True), ("Prix dans la moyenne", True), ("Numéro de téléphone dans la description", False)]),
        ("Studio · Batterie IV", "Serge O. · Libreville", "180 000 F CFA", "building", [("Photos : 2 doublons sur le web", False), ("Prix 40 % sous la moyenne", False), ("Identité vérifiée", True)])]))
    kyc = "".join(f'<div class="row g12 box">{avatar(a, 38, AV_BG[k + 1], "#fff")}<div class="col f1"><b class="s13">{n}</b><span class="muted s12">{d}</span></div><div class="row g4">{"".join(f"<div style=width:30px;height:38px;border-radius:6px;background:linear-gradient(135deg,#e6eaf5,#cdd5ea)></div>" for _ in range(3))}</div>{chip(s, c)}</div>' for k, (a, n, d, s, c) in enumerate([("AN", "Awa Ndiaye", "Dakar · CNI + titre foncier + RIB", "À valider", "chip-sun"), ("SO", "Serge Obiang", "Libreville · selfie non concordant (61 %)", "Risque", "chip-rose"), ("RL", "Résidence Al Firdaous (SARL)", "Rabat · RC + statuts + mandat", "À valider", "chip-sun")]))
    lit = [("LT-0019", "Fuite d'eau non réparée", "Studio · Point E, Dakar", "Urgent", "chip-rose", "Médiation · J+1"), ("LT-0017", "Caution non restituée", "Coloc · Agdal, Rabat", "En médiation", "chip-sun", "Proposition : 70 % restitués"), ("LT-0016", "Logement non conforme à l'annonce", "Chambre · Akanda", "Résolu", "chip-green", "Remboursement intégral")]
    lt = "".join(f'<tr><td style="white-space:nowrap"><b>{a}</b></td><td><div class="col"><b class="s13">{b}</b><span class="muted s12">{c}</span></div></td><td>{chip(d, e)}</td><td class="muted s12">{f}</td></tr>' for a, b, c, d, e, f in lit)
    seq = [("NL-2026-00342", "Amina Mba → Karim B.", "6 892 MAD", "Entrée 01/09/2027", "Bloqué", "chip-violet"), ("NL-2026-00318", "Moussa Diallo → Coloc Gauthier", "4 650 MAD", "Entrée confirmée 05/10", "À libérer", "chip-green"), ("NL-2026-00301", "Fatou Sow → Awa N.", "190 000 F CFA", "Litige LT-0019", "Gelé", "chip-rose"), ("NL-2026-00296", "Kevin M. → Résidence Firdaous", "5 400 MAD", "Entrée confirmée 04/10", "À libérer", "chip-green")]
    st_ = "".join(f'<tr><td><b>{a}</b></td><td>{b}</td><td><b>{c}</b></td><td class="muted s12">{d}</td><td>{chip(e, f)}</td><td>{'<a class="btn" style="padding:6px 10px;font-size:12px;background:' + GREEN + ';color:#fff">Libérer</a>' if e == "À libérer" else ""}</td></tr>' for a, b, c, d, e, f in seq)
    content = head("Navilease · modération", "Annonces, bailleurs, litiges et fonds en séquestre", f'{seg(["Tous pays", "🇬🇦", "🇲🇦", "🇸🇳"], 0, INK, True)}', "Back-office") + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("ANNONCES À MODÉRER", "12", "délai moyen 9 h", "house", "#fff3c4", "#a55a00")}{kpi("KYC À VALIDER", "8", "dont 1 à risque", "scan-face", "#f1edff", VIOLET)}{kpi("LITIGES OUVERTS", "3", "1 urgent", "gavel", "#ffecef", ROSE)}{kpi("FONDS BLOQUÉS", "1,9 M MAD", "412 réservations", "lock-keyhole", "#e8f8ef", GREEN)}{kpi("À LIBÉRER AUJOURD'HUI", "38 200 MAD", "9 entrées confirmées", "hand-coins", "#eef4ff", BLUE)}</div>
<div class="card col g14" style="padding:22px;border-radius:22px;margin-bottom:20px;gap:14px;position:relative">{ctitle("Annonces à modérer", link("Voir les 12"), "house", "#a55a00", "#fff3c4")}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">{ann_cards}</div>{ann("Détection auto. : doublons d'images, prix anormal, coordonnées", "right:22px;top:-12px")}</div>
<div class="row g20 start" style="margin-bottom:20px">{card(ctitle("KYC bailleurs à valider", link("Tout voir"), "scan-face", VIOLET, "#f1edff") + kyc, extra="flex:1")}{card(ctitle("Litiges en médiation", link("Tout voir"), "gavel", ROSE, "#ffecef") + f'<table class="tbl"><tr><th>N°</th><th>Objet</th><th>Statut</th><th>Suivi</th></tr>{lt}</table>', extra="flex:1.2")}</div>
<div class="card col g12" style="padding:22px;border-radius:22px">{ctitle("Séquestre", f'<span class="row g6 s12 b">{icon("lock-keyhole", 14, VIOLET)} Bloqués 1,9 M MAD</span><span class="row g6 s12 b" style="color:{GREEN}">{icon("hand-coins", 14, GREEN)} À libérer 38 200 MAD</span><span class="row g6 s12 b" style="color:{ROSE}">{icon("circle-pause", 14, ROSE)} Gelés 190 000 F CFA</span>', "wallet", GREEN, "#e8f8ef")}<table class="tbl"><tr><th>Réservation</th><th>Parties</th><th>Montant</th><th>Condition</th><th>État</th><th></th></tr>{st_}</table></div>'''
    save("46-admin-navilease", page("Navigoal — Back-office · Navilease", space("admin", "Navilease · modération", content)))


def s47_admin_paiements_contenus():
    tx = [("NG-PAY-2027-004812", "Jean-Paul Mba", "Frais de dossier · ESA", "90 520 F CFA", "Airtel Money", "Réussi", "chip-green", "28/02 18:06"),
          ("NL-PAY-2027-001204", "Jean-Paul Mba", "Séquestre · NL-2026-00342", "6 892 MAD", "Airtel Money", "En séquestre", "chip-violet", "22/03 10:14"),
          ("NG-PAY-2027-004790", "Moussa Diallo", "Frais de dossier · ESCA", "65 000 F CFA", "Wave", "Réussi", "chip-green", "27/02 21:40"),
          ("NG-PAY-2027-004781", "Salma El Idrissi", "Frais de dossier · ESA", "1 500 MAD", "Carte CMI", "Réussi", "chip-green", "27/02 16:02"),
          ("NG-PAY-2027-004776", "Grâce Ondo Mve", "Frais de dossier · BBS", "35 000 F CFA", "Moov Money", "Échoué", "chip-rose", "27/02 11:15"),
          ("NG-RMB-2027-000088", "Kevin Mouélé", "Remboursement · annulation école", "– 52 000 F CFA", "Airtel Money", "Remboursé", "chip-gray", "26/02 09:30")]
    tt = "".join(f'<tr><td class="s12 b" style="white-space:nowrap;color:{BLUE}">{a}</td><td><b>{b}</b></td><td>{c}</td><td style="white-space:nowrap"><b>{d}</b></td><td>{e}</td><td>{chip(f, g)}</td><td class="muted s12" style="white-space:nowrap">{h}</td></tr>' for a, b, c, d, e, f, g, h in tx)
    arts = [("Étudier au Maroc quand on est Gabonais : démarches, coûts et logement", "Publié", "chip-green", "International", "12 480 vues"), ("Bourses d'études 2026 : 10 opportunités", "Publié", "chip-green", "Bourses", "18 230 vues"), ("BFEM, BEPC : bien choisir sa série", "Programmé 15/10", "chip-blue", "Orientation", "—"), ("Se loger à Dakar quand on est étudiant", "Brouillon", "chip-gray", "Navilease", "—")]
    at = "".join(f'<div class="row g12 box" style="{"border:2px solid " + INK if k == 0 else ""}"><div class="ic" style="width:54px;height:44px;border-radius:10px;background:linear-gradient(135deg,{HOUSE_G[k]})">{icon("newspaper", 18, "#fff")}</div><div class="col f1" style="min-width:0"><b class="s13">{t}</b><span class="muted s12">{c} · {v}</span></div>{chip(s, sc)}</div>' for k, (t, s, sc, c, v) in enumerate(arts))
    editor = f'''<div class="col g10 f1" style="min-width:0"><div class="row g12" style="padding:8px 12px;border:1.5px solid #e1e6f3;border-radius:12px">{"".join(icon(i, 16, "#3b4566") for i in ["heading-1", "bold", "italic", "list", "quote", "link", "image", "table"])}<span class="muted s12" style="margin-left:auto">Enregistré · 14:02</span></div>
<div class="col g8" style="padding:16px;border:1.5px solid #e1e6f3;border-radius:12px"><b style="font-size:18px">Étudier au Maroc quand on est Gabonais</b><span class="soft s13" style="line-height:1.6">Pas de visa pour les ressortissants gabonais, des écoles privées reconnues par l'État et un coût de la vie maîtrisé : le Maroc attire chaque année plus d'étudiants du Gabon…</span><div class="row g10 s13 b">{icon("image", 16, BLUE)} Image de couverture · campus UM6P</div></div>
<div class="row g10 start">{select("Catégorie", "International")}{select("Pays", "Maroc, Gabon")}{field("Publication", "Publié le 06/10/2026", "calendar")}</div><div class="row g8">{chip("SEO 92/100", "chip-green")}{chip("Lecture 6 min", "chip-gray")}{chip("Liens : 3 écoles, 1 fiche pays", "chip-blue")}</div></div>'''
    temo = "".join(f'<div class="col g8 box" style="padding:14px"><div class="row g10">{avatar(a, 34, AV_BG[k + 2], "#fff")}<div class="col f1"><b class="s13">{n}</b><span class="muted s12">{s}</span></div>{toggle(on, GREEN)}</div><span class="soft s12" style="line-height:1.5">« {t} »</span></div>' for k, (a, n, s, t, on) in enumerate([("OT", "Ousmane T.", "ESCA · Sénégalais", "Grâce au comparateur, j'ai trouvé une école reconnue et un logement à 10 minutes.", True), ("GN", "Grâce N.", "Parent · Libreville", "Le devis m'a permis de prévoir tout le budget avant le départ de ma fille.", True), ("YB", "Yassine B.", "EMSI · Marocain", "Candidature envoyée en 10 minutes, réponse en une semaine.", False)]))
    content = head("Paiements & contenus", "Transactions, séquestre, remboursements · articles et témoignages", f'<a class="btn btn-ghost" style="color:{INK};border-color:#d6dcec">{icon("file-spreadsheet", 16, INK)} Export comptable</a>', "Back-office") + f'''
<div class="row g16" style="margin-bottom:20px">{kpi("VOLUME · 30 J", "184 M F CFA", "2 940 transactions", "wallet", "#eef4ff", BLUE, "+21 %")}{kpi("TAUX DE SUCCÈS", "96,4 %", "échecs surtout Moov Money", "circle-check", "#e8f8ef", GREEN)}{kpi("EN SÉQUESTRE", "1,9 M MAD", "+ 41 M F CFA", "lock-keyhole", "#f1edff", VIOLET)}{kpi("REMBOURSEMENTS", "14", "1,2 M F CFA · 30 j", "rotate-ccw", "#ffecef", ROSE)}</div>
<div class="card col g12" style="padding:22px;border-radius:22px;margin-bottom:20px">{ctitle("Transactions", seg(["Toutes", "Frais de dossier", "Navilease", "Remboursements", "Échecs"], 0, INK, True), "receipt", INK, "#f1f3f8")}<table class="tbl"><tr><th>Référence</th><th>Payeur</th><th>Objet</th><th>Montant</th><th>Moyen</th><th>Statut</th><th>Date</th></tr>{tt}</table>
<div class="row g10">{"".join(f'<div class="row g8 box f1" style="padding:10px 12px">{icon("smartphone", 16, c)}<b class="s12 f1">{n}</b><span class="muted s12">{p}</span></div>' for n, p, c in [("Airtel Money", "38 %", "#e11d48"), ("Wave", "21 %", BLUE), ("Orange Money", "17 %", "#f97316"), ("Moov Money", "9 %", "#0057b8"), ("Cartes (CMI, Visa)", "11 %", INK), ("Virement", "4 %", "#3b4566")])}</div></div>
<div class="col g20"><div class="card col g14" style="padding:22px;border-radius:22px;gap:14px;min-width:0;position:relative">{ctitle("Contenus · articles", f'<a class="btn" style="background:{INK};color:#fff;padding:9px 14px;font-size:13px">{icon("plus", 15, "#fff")} Nouvel article</a>', "newspaper", INK, "#f1f3f8")}<div class="row g16 start"><div class="col g8" style="width:330px;flex-shrink:0">{at}</div>{editor}</div>{ann("Éditeur : aperçu mobile en direct", "right:22px;top:-12px")}</div>
<div class="row g20 start">{card(ctitle("Témoignages", link("Modérer (4)"), "quote", GREEN, "#e8f8ef") + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' + temo + '</div>', extra="flex:2")}{card(ctitle("Mise en avant · accueil", "", "star", "#a55a00", "#fff3c4") + "".join(f'<div class="row g10 s13 box" style="padding:9px 12px">{icon("grip-vertical", 15, MUTED)}<b class="f1">{t}</b>{chip(s, c)}</div>' for t, s, c in [("Bannière : Bourses 2026", "Actif", "chip-green"), ("Article : Étudier au Maroc", "Actif", "chip-green"), ("Navilease : rentrée 2027", "Dès le 01/11", "chip-blue")]), extra="flex:1")}</div></div>'''
    save("47-admin-paiements-contenus", page("Navigoal — Back-office · Paiements & contenus", space("admin", "Paiements", content)))


# =====================================================================================
# 48. RECHERCHE GLOBALE
# =====================================================================================
def s48_recherche():
    mets = [m for m in METIERS.values() if m["domaine"] == "dom-numerique"][:6]
    forms = [f for f in FORMATIONS.values() if f["domaine"] == "dom-numerique"]
    etabs = ["sn-esmt", "sn-isi", "ma-emsi", "ma-uir", "sn-dit", "ma-hightech", "ma-isga", "ga-esgis"]
    mc = "".join(f'<div class="card col g8" style="padding:16px;border-radius:18px">{ibox("briefcase", "#eef4ff", BLUE, 40, 19)}<b class="s14">{m["nom"]}</b><span class="muted s12" style="height:34px;overflow:hidden">{m["description"][:80]}…</span><span class="s12 b" style="color:{BLUE}">{len(m["formations"])} formations →</span></div>' for m in mets)
    fr = "".join(f'<div class="row g14 box" style="padding:12px 14px"><div class="ic" style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,{HOUSE_G[k % 6]})">{icon("graduation-cap", 20, "#fff")}</div><div class="col f1" style="min-width:0"><b class="s14">{f["intitule"]}</b><span class="muted s12">{f["diplome"]} · {f["duree_annees"]} ans · {len([e for e in f["etablissements"] if e in ETABS])} écoles sur Navigoal</span></div><div class="row" style="padding-left:8px">{"".join(f'<div style="margin-left:-8px">{logo(e, 32)}</div>' for e in [e for e in f["etablissements"] if e in ETABS][:4])}</div>{icon("chevron-right", 18, MUTED)}</div>' for k, f in enumerate(forms[:6]))
    ec = "".join(f'<div class="card row g12" style="padding:12px;border-radius:16px">{logo(e, 46)}<div class="col" style="min-width:0"><b class="s13">{ETABS[e]["sigle"]}</b><span class="muted s12">{ETABS[e]["ville"].split(" /")[0].split(" (")[0]}, {NOMS[ETABS[e]["pays"]]}</span></div></div>' for e in etabs)
    arts = "".join(f'<div class="row g12 box" style="padding:10px"><div class="ic" style="width:70px;height:54px;border-radius:10px;background:linear-gradient(135deg,{g})">{icon(i, 22, "#fff")}</div><div class="col f1"><b class="s13">{t}</b><span class="muted s12">{c}</span></div></div>' for t, c, g, i in [("Informatique : 7 métiers qui recrutent en Afrique", "Orientation · 5 min", "#1a47f5,#598bff", "code-xml"), ("Licence informatique ou école d'ingénieurs ?", "Guide · 8 min", "#6a3df0,#a78bfa", "graduation-cap"), ("Annales bac C : sujets de maths corrigés", "Ressources", "#0f8a46,#34d399", "book-open")])
    lg = "".join(f'<div class="card" style="border-radius:16px;overflow:hidden">{house_ph(k, 90, L["ic"], 0)}<div class="col g2" style="padding:10px 12px"><b class="s13">{L["t"][:26]}</b><span class="muted s12">{fmt(L["loyer"])} MAD · près de l\'EMSI</span></div></div>' for k, L in enumerate(LOGS[:3]))
    sec = lambda t, n, more: f'<div class="row between"><div class="row g10"><h3>{t}</h3>{chip(str(n), "chip-gray")}</div>{link(more)}</div>'
    body = f"""{header()}<div style="background:linear-gradient(180deg,#eef4ff,#f6f8fe 300px);padding:36px 0 60px"><div class="wrap col g24">
<div class="search row g12" style="padding:10px 10px 10px 22px;position:relative">{icon("search", 22, BLUE)}<b style="font-size:20px;flex:1">informatique</b>{ibox("x", "#f6f8fe", MUTED, 34, 16, 10)}<a class="btn btn-primary">Rechercher</a>
<div class="card col g4" style="position:absolute;left:50px;top:66px;width:420px;padding:10px;border-radius:16px;z-index:3"><span class="muted s12 b" style="padding:4px 8px">SUGGESTIONS</span>{"".join(f'<div class="row g10 s13" style="padding:7px 8px;border-radius:8px;{"background:#f5f8ff" if k == 0 else ""}">{icon(i, 15, MUTED)}<span><b>informatique</b>{t}</span></div>' for k, (i, t) in enumerate([("search", " Dakar"), ("search", " et gestion BTS"), ("history", " · recherche récente")]))}</div>{ann("Résultats instantanés pendant la frappe (debounce 200 ms)", "right:140px;top:-12px")}</div>
<div class="row between" style="margin-top:150px"><div class="col g4"><h2 style="font-size:30px">Résultats pour « informatique »</h2><span class="muted">86 résultats dans 3 pays · filtrés pour ton profil (Bac C, Gabon)</span></div><div class="row g8">{"".join(chip(t, "chip-blue" if k == 0 else "chip-gray") for k, t in enumerate(["🇬🇦 🇲🇦 🇸🇳 Tous pays", "Privé reconnu", "Bac+3 à Bac+5"]))}</div></div>
{tabs(["Tout (86)", f"Métiers ({len([m for m in METIERS.values() if m['domaine'] == 'dom-numerique'])})", f"Formations ({len(forms)})", "Établissements (36)", "Articles (6)", "Logements (34)"], 0)}
<div class="row g24 start"><div class="col g24 f1" style="min-width:0">
<div class="col g12">{sec("Métiers", len(mets), "Tous les métiers du numérique")}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">{mc}</div></div>
<div class="col g12">{sec("Formations", len(forms), "Toutes les formations")}<div class="col g8">{fr}</div></div>
<div class="col g12">{sec("Établissements", 36, "Voir les 36 écoles")}<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">{ec}</div></div></div>
<div class="col g20" style="width:360px;flex-shrink:0">{card(sec("Articles", 6, "Tout") + arts)}{card(sec("Logements", 34, "Navilease") + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + lg + "</div>")}
{card(f'<div class="row g10">{ibox("sparkles", "#e8f8ef", GREEN, 38, 18)}<b>Pas sûr·e de ton choix ?</b></div><span class="muted s13">Le test d\'orientation compare l\'informatique à d\'autres domaines selon ton profil.</span><a class="btn btn-primary" style="padding:10px">Passer le test</a>')}</div></div></div></div>{footer()}"""
    save("48-recherche-globale", page("Navigoal — Recherche « informatique »", body))


# =====================================================================================
# 49. ARTICLE + PAGES LÉGALES
# =====================================================================================
def s49_article_legal():
    P = PAYS["MA"]
    B = P["budget"]
    cover = photo("ma-um6p", 0, 1200)
    budget = "".join(f'<tr><td style="padding:10px 12px;border-bottom:1px solid #eef1f8">{l["poste"]}</td><td style="padding:10px 12px;border-bottom:1px solid #eef1f8;text-align:right"><b>{fmt(l["min"])} – {fmt(l["max"])} {B["devise"]}</b></td></tr>' for l in B["lignes"])
    somm = ["Pourquoi le Maroc ?", "Pas de visa, mais une carte de séjour", "Choisir une école reconnue", "Budget : combien prévoir ?", "Se loger à Casablanca ou Rabat", "Calendrier conseillé"]
    sm = "".join(f'<div class="row g10 s13" style="padding:8px 12px;border-radius:10px;{"background:#eef4ff;color:#1336e0;font-weight:800" if k == 3 else "color:#3b4566;font-weight:600"}"><span style="width:18px">{k+1}.</span>{t}</div>' for k, t in enumerate(somm))
    schools = "".join(f'<div class="row g10 box" style="padding:10px">{logo(e, 40)}<div class="col f1"><b class="s13">{ETABS[e]["sigle"]}</b><span class="muted s12">{ETABS[e]["ville"].split(" /")[0]} · {STATUT[ETABS[e]["statut"]]}</span></div>{icon("arrow-up-right", 16, MUTED)}</div>' for e in ["ma-esa-casa", "ma-uir", "ma-emsi"])
    article = f'''<div class="wrap col g24" style="padding:28px 0 64px">{crumbs("Actualités", "International", "Étudier au Maroc")}
<div class="row g40 start"><div class="col g20" style="flex:1;max-width:820px">
<div class="row g8">{chip("International", "chip-violet")}{chip("🇬🇦 → 🇲🇦", "chip-sun")}</div><h1 style="font-size:46px;letter-spacing:-1.4px">Étudier au Maroc quand on est Gabonais : démarches, coûts et logement</h1>
<div class="row g12">{avatar("AK", 44, AV_BG[1], "#fff")}<div class="col"><b class="s14">Awa Koné · rédaction Navigoal</b><span class="muted s13">Publié le 06/10/2026 · mis à jour le 08/10/2026 · 6 min de lecture</span></div><div class="row g8" style="margin-left:auto">{"".join(ibox(i, "#fff", "#3b4566", 38, 17) for i in ["share-2", "bookmark", "printer"])}</div></div>
<div style="height:400px;border-radius:24px;overflow:hidden;position:relative"><img src="{cover}" style="width:100%;height:100%;object-fit:cover"><span class="chip" style="position:absolute;left:14px;bottom:14px;background:rgba(11,21,51,.65);color:#fff">Campus de l'UM6P, Benguerir · {credit_short("ma-um6p")}</span></div>
<p style="font-size:19px;line-height:1.7;font-weight:600" class="soft">{P["accroche"]}</p>
<h3 style="font-size:24px;margin-top:8px">4. Budget : combien prévoir ?</h3><p class="soft" style="font-size:16px;line-height:1.75">Au-delà des frais de scolarité (de {fmt(P["frais_prive"]["min"])} à {fmt(P["frais_prive"]["max"])} {P["frais_prive"]["devise"]} par an dans le privé), le coût de la vie dépend surtout de la ville et du logement. Voici les fourchettes mensuelles observées :</p>
<div class="card" style="border-radius:18px;overflow:hidden"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#0b1a4f;color:#fff"><td style="padding:10px 12px;font-weight:700">Poste mensuel</td><td style="padding:10px 12px;text-align:right;font-weight:700">Fourchette</td></tr>{budget}<tr style="background:#eef4ff"><td style="padding:12px;font-weight:800">Total estimé</td><td style="padding:12px;text-align:right;font-weight:800;color:{BLUE}">{fmt(B["total_mensuel"]["min"])} – {fmt(B["total_mensuel"]["max"])} {B["devise"]}</td></tr></table></div>
<div class="row g14 start" style="padding:20px;border-radius:20px;background:#fff7dd;border:1px solid #ffe9a8">{ibox("lightbulb", SUN, INK, 40, 20)}<div class="col g6"><b>À retenir</b><span class="soft s14" style="line-height:1.6">Demandez un devis complet à l'école via Navigoal et faites-le valider par vos parents : il inclut scolarité, vie, installation, visa et carte de séjour sur toute la durée du cursus.</span><a class="s14 b" style="color:{BLUE}">Simuler mon devis →</a></div></div>
<h3 style="font-size:24px">5. Se loger à Casablanca ou Rabat</h3><p class="soft" style="font-size:16px;line-height:1.75">Studios meublés, colocations et résidences privées se réservent dès l'admission. Avec Navilease, la caution est conservée en séquestre et le bailleur n'est payé qu'après l'entrée dans les lieux : fini les arnaques à la caution versée à distance.</p>
<div class="row g10 wr">{"".join(chip("#" + t, "chip-gray") for t in ["Maroc", "Gabon", "Visa", "Budget", "Logement étudiant"])}</div></div>
<div class="col g20" style="width:340px;flex-shrink:0">{card('<span class="muted s12 b">SOMMAIRE</span>' + sm + ann("Sommaire sticky · section active suivie au scroll", "position:relative;align-self:flex-start"), pad=18)}
{card('<b class="s14">Écoles citées</b>' + schools, pad=18)}
{card(f'<b class="s14">Reçois nos conseils</b><span class="muted s13">Bourses, concours et dates clés, 2 fois par mois.</span>{field("E-mail ou WhatsApp", "ton@email.com", "mail", ph=True)}<a class="btn btn-primary" style="padding:11px">S\'abonner</a>', pad=18, extra="background:linear-gradient(160deg,#fff,#eef4ff)")}</div></div></div>'''
    lsec = [("1. Objet", "Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'usage de la plateforme Navigoal et de son service de logement Navilease par les élèves, étudiants, parents ou tuteurs, établissements et bailleurs."),
            ("2. Comptes et rôles", "L'inscription est gratuite. Les comptes établissement et bailleur sont activés après vérification. Un utilisateur mineur ne peut candidater ou payer qu'après validation par son parent ou tuteur légal."),
            ("3. Candidatures et frais de dossier", "Navigoal transmet les dossiers aux établissements et encaisse pour leur compte les frais de dossier. La décision d'admission relève exclusivement de l'établissement."),
            ("4. Navilease : réservation et séquestre", "Les sommes versées à la réservation sont conservées en séquestre et reversées au bailleur 48 heures après l'entrée dans les lieux, sauf litige signalé. Tout paiement hors plateforme est interdit.")]
    ls = "".join(f'<div class="col g8"><h3 style="font-size:19px">{t}</h3><p class="soft" style="font-size:15px;line-height:1.75">{x}</p></div>' for t, x in lsec)
    lsom = "".join(f'<div class="row g8 s13" style="padding:7px 10px;border-radius:8px;{"background:#f1f3f8;font-weight:800" if k == 3 else "font-weight:600;color:#3b4566"}">{t}</div>' for k, t in enumerate(["1. Objet", "2. Comptes et rôles", "3. Candidatures et frais", "4. Navilease : séquestre", "5. Obligations des utilisateurs", "6. Données personnelles", "7. Responsabilité", "8. Droit applicable et litiges", "9. Contact"]))
    legal = f'''<div style="background:#0b1533;padding:18px 0"><div class="wrap row g12" style="color:#fff">{icon("scroll-text", 20, SUN)}<b>Modèle · pages légales</b><span style="color:#a9b6e8;font-size:13px">Même gabarit pour CGU, politique de confidentialité, mentions légales et cookies</span></div></div>
<div style="background:#fff;padding:40px 0 64px"><div class="wrap col g24"><div class="row g8">{"".join(f'<span class="chip" style="padding:9px 14px;font-size:13px;{"background:#0b1533;color:#fff" if k == 0 else "background:#f1f3f8;color:#3b4566"}">{t}</span>' for k, t in enumerate(["Conditions générales d'utilisation", "Politique de confidentialité", "Mentions légales", "Cookies"]))}</div>
<div class="row g40 start"><div class="col g6" style="width:280px;flex-shrink:0;padding:18px;border-radius:18px;background:#f8f9fd;border:1px solid #eef1f8"><span class="muted s12 b" style="padding:0 10px 6px">SOMMAIRE</span>{lsom}<a class="btn btn-ghost" style="margin-top:10px;padding:10px">{icon("file-down", 15, "#1336e0")} Télécharger en PDF</a></div>
<div class="col g20" style="flex:1;max-width:820px"><h1 style="font-size:44px">Conditions générales d'utilisation</h1><div class="row g10">{chip("Version 1.0", "chip-gray")}{chip("En vigueur au 09/10/2026", "chip-blue")}{chip("Gabon · Maroc · Sénégal", "chip-sun")}</div>
<div class="row g10 s13" style="padding:14px 16px;border-radius:14px;background:#eef4ff">{icon("info", 17, BLUE)}<span class="soft"><b>En bref :</b> Navigoal est gratuit pour les élèves et étudiants ; vos documents ne sont partagés qu'avec les établissements où vous candidatez ; les paiements Navilease sont protégés en séquestre.</span></div>{ls}
<div class="row between" style="border-top:1px solid #eef1f8;padding-top:16px"><span class="muted s13">Une question ? juridique@navigoal.com</span><span class="muted s13">Historique des versions →</span></div></div></div></div></div>'''
    body = f"{header('Actualités')}{article}{legal}{footer()}"
    save("49-article-pages-legales", page("Navigoal — Article & pages légales", body))


def credit_short(eid):
    ph = ETABS[eid].get("photos") or []
    return (ph[0].get("credit") or "")[:40] if ph else ""


# =====================================================================================
# 50. MOBILE (4 écrans 390 px)
# =====================================================================================
def phone(title, inner, bottom=""):
    sb = f'<div class="row between" style="padding:12px 24px 6px;font-size:14px;font-weight:800">9:41<span class="row g6">{icon("wifi", 15, INK)}<span style="width:24px;height:12px;border-radius:3px;border:1.5px solid {INK};display:inline-block;position:relative"><span style="position:absolute;inset:1.5px;right:5px;background:{INK};border-radius:1px"></span></span></span></div>'
    return f'''<div class="col g16" style="width:390px;flex-shrink:0"><b style="font-size:20px">{title}</b><div style="width:390px;height:844px;border-radius:44px;overflow:hidden;background:#f6f8fe;box-shadow:0 0 0 10px #0b1533,0 40px 80px -30px rgba(11,21,51,.6);position:relative;display:flex;flex-direction:column">
{sb}<div style="flex:1;overflow:hidden;position:relative">{inner}</div>{bottom}<div style="height:22px;display:flex;justify-content:center;align-items:center;background:#fff"><div style="width:130px;height:5px;border-radius:5px;background:{INK}"></div></div></div></div>'''


def tabbar(active, items):
    return f'<div class="row between" style="padding:10px 22px;background:#fff;border-top:1px solid #e6eaf5">{"".join(f"<div class=col style=align-items:center;gap:3px;font-size:10px;font-weight:700;color:{BLUE if t == active else MUTED}>{icon(i, 21, BLUE if t == active else MUTED)}{t}</div>" for i, t in items)}</div>'


def s50_mobile():
    m1 = f'''<div class="col g16" style="padding:18px 22px;background:#fff;height:100%">
<div style="height:200px;border-radius:24px;background:linear-gradient(150deg,#0b1a4f,#1336e0 60%,#598bff);position:relative;overflow:hidden"><img src="{STUDENT}" style="position:absolute;right:-10px;bottom:0;width:190px"><div class="col g6" style="position:absolute;left:18px;top:18px;color:#fff">{brand(True)}<b style="font-size:22px;line-height:1.15;margin-top:18px;width:150px">Bon retour 👋</b></div></div>
{seg(["Mot de passe", "Code par SMS"], 1, small=True)}
<div class="col g6"><span class="lbl">Numéro de téléphone</span><div class="row g8"><div class="inp" style="width:104px;white-space:nowrap;gap:4px">🇸🇳 +221{icon("chevron-down", 13, MUTED)}</div><div class="inp f1 focus">77 412 •• ••</div></div></div>
<a class="btn btn-primary" style="padding:15px">Recevoir le code</a><span class="help" style="text-align:center">Code par SMS ou WhatsApp · valable 10 min</span>
<div class="row g10 muted s12"><div class="sep f1"></div>ou<div class="sep f1"></div></div>
{field("E-mail", "moussa.diallo@gmail.com", "at-sign")}
<a class="btn btn-ghost" style="padding:13px">Se connecter avec un mot de passe</a>
<div class="s13" style="text-align:center"><span class="muted">Nouveau ?</span> <b style="color:{BLUE}">Créer un compte</b></div>
{ann("Clavier numérique + remplissage auto. du code SMS", "position:relative;align-self:center")}</div>'''
    cl = "".join(f'''<div class="card col g10" style="padding:14px;border-radius:18px"><div class="row g10">{logo(eid, 42)}<div class="col f1" style="min-width:0"><b class="s13">{FORMATIONS[fid]["intitule"][:34]}</b><span class="muted s12">{ETABS[eid]["sigle"]} · #{num}</span></div></div><div class="row g4">{mini_steps(n)}</div><div class="row between">{st(s)}<span class="s12 b" style="color:{BLUE}">Ouvrir →</span></div></div>''' for num, eid, fid, s, n, nxt, date, fee in CANDS[:4])
    m2 = f'''<div class="col g12" style="padding:12px 18px"><div class="row between"><h3 style="font-size:24px">Mes candidatures</h3>{ibox("plus", BLUE, "#fff", 40, 18)}</div>
<div class="row g6">{"".join(chip(t, "chip-blue" if k == 0 else "chip-gray") for k, t in enumerate(["Toutes 5", "Action 2", "Acceptées 1"]))}</div>
<div class="row g10" style="padding:12px;border-radius:16px;background:#fff5f7;border:1.5px solid #ffc2cf">{icon("file-warning", 20, ROSE)}<span class="s12 b" style="color:{ROSE};flex:1">ESMT demande ton relevé de 1re</span><a class="btn" style="padding:7px 10px;font-size:12px;background:{ROSE};color:#fff">Déposer</a></div>{cl}</div>'''
    L = LOGS[0]
    m3 = f'''<div style="position:relative">{house_ph(0, 280, "sofa", 0)}<div class="row between" style="position:absolute;left:16px;right:16px;top:12px">{ibox("arrow-left", "#fff", INK, 38, 18, 19)}<div class="row g8">{ibox("share-2", "#fff", INK, 38, 18, 19)}{ibox("heart", "#fff", ROSE, 38, 18, 19)}</div></div><span class="chip" style="position:absolute;right:16px;bottom:14px;background:rgba(11,21,51,.6);color:#fff">1 / 14</span></div>
<div class="col g12" style="padding:16px 20px;background:#fff;border-radius:24px 24px 0 0;margin-top:-20px;position:relative"><div class="row g6">{chip("✓ Visité par Navilease", "chip-green")}{chip("★ 4,8 (23)", "chip-sun")}</div><b style="font-size:21px">Studio meublé · Maârif</b>
<div class="row g6 muted s13">{icon("map-pin", 14, MUTED)}Maârif, Casablanca · adresse après signature</div><div class="row g6 s13 b" style="color:{GREEN}">{icon("footprints", 14, GREEN)}12 min à pied de l'ESA Casablanca</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">{"".join(f'<div class="col g2 box" style="padding:9px;align-items:center">{icon(i, 18, BLUE)}<span class="s12 b">{t}</span></div>' for i, t in [("ruler", "28 m²"), ("wifi", "Fibre"), ("snowflake", "Clim"), ("sofa", "Meublé"), ("shield-check", "Gardien"), ("bus", "Tram 4 min")])}</div>
<div class="row g10 box">{avatar("KB", 38, "linear-gradient(135deg,#0f8a46,#34d399)", "#fff")}<div class="col f1"><b class="s13">Karim B.</b><span class="muted s12">Identité vérifiée · répond en ~1 h</span></div>{icon("message-circle", 20, BLUE)}</div>
<div class="row g8 s12 start" style="padding:10px 12px;border-radius:12px;background:#e8f8ef;color:#0b5e30">{icon("shield-check", 15, GREEN)}<span><b>Paiement en séquestre</b> · bailleur payé 48 h après ton entrée</span></div>
<div class="col g6 s13">{"".join(f'<div class="row between"><span class="muted">{a}</span><b>{b}</b></div>' for a, b in [("Caution", "3 200 MAD"), ("Frais de service", "142 MAD"), ("À la réservation", "6 892 MAD")])}</div></div>'''
    m3b = f'<div class="row between" style="padding:12px 20px;background:#fff;border-top:1px solid #e6eaf5"><div class="col"><b style="font-size:19px;color:{BLUE}">3 200 MAD</b><span class="muted s12">/ mois + 350 ch.</span></div><a class="btn btn-primary" style="padding:13px 18px">Demander</a></div>'
    reqs = "".join(f'''<div class="card col g10" style="padding:14px;border-radius:18px;{"border:2px solid " + GREEN if k == 0 else ""}"><div class="row g10">{avatar(a, 40, AV_BG[k], "#fff" if k else INK)}<div class="col f1"><b class="s13">{n}</b><span class="muted s12">{s}</span></div>{chip(x, y)}</div><span class="s12 soft"><b>{l}</b> · {d}</span>{f'<div class="row g8"><a class="btn f1" style="background:{GREEN};color:#fff;padding:10px;font-size:13px">Accepter</a><a class="btn btn-ghost" style="padding:10px;font-size:13px;color:{ROSE};border-color:#ffc2cf">Refuser</a></div>' if k == 0 else ""}</div>''' for k, (a, n, s, l, d, x, y) in enumerate([("AM", "Amina Mba", "Admise ESA · garant parent ✓", "Studio Maârif", "01/09/2027 · 10 mois", "31 h", "chip-sun"), ("MD", "Moussa Diallo", "Admis ESCA · garant ✓", "Coloc Gauthier · ch. 2", "05/09/2027 · 10 mois", "Nouvelle", "chip-blue"), ("SE", "Salma El Idrissi", "Master ESA", "Les Orangers · studio 4", "01/10/2027 · 9 mois", "Nouvelle", "chip-blue")]))
    m4 = f'''<div class="col g12" style="padding:12px 18px"><div class="row between"><div class="col"><span class="chip chip-green" style="align-self:flex-start;padding:3px 8px;font-size:11px">Bailleur</span><h3 style="font-size:24px;margin-top:4px">Demandes</h3></div>{avatar("KB", 40, "linear-gradient(135deg,#0f8a46,#34d399)", "#fff")}</div>
<div class="row g8">{"".join(f'<div class="col g2 f1 box" style="padding:10px"><span class="muted" style="font-size:10px;font-weight:800">{a}</span><b class="s14">{b}</b></div>' for a, b in [("OCCUPATION", "83 %"), ("SÉQUESTRE", "6 892 MAD"), ("EN ATTENTE", "3")])}</div>{reqs}
<div class="card col g8" style="padding:14px;border-radius:18px"><b class="s13">Derniers encaissements</b>{"".join(f'<div class="row between s12"><span class="soft">{a}</span><b>{b}</b></div>' for a, b in [("Loyer oct. · Fatou Sow", "2 400 MAD"), ("Loyer oct. · Grâce O. M.", "2 400 MAD")])}</div></div>'''
    stu = [("house", "Accueil"), ("compass", "Orientation"), ("file-text", "Dossiers"), ("key-round", "Logement"), ("user-round", "Profil")]
    bai = [("layout-dashboard", "Accueil"), ("house", "Annonces"), ("inbox", "Demandes"), ("hand-coins", "Paiements"), ("message-circle", "Messages")]
    frames = phone("Connexion · code SMS", m1) + phone("Mes candidatures", m2, tabbar("Dossiers", stu)) + phone("Fiche logement Navilease", m3, m3b) + phone("Bailleur · demandes", m4, tabbar("Demandes", [(i, t) for i, t in bai]).replace(f"color:{BLUE}", f"color:{GREEN}").replace(f'stroke="{BLUE}"', f'stroke="{GREEN}"'))
    body = f'<div style="padding:48px;background:#e9edf7"><div class="row g48 start" style="gap:48px">{frames}</div></div>'
    save("50-mobile", page("Navigoal — Mobile", body, 4 * 390 + 3 * 48 + 2 * 48))


if __name__ == "__main__":
    only = sys.argv[2:]
    for n in sorted(k for k in list(globals()) if re.match(r"s\d\d_", k)):
        if not only or n[1:3] in only:
            globals()[n]()
