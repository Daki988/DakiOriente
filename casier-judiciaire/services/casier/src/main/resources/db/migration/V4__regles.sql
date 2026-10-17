-- ADR 0005, ADM-05 : jeux de règles juridiques versionnés, proposés puis validés par un magistrat distinct.
create table regles.jeu_de_regles (
    id          uuid primary key,
    version     integer     not null unique,
    date_effet  date        not null,
    statut      text        not null check (statut in ('PROPOSE', 'PUBLIE', 'REJETE')),
    propose_par text        not null,
    propose_le  timestamptz not null,
    valide_par  text,
    valide_le   timestamptz,
    motif_rejet text,
    fictif      boolean     not null,
    contenu     jsonb       not null,
    cas_de_test jsonb       not null default '[]'::jsonb,
    check (statut = 'PROPOSE' or valide_par is not null),
    -- Quatre yeux, sauf pour le jeu initial chargé par la fonction d'import (ADM-22).
    check (valide_par is null or valide_par <> propose_par or propose_par like 'import:%')
);
create index jeu_de_regles_publie_idx on regles.jeu_de_regles (date_effet desc, version desc) where statut = 'PUBLIE';
