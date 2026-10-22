-- NEAM — installation complète de la base (à coller dans Supabase > SQL Editor, une seule fois).
-- Généré à partir de supabase/migrations et supabase/seed.sql.

-- =====================================================================
-- NEAM — schéma principal (phase 1 : NEAM Market + NEAM Express, Libreville)
-- Rôles : client, marchand (merchant), livreur (courier), admin.
-- Paiement : à la livraison uniquement (espèces encaissées par le livreur).
-- Toutes les écritures sensibles passent par des fonctions SECURITY DEFINER
-- qui vérifient le rôle et l'état de la commande ; les tables sont en RLS.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type public.app_role as enum ('client', 'merchant', 'courier', 'admin');
create type public.order_kind as enum ('market', 'express');
create type public.order_status as enum (
  'pending',    -- placée : en attente du marchand (market) ou d'un livreur (express)
  'accepted',   -- acceptée par le marchand, en préparation
  'ready',      -- prête à être récupérée
  'assigned',   -- livreur affecté
  'picked_up',  -- récupérée par le livreur, en route
  'delivered',  -- livrée, espèces encaissées
  'cancelled',  -- annulée (client ou admin)
  'rejected'    -- refusée par le marchand
);
create type public.application_kind as enum ('merchant', 'courier');
create type public.application_status as enum ('pending', 'approved', 'rejected');

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'client',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profil créé automatiquement à l'inscription
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rôle de l'utilisateur courant (utilisé par les règles d'accès)
create function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid() and is_active), 'client'::public.app_role)
$$;

create function public.is_admin() returns boolean
language sql stable as $$ select public.my_role() = 'admin' $$;

-- ---------- Paramètres ----------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('market_delivery_fee', '1000'),
  ('market_free_delivery_from', '15000'),
  ('express_base_fee', '{"doc": 1500, "s": 2500, "m": 4000, "l": 7500}'),
  ('express_speed_factor', '{"standard": 1, "express": 1.6, "sameday": 1.3}'),
  ('live_cities', '["Libreville", "Akanda", "Owendo"]');

create function public.setting_int(k text) returns integer
language sql stable as $$ select (value #>> '{}')::integer from public.app_settings where key = k $$;

-- ---------- Candidatures marchand / livreur ----------
create table public.staff_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.application_kind not null,
  status public.application_status not null default 'pending',
  full_name text not null,
  phone text not null,
  details jsonb not null default '{}',
  admin_note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index staff_applications_one_pending on public.staff_applications (user_id, kind) where status = 'pending';

-- ---------- Boutiques (marchands NEAM Market) ----------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  district text not null default '',
  address text not null default '',
  phone text not null default '',
  city text not null default 'Libreville',
  emoji text not null default '🏪',
  is_open boolean not null default true,
  is_active boolean not null default true,
  prep_minutes integer not null default 20 check (prep_minutes between 5 and 180),
  commission_rate numeric(4, 3) not null default 0.100 check (commission_rate between 0 and 0.5),
  created_at timestamptz not null default now()
);
create index stores_owner on public.stores (owner_id);

-- ---------- Produits ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null,
  sub text,
  unit text not null default '',
  emoji text not null default '🛒',
  image_url text,
  description text not null default '',
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price > price),
  in_stock boolean not null default true,
  popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_store on public.products (store_id);

-- ---------- Livreurs (salariés NEAM) ----------
create table public.couriers (
  id uuid primary key references public.profiles (id) on delete cascade,
  vehicle text not null default 'Moto',
  plate text not null default '',
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  location_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Commandes ----------
create sequence public.order_code_seq start 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('NM' || nextval('public.order_code_seq')),
  kind public.order_kind not null,
  status public.order_status not null default 'pending',
  client_id uuid not null references public.profiles (id),
  store_id uuid references public.stores (id),
  courier_id uuid references public.couriers (id),
  contact_name text not null default '',
  contact_phone text not null,
  city text not null default 'Libreville',
  address text not null,
  pickup_address text,          -- express : adresse de ramassage
  parcel jsonb,                 -- express : { size, speed, km, description }
  note text,
  items_total integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  commission integer not null default 0,  -- part NEAM sur les articles
  payment_method text not null default 'cash' check (payment_method = 'cash'),
  cash_collected boolean not null default false,
  cancel_reason text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  closed_at timestamptz,
  constraint market_has_store check (kind <> 'market' or store_id is not null)
);
create index orders_client on public.orders (client_id, created_at desc);
create index orders_store on public.orders (store_id, created_at desc);
create index orders_courier on public.orders (courier_id, created_at desc);
create index orders_status on public.orders (status);

