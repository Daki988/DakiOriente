ALTER TABLE "appels" ALTER COLUMN "salle" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appels" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appels" ADD COLUMN "prevu_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appels" ADD COLUMN "duree_min" integer;--> statement-breakpoint
ALTER TABLE "appels" ADD COLUMN "objet" text;--> statement-breakpoint
ALTER TABLE "appels" ADD COLUMN "annule_le" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "appels_prevu_idx" ON "appels" USING btree ("prevu_le");