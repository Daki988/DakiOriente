ALTER TABLE "salons" ADD COLUMN "cree_par_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "invites_envoyees" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "invites_le" timestamp with time zone;