import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq, sql } from "drizzle-orm";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://postgres@localhost:5433/navigoal_test";
process.env.STORAGE = "local";
process.env.PAYMENTS_MODE = "sandbox";

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
// Parent dont l'e-mail et le téléphone ont été vérifiés (code reçu) : seul un tel compte peut accepter une invitation.
const verifier = async (u: { id: string }) => { await db.update(schema.users).set({ emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() }).where(eq(schema.users.id, u.id)); return reload(u.id); };
let student: User, parent: User, school: User, landlord: User, adminU: User;

beforeAll(async () => {
  student = await accounts.register({ role: "etudiant", firstName: "Awa", lastName: "Ndiaye", email: "awa@test.local", password: "Motdepasse1", birthYear: year - 17, country: "SN", city: "Dakar", guardianPhone: "+221770000001", acceptTerms: true });
  parent = await accounts.register({ role: "parent", firstName: "Moussa", lastName: "Ndiaye", phone: "+221770000001", password: "Motdepasse1", country: "SN", acceptTerms: true });
  parent = await verifier(parent);
  school = await accounts.register({ role: "etablissement", firstName: "Nadia", lastName: "Kane", email: "ecole@test.local", password: "Motdepasse1", establishmentId: "ma-esa-casa", acceptTerms: true });
  landlord = await accounts.register({ role: "bailleur", firstName: "Ibou", lastName: "Fall", email: "bailleur@test.local", password: "Motdepasse1", country: "SN", acceptTerms: true });
  adminU = (await accounts.findByIdentifier("admin@test.local"))!;
});

describe("comptes", () => {
  it("refuse les doublons, les mots de passe faibles et les mineurs sans parent", async () => {
    await expect(accounts.register({ role: "eleve", firstName: "X", lastName: "Y", email: "mineur@test.local", password: "Motdepasse1", birthYear: year - 15, acceptTerms: true })).rejects.toThrow(/parent/);
    await expect(accounts.register({ role: "etudiant", birthYear: year - 20, firstName: "X", lastName: "Y", email: "awa@test.local", password: "Motdepasse1", acceptTerms: true })).rejects.toThrow(/existe déjà/);
    await expect(accounts.register({ role: "etudiant", birthYear: year - 20, firstName: "X", lastName: "Y", email: "x@test.local", password: "court", acceptTerms: true })).rejects.toThrow(/8 caractères/);
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
    await expect(apps.submitApplication(student, appId)).rejects.toThrow(/consentement/);
    const g = await guardians.inviteGuardian(student, "+221770000001");
    expect(g.inviteCode).toBeNull(); // l'élève ne reçoit pas le code : seul le parent l'a, par SMS
    const [envoye] = await db.select({ code: schema.guardianships.inviteCode }).from(schema.guardianships).where(eq(schema.guardianships.id, g.id));
    await guardians.acceptGuardianInvite(parent, envoye.code!, true);
    expect(await guardians.isGuardianOf(parent.id, student.id)).toBe(true);
  });
  it("pièces manquantes puis envoi gratuit, sans paiement", async () => {
    await expect(apps.submitApplication(student, appId)).rejects.toThrow(/Pièces manquantes/);
    await expect(docs.uploadDocument(student, "identite", { name: "x.exe", bytes: new Uint8Array([1, 2, 3, 4]) })).rejects.toThrow(/Format/);
    const d1 = await docs.uploadDocument(student, "identite", { name: "cni.pdf", bytes: PDF });
    const d2 = await docs.uploadDocument(student, "releve_notes", { name: "notes.png", bytes: PNG });
    await apps.updateDraft(student, appId, { motivation: "Je veux devenir manager.", documentIds: [d1.id, d2.id] });
    const r = await apps.submitApplication(student, appId);
    expect(r.redirectUrl).toBeNull(); // candidature gratuite : aucun paiement demandé
    const d = await apps.getApplication(student, appId);
    expect(d.application.status).toBe("soumise");
    expect((await pay.listPaymentsFor(parent)).filter((x) => x.kind === "frais_candidature")).toHaveLength(0);
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
    expect(fin.events.map((e) => e.status)).toEqual(["brouillon", "soumise", "en_verification", "piece_demandee", "en_verification", "complet", "acceptee"]);
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
    await expect(book.payBooking(student, bid, "especes")).rejects.toThrow(/garant/);
    await book.approveAsGuarantor(parent, bid);
    expect((await book.getBooking(student, bid)).revealed).toBe(false);
  });
  it("paiement en séquestre → contrat → entrée → fonds versés → loyer → avis", async () => {
    const r = await book.payBooking(parent, bid, "carte");
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
    const rent = await book.payRent(student, bid, "especes", `${year + 1}-10`);
    await pay.sandboxConfirm(student, rent.payment.reference, true);
    await expect(book.payRent(student, bid, "especes", `${year + 1}-10`)).rejects.toThrow(/déjà payé/);
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
    await accounts.register({ role: "etudiant", birthYear: year - 20, firstName: "B", lastName: "F", email: "bf@test.local", password: "Motdepasse1", acceptTerms: true });
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
    accounts.register({ role: "eleve", birthYear: year - 20, firstName: prenom, lastName: "Test", email, password: "Motdepasse1", country: "GA", acceptTerms: true });

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
    const nonVerifie = await accounts.register({ role: "parent", firstName: "Pas", lastName: "Vérifié", email: inv.inviteEmail!, password: "Motdepasse1", acceptTerms: true });
    // Un compte « parent » créé avec l'adresse invitée mais jamais vérifié ne peut pas accepter (l'élève pourrait le créer lui-même).
    await expect(guardians.acceptGuardianInvite(nonVerifie, inv.inviteCode!, true)).rejects.toThrow(/Vérifiez d'abord/);
    await db.update(schema.users).set({ email: `ancien-${nonVerifie.id}@test.local` }).where(eq(schema.users.id, nonVerifie.id)); // libère l'adresse
    await db.delete(schema.otpCodes).where(eq(schema.otpCodes.target, inv.inviteEmail!)); // délai de 45 s entre deux codes : remis à zéro pour le test
    // L'élève ne voit jamais le code destiné à son parent.
    expect((await guardians.guardiansOf(kid.id)).every((r) => r.link.inviteCode === null)).toBe(true);
    const intrus = await verifier(await accounts.register({ role: "parent", firstName: "Faux", lastName: "Parent", email: "intrus@test.local", password: "Motdepasse1", acceptTerms: true }));
    await expect(guardians.acceptGuardianInvite(intrus, inv.inviteCode!, true)).rejects.toThrow(/autre e-mail/);
    for (let i = 0; i < 9; i++) await guardians.acceptGuardianInvite(intrus, "000000", true).catch(() => {});
    await expect(guardians.acceptGuardianInvite(intrus, "000001", true)).rejects.toThrow(/Trop de codes/);
    const maman = await verifier(await accounts.register({ role: "parent", firstName: "Vraie", lastName: "Maman", email: "vraie.maman@test.local", password: "Motdepasse1", acceptTerms: true }));
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
    const pre = await accounts.register({ role: "etudiant", birthYear: year - 20, firstName: "Pré", lastName: "Créé", email: "victime@gmail.test", password: "Motdepasse1", acceptTerms: true });
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
    const r = await o.chercherFormations({ texte: "je veux devenir infirmière", pays: null, ville: null, niveau: null, label: null, limite: null });
    expect(r.formations.length).toBeGreaterThan(0);
    expect(r.formations[0].intitule).toMatch(/infirmi/i);
    expect(r.formations[0].etablissements.length).toBeGreaterThan(0);
    expect((await o.chercherEtablissements({ texte: "UIR", pays: null, ville: null, label: null, formation_id: null, limite: null })).etablissements[0].sigle).toBe("UIR");
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
    const autre = await accounts.register({ role: "etudiant", birthYear: year - 20, firstName: "Zed", lastName: "Autre", email: "zed.navi@test.local", password: "Motdepasse1", acceptTerms: true });
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
  }, 120000);

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

describe("paiements : réglages, plafond, espèces, Stripe", () => {
  const reglagesSvc = () => import("@/server/services/reglages-paiement");
  const base = { ebilling: { actif: false, env: "lab", apiUrl: "https://lab.billing-easy.net/api/v1", portailUrl: "https://test.billing-easy.net", username: "" }, stripe: { actif: true, publishableKey: "pk_test_abc" }, especes: { actif: true, instructions: "Bureau de Libreville, du lundi au vendredi.", delaiJours: 7 } };
  it("clés chiffrées en base, masquées pour l'admin, gardées si le champ est vide", async () => {
    const r = await reglagesSvc();
    await expect(r.enregistrer(student, {})).rejects.toThrow();
    await expect(r.enregistrer(adminU, { ...base, stripe: { ...base.stripe, secretKey: "pas-une-cle" } })).rejects.toThrow();
    const v = await r.enregistrer(adminU, { ...base, stripe: { ...base.stripe, secretKey: "sk_test_SECRET1234", webhookSecret: "whsec_signature99" } });
    expect(v.stripe.secretKey).toBe("…1234");
    expect(JSON.stringify(v)).not.toContain("SECRET1234");
    const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, "paiements"));
    expect(JSON.stringify(row.value)).not.toContain("sk_test_SECRET1234");
    await r.enregistrer(adminU, { ...base }); // clés non ressaisies : conservées
    expect((await r.reglages()).stripe.secretKey).toBe("sk_test_SECRET1234");
  });
  it("espèces : seul l'administrateur confirme la réception", async () => {
    const { payment } = await pay.initiatePayment(student, { kind: "service", amount: 100, currency: "MAD", method: "especes", description: "Test espèces" });
    await expect(pay.validerEspeces(student, payment.reference, { recu: true })).rejects.toThrow();
    await pay.validerEspeces(adminU, payment.reference, { recu: true, numeroRecu: "R-001", montantRecu: 100 });
    const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, payment.reference));
    expect(p.status).toBe("reussi");
    expect((p.meta as { validation?: { numeroRecu?: string } }).validation?.numeroRecu).toBe("R-001");
    await expect(pay.validerEspeces(adminU, payment.reference, { recu: true })).rejects.toThrow(/attente/);
  });
  it("webhook Stripe : signature exigée", async () => {
    const crypto = await import("node:crypto");
    const { verifierStripe } = await import("@/server/payments/webhooks");
    const raw = JSON.stringify({ type: "checkout.session.completed", data: { object: { client_reference_id: "NG-PAY-000001" } } });
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac("sha256", "whsec_signature99").update(`${t}.${raw}`).digest("hex");
    expect((await verifierStripe(raw, `t=${t},v1=${sig}`))?.type).toBe("checkout.session.completed");
    expect(await verifierStripe(raw, `t=${t},v1=${"0".repeat(64)}`)).toBeNull();
    expect(await verifierStripe(raw.replace("000001", "000002"), `t=${t},v1=${sig}`)).toBeNull();
    expect(await verifierStripe(raw, `t=${t - 3600},v1=${crypto.createHmac("sha256", "whsec_signature99").update(`${t - 3600}.${raw}`).digest("hex")}`)).toBeNull();
    expect(await verifierStripe(raw, null)).toBeNull();
  });
});

