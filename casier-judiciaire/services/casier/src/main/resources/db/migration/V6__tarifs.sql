-- ADM-04, RG-10 : tarifs par acte et profil, date d'effet, quatre yeux, jamais de modification rétroactive.
create table tarifs.tarif (
    id           uuid primary key,
    acte         text        not null,
    profil       text        not null,
    montant_fcfa bigint      not null check (montant_fcfa >= 0),
    date_effet   date        not null,
    statut       text        not null check (statut in ('PROPOSE', 'VALIDE', 'REJETE')),
    provisoire   boolean     not null,
    libelle      text        not null,
    source       text,
    propose_par  text        not null,
    propose_le   timestamptz not null,
    valide_par   text,
    valide_le    timestamptz
);
create index tarif_vigueur_idx on tarifs.tarif (acte, profil, date_effet desc) where statut = 'VALIDE';
