CREATE TABLE "navi_suivi" (
	"user_id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "navi_suivi" ADD CONSTRAINT "navi_suivi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;