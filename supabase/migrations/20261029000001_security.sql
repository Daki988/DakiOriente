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
