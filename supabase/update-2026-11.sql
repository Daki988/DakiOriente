-- NEAM — mise à jour du serveur (novembre 2026), à coller UNE fois dans Supabase > SQL Editor.
-- Contient le correctif du 29 octobre (appliqué seulement s'il manque) et celui du 20 novembre.
-- Généré à partir de supabase/migrations/20261029000001_security.sql et 20261120000001_hardening.sql.

do $maj$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'order_secrets' and column_name = 'failed_attempts') then
    execute $sec$
-- =====================================================================
-- NEAM — durcissement de sécurité (audit du 29/10/2026)
-- Vérifié par scripts/test-security.mjs
-- =====================================================================

-- 1. Historique des commandes : log_event() n'est appelée que par les fonctions métier.
--    Un utilisateur ne doit pas pouvoir écrire un faux message dans le suivi d'une commande.
revoke execute on function public.log_event(uuid, public.order_status, text) from authenticated, anon, public;

-- 2. Espèces dues : visibles uniquement par le livreur concerné et l'admin
create or replace function public.courier_cash_due(p_courier uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case when p_courier = auth.uid() or public.is_admin() then
    coalesce((select sum(total) from public.orders where courier_id = p_courier and status = 'delivered' and cash_collected), 0)::integer
    - coalesce((select sum(amount) from public.cash_remittances where courier_id = p_courier), 0)::integer
  end
$$;

-- 3. Code de remise : tirage cryptographique et 5 essais maximum par commande
create or replace function public.secure_delivery_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.delivery_code := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 10000)::text, 4, '0');
  return new;
end $$;
revoke execute on function public.secure_delivery_code() from authenticated, anon, public;
create trigger order_secrets_secure_code before insert on public.order_secrets
  for each row execute function public.secure_delivery_code();

alter table public.order_secrets add column if not exists failed_attempts integer not null default 0;

-- Un code faux ne lève pas d'erreur (sinon le compteur serait annulé avec la transaction) :
-- la fonction renvoie une commande vide, que l'application affiche comme « code incorrect ».
create or replace function public.courier_update_order(p_order uuid, p_action text, p_code text default null) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  sec public.order_secrets;
begin
  select * into o from public.orders where id = p_order and courier_id = auth.uid() for update;
  if not found then raise exception 'Course introuvable' using errcode = '42501'; end if;

  if p_action = 'pickup' and o.status = 'assigned' then
    if o.kind = 'market' and o.ready_at is null then raise exception 'La boutique n’a pas encore signalé la commande comme prête'; end if;
    update public.orders set status = 'picked_up', picked_up_at = now() where id = o.id returning * into o;
  elsif p_action = 'deliver' and o.status = 'picked_up' then
    select * into sec from public.order_secrets where order_id = o.id for update;
    if sec.failed_attempts >= 5 then
      raise exception 'Trop de codes faux : la remise est bloquée. Contactez NEAM.' using errcode = '42501';
    end if;
    if sec.delivery_code is distinct from trim(coalesce(p_code, '')) then
      update public.order_secrets set failed_attempts = failed_attempts + 1 where order_id = o.id;
      return null;
    end if;
    update public.orders set status = 'delivered', delivered_at = now(), closed_at = now(), cash_collected = true
     where id = o.id returning * into o;
  else
    raise exception 'Action impossible : la course est « % »', o.status;
  end if;
  perform public.log_event(o.id, o.status);
  return o;
end $$;

-- L'admin peut débloquer une remise (après avoir joint le client)
create or replace function public.admin_reset_delivery_code(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.order_secrets set failed_attempts = 0 where order_id = p_order;
end $$;
grant execute on function public.admin_reset_delivery_code(uuid) to authenticated;

-- 4. Fausses commandes en rafale : 3 commandes en attente maximum par client
create or replace function public.limit_pending_orders() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.orders where client_id = new.client_id and status = 'pending') >= 3 then
    raise exception 'Vous avez déjà 3 commandes en attente. Attendez qu’elles soient acceptées ou annulez-en une.';
  end if;
  return new;
end $$;
revoke execute on function public.limit_pending_orders() from authenticated, anon, public;
create trigger orders_limit_pending before insert on public.orders
  for each row execute function public.limit_pending_orders();

