CREATE TABLE "salon_fiches" (
	"id" text PRIMARY KEY NOT NULL,
	"salon_id" text NOT NULL,
	"establishment_id" text NOT NULL,
	"user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"criteres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prix_unit_mad" integer NOT NULL,
	"montant_mad" integer NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"paiement_ref" text,
	"demande_par" text,
	"payee_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_inscriptions" (
	"salon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"accord_contact" boolean DEFAULT false NOT NULL,
	"accord_parent" text DEFAULT 'non_requis' NOT NULL,
	"parent_id" text,
	"via_navi" boolean DEFAULT false NOT NULL,
	"present_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salon_inscriptions_salon_id_user_id_pk" PRIMARY KEY("salon_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "salon_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"salon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"texte" text NOT NULL,
	"main" boolean DEFAULT false NOT NULL,
	"repondue" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salons" (
	"id" text PRIMARY KEY NOT NULL,
	"establishment_id" text NOT NULL,
	"titre" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"programme" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"presentateurs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"debut" timestamp with time zone NOT NULL,
	"duree_min" integer DEFAULT 60 NOT NULL,
	"places" integer DEFAULT 100 NOT NULL,
	"cible_niveaux" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cible_pays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cible_domaines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"criteres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"statut" text DEFAULT 'demande' NOT NULL,
	"forfait_mad" integer,
	"paiement_ref" text,
	"navi_annonce" boolean DEFAULT true NOT NULL,
	"motif_refus" text,
	"salle" text,
	"url" text,
	"demande_par" text,
	"valide_par" text,
	"valide_le" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salon_fiches" ADD CONSTRAINT "salon_fiches_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_fiches" ADD CONSTRAINT "salon_fiches_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_fiches" ADD CONSTRAINT "salon_fiches_demande_par_users_id_fk" FOREIGN KEY ("demande_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_inscriptions" ADD CONSTRAINT "salon_inscriptions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_inscriptions" ADD CONSTRAINT "salon_inscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_inscriptions" ADD CONSTRAINT "salon_inscriptions_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_questions" ADD CONSTRAINT "salon_questions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_questions" ADD CONSTRAINT "salon_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_demande_par_users_id_fk" FOREIGN KEY ("demande_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_valide_par_users_id_fk" FOREIGN KEY ("valide_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "salon_fiches_salon_idx" ON "salon_fiches" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "salon_questions_idx" ON "salon_questions" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "salons_statut_debut_idx" ON "salons" USING btree ("statut","debut");--> statement-breakpoint
CREATE INDEX "salons_etab_idx" ON "salons" USING btree ("establishment_id");--> statement-breakpoint
INSERT INTO "offer_services" ("code", "name", "description", "effect", "prices", "position") VALUES
  ('salon_virtuel', 'Salon virtuel', 'Présentation en direct de l''école : page publique, inscriptions, rappels, invitations par Navi aux élèves ciblés, salle jusqu''à 2 h, bilan de présence. Forfait par salon, fixé à la validation.', 'aucun', '[{"months":1,"amount":null}]', 5),
  ('fiche_contact', 'Fiche contact (salon)', 'Fiche d''un participant qui accepte d''être recontacté (accord du parent pour un mineur). Prix de base par fiche, +25 % en cascade par critère de ciblage.', 'aucun', '[{"months":0,"amount":117}]', 6)
ON CONFLICT ("code") DO NOTHING;
