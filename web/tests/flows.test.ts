import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

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
  student = await accounts.register({ role: "etudiant", firstName: "Awa", lastName: "Ndiaye", email: "awa@test.local", password: "Motdepasse1", birthYear: year - 17, country: "SN", city: "Dakar", acceptTerms: true });
  parent = await accounts.register({ role: "parent", firstName: "Moussa", lastName: "Ndiaye", phone: "+221770000001", password: "Motdepasse1", country: "SN", acceptTerms: true });
  school = await accounts.register({ role: "etablissement", firstName: "Nadia", lastName: "Kane", email: "ecole@test.local", password: "Motdepasse1", establishmentId: "sn-ism", acceptTerms: true });
  landlord = await accounts.register({ role: "bailleur", firstName: "Ibou", lastName: "Fall", email: "bailleur@test.local", password: "Motdepasse1", country: "SN", acceptTerms: true });
  adminU = (await accounts.findByIdentifier("admin@test.local"))!;
});

describe("comptes", () => {
  it("refuse les doublons et les mots de passe faibles", async () => {
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
    await expect(etab.upsertProgram(school, "sn-ism", { formationId: "frm-licence-gestion", title: "Licence" })).rejects.toThrow(/refusé/);
    await admin.setUserStatus(adminU, school.id, "actif");
    school = await reload(school.id);
    expect(school.status).toBe("actif");
  });
});

describe("candidature", () => {
  let appId = "", programId = "";
  it("l'école publie une formation avec frais de dossier", async () => {
    const p = await etab.upsertProgram(school, "sn-ism", { formationId: "frm-licence-gestion", title: "Licence en gestion (ISM)", tuitionMin: 1_200_000, tuitionMax: 1_500_000, currency: "XOF", applicationFee: 25_000, requiredDocuments: ["identite", "releve_notes"] });
    programId = p.id;
    expect(p.indicative).toBe(false);
  });
  it("un mineur ne peut pas envoyer sans consentement parental", async () => {
    const a = await apps.createDraft(student, programId);
    appId = a.id;
    await expect(apps.submitApplication(student, appId, { method: "wave" })).rejects.toThrow(/consentement/);
    const g = await guardians.inviteGuardian(student, "+221770000001");
    await guardians.acceptGuardianInvite(parent, g.inviteCode!, true);
    expect(await guardians.isGuardianOf(parent.id, student.id)).toBe(true);
  });
  it("pièces manquantes puis envoi avec paiement bac à sable", async () => {
    await expect(apps.submitApplication(student, appId, { method: "wave" })).rejects.toThrow(/Pièces manquantes/);
    await expect(docs.uploadDocument(student, "identite", { name: "x.exe", bytes: new Uint8Array([1, 2, 3, 4]) })).rejects.toThrow(/Format/);
    const d1 = await docs.uploadDocument(student, "identite", { name: "cni.pdf", bytes: PDF });
    const d2 = await docs.uploadDocument(student, "releve_notes", { name: "notes.png", bytes: PNG });
    await apps.updateDraft(student, appId, { motivation: "Je veux devenir manager.", documentIds: [d1.id, d2.id] });
    const r = await apps.submitApplication(student, appId, { method: "wave", payerId: parent.id });
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
    const list = await apps.listForEstablishment(school, "sn-ism");
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
    const h = await housing.saveHousing(landlord, { title: "Studio Point E", type: "studio", description: "Studio meublé de 25 m² proche de l'ISM, eau et électricité incluses, gardien.", pays: "SN", ville: "Dakar", quartier: "Point E", address: "12 rue secrète", rent: 150000, charges: 10000, deposit: 150000, amenities: ["wifi", "eau"], nearEstablishments: [{ id: "sn-ism", minutes: 10, mode: "pied" }] });
    hid = h.id;
    expect(h.currency).toBe("XOF");
    await expect(housing.submitForModeration(landlord, hid)).rejects.toThrow(/3 photos/);
    for (let i = 0; i < 3; i++) await housing.addHousingPhoto(landlord, hid, { bytes: PNG });
    await housing.submitForModeration(landlord, hid);
    expect(await housing.searchHousings({ pays: "SN" })).toHaveLength(0);
    await housing.moderateHousing(adminU, hid, { approve: true });
    const res = await housing.searchHousings({ etablissement: "sn-ism", budgetMax: 200000 });
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
    expect(b.serviceFee).toBe(7500);
    const conv = (await msg.listConversations(landlord.id))[0];
    expect((await msg.getConversation(landlord.id, conv.id)).messages[0].m.body).toContain("[coordonnée masquée]");
    expect(await book.respond(landlord, bid, true)).toBe("attente_garant");
    await expect(book.payBooking(student, bid, "wave")).rejects.toThrow(/garant/);
    await book.approveAsGuarantor(parent, bid);
    expect((await book.getBooking(student, bid)).revealed).toBe(false);
  });
  it("paiement en séquestre → contrat → entrée → fonds versés → loyer → avis", async () => {
    const r = await book.payBooking(parent, bid, "orange_money");
    expect(r.payment.amount).toBe(150000 + 10000 + 150000 + 7500);
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
    const rent = await book.payRent(student, bid, "wave", `${year + 1}-10`);
    await pay.sandboxConfirm(student, rent.payment.reference, true);
    await expect(book.payRent(student, bid, "wave", `${year + 1}-10`)).rejects.toThrow(/déjà payé/);
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
