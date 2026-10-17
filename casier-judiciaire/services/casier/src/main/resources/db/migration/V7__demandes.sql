-- Demandes de bulletin n°3 (section 8) et frise d'état (PUB-07).
create sequence demandes.numero_seq;

create table demandes.demande (
    id                        uuid primary key,
    numero_dossier            text        not null unique,
    empreinte_code_suivi      text        not null check (length(empreinte_code_suivi) = 64),
    type                      text        not null check (type in ('B3')),
    profil                    text        not null check (profil in ('GABONAIS_NE_AU_GABON', 'GABONAIS_NE_A_L_ETRANGER', 'ETRANGER_RESIDENT')),
    identite                  jsonb       not null,
    demandeur_id              text,
    identite_verifiee         boolean     not null,
    statut                    text        not null check (statut in ('EN_ATTENTE_PAIEMENT', 'EN_TRAITEMENT', 'A_TRAITER_PAR_AGENT',
                                                                     'EN_ATTENTE_PIECE', 'DELIVREE', 'REJETEE')),
    montant_fcfa              bigint      not null check (montant_fcfa >= 0),
    tarif_provisoire          boolean     not null,
    -- PAY-02 : une transaction n'est traitée qu'une fois.
    reference_paiement        text unique,
    cree_le                   timestamptz not null,
    paye_le                   timestamptz,
    echeance                  timestamptz,
    suspendu_depuis           timestamptz,
    -- Référence vers le registre sans clé étrangère (ARC-02).
    personne_rapprochee       uuid,
    issue_rapprochement       text,
    explication_rapprochement text,
    motif_agent               text,
    bulletin_id               uuid,
    bulletin_numero           text,
    motif_rejet               text
);
create index demande_file_idx on demandes.demande (echeance nulls last, cree_le) where statut in ('A_TRAITER_PAR_AGENT', 'EN_ATTENTE_PIECE');
create index demande_personne_idx on demandes.demande (personne_rapprochee) where personne_rapprochee is not null;

create table demandes.etape (
    id         bigint generated always as identity primary key,
    demande_id uuid        not null references demandes.demande (id),
    horodatage timestamptz not null,
    statut     text        not null,
    libelle    text        not null
);
create index etape_demande_idx on demandes.etape (demande_id, horodatage, id);