-- 5. Tailles maximales des textes saisis (évite les contenus géants affichés aux marchands et livreurs)
alter table public.orders
  add constraint orders_address_len check (char_length(address) <= 300),
  add constraint orders_pickup_len check (pickup_address is null or char_length(pickup_address) <= 300),
  add constraint orders_contact_name_len check (char_length(contact_name) <= 80),
  add constraint orders_contact_phone_len check (char_length(contact_phone) <= 30),
  add constraint orders_note_len check (note is null or char_length(note) <= 500),
  add constraint orders_parcel_len check (parcel is null or pg_column_size(parcel) <= 2000),
  add constraint orders_cancel_reason_len check (cancel_reason is null or char_length(cancel_reason) <= 300);
alter table public.staff_applications
  add constraint apps_full_name_len check (char_length(full_name) <= 80),
  add constraint apps_phone_len check (char_length(phone) <= 30),
  add constraint apps_details_len check (pg_column_size(details) <= 4000);
alter table public.products
  add constraint products_name_len check (char_length(name) <= 120),
  add constraint products_description_len check (char_length(description) <= 1000);

$sec$;
  end if;
end $maj$;

-- =====================================================================
-- NEAM — correctifs de l'audit du 20/11/2026 (argent, règles de gestion, données personnelles)
-- Vérifié par scripts/test-backend.mjs et scripts/test-security.mjs
-- =====================================================================

