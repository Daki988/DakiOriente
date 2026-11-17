CREATE TABLE "appels" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"salle" text NOT NULL,
	"url" text NOT NULL,
	"audio_seul" boolean DEFAULT false NOT NULL,
	"cree_par" text NOT NULL,
	"expire" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appels" ADD CONSTRAINT "appels_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appels" ADD CONSTRAINT "appels_cree_par_users_id_fk" FOREIGN KEY ("cree_par") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appels_conv_idx" ON "appels" USING btree ("conversation_id");