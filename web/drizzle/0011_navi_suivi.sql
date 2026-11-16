CREATE TABLE "navi_cache" (
	"cle" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"reponse" text NOT NULL,
	"cartes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expire" timestamp with time zone NOT NULL,
	"servie" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navi_traces" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"role" text,
	"page" text,
	"question" text NOT NULL,
	"reponse" text DEFAULT '' NOT NULL,
	"outils" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cartes" integer DEFAULT 0 NOT NULL,
	"route" text NOT NULL,
	"modele" text,
	"tours" integer DEFAULT 0 NOT NULL,
	"entree" integer DEFAULT 0 NOT NULL,
	"sortie" integer DEFAULT 0 NOT NULL,
	"cache_lu" integer DEFAULT 0 NOT NULL,
	"cache_ecrit" integer DEFAULT 0 NOT NULL,
	"cout_usd" double precision DEFAULT 0 NOT NULL,
	"duree_ms" integer DEFAULT 0 NOT NULL,
	"statut" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "navi_traces" ADD CONSTRAINT "navi_traces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "navi_traces_at_idx" ON "navi_traces" USING btree ("at");