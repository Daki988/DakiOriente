-- HAB-05 : déclarations d'intérêts (un agent ne traite pas le casier d'un proche).
create table habilitations.declaration_interet (
    acteur_id   text        not null,
    personne_id uuid        not null,
    declaree_le timestamptz not null default now(),
    primary key (acteur_id, personne_id)
);

-- RG-02, ADM-03 : finalités du bulletin n°2 autorisées par organisme, avec période de validité.
create table habilitations.finalite_b2 (
    id        bigint generated always as identity primary key,
    organisme text    not null,
    code      text    not null,
    libelle   text    not null,
    valide_du date    not null,
    valide_au date,
    active    boolean not null default true,
    unique (organisme, code, valide_du),
    check (valide_au is null or valide_au >= valide_du)
);
