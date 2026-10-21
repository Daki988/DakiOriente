// Audit fonctionnel, volet 3 : les parcours clés joués dans un vrai navigateur (formulaires, boutons, redirections).
// Usage : BASE=http://localhost:3000 OUT=dossier MDP=… node scripts/audit-ui.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "audit-fonctionnel";
const MDP = process.env.MDP || "Navigoal2026";
const RUN = Date.now().toString(36);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined });
const resultats = [];
let codeTest = null;

/** Un parcours = un contexte de navigateur neuf ; chaque étape est consignée, capture d'écran en cas d'échec. */
async function parcours(nom, viewport, etapes) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message.slice(0, 200)));
  page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 500) erreurs.push(`${r.request().method()} ${r.url().replace(BASE, "")} → ${r.status()}`); });
  for (const [libelle, fn] of etapes) {
    erreurs.length = 0;
    try {
      await fn(page);
      if (erreurs.length) throw new Error(erreurs.join(" | "));
      resultats.push({ parcours: nom, etape: libelle, ok: true });
    } catch (e) {
      const img = `${nom}-${resultats.length}.png`.replace(/[^\w.-]+/g, "_");
      await page.screenshot({ path: path.join(OUT, img), fullPage: true }).catch(() => {});
      resultats.push({ parcours: nom, etape: libelle, ok: false, detail: String(e.message).split("\n")[0].slice(0, 300), capture: img, url: page.url().replace(BASE, "") });
      console.log(`✗ [${nom}] ${libelle} : ${String(e.message).split("\n")[0].slice(0, 200)} (${page.url().replace(BASE, "")})`);
      break; // la suite du parcours dépend de cette étape
    }
  }
  await ctx.close();
}

const ouvrir = (u) => async (p) => { await p.goto(BASE + u, { waitUntil: "networkidle" }); };
const attendreUrl = (re) => async (p) => { await p.waitForURL(re, { timeout: 20000 }); };
const connexion = (identifiant) => [
  ["ouvrir la connexion", ouvrir("/connexion/")],
  ["saisir les identifiants et se connecter", async (p) => {
    await p.getByLabel("E-mail ou numéro de téléphone").fill(identifiant);
    await p.getByLabel("Mot de passe", { exact: true }).fill(MDP);
    await p.getByRole("button", { name: /^Se connecter$/ }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 });
  }],
];
const voirTexte = (t) => async (p) => { await p.getByText(t).first().waitFor(); };

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 844 };

