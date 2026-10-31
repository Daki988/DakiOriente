-- Reprise des écoles marquées « mises en avant » avec l'ancien interrupteur manuel (avant les abonnements) :
-- un abonnement « Mise en avant » de 12 mois, sans montant (à compléter ou arrêter dans Offres et abonnements).
INSERT INTO "subscriptions" ("id", "establishment_id", "service_code", "months", "starts_at", "ends_at", "amount", "currency", "payment_method", "note")
SELECT gen_random_uuid()::text, e."id", 'mise_en_avant', 12, now(), now() + interval '12 months', NULL, 'MAD', NULL,
  'Reprise de l''ancien marquage manuel « mis en avant » : montant et référence du règlement à compléter (ou arrêter).'
FROM "establishments" e
WHERE e."featured" = true AND NOT EXISTS (SELECT 1 FROM "subscriptions" s WHERE s."establishment_id" = e."id");
--> statement-breakpoint
UPDATE "establishments" e SET "featured_until" = s."ends_at", "featured" = true
FROM "subscriptions" s WHERE s."establishment_id" = e."id" AND s."service_code" = 'mise_en_avant' AND s."cancelled_at" IS NULL AND s."ends_at" > now() AND (e."featured_until" IS NULL OR e."featured_until" < s."ends_at");
--> statement-breakpoint
-- Ancien champ « plan » (gratuit / partenaire / premium) : désormais déduit des abonnements Premium.
UPDATE "establishments" SET "plan" = 'gratuit' WHERE "plan" <> 'premium' OR "premium_until" IS NULL OR "premium_until" < now();
--> statement-breakpoint
UPDATE "establishments" SET "featured" = false WHERE "featured" = true AND ("featured_until" IS NULL OR "featured_until" < now());
