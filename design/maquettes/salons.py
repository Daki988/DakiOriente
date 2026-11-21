#!/usr/bin/env python3
"""Maquettes « Salons virtuels » (novembre 2026) : une école organise une présentation en direct devant plusieurs
dizaines d'élèves (journée portes ouvertes, présentation d'une filière). Service payant, sur autorisation de l'admin ;
Navi invite les élèves dont le profil correspond.

1. École : « Mes salons » et demande d'un salon (date, durée, public visé, places, co-présentateurs)
2. Admin : demandes à valider (règlement enregistré, publication) ou à refuser
3. Public : page du salon et inscription (compte Navigoal gratuit)
4. Élève (téléphone) : Navi propose le salon, inscription en un geste
5. Salon en direct (participant) : présentateurs, participants micro coupé, questions écrites
6. École : bilan (inscrits, présents, questions) et relance des participants

Usage : python3 design/maquettes/salons.py <dossier icônes lucide>  → design/maquettes/out/salons.html
"""
import os

import premium as P

icon, CSS, WORDMARK, LOGO = P.icon, P.CSS, P.WORDMARK, P.LOGO


def menu_ecole(actif):
    items = [("layout-dashboard", "Tableau de bord"), ("inbox", "Candidatures"), ("presentation", "Salons virtuels"), ("calendar-clock", "Rendez-vous"), ("messages-square", "Messagerie"), ("crown", "Mon offre"), ("settings", "Paramètres")]
    return P.menu(items, actif, "ESA Casablanca · espace école")


def champ(label, valeur, large=False):
    return f'<div style="{"grid-column:span 2" if large else ""}"><div class="label">{label}</div><div class="field">{valeur}</div></div>'


# ---------------------------------------------------------------- 1. École : mes salons + demande
def ecole_demande():
    salons = [("Jeu. 10 déc. · 17:00", "Journée portes ouvertes en ligne", "Publié", "g", "48 inscrits / 150"), ("Mar. 19 janv. · 16:00", "Présenter le Bachelor management", "En attente de validation", "y", "—"), ("Ven. 20 nov. · 15:00", "Les métiers de la finance", "Terminé", "b", "62 présents")]
    lignes = "".join(f'<tr><td><b>{t}</b><div class="small mute">{d}</div></td><td><span class="chip {c}">{s}</span></td><td class="small">{n}</td></tr>' for d, t, s, c, n in salons)
    publics = "".join(f'<span class="chip b">{x}</span>' for x in ["Terminale", "Bac+1 à Bac+3", "Gabon", "Cameroun", "Sénégal", "Commerce et management"])
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">1 · École : « Salons virtuels » et demande d'un salon</div>
  {menu_ecole("Salons virtuels")}
  <div style="position:absolute;left:272px;right:32px;top:28px;display:grid;grid-template-columns:1fr 560px;gap:24px">
    <div><p class="small mute">Espace école › Salons virtuels</p><h1 style="font-size:30px;margin-top:6px">Salons virtuels</h1>
      <p class="mute" style="margin-top:6px">Présentez votre école en direct à des élèves de toute l'Afrique. Navigoal valide le salon, le publie et Navi invite les élèves dont le profil correspond.</p>
      <div class="card" style="margin-top:20px;padding:6px 8px"><table><tr><th>Salon</th><th>Statut</th><th>Participants</th></tr>{lignes}</table></div>
      <div class="card" style="margin-top:16px;padding:16px 18px;display:flex;gap:12px;align-items:center">{icon("sparkles", 20, "#a55a00")}<span class="small"><b>Ce qui est inclus :</b> page publique du salon, inscriptions, rappels aux inscrits, invitations par Navi aux élèves ciblés, salle en direct jusqu'à 2 h, bilan de présence.</span></div>
    </div>
    <div class="card" style="padding:22px 24px">
      <b style="font-size:19px">Demander un salon</b><p class="small mute" style="margin-top:4px">Service payant · tarif du catalogue des offres. L'équipe Navigoal vous confirme le salon et le règlement.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">
        {champ("Titre", "Journée portes ouvertes en ligne", True)}
        {champ("Date", "Jeudi 10 décembre 2026")}{champ("Heure et durée", "17:00 · 1 h 30")}
        {champ("Présentation", "Nos 6 filières, la vie sur le campus, les bourses, puis vos questions.", True)}
        <div style="grid-column:span 2"><div class="label">Public visé <span class="mute" style="font-weight:600">(Navi invite ces élèves)</span></div><div style="display:flex;gap:6px;flex-wrap:wrap">{publics}</div></div>
        {champ("Places", "150")}{champ("Co-présentateurs", "Salma B., Youssef K.")}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px"><span class="btn ghost">Annuler</span><span class="btn primary">{icon("send", 16, "#fff")}Envoyer la demande</span></div>
    </div>
  </div></div>"""


# ---------------------------------------------------------------- 2. Admin : validation
def admin():
    lignes = "".join(f"""<tr><td><b>{e}</b><div class="small mute">{t}</div></td><td class="small">{d}</td><td class="small">{p}</td><td><span class="chip {c}">{s}</span></td>
      <td style="text-align:right">{('<span class="btn primary" style="padding:8px 12px;font-size:13px">' + icon("check", 15, "#fff") + 'Valider</span> <span class="btn ghost" style="padding:8px 12px;font-size:13px;color:#d42a50">Refuser</span>') if s == "À valider" else ''}</td></tr>"""
        for e, t, d, p, s, c in [("ESA Casablanca", "Présenter le Bachelor management", "Mar. 19 janv. · 16:00 · 1 h", "Terminale · Gabon, Cameroun", "À valider", "y"),
                                  ("EMSI", "Devenir ingénieur au Maroc", "Sam. 12 déc. · 15:00 · 1 h 30", "Terminale S · toute l'Afrique", "À valider", "y"),
                                  ("ESA Casablanca", "Journée portes ouvertes en ligne", "Jeu. 10 déc. · 17:00 · 1 h 30", "Terminale · 3 pays", "Publié", "g")])
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">2 · Admin : demandes de salons à valider</div>
  {P.menu(P.ADMIN, "Établissements", "Back-office Navigoal")}
  <div style="position:absolute;left:272px;right:32px;top:28px">
    <h1 style="font-size:30px">Salons virtuels</h1><p class="mute" style="margin-top:6px">Une demande validée devient un abonnement « Salon virtuel » (montant et référence du règlement), la page est publiée et Navi peut l'annoncer.</p>
    <div class="card" style="margin-top:20px;padding:6px 8px"><table><tr><th>École et salon</th><th>Date</th><th>Public visé</th><th>Statut</th><th></th></tr>{lignes}</table></div>
    <div class="card" style="position:absolute;right:0;top:300px;width:470px;padding:22px 24px;border:2px solid #1a47f5">
      <b style="font-size:17px">Valider « Présenter le Bachelor management »</b>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">{champ("Montant (MAD)", "tarif du catalogue")}{champ("Règlement", "Virement · VIR-2026-1204")}</div>
      <label class="small" style="display:flex;gap:8px;margin-top:14px;align-items:center"><span style="width:18px;height:18px;border-radius:5px;background:#1a47f5"></span>Navi peut annoncer ce salon aux élèves ciblés</label>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><span class="btn ghost">Annuler</span><span class="btn primary">Valider et publier</span></div></div>
  </div></div>"""


