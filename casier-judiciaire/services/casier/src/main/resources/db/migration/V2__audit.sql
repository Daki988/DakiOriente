-- ENF-12, SEC-07, ADR 0003 : journal chaîné par empreintes SHA-256, en ajout seul.
create table audit.journal (
    numero               bigint primary key,
    horodatage           timestamptz not null,
    acteur_id            text        not null,
    roles                text,
    action               text        not null,
    objet_type           text,
    objet_id             text,
    personne_concernee   text,
    finalite             text,
    details              jsonb       not null default '{}'::jsonb,
    empreinte_precedente text        not null check (length(empreinte_precedente) = 64),
    empreinte            text        not null unique check (length(empreinte) = 64)
);
create index journal_personne_idx on audit.journal (personne_concernee) where personne_concernee is not null;
create index journal_horodatage_idx on audit.journal (horodatage);

-- Tête de chaîne : une seule ligne, verrouillée à chaque écriture pour sérialiser la chaîne.
create table audit.tete_chaine (
    id        smallint primary key check (id = 1),
    numero    bigint not null,
    empreinte text   not null check (length(empreinte) = 64)
);
insert into audit.tete_chaine (id, numero, empreinte) values (1, 0, repeat('0', 64));

create function audit.refuser_modification() returns trigger language plpgsql as $$
begin
    raise exception 'SEC-07 : le journal d''audit est en ajout seul (% refusé sur %)', tg_op, tg_table_name;
end $$;

create trigger journal_ajout_seul before update or delete on audit.journal
    for each row execute function audit.refuser_modification();
create trigger journal_sans_vidage before truncate on audit.journal
    for each statement execute function audit.refuser_modification();
create trigger tete_sans_suppression before delete on audit.tete_chaine
    for each row execute function audit.refuser_modification();
create trigger tete_sans_vidage before truncate on audit.tete_chaine
    for each statement execute function audit.refuser_modification();
