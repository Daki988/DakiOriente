import { beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://postgres@localhost:5433/navigoal_test";
process.env.STORAGE = "local";

const { db, schema } = await import("@/server/db");
const accounts = await import("@/server/services/accounts");
const guardians = await import("@/server/services/guardians");
const docs = await import("@/server/services/documents");
const apps = await import("@/server/services/applications");
const etab = await import("@/server/services/establishments");
const pay = await import("@/server/services/payments");
const housing = await import("@/server/services/housing");
const book = await import("@/server/services/bookings");
const msg = await import("@/server/services/messaging");
const admin = await import("@/server/services/admin");
const notif = await import("@/server/services/notifications");
const orient = await import("@/server/services/orientation");
const { outbox } = await import("@/server/lib/messaging-channels");

type User = typeof schema.users.$inferSelect;
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const year = new Date().getFullYear();
const reload = async (id: string) => (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0];
let student: User, parent: User, school: User, landlord: User, adminU: User;

beforeAll(async () => {
  student = await accounts.register({ role: "etudiant", firstName: "Awa", lastName: "Ndiaye", email: "awa@test.local", password: "Motdepasse1", birthYear: year - 17, country: "SN", city: "Dakar", guardianPhone: "+221770000001", acceptTerms: true });
  parent = await accounts.register({ role: "parent", firstName: "Moussa", lastName: "Ndiaye", phone: "+221770000001", password: "Motdepasse1", country: "SN", acceptTerms: true });
  school = await accounts.register({ role: "etablissement", firstName: "Nadia", lastName: "Kane", email: "ecole@test.local", password: "Motdepasse1", establishmentId: "ma-esa-casa", acceptTerms: true });
  landlord = await accounts.register({ role: "bailleur", firstName: "Ibou", lastName: "Fall", email: "bailleur@test.local", password: "Motdepasse1", country: "SN", acceptTerms: true });
  adminU = (await accounts.findByIdentifier("admin@test.local"))!;
});

describe("comptes", () => {
  it("refuse les doublons, les mots de passe faibles et les mineurs sans parent", async () => {
    await expect(accounts.register({ role: "eleve", firstName: "X", lastName: "Y", email: "mineur@test.local", password: "Motdepasse1", birthYear: year - 15, acceptTerms: true })).rejects.toThrow(/parent/);
    await expect(accounts.register({ role: "etudiant", firstName: "X", lastName: "Y", email: "awa@test.local", password: "Motdepasse1", acceptTerms: true })).rejects.toThrow(/existe déjà/);
    await expect(accounts.register({ role: "etudiant", firstName: "X", lastName: "Y", email: "x@test.local", password: "court", acceptTerms: true })).rejects.toThrow(/8 caractères/);
  });
  it("connexion par mot de passe et par OTP", async () => {
    await expect(accounts.login("awa@test.local", "mauvais")).rejects.toThrow(/incorrects/);
    expect((await accounts.login("AWA@test.local", "Motdepasse1")).id).toBe(student.id);
    await new Promise((r) => setTimeout(r, 10));
    await db.delete(schema.otpCodes).where(eq(schema.otpCodes.target, "+221770000001"));
    const { devCode } = await accounts.requestOtp("+221 77 000 00 01", "login");
    await expect(accounts.loginWithOtp("+221770000001", "000000")).rejects.toThrow();
    expect((await accounts.loginWithOtp("+221770000001", devCode!)).id).toBe(parent.id);
  });
  it("le compte établissement attend la validation", async () => {
    expect(school.status).toBe("en_attente");
    await expect(etab.upsertProgram(school, "ma-esa-casa", { formationId: "frm-licence-gestion", title: "Licence" })).rejects.toThrow(/refusé/);
    await admin.setUserStatus(adminU, school.id, "actif");
    school = await reload(school.id);
    expect(school.status).toBe("actif");
  });
});

describe("labels", () => {
  it("établissement autorisé : filières publiées comme diplômes d'établissement (non homologuées)", async () => {
    const e = await etab.getEstablishment("ma-supdeco-marrakech");
    expect(e.label).toBe("autorise");
    const ps = await etab.listPrograms("ma-supdeco-marrakech");
    expect(ps.length).toBeGreaterThan(0);
    expect(ps.every((p) => !p.homologated && ["echue", "recente", "etablissement"].includes(p.homologation?.statut ?? ""))).toBe(true);
    // Établissement homologué : filières homologuées, plus celles « Accrédité » (échéance depuis moins de 2 ans)
    const uir = await etab.listPrograms("ma-uir");
    expect(uir.some((p) => p.homologated)).toBe(true);
    expect(uir.every((p) => p.homologated || p.homologation?.statut === "recente")).toBe(true);
  });
});

describe("réseau multi-campus", () => {
  it("un seul établissement, campus choisi à la candidature", async () => {
    const ps = await etab.listPrograms("ma-emsi");
    const p = ps.find((x) => x.campuses.length > 1)!;
    expect(p).toBeTruthy();
    const s = await accounts.register({ role: "etudiant", firstName: "Awa", lastName: "Campus", email: "campus@test.local", password: "Motdepasse1", birthYear: 2004, country: "SN", city: "Dakar", acceptTerms: true });
    const a = await apps.createDraft(s, p.id);
    await expect(apps.updateDraft(s, a.id, { campus: "Ville inconnue" })).rejects.toThrow(/campus/);
    const u = await apps.updateDraft(s, a.id, { campus: p.campuses[1] });
    expect(u.campus).toBe(p.campuses[1]);
  });
});

describe("candidature", () => {
  let appId = "", programId = "";
  it("l'école publie une formation avec frais de dossier", async () => {
    const p = await etab.upsertProgram(school, "ma-esa-casa", { formationId: "frm-licence-gestion", title: "Bachelor en gestion (ESA)", diploma: "Licence / Bachelor", level: "niv-bac3", tuitionMin: 60_000, tuitionMax: 75_000, currency: "MAD", applicationFee: 500, requiredDocuments: ["identite", "releve_notes"], homologationRef: "Arrêté n° 1246.26 (BO n° 7535)" });
    programId = p.id;
    expect(p.indicative).toBe(false);
    // Non publiée tant que l'homologation n'est pas vérifiée par Navigoal
    expect(p.homologated).toBe(false);
    expect((await etab.listPrograms("ma-esa-casa")).some((x) => x.id === programId)).toBe(false);
    await expect(apps.createDraft(student, programId)).rejects.toThrow();
    expect((await admin.homologationQueue(adminU)).some((x) => x.p.id === programId)).toBe(true);
    await expect(admin.setProgramHomologation(adminU, programId, { homologated: true })).rejects.toThrow(/arrêté/);
    await admin.setProgramHomologation(adminU, programId, { homologated: true, fin: "2028-2029", texte: "Arrêté n° 1246.26 (BO n° 7535)" });
    expect((await etab.listPrograms("ma-esa-casa")).some((x) => x.id === programId)).toBe(true);
  });
  it("un mineur ne peut pas envoyer sans consentement parental", async () => {
    const a = await apps.createDraft(student, programId);
    appId = a.id;
    await expect(apps.submitApplication(student, appId, { method: "mobile_money_afrique" })).rejects.toThrow(/consentement/);
    const g = await guardians.inviteGuardian(student, "+221770000001");
    await guardians.acceptGuardianInvite(parent, g.inviteCode!, true);
    expect(await guardians.isGuardianOf(parent.id, student.id)).toBe(true);
  });
  it("pièces manquantes puis envoi avec paiement bac à sable", async () => {
    await expect(apps.submitApplication(student, appId, { method: "mobile_money_afrique" })).rejects.toThrow(/Pièces manquantes/);
    await expect(docs.uploadDocument(student, "identite", { name: "x.exe", bytes: new Uint8Array([1, 2, 3, 4]) })).rejects.toThrow(/Format/);
    const d1 = await docs.uploadDocument(student, "identite", { name: "cni.pdf", bytes: PDF });
    const d2 = await docs.uploadDocument(student, "releve_notes", { name: "notes.png", bytes: PNG });
    await apps.updateDraft(student, appId, { motivation: "Je veux devenir manager.", documentIds: [d1.id, d2.id] });
    const r = await apps.submitApplication(student, appId, { method: "mobile_money_afrique", payerId: parent.id });
    // Paiement demandé au parent : l'élève revient sur sa candidature, le parent reçoit le lien de paiement.
    expect(r.redirectUrl).toBe(`/espace/candidatures/${appId}?paiement=parent`);
    const demande = (await notif.listNotifications(parent.id)).find((n) => n.kind === "paiement_demande");
    expect(demande?.link).toMatch(/^\/paiement\/NG-PAY-/);
    const ref = demande!.link!.split("/").pop()!;
    await expect(pay.sandboxConfirm(student, ref, true)).rejects.toThrow(/refusé/); // seul le payeur (le parent) confirme
    await pay.sandboxConfirm(parent, ref, true);
    const d = await apps.getApplication(student, appId);
    expect(d.application.status).toBe("paiement_confirme");
    expect((await pay.receipt(parent, ref)).byteLength).toBeGreaterThan(800);
  });
  it("l'école voit le dossier, demande une pièce, puis admet", async () => {
    const list = await apps.listForEstablishment(school, "ma-esa-casa");
    expect(list.map((x) => x.a.id)).toContain(appId);
    expect(apps.toCsv(list)).toContain("Ndiaye");
    const doc = (await apps.getApplication(school, appId)).documents[0];
    expect((await docs.readDocument(school, doc.id)).data.byteLength).toBeGreaterThan(0);
    await expect(docs.readDocument(landlord, doc.id)).rejects.toThrow(/refusé/);
    await expect(apps.changeStatus(school, appId, { status: "acceptee" })).rejects.toThrow(/non autorisé/);
    await apps.changeStatus(school, appId, { status: "en_verification" });
    await apps.changeStatus(school, appId, { status: "piece_demandee", requestedDocuments: ["photo"] });
    const d3 = await docs.uploadDocument(student, "photo", { name: "photo.png", bytes: PNG });
    const cur = await apps.getApplication(student, appId);
    await apps.updateDraft(student, appId, { documentIds: [...cur.application.documentIds, d3.id] });
    await apps.submitApplication(student, appId);
    await apps.changeStatus(school, appId, { status: "complet" });
    await apps.changeStatus(school, appId, { status: "acceptee", note: "Bienvenue !" });
    const fin = await apps.getApplication(parent, appId);
    expect(fin.application.status).toBe("acceptee");
    expect(fin.events.map((e) => e.status)).toEqual(["brouillon", "soumise", "paiement_confirme", "en_verification", "piece_demandee", "en_verification", "complet", "acceptee"]);
    expect((await notif.listNotifications(student.id)).some((n) => n.title.includes("Acceptée"))).toBe(true);
  });
});

describe("Navilease", () => {
  let hid = "", bid = "";
  it("annonce : brouillon → modération → publication, adresse masquée", async () => {
    const h = await housing.saveHousing(landlord, { title: "Studio Maârif", type: "studio", description: "Studio meublé de 25 m² proche de l'ESA, eau et électricité incluses, gardien.", pays: "MA", ville: "Casablanca", quartier: "Maârif", address: "12 rue secrète", rent: 3000, charges: 200, deposit: 3000, amenities: ["wifi", "eau"], nearEstablishments: [{ id: "ma-esa-casa", minutes: 10, mode: "pied" }] });
    hid = h.id;
    expect(h.currency).toBe("MAD");
    await expect(housing.submitForModeration(landlord, hid)).rejects.toThrow(/3 photos/);
    for (let i = 0; i < 3; i++) await housing.addHousingPhoto(landlord, hid, { bytes: PNG });
    await housing.submitForModeration(landlord, hid);
    expect(await housing.searchHousings({ pays: "MA" })).toHaveLength(0);
    await housing.moderateHousing(adminU, hid, { approve: true });
    const res = await housing.searchHousings({ etablissement: "ma-esa-casa", budgetMax: 4000 });
    expect(res.map((r) => r.id)).toContain(hid);
    expect(JSON.stringify(res)).not.toContain("rue secrète");
  });
  it("mineur : garant obligatoire, coordonnées masquées avant paiement", async () => {
    // Le bailleur n'est pas encore vérifié : un mineur ne peut pas réserver.
    await expect(book.requestBooking(student, { housingId: hid, startDate: `${year + 1}-09-01`, months: 9 })).rejects.toThrow(/pas encore vérifié/);
    const kyc1 = await docs.uploadDocument(landlord, "kyc_identite", { name: "cni.pdf", bytes: PDF });
    const kyc2 = await docs.uploadDocument(landlord, "kyc_propriete", { name: "titre.pdf", bytes: PDF });
    await housing.submitKyc(landlord, [kyc1.id, kyc2.id]);
    await housing.reviewKyc(adminU, landlord.id, true);
    const b = await book.requestBooking(student, { housingId: hid, startDate: `${year + 1}-09-01`, months: 9, message: "Bonjour, appelez-moi au 77 123 45 67" });
    bid = b.id;
    expect(b.serviceFee).toBe(150);
    const conv = (await msg.listConversations(landlord.id))[0];
    expect((await msg.getConversation(landlord.id, conv.id)).messages[0].m.body).toContain("[coordonnée masquée]");
    expect(await book.respond(landlord, bid, true)).toBe("attente_garant");
    await expect(book.payBooking(student, bid, "mobile_money_afrique")).rejects.toThrow(/garant/);
    await book.approveAsGuarantor(parent, bid);
    expect((await book.getBooking(student, bid)).revealed).toBe(false);
  });
  it("paiement en séquestre → contrat → entrée → fonds versés → loyer → avis", async () => {
    const r = await book.payBooking(parent, bid, "orange_money");
    expect(r.payment.amount).toBe(3000 + 200 + 3000 + 150);
    await pay.sandboxConfirm(parent, r.payment.reference, true);
    let d = await book.getBooking(student, bid);
    expect(d.booking.status).toBe("paiement_sequestre");
    expect(d.revealed).toBe(true);
    expect(d.housing.address).toBe("12 rue secrète");
    expect(d.payments[0].escrow).toBe("bloque");
    await book.signContract(student, bid);
    await book.signContract(landlord, bid);
    expect((await book.contractPdf(parent, bid)).byteLength).toBeGreaterThan(1500);
    await expect(book.reviewHousing(student, bid, 5)).rejects.toThrow(/séjourné/);
    await book.checkIn(student, bid, { photos: [], notes: "RAS" });
    d = await book.getBooking(landlord, bid);
    expect(d.booking.status).toBe("en_cours");
    expect(d.payments.find((p) => p.kind === "reservation")!.escrow).toBe("libere");
    const rent = await book.payRent(student, bid, "mobile_money_afrique", `${year + 1}-10`);
    await pay.sandboxConfirm(student, rent.payment.reference, true);
    await expect(book.payRent(student, bid, "mobile_money_afrique", `${year + 1}-10`)).rejects.toThrow(/déjà payé/);
    expect((await book.rentReceipt(landlord, rent.payment.reference)).byteLength).toBeGreaterThan(800);
    await book.reviewHousing(student, bid, 4, "Calme et propre.");
    expect((await housing.getHousingPublic(hid)).reviews).toHaveLength(1);
  });
  it("litige : séquestre gelé puis résolu par la médiation", async () => {
    const dsp = await book.openDispute(student, bid, "Eau coupée", "Plus d'eau depuis 5 jours.");
    expect((await admin.moderationQueue(adminU)).disputes.map((x) => x.d.id)).toContain(dsp.id);
    await book.resolveDispute(adminU, dsp.id, "Réparation effectuée par le bailleur.");
    expect((await book.getBooking(student, bid)).booking.status).toBe("en_cours");
  });
});

describe("back-office et recommandations", () => {
  it("référentiels versionnés, import CSV et export", async () => {
    await admin.saveRefItem(adminU, "competences", { id: "cmp-test", libelle: "Compétence test", categorie: "transversale", domaine: null });
    expect(await admin.importRef(adminU, "competences", "id;libelle;categorie\ncmp-csv;Import CSV;transversale", "csv")).toBe(1);
    expect(await admin.exportRef(adminU, "competences", "csv")).toContain("cmp-csv");
    expect((await admin.refHistory(adminU, "competences")).length).toBeGreaterThanOrEqual(3);
    await expect(admin.listRef(student, "metiers")).rejects.toThrow(/refusé/);
  });
  it("recommandations à partir du profil RIASEC", async () => {
    await orient.saveResult(student.id, [1, 2], { I: 20, C: 15, R: 10, A: 5, S: 5, E: 5 }, ["I", "C", "R"]);
    const r = await orient.recommend(student.id);
    expect(r.metiers.length).toBeGreaterThan(3);
    expect(r.offres.length).toBeGreaterThan(0);
  });
  it("saisies invalides refusées proprement (audit fonctionnel)", async () => {
    await expect(orient.saveResult(student.id, { q0: 2 }, { I: 3 }, ["I"])).rejects.toThrow();
    await expect(orient.saveResult(student.id, [1], { I: 3 }, ["Z"])).rejects.toThrow();
    await expect(admin.updateEstablishmentAdmin(adminU, "ma-esa-casa", { status: "inconnu" as never })).rejects.toThrow();
    await expect(admin.updateEstablishmentAdmin(adminU, "ma-esa-casa", {})).rejects.toThrow(/Aucune modification/);
    await expect(admin.listRef(adminU, "inconnu" as never)).rejects.toThrow(/Référentiel introuvable/);
    await expect(admin.saveTestimonial(adminU, {} as never)).rejects.toThrow();
    await expect(housing.reviewKyc(adminU, "inexistant", true)).rejects.toThrow(/Bailleur introuvable/);
    await expect(housing.moderateHousing(adminU, "x", { approve: true, verification: "documents" as never })).rejects.toThrow(/vérification inconnu/);
    expect(await accounts.updateProfile(student.id, {})).toBeTruthy();
  });
  it("moyens de paiement : Airtel Money et Moov Money proposés en premier au Gabon seulement", async () => {
    const { moyensPour } = await import("@/lib/paiement");
    const { METHODS } = await import("@/server/payments/providers");
    const ga = moyensPour(METHODS.MA, "GA").map((m) => m.id);
    expect(ga.slice(0, 2)).toEqual(["airtel_money", "moov_money"]);
    expect(moyensPour(METHODS.MA, "SN").map((m) => m.id)).not.toContain("airtel_money");
    expect(moyensPour(METHODS.MA, "SN")).toHaveLength(METHODS.MA.length - 2);
  });
  it("statistiques et entonnoir", async () => {
    const s = await admin.stats(adminU);
    expect(s.funnel.candidats).toBeGreaterThanOrEqual(1);
    expect(s.funnel.loges).toBeGreaterThanOrEqual(1);
    expect(s.navilease.actives).toBeGreaterThanOrEqual(1);
  });
  it("e-mails et SMS journalisés sans fournisseur", () => {
    expect(outbox.some((o) => o.text.includes("code Navigoal"))).toBe(true);
  });
});

describe("sécurité", () => {
  it("bloque la force brute après 8 échecs", async () => {
    await accounts.register({ role: "etudiant", firstName: "B", lastName: "F", email: "bf@test.local", password: "Motdepasse1", acceptTerms: true });
    for (let i = 0; i < 8; i++) await expect(accounts.login("bf@test.local", "faux")).rejects.toThrow(/incorrects/);
    await expect(accounts.login("bf@test.local", "Motdepasse1")).rejects.toThrow(/Trop de tentatives/);
  });
});

describe("connexion avec Google", () => {
  const google = () => import("@/server/services/google");
  it("relie un compte existant et vérifie son e-mail", async () => {
    const g = await google();
    const r = await g.compteGoogle({ email: "AWA@test.local", given_name: "Awa", email_verified: true }, null);
    expect(r.user?.id).toBe(student.id);
    expect(r.nouveau).toBe(false);
    expect((await reload(student.id)).emailVerifiedAt).not.toBeNull();
  });
  it("sans profil choisi, ne crée pas de compte", async () => {
    const r = await (await google()).compteGoogle({ email: "inconnu@gmail.test", email_verified: true }, null);
    expect(r.user).toBeNull();
  });
  it("crée un compte parent sans mot de passe, qui peut ensuite en définir un", async () => {
    const r = await (await google()).compteGoogle({ email: "maman@gmail.test", given_name: "Fatou", family_name: "Diop", email_verified: true }, "parent");
    expect(r.nouveau).toBe(true);
    expect(r.user).toMatchObject({ role: "parent", firstName: "Fatou", lastName: "Diop", passwordHash: null });
    expect(r.user!.emailVerifiedAt).not.toBeNull();
    await accounts.changePassword(r.user!.id, "", "Motdepasse1");
    expect((await accounts.login("maman@gmail.test", "Motdepasse1")).id).toBe(r.user!.id);
  });
});

describe("campagne : sources d'inscription et parrainage", () => {
  const campaign = () => import("@/server/services/campaign");
  const today = new Date().toISOString().slice(0, 10);
  const inscrire = (prenom: string, email: string) =>
    accounts.register({ role: "eleve", firstName: prenom, lastName: "Test", email, password: "Motdepasse1", country: "GA", acceptTerms: true });

  it("lit le cookie de première visite en nettoyant les valeurs", async () => {
    const c = await campaign();
    const raw = encodeURIComponent(JSON.stringify({ source: "Lycee<script>", campaign: "trouvetavoie", content: "leon-mba", landing: "/orientation/" }));
    expect(c.parseAcquisition(raw)).toMatchObject({ source: "lyceescript", campaign: "trouvetavoie", content: "leon-mba", landing: "/orientation/" });
    expect(c.parseAcquisition(encodeURIComponent(JSON.stringify({ source: "fb", ref: "dimi-7k3q" })))).toMatchObject({ source: "parrain", ref: "DIMI-7K3Q" });
    expect(c.parseAcquisition("%7Bpas du json")).toBeNull();
    expect(c.parseAcquisition(undefined)).toBeNull();
  });

  it("donne un code parrain stable, rattache les filleuls et débloque l'entretien à 2 amis", async () => {
    const c = await campaign();
    const parrain = await inscrire("Dimitri", "dimitri@test.local");
    const r0 = await c.myReferral(await reload(parrain.id));
    expect(r0.code).toMatch(/^DIMI-[A-HJ-NP-Z2-9]{4}$/);
    expect((await c.myReferral(await reload(parrain.id))).code).toBe(r0.code);
    expect(r0).toMatchObject({ filleuls: 0, objectif: 2, debloque: false });
    expect(r0.lien).toContain(`/inscription/?ref=${r0.code}`);

    const ami1 = await inscrire("Grace", "grace@test.local");
    await c.recordAcquisition(ami1.id, c.parseAcquisition(encodeURIComponent(JSON.stringify({ ref: r0.code.toLowerCase() }))));
    expect(await reload(ami1.id)).toMatchObject({ referredById: parrain.id, acquisition: { source: "parrain", ref: r0.code } });
    const ami2 = await inscrire("Yann", "yann@test.local");
    await c.recordAcquisition(ami2.id, { source: "parrain", ref: r0.code });
    const r2 = await c.myReferral(await reload(parrain.id));
    expect(r2).toMatchObject({ filleuls: 2, debloque: true });
    const notes = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, parrain.id));
    expect(notes.filter((n) => n.kind === "parrainage")).toHaveLength(1);
  });

  it("ignore un code inconnu ou son propre code", async () => {
    const c = await campaign();
    const u = await inscrire("Lea", "lea@test.local");
    await c.recordAcquisition(u.id, { source: "parrain", ref: "XXXX-0000" });
    expect(await reload(u.id)).toMatchObject({ referredById: null, acquisition: { source: "direct" } });
    const code = (await c.myReferral(await reload(u.id))).code;
    await c.recordAcquisition(u.id, { source: "parrain", ref: code });
    expect((await reload(u.id)).referredById).toBeNull();
  });

  it("compte les inscriptions par source pour l'administration seulement", async () => {
    const c = await campaign();
    const v = await inscrire("Paul", "paul@test.local");
    await c.recordAcquisition(v.id, { source: "lycee", campaign: "trouvetavoie", content: "leon-mba" });
    await expect(c.campaignStats(student)).rejects.toThrow();
    const s = await c.campaignStats(adminU, today);
    expect(s.depuis).toBe(today);
    expect(s.sources.find((x) => x.source === "lycee")).toMatchObject({ libelle: "Lycée (QR code)", n: 1 });
    expect(s.sources.find((x) => x.source === "parrain")?.n).toBe(2);
    expect(s.details).toContainEqual(expect.objectContaining({ source: "lycee", detail: "leon-mba", n: 1 }));
    expect(s.totaux.parraines).toBe(2);
    const csv = await c.campaignCsv(adminU, today);
    expect(csv.split("\n")[0]).toBe("source;libelle;detail;inscriptions");
    expect(csv).toContain('"lycee";"Lycée (QR code)";"leon-mba";"1"');
    expect(csv).not.toContain("@test.local");
  });
});

