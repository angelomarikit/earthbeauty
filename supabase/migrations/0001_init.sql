-- Earth Beauty & Wellness — initial schema
-- Run this entire file in the Supabase SQL Editor.
-- Do not expose the service role key in the frontend.
-- Money is stored as integer centavos. Prices on orders are snapshotted here, never trusted from the browser.

create extension if not exists pgcrypto;

create sequence if not exists order_number_seq start 1100;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  street text not null,
  region text not null,
  province text not null,
  city text not null,
  barangay text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  symbol text not null default '✦',
  tint text not null default '#faeaf0',
  image_url text,
  blurb text not null default 'Shop collection →',
  active boolean not null default true,
  sort_order integer not null default 0,
  show_on_homepage boolean not null default false,
  show_in_nav boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  how_to_use text not null default '',
  shipping_note text not null default '',
  sku text not null unique,
  price_centavos integer not null check (price_centavos >= 0),
  compare_at_centavos integer check (compare_at_centavos is null or compare_at_centavos >= 0),
  stock integer not null default 0 check (stock >= 0),
  badge text,
  pack text not null default 'bottle',
  gallery text[] not null default '{}',
  image_url text,
  featured boolean not null default false,
  is_new boolean not null default false,
  best_seller boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  sku text not null unique,
  price_centavos integer not null check (price_centavos >= 0),
  compare_at_centavos integer,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text not null,
  delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_centavos integer not null check (fee_centavos >= 0),
  detail text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  amount integer not null check (amount >= 0),
  min_subtotal_centavos integer not null default 0,
  active boolean not null default true,
  label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  street text not null,
  region text not null,
  province text not null,
  city text not null,
  barangay text not null,
  postal_code text not null,
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  discount_centavos integer not null default 0 check (discount_centavos >= 0),
  shipping_centavos integer not null default 0 check (shipping_centavos >= 0),
  total_centavos integer not null check (total_centavos >= 0),
  coupon_code text,
  shipping_method_id uuid references public.shipping_methods(id),
  shipping_method_name text not null,
  payment_method text not null check (payment_method in ('cod', 'gcash', 'paymongo')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending_verification', 'paid', 'failed', 'refunded')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text not null default '',
  tracking_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  variant_label text not null,
  sku text not null,
  unit_price_centavos integer not null check (unit_price_centavos >= 0),
  quantity integer not null check (quantity > 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null,
  status text not null,
  amount_centavos integer not null check (amount_centavos >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default '',
  title text not null,
  subtitle text not null default '',
  button_label text not null default '',
  href text not null default '/shop',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null,
  legal_name text not null,
  address text not null,
  phone text not null,
  email text not null default '',
  announcement text not null default '',
  about text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  tiktok text not null default '',
  low_stock_threshold integer not null default 8,
  gcash_account_name text not null default '',
  gcash_number text not null default '',
  gcash_instructions text not null default '',
  cod_enabled boolean not null default true,
  gcash_enabled boolean not null default true,
  policies jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  fulfillment_status text not null,
  payment_status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);
create index if not exists variants_product_idx on public.product_variants (product_id);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists movements_product_idx on public.inventory_movements (product_id, created_at desc);

drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists categories_updated on public.categories;
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_delta integer,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required';
  end if;
  if p_variant_id is not null then
    update public.product_variants
      set stock = stock + p_delta
      where id = p_variant_id and product_id = p_product_id and stock + p_delta >= 0
      returning stock into next_stock;
    if next_stock is null then
      raise exception 'Stock cannot go below zero';
    end if;
    update public.products p
      set stock = coalesce((select sum(stock) from public.product_variants v where v.product_id = p.id), 0)
      where p.id = p_product_id;
  else
    update public.products
      set stock = stock + p_delta
      where id = p_product_id and stock + p_delta >= 0
      returning stock into next_stock;
    if next_stock is null then
      raise exception 'Stock cannot go below zero';
    end if;
  end if;
  insert into public.inventory_movements (product_id, variant_id, sku, delta, balance_after, reason)
  select p_product_id, p_variant_id, sku, p_delta, next_stock, trim(p_reason)
  from public.products where id = p_product_id;
  insert into public.audit_logs (actor, action, detail)
  values (auth.uid(), 'adjust_stock', p_product_id::text || ' ' || p_delta::text);
  return next_stock;
end;
$$;

create or replace function public.place_order(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  variant_row public.product_variants%rowtype;
  line_price integer;
  line_qty integer;
  subtotal integer := 0;
  discount integer := 0;
  shipping integer := 0;
  coupon_row public.coupons%rowtype;
  ship_row public.shipping_methods%rowtype;
  new_id uuid := gen_random_uuid();
  order_no text;
  pay_status text;
  method text;
begin
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then
    raise exception 'Cart is empty';
  end if;
  method := payload->>'payment_method';
  if method not in ('cod', 'gcash') then
    raise exception 'That payment method is not available';
  end if;

  select * into ship_row from public.shipping_methods
    where id = (payload->>'shipping_method_id')::uuid and active = true;
  if ship_row.id is null then
    raise exception 'Choose a delivery method';
  end if;
  shipping := ship_row.fee_centavos;

  create temporary table _lines (
    product_id uuid,
    variant_id uuid,
    name text,
    variant_label text,
    sku text,
    unit_price integer,
    quantity integer
  ) on commit drop;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    line_qty := (item->>'quantity')::integer;
    if line_qty is null or line_qty < 1 then
      raise exception 'Invalid quantity';
    end if;
    select * into product_row from public.products where id = (item->>'product_id')::uuid and active = true for update;
    if product_row.id is null then
      raise exception 'A product is no longer available';
    end if;
    if item->>'variant_id' is not null then
      select * into variant_row from public.product_variants
        where id = (item->>'variant_id')::uuid and product_id = product_row.id and active = true for update;
    else
      select * into variant_row from public.product_variants
        where product_id = product_row.id and active = true order by created_at limit 1 for update;
    end if;
    if variant_row.id is null or variant_row.stock < line_qty then
      raise exception 'Not enough stock';
    end if;
    line_price := variant_row.price_centavos;
    update public.product_variants set stock = stock - line_qty where id = variant_row.id;
    update public.products
      set stock = coalesce((select sum(stock) from public.product_variants v where v.product_id = product_row.id), 0)
      where id = product_row.id;
    insert into public.inventory_movements (product_id, variant_id, sku, delta, balance_after, reason)
    values (product_row.id, variant_row.id, variant_row.sku, -line_qty, variant_row.stock - line_qty, 'Reserved for new order');
    insert into _lines values (product_row.id, variant_row.id, product_row.name, variant_row.label, variant_row.sku, line_price, line_qty);
    subtotal := subtotal + (line_price * line_qty);
  end loop;

  if coalesce(payload->>'coupon_code', '') <> '' then
    select * into coupon_row from public.coupons
      where lower(code) = lower(payload->>'coupon_code') and active = true;
    if coupon_row.id is not null and subtotal >= coupon_row.min_subtotal_centavos then
      if coupon_row.type = 'percent' then
        discount := round(subtotal * (coupon_row.amount / 100.0));
      else
        discount := least(coupon_row.amount, subtotal);
      end if;
    end if;
  end if;

  pay_status := case when method = 'gcash' then 'pending_verification' else 'unpaid' end;
  order_no := 'EBW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');

  insert into public.orders (
    id, order_number, customer_id, customer_name, email, phone,
    street, region, province, city, barangay, postal_code,
    subtotal_centavos, discount_centavos, shipping_centavos, total_centavos,
    coupon_code, shipping_method_id, shipping_method_name,
    payment_method, payment_status, fulfillment_status, notes
  ) values (
    new_id, order_no, auth.uid(), payload->>'customer_name', payload->>'email', payload->>'phone',
    payload#>>'{address,street}', payload#>>'{address,region}', payload#>>'{address,province}',
    payload#>>'{address,city}', payload#>>'{address,barangay}', payload#>>'{address,postalCode}',
    subtotal, discount, shipping, greatest(0, subtotal - discount + shipping),
    coupon_row.code, ship_row.id, ship_row.name,
    method, pay_status, 'pending', coalesce(payload->>'notes', '')
  );

  insert into public.order_items (order_id, product_id, variant_id, name, variant_label, sku, unit_price_centavos, quantity)
  select new_id, product_id, variant_id, name, variant_label, sku, unit_price, quantity from _lines;

  insert into public.payments (order_id, method, status, amount_centavos)
  values (new_id, method, pay_status, greatest(0, subtotal - discount + shipping));

  insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
  values (new_id, 'pending', pay_status, 'Order created. No payment was captured by this function.');

  return new_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;
alter table public.order_status_history enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy roles_read on public.user_roles for select using (user_id = auth.uid() or public.is_admin());

create policy addresses_owner on public.addresses for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy categories_public_read on public.categories for select using (active = true or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy products_public_read on public.products for select using (active = true or public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy images_public_read on public.product_images for select using (true);
create policy images_admin on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy variants_public_read on public.product_variants for select using (active = true or public.is_admin());
create policy variants_admin on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy shipping_public on public.shipping_methods for select using (active = true or public.is_admin());
create policy shipping_admin on public.shipping_methods for all using (public.is_admin()) with check (public.is_admin());
create policy banners_public on public.banners for select using (active = true or public.is_admin());
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy settings_public on public.store_settings for select using (true);
create policy settings_admin on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

create policy orders_select on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy orders_admin_update on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy order_items_select on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);
create policy payments_select on public.payments for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy proofs_admin on public.payment_proofs for all using (public.is_admin()) with check (public.is_admin());
create policy history_select on public.order_status_history for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy movements_admin on public.inventory_movements for select using (public.is_admin());
create policy audit_admin on public.audit_logs for select using (public.is_admin());

insert into public.store_settings (id, business_name, legal_name, address, phone, announcement)
values (
  1,
  'Earth Beauty & Wellness',
  'Earth Beauty & Wellness, OPC',
  '3/F Gran Esperanza Building, Block C2 Lot 15 Villa Caceres Commercial, Balibago, City of Santa Rosa, Laguna',
  '09778401931',
  'FREE SHIPPING ON SELECTED ORDERS · NEW ARRIVALS NOW AVAILABLE · SHOP YOUR SELF-CARE ESSENTIALS'
)
on conflict (id) do nothing;

-- Storage: create a public product-images bucket and a private payment-proofs bucket in the Supabase dashboard.
-- Do not add a public policy for payment-proofs. Admins should use signed URLs.
-- Grant execute on the two functions to the logged-in role after you review them:
-- grant execute on function public.place_order(jsonb) to authenticated, anon;
-- grant execute on function public.adjust_stock(uuid, uuid, integer, text) to authenticated;
