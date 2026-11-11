-- Candidatures gratuites : plus aucun frais de dossier.
UPDATE "programs" SET "application_fee" = 0 WHERE "application_fee" <> 0;--> statement-breakpoint
UPDATE "payments" SET "status" = 'annule' WHERE "kind" = 'frais_candidature' AND "status" IN ('initie', 'en_attente');
