-- ARC-01 : base propre à la vérification publique, limitée au jeton, au statut et à l'identité minimale (BUL-07).
create table verification.bulletin_verifiable (
    empreinte_jeton  text primary key check (length(empreinte_jeton) = 64),
    empreinte_code   text        not null unique check (length(empreinte_code) = 64),
    bulletin_id      uuid        not null unique,
    numero           text        not null,
    type             text        not null check (type in ('B1', 'B2', 'B3')),
    date_emission    timestamptz not null,
    date_expiration  timestamptz not null,
    revoque          boolean     not null default false,
    nom              text        not null,
    prenoms          text        not null,
    date_naissance   date,
    -- BUL-11 : compteur anonyme, sans adresse réseau ni identité du vérificateur.
    nb_verifications bigint      not null default 0
);
create index bulletin_verifiable_numero_idx on verification.bulletin_verifiable (numero);
