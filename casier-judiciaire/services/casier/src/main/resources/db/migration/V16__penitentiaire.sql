-- Gestion pénitentiaire : établissements, écrous, situation pénale, mouvements et libérations.
-- Aucune suppression : un écrou se lève par une libération, un mouvement se clôt ou s'annule (REG-08).
create schema if not exists penitentiaire;

create table penitentiaire.etablissement (
    code      text primary key,
    nom       text    not null,
    ville     text    not null,
    province  text    not null,
    type      text    not null check (type in ('MAISON_ARRET', 'CENTRE_PENITENTIAIRE', 'PRISON_CENTRALE')),
    capacite  integer not null check (capacite > 0)
);

-- Référentiel de démonstration : capacités indicatives, à remplacer par les données de la direction pénitentiaire.
insert into penitentiaire.etablissement(code, nom, ville, province, type, capacite) values
    ('LBV-PC-01', 'Prison centrale de Libreville', 'Libreville', 'Estuaire', 'PRISON_CENTRALE', 500),
    ('FCV-CP-01', 'Centre pénitentiaire de Franceville', 'Franceville', 'Haut-Ogooué', 'CENTRE_PENITENTIAIRE', 250),
    ('POG-MA-01', 'Maison d''arrêt de Port-Gentil', 'Port-Gentil', 'Ogooué-Maritime', 'MAISON_ARRET', 200),
    ('OYM-MA-01', 'Maison d''arrêt d''Oyem', 'Oyem', 'Woleu-Ntem', 'MAISON_ARRET', 150),
    ('MUI-CP-01', 'Centre pénitentiaire de Mouila', 'Mouila', 'Ngounié', 'CENTRE_PENITENTIAIRE', 150),
    ('LBQ-MA-01', 'Maison d''arrêt de Lambaréné', 'Lambaréné', 'Moyen-Ogooué', 'MAISON_ARRET', 120);

create sequence penitentiaire.ecrou_seq;

create table penitentiaire.detenu (
    id                     uuid primary key,
    numero_ecrou           text        not null unique,
    nom                    text        not null,
    prenoms                text        not null,
    date_naissance         date        not null,
    lieu_naissance         text        not null,
    nationalite            text        not null,
    etablissement          text        not null references penitentiaire.etablissement (code),
    quartier               text,
    statut                 text        not null check (statut in ('PREVENU', 'CONDAMNE', 'LIBERE')),
    titre_detention        text        not null check (titre_detention in ('MANDAT_DEPOT', 'JUGEMENT', 'ARRET', 'CONTRAINTE')),
    reference_titre        text        not null,
    juridiction            text        not null,
    infraction             text        not null,
    date_ecrou             date        not null,
    date_debut_peine       date,
    duree_peine_mois       integer     check (duree_peine_mois is null or duree_peine_mois > 0),
    reduction_jours        integer     not null default 0 check (reduction_jours >= 0),
    date_liberation_prevue date,
    date_liberation        date,
    motif_liberation       text,
    ecroue_par             text        not null,
    ecroue_le              timestamptz not null,
    check (statut <> 'CONDAMNE' or (date_debut_peine is not null and duree_peine_mois is not null)),
    check (statut <> 'LIBERE' or (date_liberation is not null and motif_liberation is not null))
);
create index detenu_etablissement_idx on penitentiaire.detenu (etablissement, statut);
create index detenu_nom_idx on penitentiaire.detenu (nom, prenoms);

create table penitentiaire.mouvement (
    id            uuid primary key,
    detenu_id     uuid        not null references penitentiaire.detenu (id),
    type          text        not null check (type in ('TRANSFERT', 'EXTRACTION_JUDICIAIRE', 'EXTRACTION_MEDICALE', 'PERMISSION')),
    origine       text        not null references penitentiaire.etablissement (code),
    destination   text        not null,
    motif         text        not null,
    prevu_le      timestamptz not null,
    retour_prevu  timestamptz,
    statut        text        not null check (statut in ('DEMANDE', 'AUTORISE', 'EN_COURS', 'TERMINE', 'REFUSE', 'ANNULE')),
    demande_par   text        not null,
    autorise_par  text,
    depart_le     timestamptz,
    retour_le     timestamptz,
    observation   text,
    check (autorise_par is null or autorise_par <> demande_par)
);
create index mouvement_statut_idx on penitentiaire.mouvement (statut, prevu_le);
create index mouvement_detenu_idx on penitentiaire.mouvement (detenu_id, prevu_le);

create function penitentiaire.refuser_suppression() returns trigger language plpgsql as $$
begin
    raise exception 'REG-08 : aucune suppression physique (% refusé sur %)', tg_op, tg_table_name;
end $$;
create trigger detenu_sans_suppression before delete on penitentiaire.detenu for each row execute function penitentiaire.refuser_suppression();
create trigger mouvement_sans_suppression before delete on penitentiaire.mouvement for each row execute function penitentiaire.refuser_suppression();
create trigger detenu_sans_vidage before truncate on penitentiaire.detenu for each statement execute function penitentiaire.refuser_suppression();
create trigger mouvement_sans_vidage before truncate on penitentiaire.mouvement for each statement execute function penitentiaire.refuser_suppression();
