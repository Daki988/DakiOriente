-- Registre national (section 10) : fiches, condamnations versionnées, mentions, blocages (RG-07).
-- Chaque ligne porte une empreinte contrôlée à chaque lecture (REG-05). Aucune suppression physique (REG-08).
create table registre.personne (
    id               uuid primary key,
    nom              text        not null,
    prenoms          text        not null,
    date_naissance   date,
    lieu_naissance   text,
    pays_naissance   text,
    nom_pere         text,
    nom_mere         text,
    nationalites     text[]      not null default '{}',
    numero_cnie      text,
    numero_passeport text,
    alias            text[]      not null default '{}',
    cle_recherche    text        not null,
    cles_alias       text        not null default '',
    cree_par         text        not null,
    cree_le          timestamptz not null,
    empreinte        text        not null check (length(empreinte) = 64)
);
-- IDT-01 : recherche tolérante des candidats (trigrammes).
create index personne_cle_trgm_idx on registre.personne using gin (cle_recherche gin_trgm_ops);
create index personne_alias_trgm_idx on registre.personne using gin (cles_alias gin_trgm_ops);
create index personne_cnie_idx on registre.personne (numero_cnie) where numero_cnie is not null;
create index personne_passeport_idx on registre.personne (numero_passeport) where numero_passeport is not null;
create index personne_naissance_idx on registre.personne (date_naissance);

create table registre.condamnation (
    id                     uuid primary key,
    personne_id            uuid        not null references registre.personne (id),
    version                integer     not null check (version >= 1),
    remplace_id            uuid references registre.condamnation (id),
    juridiction            text        not null,
    date_decision          date        not null,
    numero_decision        text,
    infraction             text        not null,
    qualification          text        not null check (qualification in ('CRIME', 'DELIT', 'CONTRAVENTION')),
    peines                 jsonb       not null,
    date_definitive        date,
    reference_piece_source text,
    statut                 text        not null check (statut in ('SAISIE', 'VALIDEE', 'REJETEE', 'REMPLACEE')),
    saisie_par             text        not null,
    saisie_le              timestamptz not null,
    validee_par            text,
    validee_le             timestamptz,
    motif_rejet            text,
    motif_correction       text,
    empreinte              text        not null check (length(empreinte) = 64),
    -- REG-03 : quatre yeux, le greffier qui valide n'est pas l'agent qui a saisi.
    check (validee_par is null or validee_par <> saisie_par)
);
create index condamnation_personne_idx on registre.condamnation (personne_id, date_decision);

create table registre.mention (
    id              uuid primary key,
    condamnation_id uuid        not null references registre.condamnation (id),
    type            text        not null check (type in ('APPEL', 'EXECUTION', 'REVOCATION_SURSIS', 'REHABILITATION', 'AMNISTIE',
                                                         'GRACE', 'RECTIFICATION', 'EFFACEMENT')),
    date_effet      date,
    details         text,
    statut          text        not null check (statut in ('SAISIE', 'VALIDEE', 'REJETEE', 'REMPLACEE')),
    saisie_par      text        not null,
    saisie_le       timestamptz not null,
    validee_par     text,
    validee_le      timestamptz,
    empreinte       text        not null check (length(empreinte) = 64),
    check (validee_par is null or validee_par <> saisie_par)
);
create index mention_condamnation_idx on registre.mention (condamnation_id);

create table registre.blocage (
    id          uuid primary key,
    personne_id uuid        not null references registre.personne (id),
    motif       text        not null,
    ouvert_par  text        not null,
    ouvert_le   timestamptz not null,
    clos_par    text,
    clos_le     timestamptz
);
create index blocage_ouvert_idx on registre.blocage (personne_id) where clos_le is null;

-- REG-08 : aucune suppression physique, même par un administrateur de l'application.
create function registre.refuser_suppression() returns trigger language plpgsql as $$
begin
    raise exception 'REG-08 : aucune suppression physique dans le registre (% refusé sur %)', tg_op, tg_table_name;
end $$;

-- REG-04 : une condamnation ou une mention n'est jamais réécrite ; une correction crée une nouvelle version.
-- Seuls le statut et les champs de validation évoluent.
create function registre.proteger_contenu() returns trigger language plpgsql as $$
begin
    if (to_jsonb(new) - array['statut', 'validee_par', 'validee_le', 'motif_rejet', 'empreinte'])
       is distinct from (to_jsonb(old) - array['statut', 'validee_par', 'validee_le', 'motif_rejet', 'empreinte']) then
        raise exception 'REG-04 : le contenu d''une inscription ne se modifie pas ; créez une nouvelle version (%)', tg_table_name;
    end if;
    return new;
end $$;

create trigger personne_sans_suppression before delete on registre.personne for each row execute function registre.refuser_suppression();
create trigger condamnation_sans_suppression before delete on registre.condamnation for each row execute function registre.refuser_suppression();
create trigger mention_sans_suppression before delete on registre.mention for each row execute function registre.refuser_suppression();
create trigger blocage_sans_suppression before delete on registre.blocage for each row execute function registre.refuser_suppression();
create trigger personne_sans_vidage before truncate on registre.personne for each statement execute function registre.refuser_suppression();
create trigger condamnation_sans_vidage before truncate on registre.condamnation for each statement execute function registre.refuser_suppression();
create trigger mention_sans_vidage before truncate on registre.mention for each statement execute function registre.refuser_suppression();
create trigger blocage_sans_vidage before truncate on registre.blocage for each statement execute function registre.refuser_suppression();
create trigger condamnation_contenu_fige before update on registre.condamnation for each row execute function registre.proteger_contenu();
create trigger mention_contenu_fige before update on registre.mention for each row execute function registre.proteger_contenu();