# ---------------------------------------------------------------- 3. Public : page du salon
def public():
    return f"""<div class="frame" style="width:1440px;height:900px;background:#fff"><div class="titre-cadre">3 · Public : page du salon et inscription</div>
  <div style="height:72px;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 56px;gap:28px"><img src="{WORDMARK}" style="height:26px"><span class="small mute" style="font-weight:700">Métiers · Formations · Établissements · <b style="color:#1a47f5">Salons</b> · Navilease</span></div>
  <div style="background:linear-gradient(135deg,#0b1a4f,#1a47f5);color:#fff;padding:44px 56px;display:grid;grid-template-columns:1fr 420px;gap:40px">
    <div><span class="chip" style="background:rgba(255,255,255,.15);color:#fff">{icon("radio", 13, "#fff")}Salon virtuel en direct · gratuit</span>
      <div style="display:flex;gap:14px;align-items:center;margin-top:18px"><img src="{LOGO['esa']}" style="width:56px;height:56px;border-radius:14px;background:#fff;padding:6px"><span><b style="font-size:16px">ESA Casablanca</b><span style="display:block;opacity:.8;font-size:13px">École Supérieure des Affaires · Diplômes homologués</span></span></div>
      <h1 style="font-size:46px;margin-top:18px;line-height:1.1">Journée portes ouvertes en ligne</h1>
      <p style="margin-top:12px;font-size:17px;opacity:.9;max-width:640px">Nos 6 filières, la vie sur le campus de Casablanca, les bourses et les démarches pour les étudiants étrangers. Questions en direct à la fin.</p>
      <div style="display:flex;gap:22px;margin-top:20px;font-size:14px">{"".join(f'<span style="display:flex;gap:8px;align-items:center">{icon(i, 17, "#ffc21f")}{t}</span>' for i, t in [("calendar", "Jeudi 10 décembre 2026"), ("clock", "17:00 – 18:30 (votre heure)"), ("users", "48 inscrits · 102 places")])}</div></div>
    <div style="background:#fff;color:#0b1533;border-radius:20px;padding:22px">
      <b style="font-size:18px">Réserve ta place</b><p class="small mute" style="margin-top:4px">Avec ton compte Navigoal (gratuit). Tu reçois le lien, un rappel le matin et 15 min avant.</p>
      <span class="btn sun" style="width:100%;margin-top:14px;padding:13px">{icon("ticket", 17, "#0b1533")}Je m'inscris</span>
      <span class="btn ghost" style="width:100%;margin-top:8px">{icon("calendar-plus", 16, "#1a47f5")}Ajouter à mon agenda</span>
      <p class="small mute" style="margin-top:12px">Micro et caméra coupés pour les participants · questions par écrit · aucun enregistrement.</p></div>
  </div>
  <div style="padding:30px 56px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
    <div class="card" style="padding:18px"><b>Programme</b>{"".join(f'<div class="small" style="margin-top:8px;display:flex;gap:10px"><b style="width:44px">{h}</b><span class="mute">{t}</span></div>' for h, t in [("17:00", "Présentation de l'école"), ("17:20", "Les 6 filières"), ("17:50", "Bourses et coût réel"), ("18:05", "Vos questions")])}</div>
    <div class="card" style="padding:18px"><b>Présentateurs</b>{"".join(f'<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><span style="width:36px;height:36px;border-radius:50%;background:#fff3cc;display:flex;align-items:center;justify-content:center;font-weight:800;color:#a55a00;font-size:13px">{i}</span><span class="small"><b>{n}</b><span class="mute" style="display:block">{r}</span></span></div>' for i, n, r in [("SB", "Salma B.", "Responsable des admissions"), ("YK", "Youssef K.", "Directeur des études")])}</div>
    <div class="card" style="padding:18px"><b>Pour qui ?</b><p class="small mute" style="margin-top:8px">Élèves de terminale et étudiants Bac+1 à Bac+3 qui envisagent le commerce ou le management au Maroc, et leurs parents.</p></div>
  </div></div>"""


