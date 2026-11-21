#!/usr/bin/env python3
"""Maquettes « Rendez-vous d'appel » (novembre 2026) : les appels audio et vidéo deviennent des rendez-vous planifiés.

1. École : planifier un rendez-vous depuis le fil d'une candidature (date, heure, durée, vidéo ou audio, objet)
2. École : agenda des rendez-vous (calendrier du mois, liste par jour, rejoindre, déplacer, annuler)
3. Élève (téléphone) : la carte du rendez-vous dans le fil et la notification
4. Élève (téléphone) : « Mes rendez-vous » et la page du lien avant l'heure (compte à rebours, ajouter à l'agenda)

Usage : python3 design/maquettes/rendez_vous.py <dossier icônes lucide>  → design/maquettes/out/rendez-vous.html
"""
import os
import sys

import premium as P

icon, CSS, WORDMARK, LOGO = P.icon, P.CSS, P.WORDMARK, P.LOGO
JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]


def menu_ecole(actif):
    items = [("layout-dashboard", "Tableau de bord"), ("inbox", "Candidatures"), ("calendar-clock", "Rendez-vous"), ("messages-square", "Messagerie"), ("graduation-cap", "Formations"), ("wallet", "Scolarité"), ("settings", "Paramètres")]
    return P.menu(items, actif, "ESA Casablanca · espace école")


def chip_rdv(t, c="b"):
    return f'<span class="chip {c}">{t}</span>'


