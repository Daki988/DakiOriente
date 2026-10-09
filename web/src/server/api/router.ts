// API REST Navigoal (/api/...). Une table de routes unique sert au routage et à la documentation OpenAPI.
import { schema } from "../db";
import { clearSessionCookie, createSession, currentUser, destroySession, setSessionCookie, SESSION_COOKIE, type Role } from "../auth/session";
import { AppError, forbidden, unauthorized } from "../lib/errors";
import { getFile } from "../lib/storage";
import { errorResponse, file, json } from "./http";
import * as accounts from "../services/accounts";
import * as guardians from "../services/guardians";
import * as docs from "../services/documents";
import * as apps from "../services/applications";
import * as etab from "../services/establishments";
import * as pay from "../services/payments";
import * as notif from "../services/notifications";
import * as msg from "../services/messaging";
import * as orient from "../services/orientation";
import * as housing from "../services/housing";
import * as book from "../services/bookings";
import * as admin from "../services/admin";
import * as counsel from "../services/counselor";
import { globalSearch } from "../services/search";
import { schoolDashboard } from "../services/school-stats";
import { applicationPdf, admissionPdf } from "../services/pdf";
import { METHODS } from "../payments/providers";
import { cookies } from "next/headers";

type User = typeof schema.users.$inferSelect;
type Ctx = { req: Request; params: Record<string, string>; query: URLSearchParams; user: User | null; body: () => Promise<any> };
// `me` n'est garanti que pour les routes authentifiées ; les routes publiques utilisent `user` (éventuellement null).
type Handler = (c: Ctx & { me: User }) => Promise<Response | unknown>;
export type RouteDef = { method: string; path: string; summary: string; tag: string; auth: Role[] | "user" | "public"; handler: Handler };

const R: RouteDef[] = [];
const route = (method: string, path: string, tag: string, summary: string, auth: RouteDef["auth"], handler: Handler) => R.push({ method, path, tag, summary, auth, handler });
const STUDENT: Role[] = ["eleve", "etudiant"];
const ok = { ok: true };

async function startSession(u: User, req: Request) {
  const s = await createSession(u.id, req.headers.get("user-agent"));
  await setSessionCookie(s.token, s.expiresAt);
  return { user: await accounts.getMe(u.id), token: s.token, expiresAt: s.expiresAt };
}

// ---------------------------------------------------------------- Authentification
route("POST", "/auth/inscription", "Authentification", "Créer un compte (élève, étudiant, parent, établissement, bailleur)", "public", async ({ req, body }) => {
  const u = await accounts.register(await body());
  return json({ ...(await startSession(u, req)) }, 201);
});
route("POST", "/auth/connexion", "Authentification", "Connexion par e-mail ou téléphone + mot de passe", "public", async ({ req, body }) => {
  const b = await body();
  return startSession(await accounts.login(String(b.identifiant ?? ""), String(b.motDePasse ?? "")), req);
});
route("POST", "/auth/code", "Authentification", "Recevoir un code OTP (connexion, vérification, mot de passe oublié)", "public", async ({ body }) => {
  const b = await body();
  const purpose = ["login", "verify_phone", "verify_email", "reset_password"].includes(b.objet) ? b.objet : "login";
  if (purpose === "login" || purpose === "reset_password") { if (!(await accounts.findByIdentifier(String(b.cible ?? "")))) return { ok: true }; } // pas d'énumération de comptes
  const r = await accounts.requestOtp(String(b.cible ?? ""), purpose);
  return { ok: true, devCode: r.devCode };
});
route("POST", "/auth/code/verifier", "Authentification", "Vérifier un e-mail ou un téléphone avec le code reçu", "public", async ({ body }) => {
  const b = await body();
  await accounts.verifyOtp(String(b.cible), b.objet === "verify_phone" ? "verify_phone" : "verify_email", String(b.code));
  return ok;
});
route("POST", "/auth/code/connexion", "Authentification", "Connexion par code OTP (SMS/e-mail)", "public", async ({ req, body }) => {
  const b = await body();
  return startSession(await accounts.loginWithOtp(String(b.cible), String(b.code)), req);
});
route("POST", "/auth/mot-de-passe/reinitialiser", "Authentification", "Réinitialiser le mot de passe avec un code", "public", async ({ body }) => {
  const b = await body();
  await accounts.resetPassword(String(b.cible), String(b.code), String(b.motDePasse));
  return ok;
});
route("POST", "/auth/deconnexion", "Authentification", "Se déconnecter", "public", async ({ req }) => {
  const t = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || cookies().get(SESSION_COOKIE)?.value;
  if (t) await destroySession(t);
  clearSessionCookie();
  return ok;
});

