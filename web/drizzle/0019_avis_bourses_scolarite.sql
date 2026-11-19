CREATE TABLE "avis_etablissements" (
	"id" text PRIMARY KEY NOT NULL,
	"auteur_id" text NOT NULL,
	"etablissement_id" text NOT NULL,
	"formation" text,
	"campus" text,
	"annee" text NOT NULL,
	"notes" jsonb NOT NULL,
	"recommande" boolean NOT NULL,
	"points_forts" text NOT NULL,
	"points_faibles" text NOT NULL,
	"frais_declares" integer,
	"affichage" text DEFAULT 'prenom' NOT NULL,
	"verification" text NOT NULL,
	"application_id" text,
	"justificatif_id" text,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"motif" text,
	"modere_par" text,
	"modere_le" timestamp with time zone,
	"reponse" text,
	"reponse_statut" text,
	"reponse_le" timestamp with time zone,
	"reponse_par_id" text,
	"publie_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avis_service" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"note" integer NOT NULL,
	"temoignage" text,
	"publier" boolean DEFAULT false NOT NULL,
	"affichage" text DEFAULT 'prenom' NOT NULL,
	"statut" text DEFAULT 'sans_temoignage' NOT NULL,
	"motif" text,
	"modere_par" text,
	"modere_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avis_service_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "avis_signalements" (
	"id" text PRIMARY KEY NOT NULL,
	"avis_id" text NOT NULL,
	"auteur_id" text,
	"motif" text NOT NULL,
	"statut" text DEFAULT 'ouvert' NOT NULL,
	"traite_par" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bourses_suivies" (
	"user_id" text NOT NULL,
	"bourse_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bourses_suivies_user_id_bourse_id_pk" PRIMARY KEY("user_id","bourse_id")
);
--> statement-breakpoint
CREATE TABLE "echeanciers_scolarite" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"etablissement_id" text NOT NULL,
	"devise" text DEFAULT 'MAD' NOT NULL,
	"lignes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"remboursement" text,
	"inscription_confirmee" timestamp with time zone,
	"cree_par" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "echeanciers_scolarite_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "moyens_paiement_ecoles" (
	"id" text PRIMARY KEY NOT NULL,
	"etablissement_id" text NOT NULL,
	"type" text NOT NULL,
	"libelle" text NOT NULL,
	"details" text NOT NULL,
	"devise" text DEFAULT 'MAD' NOT NULL,
	"statut" text DEFAULT 'a_verifier' NOT NULL,
	"verifie_par" text,
	"verifie_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paiements_scolarite" (
	"id" text PRIMARY KEY NOT NULL,
	"echeancier_id" text NOT NULL,
	"ligne_id" text NOT NULL,
	"payeur_id" text NOT NULL,
	"montant" integer NOT NULL,
	"devise" text NOT NULL,
	"moyen_id" text,
	"reference" text,
	"preuve_id" text,
	"statut" text DEFAULT 'declare' NOT NULL,
	"motif" text,
	"confirme_par" text,
	"confirme_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "avis_etablissements" ADD CONSTRAINT "avis_etablissements_auteur_id_users_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_etablissements" ADD CONSTRAINT "avis_etablissements_etablissement_id_establishments_id_fk" FOREIGN KEY ("etablissement_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_etablissements" ADD CONSTRAINT "avis_etablissements_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_etablissements" ADD CONSTRAINT "avis_etablissements_modere_par_users_id_fk" FOREIGN KEY ("modere_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_etablissements" ADD CONSTRAINT "avis_etablissements_reponse_par_id_users_id_fk" FOREIGN KEY ("reponse_par_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_service" ADD CONSTRAINT "avis_service_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_service" ADD CONSTRAINT "avis_service_modere_par_users_id_fk" FOREIGN KEY ("modere_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_signalements" ADD CONSTRAINT "avis_signalements_avis_id_avis_etablissements_id_fk" FOREIGN KEY ("avis_id") REFERENCES "public"."avis_etablissements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_signalements" ADD CONSTRAINT "avis_signalements_auteur_id_users_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avis_signalements" ADD CONSTRAINT "avis_signalements_traite_par_users_id_fk" FOREIGN KEY ("traite_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bourses_suivies" ADD CONSTRAINT "bourses_suivies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "echeanciers_scolarite" ADD CONSTRAINT "echeanciers_scolarite_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "echeanciers_scolarite" ADD CONSTRAINT "echeanciers_scolarite_etablissement_id_establishments_id_fk" FOREIGN KEY ("etablissement_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "echeanciers_scolarite" ADD CONSTRAINT "echeanciers_scolarite_cree_par_users_id_fk" FOREIGN KEY ("cree_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyens_paiement_ecoles" ADD CONSTRAINT "moyens_paiement_ecoles_etablissement_id_establishments_id_fk" FOREIGN KEY ("etablissement_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moyens_paiement_ecoles" ADD CONSTRAINT "moyens_paiement_ecoles_verifie_par_users_id_fk" FOREIGN KEY ("verifie_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_scolarite" ADD CONSTRAINT "paiements_scolarite_echeancier_id_echeanciers_scolarite_id_fk" FOREIGN KEY ("echeancier_id") REFERENCES "public"."echeanciers_scolarite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_scolarite" ADD CONSTRAINT "paiements_scolarite_payeur_id_users_id_fk" FOREIGN KEY ("payeur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_scolarite" ADD CONSTRAINT "paiements_scolarite_moyen_id_moyens_paiement_ecoles_id_fk" FOREIGN KEY ("moyen_id") REFERENCES "public"."moyens_paiement_ecoles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiements_scolarite" ADD CONSTRAINT "paiements_scolarite_confirme_par_users_id_fk" FOREIGN KEY ("confirme_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "avis_etab_unique" ON "avis_etablissements" USING btree ("auteur_id","etablissement_id","annee");--> statement-breakpoint
CREATE INDEX "avis_etab_idx" ON "avis_etablissements" USING btree ("etablissement_id","statut");--> statement-breakpoint
CREATE INDEX "avis_service_statut_idx" ON "avis_service" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "avis_signal_avis_idx" ON "avis_signalements" USING btree ("avis_id");--> statement-breakpoint
CREATE INDEX "moyens_paiement_etab_idx" ON "moyens_paiement_ecoles" USING btree ("etablissement_id");--> statement-breakpoint
CREATE INDEX "paiements_scol_ech_idx" ON "paiements_scolarite" USING btree ("echeancier_id");