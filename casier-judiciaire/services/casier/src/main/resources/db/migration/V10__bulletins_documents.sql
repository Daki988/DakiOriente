-- BUL-01, DSH-01 : document PDF scellé conservé à l'émission ; destinataire autorisé à le télécharger.
alter table bulletins.bulletin add column destinataire_id text;
alter table bulletins.bulletin add column organisme text;
create index bulletin_destinataire_idx on bulletins.bulletin (destinataire_id) where destinataire_id is not null;

create table bulletins.document (
    bulletin_id          uuid primary key references bulletins.bulletin (id),
    pdf                  bytea       not null,
    empreinte            text        not null check (length(empreinte) = 64),
    certificat_sceau     text        not null check (length(certificat_sceau) = 64),
    sceau_demonstration  boolean     not null,
    cree_le              timestamptz not null
);

-- Un document émis n'est jamais modifié ni supprimé (REG-08) ; une erreur se corrige par révocation (BUL-10).
create function bulletins.refuser_modification() returns trigger language plpgsql as $$
begin
    raise exception 'BUL-01 : un bulletin émis ne se modifie pas (% refusé sur %)', tg_op, tg_table_name;
end $$;
create trigger document_fige before update or delete on bulletins.document for each row execute function bulletins.refuser_modification();
