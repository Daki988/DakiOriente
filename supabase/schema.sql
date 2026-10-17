-- Neam Print — schéma Supabase
-- À exécuter une fois dans Supabase › SQL Editor, puis supabase/seed.sql pour le catalogue.

-- ───────── Administrateurs ─────────
create table if not exists public.admins (
  email text primary key,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'atelier')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;

create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admins where email = lower(auth.jwt() ->> 'email');
$$;

-- ───────── Catalogue ─────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  category_slug text not null,
  color text not null default 'yellow',
  description text not null default '',
  unit text not null default 'ex.',
  pricing text not null default 'pack' check (pricing in ('pack', 'unit', 'area')),
  tiers jsonb not null default '[]',
  options jsonb not null default '[]',
  format_mm int[],
  customizable boolean not null default true,
  visible boolean not null default true,
  featured boolean not null default false,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- ───────── Commandes ─────────
create sequence if not exists public.order_number start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('NP-' || nextval('public.order_number')),
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  selection jsonb not null,
  amount int not null check (amount >= 0),
  delivery text not null check (delivery in ('pickup', 'libreville')),
  delivery_address text,
  notes text,
  design_service boolean not null default false,
  file_path text,
  file_name text,
  status smallint not null default 0 check (status between 0 and 4),
  cancelled boolean not null default false,
  payment_method text,
  paid_at timestamptz
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null,
  detail text,
  actor text
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ───────── Sécurité (RLS) ─────────
-- Les visiteurs ne lisent que les produits visibles. Les commandes sont créées par le
-- serveur (clé service) et ne sont lisibles que par les administrateurs.
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "admins lisent la liste" on public.admins;
create policy "admins lisent la liste" on public.admins for select using (public.is_admin());
drop policy if exists "super admin gère les admins" on public.admins;
create policy "super admin gère les admins" on public.admins for all
  using (public.admin_role() = 'super_admin') with check (public.admin_role() = 'super_admin');

drop policy if exists "catalogue public" on public.products;
create policy "catalogue public" on public.products for select using (visible or public.is_admin());
drop policy if exists "admins gèrent le catalogue" on public.products;
create policy "admins gèrent le catalogue" on public.products for all
  using (public.admin_role() in ('super_admin', 'admin')) with check (public.admin_role() in ('super_admin', 'admin'));

drop policy if exists "admins gèrent les commandes" on public.orders;
create policy "admins gèrent les commandes" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins gèrent l'historique" on public.order_events;
create policy "admins gèrent l'historique" on public.order_events for all using (public.is_admin()) with check (public.is_admin());

-- ───────── Fichiers d'impression (privés) ─────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('print-files', 'print-files', false, 104857600)  -- 100 Mo
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "admins lisent les fichiers" on storage.objects;
create policy "admins lisent les fichiers" on storage.objects for select
  using (bucket_id = 'print-files' and public.is_admin());

-- ───────── Super administrateur ─────────
-- Le compte (e-mail + mot de passe) se crée dans Authentication › Users.
-- Cette ligne lui donne les droits : ne jamais mettre de mot de passe dans ce fichier.
insert into public.admins (email, role) values ('daki.liaison@gmail.com', 'super_admin')
on conflict (email) do update set role = 'super_admin';