# ---------------------------------------------------------------- 4. Élève : Navi propose le salon
def navi():
    return f"""<div class="frame" style="width:390px;height:844px;background:#f6f8fe"><div class="titre-cadre">4 · Élève : Navi propose le salon</div>
  <div style="height:60px;background:#1a47f5;color:#fff;display:flex;align-items:center;padding:0 16px;gap:10px">{icon("sparkles", 20, "#ffc21f")}<b>Navi</b><span class="small" style="opacity:.8">ton conseiller d'orientation</span></div>
  <div style="padding:14px;display:flex;flex-direction:column;gap:12px">
    <div style="align-self:flex-end;max-width:260px;background:#1a47f5;color:#fff;border-radius:16px;padding:10px 13px;font-size:14px">Je pense au commerce, mais je ne connais pas les écoles.</div>
    <div style="max-width:300px;background:#fff;border:1px solid #e6eaf3;border-radius:16px;padding:10px 13px;font-size:14px;line-height:1.5">Bonne idée de les entendre directement : l'ESA présente ses formations en direct jeudi prochain, et tu pourras poser tes questions.</div>
    <div class="card" style="padding:14px">
      <span class="chip b">{icon("radio", 12, "#1a47f5")}Salon virtuel · gratuit</span>
      <div style="display:flex;gap:10px;align-items:center;margin-top:10px"><img src="{LOGO['esa']}" style="width:40px;height:40px;border-radius:10px;border:1px solid #e6eaf3;padding:3px"><b style="font-size:15px">Journée portes ouvertes en ligne</b></div>
      <p class="small mute" style="margin-top:6px">ESA Casablanca · jeu. 10 déc. · 17:00 · 1 h 30</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><span class="btn primary" style="font-size:13px">{icon("check", 15, "#fff")}Confirmer</span><span class="btn ghost" style="font-size:13px">Voir le salon</span></div>
      <p class="small mute" style="margin-top:8px">Tu seras inscrit·e seulement si tu confirmes.</p></div>
    <div style="max-width:300px;background:#fff;border:1px solid #e6eaf3;border-radius:16px;padding:10px 13px;font-size:14px">Tu veux que je t'en trouve d'autres, en ingénierie ou en santé ?</div>
  </div></div>"""