// ---------------------------------------------------------------- Compte et profil
route("GET", "/session", "Compte", "Session courante (utilisateur ou null), sans erreur si déconnecté", "public", async ({ user }) => ({ user: user ? { firstName: user.firstName, role: user.role } : null }));
route("GET", "/moi", "Compte", "Utilisateur connecté et profil", "user", async ({ me }) => accounts.getMe(me.id));
route("PATCH", "/moi", "Compte", "Mettre à jour le profil", "user", async ({ me, body }) => accounts.updateProfile(me.id, await body()));
route("POST", "/moi/mot-de-passe", "Compte", "Changer de mot de passe", "user", async ({ me, body }) => { const b = await body(); await accounts.changePassword(me.id, b.actuel, b.nouveau); return ok; });
route("GET", "/moi/tuteurs", "Compte", "Parents/tuteurs liés", STUDENT, async ({ me }) => guardians.guardiansOf(me.id));
route("POST", "/moi/tuteurs", "Compte", "Inviter un parent ou tuteur", STUDENT, async ({ me, body }) => { const b = await body(); const g = await guardians.inviteGuardian(me, String(b.contact), b.relation); return { id: g.id, devCode: process.env.NODE_ENV !== "production" ? g.inviteCode : undefined }; });
route("GET", "/parent/enfants", "Parent", "Enfants suivis", ["parent"], async ({ me }) => (await guardians.childrenOf(me.id)).map(({ link, child }) => ({ link, child: { id: child.id, firstName: child.firstName, lastName: child.lastName, birthYear: child.birthYear, country: child.country, city: child.city } })));
route("POST", "/parent/enfants", "Parent", "Lier un enfant avec son code d'invitation (+ consentement)", ["parent"], async ({ me, body }) => { const b = await body(); return { childId: await guardians.acceptGuardianInvite(me, String(b.code), !!b.consentement) }; });
route("POST", "/parent/enfants/:id/consentement", "Parent", "Donner ou retirer le consentement parental", ["parent"], async ({ me, params, body }) => { await guardians.setConsent(me, params.id, !!(await body()).consentement); return ok; });
route("GET", "/parent/enfants/:id/candidatures", "Parent", "Candidatures d'un enfant", ["parent"], async ({ me, params }) => { if (!(await guardians.isGuardianOf(me.id, params.id))) throw forbidden(); return apps.listForStudent(params.id); });

// ---------------------------------------------------------------- Documents
route("GET", "/documents", "Documents", "Mes documents", "user", async ({ me }) => docs.listDocuments(me.id));
route("POST", "/documents", "Documents", "Déposer un document (multipart : fichier, type, libelle)", "user", async ({ me, req }) => {
  const fd = await req.formData();
  const f = fd.get("fichier");
  if (!(f instanceof File)) throw new AppError("Fichier manquant.");
  return json(await docs.uploadDocument(me, String(fd.get("type") ?? "autre") as never, { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), label: fd.get("libelle")?.toString() }), 201);
});
route("GET", "/documents/:id/fichier", "Documents", "Télécharger un document (contrôle d'accès)", "user", async ({ me, params }) => { const d = await docs.readDocument(me, params.id); return file(d.data, d.contentType, d.doc.fileName); });
route("DELETE", "/documents/:id", "Documents", "Supprimer un document", "user", async ({ me, params }) => { await docs.removeDocument(me, params.id); return ok; });

// ---------------------------------------------------------------- Orientation
route("POST", "/orientation/resultats", "Orientation", "Enregistrer un résultat de test RIASEC", "user", async ({ me, body }) => { const b = await body(); return orient.saveResult(me.id, b.answers, b.scores, b.top); });
route("GET", "/orientation/resultats", "Orientation", "Historique des tests", "user", async ({ me }) => orient.history(me.id));
route("GET", "/recommandations", "Orientation", "Recommandations métiers, formations, offres", "user", async ({ me }) => orient.recommend(me.id));

