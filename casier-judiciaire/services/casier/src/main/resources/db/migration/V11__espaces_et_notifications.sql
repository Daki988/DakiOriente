-- DSH-01 : coordonnées de l'usager pour les avis ; NOT-01 à NOT-04 : avis envoyés (simulés hors production).
alter table demandes.demande add column telephone text;
alter table demandes.demande add column email text;
create index demande_demandeur_idx on demandes.demande (demandeur_id, cree_le desc);

create table demandes.notification (
    id          bigint generated always as identity primary key,
    demande_id  uuid        not null references demandes.demande (id),
    canal       text        not null check (canal in ('SMS', 'EMAIL')),
    destination text        not null,
    message     text        not null,
    statut      text        not null check (statut in ('SIMULE', 'ENVOYE', 'ECHEC')),
    cree_le     timestamptz not null
);
create index notification_demande_idx on demandes.notification (demande_id, cree_le);
