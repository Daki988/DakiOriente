ALTER TABLE "applications" ADD COLUMN "campus" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "campuses" jsonb DEFAULT '[]'::jsonb NOT NULL;