// ---------------------------------------------------------------- Catalogue public
route("GET", "/recherche", "Catalogue", "Recherche globale (métiers, formations, établissements, articles, logements)", "public", async ({ query }) => globalSearch(query.get("q") ?? ""));
route("GET", "/etablissements", "Catalogue", "Établissements (filtres pays, q)", "public", async ({ query }) => etab.searchEstablishments({ pays: query.get("pays") ?? undefined, text: query.get("q") ?? undefined }));
route("GET", "/etablissements/:id", "Catalogue", "Fiche établissement", "public", async ({ params }) => etab.getEstablishment(params.id));
route("GET", "/etablissements/:id/formations", "Catalogue", "Formations publiées d'un établissement", "public", async ({ params }) => etab.listPrograms(params.id));
route("GET", "/formations-offres/:id", "Catalogue", "Détail d'une formation publiée", "public", async ({ params }) => etab.getProgram(params.id));
route("GET", "/campagnes", "Catalogue", "Campagnes en cours (admissions, concours, bourses…)", "public", async ({ query }) => etab.listCampaigns({ establishmentId: query.get("etablissement") ?? undefined, publishedOnly: true, current: true }));
route("GET", "/articles", "Contenus", "Articles publiés", "public", async () => admin.listArticles(true));
route("GET", "/articles/:slug", "Contenus", "Article", "public", async ({ params }) => admin.getArticle(params.slug));
route("GET", "/paiements/moyens", "Paiements", "Moyens de paiement par pays", "public", async () => METHODS);

// ---------------------------------------------------------------- Candidatures (étudiant)
route("GET", "/candidatures", "Candidatures", "Mes candidatures", STUDENT, async ({ me }) => apps.listForStudent(me.id));
route("POST", "/candidatures", "Candidatures", "Commencer une candidature (brouillon)", STUDENT, async ({ me, body }) => json(await apps.createDraft(me, String((await body()).programId)), 201));
route("GET", "/candidatures/:id", "Candidatures", "Détail d'une candidature", "user", async ({ me, params }) => apps.getApplication(me, params.id));
route("PATCH", "/candidatures/:id", "Candidatures", "Compléter le dossier (motivation, réponses, pièces)", STUDENT, async ({ me, params, body }) => apps.updateDraft(me, params.id, await body()));
route("POST", "/candidatures/:id/envoyer", "Candidatures", "Envoyer la candidature (+ paiement des frais)", STUDENT, async ({ me, params, body }) => { const b = await body().catch(() => ({})); return apps.submitApplication(me, params.id, b.moyen ? { method: b.moyen, payerId: b.payeur } : undefined); });
route("POST", "/candidatures/:id/desister", "Candidatures", "Se désister", STUDENT, async ({ me, params }) => { await apps.withdraw(me, params.id); return ok; });
route("GET", "/candidatures/:id/bordereau.pdf", "Candidatures", "Bordereau de candidature (PDF)", "user", async ({ me, params }) => {
  const d = await apps.getApplication(me, params.id);
  if (!d.application.submittedAt) throw new AppError("Bordereau disponible après l'envoi.");
  const bytes = await applicationPdf({ number: d.application.number, student: `${d.student.firstName} ${d.student.lastName}`, program: d.program.title, establishment: d.establishment.nom, submittedAt: d.application.submittedAt, documents: d.documents.map((x) => docs.DOC_LABEL[x.type]), status: apps.STATUS_LABEL[d.application.status], fee: d.program.applicationFee ? `${d.program.applicationFee} ${d.program.currency ?? ""}` : undefined });
  return file(bytes, "application/pdf", `bordereau-${d.application.number}.pdf`);
});
route("GET", "/candidatures/:id/attestation.pdf", "Candidatures", "Attestation d'admission (PDF)", "user", async ({ me, params }) => {
  const d = await apps.getApplication(me, params.id);
  if (d.application.status !== "acceptee") throw new AppError("Attestation disponible après l'admission.");
  return file(await admissionPdf({ number: d.application.number, student: `${d.student.firstName} ${d.student.lastName}`, program: d.program.title, establishment: d.establishment.nom, city: d.establishment.ville, decidedAt: d.application.decidedAt ?? new Date() }), "application/pdf", `attestation-${d.application.number}.pdf`);
});

