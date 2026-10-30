#!/usr/bin/env python3
"""Maquettes « accès des établissements » et « guide de la plateforme » (octobre 2026).

1. Administrateur : accès des établissements (création en lot, mot de passe provisoire, renvoi par e-mail)
2. Établissement : première connexion, choix du mot de passe
3. Établissement : guide de la plateforme dans le back-office (premiers pas suivis, fiches pratiques)

Usage : python3 design/maquettes/acces.py <dossier icônes lucide>  → design/maquettes/out/acces.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402  (helpers, styles et logos communs ; régénère aussi premium.html)

icon, CSS, LOGO, WORDMARK, menu, ECOLE, ADMIN = P.icon, P.CSS, P.LOGO, P.WORDMARK, P.menu, P.ECOLE, P.ADMIN
ADMIN_ACCES = ADMIN[:4] + [("key-square", "Accès écoles")] + ADMIN[4:]
ECOLE_GUIDE = ECOLE + [("book-open", "Guide de la plateforme")]


def admin_acces():
    rows = [
        ("UIR", LOGO["uir"], "contact@uir.ac.ma", "Actif", "g", "connecté hier", "Réinitialiser"),
        ("ESA Casablanca", LOGO["esa"], "admissions@esa.ma", "Jamais connecté", "y", "créé le 30 oct.", "Renvoyer"),
        ("UEMF", LOGO["uemf"], "contact@ueuromed.org", "Actif", "g", "connecté il y a 3 j", "Réinitialiser"),
        ("EMSI", LOGO["emsi"], "emsi-casa@acces.navigoal.net", "Adresse à compléter", "r", "aucun e-mail public", "Modifier l'e-mail"),
    ]
    tr = "".join(f"""<tr><td><div style="display:flex;align-items:center;gap:10px"><img src="{lg}" style="width:30px;height:30px;border-radius:8px;object-fit:contain;border:1px solid #eef1f8"><b>{n}</b></div></td>
      <td>{mail}</td><td><span class="chip {c}">{s}</span></td><td class="mute">{d}</td>
      <td><span class="btn ghost" style="padding:6px 10px;font-size:12.5px">{a}</span> <span class="btn ghost" style="padding:6px 10px;font-size:12.5px">{icon('user-plus', 14, '#1a47f5')}</span></td></tr>""" for n, lg, mail, s, c, d, a in rows)
    return f"""<div class="frame" style="width:1440px;height:820px"><div class="titre-cadre">1 · Administrateur : accès des établissements</div>
  {menu(ADMIN_ACCES, "Accès écoles", "Back-office Navigoal")}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:28px">Accès des établissements</h1><p class="mute" style="margin-top:4px">103 établissements · 103 accès créés · 21 écoles déjà connectées</p></div>
      <div style="display:flex;gap:10px"><span class="btn ghost">{icon('download', 16, '#1a47f5')}Fichier des accès (CSV)</span><span class="btn primary">{icon('mail', 16, '#fff')}Envoyer les accès non utilisés (82)</span></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px">
      {''.join(f'<div class="card" style="padding:16px"><p class="small mute" style="font-weight:700">{a}</p><p style="font-size:26px;font-weight:800;margin-top:4px;color:{c}">{b}</p><p class="small mute">{d}</p></div>' for a, b, c, d in [("ACCÈS CRÉÉS", "103", "#0b1533", "1 compte par établissement"), ("DÉJÀ CONNECTÉES", "21", "#0f8a46", "mot de passe personnel choisi"), ("JAMAIS CONNECTÉES", "60", "#a55a00", "à relancer"), ("E-MAIL À COMPLÉTER", "22", "#d42a50", "pas d'adresse publique")])}
    </div>
    <div class="card" style="margin-top:16px;padding:14px 16px;display:flex;gap:10px;align-items:center">
      <div class="field" style="width:320px">{icon('search', 16, '#6b7493')}<span class="mute">Établissement, ville, e-mail…</span></div>
      <span class="chip n" style="padding:8px 12px">Tous</span><span class="chip y" style="padding:8px 12px">Jamais connectés</span><span class="chip r" style="padding:8px 12px">E-mail à compléter</span>
    </div>
    <div class="card" style="margin-top:14px;padding:4px 6px"><table><tr><th>Établissement</th><th>Identifiant (e-mail)</th><th>État</th><th>Dernière activité</th><th>Actions</th></tr>{tr}</table></div>
    <div class="card" style="margin-top:16px;padding:16px;display:flex;gap:14px;align-items:flex-start;background:#f0f4ff;border-color:#dbe4ff">{icon('shield-check', 22, '#1a47f5')}
      <p style="font-size:13px;line-height:1.55"><b>Mot de passe provisoire</b> affiché une seule fois (ou envoyé par e-mail à l'adresse officielle de l'école), à changer à la première connexion. Navigoal ne conserve jamais de mot de passe en clair. <b>Ajouter un collaborateur</b> ({icon('user-plus', 13, '#1a47f5')}) : un 2ᵉ compte pour la même école.</p></div>
  </div>
  <div class="note" style="left:620px;top:20px;max-width:260px">Identifiant = e-mail officiel publié par l'école (81 sur 103)</div>
