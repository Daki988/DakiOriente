-- Bulletins émis (section 13) : contenu figé, empreintes du jeton et du code seulement (ADR 0004).
create sequence bulletins.numero_seq;

create table bulletins.bulletin (
    id                uuid primary key,
    numero            text        not null unique,
    type              text        not null check (type in ('B1', 'B2', 'B3')),
    demande_id        uuid,
    -- Nulle pour un bulletin « néant » d'une personne absente du casier (absence certaine, IDT-03).
    personne_id       uuid,
    nom               text        not null,
    prenoms           text        not null,
    date_naissance    date,
    etat_casier_au    timestamptz not null,
    contenu           jsonb       not null,
    neant             boolean     not null,
    version_regles    integer     not null,
    empreinte_contenu text        not null check (length(empreinte_contenu) = 64),
    empreinte_jeton   text        not null unique check (length(empreinte_jeton) = 64),
    empreinte_code    text        not null unique check (length(empreinte_code) = 64),
    date_emission     timestamptz not null,
    date_expiration   timestamptz not null,
    statut            text        not null check (statut in ('EMIS', 'REVOQUE')),
    emis_par          text        not null,
    finalite          text,
    revoque_par       text,
    revoque_le        timestamptz,
    motif_revocation  text,
    -- BUL-10 : motif obligatoire pour une révocation.
    check (statut = 'EMIS' or (revoque_par is not null and motif_revocation is not null))
);
create index bulletin_personne_idx on bulletins.bulletin (personne_id);