// 1. Inscription élève (majeur) puis test d'orientation, profil, documents, déconnexion — sur mobile
await parcours("eleve-mobile", MOBILE, [
  ["ouvrir l'inscription", ouvrir("/inscription/")],
  ["choisir le profil élève", async (p) => { await p.getByRole("radio", { name: /Élève/ }).first().click(); await p.getByRole("button", { name: /Continuer en tant que/ }).click(); }],
  ["remplir le formulaire", async (p) => {
    await p.getByLabel("Prénom").fill("Audit");
    await p.getByLabel(/^Nom\b/).fill("Mobile");
    await p.getByLabel("Année de naissance").fill(String(new Date().getFullYear() - 19));
    await p.getByLabel("Adresse e-mail").fill(`audit.mobile.${RUN}@exemple.ga`);
    await p.getByLabel(/^Mot de passe/).fill(MDP);
    await p.getByLabel("Confirme le mot de passe").fill(MDP);
    // Les onglets E-mail / Téléphone ne doivent pas soumettre le formulaire
    await p.getByRole("tab", { name: "Téléphone" }).click();
    await p.getByRole("tab", { name: "E-mail" }).click();
    if (await p.getByText(/requis|obligatoire|invalide/i).count()) throw new Error("un clic sur un onglet a soumis le formulaire");
    await p.getByRole("checkbox").last().check({ force: true }).catch(async () => { await p.getByText("J'accepte les").click(); });
  }],
  ["créer le compte", async (p) => {
    const rep = p.waitForResponse((r) => r.url().includes("/api/auth/inscription"));
    await p.getByRole("button", { name: /Créer mon compte/ }).click();
    codeTest = (await (await rep).json().catch(() => ({}))).devCode;
    await p.waitForURL((u) => !u.pathname.startsWith("/inscription"), { timeout: 20000 }); }],
  ["vérifier l'e-mail avec le code reçu", async (p) => {
    if (!p.url().includes("/verification")) return;
    // Code renvoyé par l'API quand OTP_DEBUG=1 (instance d'audit uniquement)
    // Code renvoyé par l'inscription quand OTP_DEBUG=1 (instance d'audit uniquement)
    const devCode = codeTest;
    if (!devCode) throw new Error("pas de code de test : lancer le serveur avec OTP_DEBUG=1");
    await p.locator("input[inputmode=numeric]").first().click();
    await p.keyboard.type(devCode);
    const valider = p.getByRole("button", { name: "Valider" });
    if (await valider.isEnabled()) await valider.click().catch(() => {});
    await p.waitForURL((u) => !u.pathname.startsWith("/verification"), { timeout: 20000 });
  }],
  ["arriver dans l'espace", async (p) => { if (!/espace|verification|bienvenue/.test(p.url())) await p.goto(BASE + "/espace/", { waitUntil: "networkidle" }); await p.getByText(/Bienvenue Audit/).first().waitFor(); }],
  ["passer le test d'orientation", async (p) => {
    await p.goto(BASE + "/orientation/", { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /Commencer le test|Repasser le test/ }).click();
    // Une réponse par question : le choix fait avancer tout seul (attendre la fin de l'animation)
    const fin = p.getByRole("button", { name: /Voir mon profil/ });
    for (let i = 0; i < 15 && !(await fin.isVisible() && await fin.isEnabled()); i++) {
      await p.locator("main").getByRole("radio").first().click();
      await p.waitForTimeout(900);
    }
    await fin.click();
    await p.waitForURL(/espace\/orientation/, { timeout: 20000 });
    await p.goto(BASE + "/espace/orientation/", { waitUntil: "networkidle" });
    await p.getByRole("heading", { name: "Mon profil d'orientation" }).waitFor();
  }],
  ["modifier le profil", async (p) => {
    await p.goto(BASE + "/espace/profil/", { waitUntil: "networkidle" });
    await p.getByLabel("Ville").first().fill("Port-Gentil");
    await p.getByRole("button", { name: /Enregistrer/ }).first().click();
    await p.getByText(/enregistr|mis à jour/i).first().waitFor();
  }],
  ["déposer un document", async (p) => {
    await p.goto(BASE + "/espace/documents/", { waitUntil: "networkidle" });
    const input = p.locator("input[type=file]").first();
    await input.setInputFiles({ name: "releve.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
    await p.getByText(/releve\.pdf|déposé|ajouté/i).first().waitFor();
  }],
  ["se déconnecter", async (p) => {
    const btn = p.getByRole("button", { name: /Se déconnecter|Déconnexion/ });
    if (!(await btn.count()) || !(await btn.first().isVisible())) await p.getByRole("button", { name: /menu|compte|profil/i }).first().click();
    await p.getByRole("button", { name: /Se déconnecter|Déconnexion/ }).first().click();
    await p.waitForURL((u) => !u.pathname.startsWith("/espace"), { timeout: 20000 });
  }],
]);

// 2. Étudiante démo : candidature depuis l'interface
await parcours("etudiant", DESKTOP, [
  ...connexion("amina.demo@demo.navigoal.net"),
  ["tableau de bord", voirTexte(/Amina/)],
  ["nouvelle candidature", async (p) => {
    await p.goto(BASE + "/espace/candidatures/nouvelle/?etab=ma-esa-casa&formation=frm-licence-hotellerie", { waitUntil: "networkidle" });
    await p.waitForTimeout(1000);
    if (await p.getByText("Impossible de démarrer la candidature").count()) throw new Error("candidature non démarrée");
    await p.getByRole("button", { name: /Continuer|Suivant|Commencer|Envoyer/ }).first().waitFor();
  }],
  ["mes candidatures", async (p) => { await p.goto(BASE + "/espace/candidatures/", { waitUntil: "networkidle" }); await p.locator("main a[href*='/espace/candidatures/']").first().waitFor(); }],
  ["ouvrir une candidature", async (p) => { await p.locator("main a[href*='/espace/candidatures/']:not([href$='nouvelle/'])").first().click(); await p.waitForLoadState("networkidle"); await p.getByText(/Statut|Dossier|candidature/i).first().waitFor(); }],
  ["messagerie : envoyer un message", async (p) => {
    await p.goto(BASE + "/messages/", { waitUntil: "networkidle" });
    const fil = p.locator("main a[href*='/messages/']").first();
    if (await fil.count()) await fil.click();
    await p.waitForLoadState("networkidle");
    const zone = p.locator("textarea, input[type=text]").last();
    await zone.fill(`Message d'audit ${RUN}`);
    await zone.press("Enter").catch(() => {});
    const envoyer = p.getByRole("button", { name: /Envoyer/ });
    if (await envoyer.count() && await envoyer.first().isEnabled()) await envoyer.first().click();
    await p.getByText(`Message d'audit ${RUN}`).first().waitFor();
  }],
  ["demander un rendez-vous conseiller", async (p) => {
    await p.goto(BASE + "/espace/conseiller/", { waitUntil: "networkidle" });
    await p.getByLabel("Sujet").selectOption({ index: 1 });
    await p.getByLabel("Précisions").fill(`Audit ${RUN} : choisir entre deux écoles`);
    await p.getByRole("button", { name: "Demander un rendez-vous" }).click();
    await p.getByText(/demande (a été )?envoyée|enregistrée|bien reçue|en attente/i).first().waitFor();
  }],
  ["notifications", async (p) => { await p.goto(BASE + "/notifications/", { waitUntil: "networkidle" }); await p.locator("main").waitFor(); }],
]);

// 3. Établissement : faire avancer une candidature
await parcours("etablissement", DESKTOP, [
  ...connexion("ecole.demo@demo.navigoal.net"),
  ["liste des candidatures", async (p) => { await p.goto(BASE + "/etablissement/candidatures/", { waitUntil: "networkidle" }); await p.locator("main tbody tr").first().waitFor(); }],
  ["ouvrir un dossier", async (p) => { await p.locator("main tbody tr").first().click(); await p.waitForURL(/etablissement\/candidatures\/./); await p.waitForLoadState("networkidle"); await p.getByText(/Statut|Pièces|Documents/i).first().waitFor(); }],
  ["fiche : enregistrer", async (p) => {
    await p.goto(BASE + "/etablissement/fiche/", { waitUntil: "networkidle" });
    const d = p.getByLabel("Description");
    await d.fill((await d.inputValue()).replace(/ \(audit [^)]*\)$/, "") + ` (audit ${RUN})`);
    await p.getByRole("button", { name: /Enregistrer/ }).first().click();
    await p.getByText(/enregistr|mise à jour/i).first().waitFor();
  }],
  ["formations", async (p) => { await p.goto(BASE + "/etablissement/formations/", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Nouvelle formation|Ajouter|Publier/ }).first().waitFor(); }],
  ["campagnes", async (p) => { await p.goto(BASE + "/etablissement/campagnes/", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Nouvelle campagne|Créer|Ajouter/ }).first().waitFor(); }],
]);

