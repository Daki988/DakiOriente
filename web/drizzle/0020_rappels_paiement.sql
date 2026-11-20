CREATE TABLE "rappels_paiement" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"enfant_id" text,
	"type" text NOT NULL,
	"libelle" text NOT NULL,
	"montant" integer,
	"devise" text DEFAULT 'MAD' NOT NULL,
	"frequence" text DEFAULT 'mensuel' NOT NULL,
	"premiere_echeance" text NOT NULL,
	"fin_le" text,
	"delai_jours" integer DEFAULT 3 NOT NULL,
	"aussi_le_jour" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'manuel' NOT NULL,
	"source_id" text,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rappels_paiement" ADD CONSTRAINT "rappels_paiement_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rappels_paiement" ADD CONSTRAINT "rappels_paiement_enfant_id_users_id_fk" FOREIGN KEY ("enfant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rappels_paiement_user_idx" ON "rappels_paiement" USING btree ("user_id");