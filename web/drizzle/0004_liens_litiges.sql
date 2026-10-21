-- Les notifications de litige pointaient vers une page inexistante : elles renvoient désormais vers la section Litiges de la modération Navilease.
UPDATE "notifications" SET "link" = '/admin/navilease/#litiges' WHERE "link" LIKE '/admin/navilease/litiges/%';
