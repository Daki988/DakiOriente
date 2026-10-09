CREATE TYPE "public"."application_status" AS ENUM('brouillon', 'soumise', 'paiement_confirme', 'en_verification', 'complet', 'en_traitement', 'piece_demandee', 'acceptee', 'refusee', 'liste_attente', 'desistee');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('demande', 'confirme', 'termine', 'annule');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('demande', 'acceptee', 'attente_garant', 'paiement_sequestre', 'contrat_signe', 'entree', 'fonds_verses', 'en_cours', 'preavis', 'sortie', 'caution_restituee', 'refusee', 'annulee', 'litige');--> statement-breakpoint
CREATE TYPE "public"."campaign_kind" AS ENUM('admission', 'concours', 'inscription', 'bourse', 'portes_ouvertes', 'evenement');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('ouvert', 'en_mediation', 'resolu', 'clos');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('identite', 'acte_naissance', 'diplome', 'releve_notes', 'certificat', 'photo', 'attestation_admission', 'attestation_scolarite', 'piece_garant', 'justificatif_ressources', 'kyc_identite', 'kyc_propriete', 'autre');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('aucun', 'bloque', 'libere', 'rembourse', 'litige');--> statement-breakpoint
CREATE TYPE "public"."establishment_status" AS ENUM('importe', 'revendique', 'verifie', 'suspendu');--> statement-breakpoint
CREATE TYPE "public"."guardian_status" AS ENUM('invite', 'actif', 'refuse');--> statement-breakpoint
CREATE TYPE "public"."housing_status" AS ENUM('brouillon', 'en_moderation', 'publie', 'refuse', 'archive');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('non_soumis', 'en_revue', 'valide', 'refuse');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('login', 'verify_phone', 'verify_email', 'reset_password');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('frais_candidature', 'reservation', 'caution', 'loyer', 'service');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initie', 'en_attente', 'reussi', 'echoue', 'rembourse', 'annule');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('eleve', 'etudiant', 'parent', 'etablissement', 'bailleur', 'conseiller', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('actif', 'en_attente', 'suspendu');--> statement-breakpoint
CREATE TYPE "public"."verification_level" AS ENUM('non_verifie', 'identite', 'visite', 'partenaire');--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"status" "application_status" NOT NULL,
	"note" text,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"student_id" text NOT NULL,
	"program_id" text NOT NULL,
	"establishment_id" text NOT NULL,
	"campaign_id" text,
	"status" "application_status" DEFAULT 'brouillon' NOT NULL,
	"motivation" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"document_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requested_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decision_note" text,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"counselor_id" text,
	"topic" text NOT NULL,
	"preferred_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"channel" text DEFAULT 'visio' NOT NULL,
	"status" "appointment_status" DEFAULT 'demande' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"cover" text,
	"pays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_id" text,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"status" "booking_status" NOT NULL,
	"note" text,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"housing_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"landlord_id" text NOT NULL,
	"guarantor_id" text,
	"guarantor_approved_at" timestamp with time zone,
	"status" "booking_status" DEFAULT 'demande' NOT NULL,
	"start_date" text NOT NULL,
	"months" integer NOT NULL,
	"rent" integer NOT NULL,
	"charges" integer NOT NULL,
	"deposit" integer NOT NULL,
	"service_fee" integer NOT NULL,
	"currency" text NOT NULL,
	"message" text,
	"document_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contract" jsonb,
	"check_in" jsonb,
	"check_out" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"establishment_id" text NOT NULL,
	"kind" "campaign_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"program_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"seats" integer,
	"conditions" text,
	"required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"context_kind" text,
	"context_id" text,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"opened_by_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'ouvert' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"type" "document_type" NOT NULL,
	"label" text,
	"file_name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"status" text DEFAULT 'depose' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "establishment_members" (
	"user_id" text NOT NULL,
	"establishment_id" text NOT NULL,
	"role" text DEFAULT 'gestionnaire' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "establishment_members_user_id_establishment_id_pk" PRIMARY KEY("user_id","establishment_id")
);
--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"sigle" text NOT NULL,
	"pays" text NOT NULL,
	"ville" text NOT NULL,
	"type" text NOT NULL,
	"type_libelle" text NOT NULL,
	"statut" text NOT NULL,
	"site_web" text,
	"annee_creation" integer,
	"lat" double precision,
	"lng" double precision,
	"description" text,
	"email" text,
	"phone" text,
	"logo" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "establishment_status" DEFAULT 'importe' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"plan" text DEFAULT 'gratuit' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"item_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_kind_item_id_pk" PRIMARY KEY("user_id","kind","item_id")
);
--> statement-breakpoint
CREATE TABLE "guardianships" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"child_id" text NOT NULL,
	"invite_email" text,
	"invite_phone" text,
	"invite_code" text,
	"relation" text DEFAULT 'parent' NOT NULL,
	"status" "guardian_status" DEFAULT 'invite' NOT NULL,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housing_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housings" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"pays" text NOT NULL,
	"ville" text NOT NULL,
	"quartier" text,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"rent" integer NOT NULL,
	"charges" integer DEFAULT 0 NOT NULL,
	"deposit" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"surface" integer,
	"rooms" integer,
	"capacity" integer DEFAULT 1 NOT NULL,
	"gender" text DEFAULT 'mixte' NOT NULL,
	"furnished" boolean DEFAULT true NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rules" text,
	"min_months" integer DEFAULT 1 NOT NULL,
	"available_from" text,
	"near_establishments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "housing_status" DEFAULT 'brouillon' NOT NULL,
	"verification" "verification_level" DEFAULT 'non_verifie' NOT NULL,
	"moderation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlords" (
	"user_id" text PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'particulier' NOT NULL,
	"company" text,
	"kyc_status" "kyc_status" DEFAULT 'non_soumis' NOT NULL,
	"kyc_document_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kyc_note" text,
	"payout_method" text,
	"payout_account" text,
	"partner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"masked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"channels" jsonb DEFAULT '["app"]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orientation_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"answers" jsonb NOT NULL,
	"scores" jsonb NOT NULL,
	"top" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text,
	"logo" text,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"payer_id" text NOT NULL,
	"beneficiary_id" text,
	"kind" "payment_kind" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"provider" text NOT NULL,
	"method" text NOT NULL,
	"status" "payment_status" DEFAULT 'initie' NOT NULL,
	"escrow" "escrow_status" DEFAULT 'aucun' NOT NULL,
	"provider_ref" text,
	"application_id" text,
	"booking_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paid_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"level" text,
	"serie" text,
	"current_school" text,
	"diploma" text,
	"domain" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"goals" text,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"riasec" jsonb,
	"avatar_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"establishment_id" text NOT NULL,
	"formation_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_years" integer,
	"language" text DEFAULT 'fr',
	"tuition_min" integer,
	"tuition_max" integer,
	"currency" text,
	"fees_confirmed" boolean DEFAULT false NOT NULL,
	"application_fee" integer DEFAULT 0 NOT NULL,
	"admission" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required_documents" jsonb DEFAULT '["identite","releve_notes","diplome","photo"]'::jsonb NOT NULL,
	"seats" integer,
	"start_date" text,
	"active" boolean DEFAULT true NOT NULL,
	"indicative" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_competences" (
	"id" text PRIMARY KEY NOT NULL,
	"libelle" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_domaines" (
	"id" text PRIMARY KEY NOT NULL,
	"libelle" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_formations" (
	"id" text PRIMARY KEY NOT NULL,
	"intitule" text NOT NULL,
	"domaine" text,
	"data" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_metiers" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"domaine" text,
	"data" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_pays" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_series" (
	"id" text PRIMARY KEY NOT NULL,
	"pays" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"referentiel" text NOT NULL,
	"action" text NOT NULL,
	"item_id" text,
	"before" jsonb,
	"after" jsonb,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"housing_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"author_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"quote" text NOT NULL,
	"pays" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"role" "role" NOT NULL,
	"status" "user_status" DEFAULT 'actif' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_year" integer,
	"country" text,
	"city" text,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"totp_secret" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_counselor_id_users_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_housing_id_housings_id_fk" FOREIGN KEY ("housing_id") REFERENCES "public"."housings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guarantor_id_users_id_fk" FOREIGN KEY ("guarantor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_id_users_id_fk" FOREIGN KEY ("opened_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishment_members" ADD CONSTRAINT "establishment_members_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardianships" ADD CONSTRAINT "guardianships_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardianships" ADD CONSTRAINT "guardianships_child_id_users_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housing_alerts" ADD CONSTRAINT "housing_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housings" ADD CONSTRAINT "housings_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landlords" ADD CONSTRAINT "landlords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orientation_results" ADD CONSTRAINT "orientation_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ref_versions" ADD CONSTRAINT "ref_versions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_housing_id_housings_id_fk" FOREIGN KEY ("housing_id") REFERENCES "public"."housings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_student_idx" ON "applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "applications_etab_idx" ON "applications" USING btree ("establishment_id","status");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_tenant_idx" ON "bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "bookings_landlord_idx" ON "bookings" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "documents_owner_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "etab_pays_idx" ON "establishments" USING btree ("pays");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_pair_idx" ON "guardianships" USING btree ("parent_id","child_id");--> statement-breakpoint
CREATE INDEX "housings_city_idx" ON "housings" USING btree ("pays","ville","status");--> statement-breakpoint
CREATE INDEX "messages_conv_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "otp_target_idx" ON "otp_codes" USING btree ("target","purpose");--> statement-breakpoint
CREATE INDEX "payments_payer_idx" ON "payments" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "programs_etab_idx" ON "programs" USING btree ("establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_etab_formation_idx" ON "programs" USING btree ("establishment_id","formation_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");