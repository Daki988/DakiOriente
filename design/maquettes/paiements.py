#!/usr/bin/env python3
"""Maquettes « Paiements » (novembre 2026).

Frais de candidature en monnaie locale, plafonnés à 10 000 F CFA (ou 15 € dans les autres monnaies).
Moyens : mobile money (passerelle E-Billing au Gabon : Airtel Money, Moov Money), carte bancaire (Stripe), espèces
(validées à la main par l'administrateur).

1. Administrateur : réglages des paiements (clés E-Billing et Stripe, espèces, plafond des frais)
2. Administrateur : paiements en espèces à valider
3. Élève : payer les frais de dossier (montant en monnaie locale, choix du moyen)
4. Élève sur téléphone : mobile money (code sur le téléphone) et espèces (instructions)

Usage : python3 design/maquettes/paiements.py <dossier icônes lucide>  → design/maquettes/out/paiements.html
"""
import os
import sys

sys.argv = sys.argv[:2]
import premium as P  # noqa: E402

icon, CSS, menu, ADMIN = P.icon, P.CSS, P.menu, P.ADMIN
NOTE = 'class="note"'
B = "#1a47f5"
ADM = ADMIN[:5] + [("credit-card", "Paiements"), ("settings", "Réglages des paiements")] + ADMIN[6:]


def champ(lab, val, secret=False, w="100%"):
    v = f'<span style="letter-spacing:3px">••••••••••••</span><span class="small mute">{val}</span>' if secret else val
    return f'<div style="width:{w}"><div class="label">{lab}</div><div class="field" style="justify-content:space-between">{v}{icon("eye-off", 15, "#8a93a8") if secret else ""}</div></div>'


def interrupteur(on=True):
    return f'<span style="width:40px;height:22px;border-radius:99px;background:{"#0f8a46" if on else "#c9d0de"};position:relative;display:inline-block"><span style="position:absolute;top:3px;{"right" if on else "left"}:3px;width:16px;height:16px;border-radius:50%;background:#fff"></span></span>'


def reglages():
    return f"""<div class="frame" style="width:1440px;height:1080px"><div class="titre-cadre">1 · Administrateur : réglages des paiements</div>
  {menu(ADM, "Réglages des paiements", "Administration")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:12px"><b style="font-size:26px">Réglages des paiements</b><span class="chip" style="background:#e8f8ef;color:#0f8a46">{icon("shield-check", 12, "#0f8a46")}Clés chiffrées, jamais réaffichées en clair</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">{icon("smartphone", 22, "#e05a00")}<b style="font-size:17px">Mobile money (Gabon)</b><span style="margin-left:auto">{interrupteur()}</span></div>
        <span class="small mute">Passerelle E-Billing (Digitech Africa) : Airtel Money et Moov Money, paiements en F CFA.</span>
        <div style="display:flex;gap:10px">{champ("Environnement", "Production")}{champ("Adresse de l'API", "https://…/api/v1")}</div>
        <div style="display:flex;gap:10px">{champ("Identifiant (username)", "oaps_navigoal")}{champ("Clé partagée (shared key)", "…4f2a", True)}</div>
        {champ("Adresse de notification à déclarer chez E-Billing", "https://navigoal.net/api/paiements/webhook/ebilling")}
        <div style="display:flex;gap:8px">{"".join(f'<span class="chip" style="background:#fff3e8;color:#e05a00">{icon("check", 12, "#e05a00")}{t}</span>' for t in ["Airtel Money", "Moov Money"])}</div>
        <div style="display:flex;gap:10px;align-items:center"><span class="btn" style="background:{B};color:#fff">Enregistrer</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3">{icon("plug-zap", 14, B)}Tester la connexion</span><span class="chip" style="background:#e8f8ef;color:#0f8a46">Connexion réussie · 06/11 18:20</span></div>
      </div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">{icon("credit-card", 22, "#635bff")}<b style="font-size:17px">Carte bancaire (Stripe)</b><span style="margin-left:auto">{interrupteur()}</span></div>
        <span class="small mute">Visa, Mastercard. Paiement sur la page sécurisée de Stripe, dans la monnaie de l'élève.</span>
        {champ("Clé publique", "pk_live_51P…")}
        {champ("Clé secrète", "…9xQ2", True)}
        {champ("Secret du webhook", "…a81c", True)}
        {champ("Adresse du webhook à déclarer chez Stripe", "https://navigoal.net/api/paiements/webhook/stripe")}
        <div style="display:flex;gap:10px;align-items:center"><span class="btn" style="background:{B};color:#fff">Enregistrer</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3">{icon("plug-zap", 14, B)}Tester la connexion</span></div>
      </div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">{icon("banknote", 22, "#0f8a46")}<b style="font-size:17px">Espèces</b><span style="margin-left:auto">{interrupteur()}</span></div>
        <span class="small mute">L'élève paie au bureau ; vous confirmez le paiement dans « Paiements à valider ».</span>
        <div><div class="label">Instructions affichées à l'élève</div><div class="field" style="height:84px;align-items:flex-start;line-height:1.5">Bureau OAPS Consulting Group, quartier Glass, Libreville. Du lundi au vendredi, 9 h – 17 h. Indiquez la référence du paiement (NG-PAY-…).</div></div>
        {champ("Délai pour payer", "7 jours, puis la demande expire")}
      </div>
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">{icon("receipt", 22, B)}<b style="font-size:17px">Frais de candidature</b></div>
        <span class="small mute">Toujours affichés et payés dans la monnaie de l'élève ; jamais plus que le plafond, même si l'école demande davantage.</span>
        <div style="display:flex;gap:10px">{champ("Plafond en F CFA (XAF, XOF)", "10 000 F CFA")}{champ("Plafond dans les autres monnaies", "15 € (converti au taux du jour)")}</div>
        <div style="border-radius:12px;background:#f6f8fe;padding:12px;font-size:13px;line-height:1.6">Exemple : l'école demande 500 MAD (≈ 30 500 F CFA) → l'élève gabonais paie <b>10 000 F CFA</b>.<br>L'école demande 200 MAD (≈ 12 200 F CFA) → <b>10 000 F CFA</b>. L'école demande 100 MAD → <b>6 100 F CFA</b>.</div>
      </div>
    </div>
  </div>
  <div {NOTE} style="left:620px;top:470px">Clé saisie une fois, affichée masquée ensuite</div>
  <div {NOTE} style="left:1120px;top:780px">Plafond appliqué à toutes les candidatures</div>
</div>"""


