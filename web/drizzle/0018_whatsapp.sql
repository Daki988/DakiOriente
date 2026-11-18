CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"user_id" text,
	"role" text NOT NULL,
	"texte" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_messages_num_idx" ON "whatsapp_messages" USING btree ("numero","at");