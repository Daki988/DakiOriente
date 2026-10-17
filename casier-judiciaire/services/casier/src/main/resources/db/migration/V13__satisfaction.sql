-- Avis de satisfaction des usagers (inspiré de GOV.UK et de Services Publics+) : note de 1 à 5 et commentaire facultatif,
-- anonymes ; aucun lien avec le dossier ni avec l'usager (DON-02). Conservés en ajout seul.
create table demandes.avis_satisfaction (
    id          uuid primary key,
    note        smallint    not null check (note between 1 and 5),
    commentaire text        check (length(commentaire) <= 1000),
    parcours    text        not null check (parcours in ('DEMANDE', 'SUIVI', 'TRESOR', 'VERIFICATION')),
    cree_le     timestamptz not null
);