describe("sécurité : attaques rejouées (test d'intrusion)", () => {
  it("code d'invitation parent : réservé au parent invité, essais limités", async () => {
    const kid = await accounts.register({ role: "eleve", firstName: "Mineur", lastName: "Cible", email: "cible@test.local", password: "Motdepasse1", birthYear: year - 15, acceptTerms: true, guardianEmail: "vraie.maman@test.local" });
    const [inv] = await db.select().from(schema.guardianships).where(eq(schema.guardianships.childId, kid.id));
    const intrus = await accounts.register({ role: "parent", firstName: "Faux", lastName: "Parent", email: "intrus@test.local", password: "Motdepasse1", acceptTerms: true });
    await expect(guardians.acceptGuardianInvite(intrus, inv.inviteCode!, true)).rejects.toThrow(/autre e-mail/);
    for (let i = 0; i < 9; i++) await guardians.acceptGuardianInvite(intrus, "000000", true).catch(() => {});
    await expect(guardians.acceptGuardianInvite(intrus, "000001", true)).rejects.toThrow(/Trop de codes/);
    const maman = await accounts.register({ role: "parent", firstName: "Vraie", lastName: "Maman", email: "vraie.maman@test.local", password: "Motdepasse1", acceptTerms: true });
    expect(await guardians.acceptGuardianInvite(maman, inv.inviteCode!, true)).toBe(kid.id);
    const t = await guardians.guardiansOf(kid.id);
    expect(JSON.stringify(t)).not.toMatch(/passwordHash|password_hash|\$2[aby]\$/);
  });
  it("paiement simulé : jamais validé par le payeur en production", async () => {
    const { simulationAutorisee } = await import("@/server/services/payments");
    const p = { provider: "sandbox", payerId: student.id };
    const env = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      expect(simulationAutorisee(student, p)).toBe(false);
      expect(simulationAutorisee(adminU, p)).toBe(true);
    } finally { (process.env as Record<string, string>).NODE_ENV = env!; }
    expect(simulationAutorisee(student, { provider: "cinetpay", payerId: student.id })).toBe(false);
  });
  it("école non vérifiée : exclue des conversations et notifications", async () => {
    const faux = await accounts.register({ role: "etablissement", firstName: "Faux", lastName: "Directeur", email: "faux.dir@test.local", password: "Motdepasse1", acceptTerms: true, establishmentId: "ma-esa-casa" });
    expect(faux.status).toBe("en_attente");
    expect(await etab.myMembersOf("ma-esa-casa")).not.toContain(faux.id);
  });
  it("redirections et clés de stockage piégées refusées", async () => {
    const { cheminInterne } = await import("@/lib/redirection");
    for (const s of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com", "evil.com"]) expect(cheminInterne(s)).toBeNull();
    expect(cheminInterne("/espace/?a=1")).toBe("/espace/?a=1");
    const { cleValide } = await import("@/server/lib/storage");
    for (const k of ["housings/x/..\\..\\documents/a/b", "housings/x/../../documents/a/b", "/etc/passwd", "a//b"]) expect(cleValide(k)).toBe(false);
    expect(cleValide("housings/0b0c/1f2e-3d4c.jpg")).toBe(true);
  });
  it("Google sur un compte jamais vérifié : mot de passe et sessions du créateur supprimés", async () => {
    const g = await import("@/server/services/google");
    const pre = await accounts.register({ role: "etudiant", firstName: "Pré", lastName: "Créé", email: "victime@gmail.test", password: "Motdepasse1", acceptTerms: true });
    const { createSession } = await import("@/server/auth/session");
    await createSession(pre.id);
    const r = await g.compteGoogle({ email: "victime@gmail.test", email_verified: true }, null);
    const u = await reload(r.user!.id);
    expect(u.passwordHash).toBeNull();
    expect(await db.select().from(schema.sessions).where(eq(schema.sessions.userId, pre.id))).toHaveLength(0);
  });
  it("force brute : compteur par compte, quel que soit le format de l'identifiant", async () => {
    await accounts.register({ role: "parent", firstName: "T", lastName: "Tel", phone: "+212611223344", password: "Motdepasse1", acceptTerms: true });
    for (let i = 0; i < 4; i++) await accounts.login("+212611223344", "faux").catch(() => {});
    for (let i = 0; i < 4; i++) await accounts.login("212611223344", "faux").catch(() => {});
    await expect(accounts.login("00212611223344", "Motdepasse1")).rejects.toThrow(/Trop de tentatives/);
  });
});

