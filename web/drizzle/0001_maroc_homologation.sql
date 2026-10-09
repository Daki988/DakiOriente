DROP INDEX "programs_etab_formation_idx";--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "recognition" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "faculty" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "campus" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "diploma" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "options" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "homologated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "homologation" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "programs_etab_title_idx" ON "programs" USING btree ("establishment_id","title","faculty");