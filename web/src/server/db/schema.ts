// Schéma Navigoal V1 (PostgreSQL, Drizzle). Voir docs/backend.md.
import { relations, sql } from "drizzle-orm";
import { boolean, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("users_role_idx").on(t.role)]);

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
  statut: text("statut").notNull(), // prive, prive_reconnu, inter_etats…
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
  plan: text("plan").notNull().default("gratuit"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("etab_pays_idx").on(t.pays)]);

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
  formationId: text("formation_id").notNull(), // ref_formations.id
  title: text("title").notNull(),
  description: text("description"),
  durationYears: integer("duration_years"),
  language: text("language").default("fr"),
  tuitionMin: integer("tuition_min"),
  tuitionMax: integer("tuition_max"),
  currency: text("currency"),
  feesConfirmed: boolean("fees_confirmed").notNull().default(false),
  applicationFee: integer("application_fee").notNull().default(0),
  admission: jsonb("admission").$type<{ series?: string[]; noteMin?: number; concours?: boolean; entretien?: boolean; prerequis?: string }>().notNull().default({}),
  requiredDocuments: jsonb("required_documents").$type<string[]>().notNull().default(["identite", "releve_notes", "diplome", "photo"]),
  seats: integer("seats"),
  startDate: text("start_date"),
  active: boolean("active").notNull().default(true),
  indicative: boolean("indicative").notNull().default(true), // importé depuis le référentiel, à confirmer
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("programs_etab_idx").on(t.establishmentId), uniqueIndex("programs_etab_formation_idx").on(t.establishmentId, t.formationId)]);

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
export const documentTypeEnum = pgEnum("document_type", ["identite", "acte_naissance", "diplome", "releve_notes", "certificat", "photo", "attestation_admission", "attestation_scolarite", "piece_garant", "justificatif_ressources", "kyc_identite", "kyc_propriete", "autre"]);
export const documents = pgTable("documents", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  label: text("label"),
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
  createdAt: createdAt(),
}, (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)]);

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