# ---------------------------------------------------------------- 5. Salon en direct
def direct():
    questions = "".join(f'<div style="padding:10px 12px;border-radius:12px;background:{"#eef2ff" if r else "#f6f8fe"};font-size:13px"><b>{q}</b><span class="mute" style="display:block;margin-top:2px">{t}</span>{f"<span class=chip style=margin-top:6px;background:#1a47f5;color:#fff>Répondue en direct</span>" if r else ""}</div>' for q, t, r in [("Grâce, Libreville", "Est-ce que la bourse d'excellence couvre aussi le logement ?", True), ("Yann, Douala", "On peut faire une alternance en 3e année ?", False), ("Mère de Kevin", "Quels sont les délais pour la carte de séjour ?", False)])
    return f"""<div class="frame" style="width:1440px;height:900px;background:#0b1533"><div class="titre-cadre">5 · Salon en direct (participant)</div>
  <div style="height:60px;display:flex;align-items:center;padding:0 20px;gap:14px;color:#fff">{icon("arrow-left", 18, "#fff")}<b>Journée portes ouvertes en ligne · ESA Casablanca</b>
    <span class="chip" style="background:#d42a50;color:#fff">● En direct</span><span class="small" style="opacity:.7">87 participants · non enregistré</span></div>
  <div style="position:absolute;left:20px;top:70px;right:400px;bottom:20px;border-radius:18px;background:#1b2648;overflow:hidden">
    <div style="position:absolute;inset:24px 24px 120px 24px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px">
      <b style="font-size:34px;color:#0b1533">Nos 6 filières</b><span class="mute">Écran partagé par Salma B.</span></div>
    <div style="position:absolute;left:24px;right:24px;bottom:20px;display:flex;gap:12px">
      {"".join(f'<div style="width:170px;height:84px;border-radius:12px;background:#2c3a66;color:#fff;display:flex;align-items:flex-end;padding:8px;font-size:12px;font-weight:700">{n}</div>' for n in ["Salma B. · présentatrice", "Youssef K. · présentateur"])}
      <span style="margin-left:auto;display:flex;gap:10px;align-items:center">{"".join(f'<span style="width:46px;height:46px;border-radius:50%;background:#2c3a66;display:flex;align-items:center;justify-content:center">{icon(i, 20, "#fff")}</span>' for i in ["mic-off", "video-off", "hand"])}<span style="height:46px;padding:0 18px;border-radius:23px;background:#d42a50;color:#fff;display:flex;align-items:center;font-weight:800;font-size:14px">Quitter</span></span></div>
  </div>
  <div style="position:absolute;right:20px;top:70px;width:360px;bottom:20px;border-radius:18px;background:#fff;padding:18px;display:flex;flex-direction:column;gap:10px">
    <b style="font-size:16px">Questions</b><p class="small mute">Pose ta question : les présentateurs y répondent à la fin, et peuvent te donner la parole.</p>
    {questions}
    <div style="margin-top:auto" class="field">Écrire une question…<span style="margin-left:auto">{icon("send", 16, "#1a47f5")}</span></div></div>
  </div>"""


# ---------------------------------------------------------------- 6. École : bilan
def bilan():
    stats = "".join(f'<div class="card" style="padding:18px"><span class="small mute">{t}</span><b style="display:block;font-size:30px;margin-top:4px">{n}</b><span class="small mute">{s}</span></div>' for t, n, s in [("Inscrits", "71", "dont 23 invités par Navi"), ("Présents", "62", "87 % des inscrits"), ("Questions", "19", "12 répondues en direct"), ("Candidatures depuis", "8", "dans les 7 jours")])
    lignes = "".join(f'<tr><td><b>{n}</b></td><td class="small">{p}</td><td class="small">{d}</td><td><span class="chip {c}">{s}</span></td></tr>' for n, p, d, s, c in [("Grâce N.", "Gabon · Terminale", "1 h 24", "Candidature envoyée", "g"), ("Yann O.", "Cameroun · Bac+1", "58 min", "Présent", "b"), ("Awa D.", "Sénégal · Terminale", "—", "Absente", "r")])
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">6 · École : bilan du salon et relance</div>
  {menu_ecole("Salons virtuels")}
  <div style="position:absolute;left:272px;right:32px;top:28px">
    <p class="small mute">Salons virtuels › Les métiers de la finance</p><h1 style="font-size:30px;margin-top:6px">Bilan du salon du 20 novembre</h1>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:18px">{stats}</div>
    <div class="card" style="margin-top:18px;padding:6px 8px"><table><tr><th>Participant</th><th>Profil</th><th>Temps de présence</th><th>Suite</th></tr>{lignes}</table></div>
    <div style="display:flex;gap:10px;margin-top:16px"><span class="btn primary">{icon("send", 16, "#fff")}Écrire aux participants</span><span class="btn ghost">{icon("send", 16, "#1a47f5")}Écrire aux absents (replanifier)</span><span class="btn ghost">{icon("download", 16, "#1a47f5")}Exporter (CSV)</span></div>
    <p class="small mute" style="margin-top:10px">Les messages passent par la messagerie Navigoal ; les coordonnées des élèves ne sont pas communiquées.</p>
  </div></div>"""


def main():
    out = os.path.join(P.OUT, "salons.html")
    corps = "".join([ecole_demande(), admin(), public(), navi(), direct(), bilan()])
    open(out, "w", encoding="utf-8").write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Salons virtuels</title><style>{CSS}</style></head><body>{corps}</body></html>')
    print(out)


if __name__ == "__main__":
    main()