def especes():
    rows = [("NG-PAY-000184", "Amina Mba", "Frais de dossier · IIHEM", "10 000 F CFA", "il y a 2 h"), ("NG-PAY-000181", "Prisca Ndong (parent)", "Frais de dossier · ESSEM", "8 600 F CFA", "hier"), ("NG-PAY-000176", "Yann Obiang", "Frais de dossier · UIR", "10 000 F CFA", "il y a 3 jours")]
    tr = "".join(f'<tr><td><b>{r}</b></td><td>{n}</td><td>{o}</td><td style="font-weight:800">{m}</td><td class="small mute">{d}</td><td><div style="display:flex;gap:8px;justify-content:flex-end"><span class="btn" style="background:#0f8a46;color:#fff;padding:7px 12px;font-size:12px">{icon("check", 13, "#fff")}Paiement reçu</span><span class="btn" style="background:#fff;border:1px solid #e6eaf3;padding:7px 12px;font-size:12px">Refuser</span></div></td></tr>' for r, n, o, m, d in rows)
    return f"""<div class="frame" style="width:1440px;height:640px"><div class="titre-cadre">2 · Administrateur : paiements en espèces à valider</div>
  {menu(ADM, "Paiements", "Administration")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;align-items:center;gap:12px"><b style="font-size:26px">Paiements</b><div style="display:flex;gap:6px;margin-left:16px">{"".join(f'<span class="chip" style="padding:7px 12px;{"background:#0b1533;color:#fff" if t.startswith("À valider") else "background:#fff;border:1px solid #e6eaf3;color:#3b4566"}">{t}</span>' for t in ["Tous", "À valider (3)", "Mobile money", "Carte", "Espèces"])}</div></div>
    <div class="card" style="padding:4px 10px"><table><thead><tr><th>Référence</th><th>Payeur</th><th>Objet</th><th>Montant</th><th>Demandé</th><th style="text-align:right">Action</th></tr></thead><tbody>{tr}</tbody></table></div>
    <div class="card" style="padding:18px;width:520px;display:flex;flex-direction:column;gap:10px;border:2px solid #0f8a46"><b>Confirmer le paiement NG-PAY-000184</b>
      <div style="display:flex;gap:10px">{champ("Montant reçu", "10 000 F CFA")}{champ("N° de reçu remis", "R-2026-0412")}</div>
      <span class="small mute">La candidature passe en « Paiement confirmé » et l'élève reçoit son reçu par e-mail. L'action est enregistrée dans le journal.</span>
      <span class="btn" style="background:#0f8a46;color:#fff">Confirmer</span></div>
  </div></div>"""