-- ---------- Journal des actions d'administration ----------
create table public.admin_audit (
  id bigserial primary key,
  actor_id uuid references public.profiles (id),
  action text not null,
  target text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index admin_audit_created on public.admin_audit (created_at desc);
alter table public.admin_audit enable row level security;
create policy admin_audit_read on public.admin_audit for select using (public.is_admin());
revoke insert, update, delete on public.admin_audit from anon, authenticated;

create function public.audit(p_action text, p_target text, p_details jsonb default '{}') returns void
language sql security definer set search_path = public as $$
  insert into public.admin_audit (actor_id, action, target, details) values (auth.uid(), p_action, p_target, coalesce(p_details, '{}'))
$$;
revoke execute on function public.audit(text, text, jsonb) from authenticated, anon, public;

-- ---------- 1. Un compte désactivé ne peut plus rien modifier ----------
-- Contrôle commun à toutes les écritures faites au nom d'un utilisateur (fonctions métier et catalogue).
create function public.block_inactive_users() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and exists (select 1 from public.profiles where id = auth.uid() and not is_active) then
    raise exception 'Compte suspendu : contactez NEAM.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function public.block_inactive_users() from authenticated, anon, public;
create trigger orders_block_inactive before insert or update on public.orders for each row execute function public.block_inactive_users();
create trigger products_block_inactive before insert or update or delete on public.products for each row execute function public.block_inactive_users();
create trigger stores_block_inactive before update on public.stores for each row execute function public.block_inactive_users();
create trigger couriers_block_inactive before update on public.couriers for each row execute function public.block_inactive_users();
create trigger apps_block_inactive before insert on public.staff_applications for each row execute function public.block_inactive_users();

-- ---------- 2. Commandes sans doublon (coupure réseau) ----------
-- L'application envoie une référence unique par tentative ; un renvoi renvoie la commande déjà créée.
alter table public.orders add column client_ref text check (client_ref is null or char_length(client_ref) <= 64);
create unique index orders_client_ref on public.orders (client_id, client_ref) where client_ref is not null;

drop function public.place_market_order(uuid, jsonb, text, text, text, text);
create function public.place_market_order(
  p_store uuid, p_items jsonb, p_address text, p_phone text, p_name text default '', p_note text default null,
  p_client_ref text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  st public.stores;
  o public.orders;
  it jsonb;
  pr public.products;
  v_total integer := 0;
  v_fee integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  if p_client_ref is not null then
    select * into o from public.orders where client_id = auth.uid() and client_ref = p_client_ref;
    if found then return o; end if;
  end if;
  select * into st from public.stores where id = p_store and is_active;
  if not found then raise exception 'Boutique introuvable'; end if;
  if not st.is_open then raise exception 'La boutique % est fermée pour le moment', st.name; end if;
  if coalesce(trim(p_address), '') = '' then raise exception 'Adresse de livraison requise'; end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Numéro de téléphone requis'; end if;
  if jsonb_array_length(coalesce(p_items, '[]')) = 0 then raise exception 'Panier vide'; end if;

  insert into public.orders (kind, client_id, store_id, contact_name, contact_phone, city, address, note, client_ref)
  values ('market', auth.uid(), st.id, coalesce(p_name, ''), p_phone, st.city, trim(p_address), p_note, p_client_ref)
  returning * into o;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from public.products where id = (it ->> 'product_id')::uuid and store_id = st.id;
    if not found then raise exception 'Article introuvable dans cette boutique'; end if;
    if not pr.in_stock then raise exception '« % » n’est plus disponible', pr.name; end if;
    if (it ->> 'qty')::integer is null or (it ->> 'qty')::integer < 1 or (it ->> 'qty')::integer > 50 then
      raise exception 'Quantité invalide pour « % »', pr.name;
    end if;
    insert into public.order_items (order_id, product_id, name, emoji, unit, price, qty)
    values (o.id, pr.id, pr.name, pr.emoji, pr.unit, pr.price, (it ->> 'qty')::integer);
    v_total := v_total + pr.price * (it ->> 'qty')::integer;
  end loop;

  v_fee := case when v_total >= public.setting_int('market_free_delivery_from') then 0 else public.setting_int('market_delivery_fee') end;

  update public.orders
     set items_total = v_total, delivery_fee = v_fee, total = v_total + v_fee,
         commission = round(v_total * st.commission_rate)
   where id = o.id
  returning * into o;

  insert into public.order_secrets (order_id, delivery_code) values (o.id, '0000');
  perform public.log_event(o.id, 'pending');
  return o;
end $$;

drop function public.place_express_order(text, text, text, text, integer, text, text, text);
create function public.place_express_order(
  p_pickup text, p_dropoff text, p_size text, p_speed text, p_km integer,
  p_phone text, p_name text default '', p_description text default null, p_client_ref text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  v_km integer := least(greatest(coalesce(p_km, 1), 1), 60);
  v_fee integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  if p_client_ref is not null then
    select * into o from public.orders where client_id = auth.uid() and client_ref = p_client_ref;
    if found then return o; end if;
  end if;
  if coalesce(trim(p_pickup), '') = '' or coalesce(trim(p_dropoff), '') = '' then raise exception 'Adresses de ramassage et de livraison requises'; end if;
  if p_size not in ('doc', 's', 'm', 'l') or p_speed not in ('standard', 'express', 'sameday') then raise exception 'Type d’envoi invalide'; end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Numéro de téléphone requis'; end if;
  v_fee := public.express_quote(p_size, p_speed, v_km);

  insert into public.orders (kind, client_id, contact_name, contact_phone, address, pickup_address, parcel, delivery_fee, total, client_ref)
  values ('express', auth.uid(), coalesce(p_name, ''), p_phone, trim(p_dropoff), trim(p_pickup),
          jsonb_build_object('size', p_size, 'speed', p_speed, 'km', v_km, 'description', p_description), v_fee, v_fee, p_client_ref)
  returning * into o;

  insert into public.order_secrets (order_id, delivery_code) values (o.id, '0000');
  perform public.log_event(o.id, 'pending');
  return o;
end $$;
-- (le code de remise réel est tiré par le déclencheur order_secrets_secure_code)

-- Limite de 3 commandes en attente : verrou par client pour les envois simultanés
create or replace function public.limit_pending_orders() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('pending:' || new.client_id::text));
  if (select count(*) from public.orders where client_id = new.client_id and status = 'pending') >= 3 then
    raise exception 'Vous avez déjà 3 commandes en attente. Attendez qu’elles soient acceptées ou annulez-en une.';
  end if;
  return new;
end $$;

-- ---------- 3. Annulation : jamais après la récupération par le livreur ----------
create or replace function public.admin_cancel_order(p_order uuid, p_reason text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if o.status = 'picked_up' then
    raise exception 'Le livreur a déjà la commande : faites-la rapporter à la boutique ou livrer avant toute annulation.';
  end if;
  if o.status in ('delivered', 'cancelled', 'rejected') then raise exception 'Commande déjà clôturée'; end if;
  update public.orders set status = 'cancelled', cancel_reason = p_reason, closed_at = now() where id = o.id returning * into o;
  perform public.log_event(o.id, 'cancelled', p_reason);
  perform public.audit('cancel_order', o.code, jsonb_build_object('reason', p_reason));
  return o;
end $$;

-- Affectation : livreur actif et en ligne ; une course déjà récupérée peut changer de livreur
-- (livreur malade, panne) sans repasser par la boutique.
create or replace function public.admin_assign_courier(p_order uuid, p_courier uuid) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if not exists (select 1 from public.couriers c join public.profiles p on p.id = c.id
                  where c.id = p_courier and p.role = 'courier' and p.is_active and c.is_online) then
    raise exception 'Livreur introuvable ou hors ligne';
  end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if o.status = 'picked_up' then
    update public.orders set courier_id = p_courier where id = o.id returning * into o;
    perform public.log_event(o.id, 'picked_up', 'Course confiée à un autre livreur');
    perform public.audit('reassign_courier', o.code, jsonb_build_object('courier', p_courier));
    return o;
  end if;
  update public.orders
     set courier_id = p_courier, status = 'assigned', assigned_at = now()
   where id = o.id
     and ((kind = 'market' and status in ('accepted', 'ready')) or (kind = 'express' and status = 'pending') or status = 'assigned')
  returning * into o;
  if not found then raise exception 'Cette commande ne peut pas être affectée maintenant'; end if;
  perform public.log_event(o.id, 'assigned');
  return o;
end $$;

-- ---------- 4. Position du livreur : seulement pour le client, pendant la course ----------
create or replace function public.courier_public(p_order uuid)
returns table (full_name text, phone text, vehicle text, lat double precision, lng double precision, location_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.phone, c.vehicle, c.lat, c.lng, c.location_at
    from public.orders o join public.couriers c on c.id = o.courier_id join public.profiles p on p.id = c.id
   where o.id = p_order
     and ((o.client_id = auth.uid() and o.status in ('assigned', 'picked_up')) or public.is_admin())
$$;

create or replace function public.courier_update_location(p_lat double precision, p_lng double precision) returns void
language sql security definer set search_path = public as $$
  update public.couriers set lat = p_lat, lng = p_lng, location_at = now()
   where id = auth.uid() and is_online and p_lat between -90 and 90 and p_lng between -180 and 180
$$;

-- Un livreur qui se met hors ligne n'est plus localisable
create or replace function public.courier_set_online(p_online boolean) returns public.couriers
language plpgsql security definer set search_path = public as $$
declare c public.couriers;
begin
  perform public.require_role('courier');
  update public.couriers
     set is_online = p_online,
         lat = case when p_online then lat end, lng = case when p_online then lng end,
         location_at = case when p_online then location_at end
   where id = auth.uid() returning * into c;
  if not found then raise exception 'Compte livreur introuvable'; end if;
  return c;
end $$;

-- ---------- 5. Argent : plafonds, verrous et traçabilité ----------
create or replace function public.admin_record_payout(p_store uuid, p_amount integer, p_reference text default null) returns public.merchant_payouts
language plpgsql security definer set search_path = public as $$
declare
  r public.merchant_payouts;
  v_balance integer;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('payout:' || p_store::text));
  select balance into v_balance from public.store_finances(p_store);
  if coalesce(p_amount, 0) <= 0 then raise exception 'Montant invalide'; end if;
  if p_amount > coalesce(v_balance, 0) then
    raise exception 'Montant supérieur au solde dû à la boutique (% FCFA)', coalesce(v_balance, 0);
  end if;
  insert into public.merchant_payouts (store_id, amount, reference, paid_by) values (p_store, p_amount, p_reference, auth.uid()) returning * into r;
  perform public.audit('payout', p_store::text, jsonb_build_object('amount', p_amount, 'reference', p_reference));
  return r;
end $$;

create or replace function public.admin_record_remittance(p_courier uuid, p_amount integer, p_note text default null) returns public.cash_remittances
language plpgsql security definer set search_path = public as $$
declare r public.cash_remittances;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('remit:' || p_courier::text));
  if coalesce(p_amount, 0) <= 0 then raise exception 'Montant invalide'; end if;
  if p_amount > public.courier_cash_due(p_courier) then raise exception 'Montant supérieur aux espèces dues par ce livreur'; end if;
  insert into public.cash_remittances (courier_id, amount, received_by, note) values (p_courier, p_amount, auth.uid(), p_note) returning * into r;
  perform public.audit('remittance', p_courier::text, jsonb_build_object('amount', p_amount, 'note', p_note));
  return r;
end $$;

create or replace function public.admin_update_store(p_store uuid, p_is_active boolean, p_commission numeric) returns public.stores
language plpgsql security definer set search_path = public as $$
declare s public.stores;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.stores set is_active = coalesce(p_is_active, is_active), commission_rate = coalesce(p_commission, commission_rate)
   where id = p_store returning * into s;
  if not found then raise exception 'Boutique introuvable'; end if;
  perform public.audit('update_store', s.name, jsonb_build_object('is_active', p_is_active, 'commission', p_commission));
  return s;
end $$;

create or replace function public.admin_set_user_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'Vous ne pouvez pas désactiver votre propre compte'; end if;
  update public.profiles set is_active = p_active where id = p_user;
  if not p_active then update public.couriers set is_online = false, lat = null, lng = null where id = p_user; end if;
  perform public.audit(case when p_active then 'activate_user' else 'suspend_user' end, p_user::text);
end $$;

-- Paramètres : format contrôlé, ancienne valeur gardée dans le journal
create or replace function public.admin_update_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb;
  k text;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select value into v_old from public.app_settings where key = p_key;
  if not found then raise exception 'Paramètre inconnu'; end if;
  if p_key in ('market_delivery_fee', 'market_free_delivery_from') then
    if jsonb_typeof(p_value) <> 'number' or (p_value #>> '{}')::numeric <> floor((p_value #>> '{}')::numeric) or (p_value #>> '{}')::numeric < 0 then
      raise exception 'Montant en FCFA entier attendu';
    end if;
  elsif p_key = 'express_base_fee' then
    foreach k in array array['doc', 's', 'm', 'l'] loop
      if jsonb_typeof(p_value -> k) is distinct from 'number' or (p_value ->> k)::numeric < 0 or (p_value ->> k)::numeric <> floor((p_value ->> k)::numeric) then
        raise exception 'Tarif « % » manquant ou invalide', k;
      end if;
    end loop;
  elsif p_key = 'express_speed_factor' then
    foreach k in array array['standard', 'express', 'sameday'] loop
      if jsonb_typeof(p_value -> k) is distinct from 'number' or (p_value ->> k)::numeric <= 0 then
        raise exception 'Coefficient « % » manquant ou invalide', k;
      end if;
    end loop;
  elsif p_key = 'live_cities' and jsonb_typeof(p_value) <> 'array' then
    raise exception 'Liste de villes attendue';
  end if;
  update public.app_settings set value = p_value, updated_at = now() where key = p_key;
  perform public.audit('update_setting', p_key, jsonb_build_object('old', v_old, 'new', p_value));
end $$;

create or replace function public.admin_reset_delivery_code(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.order_secrets set failed_attempts = 0 where order_id = p_order;
  perform public.audit('reset_delivery_code', p_order::text);
end $$;

-- Candidatures : pas de rétrogradation d'un admin, pas de seconde boutique
create or replace function public.admin_review_application(p_application uuid, p_approve boolean, p_note text default null) returns public.staff_applications
language plpgsql security definer set search_path = public as $$
declare
  a public.staff_applications;
  v_role public.app_role;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into a from public.staff_applications where id = p_application and status = 'pending' for update;
  if not found then raise exception 'Candidature introuvable ou déjà traitée'; end if;
  select role into v_role from public.profiles where id = a.user_id;
  if p_approve and v_role = 'admin' then raise exception 'Ce compte est administrateur : son rôle ne peut pas changer par une candidature'; end if;
  if p_approve and v_role in ('merchant', 'courier') and v_role::text <> a.kind::text then
    raise exception 'Ce compte a déjà le rôle %', v_role;
  end if;
  update public.staff_applications
     set status = case when p_approve then 'approved'::public.application_status else 'rejected'::public.application_status end,
         admin_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = a.id
  returning * into a;
  if p_approve then
    update public.profiles set role = a.kind::text::public.app_role, full_name = a.full_name, phone = coalesce(phone, a.phone)
     where id = a.user_id;
    if a.kind = 'courier' then
      insert into public.couriers (id, vehicle, plate)
      values (a.user_id, coalesce(a.details ->> 'vehicle', 'Moto'), coalesce(a.details ->> 'plate', ''))
      on conflict (id) do nothing;
    elsif not exists (select 1 from public.stores where owner_id = a.user_id) then
      insert into public.stores (owner_id, name, district, address, phone, emoji)
      values (a.user_id, coalesce(a.details ->> 'store_name', a.full_name), coalesce(a.details ->> 'district', ''),
              coalesce(a.details ->> 'address', ''), a.phone, coalesce(a.details ->> 'emoji', '🏪'));
    end if;
  end if;
  perform public.audit(case when p_approve then 'approve_application' else 'reject_application' end, a.full_name, jsonb_build_object('kind', a.kind));
  return a;
end $$;

-- ---------- 6. Boutiques : commission et propriétaire hors du catalogue public ----------
revoke select on public.stores from anon, authenticated;
grant select (id, name, district, address, phone, city, emoji, is_open, is_active, prep_minutes, created_at) on public.stores to anon, authenticated;

-- Les règles d'accès qui vérifiaient le propriétaire passent par une fonction (la colonne n'est plus lisible)
create function public.owns_store(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store and owner_id = auth.uid())
$$;
create function public.store_listed(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store and (is_active or owner_id = auth.uid()))
$$;
grant execute on function public.owns_store(uuid) to anon, authenticated;
grant execute on function public.store_listed(uuid) to anon, authenticated;

drop policy stores_read on public.stores;
create policy stores_read on public.stores for select using (is_active or public.owns_store(id) or public.is_admin());
drop policy products_read on public.products;
create policy products_read on public.products for select using (public.store_listed(store_id) or public.is_admin());
drop policy products_owner_insert on public.products;
create policy products_owner_insert on public.products for insert with check (public.owns_store(store_id) or public.is_admin());
drop policy products_owner_update on public.products;
create policy products_owner_update on public.products for update
  using (public.owns_store(store_id) or public.is_admin()) with check (public.owns_store(store_id) or public.is_admin());
drop policy products_owner_delete on public.products;
create policy products_owner_delete on public.products for delete using (public.owns_store(store_id) or public.is_admin());
drop policy payouts_read on public.merchant_payouts;
create policy payouts_read on public.merchant_payouts for select using (public.is_admin() or public.owns_store(store_id));

-- Fiche complète : le marchand pour sa boutique, l'admin pour toutes
create function public.stores_full() returns setof public.stores
language sql stable security definer set search_path = public as $$
  select * from public.stores where owner_id = auth.uid() or public.is_admin()
$$;

-- ---------- 7. Heure de Libreville ----------
create or replace function public.admin_couriers()
returns table (id uuid, full_name text, phone text, vehicle text, plate text, is_online boolean, is_active boolean,
               lat double precision, lng double precision, location_at timestamptz, active_orders integer, delivered_today integer, cash_due integer)
language sql stable security definer set search_path = public as $$
  select c.id, p.full_name, p.phone, c.vehicle, c.plate, c.is_online, p.is_active, c.lat, c.lng, c.location_at,
         (select count(*) from public.orders o where o.courier_id = c.id and o.status in ('assigned', 'picked_up'))::integer,
         (select count(*) from public.orders o where o.courier_id = c.id and o.status = 'delivered'
             and o.delivered_at >= (date_trunc('day', now() at time zone 'Africa/Libreville') at time zone 'Africa/Libreville'))::integer,
         public.courier_cash_due(c.id)
    from public.couriers c join public.profiles p on p.id = c.id
   where public.is_admin()
   order by c.is_online desc, p.full_name
$$;

-- Périodes [début, fin) : deux périodes qui se suivent ne comptent jamais deux fois la même commande
create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz)
returns table (orders_count integer, delivered integer, cancelled integer, gmv integer, commission integer, delivery_fees integer,
               active_now integer, couriers_online integer, pending_applications integer, new_clients integer)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.orders where created_at >= p_from and created_at < p_to)::integer,
    (select count(*) from public.orders where status = 'delivered' and delivered_at >= p_from and delivered_at < p_to)::integer,
    (select count(*) from public.orders where status in ('cancelled', 'rejected') and closed_at >= p_from and closed_at < p_to)::integer,
    (select coalesce(sum(total), 0) from public.orders where status = 'delivered' and delivered_at >= p_from and delivered_at < p_to)::integer,
    (select coalesce(sum(commission), 0) from public.orders where status = 'delivered' and delivered_at >= p_from and delivered_at < p_to)::integer,
    (select coalesce(sum(delivery_fee), 0) from public.orders where status = 'delivered' and delivered_at >= p_from and delivered_at < p_to)::integer,
    (select count(*) from public.orders where status in ('pending', 'accepted', 'ready', 'assigned', 'picked_up'))::integer,
    (select count(*) from public.couriers where is_online)::integer,
    (select count(*) from public.staff_applications where status = 'pending')::integer,
    (select count(*) from public.profiles where role = 'client' and created_at >= p_from and created_at < p_to)::integer
  where public.is_admin()
$$;

-- ---------- 8. Commandes oubliées et données anciennes ----------
-- Une commande Market jamais acceptée est annulée après 45 minutes (le client peut recommander ailleurs).
create function public.expire_stale_orders() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with x as (
    update public.orders
       set status = 'cancelled', cancel_reason = 'Non acceptée par la boutique dans les 45 minutes', closed_at = now()
     where status = 'pending' and kind = 'market' and created_at < now() - interval '45 minutes'
    returning id
  )
  insert into public.order_events (order_id, status, note)
  select id, 'cancelled', 'Annulée automatiquement' from x;
  get diagnostics n = row_count;
  return n;
end $$;

-- Après 2 ans, les coordonnées des clients sont effacées des commandes clôturées (les montants restent pour la comptabilité).
create function public.purge_personal_data() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.orders
     set contact_name = '', contact_phone = 'effacé', address = 'effacée', pickup_address = case when pickup_address is null then null else 'effacée' end, note = null
   where closed_at < now() - interval '2 years' and contact_phone <> 'effacé';
  get diagnostics n = row_count;
  update public.couriers set lat = null, lng = null where location_at < now() - interval '1 day' and not is_online;
  return n;
end $$;
revoke execute on function public.expire_stale_orders() from authenticated, anon, public;
revoke execute on function public.purge_personal_data() from authenticated, anon, public;

-- Planification (pg_cron) quand l'extension est disponible ; sinon, l'admin peut les lancer à la main.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('neam-expire-orders', '*/5 * * * *', 'select public.expire_stale_orders()');
  perform cron.schedule('neam-purge-personal-data', '17 3 * * *', 'select public.purge_personal_data()');
exception when others then
  raise notice 'pg_cron indisponible : tâches planifiées non créées (%)', sqlerrm;
end $$;

-- ---------- 9. Index pour les écrans marchand, livreur et admin ----------
create index orders_store_status on public.orders (store_id, status, created_at desc);
create index orders_courier_status on public.orders (courier_id, status);
create index orders_delivered on public.orders (status, delivered_at);
create index orders_created on public.orders (created_at);
create index orders_pending_client on public.orders (client_id) where status = 'pending';
create index remittances_courier on public.cash_remittances (courier_id);
create index payouts_store on public.merchant_payouts (store_id);
create index apps_user on public.staff_applications (user_id, kind);

-- Droits d'exécution des nouvelles fonctions et des fonctions recréées
revoke execute on function public.place_market_order(uuid, jsonb, text, text, text, text, text) from anon, public;
revoke execute on function public.place_express_order(text, text, text, text, integer, text, text, text, text) from anon, public;
revoke execute on function public.stores_full() from anon, public;
grant execute on function public.place_market_order(uuid, jsonb, text, text, text, text, text) to authenticated;
grant execute on function public.place_express_order(text, text, text, text, integer, text, text, text, text) to authenticated;
grant execute on function public.stores_full() to authenticated;

-- Recommandations du conseiller de sécurité Supabase (28/11/2026)
-- Chemin de recherche figé pour les fonctions appelées par les règles d'accès et les calculs de prix
alter function public.require_role(public.app_role) set search_path = public;
alter function public.express_quote(text, text, integer) set search_path = public;
alter function public.setting_int(text) set search_path = public;
alter function public.is_admin() set search_path = public;
-- Fonction réservée à l'admin : pas d'appel possible sans connexion
revoke execute on function public.admin_reset_delivery_code(uuid) from anon, public;