describe("sécurité : corrections de l'audit du 16 novembre", () => {
  it("code OTP : 50 essais simultanés n'en font passer que 5", async () => {
    const cible = "+221770000099";
    const { devCode } = await accounts.requestOtp(cible, "login");
    const faux = devCode === "000000" ? "111111" : "000000";
    const r = await Promise.allSettled(Array.from({ length: 50 }, () => accounts.verifyOtp(cible, "login", faux)));
    const motifs = r.map((x) => (x.status === "rejected" ? (x.reason as { code?: string }).code : "ok"));
    expect(motifs.filter((m) => m === "otp_faux")).toHaveLength(5);
    expect(motifs.filter((m) => m === "otp_bloque")).toHaveLength(45);
    await expect(accounts.verifyOtp(cible, "login", devCode!)).rejects.toThrow(/Trop de tentatives/);
  });
  it("code OTP : un code juste envoyé deux fois en même temps ne sert qu'une fois", async () => {
    const cible = "+221770000098";
    const { devCode } = await accounts.requestOtp(cible, "login");
    const r = await Promise.allSettled([accounts.verifyOtp(cible, "login", devCode!), accounts.verifyOtp(cible, "login", devCode!)]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
  it("adresse IP : une valeur X-Forwarded-For inventée par le visiteur est ignorée", async () => {
    const { ipClient } = await import("@/server/lib/geoip");
    expect(ipClient(new Headers({ "x-forwarded-for": "1.2.3.4, 41.158.10.20, 127.0.0.1" }))).toBe("41.158.10.20");
    expect(ipClient(new Headers({ "x-forwarded-for": "41.158.10.20" }))).toBe("41.158.10.20");
    expect(ipClient(new Headers({ "x-forwarded-for": "10.0.0.2", "x-real-ip": "196.47.1.1" }))).toBe("196.47.1.1");
  });
  it("Navi : les demandes refusées d'un visiteur ne consomment pas le quota du site", async () => {
    const navi = await import("@/server/services/navi");
    const jour = new Date().toISOString().slice(0, 10);
    const total = async () => (await db.execute<{ value: number }>(sql`select coalesce((select value from counters where key = ${`navi:${jour}:total`}), 0) as value`)).rows[0].value;
    const avant = await total();
    for (let i = 0; i < 40; i++) await navi.verifierQuota(null, "203.0.113.7").catch(() => {});
    expect(await total()).toBe(avant + 30);
  });
});

describe("accès réservé à certains pays", () => {
  it("visiteurs filtrés par pays ; comptes pros, robots et pages libres toujours admis", async () => {
    const a = await import("@/server/services/acces-pays");
    const { paysDeIp } = await import("@/server/lib/geoip");
    const { createSession } = await import("@/server/auth/session");
    // Adresses de test : une au Gabon, une en France, retrouvées dans la base géographique du dépôt.
    const ipGA = ["41.158.0.1", "41.211.0.1", "102.129.0.1", "154.68.0.1", "197.149.0.1"].find((ip) => paysDeIp(ip) === "GA");
    const ipFR = ["90.0.0.1", "82.64.0.1", "2.0.0.1"].find((ip) => paysDeIp(ip) === "FR");
    expect(ipGA && ipFR).toBeTruthy();
    const v = { chemin: "/formations/", agent: "Mozilla/5.0", jeton: null };
    expect((await a.decider({ ...v, ip: ipFR! })).autorise).toBe(true); // filtre inactif par défaut
    await expect(a.enregistrer(student, { actif: true, pays: ["GA", "CI"] })).rejects.toThrow();
    await a.enregistrer(adminU, { actif: true, pays: ["GA", "CI"] });
    try {
      expect((await a.decider({ ...v, ip: ipGA! })).autorise).toBe(true);
      expect((await a.decider({ ...v, ip: ipFR! })).autorise).toBe(false);
      expect((await a.decider({ ...v, ip: ipFR!, chemin: "/connexion/" })).autorise).toBe(true);
      expect((await a.decider({ ...v, ip: ipFR!, chemin: "/api/sante/" })).autorise).toBe(true);
      expect((await a.decider({ ...v, ip: ipFR!, agent: "Mozilla/5.0 (compatible; Googlebot/2.1)" })).autorise).toBe(true);
      const ecole = await createSession(school.id), eleve = await createSession(student.id);
      expect((await a.decider({ ...v, ip: ipFR!, jeton: ecole.token })).motif).toBe("compte_pro");
      expect((await a.decider({ ...v, ip: ipFR!, jeton: eleve.token })).autorise).toBe(false);
      await expect(a.enregistrer(adminU, { actif: true, pays: [] })).rejects.toThrow();
    } finally {
      await a.enregistrer(adminU, { actif: false, pays: ["GA", "CI"] });
    }
  });
});

describe("Navi : routeur, cache des réponses et suivi (faux modèle, sans appel réel)", async () => {
  // La fiche de suivi (appel supplémentaire au petit modèle) est testée à part.
  beforeAll(() => { process.env.NAVI_SUIVI = "0"; });
  afterAll(() => { delete process.env.NAVI_SUIVI; });
  const navi = await import("@/server/services/navi");
  type Params = { model: string; thinking?: { type: string }; fallbacks?: unknown; output_config?: { effort?: string } };
  // Faux client : chaque appel au modèle consomme la réponse suivante du scénario.
  const fauxClient = (scenario: { model: string; textes?: string[]; stop?: string; outils?: { name: string; input: unknown }[] }[], appels: Params[], resume?: string) => ({
    beta: { messages: {
      create: async (p: Params) => { appels.push(p); return { model: "claude-haiku-5-5", stop_reason: "end_turn", usage: { input_tokens: 400, output_tokens: 120 }, content: [{ type: "text", text: resume ?? "" }] }; },
      stream: (p: Params) => {
      appels.push(p);
      const s = scenario.shift()!;
      const h: Record<string, ((x: unknown) => void)[]> = {};
      const m = { model: s.model, stop_reason: s.stop ?? (s.outils ? "tool_use" : "end_turn"), usage: { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 5000, cache_creation_input_tokens: 0 },
        content: [...(s.textes ?? []).map((text) => ({ type: "text", text })), ...(s.outils ?? []).map((o, i) => ({ type: "tool_use", id: `t${i}`, name: o.name, input: o.input }))] };
      return { on(e: string, cb: (x: unknown) => void) { (h[e] ??= []).push(cb); return this; },
        finalMessage: () => new Promise((r) => setTimeout(() => { for (const t of s.textes ?? []) h.text?.forEach((f) => f(t)); r(m); }, 0)) };
      } } },
  }) as unknown as import("@anthropic-ai/sdk").default;
  const lire = async (g: AsyncGenerator<{ t: string; v?: unknown }>) => { const ev = []; for await (const e of g) ev.push(e); return ev; };
  const trace = async (question: string) => (await db.select().from(schema.naviTraces).where(eq(schema.naviTraces.question, question)).orderBy(sql`at desc`))[0];

  it("aiguille la discussion vers le petit modèle et les questions de données vers le modèle principal", () => {
    expect(navi.choisirRoute("Salut ! J'aime dessiner et aider les gens")).toBe("simple");
    expect(navi.choisirRoute("Combien coûte une école d'ingénieurs à Rabat ?")).toBe("complet");
    expect(navi.choisirRoute("quelles formations après un bac S ?")).toBe("complet");
  });

  it("discussion : petit modèle sans réflexion, sans modèle de secours ; coût et jetons enregistrés", async () => {
    const appels: Params[] = [];
    const q = "Bonjour, je ne sais pas trop ce que j'aime";
    await lire(navi.converser({ messages: [{ role: "user", texte: q }] }, student, { client: fauxClient([{ model: "claude-haiku-5-5", textes: ["Parlons-en ! Qu'est-ce qui te plaît à l'école ?"] }], appels) }));
    expect(appels[0].model).toBe("claude-haiku-5-5");
    expect(appels[0].thinking?.type).toBe("disabled");
    expect(appels[0].fallbacks).toBeUndefined();
    const t = await trace(q);
    expect(t).toMatchObject({ route: "simple", modele: "claude-haiku-5-5", statut: "ok", entree: 1000, sortie: 200, cacheLu: 5000 });
    expect(t.reponse).toMatch(/Parlons-en/);
    expect(t.coutUsd).toBeCloseTo(navi.coutUsd("claude-haiku-5-5", { entree: 1000, sortie: 200, cacheLu: 5000, cacheEcrit: 0 }), 10);
  });

  it("le petit modèle veut chercher : son texte est retiré et le tour repart sur le modèle principal", async () => {
    const appels: Params[] = [];
    const q = "Je crois que j'aimerais bien travailler avec des animaux";
    const ev = await lire(navi.converser({ messages: [{ role: "user", texte: q }] }, student, { client: fauxClient([
      { model: "claude-haiku-5-5", textes: ["Je regarde…"], outils: [{ name: "chercher_metiers", input: { texte: "animaux" } }] },
      { model: "claude-sonnet-5-5", textes: ["Le métier de vétérinaire pourrait te plaire."] },
    ], appels) }));
    expect(appels.map((a) => a.model)).toEqual(["claude-haiku-5-5", "claude-sonnet-5-5"]);
    expect(appels[1].fallbacks).toBe("default");
    expect(ev.some((e) => e.t === "efface")).toBe(true);
    const t = await trace(q);
    expect(t).toMatchObject({ route: "complet", modele: "claude-sonnet-5-5", tours: 2 });
    expect(t.reponse).toBe("Le métier de vétérinaire pourrait te plaire.");
    expect(t.coutUsd).toBeGreaterThan(navi.coutUsd("claude-sonnet-5-5", { entree: 1000, sortie: 200, cacheLu: 5000, cacheEcrit: 0 }));
  });

  it("question générique d'un visiteur : servie depuis le cache la seconde fois, sans appel au modèle", async () => {
    const appels: Params[] = [];
    const q = "Les candidatures sont-elles payantes sur Navigoal ?";
    const req = { messages: [{ role: "user" as const, texte: q }], page: { chemin: "/" } };
    await lire(navi.converser(req, null, { client: fauxClient([{ model: "claude-sonnet-5-5", textes: ["Non, elles sont gratuites."] }], appels) }));
    const ev = await lire(navi.converser({ ...req, messages: [{ role: "user", texte: "les candidatures sont elles payantes sur navigoal" }] }, null, { client: fauxClient([], appels) }));
    expect(appels).toHaveLength(1);
    expect(ev).toContainEqual({ t: "texte", v: "Non, elles sont gratuites." });
    expect((await trace("les candidatures sont elles payantes sur navigoal"))).toMatchObject({ route: "cache", coutUsd: 0 });
    // Un compte connecté n'est jamais servi depuis le cache (réponses qui peuvent dépendre de son dossier).
    await lire(navi.converser(req, student, { client: fauxClient([{ model: "claude-sonnet-5-5", textes: ["Elles sont gratuites."] }], appels) }));
    expect(appels).toHaveLength(2);
  });

  it("refus et panne : enregistrés avec leur statut", async () => {
    const q1 = "Combien coûte l'école X à Rabat, question refusée ?";
    await lire(navi.converser({ messages: [{ role: "user", texte: q1 }] }, student, { client: fauxClient([{ model: "claude-sonnet-5-5", stop: "refusal" }], []) }));
    expect((await trace(q1)).statut).toBe("refus");
    const q2 = "Combien coûte l'école Y à Rabat, panne ?";
    const panne = { beta: { messages: { stream: () => ({ on() { return this; }, finalMessage: () => Promise.reject(new Error("réseau")) }) } } } as unknown as import("@anthropic-ai/sdk").default;
    await lire(navi.converser({ messages: [{ role: "user", texte: q2 }] }, student, { client: panne }));
    expect((await trace(q2)).statut).toBe("erreur");
  });

  it("cartes demandées avec une phrase courte : la réponse complète est rédigée après les cartes", async () => {
    const appels: Params[] = [];
    const q = "Quelles écoles d'infirmiers à Rabat, test de l'ordre des cartes ?";
    const longue = "Voici trois écoles qui forment des infirmiers à Rabat : **École A** - publique, gratuite. **École B** - privée, environ 40 000 MAD par an. **École C** - privée, tarif non publié, à vérifier auprès d'elle. Tu préfères une école publique ou privée ? Et quel budget peux-tu prévoir chaque année pour tes études ?";
    const ev = await lire(navi.converser({ messages: [{ role: "user", texte: q }] }, student, { client: fauxClient([
      { model: "claude-sonnet-5-5", textes: ["Voici les écoles."], outils: [{ name: "afficher", input: { etablissements: [], formation_id: null, devis: null, liens: [], conseiller: false, suggestions: [] } }] },
      { model: "claude-sonnet-5-5", textes: [longue] },
    ], appels) }));
    expect(appels).toHaveLength(2);
    expect(ev.some((e) => e.t === "efface")).toBe(true);
    expect((await trace(q)).reponse).toBe(longue);
    // Réponse déjà complète (40 mots ou plus) écrite avec les cartes : pas de second appel.
    const appels2: Params[] = [];
    await lire(navi.converser({ messages: [{ role: "user", texte: q + " bis" }] }, student, { client: fauxClient([
      { model: "claude-sonnet-5-5", textes: [longue], outils: [{ name: "afficher", input: { etablissements: [], formation_id: null, devis: null, liens: [], conseiller: false, suggestions: [] } }] },
    ], appels2) }));
    expect(appels2).toHaveLength(1);
    expect((await trace(q + " bis")).reponse).toBe(longue);
  });

  it("réponse trop longue : condensée par le petit modèle, sauf si le résumé invente un chiffre", async () => {
    const longue = ("Voici les écoles : **École A** - 28 000 MAD par an, environ 1,7 million de F CFA. " + "Détail utile mais secondaire sur la vie étudiante et les transports. ".repeat(14)).trim();
    const q1 = "Quelles écoles de commerce pas chères à Rabat, test de condensation ?";
    const appels: Params[] = [];
    await lire(navi.converser({ messages: [{ role: "user", texte: q1 }] }, student, { client: fauxClient([{ model: "claude-sonnet-5-5", textes: [longue] }], appels, "Voici les écoles : **École A** - 28 000 MAD par an, environ 1,7 million de F CFA.") }));
    const t1 = await trace(q1);
    expect(t1.reponse).toBe("Voici les écoles : **École A** - 28 000 MAD par an, environ 1,7 million de F CFA.");
    expect(t1.outils).toContain("condensation");
    expect(appels.map((a) => a.model)).toEqual(["claude-sonnet-5-5", "claude-haiku-5-5"]);
    const q2 = "Quelles écoles de commerce pas chères à Rabat, résumé qui invente ?";
    await lire(navi.converser({ messages: [{ role: "user", texte: q2 }] }, student, { client: fauxClient([{ model: "claude-sonnet-5-5", textes: [longue] }], [], "**École A** - 25 000 MAD par an.") }));
    expect((await trace(q2)).reponse).toBe(longue);
  });

  it("tableau du back-office : chiffres, routes et dernières questions", async () => {
    const suivi = await import("@/server/services/navi-suivi");
    await expect(suivi.tableau(student, {})).rejects.toThrow();
    const r = await suivi.tableau(adminU, { periode: "7j" });
    expect(r.chiffres.questions).toBeGreaterThanOrEqual(6);
    expect(r.chiffres.simple).toBeGreaterThanOrEqual(1);
    expect(r.chiffres.cache).toBeGreaterThanOrEqual(1);
    expect(r.chiffres.refus).toBeGreaterThanOrEqual(1);
    expect(r.dernieres[0]).toHaveProperty("question");
    expect((await suivi.detail(adminU, r.dernieres[0].id))?.question).toBe(r.dernieres[0].question);
  });
});

describe("Navi : correcteur automatique des tests de qualité", async () => {
  const { controler } = await import("@/server/services/navi-evals");
  const fs = await import("node:fs");
  const cas = JSON.parse(fs.readFileSync("scripts/navi-evals/cas.json", "utf8")) as import("@/server/services/navi-evals").Cas[];
  const infirmier = cas.find((c) => c.id === "infirmier")!;
  it("refuse une réponse vide ou une annonce, accepte une réponse conforme", async () => {
    expect(cas.length).toBeGreaterThanOrEqual(12);
    expect(new Set(cas.map((c) => c.id)).size).toBe(cas.length);
    const { NOMS_OUTILS } = await import("@/server/services/navi");
    for (const c of cas) for (const o of c.attentes.outilsUnDe ?? []) expect(NOMS_OUTILS, `${c.id} : outil ${o}`).toContain(o);
    expect(controler(infirmier, { reponse: "", outils: [], cartes: 0, route: "complet", statut: "ok" })).toContain("aucune réponse affichée");
    expect(controler(infirmier, { reponse: "Je cherche les écoles…", outils: ["chercher_formations"], cartes: 1, route: "complet", statut: "ok" })).toContain("annonce son travail au lieu de répondre");
    expect(controler(infirmier, { reponse: "Voici deux écoles : **ISPITS Rabat** - public, Rabat.", outils: ["chercher_formations", "afficher"], cartes: 2, route: "complet", statut: "ok" })).toEqual([]);
    expect(controler(cas.find((c) => c.id === "accueil")!, { reponse: "Bonjour !", outils: ["chercher_formations"], cartes: 0, route: "complet", statut: "ok" })[0]).toMatch(/recherche inutile/);
  });
});

describe("sécurité : corrections de l'audit (suite)", () => {
  it("année de naissance figée, noms sans adresse web, élève sans année refusé", async () => {
    const e = await accounts.register({ role: "eleve", firstName: "Lina", lastName: "Obiang", email: "lina.age@test.local", password: "Motdepasse1", birthYear: year - 15, acceptTerms: true, guardianEmail: "maman.lina@test.local" });
    await expect(accounts.updateProfile(e.id, { birthYear: year - 25 })).rejects.toThrow(/ne peut plus être modifiée/);
    expect(accounts.isMinor((await reload(e.id)).birthYear)).toBe(true);
    await expect(accounts.register({ role: "parent", firstName: "Compte suspendu https://evil.example/x", lastName: "Test", email: "piege@test.local", password: "Motdepasse1", acceptTerms: true })).rejects.toThrow(/lettres seulement/i);
    await expect(accounts.register({ role: "eleve", firstName: "Sans", lastName: "Annee", email: "sans.annee@test.local", password: "Motdepasse1", acceptTerms: true })).rejects.toThrow(/année de naissance/);
    expect((await accounts.register({ role: "parent", firstName: "Marie-Ève", lastName: "N'Guessan", email: "marie.eve@test.local", password: "Motdepasse1", acceptTerms: true })).firstName).toBe("Marie-Ève");
  });
  it("blocage de connexion par adresse IP : le vrai titulaire se connecte depuis une autre adresse", async () => {
    await accounts.register({ role: "parent", firstName: "Ciblé", lastName: "Blocage", email: "cible.blocage@test.local", password: "Motdepasse1", acceptTerms: true });
    for (let i = 0; i < 8; i++) await accounts.login("cible.blocage@test.local", "faux", "203.0.113.50").catch(() => {});
    await expect(accounts.login("cible.blocage@test.local", "Motdepasse1", "203.0.113.50")).rejects.toThrow(/Trop de tentatives/);
    expect((await accounts.login("cible.blocage@test.local", "Motdepasse1", "198.51.100.7")).email).toBe("cible.blocage@test.local");
  });
  it("limite de fréquence partagée (inscriptions, codes, relances de paiement)", async () => {
    const { limiter } = await import("@/server/lib/counters");
    for (let i = 0; i < 3; i++) await limiter("test:198.51.100.9", 3, 3600, "trop");
    await expect(limiter("test:198.51.100.9", 3, 3600, "Trop d'essais")).rejects.toThrow(/Trop d'essais/);
    await limiter("test:198.51.100.10", 3, 3600, "trop"); // autre adresse : non concernée
  });
  it("E-Billing : la clé n'est envoyée qu'aux serveurs officiels", async () => {
    const r = await import("@/server/services/reglages-paiement");
    const base = { ebilling: { actif: false, env: "lab", apiUrl: "https://attaquant.example/api", portailUrl: "https://test.billing-easy.net", username: "x" }, stripe: { actif: false, publishableKey: "" }, especes: { actif: true, instructions: "Bureau", delaiJours: 7 } };
    await expect(r.enregistrer(adminU, base)).rejects.toThrow();
  });
});

describe("accréditations : suivi, renouvellement saisi, proposition écartée", () => {
  it("un renouvellement validé s'applique tout de suite aux candidatures et part au registre", async () => {
    const acc = await import("@/server/services/accreditations");
    await expect(acc.vue(student)).rejects.toThrow();
    const v = await acc.vue(adminU);
    expect(v.meta.annee_reference).toMatch(/^\d{4}-\d{4}$/);
    expect(v.en_mention.length).toBeGreaterThan(0);
    // Une filière en mention qui existe bien en base (même établissement, intitulé et composante)
    let cible = null as null | (typeof v.en_mention)[number];
    for (const l of v.en_mention) {
      const [p] = await db.select().from(schema.programs).where(and(eq(schema.programs.establishmentId, l.etablissement_id), eq(schema.programs.title, l.filiere), eq(schema.programs.faculty, l.composante)));
      if (p) { cible = l; break; }
    }
    expect(cible).not.toBeNull();
    await expect(acc.valider(adminU, { etablissementId: cible!.etablissement_id, filiere: cible!.filiere, composante: cible!.composante, fin: "2030-2032", arrete: "1.26", bulletinOfficiel: "7600" })).rejects.toThrow();
    const r = await acc.valider(adminU, { etablissementId: cible!.etablissement_id, filiere: cible!.filiere, composante: cible!.composante, fin: "2030-2031", arrete: "1234.26", bulletinOfficiel: "7600" });
    expect(r.programmesMisAJour).toBeGreaterThan(0);
    const [p] = await db.select().from(schema.programs).where(and(eq(schema.programs.establishmentId, cible!.etablissement_id), eq(schema.programs.title, cible!.filiere)));
    expect(p.homologated).toBe(true);
    expect(p.homologation).toMatchObject({ statut: "accreditee", fin: "2030-2031" });
    expect((await acc.aReporter()).some((x) => x.id === r.id)).toBe(true);
    expect((await acc.vue(adminU)).en_mention.find((l) => l.filiere === cible!.filiere && l.etablissement_id === cible!.etablissement_id)?.renouvellement?.fin).toBe("2030-2031");
    const rej = await acc.rejeter(adminU, { etablissementId: "ma-x", filiere: "Filière inventée", fin: "2030-2031", arrete: "9.26", bulletinOfficiel: "7601" });
    expect(rej.statut).toBe("rejete");
    expect((await acc.aReporter()).some((x) => x.id === rej.id)).toBe(false);
  });
});

describe("audience en direct", () => {
  it("page vue puis signal de présence : visible dans « En ce moment », provenance d'arrivée gardée", async () => {
    const aud = await import("@/server/services/audience");
    const req = () => new Request("http://localhost/api/vu/", { headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile", host: "localhost" } });
    await aud.enregistrer(req(), { p: "/comparateur", r: "https://l.facebook.com/" }, { id: student.id, role: "eleve" });
    await aud.enregistrer(req(), { p: "/metiers" }, { id: student.id, role: "eleve" });
    await aud.enregistrer(req(), { p: "/metiers", h: 1 }, { id: student.id, role: "eleve" });
    const d = await aud.direct(adminU);
    const v = d.visiteurs.find((x) => x.page === "/metiers/")!;
    expect(v).toMatchObject({ source: "facebook", appareil: "mobile", role: "eleve", pages: 2, userId: student.id, compte: `${student.firstName} ${student.lastName}` });
    expect(d.connectes).toBeGreaterThanOrEqual(1);
    await expect(aud.direct(student)).rejects.toThrow();
    // Dossier de l'élève ouvert depuis « En ce moment » : admin seulement, consultation journalisée
    const dos = await admin.dossierUtilisateur(adminU, student.id);
    expect(dos.compte).toMatchObject({ id: student.id, role: student.role });
    expect(dos.candidatures.length).toBeGreaterThan(0);
    expect(dos.pieces.length).toBeGreaterThan(0);
    expect(dos.liens.some((l) => l.personne?.id === parent.id)).toBe(true);
    await expect(admin.dossierUtilisateur(school, student.id)).rejects.toThrow();
    const [log] = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, "consultation_dossier"));
    expect(log).toBeTruthy();
  });
});

describe("Navi connaît l'élève : profil, fiche de suivi, avis d'admission", () => {
  it("profil du compte dans le contexte, avis d'admission selon la série, fiche de suivi tenue et effaçable", async () => {
    const np = await import("@/server/services/navi-profil");
    const navi = await import("@/server/services/navi");
    const { formations, series } = await import("@/lib/data");
    // Élève avec une série et un test d'orientation
    const f = formations.find((x) => (x.series_recommandees.GA ?? []).length > 0)!;
    const conseillee = f.series_recommandees.GA![0];
    const autre = series.find((s) => s.pays === "GA" && !(f.series_recommandees.GA ?? []).includes(s.id))!;
    await db.insert(schema.profiles).values({ userId: student.id, serie: conseillee, average: 13.5, targetJobs: [f.metiers[0]].filter(Boolean) })
      .onConflictDoUpdate({ target: schema.profiles.userId, set: { serie: conseillee, average: 13.5, targetJobs: [f.metiers[0]].filter(Boolean) } });
    await db.insert(schema.orientationResults).values({ userId: student.id, answers: [1], scores: { S: 5, E: 4 }, top: ["S", "E"] });

    const ctx = await np.contexteEleve(student);
    expect(ctx).toContain("13.5/20");
    expect(ctx).toMatch(/Test d'orientation : /);

    const ok = await np.verifierAdmission(student, f.id);
    expect(ok.serie_conseillee).toBe(true);
    const non = await np.verifierAdmission(student, f.id, autre.id);
    expect(non.serie_conseillee).toBe(false);
    expect((await np.verifierAdmission(null, f.id)).serie_conseillee).toBeNull();

    // Fiche de suivi rédigée par le petit modèle (simulé), relue dans le contexte et dans l'accueil
    const faux = { beta: { messages: { create: async () => ({ stop_reason: "end_turn", model: "claude-haiku-5-5", usage: {}, content: [{ type: "text", text: "Projet et goûts\n- Aime le contact\nProchaine étape\n- Comparer deux écoles à Rabat" }] }) } } };
    await navi.mettreAJourSuivi(faux as never, student, "Je veux être infirmière", "Voici des pistes…");
    expect((await np.lireSuivi(student.id))?.notes).toContain("Comparer deux écoles");
    expect(await np.contexteEleve(student)).toContain("Fiche de suivi");
    const acc = await np.accueilNavi(student);
    expect(acc.texte).toContain("Comparer deux écoles à Rabat");
    // « INCHANGE » ne touche pas la fiche ; un autre profil ne voit rien
    const inchange = { beta: { messages: { create: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "INCHANGE" }] }) } } };
    await navi.mettreAJourSuivi(inchange as never, student, "merci", "Avec plaisir");
    expect((await np.lireSuivi(student.id))?.notes).toContain("Comparer deux écoles");
    await navi.mettreAJourSuivi(faux as never, school, "x", "y");
    expect(await np.lireSuivi(school.id)).toBeNull();
    await np.effacerSuivi(student.id);
    expect(await np.lireSuivi(student.id)).toBeNull();
  });
});
describe("Navi accompagne la candidature : relecture de lettre, rappels", () => {
  it("relit une lettre sans la réécrire et refuse un texte trop court", async () => {
    const navi = await import("@/server/services/navi");
    const json = { points_forts: ["Ton projet est clair."], a_ameliorer: ["Ajoute un exemple de stage."], questions: ["Pourquoi cette école ?"], avis: "Bon début !", intrus: 1 };
    let recu = "";
    const faux = { beta: { messages: { create: async (p: { messages: { content: string }[] }) => { recu = p.messages[0].content; return { stop_reason: "end_turn", model: "claude-sonnet-5-5", usage: { input_tokens: 10, output_tokens: 20 }, content: [{ type: "text", text: "Voici : " + JSON.stringify(json) }] }; } } } };
    await expect(navi.relireMotivation(student, { texte: "Trop court." }, faux as never)).rejects.toThrow(/40 mots/);
    const lettre = Array.from({ length: 60 }, (_, i) => `mot${i}`).join(" ");
    const r = await navi.relireMotivation(student, { texte: lettre }, faux as never);
    expect(r).toEqual({ points_forts: ["Ton projet est clair."], a_ameliorer: ["Ajoute un exemple de stage."], questions: ["Pourquoi cette école ?"], avis: "Bon début !" });
    expect(recu).toContain("mot59");
    const casse = { beta: { messages: { create: async () => ({ stop_reason: "end_turn", model: "claude-sonnet-5-5", usage: {}, content: [{ type: "text", text: "pas de json" }] }) } } };
    await expect(navi.relireMotivation(student, { texte: lettre }, casse as never)).rejects.toThrow(/pas pu relire/);
  });
  it("rappelle une candidature en brouillon avant la clôture (élève et parent), une seule fois par palier", async () => {
    const { rappelsEleves } = await import("@/server/services/rappels-eleves");
    const np = await import("@/server/services/navi-profil");
    const dejaVises = (await db.select({ p: schema.applications.programId }).from(schema.applications).where(eq(schema.applications.studentId, student.id))).map((x) => x.p);
    const prog = (await etab.listPrograms("ma-esa-casa")).find((p) => !dejaVises.includes(p.id));
    expect(prog).toBeTruthy();
    const brouillon = await apps.createDraft(student, prog!.id);
    expect(brouillon.status).toBe("brouillon");
    const maintenant = new Date();
    await db.insert(schema.campaigns).values({ establishmentId: "ma-esa-casa", kind: "admission", title: "Admissions", programIds: [prog!.id], startsAt: new Date(maintenant.getTime() - 30 * 864e5), endsAt: new Date(maintenant.getTime() + 5 * 864e5), published: true });
    {
      const avant = (await notif.listNotifications(student.id)).filter((n) => n.kind === "rappel_brouillon").length;
      const r1 = await rappelsEleves(maintenant);
      expect(r1.envoyes).toBeGreaterThanOrEqual(1);
      const apres = (await notif.listNotifications(student.id)).filter((n) => n.kind === "rappel_brouillon");
      expect(apres.length).toBe(avant + 1);
      expect(apres[0].body).toMatch(/ferment le/);
      expect((await notif.listNotifications(parent.id)).some((n) => n.kind === "rappel_brouillon" && n.title.includes("Awa"))).toBe(true);
      // Pas de second envoi pour le même palier ; nouveau palier à J-2
      expect((await rappelsEleves(maintenant)).envoyes).toBe(0);
      expect((await rappelsEleves(new Date(maintenant.getTime() + 4 * 864e5))).envoyes).toBeGreaterThanOrEqual(1);
    }
    // Pièce demandée : rappel après 3 jours, et Navi le signale dès l'accueil
    await db.update(schema.applications).set({ status: "piece_demandee", requestedDocuments: ["photo"], updatedAt: new Date(maintenant.getTime() - 3.5 * 864e5) }).where(eq(schema.applications.id, brouillon.id));
    expect((await rappelsEleves(maintenant)).envoyes).toBeGreaterThanOrEqual(1);
    expect((await notif.listNotifications(student.id)).some((n) => n.kind === "rappel_piece")).toBe(true);
    expect(await np.urgenceCandidature(student.id)).toMatch(/attend une pièce/);
    expect((await np.accueilNavi(student)).texte).toMatch(/attend une pièce/);
    await db.update(schema.applications).set({ status: "desistee" }).where(eq(schema.applications.id, brouillon.id));
  });
});
describe("Navi : bourses, gestes à confirmer, avis sur les réponses", () => {
  it("bourses par pays, bouton de candidature ou de rendez-vous seulement après vérification, avis une seule fois", async () => {
    const navi = await import("@/server/services/navi");
    const { bourses, proposerAction } = navi._outils;
    const ga = bourses("Gabon");
    expect(ga.pays).toBe("GA");
    expect(ga.bourses.map((b) => b.id)).toEqual(expect.arrayContaining(["ga-anbg", "ma-amci"]));
    expect(bourses("BJ").remarque).toMatch(/Aucune bourse/);

    // Visiteur : rien ; parent : pas de candidature mais un rendez-vous
    const cartes: import("@/server/services/navi").Carte[] = [];
    expect(await proposerAction({ action: "rendez_vous" }, null, cartes)).toHaveProperty("erreur");
    expect(await proposerAction({ action: "candidature", etablissement_id: "ma-esa-casa", formation_id: "x" }, parent, cartes)).toHaveProperty("erreur");
    expect(await proposerAction({ action: "rendez_vous", sujet: "Choisir entre deux écoles" }, parent, cartes)).toMatchObject({ propose: true });
    expect(cartes.at(-1)).toMatchObject({ type: "action", action: "rendez_vous", suivi: "/parent/conseiller/" });
    // Élève : formation inconnue refusée ; formation ouverte → bouton ; candidature en cours → lien
    expect(await proposerAction({ action: "candidature", etablissement_id: "ma-esa-casa", formation_id: "inexistante" }, student, cartes)).toHaveProperty("erreur");
    const [libre] = await db.select({ p: schema.programs }).from(schema.applications).innerJoin(schema.programs, eq(schema.programs.id, schema.applications.programId))
      .where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.status, "desistee"))).limit(1);
    const n = cartes.length;
    expect(await proposerAction({ action: "candidature", etablissement_id: libre.p.establishmentId, formation_id: libre.p.formationId }, student, cartes)).toMatchObject({ propose: true });
    expect(cartes.length).toBe(n + 1);
    expect(cartes.at(-1)).toMatchObject({ type: "action", action: "candidature", programmeId: libre.p.id });
    expect(await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.programId, libre.p.id), eq(schema.applications.status, "brouillon")))).toHaveLength(0); // rien n'est créé sans confirmation
    const nouveau = await apps.createDraft(student, (cartes.at(-1) as { programmeId: string }).programmeId); // l'élève a confirmé
    expect(await proposerAction({ action: "candidature", etablissement_id: libre.p.establishmentId, formation_id: libre.p.formationId }, student, cartes)).toMatchObject({ deja: true, lien: `/espace/candidatures/${nouveau.id}/` });

    // Avis : la personne note sa réponse une fois ; un autre compte ne peut pas noter la réponse d'un élève
    const [tr] = await db.insert(schema.naviTraces).values({ userId: student.id, role: student.role, question: "q", route: "complet", statut: "ok" }).returning();
    expect((await navi.donnerAvis(parent, tr.id, "inutile")).enregistre).toBe(false);
    expect((await navi.donnerAvis(null, tr.id, "inutile")).enregistre).toBe(false);
    expect((await navi.donnerAvis(student, tr.id, "utile")).enregistre).toBe(true);
    expect((await navi.donnerAvis(student, tr.id, "inutile")).enregistre).toBe(false);
    const naviSuivi = await import("@/server/services/navi-suivi");
    const tab = await naviSuivi.tableau(adminU, { avis: "utile" });
    expect(tab.chiffres.utiles).toBeGreaterThanOrEqual(1);
    expect(tab.dernieres.every((x) => x.avis === "utile")).toBe(true);
  });
});
describe("messagerie : échange direct entre l'équipe Navigoal et un utilisateur", () => {
  it("l'admin écrit en premier, l'élève répond dans sa messagerie, le fil est unique par compte", async () => {
    const relais = await import("@/server/services/relais");
    const c = await relais.ouvrirEchangeDirect(adminU, student.id);
    expect((await relais.ouvrirEchangeDirect(adminU, student.id)).id).toBe(c.id); // un seul fil par compte
    await expect(relais.ouvrirEchangeDirect(adminU, adminU.id)).rejects.toThrow(/administrateurs/);
    await expect(relais.ouvrirEchangeDirect(student, school.id)).rejects.toThrow();
    await relais.adminPost(adminU, c.id, "Bonjour Awa, nous avons bien reçu ton dossier. As-tu une question ?");
    expect((await notif.listNotifications(student.id)).some((n) => n.title.startsWith("Message de l'équipe Navigoal"))).toBe(true);
    const fils = await msg.listConversations(student.id);
    expect(fils.find((f) => f.id === c.id)?.unread).toBe(1);
    await msg.sendMessage(student, c.id, "Oui, quand aurai-je la réponse de l'école ?");
    const vue = await relais.listAllConversations(adminU, { type: "direct" });
    const fil = vue.items.find((x) => x.id === c.id)!;
    expect(fil.enAttente).toBe(true);
    expect(vue.counts.direct).toBeGreaterThanOrEqual(1);
    await expect(msg.getConversation(parent.id, c.id)).rejects.toThrow(); // personne d'autre n'y a accès
    // Une école peut aussi être contactée directement
    const e = await relais.ouvrirEchangeDirect(adminU, school.id);
    expect(e.id).not.toBe(c.id);
  });
});
describe("appels audio et vidéo (Daily simulé)", () => {
  it("l'école lance l'appel dans le fil, l'élève et son parent le rejoignent avec un jeton, les autres non", async () => {
    const appels = await import("@/server/services/appels");
    const relais = await import("@/server/services/relais");
    const [cand] = await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.establishmentId, "ma-esa-casa"))).limit(1);
    const fil = await relais.openApplicationThread(adminU, cand.id);
    delete process.env.DAILY_API_KEY;
    await expect(appels.lancerAppel(school, fil.id)).rejects.toThrow(/pas encore activés/);
    process.env.DAILY_API_KEY = "cle-test";
    const appelsDaily: { url: string; corps: Record<string, unknown> }[] = [];
    const vrai = globalThis.fetch;
    const espion = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (!String(url).startsWith("https://api.daily.co/")) return vrai(url as RequestInfo, init);
      const corps = JSON.parse(String(init?.body ?? "{}"));
      appelsDaily.push({ url: String(url), corps });
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer cle-test");
      return new Response(JSON.stringify(String(url).endsWith("/rooms") ? { name: corps.name, url: `https://navigoal.daily.co/${corps.name}` } : { token: "jeton-test" }), { status: 200 });
    });
    try {
      await expect(appels.lancerAppel(student, fil.id)).rejects.toThrow(); // un candidat ne lance pas d'appel
      await expect(appels.lancerAppel(landlord, fil.id)).rejects.toThrow(); // pas dans ce fil
      const a = await appels.lancerAppel(school, fil.id, { audioSeul: true });
      expect(appelsDaily[0].corps).toMatchObject({ privacy: "private", properties: { eject_at_room_exp: true, lang: "fr", start_video_off: true } });
      expect((await appels.lancerAppel(school, fil.id)).id).toBe(a.id); // pas de doublon
      expect(appelsDaily.filter((x) => x.url.endsWith("/rooms"))).toHaveLength(1);
      expect((await msg.getConversation(student.id, fil.id)).messages.some(({ m }) => m.body.includes(`/appel/${a.id}/`))).toBe(true);
      expect((await notif.listNotifications(student.id)).some((n) => n.kind === "appel" && n.link === `/appel/${a.id}/`)).toBe(true);
      expect((await notif.listNotifications(parent.id)).some((n) => n.kind === "appel")).toBe(true);

      const r = await appels.rejoindre(student, a.id);
      expect(r).toMatchObject({ termine: false, jeton: "jeton-test", audioSeul: true });
      expect(appelsDaily.at(-1)!.corps).toMatchObject({ properties: { room_name: a.salle, is_owner: false, eject_at_token_exp: true } });
      await appels.rejoindre(parent, a.id); // parent d'un élève du fil
      await appels.rejoindre(school, a.id);
      expect(appelsDaily.at(-1)!.corps).toMatchObject({ properties: { is_owner: true } });
      await expect(appels.rejoindre(landlord, a.id)).rejects.toThrow(/introuvable/i);
      await db.update(schema.appels).set({ expire: new Date(Date.now() - 1000) }).where(eq(schema.appels.id, a.id));
      const n = appelsDaily.length;
      expect(await appels.rejoindre(student, a.id)).toMatchObject({ termine: true });
      expect(appelsDaily.length).toBe(n); // aucun jeton pour un appel terminé
    } finally { espion.mockRestore(); delete process.env.DAILY_API_KEY; }
  });
});
describe("rendez-vous d'appel planifiés", () => {
  it("l'école planifie, l'élève et son parent sont prévenus, le lien s'ouvre 10 min avant ; déplacer, annuler, agenda, rappels", async () => {
    const appels = await import("@/server/services/appels");
    const relais = await import("@/server/services/relais");
    const [cand] = await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.establishmentId, "ma-esa-casa"))).limit(1);
    const fil = await relais.openApplicationThread(adminU, cand.id);
    const demain = new Date(Date.now() + 26 * 3600e3);
    await expect(appels.planifierAppel(student, fil.id, { debut: demain.toISOString() })).rejects.toThrow(); // le candidat ne planifie pas
    await expect(appels.planifierAppel(landlord, fil.id, { debut: demain.toISOString() })).rejects.toThrow(); // pas dans ce fil
    await expect(appels.planifierAppel(school, fil.id, { debut: new Date(Date.now() + 60e3).toISOString() })).rejects.toThrow(/5 minutes/);
    const a = await appels.planifierAppel(school, fil.id, { debut: demain.toISOString(), dureeMin: 45, objet: "Entretien d'admission" });
    expect(a.salle).toBeNull(); // salle créée le jour venu
    expect((await notif.listNotifications(student.id)).some((n) => n.kind === "appel" && n.link === `/appel/${a.id}/` && /planifié/.test(n.title))).toBe(true);
    expect((await notif.listNotifications(parent.id)).some((n) => n.link === `/appel/${a.id}/`)).toBe(true);
    expect((await msg.getConversation(student.id, fil.id)).messages.some(({ m }) => m.body.includes("📅") && m.body.includes(`/appel/${a.id}/`))).toBe(true);
    expect(await appels.rejoindre(student, a.id)).toMatchObject({ aVenir: true, objet: "Entretien d'admission", dureeMin: 45 });
    const mesE = await appels.mesRendezVous(student);
    expect(mesE.find((r) => r.id === a.id)).toMatchObject({ objet: "Entretien d'admission", monRdv: false, annule: false });
    expect((await appels.mesRendezVous(parent)).some((r) => r.id === a.id)).toBe(true); // parent d'un élève du fil
    expect((await appels.mesRendezVous(school)).find((r) => r.id === a.id)?.monRdv).toBe(true);
    expect((await appels.mesRendezVous(landlord)).some((r) => r.id === a.id)).toBe(false);
    const ics = await appels.agendaIcs(student, a.id, "https://navigoal.net");
    expect(ics).toMatch(/BEGIN:VEVENT[\s\S]*TRIGGER:-PT15M[\s\S]*END:VCALENDAR/);
    expect(ics).toContain(`https://navigoal.net/appel/${a.id}/`);
    await expect(appels.agendaIcs(landlord, a.id, "https://navigoal.net")).rejects.toThrow();
    // Rappel du jour, une seule fois
    const r1 = await appels.rappelsDuJour(new Date(demain.getTime() - 3 * 3600e3));
    expect(r1.rappels).toBeGreaterThanOrEqual(2);
    expect((await appels.rappelsDuJour(new Date(demain.getTime() - 2 * 3600e3))).rappels).toBe(0);
    // Déplacer : seul l'organisateur (ou l'équipe)
    await expect(appels.deplacerAppel(student, a.id, { debut: new Date(Date.now() + 50 * 3600e3).toISOString() })).rejects.toThrow();
    const m = await appels.deplacerAppel(school, a.id, { debut: new Date(Date.now() + 50 * 3600e3).toISOString(), dureeMin: 30 });
    expect(m.dureeMin).toBe(30);
    // Un appel immédiat dans le même fil ne réutilise pas le rendez-vous futur
    await appels.annulerAppel(school, a.id);
    expect(await appels.rejoindre(student, a.id)).toMatchObject({ termine: true, annule: true });
    expect((await appels.mesRendezVous(student)).find((r) => r.id === a.id)?.annule).toBe(true);
    await expect(appels.annulerAppel(school, a.id)).rejects.toThrow(/annulé/);
  });
  it("le jour venu, la salle est créée au premier accès, une seule fois", async () => {
    const appels = await import("@/server/services/appels");
    const relais = await import("@/server/services/relais");
    const [cand] = await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.establishmentId, "ma-esa-casa"))).limit(1);
    const fil = await relais.openApplicationThread(adminU, cand.id);
    const a = await appels.planifierAppel(school, fil.id, { debut: new Date(Date.now() + 6 * 60e3).toISOString(), dureeMin: 30, audioSeul: true });
    process.env.DAILY_API_KEY = "cle-test";
    const salles: string[] = [];
    const vrai = globalThis.fetch;
    const espion = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (!String(url).startsWith("https://api.daily.co/")) return vrai(url as RequestInfo, init);
      const corps = JSON.parse(String(init?.body ?? "{}"));
      if (String(url).endsWith("/rooms")) salles.push(corps.name);
      return new Response(JSON.stringify(String(url).endsWith("/rooms") ? { name: corps.name, url: `https://navigoal.daily.co/${corps.name}` } : { token: "jeton-test" }), { status: 200 });
    });
    try {
      expect(await appels.rejoindre(student, a.id)).toMatchObject({ termine: false, jeton: "jeton-test", audioSeul: true });
      await appels.rejoindre(school, a.id);
      expect(salles).toHaveLength(1);
      // l'appel immédiat du même fil reste distinct du rendez-vous
      expect((await appels.lancerAppel(school, fil.id)).id).not.toBe(a.id);
    } finally { espion.mockRestore(); delete process.env.DAILY_API_KEY; }
  });
});
describe("salons virtuels", () => {
  it("salon créé par l'équipe pour une école et invitations aux élèves ciblés", async () => {
    const salons = await import("@/server/services/salons");
    const { etabById, formationById } = await import("@/lib/data");
    const dom = etabById["ma-esa-casa"].formations.map((f) => formationById[f]).find(Boolean)!.domaine;
    await db.update(schema.profiles).set({ domain: dom }).where(eq(schema.profiles.userId, student.id));
    const debut = new Date(Date.now() + 2 * 86400e3).toISOString();
    await expect(salons.creerParAdmin(school, { establishmentId: "ma-esa-casa", titre: "Salon de l'équipe", debut })).rejects.toThrow();
    await expect(salons.creerParAdmin(adminU, { establishmentId: "ma-esa-casa", titre: "Salon de l'équipe", debut, forfaitMad: 500 })).rejects.toThrow(/référence/);
    const s = await salons.creerParAdmin(adminU, { establishmentId: "ma-esa-casa", titre: "Salon de l'équipe", debut, ciblePays: ["SN"], forfaitMad: 0 });
    expect(s).toMatchObject({ statut: "publie", creeParAdmin: true, paiementRef: "offert" });
    await expect(salons.apercuInvitations(school, s.id)).rejects.toThrow();
    const ap = await salons.apercuInvitations(adminU, s.id);
    expect(ap.aInviter).toBeGreaterThanOrEqual(1);
    expect(ap.mineurs).toBeGreaterThanOrEqual(1);
    await expect(salons.inviter(school, s.id)).rejects.toThrow();
    const r = await salons.inviter(adminU, s.id);
    expect(r.envoyes).toBe(ap.aInviter);
    expect((await notif.listNotifications(student.id)).some((n) => n.link === `/salons/${s.id}/`)).toBe(true);
    expect((await notif.listNotifications(parent.id)).some((n) => n.link === `/salons/${s.id}/`)).toBe(true);
    expect((await salons.inviter(adminU, s.id)).envoyes).toBe(0); // une seule invitation par élève
    expect((await salons.apercuInvitations(adminU, s.id)).dejaInvites).toBe(ap.aInviter);
    await salons.annulerParEcole(adminU, s.id);
  });
  it("demande, validation, inscription avec accord du parent, salle, questions, bilan et fiches contact", async () => {
    const salons = await import("@/server/services/salons");
    expect(await salons.prixFiche(0)).toBe(117);
    expect(await salons.prixFiche(2)).toBe(183); // +25 % en cascade
    expect(await salons.prixFiche(4)).toBe(286);
    const debut = new Date(Date.now() + 5 * 86400e3).toISOString();
    await expect(salons.demander(landlord, "ma-esa-casa", { titre: "Salon pirate", debut })).rejects.toThrow();
    await expect(salons.demander(school, "ma-esa-casa", { titre: "Trop tôt pour valider", debut: new Date(Date.now() + 86400e3).toISOString() })).rejects.toThrow(/3 jours/);
    const s = await salons.demander(school, "ma-esa-casa", { titre: "Journée portes ouvertes en ligne", debut, dureeMin: 90, places: 50, ciblePays: ["SN"], criteres: [] });
    expect(s.statut).toBe("demande");
    await expect(salons.inscrire(student, s.id, { accordContact: true })).rejects.toThrow(); // pas encore publié
    await expect(salons.valider(school, s.id, { forfaitMad: 1000, paiementRef: "VIR-1" })).rejects.toThrow();
    await salons.valider(adminU, s.id, { forfaitMad: 1000, paiementRef: "VIR-1", naviAnnonce: true });
    expect((await salons.salonsPublics()).some((x) => x.id === s.id)).toBe(true);
    expect((await salons.salonsPourEleve(student)).some((x) => x.id === s.id)).toBe(true); // ciblé : Sénégal
    // L'élève mineure s'inscrit et accepte d'être recontactée : l'accord de son parent est demandé
    const r = await salons.inscrire(student, s.id, { accordContact: true }, { viaNavi: true });
    expect(r.accordParent).toBe("en_attente");
    expect((await notif.listNotifications(parent.id)).some((n) => n.link === "/parent/salons/")).toBe(true);
    expect((await salons.salonsPourEleve(student)).some((x) => x.id === s.id)).toBe(false); // déjà inscrite
    expect((await salons.mesSalons(student)).some((x) => x.id === s.id)).toBe(true);
    // Avant l'accord du parent : aucune fiche disponible
    expect((await salons.bilan(school, s.id)).fichesDisponibles).toBe(0);
    await expect(salons.repondreAccord(landlord, s.id, student.id, true)).rejects.toThrow();
    expect((await salons.accordsParent(parent)).find((x) => x.salonId === s.id)?.accordParent).toBe("en_attente");
    await salons.repondreAccord(parent, s.id, student.id, true);
    const b = await salons.bilan(school, s.id);
    expect(b.participants).toHaveLength(1);
    expect(b.participants[0]).toMatchObject({ viaNavi: true, accord: true, present: false });
    expect(b.fichesDisponibles).toBe(1);
    await expect(salons.bilan(landlord, s.id)).rejects.toThrow();
    // Salle : pas avant l'heure ; questions réservées aux inscrits et à l'école
    expect(await salons.rejoindre(student, s.id)).toMatchObject({ aVenir: true });
    await expect(salons.rejoindre(landlord, s.id)).rejects.toThrow();
    await salons.poserQuestion(student, s.id, { texte: "La bourse couvre-t-elle le logement ?" });
    await salons.poserQuestion(student, s.id, { main: true });
    const q = await salons.questions(school, s.id);
    expect(q.presentateur).toBe(true);
    expect(q.questions).toHaveLength(2);
    await expect(salons.marquerRepondue(student, s.id, q.questions[0].id)).rejects.toThrow();
    await salons.marquerRepondue(school, s.id, q.questions[0].id);
    await expect(salons.questions(landlord, s.id)).rejects.toThrow();
    // Fiches : commande, pas de téléchargement avant le règlement, puis CSV
    const f = await salons.commanderFiches(school, s.id);
    expect(f).toMatchObject({ prixUnitMad: 117, montantMad: 117, statut: "en_attente" });
    await expect(salons.commanderFiches(school, s.id)).rejects.toThrow(/Aucune nouvelle fiche/);
    await expect(salons.csvFiches(school, f.id)).rejects.toThrow(/règlement/);
    await expect(salons.payerFiches(school, f.id, "VIR-2")).rejects.toThrow();
    await salons.payerFiches(adminU, f.id, "VIR-2");
    expect(await salons.csvFiches(school, f.id)).toContain("awa@test.local");
    await expect(salons.csvFiches(landlord, f.id)).rejects.toThrow();
    // Accord retiré : l'élève sort du fichier téléchargé
    await salons.inscrire(student, s.id, { accordContact: false });
    expect(await salons.csvFiches(school, f.id)).not.toContain("awa@test.local");
    const ics = await salons.agendaIcs(student, s.id, "https://navigoal.net");
    expect(ics).toContain(`/salons/${s.id}/direct/`);
    await expect(salons.agendaIcs(landlord, s.id, "https://navigoal.net")).rejects.toThrow();
    expect((await salons.rappelsDuJour(new Date(new Date(debut).getTime() - 3 * 3600e3))).rappels).toBeGreaterThanOrEqual(2);
    expect((await salons.rappelsDuJour(new Date(new Date(debut).getTime() - 2 * 3600e3))).rappels).toBe(0);
  });
});
describe("Navi sur WhatsApp via Kapso", () => {
  it("choisit Kapso avec sa clé, vérifie X-Webhook-Signature et envoie par le relais de Kapso", async () => {
    const crypto = await import("node:crypto");
    const wa = await import("@/server/services/whatsapp");
    Object.assign(process.env, { KAPSO_API_KEY: "cle-kapso", KAPSO_WEBHOOK_SECRET: "secret-kapso", WHATSAPP_PHONE_ID: "647015955153740" });
    try {
      expect(wa.fournisseur()).toBe("kapso");
      expect(wa.whatsappActif()).toBe(true);
      const corps = '{"entry":[]}';
      const sig = crypto.createHmac("sha256", "secret-kapso").update(corps).digest("hex");
      expect(wa.signatureValide(corps, null, sig)).toBe(true);
      expect(wa.signatureValide(corps, null, sig.toUpperCase())).toBe(true);
      expect(wa.signatureValide(corps + " ", null, sig)).toBe(false);
      expect(wa.signatureValide(corps, null, "0".repeat(64))).toBe(false);
      expect(wa.signatureValide(corps, null, null)).toBe(false); // ni Kapso ni Meta configuré pour cette signature
      const appels: { url: string; entetes: Record<string, string>; corps: Record<string, unknown> }[] = [];
      const espion = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        appels.push({ url: String(url), entetes: init?.headers as Record<string, string>, corps: JSON.parse(String(init?.body)) });
        return new Response("{}", { status: 200 });
      });
      try {
        await wa.envoyer("24107000001", "Bonjour");
        expect(appels[0].url).toBe("https://api.kapso.ai/meta/whatsapp/v24.0/647015955153740/messages");
        expect(appels[0].entetes["X-API-Key"]).toBe("cle-kapso");
        expect(appels[0].entetes.Authorization).toBeUndefined();
        expect(appels[0].corps).toMatchObject({ messaging_product: "whatsapp", to: "24107000001", type: "text" });
      } finally { espion.mockRestore(); }
      process.env.WHATSAPP_FOURNISSEUR = "meta";
      expect(wa.fournisseur()).toBe("meta");
    } finally {
      for (const k of ["KAPSO_API_KEY", "KAPSO_WEBHOOK_SECRET", "WHATSAPP_PHONE_ID", "WHATSAPP_FOURNISSEUR"]) delete process.env[k];
    }
  });
});
describe("Navi sur WhatsApp (Meta simulé, faux modèle)", () => {
  it("vérifie le webhook et la signature, répond en texte WhatsApp, reconnaît un compte, garde le fil, ne traite qu'une fois", async () => {
    const crypto = await import("node:crypto");
    const wa = await import("@/server/services/whatsapp");
    Object.assign(process.env, { WHATSAPP_TOKEN: "jeton-test", WHATSAPP_PHONE_ID: "123", WHATSAPP_APP_SECRET: "secret-app", WHATSAPP_VERIFY_TOKEN: "phrase-verif", ANTHROPIC_API_KEY: "test", NAVI_SUIVI: "0", NAVI_CACHE: "0", NAVI_ROUTEUR: "0" });
    try {
      // Abonnement du webhook
      expect(wa.verifierAbonnement(new URLSearchParams("hub.mode=subscribe&hub.verify_token=phrase-verif&hub.challenge=42"))).toBe("42");
      expect(wa.verifierAbonnement(new URLSearchParams("hub.mode=subscribe&hub.verify_token=mauvaise&hub.challenge=42"))).toBeNull();
      // Signature
      const corps = '{"a":1}';
      const sig = "sha256=" + crypto.createHmac("sha256", "secret-app").update(corps).digest("hex");
      expect(wa.signatureValide(corps, sig)).toBe(true);
      expect(wa.signatureValide(corps + " ", sig)).toBe(false);
      expect(wa.signatureValide(corps, null)).toBe(false);
      // Mise en forme
      expect(wa.versWhatsapp("**ESA** : voir [la fiche](/etablissements/ma-esa-casa/)")).toBe("*ESA* : voir la fiche : https://navigoal.net/etablissements/ma-esa-casa/");

      // Messages envoyés à Meta, capturés
      const envois: Record<string, unknown>[] = [];
      const vrai = globalThis.fetch;
      const espion = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        if (!String(url).startsWith("https://graph.facebook.com/")) return vrai(url as RequestInfo, init);
        envois.push(JSON.parse(String(init?.body)));
        return new Response("{}", { status: 200 });
      });
      // Faux modèle : un tour de texte
      const vus: { messages: { role: string }[] }[] = [];
      const client = { beta: { messages: {
        create: async () => ({ model: "claude-haiku-5-5", stop_reason: "end_turn", usage: {}, content: [{ type: "text", text: "" }] }),
        stream: (p: { messages: { role: string }[] }) => { vus.push(p); const h: Record<string, ((x: unknown) => void)[]> = {}; const texte = "Bonjour ! Regarde **la fiche** : [ESA](/etablissements/ma-esa-casa/)";
          return { on(e: string, cb: (x: unknown) => void) { (h[e] ??= []).push(cb); return this; }, finalMessage: () => new Promise((r) => setTimeout(() => { h.text?.forEach((f) => f(texte)); r({ model: "claude-sonnet-5-5", stop_reason: "end_turn", usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: texte }] }); }, 0)) }; } } },
      } as unknown as import("@anthropic-ai/sdk").default;

      // L'élève Awa a un téléphone vérifié : on le reconnaît par son numéro WhatsApp
      const num = "221779990001";
      await db.update(schema.users).set({ phone: `+${num}`, phoneVerifiedAt: new Date() }).where(eq(schema.users.id, student.id));
      const notif1 = { entry: [{ changes: [{ value: { contacts: [{ wa_id: num, profile: { name: "Awa" } }], messages: [{ id: "wamid.A1", from: num, type: "text", text: { body: "Je veux devenir infirmière" } }] } }] }] };
      await wa.traiterNotification(notif1, { client });
      const textes = envois.filter((x) => x.type === "text").map((x) => (x.text as { body: string }).body);
      expect(textes.at(-1)).toContain("*la fiche*");
      expect(textes.at(-1)).toContain("https://navigoal.net/etablissements/ma-esa-casa/");
      expect(envois.some((x) => x.status === "read")).toBe(true);
      const fil = await db.select().from(schema.whatsappMessages).where(eq(schema.whatsappMessages.numero, num));
      expect(fil.map((x) => x.role)).toEqual(["user", "assistant"]);
      expect(fil[0].userId).toBe(student.id);
      const trace = (await db.select().from(schema.naviTraces).where(eq(schema.naviTraces.question, "Je veux devenir infirmière")))[0];
      expect(trace.page).toBe("/whatsapp/");
      expect(trace.userId).toBe(student.id);

      // Même notification renvoyée par Meta : ignorée ; message suivant : l'historique est transmis au modèle
      const n = envois.length;
      await wa.traiterNotification(notif1, { client });
      expect(envois.length).toBe(n);
      await wa.traiterMessage({ id: "wamid.A2", from: num, type: "text", text: { body: "Je veux parler à un conseiller" } }, "Awa", { client });
      expect(vus.at(-1)!.messages.length).toBeGreaterThanOrEqual(3);
      expect((await notif.listNotifications(adminU.id)).some((x) => x.kind === "whatsapp" && x.title.includes("conseiller"))).toBe(true);

      // Message vocal : réponse polie, sans appel au modèle
      const appels = vus.length;
      await wa.traiterMessage({ id: "wamid.A3", from: "24177000000", type: "audio" }, null, { client });
      expect(vus.length).toBe(appels);
      expect((envois.at(-1)!.text as { body: string }).body).toMatch(/messages écrits/);
      espion.mockRestore();
    } finally {
      for (const k of ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN", "ANTHROPIC_API_KEY", "NAVI_SUIVI", "NAVI_CACHE", "NAVI_ROUTEUR"]) delete process.env[k];
    }
  });
});

