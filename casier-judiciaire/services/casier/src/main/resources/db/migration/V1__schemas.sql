-- ARC-02 : un schéma PostgreSQL par module ; aucun module ne lit les tables d'un autre (pas de clé étrangère entre schémas).
create extension if not exists pg_trgm;

create schema if not exists audit;
create schema if not exists habilitations;
create schema if not exists regles;
create schema if not exists registre;
create schema if not exists tarifs;
create schema if not exists demandes;
create schema if not exists bulletins;
create schema if not exists verification;
