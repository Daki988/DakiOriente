// Schéma Navigoal V1 (PostgreSQL, Drizzle). Voir docs/backend.md.
import { relations, sql } from "drizzle-orm";
import { boolean, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";

/** Origine d'une inscription : premier lien suivi (utm_*) ou code parrain, mémorisés au premier passage sur le site. */
export type Acquisition = { source: string; medium?: string; campaign?: string; content?: string; ref?: string; landing?: string; at?: string };

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

// ---------------------------------------------------------------- Comptes
export const roleEnum = pgEnum("role", ["eleve", "etudiant", "parent", "etablissement", "bailleur", "conseiller", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["actif", "en_attente", "suspendu"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("actif"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthYear: integer("birth_year"),
  country: text("country"),
  city: text("city"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  totpSecret: text("totp_secret"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  // Accès créé par Navigoal (établissements) : mot de passe provisoire à remplacer à la première connexion.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  // Campagnes : code de parrainage personnel, parrain éventuel et source de l'inscription.
  referralCode: text("referral_code").unique(),
  referredById: text("referred_by_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  acquisition: jsonb("acquisition").$type<Acquisition>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("users_role_idx").on(t.role), index("users_referred_by_idx").on(t.referredById)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // hash SHA-256 du jeton
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

export const otpPurposeEnum = pgEnum("otp_purpose", ["login", "verify_phone", "verify_email", "reset_password"]);
export const otpCodes = pgTable("otp_codes", {
  id: id(),
  target: text("target").notNull(), // e-mail ou téléphone
  purpose: otpPurposeEnum("purpose").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("otp_target_idx").on(t.target, t.purpose)]);

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  level: text("level"), // niveaux.json
  serie: text("serie"), // series.json
  currentSchool: text("current_school"),
  diploma: text("diploma"),
  domain: text("domain"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  goals: text("goals"),
  preferences: jsonb("preferences").$type<{ pays?: string[]; villes?: string[]; budgetAnnuel?: number; devise?: string; logement?: { budget?: number; type?: string; colocation?: boolean } }>().notNull().default({}),
  riasec: jsonb("riasec").$type<{ scores: Record<string, number>; top: string[] } | null>(),
  // « Mes attentes » : résultats, projet, financement (filtres Premium et vivier de candidats).
  average: doublePrecision("average"), // moyenne /20 (bac ou terminale)
  mention: text("mention"),
  bacYear: integer("bac_year"),
  averageVerifiedAt: timestamp("average_verified_at", { withTimezone: true }), // vérifiée par Navigoal sur le relevé de notes
  targetJobs: jsonb("target_jobs").$type<string[]>().notNull().default([]), // métiers visés (ref_metiers)
  startYear: integer("start_year"), // rentrée souhaitée
  funding: jsonb("funding").$type<{ garant?: boolean; bourse?: boolean; pret?: boolean; autofinance?: boolean }>().notNull().default({}),
  // Vivier : visible des établissements Premium (consentement explicite ; pour un mineur, accord du parent).
  visibleToSchools: boolean("visible_to_schools").notNull().default(false),
  visibleToSchoolsAt: timestamp("visible_to_schools_at", { withTimezone: true }),
  parentConsentVisibilityAt: timestamp("parent_consent_visibility_at", { withTimezone: true }),
  avatarKey: text("avatar_key"),
  updatedAt: updatedAt(),
});

/** Lien parent/tuteur ↔ enfant, avec consentement parental pour les mineurs. */
export const guardianStatusEnum = pgEnum("guardian_status", ["invite", "actif", "refuse"]);
export const guardianships = pgTable("guardianships", {
  id: id(),
  parentId: text("parent_id").references(() => users.id, { onDelete: "cascade" }),
  childId: text("child_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteEmail: text("invite_email"),
  invitePhone: text("invite_phone"),
  inviteCode: text("invite_code"),
  relation: text("relation").notNull().default("parent"),
  status: guardianStatusEnum("status").notNull().default("invite"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("guardian_pair_idx").on(t.parentId, t.childId)]);

// ---------------------------------------------------------------- Référentiels (éditables au back-office)
export const refPays = pgTable("ref_pays", { id: text("id").primaryKey(), data: jsonb("data").notNull(), updatedAt: updatedAt() });
export const refDomaines = pgTable("ref_domaines", { id: text("id").primaryKey(), libelle: text("libelle").notNull(), data: jsonb("data").notNull(), updatedAt: updatedAt() });
export const refCompetences = pgTable("ref_competences", { id: text("id").primaryKey(), libelle: text("libelle").notNull(), data: jsonb("data").notNull(), updatedAt: updatedAt() });
export const refMetiers = pgTable("ref_metiers", { id: text("id").primaryKey(), nom: text("nom").notNull(), domaine: text("domaine"), data: jsonb("data").notNull(), published: boolean("published").notNull().default(true), updatedAt: updatedAt() });
export const refFormations = pgTable("ref_formations", { id: text("id").primaryKey(), intitule: text("intitule").notNull(), domaine: text("domaine"), data: jsonb("data").notNull(), published: boolean("published").notNull().default(true), updatedAt: updatedAt() });
export const refSeries = pgTable("ref_series", { id: text("id").primaryKey(), pays: text("pays").notNull(), data: jsonb("data").notNull(), updatedAt: updatedAt() });
/** Historique des imports / modifications de référentiels (versionnement). */
export const refVersions = pgTable("ref_versions", {
  id: id(), referentiel: text("referentiel").notNull(), action: text("action").notNull(), itemId: text("item_id"),
  before: jsonb("before"), after: jsonb("after"), authorId: text("author_id").references(() => users.id), createdAt: createdAt(),
});

// ---------------------------------------------------------------- Établissements et offre
export const establishmentStatusEnum = pgEnum("establishment_status", ["importe", "revendique", "verifie", "suspendu"]);
export const establishments = pgTable("establishments", {
  id: text("id").primaryKey(), // ex. ma-esa-casa
  nom: text("nom").notNull(),
  sigle: text("sigle").notNull(),
  pays: text("pays").notNull(),
  ville: text("ville").notNull(),
  type: text("type").notNull(),
  typeLibelle: text("type_libelle").notNull(),
  statut: text("statut").notNull(), // prive, partenariat_etat, prive_non_lucratif
  // Label Navigoal : reconnu_etat | diplomes_homologues | professionnel. Null = non publié (homologation à vérifier).
  label: text("label"),
  recognition: text("recognition"), // référence de la reconnaissance par l'État (décret)
  address: text("address"),
  siteWeb: text("site_web"),
  anneeCreation: integer("annee_creation"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  description: text("description"),
  email: text("email"),
  phone: text("phone"),
  logo: text("logo"),
  photos: jsonb("photos").$type<{ src: string; credit: string | null; licence: string | null; page: string | null }[]>().notNull().default([]),
  status: establishmentStatusEnum("status").notNull().default("importe"),
  featured: boolean("featured").notNull().default(false),
  plan: text("plan").notNull().default("gratuit"), // gratuit | premium
  premiumUntil: timestamp("premium_until", { withTimezone: true }),
  // Effets des abonnements en cours (synchronisés depuis `subscriptions`) : mise en avant et « À la une de l'accueil ».
  featuredUntil: timestamp("featured_until", { withTimezone: true }),
  homeUntil: timestamp("home_until", { withTimezone: true }),
  // Mode accompagné : l'équipe Navigoal répond aux candidats et traite les dossiers au nom de l'école.
  assisted: boolean("assisted").notNull().default(false),
  // Dossier de candidature propre à l'école : pièces ajoutées et fiche de candidature PDF à télécharger, remplir et renvoyer.
  dossier: jsonb("dossier").$type<DossierEcole>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("etab_pays_idx").on(t.pays)]);
export type PieceEcole = { cle: string; libelle: string; obligatoire: boolean };
export type FicheCandidature = { key: string; nom: string; taille: number; maj: string; source?: string | null; telechargements?: number };
export type DossierEcole = { pieces?: PieceEcole[]; fiche?: FicheCandidature | null };

export const establishmentMembers = pgTable("establishment_members", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("gestionnaire"), // admin_ecole, gestionnaire, lecteur
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.establishmentId] })]);

/** Formation publiée par un établissement, rattachée à une formation type du référentiel. */
export const programs = pgTable("programs", {
  id: id(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  formationId: text("formation_id").notNull(), // ref_formations.id (formation générique : métiers, orientation)
  title: text("title").notNull(),
  faculty: text("faculty").notNull().default(""), // composante (faculté, école) pour les universités
  campus: text("campus"), // ville, si différente de celle de l'établissement
  campuses: jsonb("campuses").$type<string[]>().notNull().default([]), // réseau multi-campus : villes où la filière est ouverte
  diploma: text("diploma"), // diplôme délivré (ex. Diplôme d'ingénieur)
  level: text("level"), // niv-bac3, niv-bac5…
  options: text("options"),
  // Homologation par l'État : seules les filières homologuées sont publiées
  homologated: boolean("homologated").notNull().default(false),
  homologation: jsonb("homologation").$type<{ statut: string; fin?: string; texte?: string; verifiePar?: string; verifieLe?: string }>(),
  description: text("description"),
  durationYears: integer("duration_years"),
  language: text("language").default("fr"),
  tuitionMin: integer("tuition_min"),
  tuitionMax: integer("tuition_max"),
  currency: text("currency"),
  feesConfirmed: boolean("fees_confirmed").notNull().default(false),
  applicationFee: integer("application_fee").notNull().default(0),
  admission: jsonb("admission").$type<{ series?: string[]; noteMin?: number; concours?: boolean; entretien?: boolean; prerequis?: string }>().notNull().default({}),
  requiredDocuments: jsonb("required_documents").$type<string[]>().notNull().default(["identite", "photo", "acte_naissance", "releve_notes"]),
  seats: integer("seats"),
  startDate: text("start_date"),
  active: boolean("active").notNull().default(true),
  indicative: boolean("indicative").notNull().default(true), // importé depuis le référentiel, à confirmer
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("programs_etab_idx").on(t.establishmentId), uniqueIndex("programs_etab_title_idx").on(t.establishmentId, t.title, t.faculty)]);

export const campaignKindEnum = pgEnum("campaign_kind", ["admission", "concours", "inscription", "bourse", "portes_ouvertes", "evenement"]);
export const campaigns = pgTable("campaigns", {
  id: id(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  kind: campaignKindEnum("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  programIds: jsonb("program_ids").$type<string[]>().notNull().default([]),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  seats: integer("seats"),
  conditions: text("conditions"),
  requiredDocuments: jsonb("required_documents").$type<string[]>().notNull().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------- Documents
export const documentTypeEnum = pgEnum("document_type", ["identite", "acte_naissance", "diplome", "releve_notes", "certificat", "photo", "attestation_admission", "attestation_scolarite", "piece_garant", "justificatif_ressources", "kyc_identite", "kyc_propriete", "autre",
  "fiche_candidature", "releve_bac", "cv", "lettre_motivation", "prise_en_charge", "equivalence_bac", "certificat_medical", "test_langue"]);
export const documents = pgTable("documents", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  label: text("label"),
  // Rattachement d'une pièce propre à une école : « etab:<id> » (fiche de candidature remplie) ou « piece:<id>:<cle> » (pièce ajoutée par l'école).
  scope: text("scope"),
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  status: text("status").notNull().default("depose"), // depose, valide, refuse
  createdAt: createdAt(),
}, (t) => [index("documents_owner_idx").on(t.ownerId)]);

// ---------------------------------------------------------------- Candidatures
export const applicationStatusEnum = pgEnum("application_status", ["brouillon", "soumise", "paiement_confirme", "en_verification", "complet", "en_traitement", "piece_demandee", "acceptee", "refusee", "liste_attente", "desistee"]);
export const applications = pgTable("applications", {
  id: id(),
  number: text("number").notNull().unique(), // 2026-00125
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: text("program_id").notNull().references(() => programs.id),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id),
  campaignId: text("campaign_id").references(() => campaigns.id),
  campus: text("campus"), // campus choisi par l'étudiant (réseau multi-campus)
  status: applicationStatusEnum("status").notNull().default("brouillon"),
  motivation: text("motivation"),
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  documentIds: jsonb("document_ids").$type<string[]>().notNull().default([]),
  requestedDocuments: jsonb("requested_documents").$type<string[]>().notNull().default([]),
  decisionNote: text("decision_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("applications_student_idx").on(t.studentId), index("applications_etab_idx").on(t.establishmentId, t.status)]);

export const applicationEvents = pgTable("application_events", {
  id: id(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull(),
  note: text("note"),
  authorId: text("author_id").references(() => users.id),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------- Paiements (candidatures + Navilease, séquestre)
export const paymentKindEnum = pgEnum("payment_kind", ["frais_candidature", "reservation", "caution", "loyer", "service"]);
export const paymentStatusEnum = pgEnum("payment_status", ["initie", "en_attente", "reussi", "echoue", "rembourse", "annule"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["aucun", "bloque", "libere", "rembourse", "litige"]);
export const payments = pgTable("payments", {
  id: id(),
  reference: text("reference").notNull().unique(), // NG-PAY-…
  payerId: text("payer_id").notNull().references(() => users.id),
  beneficiaryId: text("beneficiary_id").references(() => users.id), // pour le compte de (enfant)
  kind: paymentKindEnum("kind").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  provider: text("provider").notNull(), // sandbox, cinetpay, paydunya, cmi…
  method: text("method").notNull(), // airtel_money, wave, orange_money, carte, virement…
  status: paymentStatusEnum("status").notNull().default("initie"),
  escrow: escrowStatusEnum("escrow").notNull().default("aucun"),
  providerRef: text("provider_ref"),
  applicationId: text("application_id").references(() => applications.id),
  bookingId: text("booking_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("payments_payer_idx").on(t.payerId), index("payments_booking_idx").on(t.bookingId)]);

// ---------------------------------------------------------------- Orientation
export const orientationResults = pgTable("orientation_results", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<(number | null)[]>().notNull(),
  scores: jsonb("scores").$type<Record<string, number>>().notNull(),
  top: jsonb("top").$type<string[]>().notNull(),
  createdAt: createdAt(),
});

export const favorites = pgTable("favorites", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // metier, formation, etablissement, logement, program
  itemId: text("item_id").notNull(),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.kind, t.itemId] })]);

// ---------------------------------------------------------------- Messagerie, notifications, conseiller
export const conversations = pgTable("conversations", {
  id: id(),
  subject: text("subject").notNull(),
  contextKind: text("context_kind"), // application, booking, conseil, support
  contextId: text("context_id"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: createdAt(),
});
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]);
export const messages = pgTable("messages", {
  id: id(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  masked: boolean("masked").notNull().default(false), // coordonnées masquées (Navilease avant réservation)
  onBehalfOf: text("on_behalf_of"), // message de l'équipe Navigoal « pour le compte de » (nom de l'école ou du bailleur)
  internal: boolean("internal").notNull().default(false), // note interne : invisible du candidat ou du locataire
  createdAt: createdAt(),
}, (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)]);

// Appels audio ou vidéo (Daily) lancés depuis un fil de messagerie : entretien, visite virtuelle, rendez-vous conseiller.
// La salle Daily est privée et expire ; on n'entre qu'avec un jeton remis aux participants du fil (et à l'équipe).
export const appels = pgTable("appels", {
  id: id(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  salle: text("salle"), // nom de la salle Daily (créée au premier appel à rejoindre pour un rendez-vous planifié)
  url: text("url"), // adresse de la salle Daily
  audioSeul: boolean("audio_seul").notNull().default(false),
  creePar: text("cree_par").notNull().references(() => users.id, { onDelete: "cascade" }),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
  // Rendez-vous planifié (novembre 2026) : début, durée et objet ; null = appel immédiat.
  prevuLe: timestamp("prevu_le", { withTimezone: true }),
  dureeMin: integer("duree_min"),
  objet: text("objet"),
  annuleLe: timestamp("annule_le", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("appels_conv_idx").on(t.conversationId), index("appels_prevu_idx").on(t.prevuLe)]);

// ---------------------------------------------------------------- Offres payantes des établissements
/** Catalogue modifiable dans le back-office. `effect` : ce que le service active sur la plateforme. */
export const offerServices = pgTable("offer_services", {
  code: text("code").primaryKey(), // premium, mise_en_avant, une_accueil, salons, accompagnement
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  effect: text("effect").notNull().default("aucun"), // premium | mise_en_avant | une_accueil | aucun
  prices: jsonb("prices").$type<{ months: number; amount: number | null }[]>().notNull().default([]), // amount null : sur devis
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  updatedAt: updatedAt(),
});
export const subscriptions = pgTable("subscriptions", {
  id: id(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  serviceCode: text("service_code").notNull().references(() => offerServices.code),
  months: integer("months").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  amount: integer("amount"), // MAD encaissés (null : offert ou sur devis)
  currency: text("currency").notNull().default("MAD"),
  paymentMethod: text("payment_method"),
  paymentRef: text("payment_ref"),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  reminded30At: timestamp("reminded_30_at", { withTimezone: true }),
  reminded7At: timestamp("reminded_7_at", { withTimezone: true }),
  expiredNoticeAt: timestamp("expired_notice_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("subscriptions_etab_idx").on(t.establishmentId, t.endsAt)]);

// ---------------------------------------------------------------- Prospection (établissements Premium)
export const prospectStatusEnum = pgEnum("prospect_status", ["en_validation", "validee", "refusee", "envoyee"]);
export const prospections = pgTable("prospections", {
  id: id(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  offer: text("offer").notNull(), // candidature, portes_ouvertes, bourse, concours
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull().default({}),
  status: prospectStatusEnum("status").notNull().default("en_validation"),
  reviewNote: text("review_note"),
  audience: integer("audience").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("prospections_etab_idx").on(t.establishmentId)]);
export const invitationStatusEnum = pgEnum("invitation_status", ["envoyee", "lue", "interessee", "refusee"]);
export const invitations = pgTable("invitations", {
  id: id(),
  prospectionId: text("prospection_id").notNull().references(() => prospections.id, { onDelete: "cascade" }),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: invitationStatusEnum("status").notNull().default("envoyee"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("invitations_student_idx").on(t.studentId), index("invitations_etab_idx").on(t.establishmentId, t.createdAt), uniqueIndex("invitations_pair_idx").on(t.prospectionId, t.studentId)]);

export const notifications = pgTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at", { withTimezone: true }),
  channels: jsonb("channels").$type<string[]>().notNull().default(["app"]),
  createdAt: createdAt(),
}, (t) => [index("notifications_user_idx").on(t.userId, t.readAt)]);

export const appointmentStatusEnum = pgEnum("appointment_status", ["demande", "confirme", "termine", "annule"]);
export const appointments = pgTable("appointments", {
  id: id(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  counselorId: text("counselor_id").references(() => users.id),
  topic: text("topic").notNull(),
  preferredAt: timestamp("preferred_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  channel: text("channel").notNull().default("visio"),
  status: appointmentStatusEnum("status").notNull().default("demande"),
  notes: text("notes"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------- Navilease
export const kycStatusEnum = pgEnum("kyc_status", ["non_soumis", "en_revue", "valide", "refuse"]);
export const landlords = pgTable("landlords", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("particulier"), // particulier, agence, residence
  company: text("company"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("non_soumis"),
  kycDocumentIds: jsonb("kyc_document_ids").$type<string[]>().notNull().default([]),
  kycNote: text("kyc_note"),
  payoutMethod: text("payout_method"),
  payoutAccount: text("payout_account"),
  partner: boolean("partner").notNull().default(false),
  assisted: boolean("assisted").notNull().default(false), // mode accompagné (Navigoal répond aux locataires)
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const housingStatusEnum = pgEnum("housing_status", ["brouillon", "en_moderation", "publie", "refuse", "archive"]);
export const verificationEnum = pgEnum("verification_level", ["non_verifie", "identite", "visite", "partenaire"]);
export const housings = pgTable("housings", {
  id: id(),
  landlordId: text("landlord_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // studio, chambre, colocation, residence, chez_habitant, appartement
  description: text("description").notNull(),
  pays: text("pays").notNull(),
  ville: text("ville").notNull(),
  quartier: text("quartier"),
  address: text("address"), // masquée avant réservation
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  rent: integer("rent").notNull(),
  charges: integer("charges").notNull().default(0),
  deposit: integer("deposit").notNull().default(0),
  currency: text("currency").notNull(),
  surface: integer("surface"),
  rooms: integer("rooms"),
  capacity: integer("capacity").notNull().default(1),
  gender: text("gender").notNull().default("mixte"),
  furnished: boolean("furnished").notNull().default(true),
  amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
  rules: text("rules"),
  minMonths: integer("min_months").notNull().default(1),
  availableFrom: text("available_from"),
  nearEstablishments: jsonb("near_establishments").$type<{ id: string; minutes: number; mode: string }[]>().notNull().default([]),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  status: housingStatusEnum("status").notNull().default("brouillon"),
  verification: verificationEnum("verification").notNull().default("non_verifie"),
  moderationNote: text("moderation_note"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("housings_city_idx").on(t.pays, t.ville, t.status)]);

export const bookingStatusEnum = pgEnum("booking_status", ["demande", "acceptee", "attente_garant", "paiement_sequestre", "contrat_signe", "entree", "fonds_verses", "en_cours", "preavis", "sortie", "caution_restituee", "refusee", "annulee", "litige"]);
export const bookings = pgTable("bookings", {
  id: id(),
  number: text("number").notNull().unique(), // NL-2026-00342
  housingId: text("housing_id").notNull().references(() => housings.id),
  tenantId: text("tenant_id").notNull().references(() => users.id),
  landlordId: text("landlord_id").notNull().references(() => users.id),
  guarantorId: text("guarantor_id").references(() => users.id),
  guarantorApprovedAt: timestamp("guarantor_approved_at", { withTimezone: true }),
  status: bookingStatusEnum("status").notNull().default("demande"),
  startDate: text("start_date").notNull(),
  months: integer("months").notNull(),
  rent: integer("rent").notNull(),
  charges: integer("charges").notNull(),
  deposit: integer("deposit").notNull(),
  serviceFee: integer("service_fee").notNull(),
  currency: text("currency").notNull(),
  message: text("message"),
  documentIds: jsonb("document_ids").$type<string[]>().notNull().default([]),
  contract: jsonb("contract").$type<{ storageKey?: string; tenantSignedAt?: string; landlordSignedAt?: string } | null>(),
  checkIn: jsonb("check_in").$type<{ at: string; photos: string[]; notes?: string } | null>(),
  checkOut: jsonb("check_out").$type<{ at: string; photos: string[]; notes?: string; retenue?: number } | null>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("bookings_tenant_idx").on(t.tenantId), index("bookings_landlord_idx").on(t.landlordId)]);

export const bookingEvents = pgTable("booking_events", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull(),
  note: text("note"),
  authorId: text("author_id").references(() => users.id),
  createdAt: createdAt(),
});

export const reviews = pgTable("reviews", {
  id: id(),
  housingId: text("housing_id").notNull().references(() => housings.id, { onDelete: "cascade" }),
  bookingId: text("booking_id").notNull().references(() => bookings.id).unique(),
  authorId: text("author_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  published: boolean("published").notNull().default(true),
  createdAt: createdAt(),
});

export const disputeStatusEnum = pgEnum("dispute_status", ["ouvert", "en_mediation", "resolu", "clos"]);
export const disputes = pgTable("disputes", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  openedById: text("opened_by_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  description: text("description").notNull(),
  status: disputeStatusEnum("status").notNull().default("ouvert"),
  resolution: text("resolution"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const housingAlerts = pgTable("housing_alerts", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  criteria: jsonb("criteria").$type<{ pays?: string; ville?: string; etablissement?: string; budgetMax?: number; type?: string }>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------- Contenus
export const articles = pgTable("articles", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(), // Markdown
  cover: text("cover"),
  pays: jsonb("pays").$type<string[]>().notNull().default([]),
  authorId: text("author_id").references(() => users.id),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const testimonials = pgTable("testimonials", {
  id: id(), name: text("name").notNull(), role: text("role").notNull(), quote: text("quote").notNull(), pays: text("pays"),
  published: boolean("published").notNull().default(false), createdAt: createdAt(),
});

export const partners = pgTable("partners", {
  id: id(), name: text("name").notNull(), kind: text("kind").notNull(), url: text("url"), logo: text("logo"),
  featured: boolean("featured").notNull().default(false), createdAt: createdAt(),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  ip: text("ip"),
  createdAt: createdAt(),
}, (t) => [index("audit_created_idx").on(t.createdAt)]);

/** Compteurs séquentiels pour les numéros lisibles (candidatures, réservations, paiements). */
export const counters = pgTable("counters", { key: text("key").primaryKey(), value: integer("value").notNull().default(0) });

// ---------------------------------------------------------------- Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  landlord: one(landlords, { fields: [users.id], references: [landlords.userId] }),
  memberships: many(establishmentMembers),
}));
export const membersRelations = relations(establishmentMembers, ({ one }) => ({
  user: one(users, { fields: [establishmentMembers.userId], references: [users.id] }),
  establishment: one(establishments, { fields: [establishmentMembers.establishmentId], references: [establishments.id] }),
}));
export const programsRelations = relations(programs, ({ one, many }) => ({
  establishment: one(establishments, { fields: [programs.establishmentId], references: [establishments.id] }),
  applications: many(applications),
}));
export const establishmentsRelations = relations(establishments, ({ many }) => ({ programs: many(programs), members: many(establishmentMembers), campaigns: many(campaigns) }));
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  student: one(users, { fields: [applications.studentId], references: [users.id] }),
  program: one(programs, { fields: [applications.programId], references: [programs.id] }),
  establishment: one(establishments, { fields: [applications.establishmentId], references: [establishments.id] }),
  events: many(applicationEvents),
}));
export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({ application: one(applications, { fields: [applicationEvents.applicationId], references: [applications.id] }) }));
export const housingsRelations = relations(housings, ({ one, many }) => ({ landlord: one(users, { fields: [housings.landlordId], references: [users.id] }), bookings: many(bookings), reviews: many(reviews) }));
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  housing: one(housings, { fields: [bookings.housingId], references: [housings.id] }),
  tenant: one(users, { fields: [bookings.tenantId], references: [users.id] }),
  events: many(bookingEvents),
}));
export const bookingEventsRelations = relations(bookingEvents, ({ one }) => ({ booking: one(bookings, { fields: [bookingEvents.bookingId], references: [bookings.id] }) }));
export const reviewsRelations = relations(reviews, ({ one }) => ({ housing: one(housings, { fields: [reviews.housingId], references: [housings.id] }) }));
export const conversationsRelations = relations(conversations, ({ many }) => ({ participants: many(conversationParticipants), messages: many(messages) }));
export const participantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationParticipants.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}));
export const messagesRelations = relations(messages, ({ one }) => ({ conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }), author: one(users, { fields: [messages.authorId], references: [users.id] }) }));

export const _sql = sql; // réexport pratique pour les requêtes brutes

// ---------------------------------------------------------------- Audience (sans cookie : ni IP ni identifiant persistant conservés)
export const pageViews = pgTable("page_views", {
  id: id(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  day: text("day").notNull(), // AAAA-MM-JJ (UTC)
  path: text("path").notNull(),
  service: text("service").notNull(), // navigoal | navilease | navitravel
  country: text("country"), // code ISO déduit de l'adresse IP (base locale), adresse non conservée
  source: text("source").notNull(), // google, direct, whatsapp, facebook, campagne…
  device: text("device").notNull(), // mobile | tablette | ordinateur
  visitor: text("visitor").notNull(), // empreinte anonyme du jour (change chaque jour)
  connected: boolean("connected").notNull().default(false),
}, (t) => [index("pv_day_idx").on(t.day), index("pv_at_idx").on(t.at)]);

// Présence en direct (tableau « En ce moment » de l'audience) : une ligne par visiteur anonyme, mise à jour à chaque page
// et toutes les minutes tant que l'onglet est ouvert ; lignes de plus d'une heure supprimées.
export const presences = pgTable("presences", {
  visitor: text("visitor").primaryKey(), // même empreinte anonyme du jour que page_views
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  depuis: timestamp("depuis", { withTimezone: true }).notNull().defaultNow(),
  path: text("path").notNull(),
  service: text("service").notNull(),
  country: text("country"),
  source: text("source").notNull(),
  device: text("device").notNull(),
  role: text("role"), // rôle du compte connecté, sinon null (visiteur)
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // compte connecté (lien vers son dossier dans le back-office)
  pages: integer("pages").notNull().default(1),
}, (t) => [index("presences_at_idx").on(t.at)]);

// ---------------------------------------------------------------- Réglages de la plateforme (paiements…) ; secrets chiffrés (AES-256-GCM)
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedBy: text("updated_by"),
  updatedAt: updatedAt(),
});

// Navi : fiche de suivi d'un élève (ou d'un parent), tenue d'une conversation à l'autre : profil exprimé, pistes,
// décisions, hésitations, prochaine étape. Rédigée par le petit modèle, lue en début de conversation, visible de
// l'élève (« Ce que Navi retient ») et de l'équipe dans son dossier ; effaçable par l'élève.
export const naviSuivi = pgTable("navi_suivi", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  notes: text("notes").notNull().default(""),
  updatedAt: updatedAt(),
});

// Navi : une ligne par question posée (suivi de qualité et de coût, back-office /admin/navi). Conservation 90 jours.
export const naviTraces = pgTable("navi_traces", {
  id: id(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  role: text("role"), // rôle du compte, null pour un visiteur
  page: text("page"),
  question: text("question").notNull(),
  reponse: text("reponse").notNull().default(""),
  outils: jsonb("outils").$type<string[]>().notNull().default([]),
  cartes: integer("cartes").notNull().default(0),
  route: text("route").notNull(), // simple (petit modèle) | complet | cache
  modele: text("modele"), // modèle qui a produit la réponse
  tours: integer("tours").notNull().default(0),
  entree: integer("entree").notNull().default(0), // jetons d'entrée facturés plein tarif
  sortie: integer("sortie").notNull().default(0),
  cacheLu: integer("cache_lu").notNull().default(0),
  cacheEcrit: integer("cache_ecrit").notNull().default(0),
  coutUsd: doublePrecision("cout_usd").notNull().default(0),
  dureeMs: integer("duree_ms").notNull().default(0),
  statut: text("statut").notNull(), // ok | refus | erreur
  avis: text("avis"), // avis de la personne sur la réponse : utile | inutile (null si aucun)
  avisLe: timestamp("avis_le", { withTimezone: true }),
}, (t) => [index("navi_traces_at_idx").on(t.at)]);

// Navi sur WhatsApp : fil de chaque numéro (pour garder le contexte d'un message à l'autre, comme le widget du site).
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: id(),
  numero: text("numero").notNull(), // numéro WhatsApp de l'interlocuteur, chiffres seuls (ex. 241077000000)
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // compte Navigoal reconnu (téléphone vérifié)
  role: text("role").notNull(), // user | assistant
  texte: text("texte").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("whatsapp_messages_num_idx").on(t.numero, t.at)]);

// Navi : réponses aux questions génériques de visiteurs (premier message, sans compte), servies 24 h.
export const naviCache = pgTable("navi_cache", {
  cle: text("cle").primaryKey(),
  question: text("question").notNull(),
  reponse: text("reponse").notNull(),
  cartes: jsonb("cartes").$type<unknown[]>().notNull().default([]),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
  servie: integer("servie").notNull().default(0),
});

// Renouvellements d'accréditation saisis ou validés dans le back-office (« Accréditations »). Les lignes « valide »
// sont reportées chaque jour dans data/sources/maroc/renouvellements.csv par le robot GitHub (accreditations.yml),
// qui reconstruit le référentiel et met le site en ligne ; « rejete » écarte une proposition de l'assistant IA.
export const accreditationRenouvellements = pgTable("accreditation_renouvellements", {
  id: id(),
  etablissementId: text("etablissement_id").notNull(),
  filiere: text("filiere").notNull(),
  composante: text("composante").notNull().default(""),
  fin: text("fin").notNull(), // nouvelle fin d'accréditation, ex. 2030-2031
  arrete: text("arrete").notNull(), // n° de l'arrêté, ex. 1234.26
  bulletinOfficiel: text("bulletin_officiel").notNull(), // n° du Bulletin officiel
  datePublication: text("date_publication"),
  source: text("source"), // lien ou référence de la source
  statut: text("statut").notNull(), // valide | rejete
  origine: text("origine").notNull(), // admin | ia
  parId: text("par_id").references(() => users.id, { onDelete: "set null" }),
  le: timestamp("le", { withTimezone: true }).notNull().defaultNow(),
  reporte: boolean("reporte").notNull().default(false), // déjà reporté dans renouvellements.csv
});

// ---------------------------------------------------------------- Avis et témoignages (novembre 2026)
// Note de Navigoal (1 à 5) et témoignage facultatif, donnés depuis le profil : un par compte, modifiable. Le témoignage
// n'est publié (page « Pourquoi Navigoal ») qu'avec l'accord de la personne et après relecture par l'équipe.
export const avisService = pgTable("avis_service", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  note: integer("note").notNull(),
  temoignage: text("temoignage"),
  publier: boolean("publier").notNull().default(false), // accord pour publier le témoignage
  affichage: text("affichage").notNull().default("prenom"), // prenom (« Amina M. ») | anonyme (« Une élève, Gabon »)
  statut: text("statut").notNull().default("sans_temoignage"), // sans_temoignage | en_attente | publie | refuse
  motif: text("motif"), // motif de refus, envoyé à l'auteur
  moderePar: text("modere_par").references(() => users.id, { onDelete: "set null" }),
  modereLe: timestamp("modere_le", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("avis_service_statut_idx").on(t.statut)]);

// Avis vérifiés sur les écoles : seuls les étudiants dont l'inscription est prouvée (candidature acceptée via Navigoal
// et inscription confirmée, ou certificat de scolarité validé par l'équipe). Un avis par personne, école et année.
export type NotesAvis = { enseignement: number; encadrement: number; accueil: number; campus: number; insertion: number; prix: number };
export const avisEtablissements = pgTable("avis_etablissements", {
  id: id(),
  auteurId: text("auteur_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  etablissementId: text("etablissement_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  formation: text("formation"),
  campus: text("campus"),
  annee: text("annee").notNull(), // année universitaire, ex. 2026-2027
  notes: jsonb("notes").$type<NotesAvis>().notNull(),
  recommande: boolean("recommande").notNull(),
  pointsForts: text("points_forts").notNull(),
  pointsFaibles: text("points_faibles").notNull(),
  fraisDeclares: integer("frais_declares"), // scolarité annuelle réellement payée (MAD), facultatif
  affichage: text("affichage").notNull().default("prenom"), // prenom | anonyme
  verification: text("verification").notNull(), // navigoal (candidature acceptée) | justificatif (certificat validé)
  applicationId: text("application_id").references(() => applications.id, { onDelete: "set null" }),
  justificatifId: text("justificatif_id"), // document déposé (certificat de scolarité)
  statut: text("statut").notNull().default("en_attente"), // en_attente | publie | refuse | retire
  motif: text("motif"),
  moderePar: text("modere_par").references(() => users.id, { onDelete: "set null" }),
  modereLe: timestamp("modere_le", { withTimezone: true }),
  reponse: text("reponse"), // réponse publique de l'école
  reponseStatut: text("reponse_statut"), // en_attente | publie | refuse
  reponseLe: timestamp("reponse_le", { withTimezone: true }),
  reponseParId: text("reponse_par_id").references(() => users.id, { onDelete: "set null" }),
  publieLe: timestamp("publie_le", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("avis_etab_unique").on(t.auteurId, t.etablissementId, t.annee), index("avis_etab_idx").on(t.etablissementId, t.statut)]);

export const avisSignalements = pgTable("avis_signalements", {
  id: id(),
  avisId: text("avis_id").notNull().references(() => avisEtablissements.id, { onDelete: "cascade" }),
  auteurId: text("auteur_id").references(() => users.id, { onDelete: "set null" }),
  motif: text("motif").notNull(),
  statut: text("statut").notNull().default("ouvert"), // ouvert | traite
  traitePar: text("traite_par").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("avis_signal_avis_idx").on(t.avisId)]);

// ---------------------------------------------------------------- Bourses suivies (alertes)
export const boursesSuivies = pgTable("bourses_suivies", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bourseId: text("bourse_id").notNull(), // identifiant du référentiel data/referentiels/bourses.json
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.bourseId] })]);

// ---------------------------------------------------------------- Paiement de la scolarité (montage A : paiement direct à l'école)
// Navigoal n'encaisse pas : l'école déclare ses moyens de paiement (vérifiés par l'équipe), fixe l'échéancier d'une
// candidature acceptée ; la famille paie l'école et dépose sa preuve ; l'école confirme la réception.
export const moyensPaiementEcoles = pgTable("moyens_paiement_ecoles", {
  id: id(),
  etablissementId: text("etablissement_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // virement | lien | especes | autre
  libelle: text("libelle").notNull(), // ex. « Virement bancaire (Attijariwafa) »
  details: text("details").notNull(), // RIB, lien, instructions
  devise: text("devise").notNull().default("MAD"),
  statut: text("statut").notNull().default("a_verifier"), // a_verifier | verifie | refuse | retire
  verifiePar: text("verifie_par").references(() => users.id, { onDelete: "set null" }),
  verifieLe: timestamp("verifie_le", { withTimezone: true }),
  motifRefus: text("motif_refus"), // motif envoyé à l'école, effacé quand elle corrige
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("moyens_paiement_etab_idx").on(t.etablissementId)]);

export type LigneEcheancier = { id: string; libelle: string; montant: number; echeance: string };
export const echeanciersScolarite = pgTable("echeanciers_scolarite", {
  id: id(),
  applicationId: text("application_id").notNull().unique().references(() => applications.id, { onDelete: "cascade" }),
  etablissementId: text("etablissement_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  devise: text("devise").notNull().default("MAD"),
  lignes: jsonb("lignes").$type<LigneEcheancier[]>().notNull().default([]),
  remboursement: text("remboursement"), // conditions de remboursement de l'école (refus de visa, désistement)
  inscriptionConfirmee: timestamp("inscription_confirmee", { withTimezone: true }), // première échéance confirmée
  creePar: text("cree_par").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const paiementsScolarite = pgTable("paiements_scolarite", {
  id: id(),
  echeancierId: text("echeancier_id").notNull().references(() => echeanciersScolarite.id, { onDelete: "cascade" }),
  ligneId: text("ligne_id").notNull(),
  payeurId: text("payeur_id").notNull().references(() => users.id),
  montant: integer("montant").notNull(),
  devise: text("devise").notNull(),
  moyenId: text("moyen_id").references(() => moyensPaiementEcoles.id, { onDelete: "set null" }),
  reference: text("reference"), // référence du virement ou du reçu
  preuveId: text("preuve_id"), // document déposé (preuve de paiement)
  statut: text("statut").notNull().default("declare"), // declare | confirme | refuse
  motif: text("motif"),
  confirmePar: text("confirme_par").references(() => users.id, { onDelete: "set null" }),
  confirmeLe: timestamp("confirme_le", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("paiements_scol_ech_idx").on(t.echeancierId)]);

// ---------------------------------------------------------------- Rappels de paiement (novembre 2026)
// Un parent (ou l'élève) programme un rappel avant chaque échéance de loyer ou de scolarité, même payée hors Navigoal :
// il connaît la date d'entrée dans le logement et les modalités. Délai réglable (2, 3, 5 ou 7 jours), rappel le jour même en option.
// source « echeancier » : les échéances non réglées de l'échéancier de scolarité d'une candidature ; « navilease » : loyer d'une réservation.
export const rappelsPaiement = pgTable("rappels_paiement", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enfantId: text("enfant_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // loyer | scolarite | autre
  libelle: text("libelle").notNull(),
  montant: integer("montant"),
  devise: text("devise").notNull().default("MAD"),
  frequence: text("frequence").notNull().default("mensuel"), // mensuel | trimestriel | semestriel | annuel | unique
  premiereEcheance: text("premiere_echeance").notNull(), // AAAA-MM-JJ
  finLe: text("fin_le"), // AAAA-MM-JJ, dernière échéance incluse
  delaiJours: integer("delai_jours").notNull().default(3), // 2, 3, 5 ou 7
  aussiLeJour: boolean("aussi_le_jour").notNull().default(true),
  source: text("source").notNull().default("manuel"), // manuel | navilease | echeancier
  sourceId: text("source_id"),
  actif: boolean("actif").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("rappels_paiement_user_idx").on(t.userId)]);

// ---------------------------------------------------------------- Salons virtuels (novembre 2026)
// Une école présente en direct devant des élèves inscrits ; service payant (forfait), validé par l'admin ; Navi invite
// les élèves dont le profil correspond. Fiches contact vendues à l'école, seulement avec l'accord de l'élève (et d'un parent
// s'il est mineur) : 7 000 F CFA la fiche, +25 % en cascade par critère de ciblage.
export const salons = pgTable("salons", {
  id: id(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  titre: text("titre").notNull(),
  description: text("description").notNull().default(""),
  programme: jsonb("programme").$type<{ heure: string; texte: string }[]>().notNull().default([]),
  presentateurs: jsonb("presentateurs").$type<{ nom: string; role: string }[]>().notNull().default([]),
  debut: timestamp("debut", { withTimezone: true }).notNull(),
  dureeMin: integer("duree_min").notNull().default(60),
  places: integer("places").notNull().default(100),
  cibleNiveaux: jsonb("cible_niveaux").$type<string[]>().notNull().default([]),
  ciblePays: jsonb("cible_pays").$type<string[]>().notNull().default([]),
  cibleDomaines: jsonb("cible_domaines").$type<string[]>().notNull().default([]),
  criteres: jsonb("criteres").$type<string[]>().notNull().default([]), // metier, formation, admission, budget
  statut: text("statut").notNull().default("demande"), // demande, publie, refuse, annule
  forfaitMad: integer("forfait_mad"),
  paiementRef: text("paiement_ref"),
  naviAnnonce: boolean("navi_annonce").notNull().default(true),
  motifRefus: text("motif_refus"),
  salle: text("salle"),
  url: text("url"),
  demandePar: text("demande_par").references(() => users.id, { onDelete: "set null" }),
  validePar: text("valide_par").references(() => users.id, { onDelete: "set null" }),
  valideLe: timestamp("valide_le", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("salons_statut_debut_idx").on(t.statut, t.debut), index("salons_etab_idx").on(t.establishmentId)]);

export const salonInscriptions = pgTable("salon_inscriptions", {
  salonId: text("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accordContact: boolean("accord_contact").notNull().default(false), // l'élève accepte que l'école le recontacte
  accordParent: text("accord_parent").notNull().default("non_requis"), // non_requis, en_attente, accorde, refuse
  parentId: text("parent_id").references(() => users.id, { onDelete: "set null" }),
  viaNavi: boolean("via_navi").notNull().default(false),
  presentLe: timestamp("present_le", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.salonId, t.userId] })]);

export const salonQuestions = pgTable("salon_questions", {
  id: id(),
  salonId: text("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  texte: text("texte").notNull(),
  main: boolean("main").notNull().default(false), // « lever la main » : souhaite prendre la parole
  repondue: boolean("repondue").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("salon_questions_idx").on(t.salonId)]);

export const salonFiches = pgTable("salon_fiches", {
  id: id(),
  salonId: text("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  userIds: jsonb("user_ids").$type<string[]>().notNull().default([]),
  criteres: jsonb("criteres").$type<string[]>().notNull().default([]),
  prixUnitMad: integer("prix_unit_mad").notNull(),
  montantMad: integer("montant_mad").notNull(),
  statut: text("statut").notNull().default("en_attente"), // en_attente (commande), payee (fiches débloquées), annulee
  paiementRef: text("paiement_ref"),
  demandePar: text("demande_par").references(() => users.id, { onDelete: "set null" }),
  payeeLe: timestamp("payee_le", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("salon_fiches_salon_idx").on(t.salonId)]);
