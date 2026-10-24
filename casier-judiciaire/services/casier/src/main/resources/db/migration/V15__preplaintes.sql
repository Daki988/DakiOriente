-- Pré-plaintes en ligne : déclaration des faits par la victime, puis signature de la plainte lors d'un rendez-vous.
-- Aucune suppression : une pré-plainte non signée passe à l'état EXPIREE (REG-08).
create schema if not exists preplaintes;

create sequence preplaintes.numero_seq;

create table preplaintes.preplainte (
    id                uuid primary key,
    numero            text        not null unique,
    empreinte_code    text        not null check (length(empreinte_code) = 64),
    nature            text        not null check (nature in ('VOL', 'CAMBRIOLAGE', 'VOL_VEHICULE', 'DEGRADATION', 'ESCROQUERIE', 'AUTRE_ATTEINTE_BIENS')),
    date_faits        date        not null,
    heure_faits       text,
    ville             text        not null,
    lieu              text        not null,
    description       text        not null check (length(description) between 20 and 4000),
    auteur_connu      boolean     not null,
    auteur_infos      text,
    biens             text,
    prejudice_fcfa    bigint      check (prejudice_fcfa is null or prejudice_fcfa >= 0),
    declarant         jsonb       not null,
    service           text        not null,
    statut            text        not null check (statut in ('RECUE', 'RENDEZ_VOUS_FIXE', 'PLAINTE_SIGNEE', 'EXPIREE')),
    cree_le           timestamptz not null,
    expire_le         timestamptz not null,
    rendez_vous_le    timestamptz,
    rendez_vous_lieu  text,
    traite_par        text,
    signee_le         timestamptz,
    numero_procedure  text,
    check (statut <> 'RENDEZ_VOUS_FIXE' or (rendez_vous_le is not null and rendez_vous_lieu is not null)),
    check (statut <> 'PLAINTE_SIGNEE' or signee_le is not null)
);
create index preplainte_file_idx on preplaintes.preplainte (statut, cree_le);

create function preplaintes.refuser_suppression() returns trigger language plpgsql as $$
begin
    raise exception 'REG-08 : aucune suppression physique (% refusé sur %)', tg_op, tg_table_name;
end $$;
create trigger preplainte_sans_suppression before delete on preplaintes.preplainte
    for each row execute function preplaintes.refuser_suppression();
create trigger preplainte_sans_vidage before truncate on preplaintes.preplainte
    for each statement execute function preplaintes.refuser_suppression();
