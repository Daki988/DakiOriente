CREATE TABLE "presences" (
	"visitor" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"depuis" timestamp with time zone DEFAULT now() NOT NULL,
	"path" text NOT NULL,
	"service" text NOT NULL,
	"country" text,
	"source" text NOT NULL,
	"device" text NOT NULL,
	"role" text,
	"pages" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "presences_at_idx" ON "presences" USING btree ("at");