describe("chantiers de novembre 2026 : scolarité, avis, témoignages, bourses", () => {
  const scol = () => import("@/server/services/scolarite");
  const avisE = () => import("@/server/services/avis-ecoles");
  const avisS = () => import("@/server/services/avis-service");
  it("paiement direct à l'école : moyen vérifié, échéancier, preuve, confirmation = inscription", async () => {
    const s = await scol();
    const [app] = await db.select().from(schema.applications).where(and(eq(schema.applications.studentId, student.id), eq(schema.applications.status, "acceptee")));
    expect(app).toBeTruthy();
    const m = await s.enregistrerMoyen(school, app.establishmentId, { type: "virement", libelle: "Virement bancaire", details: "RIB 000 111 222 333", devise: "MAD" });
    expect(m.statut).toBe("a_verifier");
    await s.definirEcheancier(school, app.id, { devise: "MAD", lignes: [{ libelle: "Frais d'inscription", montant: 5000, echeance: "2027-08-31" }, { libelle: "Scolarité — 1re tranche", montant: 30000, echeance: "2027-09-30" }] });
    let v = (await s.pourFamille(student, app.id))!;
    expect(v.moyens).toHaveLength(0); // pas encore vérifié : rien d'affiché
    const preuve = await docs.uploadDocument(student, "autre", { name: "recu.pdf", bytes: PDF, label: "Preuve de paiement" });
    await expect(s.declarer(student, app.id, { ligneId: v.lignes[0].id, montant: 5000, moyenId: m.id, preuveId: preuve.id })).rejects.toThrow(/non vérifié/);
    // Refus sans motif interdit ; motif conservé puis effacé quand l'école corrige
    await expect(s.verifierMoyen(adminU, m.id, { statut: "refuse" })).rejects.toThrow(/motif/);
    await s.verifierMoyen(adminU, m.id, { statut: "refuse", motif: "RIB au nom d'une personne" });
    expect((await s.moyensEcole(school, app.establishmentId)).find((x) => x.id === m.id)?.motifRefus).toBe("RIB au nom d'une personne");
    await s.enregistrerMoyen(school, app.establishmentId, { type: "virement", libelle: "Virement bancaire", details: "RIB 000 111 222 333", devise: "MAD" }, m.id);
    const corrige = (await s.moyensEcole(school, app.establishmentId)).find((x) => x.id === m.id)!;
    expect(corrige.statut).toBe("a_verifier");
    expect(corrige.motifRefus).toBeNull();
    await s.verifierMoyen(adminU, m.id, { statut: "verifie" });
    v = (await s.pourFamille(student, app.id))!;
    expect(v.moyens).toHaveLength(1);
    const p = await s.declarer(student, app.id, { ligneId: v.lignes[0].id, montant: 5000, moyenId: m.id, reference: "VIR-1", preuveId: preuve.id });
    // L'école lit la preuve ; un autre compte non
    expect((await docs.readDocument(school, preuve.id)).doc.id).toBe(preuve.id);
    await expect(docs.readDocument(landlord, preuve.id)).rejects.toThrow();
    // Montant d'une échéance payée figé
    await expect(s.definirEcheancier(school, app.id, { devise: "MAD", lignes: [{ id: v.lignes[0].id, libelle: "Frais d'inscription", montant: 6000, echeance: "2027-08-31" }] })).rejects.toThrow(/montant/);
    await s.confirmer(school, p.id, { statut: "confirme" });
    v = (await s.pourFamille(student, app.id))!;
    expect(v.inscriptionConfirmee).toBeTruthy();
    expect(v.lignes[0].etat).toBe("payee");
    expect(v.paye).toBe(5000);
    await expect(s.pourFamille(landlord, app.id)).rejects.toThrow();
  });
  it("avis vérifié : inscription confirmée → relecture → publication ; l'école répond, réponse relue", async () => {
    const a = await avisE();
    const elig = await a.eligibilite(student);
    expect(elig.ecoles[0].inscriptionConfirmee).toBe(true);
    const texte = "Des enseignants disponibles, des cours concrets et un bon accompagnement pour les stages en entreprise.";
    const avis = await a.deposer(student, { etablissementId: elig.ecoles[0].etablissementId, applicationId: elig.ecoles[0].applicationId, notes: { enseignement: 5, encadrement: 4, accueil: 4, campus: 3, insertion: 4, prix: 3 }, recommande: true, pointsForts: texte, pointsFaibles: texte, affichage: "prenom" });
    expect(avis.verification).toBe("navigoal");
    expect((await a.publics(avis.etablissementId)).nombre).toBe(0);
    await a.moderer(adminU, avis.id, { statut: "publie" });
    const pub = await a.publics(avis.etablissementId);
    expect(pub.nombre).toBe(1);
    expect(pub.stats).toBeNull(); // note affichée dès 3 avis
    expect(pub.avis[0].nom).toBe("Awa N.");
    await a.repondre(school, avis.id, { texte: "Merci Awa pour ce retour, nous renforçons le matériel." });
    expect((await a.publics(avis.etablissementId)).avis[0].reponse).toBeNull();
    await a.modererReponse(adminU, avis.id, { statut: "publie" });
    expect((await a.publics(avis.etablissementId)).avis[0].reponse?.texte).toMatch(/Merci/);
    await expect(a.moderer(school, avis.id, { statut: "retire", motif: "x" }).then(() => { throw new Error("l'école ne doit pas retirer"); })).rejects.toThrow();
  });
  it("note du service et témoignage : publié seulement après relecture et accord", async () => {
    const s = await avisS();
    const r = await s.enregistrer(parent, { note: 5, temoignage: "Navigoal nous a aidés à comparer les écoles et le budget en F CFA.", publier: true, affichage: "anonyme" });
    expect(r.statut).toBe("en_attente");
    await s.moderer(adminU, r.id, { statut: "publie" });
    const liste = await s.listeAdmin("publie");
    expect(liste.lignes.some((l) => l.id === r.id)).toBe(true);
  });
  it("bourses : suivi réservé aux familles", async () => {
    const b = await import("@/server/services/bourses");
    await b.suivre(student, "ga-anbg", true);
    expect(await b.suivies(student.id)).toContain("ga-anbg");
    await expect(b.suivre(school, "ga-anbg", true)).rejects.toThrow();
    const moi = await b.pourMoi(student);
    expect(moi.profils[0].bourses.find((x) => x.id === "ga-anbg")?.statut).toBe("non_eligible"); // Sénégalaise
  });
});

