ALTER TYPE "public"."document_type" ADD VALUE 'fiche_candidature';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'releve_bac';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'cv';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'lettre_motivation';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'prise_en_charge';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'equivalence_bac';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'certificat_medical';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'test_langue';--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"day" text NOT NULL,
	"path" text NOT NULL,
	"service" text NOT NULL,
	"country" text,
	"source" text NOT NULL,
	"device" text NOT NULL,
	"visitor" text NOT NULL,
	"connected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "required_documents" SET DEFAULT '["identite","photo","acte_naissance","releve_notes"]'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "dossier" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "pv_day_idx" ON "page_views" USING btree ("day");--> statement-breakpoint
CREATE INDEX "pv_at_idx" ON "page_views" USING btree ("at");--> statement-breakpoint
-- Liste standard Navigoal : le diplôme du bac n'est plus exigé à la candidature (les élèves de terminale candidatent avant les résultats).
UPDATE "programs" SET "required_documents" = '["identite","photo","acte_naissance","releve_notes"]'::jsonb WHERE "required_documents" = '["identite","releve_notes","diplome","photo"]'::jsonb;