// ---------------------------------------------------------------- Espace établissement
route("GET", "/ecole", "Établissement", "Mes établissements", ["etablissement"], async ({ me }) => etab.myEstablishments(me.id));
route("PATCH", "/ecole/:eid", "Établissement", "Mettre à jour la fiche", ["etablissement", "admin"], async ({ me, params, body }) => etab.updateEstablishment(me, params.eid, await body()));
route("GET", "/ecole/:eid/tableau-de-bord", "Établissement", "Indicateurs", ["etablissement", "admin"], async ({ me, params }) => schoolDashboard(me, params.eid));
route("GET", "/ecole/:eid/formations", "Établissement", "Formations (y compris inactives)", ["etablissement", "admin"], async ({ me, params }) => { await etab.assertMember(me, params.eid); return etab.listPrograms(params.eid, false); });
route("POST", "/ecole/:eid/formations", "Établissement", "Publier une formation", ["etablissement", "admin"], async ({ me, params, body }) => json(await etab.upsertProgram(me, params.eid, await body()), 201));
route("PATCH", "/ecole/:eid/formations/:pid", "Établissement", "Modifier une formation", ["etablissement", "admin"], async ({ me, params, body }) => etab.upsertProgram(me, params.eid, await body(), params.pid));
route("GET", "/ecole/:eid/campagnes", "Établissement", "Campagnes", ["etablissement", "admin"], async ({ me, params }) => { await etab.assertMember(me, params.eid); return etab.listCampaigns({ establishmentId: params.eid }); });
route("POST", "/ecole/:eid/campagnes", "Établissement", "Créer une campagne", ["etablissement", "admin"], async ({ me, params, body }) => json(await etab.upsertCampaign(me, params.eid, await body()), 201));
route("PATCH", "/ecole/:eid/campagnes/:cid", "Établissement", "Modifier une campagne", ["etablissement", "admin"], async ({ me, params, body }) => etab.upsertCampaign(me, params.eid, await body(), params.cid));
route("GET", "/ecole/:eid/candidatures", "Établissement", "Candidatures reçues (filtres statut, formation, pays, q ; format=csv)", ["etablissement", "admin"], async ({ me, params, query }) => {
  const rows = await apps.listForEstablishment(me, params.eid, { status: (query.get("statut") as never) ?? undefined, programId: query.get("formation") ?? undefined, pays: query.get("pays") ?? undefined, q: query.get("q") ?? undefined });
  if (query.get("format") === "csv") return new Response("\ufeff" + apps.toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="candidatures-${params.eid}.csv"` } });
  return rows;
});
route("POST", "/ecole/candidatures/:id/statut", "Établissement", "Changer le statut / demander une pièce / décider", ["etablissement", "admin"], async ({ me, params, body }) => { await apps.changeStatus(me, params.id, await body()); return ok; });

// ---------------------------------------------------------------- Paiements
route("GET", "/paiements", "Paiements", "Mes paiements (et ceux de mes enfants)", "user", async ({ me }) => pay.listPaymentsFor(me));
route("GET", "/paiements/:ref", "Paiements", "Statut d'un paiement", "user", async ({ me, params }) => { await pay.getPayment(me, params.ref); return pay.syncPayment(params.ref); });
route("POST", "/paiements/:ref/simulation", "Paiements", "Bac à sable : confirmer ou refuser un paiement simulé", "user", async ({ me, params, body }) => pay.sandboxConfirm(me, params.ref, !!(await body()).succes));
route("GET", "/paiements/:ref/recu.pdf", "Paiements", "Reçu de paiement (PDF)", "user", async ({ me, params }) => file(await pay.receipt(me, params.ref), "application/pdf", `recu-${params.ref}.pdf`));
route("POST", "/paiements/webhook/:provider", "Paiements", "Notification de l'agrégateur (webhook)", "public", async ({ req, params }) => {
  const raw = await req.text();
  const ref = new URLSearchParams(raw).get("cpm_trans_id") ?? (() => { try { return JSON.parse(raw).transaction_id; } catch { return null; } })();
  if (!ref || params.provider !== "cinetpay") throw new AppError("Notification invalide.");
  await pay.syncPayment(ref); // le statut est revérifié auprès de l'agrégateur : le corps reçu n'est pas cru sur parole
  return ok;
});

// ---------------------------------------------------------------- Messagerie et notifications
route("GET", "/conversations", "Messagerie", "Mes conversations", "user", async ({ me }) => msg.listConversations(me.id));
route("GET", "/conversations/:id", "Messagerie", "Fil de discussion", "user", async ({ me, params }) => msg.getConversation(me.id, params.id));
route("POST", "/conversations/:id/messages", "Messagerie", "Envoyer un message", "user", async ({ me, params, body }) => json(await msg.sendMessage(me, params.id, String((await body()).texte ?? "")), 201));
route("POST", "/conversations", "Messagerie", "Contacter un établissement à propos d'une candidature", STUDENT, async ({ me, body }) => {
  const b = await body();
  const d = await apps.getApplication(me, String(b.candidature));
  const members = await etab.myMembersOf(d.establishment.id);
  const c = await msg.findOrCreateConversation(`Candidature ${d.application.number} · ${d.program.title}`, [me.id, ...members], { kind: "application", id: d.application.id });
  if (b.texte) await msg.sendMessage(me, c.id, String(b.texte));
  return json(c, 201);
});
route("GET", "/notifications", "Notifications", "Mes notifications", "user", async ({ me }) => ({ items: await notif.listNotifications(me.id), unread: await notif.unreadCount(me.id) }));
route("POST", "/notifications/lues", "Notifications", "Marquer comme lues (toutes ou une)", "user", async ({ me, body }) => { await notif.markRead(me.id, (await body().catch(() => ({}))).id); return ok; });

// ---------------------------------------------------------------- Conseiller
route("GET", "/rendez-vous", "Conseiller", "Mes rendez-vous (ou demandes à traiter pour un conseiller)", "user", async ({ me }) => counsel.listAppointments(me));
route("POST", "/rendez-vous", "Conseiller", "Demander un rendez-vous", ["eleve", "etudiant", "parent"], async ({ me, body }) => json(await counsel.requestAppointment(me, await body()), 201));
route("POST", "/rendez-vous/:id/planifier", "Conseiller", "Confirmer un créneau", ["conseiller", "admin"], async ({ me, params, body }) => { const b = await body(); return counsel.scheduleAppointment(me, params.id, new Date(b.date), b.notes); });
route("POST", "/rendez-vous/:id/cloturer", "Conseiller", "Terminer ou annuler", "user", async ({ me, params, body }) => { await counsel.closeAppointment(me, params.id, (await body()).statut === "annule" ? "annule" : "termine"); return ok; });

// ---------------------------------------------------------------- Navilease
route("GET", "/logements", "Navilease", "Rechercher des logements publiés", "public", async ({ query, user }) => housing.searchHousings({
  pays: query.get("pays") ?? undefined, ville: query.get("ville") ?? undefined, etablissement: query.get("etablissement") ?? undefined, budgetMax: Number(query.get("budget")) || undefined,
  type: query.get("type") ?? undefined, gender: query.get("genre") ?? undefined, amenities: query.getAll("equipement"), page: Number(query.get("page")) || 1,
  verifiedOnly: query.get("verifies") === "1" || accounts.isMinor(user?.birthYear),
}));
route("GET", "/logements/:id", "Navilease", "Fiche logement (adresse masquée)", "public", async ({ params }) => housing.getHousingPublic(params.id));
route("GET", "/logements/alertes", "Navilease", "Mes alertes logement", "user", async ({ me }) => housing.listAlerts(me.id));
route("POST", "/logements/alertes", "Navilease", "Créer une alerte", "user", async ({ me, body }) => json(await housing.createAlert(me, await body()), 201));
route("DELETE", "/logements/alertes/:id", "Navilease", "Supprimer une alerte", "user", async ({ me, params }) => { await housing.deleteAlert(me.id, params.id); return ok; });
route("GET", "/bailleur/logements", "Bailleur", "Mes annonces", ["bailleur"], async ({ me }) => housing.myHousings(me.id));
route("POST", "/bailleur/logements", "Bailleur", "Créer une annonce (brouillon)", ["bailleur"], async ({ me, body }) => json(await housing.saveHousing(me, await body()), 201));
route("GET", "/bailleur/logements/:id", "Bailleur", "Mon annonce", ["bailleur", "admin"], async ({ me, params }) => housing.getOwnHousing(me, params.id));
route("PATCH", "/bailleur/logements/:id", "Bailleur", "Modifier une annonce (repasse en modération)", ["bailleur"], async ({ me, params, body }) => housing.saveHousing(me, await body(), params.id));
route("POST", "/bailleur/logements/:id/photos", "Bailleur", "Ajouter une photo (multipart : fichier)", ["bailleur"], async ({ me, params, req }) => { const f = (await req.formData()).get("fichier"); if (!(f instanceof File)) throw new AppError("Fichier manquant."); return json({ key: await housing.addHousingPhoto(me, params.id, { bytes: new Uint8Array(await f.arrayBuffer()) }) }, 201); });
route("DELETE", "/bailleur/logements/:id/photos", "Bailleur", "Retirer une photo (?cle=)", ["bailleur"], async ({ me, params, query }) => { await housing.removeHousingPhoto(me, params.id, query.get("cle") ?? ""); return ok; });
route("POST", "/bailleur/logements/:id/moderation", "Bailleur", "Soumettre l'annonce à la modération", ["bailleur"], async ({ me, params }) => { await housing.submitForModeration(me, params.id); return ok; });
route("POST", "/bailleur/logements/:id/archiver", "Bailleur", "Archiver l'annonce", ["bailleur"], async ({ me, params }) => { await housing.archiveHousing(me, params.id); return ok; });
route("POST", "/bailleur/verification", "Bailleur", "Soumettre la vérification d'identité (KYC)", ["bailleur"], async ({ me, body }) => { const b = await body(); await housing.submitKyc(me, b.documents ?? [], b.versement); return ok; });
route("GET", "/reservations", "Navilease", "Mes réservations (locataire, bailleur ou parent)", "user", async ({ me }) => book.listBookings(me));
route("POST", "/reservations", "Navilease", "Demander une réservation", STUDENT, async ({ me, body }) => json(await book.requestBooking(me, await body()), 201));
route("GET", "/reservations/:id", "Navilease", "Détail (coordonnées révélées après paiement)", "user", async ({ me, params }) => book.getBooking(me, params.id));
route("POST", "/reservations/:id/reponse", "Navilease", "Bailleur : accepter ou refuser", ["bailleur", "admin"], async ({ me, params, body }) => { const b = await body(); return { statut: await book.respond(me, params.id, !!b.accepter, b.note) }; });
route("POST", "/reservations/:id/garant", "Navilease", "Parent : valider et se porter garant", ["parent"], async ({ me, params }) => { await book.approveAsGuarantor(me, params.id); return ok; });
route("POST", "/reservations/:id/paiement", "Navilease", "Payer la réservation (séquestre)", "user", async ({ me, params, body }) => book.payBooking(me, params.id, String((await body()).moyen)));
route("POST", "/reservations/:id/signature", "Navilease", "Signer le contrat", "user", async ({ me, params }) => book.signContract(me, params.id));
route("GET", "/reservations/:id/contrat.pdf", "Navilease", "Contrat de location (PDF)", "user", async ({ me, params }) => file(await book.contractPdf(me, params.id), "application/pdf", `contrat-${params.id}.pdf`));
route("POST", "/reservations/:id/entree", "Navilease", "Déclarer l'entrée (état des lieux) : libère le séquestre", STUDENT, async ({ me, params, body }) => { const b = await body(); await book.checkIn(me, params.id, { photos: b.photos ?? [], notes: b.notes }); return ok; });
route("POST", "/reservations/:id/loyer", "Navilease", "Payer un loyer (période AAAA-MM)", "user", async ({ me, params, body }) => { const b = await body(); return book.payRent(me, params.id, String(b.moyen), String(b.periode)); });
route("GET", "/quittances/:ref.pdf", "Navilease", "Quittance de loyer (PDF)", "user", async ({ me, params }) => file(await book.rentReceipt(me, params.ref), "application/pdf", `quittance-${params.ref}.pdf`));
route("POST", "/reservations/:id/preavis", "Navilease", "Donner son préavis", "user", async ({ me, params, body }) => { await book.giveNotice(me, params.id, (await body().catch(() => ({}))).note); return ok; });
route("POST", "/reservations/:id/sortie", "Navilease", "Bailleur : état des lieux de sortie et restitution de caution", ["bailleur", "admin"], async ({ me, params, body }) => { const b = await body(); await book.checkOut(me, params.id, { photos: b.photos ?? [], notes: b.notes, retenue: b.retenue }); return ok; });
route("POST", "/reservations/:id/annulation", "Navilease", "Annuler (avant signature)", "user", async ({ me, params, body }) => { await book.cancelBooking(me, params.id, (await body().catch(() => ({}))).motif); return ok; });
route("POST", "/reservations/:id/litige", "Navilease", "Ouvrir un litige (médiation)", "user", async ({ me, params, body }) => { const b = await body(); return json(await book.openDispute(me, params.id, String(b.motif), String(b.description)), 201); });
route("POST", "/reservations/:id/avis", "Navilease", "Laisser un avis (locataire ayant séjourné)", STUDENT, async ({ me, params, body }) => { const b = await body(); return book.reviewHousing(me, params.id, Number(b.note), b.commentaire); });

// ---------------------------------------------------------------- Back-office
route("GET", "/admin/statistiques", "Back-office", "Statistiques plateforme", ["admin"], async ({ me }) => admin.stats(me));
route("GET", "/admin/utilisateurs", "Back-office", "Utilisateurs (filtres role, pays, statut, q, page)", ["admin"], async ({ me, query }) => admin.listUsers(me, { role: query.get("role") ?? undefined, pays: query.get("pays") ?? undefined, status: query.get("statut") ?? undefined, q: query.get("q") ?? undefined, page: Number(query.get("page")) || 1 }));
route("POST", "/admin/utilisateurs/:id/statut", "Back-office", "Activer / suspendre un compte", ["admin"], async ({ me, params, body }) => admin.setUserStatus(me, params.id, (await body()).statut === "suspendu" ? "suspendu" : "actif"));
route("POST", "/admin/utilisateurs", "Back-office", "Créer un compte conseiller ou administrateur", ["admin"], async ({ me, body }) => json(await admin.createStaff(me, await body()), 201));
route("GET", "/admin/etablissements", "Back-office", "Établissements", ["admin"], async ({ me, query }) => admin.listEstablishmentsAdmin(me, { status: query.get("statut") ?? undefined, pays: query.get("pays") ?? undefined, q: query.get("q") ?? undefined }));
route("PATCH", "/admin/etablissements/:id", "Back-office", "Vérifier, mettre en avant, plan", ["admin"], async ({ me, params, body }) => admin.updateEstablishmentAdmin(me, params.id, await body()));
route("GET", "/admin/referentiels/:nom", "Back-office", "Lister un référentiel (format=json|csv pour exporter)", ["admin"], async ({ me, params, query }) => {
  const f = query.get("format");
  if (f === "json" || f === "csv") return new Response(await admin.exportRef(me, params.nom as admin.RefName, f), { headers: { "Content-Type": f === "json" ? "application/json" : "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${params.nom}.${f}"` } });
  return admin.listRef(me, params.nom as admin.RefName, query.get("q") ?? undefined);
});
route("PUT", "/admin/referentiels/:nom", "Back-office", "Créer ou modifier un élément", ["admin"], async ({ me, params, body }) => admin.saveRefItem(me, params.nom as admin.RefName, await body()));
route("DELETE", "/admin/referentiels/:nom/:id", "Back-office", "Supprimer un élément", ["admin"], async ({ me, params }) => { await admin.deleteRefItem(me, params.nom as admin.RefName, params.id); return ok; });
route("POST", "/admin/referentiels/:nom/import", "Back-office", "Importer (JSON ou CSV, multipart : fichier)", ["admin"], async ({ me, params, req }) => { const f = (await req.formData()).get("fichier"); if (!(f instanceof File)) throw new AppError("Fichier manquant."); return { importes: await admin.importRef(me, params.nom as admin.RefName, await f.text(), f.name.endsWith(".csv") ? "csv" : "json") }; });
route("GET", "/admin/referentiels-historique", "Back-office", "Historique des versions", ["admin"], async ({ me, query }) => admin.refHistory(me, (query.get("nom") as admin.RefName) ?? undefined));
route("GET", "/admin/moderation", "Back-office", "Annonces à modérer, KYC à valider, litiges", ["admin"], async ({ me }) => admin.moderationQueue(me));
route("POST", "/admin/logements/:id/moderation", "Back-office", "Publier ou refuser une annonce (+ niveau de vérification)", ["admin"], async ({ me, params, body }) => { const b = await body(); return housing.moderateHousing(me, params.id, { approve: !!b.publier, note: b.note, verification: b.verification }); });
route("POST", "/admin/bailleurs/:id/kyc", "Back-office", "Valider ou refuser un KYC", ["admin"], async ({ me, params, body }) => { const b = await body(); await housing.reviewKyc(me, params.id, !!b.valider, b.note); return ok; });
route("POST", "/admin/litiges/:id/resolution", "Back-office", "Résoudre un litige (séquestre libere|rembourse)", ["admin"], async ({ me, params, body }) => { const b = await body(); await book.resolveDispute(me, params.id, String(b.resolution), b.sequestre); return ok; });
route("GET", "/admin/paiements", "Back-office", "Transactions (filtres statut, sequestre, type)", ["admin"], async ({ me, query }) => admin.listPaymentsAdmin(me, { status: query.get("statut") ?? undefined, escrow: query.get("sequestre") ?? undefined, kind: query.get("type") ?? undefined }));
route("GET", "/admin/articles", "Back-office", "Tous les articles", ["admin"], async () => admin.listArticles(false));
route("POST", "/admin/articles", "Back-office", "Créer un article", ["admin"], async ({ me, body }) => json(await admin.saveArticle(me, await body()), 201));
route("PATCH", "/admin/articles/:id", "Back-office", "Modifier un article", ["admin"], async ({ me, params, body }) => admin.saveArticle(me, await body(), params.id));
route("POST", "/admin/temoignages", "Back-office", "Créer un témoignage", ["admin"], async ({ me, body }) => json(await admin.saveTestimonial(me, await body()), 201));
route("POST", "/admin/partenaires", "Back-office", "Créer un partenaire", ["admin"], async ({ me, body }) => json(await admin.savePartner(me, await body()), 201));
route("GET", "/admin/journal", "Back-office", "Journal des actions sensibles", ["admin"], async ({ me }) => admin.auditLog(me));