describe("rappels de paiement (loyer, scolarité)", async () => {
  const rp = await import("@/server/services/rappels-paiement");
  it("un parent programme le loyer de son enfant, prévenu une seule fois X jours avant puis le jour même", async () => {
    const r = await rp.creer(parent, { type: "loyer", libelle: "Loyer du studio", enfantId: student.id, montant: 3500, devise: "MAD", frequence: "mensuel", premiereEcheance: "2026-09-05", delaiJours: 3, aussiLeJour: true });
    const mes = await rp.mesRappels(parent);
    expect(mes.rappels.find((x) => x.id === r.id)?.prochaine?.date).toMatch(/^\d{4}-\d{2}-05$/);
    const avant = (await rp.envoyerRappels(new Date("2030-03-02T08:00:00Z"))).envoyes;
    expect(avant).toBe(1);
    expect((await rp.envoyerRappels(new Date("2030-03-03T08:00:00Z"))).envoyes).toBe(0); // déjà prévenu pour le 5 mars
    expect((await rp.envoyerRappels(new Date("2030-03-05T08:00:00Z"))).envoyes).toBe(1); // le jour même
    const n = (await notif.listNotifications(parent.id)).filter((x) => x.kind === "rappel_paiement");
    expect(n[0].title).toMatch(/Loyer du studio \(\w+\) à régler/);
  });
  it("délai limité à 2, 3, 5 ou 7 jours ; pas de rappel pour l'enfant d'un autre", async () => {
    await expect(rp.creer(parent, { type: "loyer", libelle: "Loyer", premiereEcheance: "2026-12-01", delaiJours: 4 })).rejects.toThrow();
    await expect(rp.creer(landlord, { type: "loyer", libelle: "Loyer", premiereEcheance: "2026-12-01", delaiJours: 3 })).rejects.toThrow();
    const autre = await accounts.register({ role: "parent", firstName: "Awa", lastName: "Diop", email: "awa.rappel@test.local", password: "Motdepasse1", country: "SN", acceptTerms: true });
    await expect(rp.creer(autre, { type: "loyer", libelle: "Loyer", enfantId: student.id, premiereEcheance: "2026-12-01", delaiJours: 3 })).rejects.toThrow();
    const [r] = (await rp.mesRappels(parent)).rappels;
    await expect(rp.modifier(autre, r.id, { delaiJours: 7 })).rejects.toThrow();
    expect((await rp.modifier(parent, r.id, { delaiJours: 7 })).delaiJours).toBe(7);
  });
});

