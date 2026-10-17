-- Tests de sécurité (RLS) du schéma Neam Print. Lancés par scripts/test-db.sh.
-- Chaque bloc lève une exception si la règle n'est pas respectée.
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null

-- Données de test
insert into public.admins (email, role) values ('atelier@neamprint.ga', 'atelier'), ('gerant@neamprint.ga', 'admin')
on conflict (email) do nothing;
update public.products set visible = false where slug = 'urne-en-plexiglas';
insert into storage.objects (bucket_id, name) values ('print-files', 'NP-TEST/fichier.pdf');

create or replace function pg_temp.act(r text, email text) returns void language plpgsql as $$
begin
  perform set_config('role', r, true);
  perform set_config('request.jwt.claims', case when email is null then '{}' else json_build_object('email', email)::text end, true);
end $$;

-- 1. Catalogue chargé
do $$ begin
  assert (select count(*) from public.products) = 23, 'le catalogue doit contenir 23 produits';
  assert (select count(*) from public.products where jsonb_array_length(tiers) = 0) = 0, 'chaque produit doit avoir un prix';
end $$;

-- 2. Création de commande par le serveur (clé service) : numéro NP-… automatique
begin;
select pg_temp.act('service_role', null);
insert into public.orders (token, customer_name, customer_phone, product_slug, product_name, selection, amount, delivery)
values ('tok_test_1_aaaaaaaaaaaaaaaa', 'Junior Test', '+24177000000', 'carte-de-visite-standard', 'Carte de visite standard', '{"qty":250}', 12500, 'pickup');
do $$ begin
  assert (select code from public.orders where token = 'tok_test_1_aaaaaaaaaaaaaaaa') = 'NP-1001', 'premier numéro attendu : NP-1001';
end $$;
commit;

-- 3. Visiteur anonyme
begin;
select pg_temp.act('anon', null);
do $$ begin
  assert (select count(*) from public.products) = 22, 'un visiteur ne voit que les produits visibles';
  assert (select count(*) from public.orders) = 0, 'un visiteur ne doit voir aucune commande';
  assert (select count(*) from public.admins) = 0, 'un visiteur ne doit pas voir les administrateurs';
  assert (select count(*) from storage.objects) = 0, 'un visiteur ne doit voir aucun fichier';
end $$;
do $$ begin
  begin
    insert into public.orders (token, customer_name, customer_phone, product_slug, product_name, selection, amount, delivery)
    values ('tok_pirate_aaaaaaaaaaaaaaaaa', 'Pirate', '+24100000000', 'x', 'x', '{}', 1, 'pickup');
    raise exception 'un visiteur ne doit pas pouvoir créer de commande directement';
  exception when insufficient_privilege then null;
  end;
  update public.products set tiers = '[{"qty":1,"price":1}]';
  assert not exists (select 1 from public.products where tiers = '[{"qty":1,"price":1}]'), 'un visiteur ne doit pas modifier les prix';
end $$;
rollback;

-- 4. Connecté mais sans droits (client lambda)
begin;
select pg_temp.act('authenticated', 'inconnu@gmail.com');
do $$ begin
  assert (select count(*) from public.orders) = 0, 'un compte sans droits ne doit voir aucune commande';
  assert (select count(*) from public.products) = 22, 'un compte sans droits ne voit que le catalogue public';
  update public.products set name = 'Piraté';
  assert not exists (select 1 from public.products where name = 'Piraté'), 'un compte sans droits ne doit rien modifier';
end $$;
rollback;

-- 5. Atelier : commandes oui, prix non, équipe non
begin;
select pg_temp.act('authenticated', 'atelier@neamprint.ga');
do $$ begin
  assert (select count(*) from public.orders) = 1, 'l’atelier voit les commandes';
  update public.orders set status = 2;
  assert (select status from public.orders limit 1) = 2, 'l’atelier fait avancer les commandes';
  update public.products set name = 'Modifié' where slug = 'flyer-a5';
  assert (select name from public.products where slug = 'flyer-a5') <> 'Modifié', 'l’atelier ne modifie pas les prix';
  assert (select count(*) from storage.objects) = 1, 'l’atelier télécharge les fichiers';
  begin
    insert into public.admins (email, role) values ('intrus@gmail.com', 'super_admin');
    raise exception 'l’atelier ne doit pas ajouter d’administrateur';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- 6. Administrateur : prix oui, équipe non
begin;
select pg_temp.act('authenticated', 'GERANT@neamprint.ga');  -- e-mail en majuscules : doit être reconnu
do $$ begin
  assert (select count(*) from public.products) = 23, 'un administrateur voit aussi les produits masqués';
  update public.products set name = 'Flyer A5 (modifié)' where slug = 'flyer-a5';
  assert (select name from public.products where slug = 'flyer-a5') = 'Flyer A5 (modifié)', 'un administrateur modifie les prix';
  begin
    insert into public.admins (email, role) values ('intrus@gmail.com', 'admin');
    raise exception 'un administrateur ne doit pas gérer l’équipe';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;

-- 7. Super administrateur : gère l'équipe
begin;
select pg_temp.act('authenticated', 'daki.liaison@gmail.com');
do $$ begin
  insert into public.admins (email, role) values ('nouveau@neamprint.ga', 'atelier');
  assert (select count(*) from public.admins) = 4, 'le super administrateur ajoute des membres';
  assert (select count(*) from public.orders) = 1, 'le super administrateur voit les commandes';
end $$;
rollback;

-- 8. Contraintes de données
do $$ begin
  begin
    insert into public.orders (token, customer_name, customer_phone, product_slug, product_name, selection, amount, delivery)
    values ('tok_test_2_aaaaaaaaaaaaaaaa', 'X', '+241', 'x', 'x', '{}', -5, 'pickup');
    raise exception 'un montant négatif doit être refusé';
  exception when check_violation then null;
  end;
  begin
    update public.orders set status = 7;
    raise exception 'une étape hors 0–4 doit être refusée';
  exception when check_violation then null;
  end;
end $$;

-- Nettoyage
delete from public.orders where token like 'tok_test_%';
delete from storage.objects where name = 'NP-TEST/fichier.pdf';
delete from public.admins where email in ('atelier@neamprint.ga', 'gerant@neamprint.ga');
update public.products set visible = true where slug = 'urne-en-plexiglas';
\echo 'RLS : tous les tests passent'
