CREATE TABLE "devis_cachets" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"parametres" jsonb NOT NULL,
	"resume" jsonb NOT NULL,
	"eleve" text DEFAULT '' NOT NULL,
	"payeur" text DEFAULT '' NOT NULL,
	"empreinte" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "devis_cachets_date_idx" ON "devis_cachets" USING btree ("created_at");