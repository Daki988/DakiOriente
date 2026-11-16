CREATE TABLE "accreditation_renouvellements" (
	"id" text PRIMARY KEY NOT NULL,
	"etablissement_id" text NOT NULL,
	"filiere" text NOT NULL,
	"composante" text DEFAULT '' NOT NULL,
	"fin" text NOT NULL,
	"arrete" text NOT NULL,
	"bulletin_officiel" text NOT NULL,
	"date_publication" text,
	"source" text,
	"statut" text NOT NULL,
	"origine" text NOT NULL,
	"par_id" text,
	"le" timestamp with time zone DEFAULT now() NOT NULL,
	"reporte" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accreditation_renouvellements" ADD CONSTRAINT "accreditation_renouvellements_par_id_users_id_fk" FOREIGN KEY ("par_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;