// ---------------------------------------------------------------- Fichiers publics (photos d'annonces)
route("GET", "/fichiers/housings/:hid/:fid", "Fichiers", "Photo d'annonce publiée", "public", async ({ params }) => {
  const f = await getFile(`housings/${params.hid}/${params.fid}`);
  if (!f) throw new AppError("Fichier introuvable.", 404);
  return new Response(f.data as BodyInit, { headers: { "Content-Type": f.contentType, "Cache-Control": "public, max-age=86400" } });
});
route("GET", "/openapi.json", "Documentation", "Description OpenAPI de l'API", "public", async () => openapi());

// ---------------------------------------------------------------- Dispatcher
function compile(path: string) {
  const keys: string[] = [];
  const re = new RegExp("^" + path.replace(/\./g, "\\.").replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
  return { re, keys };
}
// Les chemins statiques passent avant les chemins à paramètres (/logements/alertes avant /logements/:id).
const COMPILED = R.map((r) => ({ ...r, ...compile(r.path) })).sort((a, b) => a.keys.length - b.keys.length);

export async function dispatch(req: Request, segments: string[]) {
  try {
    const path = "/" + segments.map(decodeURIComponent).join("/");
    const candidates = COMPILED.filter((r) => r.re.test(path));
    if (!candidates.length) return json({ error: { code: "introuvable", message: "Route inconnue." } }, 404);
    const r = candidates.find((c) => c.method === req.method);
    if (!r) return json({ error: { code: "methode", message: "Méthode non autorisée." } }, 405);
    const m = r.re.exec(path)!;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
    // Protection CSRF simple pour les requêtes avec cookie : l'origine doit être celle du site.
    if (req.method !== "GET" && !req.headers.get("authorization") && r.path !== "/paiements/webhook/:provider") {
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== new URL(req.url).host) throw forbidden();
    }
    const user = await currentUser();
    if (r.auth !== "public") {
      if (!user) throw unauthorized();
      if (Array.isArray(r.auth) && !r.auth.includes(user.role)) throw forbidden();
      if (user.status === "en_attente" && user.role === "etablissement" && r.path.startsWith("/ecole")) throw new AppError("Votre compte établissement est en cours de vérification par l'équipe Navigoal.", 403, "en_attente");
    }
    const url = new URL(req.url);
    const res = await r.handler({ req, params, query: url.searchParams, user, me: user!, body: () => req.json() });
    return res instanceof Response ? res : json(res ?? ok);
  } catch (e) {
    return errorResponse(e);
  }
}

export function openapi() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const r of R) {
    const p = r.path.replace(/:(\w+)/g, "{$1}");
    paths["/api" + p] ??= {};
    paths["/api" + p][r.method.toLowerCase()] = {
      tags: [r.tag], summary: r.summary,
      security: r.auth === "public" ? [] : [{ session: [] }, { bearer: [] }],
      description: Array.isArray(r.auth) ? `Rôles autorisés : ${r.auth.join(", ")}` : r.auth === "user" ? "Utilisateur connecté" : "Public",
      parameters: [...r.path.matchAll(/:(\w+)/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } })),
      responses: { 200: { description: "OK" }, 401: { description: "Connexion requise" }, 403: { description: "Accès refusé" }, 422: { description: "Données invalides" } },
    };
  }
  return { openapi: "3.1.0", info: { title: "API Navigoal", version: "1.0.0", description: "API REST de la plateforme Navigoal (orientation, candidatures, Navilease). Réponses en JSON ; erreurs { error: { code, message } }." }, servers: [{ url: "/" }],
    components: { securitySchemes: { session: { type: "apiKey", in: "cookie", name: SESSION_COOKIE }, bearer: { type: "http", scheme: "bearer" } } }, paths };
}

export const routes = R;