# ---------------------------------------------------------------- 1. Planifier depuis le fil
def planifier():
    jours = "".join(f'<span style="width:38px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:13px;font-weight:{800 if d == 2 else 600};{"background:#1a47f5;color:#fff" if d == 2 else "color:#c3c9d8" if d < 1 else "color:#0b1533"}">{d if d > 0 else ""}</span>' for d in [0] + list(range(1, 32)))
    creneaux = "".join(f'<span class="chip" style="padding:8px 12px;font-size:13px;{"background:#1a47f5;color:#fff" if h == "15:00" else "background:#f1f4fb;color:#3b4566"}">{h}</span>' for h in ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"])
    durees = "".join(f'<span class="chip" style="padding:8px 14px;font-size:13px;{"background:#1a47f5;color:#fff" if d == 30 else "background:#f1f4fb;color:#3b4566"}">{d} min</span>' for d in [15, 30, 45, 60, 90])
    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">1 · École : planifier un rendez-vous depuis le fil de la candidature</div>
  {menu_ecole("Messagerie")}
  <div style="position:absolute;left:240px;top:0;right:0;height:72px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 28px;gap:14px">
    <span style="width:40px;height:40px;border-radius:50%;background:#fff3cc;display:flex;align-items:center;justify-content:center;font-weight:800;color:#a55a00">AM</span>
    <span><b>Amina M.</b><span class="small mute" style="display:block">Candidature 2026-0412 · Bachelor management</span></span>
    <span style="margin-left:auto;display:flex;gap:8px"><span class="btn ghost">{icon("video", 16, "#1a47f5")}Appel vidéo</span><span class="btn ghost">{icon("phone", 16, "#1a47f5")}Audio seul</span>
    <span class="btn primary">{icon("calendar-plus", 16, "#fff")}Planifier un rendez-vous</span></span></div>
  <div style="position:absolute;left:240px;top:72px;right:0;bottom:0;background:rgba(11,21,51,.35)"></div>
  <div class="card" style="position:absolute;left:520px;top:110px;width:720px;padding:26px 28px">
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">Planifier un rendez-vous avec Amina</b>{icon("x", 20, "#5b6478")}</div>
    <p class="small mute" style="margin-top:6px">Amina et ses parents reçoivent le lien tout de suite, puis un rappel le matin du jour et 15 minutes avant.</p>
    <div style="margin-top:18px"><div class="label">Objet</div><div class="field">Entretien d'admission · Bachelor management</div></div>
    <div style="display:grid;grid-template-columns:300px 1fr;gap:26px;margin-top:18px">
      <div><div class="label">Date</div>
        <div style="border:1.5px solid #e6eaf3;border-radius:14px;padding:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:14px">{icon("chevron-left", 16, "#5b6478")}Décembre 2026{icon("chevron-right", 16, "#5b6478")}</div>
          <div style="display:grid;grid-template-columns:repeat(7,38px);gap:2px;margin-top:10px">{"".join(f'<span class="small mute" style="text-align:center;font-weight:700">{j[:2]}</span>' for j in JOURS)}{jours}</div></div></div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div><div class="label">Heure <span class="mute" style="font-weight:600">(heure de Libreville et de Casablanca)</span></div><div style="display:flex;gap:8px;flex-wrap:wrap">{creneaux}<span class="chip" style="padding:8px 12px;font-size:13px;border:1.5px dashed #c3c9d8;color:#5b6478">Autre heure…</span></div></div>
        <div><div class="label">Durée</div><div style="display:flex;gap:8px;flex-wrap:wrap">{durees}</div></div>
        <div><div class="label">Type d'appel</div><div style="display:flex;gap:10px">
          <span class="btn" style="border:2px solid #1a47f5;background:#eef2ff;color:#1a47f5">{icon("video", 16, "#1a47f5")}Vidéo</span><span class="btn" style="border:1.5px solid #d6dcea;color:#3b4566">{icon("phone", 16, "#3b4566")}Audio seul</span></div></div>
      </div></div>
    <div style="margin-top:22px;padding:14px 16px;border-radius:14px;background:#f6f8fe;display:flex;gap:12px;align-items:center;font-size:13.5px">{icon("calendar-check", 20, "#0f8a46")}<span><b>Mercredi 2 décembre à 15:00 · 30 min · vidéo.</b> <span class="mute">Le lien s'ouvre 10 minutes avant l'heure.</span></span></div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px"><span class="btn ghost">Annuler</span><span class="btn primary">{icon("send", 16, "#fff")}Planifier et envoyer le lien</span></div>
  </div></div>"""


# ---------------------------------------------------------------- 2. Agenda
def agenda():
    rdv = {2: 2, 3: 1, 7: 3, 9: 1, 14: 2, 16: 1}
    cases = ""
    for k, d in enumerate([0] + list(range(1, 32)) + [0, 0, 0]):
        if k >= 35: break
        n = rdv.get(d, 0)
        st = "background:#1a47f5;color:#fff" if d == 2 else ("color:#0b1533" if d else "")
        pts = "".join('<span style="width:5px;height:5px;border-radius:50%;background:' + ("#fff" if d == 2 else "#1a47f5") + '"></span>' for _ in range(min(n, 3)))
        cases += f'<div style="height:52px;border-radius:12px;{st};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-weight:{800 if d == 2 else 600};font-size:14px">{d or ""}<span style="display:flex;gap:3px">{pts}</span></div>'

    def carte(h, fin, qui, objet, typ, etat, actions=True, statut=None):
        return f"""<div class="card" style="padding:16px 18px;display:flex;gap:18px;align-items:center">
        <div style="width:72px;text-align:center"><b style="font-size:20px">{h}</b><div class="small mute">{fin}</div></div>
        <div style="width:1px;align-self:stretch;background:#eef1f8"></div>
        <div style="flex:1"><div style="display:flex;gap:8px;align-items:center"><b>{objet}</b>{statut or ""}</div>
          <div class="small mute" style="margin-top:4px;display:flex;gap:12px;align-items:center">{icon("user", 13, "#5b6478")}{qui}<span>{icon("video" if typ == "Vidéo" else "phone", 13, "#5b6478")} {typ}</span></div></div>
        {('<span class="btn primary">' + icon("video", 15, "#fff") + 'Rejoindre</span>') if etat == "ouvert" else ('<span class="chip y">' + etat + '</span>')}
        {('<span class="btn ghost" style="padding:10px">' + icon("calendar-plus", 16, "#1a47f5") + '</span><span class="btn ghost" style="padding:10px">' + icon("pencil", 16, "#1a47f5") + '</span><span class="btn ghost" style="padding:10px;color:#d42a50;border-color:#f3c5cf">' + icon("x", 16, "#d42a50") + '</span>') if actions else ""}</div>"""

    return f"""<div class="frame" style="width:1440px;height:900px"><div class="titre-cadre">2 · École : agenda des rendez-vous</div>
  {menu_ecole("Rendez-vous")}
  <div style="position:absolute;left:272px;right:32px;top:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><p class="small mute">Espace école › Rendez-vous</p><h1 style="font-size:30px;margin-top:6px">Rendez-vous</h1>
      <p class="mute" style="margin-top:4px">Entretiens d'admission et échanges avec les candidats et leurs parents. Rappels envoyés le matin du jour et 15 minutes avant.</p></div>
      <span style="display:flex;gap:8px"><span class="btn ghost">{icon("history", 16, "#1a47f5")}Passés</span><span class="btn primary">{icon("calendar-plus", 16, "#fff")}Planifier</span></span></div>
    <div style="display:grid;grid-template-columns:400px 1fr;gap:24px;margin-top:22px">
      <div class="card" style="padding:18px;height:max-content">
        <div style="display:flex;justify-content:space-between;align-items:center;font-weight:800">{icon("chevron-left", 18, "#5b6478")}Décembre 2026{icon("chevron-right", 18, "#5b6478")}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:12px">{"".join(f'<span class="small mute" style="text-align:center;font-weight:700">{j}</span>' for j in JOURS)}{cases}</div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #eef1f8;display:flex;justify-content:space-between" class="small"><span class="mute">Ce mois-ci</span><b>10 rendez-vous</b></div>
        <div style="margin-top:12px;padding:12px;border-radius:12px;background:#f6f8fe;font-size:12.5px;display:flex;gap:8px">{icon("calendar-check", 16, "#1a47f5")}<span class="mute">Ajoutez un rendez-vous à votre agenda (Google, Outlook, téléphone) avec le bouton {icon("calendar-plus", 13, "#5b6478")}.</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <b style="font-size:15px">Aujourd'hui · mercredi 2 décembre</b>
        {carte("15:00", "30 min", "Amina M. · parents prévenus", "Entretien d'admission · Bachelor management", "Vidéo", "ouvert")}
        {carte("16:30", "45 min", "Yann O. · Libreville", "Entretien d'admission · Ingénierie", "Audio", "dans 1 h 30")}
        <b style="font-size:15px;margin-top:10px">Jeudi 3 décembre</b>
        {carte("10:00", "30 min", "Grâce N. et sa mère", "Questions sur l'inscription définitive", "Vidéo", "demain")}
        <b style="font-size:15px;margin-top:10px">Lundi 7 décembre</b>
        {carte("09:00", "30 min", "Kevin B.", "Entretien d'admission · Bachelor management", "Vidéo", "lundi", statut='<span class="chip r">Annulé</span>', actions=False)}
      </div></div></div></div>"""


# ---------------------------------------------------------------- 3 et 4. Élève sur téléphone
def tel(titre, corps):
    return f"""<div class="frame" style="width:390px;height:844px;background:#f6f8fe"><div class="titre-cadre">{titre}</div>
  <div style="height:60px;background:#fff;border-bottom:1px solid #e6eaf3;display:flex;align-items:center;padding:0 16px;gap:10px"><img src="{WORDMARK}" style="height:22px"><span style="margin-left:auto">{icon("bell", 20, "#0b1533")}</span></div>{corps}</div>"""


def eleve_fil():
    return tel("3 · Élève : le rendez-vous dans le fil, et la notification", f"""
  <div style="margin:12px;padding:12px 14px;border-radius:16px;background:#0b1533;color:#fff;display:flex;gap:10px">{icon("calendar-clock", 20, "#ffc21f")}
    <span style="font-size:13px"><b>Appel vidéo planifié le mercredi 2 décembre à 15:00</b><span style="display:block;opacity:.75">ESA Casablanca · Entretien d'admission · 30 min</span></span></div>
  <div style="padding:6px 16px;display:flex;flex-direction:column;gap:12px">
    {P.bulle("ESA Casablanca", "école", "Bonjour Amina, votre dossier est complet. Nous vous proposons un entretien.", "10:12")}
    <div class="card" style="padding:16px;border:1.5px solid #bcd2ff">
      <div style="display:flex;gap:10px;align-items:center">{icon("calendar-clock", 22, "#1a47f5")}<b>Entretien d'admission</b></div>
      <div style="margin-top:10px;font-size:22px;font-weight:800">Mer. 2 déc. · 15:00</div>
      <div class="small mute" style="margin-top:2px">30 min · appel vidéo · heure de Libreville et de Casablanca</div>
      <div style="display:flex;gap:6px;margin-top:10px"><span class="chip g">{icon("bell", 12, "#0f8a46")}Rappel le matin et 15 min avant</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><span class="btn ghost" style="font-size:13px">{icon("calendar-plus", 15, "#1a47f5")}Mon agenda</span><span class="btn" style="font-size:13px;background:#eef1f8;color:#8a93ad">{icon("video", 15, "#8a93ad")}Dans 2 jours</span></div>
    </div>
    {P.bulle("Amina", "candidate", "Parfait, je serai là. Merci !", "10:20", "d", "#eef2ff", "#d6e0ff")}
  </div>""")


def eleve_rdv():
    return tel("4 · Élève : « Mes rendez-vous » et la page du lien avant l'heure", f"""
  <div style="padding:16px">
    <h1 style="font-size:24px">Mes rendez-vous</h1><p class="small mute" style="margin-top:4px">Écoles, logement, conseiller : tous tes appels planifiés.</p>
    <div class="card" style="margin-top:14px;padding:18px;text-align:center">
      <span class="chip b">{icon("video", 12, "#1a47f5")}Appel vidéo · ESA Casablanca</span>
      <p style="margin-top:10px;font-weight:800;font-size:16px">Entretien d'admission</p>
      <p class="small mute">Mercredi 2 décembre · 15:00 · 30 min</p>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:14px">{"".join(f'<span style="width:62px;padding:8px 0;border-radius:12px;background:#f6f8fe"><b style="font-size:22px;display:block">{n}</b><span class="small mute">{u}</span></span>' for n, u in [("2", "jours"), ("04", "heures"), ("38", "min")])}</div>
      <p class="small mute" style="margin-top:12px">Le lien s'ouvre 10 minutes avant l'heure.</p>
      <span class="btn primary" style="margin-top:12px;width:100%">{icon("calendar-plus", 16, "#fff")}Ajouter à mon agenda</span>
    </div>
    <b style="display:block;margin-top:20px;font-size:14px">À venir</b>
    {"".join(f'<div class="card" style="margin-top:10px;padding:12px 14px;display:flex;gap:12px;align-items:center"><span style="width:52px;text-align:center"><b style="display:block">{j}</b><span class="small mute">{h}</span></span><span style="flex:1"><b style="font-size:14px">{o}</b><span class="small mute" style="display:block">{q}</span></span>{icon("chevron-right", 18, "#8a93ad")}</div>' for j, h, o, q in [("3 déc.", "11:00", "Visite virtuelle du studio", "Bailleur · Navilease"), ("9 déc.", "17:00", "Point sur mon budget", "Conseiller Navigoal")])}
  </div>""")


def main():
    out = os.path.join(P.OUT, "rendez-vous.html")
    open(out, "w", encoding="utf-8").write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rendez-vous d\'appel</title><style>{CSS}</style></head><body>{planifier()}{agenda()}{eleve_fil()}{eleve_rdv()}</body></html>')
    print(out)


if __name__ == "__main__":
    main()