</div>"""


def premiere_connexion():
    return f"""<div class="frame" style="width:1440px;height:760px"><div class="titre-cadre">2 · Établissement : première connexion</div>
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#eef2ff,#f6f8fe)">
    <div class="card" style="width:480px;padding:32px">
      <img src="{WORDMARK}" style="height:26px">
      <div style="display:flex;align-items:center;gap:12px;margin-top:24px"><img src="{LOGO['uir']}" style="width:44px;height:44px;border-radius:12px;object-fit:contain;border:1px solid #eef1f8"><div><b style="font-size:17px">Bienvenue, Université Internationale de Rabat</b><p class="small mute">Première connexion à votre espace établissement</p></div></div>
      <p style="margin-top:18px;font-size:14px;line-height:1.55">Choisissez votre mot de passe personnel : le mot de passe provisoire ne fonctionnera plus ensuite.</p>
      <p class="label" style="margin-top:18px">Nouveau mot de passe</p><div class="field">••••••••••••</div>
      <div style="display:flex;gap:6px;margin-top:8px">{''.join(f'<span style="flex:1;height:5px;border-radius:9px;background:{c}"></span>' for c in ["#0f8a46", "#0f8a46", "#0f8a46", "#e6eaf3"])}</div>
      <p class="small mute" style="margin-top:6px">8 caractères minimum, dont un chiffre</p>
      <p class="label" style="margin-top:14px">Confirmation</p><div class="field">••••••••••••</div>
      <span class="btn primary" style="width:100%;margin-top:22px">Enregistrer et découvrir mon espace</span>
      <p class="small mute" style="margin-top:14px;text-align:center">Le guide de la plateforme s'ouvre ensuite pour vous accompagner pas à pas.</p>
    </div>
  </div>
  <div class="note" style="left:1000px;top:300px">Obligatoire tant que le mot de passe provisoire n'a pas été changé ; rien d'autre n'est accessible</div>