describe("Navi (assistant IA) : outils et garde-fous, sans appel au modèle", async () => {
  const navi = await import("@/server/services/navi");
  const o = navi._outils;
  it("recherche : un métier en langage naturel mène aux formations et aux écoles", async () => {
    const r = await o.chercherFormations({ texte: "je veux devenir infirmière", ville: null, niveau: null, label: null, limite: null });
    expect(r.formations.length).toBeGreaterThan(0);
    expect(r.formations[0].intitule).toMatch(/infirmi/i);
    expect(r.formations[0].etablissements.length).toBeGreaterThan(0);
    expect((await o.chercherEtablissements({ texte: "UIR", ville: null, label: null, formation_id: null, limite: null })).etablissements[0].sigle).toBe("UIR");
  });
  it("devis : mêmes calculs que la page Devis, montants en F CFA pour le Gabon", async () => {
    const r = await o.estimerCout({ etablissement_id: "ma-esa-casa", formation_id: null, pays_origine: "GA", logement: null }, null);
    expect(r).toHaveProperty("total_toute_la_formation.XAF");
    expect((r as { page_devis: string }).page_devis).toMatch(/^\/devis\/\?etab=ma-esa-casa&f=.+&o=GA$/);
  });
  it("cartes : liens externes ou piégés écartés, établissements inconnus ignorés", async () => {
    const c = await o.construireCartes({ etablissements: ["ma-esa-casa", "inconnu"], formation_id: null, devis: null, conseiller: true, suggestions: ["Quelles bourses ?"],
      liens: [{ libelle: "Piège", chemin: "https://evil.com" }, { libelle: "Piège 2", chemin: "//evil.com/devis" }, { libelle: "Admin", chemin: "/admin/" }, { libelle: "Comparer", chemin: "/comparateur/?e=a,b" }] }, "GA");
    expect(c.filter((x) => x.type === "etablissement")).toHaveLength(1);
    expect(c.find((x) => x.type === "liens")).toEqual({ type: "liens", liens: [{ libelle: "Comparer", href: "/comparateur/?e=a,b", principal: true }] });
    expect(c.some((x) => x.type === "conseiller")).toBe(true);
  });
  it("espace personnel : visiteur sans données, élève limité à ses propres dossiers", async () => {
    expect(await o.monEspace(null)).toMatchObject({ connecte: false });
    const autre = await accounts.register({ role: "etudiant", firstName: "Zed", lastName: "Autre", email: "zed.navi@test.local", password: "Motdepasse1", acceptTerms: true });
    const e = (await o.monEspace(autre)) as { candidatures: unknown[] };
    expect(e.candidatures).toHaveLength(0);
    const s = (await o.monEspace(student)) as { candidatures: { page: string }[] };
    for (const a of s.candidatures) expect(a.page).toMatch(/^\/espace\/candidatures\//);
  });
  it("quota journalier par visiteur", async () => {
    process.env.NAVI_LIMITE_VISITEUR = "2";
    await navi.verifierQuota(null, "203.0.113.9");
    await navi.verifierQuota(null, "203.0.113.9");
    await expect(navi.verifierQuota(null, "203.0.113.9")).rejects.toThrow(/limite de 2 messages/);
    delete process.env.NAVI_LIMITE_VISITEUR;
  });
});

describe("relais Navigoal, Premium et accès des établissements", async () => {
  const relais = await import("@/server/services/relais");
  const premium = await import("@/server/services/premium");
  const acces = await import("@/server/services/acces");
  const msgSvc = msg;

  it("accès : un compte par école, mot de passe provisoire à changer, puis connexion normale", async () => {
    const crees = await acces.createMissingAccesses(adminU);
    expect(crees.length).toBeGreaterThan(50);
    expect(crees.find((c) => c.etablissement === "ma-esa-casa")).toBeUndefined(); // déjà un compte actif
    const uir = crees.find((c) => c.etablissement === "ma-uir")!;
    expect(uir.email).toBe("contact@uir.ac.ma");
    expect(await acces.createMissingAccesses(adminU)).toHaveLength(0); // idempotent
    const u = await accounts.login(uir.email, uir.motDePasse);
    expect(u.mustChangePassword).toBe(true);
    await expect(acces.firstPassword(u, "court")).rejects.toThrow(/8 caractères/);
    await acces.firstPassword(u, "NouveauMdp2026");
    expect((await reload(u.id)).mustChangePassword).toBe(false);
    await expect(accounts.login(uir.email, uir.motDePasse)).rejects.toThrow(/incorrects/);
    const r = await acces.resetAccess(adminU, u.id);
    expect((await accounts.login(uir.email, r.motDePasse)).mustChangePassword).toBe(true);
    expect(acces.accesCsv([r])).toMatch(/contact@uir\.ac\.ma/);
    await expect(acces.resetAccess(student, u.id)).rejects.toThrow();
    const g = await acces.guideProgress(u, "ma-uir");
    expect(g.total).toBe(5);
    await expect(acces.guideProgress(u, "ma-esa-casa")).rejects.toThrow();
    const sans = crees.find((c) => c.provisoire);
    if (sans) await expect(acces.sendAccess(adminU, (await accounts.findByIdentifier(sans.email))!.id)).rejects.toThrow(/provisoire/);
  });

  it("relais : l'admin voit tout, répond au nom de l'école, notes internes cachées au candidat", async () => {
    const list = await relais.listAllApplications(adminU, {});
    expect(list.items.length).toBeGreaterThan(0);
    await expect(relais.listAllApplications(school, {})).rejects.toThrow();
    const a = list.items[0];
    const c = await relais.openApplicationThread(adminU, a.id);
    await relais.adminPost(adminU, c.id, "Bonjour, votre dossier est complet.");
    await relais.adminPost(adminU, c.id, "Appelé le service admissions.", true);
    const vueAdmin = await relais.getConversationAdmin(adminU, c.id);
    expect(vueAdmin.messages).toHaveLength(2);
    expect(vueAdmin.messages[0].m.onBehalfOf).toBeTruthy();
    const candidat = (await reload(a.student.id));
    const vueCandidat = await msgSvc.getConversation(candidat.id, c.id);
    expect(vueCandidat.messages.map((m) => m.m.body)).toEqual(["Bonjour, votre dossier est complet."]);
  });

  it("mode accompagné : décision d'admission par l'admin seulement si activé", async () => {
    const [a] = await db.select().from(schema.applications).where(sql`${schema.applications.status} in ('complet','en_traitement','soumise','en_verification')`).limit(1);
    if (!a) return;
    await db.update(schema.applications).set({ status: "complet" }).where(eq(schema.applications.id, a.id));
    await expect(apps.changeStatus(adminU, a.id, { status: "acceptee" })).rejects.toThrow(/mode accompagné/);
    await relais.setEstablishmentAssisted(adminU, a.establishmentId, true);
    await apps.changeStatus(adminU, a.id, { status: "liste_attente" });
    await relais.setEstablishmentAssisted(adminU, a.establishmentId, false);
  });

  it("Premium : réservé à l'offre, filtres, vivier anonyme consentant et prospection relue", async () => {
    await expect(premium.vivier(school, "ma-esa-casa", {})).rejects.toThrow(/Premium/);
    const offresSvc = await import("@/server/services/offres");
    await offresSvc.activate(adminU, { etablissement: "ma-esa-casa", service: "premium", months: 12, method: "virement", reference: "TEST-1" });
    // Étudiante majeure, visible ; mineure visible sans accord parental : exclue
    const majeure = await accounts.register({ role: "etudiant", firstName: "Grâce", lastName: "Obiang", email: "grace.vivier@test.local", password: "Motdepasse1", birthYear: year - 19, country: "GA", acceptTerms: true });
    await premium.updateAttentes(majeure, { average: 15.2, mention: "bien", domain: "dom-gestion", targetJobs: [], budgetAnnuel: 9000000, devise: "XAF", funding: { garant: true }, startYear: year + 1, villes: ["Casablanca"], visibleToSchools: true });
    await premium.updateAttentes(student, { average: 16, visibleToSchools: true }); // Awa, 17 ans
    const v = await premium.vivier(school, "ma-esa-casa", { moyenneMin: 14 });
    expect(v.profils.some((p) => p.pays === "Gabon")).toBe(true);
    expect(JSON.stringify(v)).not.toMatch(/Grâce|Obiang|grace\.vivier|Awa/);
    await premium.parentVisibility(parent, student.id, true);
    expect((await premium.vivier(school, "ma-esa-casa", { moyenneMin: 14 })).stats.correspondants).toBe(v.stats.correspondants + 1);
    const f = await premium.filteredApplications(school, "ma-esa-casa", {});
    for (const x of f.items) expect(x.score).toBeGreaterThanOrEqual(0);
    // Campagne : relue, puis envoyée ; l'élève accepte, le profil est révélé à l'école
    const ref = v.profils.find((p) => p.pays === "Gabon")!.ref;
    await expect(premium.createProspection(school, "ma-esa-casa", { offer: "candidature", subject: "Bachelor", body: "Trop court", criteria: {} })).rejects.toThrow();
    await expect(premium.createProspection(school, "ma-esa-casa", { offer: "candidature", subject: "Bachelor à l'ESA", body: "Votre projet correspond à notre bachelor en gestion, candidatures ouvertes.", link: "https://evil.example", criteria: { refs: [ref] } })).rejects.toThrow(/Navigoal/);
    const p = await premium.createProspection(school, "ma-esa-casa", { offer: "candidature", subject: "Bachelor à l'ESA", body: "Votre projet correspond à notre bachelor en gestion, candidatures ouvertes.", criteria: { refs: [ref] } });
    expect(p.audience).toBe(1);
    expect((await premium.reviewProspection(adminU, p.id, true)).envoyes).toBe(1);
    const inv = await premium.myInvitations(majeure);
    expect(inv).toHaveLength(1);
    const r = await premium.respondInvitation(majeure, inv[0].i.id, true);
    expect(r.conversation).toBeTruthy();
    const l = await premium.listProspections(school, "ma-esa-casa");
    expect(l.items[0].interesses[0].nom).toBe("Grâce Obiang");
    // Re-ciblage dans les 30 jours : exclu
    await expect(premium.createProspection(school, "ma-esa-casa", { offer: "candidature", subject: "Bachelor à l'ESA", body: "Votre projet correspond à notre bachelor en gestion, candidatures ouvertes.", criteria: { refs: [ref] } })).rejects.toThrow(/Aucun profil/);
    await premium.stopContact(majeure);
    expect((await premium.vivier(school, "ma-esa-casa", {})).profils.some((x) => x.ref === ref)).toBe(false);
  });
});

describe("offres payantes : abonnements, effets réels, échéances", async () => {
  const offres = await import("@/server/services/offres");
  it("mise en avant : effet sur le site public, prolongation sans interruption, arrêt immédiat", async () => {
    await expect(offres.activate(school, { etablissement: "ma-uir", service: "mise_en_avant", months: 3 })).rejects.toThrow();
    const s1 = await offres.activate(adminU, { etablissement: "ma-uir", service: "mise_en_avant", months: 3, method: "cheque", reference: "CHQ-1" });
    expect(s1.amount).toBe(900); // tarif du catalogue
    expect((await offres.partenaires()).some((p) => p.id === "ma-uir")).toBe(true);
    const s2 = await offres.activate(adminU, { etablissement: "ma-uir", service: "mise_en_avant", months: 6, amount: 1500 });
    expect(s2.startsAt.getTime()).toBe(s1.endsAt.getTime()); // la prolongation démarre à la fin de la période en cours
    const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, "ma-uir"));
    expect(e.featuredUntil!.getTime()).toBe(s2.endsAt.getTime());
    await offres.compterVitrine(["ma-uir", "ma-uir", "ma-inconnue"], "ma-uir");
    const o = await offres.myOffer(adminU, "ma-uir");
    expect(o.visibilite.affichages).toBe(1);
    expect(o.visibilite.clics).toBe(1);
    await offres.cancel(adminU, s1.id); await offres.cancel(adminU, s2.id);
    expect((await offres.partenaires()).some((p) => p.id === "ma-uir")).toBe(false);
  });
  it("échéance : rappel avant la fin, puis désactivation automatique", async () => {
    const s = await offres.activate(adminU, { etablissement: "ma-uir", service: "une_accueil", months: 1, startsAt: new Date(Date.now() - 25 * 86400000) });
    expect((await offres.rappels()).rappels).toBeGreaterThanOrEqual(1);
    expect((await offres.rappels()).rappels).toBe(0); // pas de doublon
    await db.update(schema.subscriptions).set({ endsAt: new Date(Date.now() - 1000) }).where(eq(schema.subscriptions.id, s.id));
    await offres.rappels();
    const [e] = await db.select().from(schema.establishments).where(eq(schema.establishments.id, "ma-uir"));
    expect(e.homeUntil).toBeNull();
    expect(e.featuredUntil).toBeNull();
    const csv = offres.exportCsv((await offres.overview(adminU)).items);
    expect(csv.split("\n").length).toBeGreaterThan(2);
  });
});