create table public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  emoji text not null default '',
  unit text not null default '',
  price integer not null,
  qty integer not null check (qty > 0)
);
create index order_items_order on public.order_items (order_id);

-- Journal des étapes (affiché dans le suivi)
create table public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  actor_id uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order on public.order_events (order_id, created_at);

-- Code de remise : visible uniquement par le client (le livreur doit le demander)
create table public.order_secrets (
  order_id uuid primary key references public.orders (id) on delete cascade,
  delivery_code text not null
);

-- ---------- Argent ----------
-- Espèces remises par un livreur à NEAM
create table public.cash_remittances (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references public.couriers (id),
  amount integer not null check (amount > 0),
  received_by uuid not null references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

-- Versements de NEAM aux marchands
create table public.merchant_payouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id),
  amount integer not null check (amount > 0),
  reference text,
  paid_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Règles d'accès (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.staff_applications enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.couriers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.order_secrets enable row level security;
alter table public.cash_remittances enable row level security;
alter table public.merchant_payouts enable row level security;

-- Profils : chacun voit le sien, l'admin voit tout ; modification du nom uniquement (via fonction)
create policy profiles_self on public.profiles for select using (id = auth.uid() or public.is_admin());

-- Paramètres : lecture publique
create policy settings_read on public.app_settings for select using (true);

-- Candidatures
create policy apps_read on public.staff_applications for select using (user_id = auth.uid() or public.is_admin());

-- Boutiques : catalogue public (boutiques actives), le propriétaire et l'admin voient tout
create policy stores_read on public.stores for select
  using (is_active or owner_id = auth.uid() or public.is_admin());

-- Produits : lecture publique des boutiques actives ; gestion par le propriétaire de la boutique
create policy products_read on public.products for select
  using (exists (select 1 from public.stores s where s.id = store_id and (s.is_active or s.owner_id = auth.uid())) or public.is_admin());
create policy products_owner_insert on public.products for insert
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.is_admin());
create policy products_owner_update on public.products for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.is_admin())
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.is_admin());
create policy products_owner_delete on public.products for delete
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.is_admin());

-- Commandes : le client, le marchand de la boutique, le livreur affecté, l'admin
create function public.can_see_order(o public.orders) returns boolean
language sql stable security definer set search_path = public as $$
  select o.client_id = auth.uid()
      or o.courier_id = auth.uid()
      or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
      or public.is_admin()
$$;
create policy orders_read on public.orders for select using (public.can_see_order(orders));

create policy order_items_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and public.can_see_order(o)));
create policy order_events_read on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and public.can_see_order(o)));
create policy order_secrets_read on public.order_secrets for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.client_id = auth.uid() or public.is_admin())));

-- Livreurs : le livreur lui-même, l'admin, et le client pendant que sa commande est en route
create policy couriers_read on public.couriers for select using (
  id = auth.uid() or public.is_admin()
  or exists (select 1 from public.orders o where o.courier_id = couriers.id and o.client_id = auth.uid() and o.status in ('assigned', 'picked_up'))
);