describe("réactivité des écoles : requêtes", async () => {
  const rea = await import("@/server/services/reactivite");
  it("liste des candidatures sans réponse (toutes écoles et une école) sans erreur SQL", async () => {
    expect(Array.isArray(await rea.sansReponse())).toBe(true);
    expect(Array.isArray(await rea.sansReponse("ma-esa-casa"))).toBe(true);
  });
});

describe("cachet numérique des devis", () => {
  it("le serveur recalcule et enregistre le devis ; la vérification relit ce qui a été émis", async () => {
    const c = await import("@/server/services/cachets-devis");
    const { etabById } = await import("@/lib/data");
    const { devis } = await import("@/lib/devis");
    const e = etabById["ma-esa-casa"];
    const fid = e.formations[0];
    await expect(c.creerCachet({ eid: "ma-esa-casa", fid: "formation-inconnue" }, "1.2.3.4")).rejects.toThrow();
    const r = await c.creerCachet({ eid: "ma-esa-casa", fid, origine: "GA", logement: "studio", eleve: "Awa Ndiaye", payeur: "M. Ndiaye", exclus: ["ordinateur"] }, "1.2.3.4");
    expect(r.id).toMatch(/^[A-Za-z0-9_-]{20}$/);
    expect(r.chemin).toBe(`/verifier/devis/${r.id}/`);
    const lu = (await c.lireCachet(r.id))!;
    expect(lu).toMatchObject({ numero: r.numero, empreinte: r.empreinte, eleve: "Awa Ndiaye" });
    expect(lu.resume.total).toEqual(devis("ma-esa-casa", fid, "GA", "studio", undefined, ["ordinateur"]).total);
    expect(await c.lireCachet("x' or 1=1")).toBeNull();
    expect(await c.lireCachet("A".repeat(20))).toBeNull();
  });
});
