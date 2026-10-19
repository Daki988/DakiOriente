-- Réclamations des usagers et pièces justificatives déposées en ligne.
-- Aucune suppression physique : une réclamation se clôt, une pièce reste attachée à son dossier (REG-08).
create schema if not exists reclamations;

create sequence reclamations.numero_seq;

create table reclamations.reclamation (
    id             uuid primary key,
    numero         text        not null unique,
    demandeur_id   text        not null,
    numero_dossier text,
    categorie      text        not null check (categorie in ('PAIEMENT', 'BULLETIN_NON_RECU', 'ERREUR_CASIER', 'AUTRE')),
    message        text        not null check (length(message) between 10 and 2000),
    statut         text        not null check (statut in ('OUVERTE', 'EN_COURS', 'TRAITEE')),
    cree_le        timestamptz not null,
    pris_en_charge_par text,
    pris_en_charge_le  timestamptz,
    reponse        text,
    traite_par     text,
    traite_le      timestamptz,
    check (statut <> 'TRAITEE' or (reponse is not null and traite_par is not null and traite_le is not null))
);
create index reclamation_file_idx on reclamations.reclamation (statut, cree_le) where statut <> 'TRAITEE';
create index reclamation_demandeur_idx on reclamations.reclamation (demandeur_id, cree_le desc);

create function reclamations.refuser_suppression() returns trigger language plpgsql as $$
begin
    raise exception 'REG-08 : aucune suppression physique (% refusé sur %)', tg_op, tg_table_name;
end $$;
create trigger reclamation_sans_suppression before delete on reclamations.reclamation
    for each row execute function reclamations.refuser_suppression();
create trigger reclamation_sans_vidage before truncate on reclamations.reclamation
    for each statement execute function reclamations.refuser_suppression();

create table demandes.piece (
    id          uuid primary key,
    demande_id  uuid        not null references demandes.demande (id),
    nom_fichier text        not null,
    type_mime   text        not null check (type_mime in ('application/pdf', 'image/jpeg', 'image/png')),
    taille      integer     not null check (taille > 0 and taille <= 5242880),
    empreinte   text        not null check (length(empreinte) = 64),
    contenu     bytea       not null,
    depose_par  text        not null,
    depose_le   timestamptz not null
);
create index piece_demande_idx on demandes.piece (demande_id, depose_le);

create function demandes.refuser_modification_piece() returns trigger language plpgsql as $$
begin
    raise exception 'REG-08 : une pièce déposée ne se modifie ni ne se supprime (% refusé)', tg_op;
end $$;
create trigger piece_figee before update or delete on demandes.piece
    for each row execute function demandes.refuser_modification_piece();
