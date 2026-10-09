#!/usr/bin/env python3
"""Assemble les écrans 17 à 50 (build_v3.py) en planches côte à côte pour l'import Figma.

Usage : python3 design/maquettes/planches_v3.py
Entrée/sortie : design/maquettes/out/ (planche-D.html … planche-I.html)
"""
import os
import re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
GAP, PAD = 160, 80

GROUPS = {
    "planche-D": ["17-connexion", "18-inscription-profil", "19-inscription-formulaire", "20-verification-otp", "29-parent-lier-enfant"],
    "planche-E": ["21-etudiant-profil", "22-etudiant-candidatures", "23-candidature-detail", "24-nouvelle-candidature", "25-paiement", "26-etudiant-documents", "27-messagerie", "28-notifications-conseiller"],
    "planche-F": ["30-etablissement-dashboard", "31-etablissement-candidatures", "32-etablissement-dossier", "33-etablissement-formations", "34-etablissement-campagnes-fiche"],
    "planche-G": ["35-navilease-recherche", "36-navilease-fiche-logement", "37-navilease-demande-reservation", "38-navilease-ma-reservation", "39-bailleur-dashboard", "40-bailleur-annonce-kyc", "41-bailleur-demandes"],
    "planche-H": ["42-admin-dashboard", "43-admin-utilisateurs", "44-admin-etablissements", "45-admin-referentiels", "46-admin-navilease", "47-admin-paiements-contenus"],
    "planche-I": ["48-recherche-globale", "49-article-pages-legales", "50-mobile"],
}
TITLES = {
    "17-connexion": "17 · Connexion", "18-inscription-profil": "18 · Inscription · choix du profil", "19-inscription-formulaire": "19 · Inscription · formulaire",
    "20-verification-otp": "20 · Vérification OTP", "29-parent-lier-enfant": "29 · Espace parent · lier mon enfant",
    "21-etudiant-profil": "21 · Étudiant · mon profil", "22-etudiant-candidatures": "22 · Étudiant · mes candidatures", "23-candidature-detail": "23 · Candidature · détail",
    "24-nouvelle-candidature": "24 · Nouvelle candidature · assistant", "25-paiement": "25 · Paiement + succès", "26-etudiant-documents": "26 · Mes documents",
    "27-messagerie": "27 · Messagerie", "28-notifications-conseiller": "28 · Notifications & conseiller",
    "30-etablissement-dashboard": "30 · Établissement · tableau de bord", "31-etablissement-candidatures": "31 · Établissement · candidatures",
    "32-etablissement-dossier": "32 · Établissement · dossier candidat", "33-etablissement-formations": "33 · Établissement · formations",
    "34-etablissement-campagnes-fiche": "34 · Établissement · campagnes & fiche",
    "35-navilease-recherche": "35 · Navilease · recherche", "36-navilease-fiche-logement": "36 · Navilease · fiche logement",
    "37-navilease-demande-reservation": "37 · Navilease · demande de réservation", "38-navilease-ma-reservation": "38 · Navilease · ma réservation",
    "39-bailleur-dashboard": "39 · Bailleur · tableau de bord", "40-bailleur-annonce-kyc": "40 · Bailleur · annonce & KYC", "41-bailleur-demandes": "41 · Bailleur · demandes & réservations",
    "42-admin-dashboard": "42 · Back-office · tableau de bord", "43-admin-utilisateurs": "43 · Back-office · utilisateurs", "44-admin-etablissements": "44 · Back-office · établissements",
    "45-admin-referentiels": "45 · Back-office · référentiels", "46-admin-navilease": "46 · Back-office · Navilease", "47-admin-paiements-contenus": "47 · Back-office · paiements & contenus",
    "48-recherche-globale": "48 · Recherche globale", "49-article-pages-legales": "49 · Article + pages légales", "50-mobile": "50 · Mobile (390 px)",
}


def body_and_css(name):
    h = open(os.path.join(OUT, name + ".html"), encoding="utf-8").read()
    css = re.search(r"<style>(.*?)</style>", h, re.S).group(1)
    body = re.search(r"<body>(.*)</body>", h, re.S).group(1)
    m = re.search(r"body\{width:(\d+)px\}", css)
    return css, body, int(m.group(1)) if m else 1440


for g, files in GROUPS.items():
    css, parts, total = None, [], PAD * 2 - GAP
    for f in files:
        c, b, w = body_and_css(f)
        if css is None:
            css = c.split(" body{width")[0].replace("width: 1440px;", "")
        inner = b.replace('<div class="page">', "<div>", 1)
        parts.append('<div style="display:flex;flex-direction:column;gap:24px;flex-shrink:0">'
                     f'<div style="font-family:Plus Jakarta Sans;font-weight:800;font-size:40px;color:#0b1533">{TITLES[f]}</div>'
                     f'<div class="page" style="width:{w}px;box-shadow:0 30px 80px -30px rgba(11,21,51,.35);border-radius:12px;overflow:hidden">{inner}</div></div>')
        total += w + GAP
    html = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal — {g}</title><style>{css} body{{width:{total}px;background:#e9edf7}}</style></head>'
            f'<body><div style="display:flex;gap:{GAP}px;align-items:flex-start;padding:{PAD}px;width:{total}px;background:#e9edf7">{"".join(parts)}</div></body></html>')
    open(os.path.join(OUT, g + ".html"), "w", encoding="utf-8").write(html)
    print(g, f"{len(html.encode()) / 1e6:.1f} Mo", f"{total} px", f"{len(files)} écrans")
