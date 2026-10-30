CREATE TYPE "public"."invitation_status" AS ENUM('envoyee', 'lue', 'interessee', 'refusee');--> statement-breakpoint
CREATE TYPE "public"."prospect_status" AS ENUM('en_validation', 'validee', 'refusee', 'envoyee');--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"prospection_id" text NOT NULL,
	"establishment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" "invitation_status" DEFAULT 'envoyee' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospections" (
	"id" text PRIMARY KEY NOT NULL,
	"establishment_id" text NOT NULL,
	"author_id" text,
	"offer" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "prospect_status" DEFAULT 'en_validation' NOT NULL,
	"review_note" text,
	"audience" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "premium_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "assisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "landlords" ADD COLUMN "assisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "on_behalf_of" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "internal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "average" double precision;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "mention" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "bac_year" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "average_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "target_jobs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "start_year" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "funding" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "visible_to_schools" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "visible_to_schools_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "parent_consent_visibility_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_prospection_id_prospections_id_fk" FOREIGN KEY ("prospection_id") REFERENCES "public"."prospections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospections" ADD CONSTRAINT "prospections_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospections" ADD CONSTRAINT "prospections_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_student_idx" ON "invitations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "invitations_etab_idx" ON "invitations" USING btree ("establishment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pair_idx" ON "invitations" USING btree ("prospection_id","student_id");--> statement-breakpoint
CREATE INDEX "prospections_etab_idx" ON "prospections" USING btree ("establishment_id");