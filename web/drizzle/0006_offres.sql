CREATE TABLE "offer_services" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"effect" text DEFAULT 'aucun' NOT NULL,
	"prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"establishment_id" text NOT NULL,
	"service_code" text NOT NULL,
	"months" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"amount" integer,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"payment_method" text,
	"payment_ref" text,
	"note" text,
	"created_by" text,
	"cancelled_at" timestamp with time zone,
	"reminded_30_at" timestamp with time zone,
	"reminded_7_at" timestamp with time zone,
	"expired_notice_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "featured_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "home_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_code_offer_services_code_fk" FOREIGN KEY ("service_code") REFERENCES "public"."offer_services"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_etab_idx" ON "subscriptions" USING btree ("establishment_id","ends_at");--> statement-breakpoint
INSERT INTO "offer_services" ("code", "name", "description", "effect", "prices", "position") VALUES
  ('premium', 'Premium', 'Sélection des candidats (résultats, projet, financement), vivier de candidats, campagnes de prospection (2 000 envois par mois). Mise en avant incluse.', 'premium', '[{"months":12,"amount":5000}]', 1),
  ('mise_en_avant', 'Mise en avant', 'Badge « Partenaire Navigoal », en tête de la liste des établissements, des pages villes et des résultats de formations, bandeau de l''accueil.', 'mise_en_avant', '[{"months":3,"amount":900},{"months":6,"amount":1600},{"months":12,"amount":2800}]', 2),
  ('une_accueil', 'À la une de l''accueil', 'Première place du bandeau « Écoles partenaires » de la page d''accueil, en grand format, en plus de la mise en avant.', 'une_accueil', '[{"months":1,"amount":1500},{"months":3,"amount":4000}]', 3),
  ('salons', 'Salons et tournées', 'Présence de l''école sur les salons et tournées Navigoal en Afrique (documentation, rencontres avec les familles). Suivi dans le back-office.', 'aucun', '[{"months":1,"amount":null}]', 4)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "establishments" SET "featured_until" = "premium_until" WHERE "plan" = 'premium' AND "premium_until" > now();