// 4. Bailleur : formulaire de nouvelle annonce
await parcours("bailleur", DESKTOP, [
  ...connexion("bailleur.demo@demo.navigoal.net"),
  ["mes annonces", async (p) => { await p.goto(BASE + "/bailleur/annonces/", { waitUntil: "networkidle" }); await p.locator("main a[href*='/bailleur/annonces/']").first().waitFor(); }],
  ["nouvelle annonce : enregistrer le brouillon", async (p) => {
    await p.goto(BASE + "/bailleur/annonces/nouvelle/", { waitUntil: "networkidle" });
    await p.getByLabel(/Titre/).first().fill(`Chambre audit ${RUN}`);
    await p.getByLabel(/Description/).first().fill("Chambre meublée lumineuse, wifi et eau incluses, à 5 minutes du tram, idéale pour étudiant.");
    await p.getByLabel(/Ville/).first().fill("Rabat").catch(() => {});
    await p.getByLabel(/Loyer/).first().fill("2200");
    await p.getByRole("button", { name: /Enregistrer|Créer|Continuer/ }).first().click();
    await p.waitForURL(/bailleur\/annonces\/(?!nouvelle)/, { timeout: 20000 });
  }],
  ["réservations", async (p) => { await p.goto(BASE + "/bailleur/reservations/", { waitUntil: "networkidle" }); await p.locator("main").waitFor(); }],
]);

// 5. Parent, conseiller, admin : écrans clés et une action chacun
await parcours("parent", MOBILE, [
  ...connexion("parent.demo@demo.navigoal.net"),
  ["enfants suivis", async (p) => { await p.goto(BASE + "/parent/enfants/", { waitUntil: "networkidle" }); await p.getByText(/Amina/).first().waitFor(); }],
  ["paiements", async (p) => { await p.goto(BASE + "/parent/paiements/", { waitUntil: "networkidle" }); await p.locator("main").waitFor(); }],
]);
await parcours("conseiller", DESKTOP, [
  ...connexion("conseiller.demo@demo.navigoal.net"),
  ["demandes de rendez-vous", async (p) => { await p.goto(BASE + "/conseiller/", { waitUntil: "networkidle" }); await p.getByText(/rendez-vous|demande/i).first().waitFor(); }],
]);
await parcours("admin", DESKTOP, [
  ...connexion("admin@demo.navigoal.net"),
  ["utilisateurs : recherche", async (p) => {
    await p.goto(BASE + "/admin/utilisateurs/", { waitUntil: "networkidle" });
    await p.getByRole("searchbox").or(p.getByPlaceholder(/Rechercher/)).first().fill("amina");
    await p.locator("main >> text=amina.demo@demo.navigoal.net >> visible=true").first().waitFor();
  }],
  ["campagne : filtre et export", async (p) => {
    await p.goto(BASE + "/admin/campagne/", { waitUntil: "networkidle" });
    await p.getByText("Inscriptions par source").waitFor();
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("link", { name: /Export CSV/ }).click()]);
    if (!(await dl.path())) throw new Error("export vide");
  }],
  ["modération Navilease", async (p) => { await p.goto(BASE + "/admin/navilease/", { waitUntil: "networkidle" }); await p.locator("main").waitFor(); }],
]);

await browser.close();
fs.writeFileSync(path.join(OUT, "ui.json"), JSON.stringify(resultats, null, 1));
const ko = resultats.filter((r) => !r.ok);
console.log(`\n${resultats.length} étapes, ${ko.length} en échec`);
