-- Impression du bulletin au guichet (tableau de bord du validateur) : validation, puis impression sur papier sécurisé.
-- Historique en ajout seul : ni modification ni suppression (REG-08).
create table bulletins.impression (
    id          uuid primary key,
    bulletin_id uuid        not null references bulletins.bulletin (id),
    action      text        not null check (action in ('VALIDATION', 'IMPRESSION', 'REIMPRESSION')),
    acteur      text        not null,
    feuillet    text,
    motif       text,
    horodatage  timestamptz not null,
    check (action = 'VALIDATION' or feuillet is not null),
    check (action <> 'REIMPRESSION' or motif is not null)
);
create index impression_bulletin_idx on bulletins.impression (bulletin_id);
create unique index impression_validation_unique on bulletins.impression (bulletin_id) where action = 'VALIDATION';
create unique index impression_feuillet_unique on bulletins.impression (feuillet) where feuillet is not null;
create trigger impression_figee before update or delete on bulletins.impression
    for each row execute function bulletins.refuser_modification();