create policy remittances_read on public.cash_remittances for select using (courier_id = auth.uid() or public.is_admin());
create policy payouts_read on public.merchant_payouts for select
  using (public.is_admin() or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Le nom du livreur (affiché au client) et le nom du client (affiché au livreur) passent par les commandes
-- (contact_name) et par la fonction courier_public() ci-dessous : les profils restent privés.

-- =====================================================================
-- Fonctions métier
-- =====================================================================

create function public.log_event(p_order uuid, p_status public.order_status, p_note text default null) returns void
language sql security definer set search_path = public as $$
  insert into public.order_events (order_id, status, actor_id, note) values (p_order, p_status, auth.uid(), p_note)
$$;

create function public.require_role(r public.app_role) returns void
language plpgsql stable as $$
begin
  if public.my_role() <> r and not public.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
end $$;

-- Mettre à jour son nom
create function public.update_my_profile(p_full_name text) returns void
language sql security definer set search_path = public as $$
  update public.profiles set full_name = left(trim(p_full_name), 80) where id = auth.uid()
$$;

-- ---------- Client : commande NEAM Market ----------
-- p_items : [{ "product_id": "...", "qty": 2 }, ...] — les prix sont relus en base.
create function public.place_market_order(
  p_store uuid, p_items jsonb, p_address text, p_phone text, p_name text default '', p_note text default null
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
  select * into st from public.stores where id = p_store and is_active;
  if not found then raise exception 'Boutique introuvable'; end if;
  if not st.is_open then raise exception 'La boutique % est fermée pour le moment', st.name; end if;
  if coalesce(trim(p_address), '') = '' then raise exception 'Adresse de livraison requise'; end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Numéro de téléphone requis'; end if;
  if jsonb_array_length(coalesce(p_items, '[]')) = 0 then raise exception 'Panier vide'; end if;

  insert into public.orders (kind, client_id, store_id, contact_name, contact_phone, city, address, note)
  values ('market', auth.uid(), st.id, coalesce(p_name, ''), p_phone, st.city, trim(p_address), p_note)
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

  insert into public.order_secrets (order_id, delivery_code) values (o.id, lpad((floor(random() * 10000))::text, 4, '0'));
  perform public.log_event(o.id, 'pending');
  return o;
end $$;

-- ---------- Client : envoi NEAM Express ----------
create function public.express_quote(p_size text, p_speed text, p_km integer) returns integer
language sql stable as $$
  select (round(((((select value from public.app_settings where key = 'express_base_fee') ->> p_size)::integer
           + greatest(p_km, 1) * 250)
          * ((select value from public.app_settings where key = 'express_speed_factor') ->> p_speed)::numeric) / 100) * 100)::integer
$$;

create function public.place_express_order(
  p_pickup text, p_dropoff text, p_size text, p_speed text, p_km integer,
  p_phone text, p_name text default '', p_description text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  v_fee integer;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  if coalesce(trim(p_pickup), '') = '' or coalesce(trim(p_dropoff), '') = '' then raise exception 'Adresses de ramassage et de livraison requises'; end if;
  if p_size not in ('doc', 's', 'm', 'l') or p_speed not in ('standard', 'express', 'sameday') then raise exception 'Type d’envoi invalide'; end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Numéro de téléphone requis'; end if;
  v_fee := public.express_quote(p_size, p_speed, least(greatest(coalesce(p_km, 1), 1), 60));

  insert into public.orders (kind, client_id, contact_name, contact_phone, address, pickup_address, parcel, delivery_fee, total)
  values ('express', auth.uid(), coalesce(p_name, ''), p_phone, trim(p_dropoff), trim(p_pickup),
          jsonb_build_object('size', p_size, 'speed', p_speed, 'km', p_km, 'description', p_description), v_fee, v_fee)
  returning * into o;

  insert into public.order_secrets (order_id, delivery_code) values (o.id, lpad((floor(random() * 10000))::text, 4, '0'));
  perform public.log_event(o.id, 'pending');
  return o;
end $$;

-- ---------- Client : annulation (tant que rien n'a commencé) ----------
create function public.cancel_my_order(p_order uuid, p_reason text default null) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  update public.orders set status = 'cancelled', cancel_reason = coalesce(p_reason, 'Annulée par le client'), closed_at = now()
   where id = p_order and client_id = auth.uid() and status = 'pending'
  returning * into o;
  if not found then raise exception 'Cette commande ne peut plus être annulée'; end if;
  perform public.log_event(o.id, 'cancelled', o.cancel_reason);
  return o;
end $$;

-- ---------- Marchand ----------
create function public.merchant_update_order(p_order uuid, p_action text, p_reason text default null) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select o2.* into o from public.orders o2 join public.stores s on s.id = o2.store_id
   where o2.id = p_order and (s.owner_id = auth.uid() or public.is_admin()) for update of o2;
  if not found then raise exception 'Commande introuvable' using errcode = '42501'; end if;

  if p_action = 'accept' and o.status = 'pending' then
    update public.orders set status = 'accepted', accepted_at = now() where id = o.id returning * into o;
  elsif p_action = 'reject' and o.status = 'pending' then
    update public.orders set status = 'rejected', cancel_reason = coalesce(p_reason, 'Refusée par la boutique'), closed_at = now() where id = o.id returning * into o;
  elsif p_action = 'ready' and o.status = 'accepted' then
    update public.orders set status = 'ready', ready_at = now() where id = o.id returning * into o;
  elsif p_action = 'ready' and o.status = 'assigned' and o.ready_at is null then
    -- livreur déjà affecté pendant la préparation : on note seulement que c'est prêt
    update public.orders set ready_at = now() where id = o.id returning * into o;
    perform public.log_event(o.id, o.status, 'Commande prête');
    return o;
  else
    raise exception 'Action impossible : la commande est « % »', o.status;
  end if;
  perform public.log_event(o.id, o.status, p_reason);
  return o;
end $$;

create function public.merchant_update_store(p_store uuid, p_is_open boolean, p_prep_minutes integer, p_phone text, p_address text) returns public.stores
language plpgsql security definer set search_path = public as $$
declare s public.stores;
begin
  update public.stores
     set is_open = coalesce(p_is_open, is_open),
         prep_minutes = coalesce(p_prep_minutes, prep_minutes),
         phone = coalesce(p_phone, phone),
         address = coalesce(p_address, address)
   where id = p_store and (owner_id = auth.uid() or public.is_admin())
  returning * into s;
  if not found then raise exception 'Boutique introuvable' using errcode = '42501'; end if;
  return s;
end $$;

-- ---------- Livreur ----------
create function public.courier_set_online(p_online boolean) returns public.couriers
language plpgsql security definer set search_path = public as $$
declare c public.couriers;
begin
  perform public.require_role('courier');
  update public.couriers set is_online = p_online where id = auth.uid() returning * into c;
  if not found then raise exception 'Compte livreur introuvable'; end if;
  return c;
end $$;

create function public.courier_update_location(p_lat double precision, p_lng double precision) returns void
language sql security definer set search_path = public as $$
  update public.couriers set lat = p_lat, lng = p_lng, location_at = now() where id = auth.uid()
$$;

create function public.courier_update_order(p_order uuid, p_action text, p_code text default null) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  v_code text;
begin
  select * into o from public.orders where id = p_order and courier_id = auth.uid() for update;
  if not found then raise exception 'Course introuvable' using errcode = '42501'; end if;

  if p_action = 'pickup' and o.status = 'assigned' then
    if o.kind = 'market' and o.ready_at is null then raise exception 'La boutique n’a pas encore signalé la commande comme prête'; end if;
    update public.orders set status = 'picked_up', picked_up_at = now() where id = o.id returning * into o;
  elsif p_action = 'deliver' and o.status = 'picked_up' then
    select delivery_code into v_code from public.order_secrets where order_id = o.id;
    if v_code is distinct from trim(coalesce(p_code, '')) then raise exception 'Code de remise incorrect'; end if;
    update public.orders set status = 'delivered', delivered_at = now(), closed_at = now(), cash_collected = true
     where id = o.id returning * into o;
  else
    raise exception 'Action impossible : la course est « % »', o.status;
  end if;
  perform public.log_event(o.id, o.status);
  return o;
end $$;

-- Profil public du livreur affecté (nom + téléphone + position) pour le client
create function public.courier_public(p_order uuid)
returns table (full_name text, phone text, vehicle text, lat double precision, lng double precision, location_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.phone, c.vehicle, c.lat, c.lng, c.location_at
    from public.orders o join public.couriers c on c.id = o.courier_id join public.profiles p on p.id = c.id
   where o.id = p_order and public.can_see_order(o)
$$;

-- Coordonnées de la boutique pour le livreur
create function public.order_store_contact(p_order uuid)
returns table (name text, phone text, address text, district text)
language sql stable security definer set search_path = public as $$
  select s.name, s.phone, s.address, s.district
    from public.orders o join public.stores s on s.id = o.store_id
   where o.id = p_order and public.can_see_order(o)
$$;

-- Espèces que le livreur doit remettre à NEAM
create function public.courier_cash_due(p_courier uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(total) from public.orders where courier_id = p_courier and status = 'delivered' and cash_collected), 0)::integer
       - coalesce((select sum(amount) from public.cash_remittances where courier_id = p_courier), 0)::integer
$$;

-- ---------- Candidatures ----------
create function public.submit_application(p_kind public.application_kind, p_full_name text, p_phone text, p_details jsonb) returns public.staff_applications
language plpgsql security definer set search_path = public as $$
declare a public.staff_applications;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  insert into public.staff_applications (user_id, kind, full_name, phone, details)
  values (auth.uid(), p_kind, trim(p_full_name), trim(p_phone), coalesce(p_details, '{}'))
  returning * into a;
  update public.profiles set full_name = trim(p_full_name) where id = auth.uid() and full_name = '';
  return a;
end $$;

-- ---------- Admin ----------
create function public.admin_review_application(p_application uuid, p_approve boolean, p_note text default null) returns public.staff_applications
language plpgsql security definer set search_path = public as $$
declare a public.staff_applications;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.staff_applications
     set status = case when p_approve then 'approved'::public.application_status else 'rejected'::public.application_status end,
         admin_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_application and status = 'pending'
  returning * into a;
  if not found then raise exception 'Candidature introuvable ou déjà traitée'; end if;

  if p_approve then
    update public.profiles set role = a.kind::text::public.app_role, full_name = a.full_name, phone = coalesce(phone, a.phone)
     where id = a.user_id;
    if a.kind = 'courier' then
      insert into public.couriers (id, vehicle, plate)
      values (a.user_id, coalesce(a.details ->> 'vehicle', 'Moto'), coalesce(a.details ->> 'plate', ''))
      on conflict (id) do nothing;
    else
      insert into public.stores (owner_id, name, district, address, phone, emoji)
      values (a.user_id, coalesce(a.details ->> 'store_name', a.full_name), coalesce(a.details ->> 'district', ''),
              coalesce(a.details ->> 'address', ''), a.phone, coalesce(a.details ->> 'emoji', '🏪'));
    end if;
  end if;
  return a;
end $$;

create function public.admin_assign_courier(p_order uuid, p_courier uuid) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if not exists (select 1 from public.couriers c join public.profiles p on p.id = c.id where c.id = p_courier and p.role = 'courier' and p.is_active) then
    raise exception 'Livreur introuvable';
  end if;
  update public.orders
     set courier_id = p_courier, status = 'assigned', assigned_at = now()
   where id = p_order
     and ((kind = 'market' and status in ('accepted', 'ready')) or (kind = 'express' and status = 'pending') or status = 'assigned')
  returning * into o;
  if not found then raise exception 'Cette commande ne peut pas être affectée maintenant'; end if;
  perform public.log_event(o.id, 'assigned');
  return o;
end $$;

create function public.admin_cancel_order(p_order uuid, p_reason text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.orders set status = 'cancelled', cancel_reason = p_reason, closed_at = now()
   where id = p_order and status not in ('delivered', 'cancelled', 'rejected')
  returning * into o;
  if not found then raise exception 'Commande déjà clôturée'; end if;
  perform public.log_event(o.id, 'cancelled', p_reason);
  return o;
end $$;

create function public.admin_record_remittance(p_courier uuid, p_amount integer, p_note text default null) returns public.cash_remittances
language plpgsql security definer set search_path = public as $$
declare r public.cash_remittances;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_amount > public.courier_cash_due(p_courier) then raise exception 'Montant supérieur aux espèces dues par ce livreur'; end if;
  insert into public.cash_remittances (courier_id, amount, received_by, note) values (p_courier, p_amount, auth.uid(), p_note) returning * into r;
  return r;
end $$;

create function public.admin_record_payout(p_store uuid, p_amount integer, p_reference text default null) returns public.merchant_payouts
language plpgsql security definer set search_path = public as $$
declare r public.merchant_payouts;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  insert into public.merchant_payouts (store_id, amount, reference, paid_by) values (p_store, p_amount, p_reference, auth.uid()) returning * into r;
  return r;
end $$;

create function public.admin_update_store(p_store uuid, p_is_active boolean, p_commission numeric) returns public.stores
language plpgsql security definer set search_path = public as $$
declare s public.stores;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.stores set is_active = coalesce(p_is_active, is_active), commission_rate = coalesce(p_commission, commission_rate)
   where id = p_store returning * into s;
  return s;
end $$;

create function public.admin_set_user_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'Vous ne pouvez pas désactiver votre propre compte'; end if;
  update public.profiles set is_active = p_active where id = p_user;
  if not p_active then update public.couriers set is_online = false where id = p_user; end if;
end $$;

create function public.admin_update_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  update public.app_settings set value = p_value, updated_at = now() where key = p_key;
  if not found then raise exception 'Paramètre inconnu'; end if;
end $$;

-- Synthèse financière d'une boutique (marchand ou admin)
create function public.store_finances(p_store uuid)
returns table (orders_count integer, sales integer, commission integer, net integer, paid integer, balance integer)
language sql stable security definer set search_path = public as $$
  with ok as (
    select 1 from public.stores s where s.id = p_store and (s.owner_id = auth.uid() or public.is_admin())
  ), d as (
    select count(*)::integer n, coalesce(sum(items_total), 0)::integer sales, coalesce(sum(commission), 0)::integer com
      from public.orders where store_id = p_store and status = 'delivered'
  ), p as (
    select coalesce(sum(amount), 0)::integer paid from public.merchant_payouts where store_id = p_store
  )
  select d.n, d.sales, d.com, d.sales - d.com, p.paid, d.sales - d.com - p.paid from d, p where exists (select 1 from ok)
$$;

-- Liste des livreurs avec leur état (admin)
create function public.admin_couriers()
returns table (id uuid, full_name text, phone text, vehicle text, plate text, is_online boolean, is_active boolean,
               lat double precision, lng double precision, location_at timestamptz, active_orders integer, delivered_today integer, cash_due integer)
language sql stable security definer set search_path = public as $$
  select c.id, p.full_name, p.phone, c.vehicle, c.plate, c.is_online, p.is_active, c.lat, c.lng, c.location_at,
         (select count(*) from public.orders o where o.courier_id = c.id and o.status in ('assigned', 'picked_up'))::integer,
         (select count(*) from public.orders o where o.courier_id = c.id and o.status = 'delivered' and o.delivered_at >= date_trunc('day', now()))::integer,
         public.courier_cash_due(c.id)
    from public.couriers c join public.profiles p on p.id = c.id
   where public.is_admin()
   order by c.is_online desc, p.full_name
$$;

-- Liste des comptes (admin)
create function public.admin_users(p_search text default null)
returns table (id uuid, full_name text, phone text, role public.app_role, is_active boolean, created_at timestamptz, orders_count integer)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.phone, p.role, p.is_active, p.created_at,
         (select count(*) from public.orders o where o.client_id = p.id)::integer
    from public.profiles p
   where public.is_admin()
     and (p_search is null or p.full_name ilike '%' || p_search || '%' or p.phone ilike '%' || p_search || '%')
   order by p.created_at desc
   limit 200
$$;

-- Indicateurs du tableau de bord (admin)
create function public.admin_stats(p_from timestamptz, p_to timestamptz)
returns table (orders_count integer, delivered integer, cancelled integer, gmv integer, commission integer, delivery_fees integer,
               active_now integer, couriers_online integer, pending_applications integer, new_clients integer)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.orders where created_at between p_from and p_to)::integer,
    (select count(*) from public.orders where status = 'delivered' and delivered_at between p_from and p_to)::integer,
    (select count(*) from public.orders where status in ('cancelled', 'rejected') and closed_at between p_from and p_to)::integer,
    (select coalesce(sum(total), 0) from public.orders where status = 'delivered' and delivered_at between p_from and p_to)::integer,
    (select coalesce(sum(commission), 0) from public.orders where status = 'delivered' and delivered_at between p_from and p_to)::integer,
    (select coalesce(sum(delivery_fee), 0) from public.orders where status = 'delivered' and delivered_at between p_from and p_to)::integer,
    (select count(*) from public.orders where status in ('pending', 'accepted', 'ready', 'assigned', 'picked_up'))::integer,
    (select count(*) from public.couriers where is_online)::integer,
    (select count(*) from public.staff_applications where status = 'pending')::integer,
    (select count(*) from public.profiles where role = 'client' and created_at between p_from and p_to)::integer
  where public.is_admin()
$$;

-- =====================================================================
-- Droits d'exécution : uniquement les utilisateurs connectés
-- =====================================================================
revoke execute on all functions in schema public from public, anon;
grant execute on function public.express_quote(text, text, integer) to anon, authenticated;
grant execute on function public.setting_int(text) to anon, authenticated;
grant execute on function public.my_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_see_order(public.orders) to anon, authenticated;
grant execute on all functions in schema public to authenticated;
-- La fonction de déclenchement n'est appelée que par la base
revoke execute on function public.handle_new_user() from authenticated;

-- Écritures directes interdites : tout passe par les fonctions ci-dessus (sauf le catalogue du marchand)
revoke insert, update, delete on all tables in schema public from anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to authenticated;

-- =====================================================================
-- Temps réel (les règles d'accès s'appliquent aussi aux abonnements)
-- =====================================================================
alter publication supabase_realtime add table public.orders, public.order_events, public.couriers, public.staff_applications;

-- ===================== Données de départ (facultatif) =====================
-- Données de départ (développement et démonstration).
-- Boutiques NEAM Market à Libreville : sans propriétaire au départ (gérées par l'admin),
-- un marchand validé reçoit sa propre boutique.
insert into public.stores (id, name, district, address, phone, emoji, prep_minutes) values
  ('11111111-1111-4111-8111-000000000001', 'Marché Mont-Bouët', 'Mont-Bouët', 'Grand marché de Mont-Bouët, allée des primeurs', '+241 07 00 00 11', '🧺', 20),
  ('11111111-1111-4111-8111-000000000002', 'Marché Nkembo', 'Nkembo', 'Marché de Nkembo, entrée principale', '+241 07 00 00 12', '🥬', 25),
  ('11111111-1111-4111-8111-000000000003', 'Ferme d’Okolassi', 'Okolassi', 'Route d’Okolassi, PK 12', '+241 07 00 00 13', '🐔', 30),
  ('11111111-1111-4111-8111-000000000004', 'NEAM Market Louis', 'Louis', 'Boulevard Triomphal, quartier Louis', '+241 07 00 00 14', '🛒', 15);

insert into public.products (store_id, name, category, sub, unit, emoji, description, price, old_price, popular) values
  ('11111111-1111-4111-8111-000000000001', 'Tomate', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🍅', 'Tomates fraîches et bien mûres, idéales pour vos sauces.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Oignon', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🧅', 'Oignons jaunes, indispensables en cuisine.', 800, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Piment', 'Fruits & Légumes Frais', 'Légumes', '100 g', '🌶️', 'Piment frais local, pour relever tous vos plats.', 300, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Carotte', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🥕', 'Carottes croquantes cultivées localement.', 900, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Poivron', 'Fruits & Légumes Frais', 'Légumes', '1 kg', '🫑', 'Poivrons rouges, jaunes et verts.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Chou', 'Fruits & Légumes Frais', 'Légumes', '1 pièce', '🥬', 'Chou pommé frais.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Banane plantain', 'Fruits & Légumes Frais', 'Fruits', '1 kg', '🍌', 'Bananes plantain mûres à point, pour l’alloco ou en accompagnement.', 600, 750, true),
  ('11111111-1111-4111-8111-000000000002', 'Manioc', 'Fruits & Légumes Frais', 'Tubercules', '1 kg', '🍠', 'Tubercules de manioc frais.', 700, null, false),
  ('11111111-1111-4111-8111-000000000001', 'Avocat', 'Fruits & Légumes Frais', 'Fruits', '1 kg', '🥑', 'Avocats crémeux, prêts à consommer.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000003', 'Ananas du Gabon', 'Fruits & Légumes Frais', 'Fruits', 'la pièce', '🍍', 'Ananas sucré et juteux, cultivé localement.', 1000, null, false),
  ('11111111-1111-4111-8111-000000000002', 'Igname', 'Fruits & Légumes Frais', 'Tubercules', '1 kg', '🥔', 'Igname blanche, ferme et savoureuse.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Riz parfumé', 'Produits alimentaires', null, '5 kg', '🍚', 'Riz long grain parfumé, sac de 5 kg.', 4250, 5000, true),
  ('11111111-1111-4111-8111-000000000004', 'Huile végétale', 'Produits alimentaires', null, '1 L', '🫗', 'Huile végétale raffinée pour toutes vos cuissons.', 1200, null, true),
  ('11111111-1111-4111-8111-000000000002', 'Bâtons de manioc', 'Produits alimentaires', null, 'lot de 3', '🥖', 'Bâtons de manioc préparés de façon traditionnelle.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Sardines à l’huile', 'Produits alimentaires', null, 'lot de 4', '🐟', 'Sardines à l’huile végétale, boîtes de 125 g.', 2000, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Eau minérale', 'Boissons', null, 'pack 6 x 1,5 L', '💧', 'Pack de 6 bouteilles d’eau minérale naturelle.', 2400, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Jus de bissap', 'Boissons', null, '1 L', '🧃', 'Jus d’hibiscus artisanal, légèrement sucré.', 1000, 1300, false),
  ('11111111-1111-4111-8111-000000000004', 'Savon de toilette', 'Hygiène & Beauté', null, 'lot de 4', '🧼', 'Savons parfumés pour toute la famille.', 1500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Dentifrice', 'Hygiène & Beauté', null, '100 ml', '🪥', 'Protection complète, haleine fraîche.', 1200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Lessive en poudre', 'Produits d’entretien', null, '2 kg', '🧺', 'Lessive efficace dès 30 °C.', 3200, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Eau de Javel', 'Produits d’entretien', null, '1 L', '🧴', 'Désinfecte et blanchit.', 900, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Lait infantile', 'Bébé & Mum', null, '800 g', '🍼', 'Lait 2e âge, de 6 à 12 mois.', 8500, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Couches T4', 'Bébé & Mum', null, 'paquet de 44', '👶', 'Couches ultra-absorbantes 9-14 kg.', 9000, 10500, false),
  ('11111111-1111-4111-8111-000000000004', 'Ventilateur sur pied', 'Électronique & Maison', null, 'la pièce', '🌀', 'Ventilateur 3 vitesses, oscillant, 40 cm.', 18000, null, false),
  ('11111111-1111-4111-8111-000000000004', 'Bouilloire électrique', 'Électronique & Maison', null, '1,7 L', '🫖', 'Arrêt automatique, base 360°.', 9500, null, false);

-- ===================== Premier administrateur =====================
-- 1. Connectez-vous une fois à l'application avec votre numéro (ex. +241 077 12 34 56).
-- 2. Puis exécutez (en remplaçant le numéro, sans « + » ni espaces) :
-- update public.profiles set role = 'admin', full_name = 'Direction NEAM' where phone = '241077123456';
