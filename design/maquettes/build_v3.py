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
    return f'<div class="col g6" style="flex:{flex}"><span class="lbl">{label}</span><div class="inp {state}">{i}{v}{right}</div>{h}</div>'


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


def kpi(label, value, sub="", ic="activity", bg="#eef4ff", fg=BLUE, delta=None):
    d = ""
    if delta:
        up = not delta.startswith("-")
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


if __name__ == "__main__":
    only = sys.argv[2:]
    for n in sorted(k for k in list(globals()) if re.match(r"s\d\d_", k)):
        if not only or n[1:3] in only:
            globals()[n]()