</div>"""


def guide():
    etapes = [
        ("Compléter la fiche de l'établissement", "Présentation, adresse, contacts, photos", True, "/etablissement/fiche"),
        ("Vérifier vos formations et leurs frais", "Frais de scolarité et de dossier confirmés", True, "/etablissement/formations"),
        ("Publier une campagne d'admission", "Dates, places, pièces demandées", False, "/etablissement/campagnes"),
        ("Traiter votre première candidature", "Vérifier, demander une pièce, décider", False, "/etablissement/candidatures"),
        ("Répondre à un candidat", "Messagerie intégrée, copie par e-mail", False, "/messages"),
    ]
    fiches = [
        ("inbox", "Traiter une candidature", "Les statuts pas à pas : envoyée → en vérification → dossier complet → décision. Demander une pièce manquante, consulter le bordereau PDF, exporter en CSV."),
        ("messages-square", "Échanger avec les candidats", "Chaque candidature a son fil de discussion. Le candidat et ses parents sont prévenus par e-mail. Répondez sous 48 h : c'est ce qui convertit le plus."),
        ("life-buoy", "Le mode accompagné Navigoal", "Pendant votre prise en main, l'équipe Navigoal peut répondre aux candidats et traiter les dossiers en votre nom. Vous êtes prévenu de chaque action et reprenez la main quand vous voulez."),
        ("crown", "L'offre Premium (5 000 MAD / an)", "Filtres par résultats, projet et financement, vivier de candidats consentants et campagnes de prospection."),
        ("users", "Ajouter un collaborateur", "Demandez à Navigoal un accès supplémentaire pour votre service admissions : chaque personne a son propre identifiant."),
        ("shield-check", "Sécurité et données", "Données des candidats réservées à l'admission ; pas de réutilisation hors Navigoal ; changez votre mot de passe depuis « Mon compte »."),
    ]
    return f"""<div class="frame" style="width:1440px;height:960px"><div class="titre-cadre">3 · Établissement : guide de la plateforme</div>
  {menu(ECOLE_GUIDE, "Guide de la plateforme", "Espace établissement · UIR", ["Vivier de candidats", "Prospection"])}
  <div style="position:absolute;left:270px;right:30px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1 style="font-size:28px">Guide de la plateforme</h1><p class="mute" style="margin-top:4px">Tout ce qu'il faut pour recevoir et traiter vos candidatures sur Navigoal.</p></div>
      <div style="display:flex;gap:10px"><span class="btn ghost">{icon('file-down', 16, '#1a47f5')}Télécharger le guide (PDF)</span><span class="btn sun">{icon('message-circle', 16, '#0b1533')}Une question ? Écrire à Navigoal</span></div></div>
    <div style="display:grid;grid-template-columns:420px 1fr;gap:18px;margin-top:20px">
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">Premiers pas</b><span class="chip b">2 / 5</span></div>
        <div class="bar" style="margin-top:12px"><span style="position:absolute;left:0;top:0;bottom:0;width:40%;border-radius:9px;background:#1a47f5"></span></div>
        {''.join(f'''<div style="display:flex;gap:12px;align-items:flex-start;margin-top:16px">{icon("circle-check" if ok else "circle", 22, "#0f8a46" if ok else "#c3c9d6")}
          <div style="flex:1"><b style="font-size:14px;{"color:#6b7493;text-decoration:line-through" if ok else ""}">{t}</b><p class="small mute">{d}</p></div>{"" if ok else f'<span class="btn ghost" style="padding:6px 10px;font-size:12px">Faire</span>'}</div>''' for t, d, ok, _ in etapes)}
        <div class="card" style="margin-top:20px;padding:14px;box-shadow:none;background:#fffbea;border-color:#ffe59a;font-size:13px;line-height:1.5">{icon('video', 15, '#a55a00')} <b>Démonstration en visio (30 min)</b> avec l'équipe Navigoal pour votre service admissions. <span style="color:#1a47f5;font-weight:800">Réserver un créneau</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{''.join(f'<div class="card" style="padding:18px"><div style="display:flex;align-items:center;gap:10px"><span style="width:36px;height:36px;border-radius:11px;background:#eef2ff;display:flex;align-items:center;justify-content:center">{icon(i, 18, "#1a47f5")}</span><b style="font-size:15px">{t}</b></div><p style="font-size:13px;line-height:1.55;margin-top:10px" class="mute">{d}</p><p style="margin-top:10px;font-size:13px;font-weight:800;color:#1a47f5">Lire la fiche →</p></div>' for i, t, d in fiches)}</div>
    </div>
    <div class="card" style="margin-top:18px;padding:18px"><b style="font-size:16px">Questions fréquentes</b>
      {''.join(f'<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eef1f8;font-size:14px"><span>{q}</span>{icon("chevron-down", 16, "#6b7493")}</div>' for q in ["Combien coûte Navigoal pour un établissement ?", "Qui voit les candidatures et les documents des candidats ?", "Comment sont fixés les frais de dossier et quand sont-ils versés ?", "Un candidat dit ne pas avoir reçu de réponse : que faire ?"])}
    </div>
  </div>
  <div class="note" style="left:300px;top:610px;max-width:360px">Les cases se cochent seules selon ce que l'école a déjà fait dans son espace</div>
</div>"""


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Accès et guide établissements</title><style>{CSS}</style></head><body>
{admin_acces()}{premiere_connexion()}{guide()}
</body></html>"""
open(os.path.join(P.OUT, "acces.html"), "w").write(html)
print("→", os.path.join(P.OUT, "acces.html"), f"({len(html) // 1024} Ko)")