def eleve():
    m = [("smartphone", "Mobile money", "Airtel Money ou Moov Money · code sur ton téléphone", True), ("credit-card", "Carte bancaire", "Visa, Mastercard · page sécurisée Stripe", False), ("banknote", "Espèces", "Au bureau OAPS, Glass, Libreville · validé sous 24 h", False)]
    ms = "".join(f'<div style="display:flex;gap:12px;align-items:center;padding:14px;border-radius:14px;border:{"2px solid " + B if on else "1.5px solid #e6eaf3"};background:{"#f3f6ff" if on else "#fff"}"><span style="width:20px;height:20px;border-radius:50%;border:2px solid {B if on else "#c9d0de"};display:flex;align-items:center;justify-content:center">{"<span style=\'width:10px;height:10px;border-radius:50%;background:" + B + "\'></span>" if on else ""}</span>{icon(ic, 22, B)}<span><b>{t}</b><span class="small mute" style="display:block">{d}</span></span></div>' for ic, t, d, on in m)
    return f"""<div class="frame" style="width:1440px;height:760px"><div class="titre-cadre">3 · Élève : payer les frais de dossier</div>
  {menu([("layout-dashboard", "Tableau de bord"), ("send", "Mes candidatures"), ("folder-open", "Mes documents"), ("compass", "Orientation"), ("house", "Logement"), ("credit-card", "Paiements"), ("message-circle", "Conseiller")], "Mes candidatures", "Espace élève")}
  <div style="position:absolute;left:240px;right:0;top:0;bottom:0;padding:28px 36px;display:grid;grid-template-columns:1fr 380px;gap:26px">
    <div style="display:flex;flex-direction:column;gap:14px"><b style="font-size:26px">Envoyer ma candidature</b><span class="small mute">IIHEM · Bachelor en Business Administration · dossier complet (8/8)</span>
      <b style="margin-top:6px">Comment veux-tu payer ?</b>{ms}
      <div class="field" style="width:380px">{icon("phone", 15, "#6b7493")}+241 077 12 34 56</div><span class="small mute">Numéro Airtel Money ou Moov Money qui recevra la demande de paiement.</span></div>
    <div class="card" style="padding:22px;display:flex;flex-direction:column;gap:12px;height:fit-content"><b>Récapitulatif</b>
      <div style="display:flex;justify-content:space-between;font-size:14px"><span>Frais de dossier</span><b style="font-size:22px">10 000 F CFA</b></div>
      <span class="small mute">Frais demandés par l'école : 200 MAD (≈ 12 200 F CFA). Navigoal applique le plafond de 10 000 F CFA.</span>
      <span class="btn" style="background:{B};color:#fff;padding:14px">Payer 10 000 F CFA</span>
      <span class="small mute" style="text-align:center">{icon("lock", 12, "#6b7493")} Paiement sécurisé · reçu envoyé par e-mail</span></div>
  </div>
  <div {NOTE} style="left:1160px;top:250px">Montant dans la monnaie de l'élève, plafonné</div>
</div>"""


def mobile():
    a = f"""<div class="frame" style="width:390px;height:740px;background:#fff;margin-right:20px"><div class="titre-cadre">4 · Téléphone : mobile money</div>
  <div style="padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center">{icon("smartphone", 48, B)}<b style="font-size:22px">Valide sur ton téléphone</b>
    <span style="font-size:14px;color:#3b4566;line-height:1.6">Une demande de paiement de <b>10 000 F CFA</b> a été envoyée au <b>077 12 34 56</b>. Saisis ton code secret Airtel Money pour confirmer.</span>
    <div style="width:120px;height:120px;border-radius:50%;border:6px solid #e6eaf3;border-top-color:{B}"></div><span class="small mute">En attente de confirmation…</span>
    <span class="small" style="color:{B};font-weight:800">Je n'ai rien reçu : renvoyer la demande</span></div></div>"""
    b = f"""<div class="frame" style="width:390px;height:740px;background:#fff"><div class="titre-cadre">4 bis · Téléphone : espèces</div>
  <div style="padding:30px 20px;display:flex;flex-direction:column;gap:14px">{icon("banknote", 44, "#0f8a46")}<b style="font-size:22px">Paiement en espèces</b>
    <div style="border-radius:16px;background:#f6f8fe;padding:16px;display:flex;flex-direction:column;gap:6px"><span class="small mute">Référence à indiquer</span><b style="font-size:24px;letter-spacing:.04em">NG-PAY-000184</b><span class="small mute">Montant : <b>10 000 F CFA</b></span></div>
    <span style="font-size:14px;line-height:1.6;color:#3b4566">Bureau OAPS Consulting Group, quartier Glass, Libreville. Du lundi au vendredi, 9 h – 17 h.</span>
    <span class="small mute">Ta candidature part dès que l'équipe a confirmé ton paiement (sous 24 h ouvrées). La demande expire dans 7 jours.</span>
    <span class="btn" style="background:#fff;border:1px solid #e6eaf3">Changer de moyen de paiement</span></div></div>"""
    return a + b


html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal · Paiements</title><style>{CSS}</style></head><body>
{reglages()}{especes()}{eleve()}{mobile()}
</body></html>"""
open(os.path.join(P.OUT, "paiements.html"), "w").write(html)
print("→", os.path.join(P.OUT, "paiements.html"), f"({len(html) // 1024} Ko)")
