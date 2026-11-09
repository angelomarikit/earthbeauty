-- Earth Beauty & Wellness — manual payment methods (COD, GCash, Maya, QR Ph)
-- Incremental migration. Run AFTER 0001_init.sql in the Supabase SQL Editor.
-- Do not run in production without a backup. This file does not drop business tables.

begin;

-- ---------------------------------------------------------------------------
-- 1. Normalize payment method identifiers (stable public API)
-- ---------------------------------------------------------------------------

update public.orders
set payment_method = 'gcash_manual'
where payment_method = 'gcash';

update public.payments
set method = 'gcash_manual'
where method = 'gcash';

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'gcash_manual', 'maya_manual', 'qrph_manual'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in (
    'unpaid',
    'pending_verification',
    'paid',
    'rejected',
    'failed',
    'refund_pending',
    'refunded'
  ));

alter table public.orders
  add column if not exists stock_reserved_until timestamptz,
  add column if not exists payment_reference text not null default '',
  add column if not exists idempotency_key text,
  add column if not exists cod_collected_centavos integer check (cod_collected_centavos is null or cod_collected_centavos >= 0),
  add column if not exists cod_collected_at timestamptz,
  add column if not exists cod_collected_by uuid references auth.users(id) on delete set null;

create unique index if not exists orders_idempotency_key_idx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 2. Store settings — four manual payment methods
-- ---------------------------------------------------------------------------

alter table public.store_settings
  add column if not exists gcash_qr_path text not null default '',
  add column if not exists gcash_deadline_minutes integer check (gcash_deadline_minutes is null or gcash_deadline_minutes > 0),
  add column if not exists maya_enabled boolean not null default false,
  add column if not exists maya_account_name text not null default '',
  add column if not exists maya_number text not null default '',
  add column if not exists maya_instructions text not null default '',
  add column if not exists maya_qr_path text not null default '',
  add column if not exists maya_deadline_minutes integer check (maya_deadline_minutes is null or maya_deadline_minutes > 0),
  add column if not exists qrph_enabled boolean not null default false,
  add column if not exists qrph_display_name text not null default '',
  add column if not exists qrph_recipient_info text not null default '',
  add column if not exists qrph_instructions text not null default '',
  add column if not exists qrph_qr_path text not null default '',
  add column if not exists qrph_deadline_minutes integer check (qrph_deadline_minutes is null or qrph_deadline_minutes > 0),
  add column if not exists cod_instructions text not null default '',
  add column if not exists cod_deadline_minutes integer check (cod_deadline_minutes is null or cod_deadline_minutes > 0),
  add column if not exists reservation_ttl_minutes integer not null default 1440 check (reservation_ttl_minutes > 0);

-- Public checkout may read only payment-facing columns (no secrets beyond recipient details).
comment on column public.store_settings.gcash_qr_path is 'Storage path in private payment-qr bucket or public path if you choose to serve QR separately.';
comment on column public.store_settings.reservation_ttl_minutes is 'Default unpaid manual-payment reservation window before eligible auto-release.';

-- ---------------------------------------------------------------------------
-- 3. Payments — extensible provider record (manual now, gateway later)
-- ---------------------------------------------------------------------------

alter table public.payments
  add column if not exists provider text not null default 'manual',
  add column if not exists payment_method text,
  add column if not exists provider_reference text not null default '',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists external_transaction_id text not null default '',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists idempotency_key text;

update public.payments p
set payment_method = coalesce(nullif(p.payment_method, ''), p.method)
where payment_method is null;

create unique index if not exists payments_idempotency_key_idx
  on public.payments (idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- 4. Payment proofs — customer submission + admin verification
-- ---------------------------------------------------------------------------

alter table public.payment_proofs
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists payment_method text not null default '',
  add column if not exists reference_number text not null default '',
  add column if not exists amount_claimed_centavos integer check (amount_claimed_centavos is null or amount_claimed_centavos >= 0),
  add column if not exists file_name text not null default '',
  add column if not exists mime_type text not null default '',
  add column if not exists verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected', 'superseded')),
  add column if not exists admin_notes text not null default '',
  add column if not exists rejection_reason text not null default '',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists attempt_number integer not null default 1 check (attempt_number > 0);

create index if not exists payment_proofs_order_idx on public.payment_proofs (order_id, created_at desc);
create index if not exists payment_proofs_status_idx on public.payment_proofs (verification_status);

create table if not exists public.payment_verification_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  proof_id uuid references public.payment_proofs(id) on delete set null,
  action text not null check (action in ('submitted', 'approved', 'rejected', 'request_resubmit', 'cod_collected')),
  actor uuid references auth.users(id) on delete set null,
  note text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_verification_events_order_idx
  on public.payment_verification_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Inventory reservations (transaction-safe manual-payment flow)
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  sku text not null,
  quantity integer not null check (quantity > 0),
  status text not null default 'active'
    check (status in ('active', 'committed', 'released', 'expired_pending_review')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz,
  committed_at timestamptz,
  release_reason text not null default '',
  unique (order_id, product_id, variant_id)
);

create index if not exists inventory_reservations_active_idx
  on public.inventory_reservations (product_id, variant_id, status)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- 6. Helper: available stock after active reservations
-- ---------------------------------------------------------------------------

create or replace function public.available_variant_stock(p_variant_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce((select stock from public.product_variants where id = p_variant_id), 0)
    - coalesce((
      select sum(r.quantity)
      from public.inventory_reservations r
      where r.variant_id = p_variant_id and r.status = 'active'
    ), 0)
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. place_order — reserves stock, never marks payment paid
-- ---------------------------------------------------------------------------

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
  settings_row public.store_settings%rowtype;
  new_id uuid := gen_random_uuid();
  order_no text;
  pay_status text;
  method text;
  reservation_minutes integer;
  reserve_until timestamptz;
  available integer;
  idem text;
begin
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then
    raise exception 'Cart is empty';
  end if;

  method := payload->>'payment_method';
  if method not in ('cod', 'gcash_manual', 'maya_manual', 'qrph_manual') then
    raise exception 'That payment method is not available';
  end if;

  idem := nullif(trim(payload->>'idempotency_key'), '');
  if idem is not null and exists (select 1 from public.orders where idempotency_key = idem) then
    return (select id from public.orders where idempotency_key = idem limit 1);
  end if;

  select * into settings_row from public.store_settings where id = 1;
  if settings_row.id is null then
    raise exception 'Store settings are not configured';
  end if;

  if method = 'cod' and settings_row.cod_enabled is not true then
    raise exception 'Cash on delivery is not available';
  end if;
  if method = 'gcash_manual' and settings_row.gcash_enabled is not true then
    raise exception 'GCash is not available';
  end if;
  if method = 'maya_manual' and settings_row.maya_enabled is not true then
    raise exception 'Maya is not available';
  end if;
  if method = 'qrph_manual' and settings_row.qrph_enabled is not true then
    raise exception 'QR Ph is not available';
  end if;

  select * into ship_row from public.shipping_methods
    where id = (payload->>'shipping_method_id')::uuid and active = true;
  if ship_row.id is null then
    raise exception 'Choose a delivery method';
  end if;
  shipping := ship_row.fee_centavos;

  reservation_minutes := coalesce(settings_row.reservation_ttl_minutes, 1440);
  reserve_until := now() + make_interval(mins => reservation_minutes);

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
    select * into product_row from public.products where id = (item->>'product_id')::uuid and active = true;
    if product_row.id is null then
      raise exception 'A product is no longer available';
    end if;
    if item->>'variant_id' is not null then
      select * into variant_row from public.product_variants
        where id = (item->>'variant_id')::uuid and product_id = product_row.id and active = true;
    else
      select * into variant_row from public.product_variants
        where product_id = product_row.id and active = true order by created_at limit 1;
    end if;
    if variant_row.id is null then
      raise exception 'A variant is no longer available';
    end if;

    available := public.available_variant_stock(variant_row.id);
    if available < line_qty then
      raise exception 'Not enough stock';
    end if;

    line_price := variant_row.price_centavos;
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

  pay_status := case
    when method = 'cod' then 'unpaid'
    else 'unpaid'
  end;

  order_no := 'EBW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');

  insert into public.orders (
    id, order_number, customer_id, customer_name, email, phone,
    street, region, province, city, barangay, postal_code,
    subtotal_centavos, discount_centavos, shipping_centavos, total_centavos,
    coupon_code, shipping_method_id, shipping_method_name,
    payment_method, payment_status, fulfillment_status, notes,
    stock_reserved_until, idempotency_key
  ) values (
    new_id, order_no, auth.uid(), payload->>'customer_name', payload->>'email', payload->>'phone',
    payload#>>'{address,street}', payload#>>'{address,region}', payload#>>'{address,province}',
    payload#>>'{address,city}', payload#>>'{address,barangay}', payload#>>'{address,postalCode}',
    subtotal, discount, shipping, greatest(0, subtotal - discount + shipping),
    coupon_row.code, ship_row.id, ship_row.name,
    method, pay_status, 'pending', coalesce(payload->>'notes', ''),
    reserve_until, idem
  );

  insert into public.order_items (order_id, product_id, variant_id, name, variant_label, sku, unit_price_centavos, quantity)
  select new_id, product_id, variant_id, name, variant_label, sku, unit_price, quantity from _lines;

  insert into public.inventory_reservations (order_id, product_id, variant_id, sku, quantity, expires_at)
  select new_id, product_id, variant_id, sku, quantity, reserve_until from _lines;

  insert into public.payments (order_id, method, payment_method, provider, status, amount_centavos, idempotency_key)
  values (new_id, method, method, 'manual', pay_status, greatest(0, subtotal - discount + shipping), idem);

  insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
  values (new_id, 'pending', pay_status, 'Order created. Payment is not marked paid by place_order.');

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. submit_payment_proof — after authoritative order exists
-- ---------------------------------------------------------------------------

create or replace function public.submit_payment_proof(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  proof_id uuid := gen_random_uuid();
  attempt_no integer := 1;
  ref_no text;
  claimed integer;
  path text;
begin
  select * into target_order from public.orders where id = (payload->>'order_id')::uuid;
  if target_order.id is null then
    raise exception 'Order not found';
  end if;
  if target_order.customer_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if target_order.payment_method = 'cod' then
    raise exception 'Cash on delivery does not use payment proof upload';
  end if;
  if target_order.payment_status = 'paid' then
    raise exception 'Payment is already marked paid';
  end if;

  ref_no := trim(coalesce(payload->>'reference_number', ''));
  if length(ref_no) < 4 then
    raise exception 'Enter a valid transaction reference';
  end if;
  path := trim(coalesce(payload->>'storage_path', ''));
  if length(path) < 3 then
    raise exception 'Upload payment proof';
  end if;
  claimed := nullif(payload->>'amount_claimed_centavos', '')::integer;
  if claimed is not null and claimed <> target_order.total_centavos then
    raise exception 'Claimed amount must match the order total';
  end if;

  select coalesce(max(attempt_number), 0) + 1 into attempt_no
  from public.payment_proofs where order_id = target_order.id;

  update public.payment_proofs
  set verification_status = 'superseded'
  where order_id = target_order.id and verification_status = 'pending';

  insert into public.payment_proofs (
    id, order_id, storage_path, submitted_by, payment_method, reference_number,
    amount_claimed_centavos, file_name, mime_type, verification_status, attempt_number
  ) values (
    proof_id, target_order.id, path, auth.uid(), target_order.payment_method, ref_no,
    coalesce(claimed, target_order.total_centavos),
    coalesce(payload->>'file_name', ''), coalesce(payload->>'mime_type', ''), 'pending', attempt_no
  );

  update public.orders
  set payment_reference = ref_no,
      payment_status = 'pending_verification',
      updated_at = now()
  where id = target_order.id;

  update public.payments
  set status = 'pending_verification',
      provider_reference = ref_no,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('latest_proof_id', proof_id)
  where order_id = target_order.id;

  insert into public.payment_verification_events (order_id, proof_id, action, actor, note)
  values (target_order.id, proof_id, 'submitted', auth.uid(), 'Customer submitted payment proof');

  insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
  values (target_order.id, target_order.fulfillment_status, 'pending_verification', 'Payment proof submitted for manual review.');

  return proof_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. verify_payment — admin only, idempotent approve/reject
-- ---------------------------------------------------------------------------

create or replace function public.verify_payment(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  target_proof public.payment_proofs%rowtype;
  decision text;
  pay_row public.payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  decision := payload->>'decision';
  if decision not in ('approve', 'reject', 'request_resubmit') then
    raise exception 'Invalid decision';
  end if;

  select * into target_order from public.orders where id = (payload->>'order_id')::uuid for update;
  if target_order.id is null then
    raise exception 'Order not found';
  end if;

  select * into target_proof from public.payment_proofs
    where id = (payload->>'proof_id')::uuid and order_id = target_order.id;
  if target_proof.id is null then
    raise exception 'Payment proof not found';
  end if;

  select * into pay_row from public.payments where order_id = target_order.id order by created_at desc limit 1 for update;

  if decision = 'approve' then
    if target_order.payment_status = 'paid' then
      raise exception 'Payment was already approved';
    end if;
    if target_proof.verification_status = 'approved' then
      return;
    end if;

    update public.payment_proofs
      set verification_status = 'approved',
          reviewed_by = auth.uid(),
          reviewed_at = now(),
          admin_notes = coalesce(payload->>'admin_notes', '')
    where id = target_proof.id;

    update public.orders
      set payment_status = 'paid',
          updated_at = now()
    where id = target_order.id;

    update public.payments
      set status = 'paid',
          verified_at = now(),
          verified_by = auth.uid(),
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('verified_proof_id', target_proof.id)
    where id = pay_row.id;

    perform public.commit_inventory_reservation(target_order.id);

    insert into public.payment_verification_events (order_id, payment_id, proof_id, action, actor, note)
    values (target_order.id, pay_row.id, target_proof.id, 'approved', auth.uid(), coalesce(payload->>'admin_notes', 'Payment approved by administrator.'));

    insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
    values (target_order.id, target_order.fulfillment_status, 'paid', 'Payment verified manually.');
    return;
  end if;

  update public.payment_proofs
    set verification_status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = coalesce(payload->>'rejection_reason', 'Payment proof rejected.'),
        admin_notes = coalesce(payload->>'admin_notes', '')
  where id = target_proof.id;

  update public.orders
    set payment_status = case when decision = 'reject' then 'rejected' else 'unpaid' end,
        updated_at = now()
  where id = target_order.id;

  update public.payments set status = case when decision = 'reject' then 'rejected' else 'unpaid' end where id = pay_row.id;

  insert into public.payment_verification_events (order_id, payment_id, proof_id, action, actor, note, payload)
  values (
    target_order.id,
    pay_row.id,
    target_proof.id,
    case when decision = 'reject' then 'rejected' else 'request_resubmit' end,
    auth.uid(),
    coalesce(payload->>'rejection_reason', payload->>'admin_notes', ''),
    payload
  );

  insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
  values (
    target_order.id,
    target_order.fulfillment_status,
    case when decision = 'reject' then 'rejected' else 'unpaid' end,
    case when decision = 'reject' then 'Payment proof rejected.' else 'Customer may submit a new proof.' end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. COD collection + reservation commit/release helpers
-- ---------------------------------------------------------------------------

create or replace function public.commit_inventory_reservation(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row record;
  current_stock integer;
begin
  for row in
    select * from public.inventory_reservations
    where order_id = p_order_id and status = 'active'
    for update
  loop
    update public.product_variants
      set stock = stock - row.quantity
      where id = row.variant_id and stock >= row.quantity
      returning stock into current_stock;
    if current_stock is null then
      raise exception 'Insufficient stock to commit reservation';
    end if;
    update public.products p
      set stock = coalesce((select sum(stock) from public.product_variants v where v.product_id = p.id), 0)
      where id = row.product_id;
    insert into public.inventory_movements (product_id, variant_id, sku, delta, balance_after, reason)
    values (row.product_id, row.variant_id, row.sku, -row.quantity, current_stock, 'Committed for paid/confirmed order');
    update public.inventory_reservations
      set status = 'committed', committed_at = now()
      where id = row.id;
  end loop;
end;
$$;

create or replace function public.release_inventory_reservation(
  p_order_id uuid,
  p_reason text,
  p_status text default 'released'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('released', 'expired_pending_review') then
    raise exception 'Invalid release status';
  end if;
  update public.inventory_reservations
  set status = p_status,
      released_at = now(),
      release_reason = trim(p_reason)
  where order_id = p_order_id and status = 'active';
end;
$$;

create or replace function public.mark_cod_collected(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  collected integer;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  select * into target_order from public.orders where id = (payload->>'order_id')::uuid for update;
  if target_order.id is null then
    raise exception 'Order not found';
  end if;
  if target_order.payment_method <> 'cod' then
    raise exception 'Order is not cash on delivery';
  end if;
  if target_order.payment_status = 'paid' then
    return;
  end if;
  collected := coalesce((payload->>'collected_centavos')::integer, target_order.total_centavos);
  if collected <> target_order.total_centavos then
    raise exception 'Collected amount must match order total';
  end if;
  update public.orders
    set payment_status = 'paid',
        cod_collected_centavos = collected,
        cod_collected_at = now(),
        cod_collected_by = auth.uid(),
        updated_at = now()
  where id = target_order.id;
  update public.payments set status = 'paid', verified_at = now(), verified_by = auth.uid() where order_id = target_order.id;
  perform public.commit_inventory_reservation(target_order.id);
  insert into public.payment_verification_events (order_id, action, actor, note, payload)
  values (target_order.id, 'cod_collected', auth.uid(), 'COD cash collection recorded.', payload);
  insert into public.order_status_history (order_id, fulfillment_status, payment_status, note)
  values (target_order.id, target_order.fulfillment_status, 'paid', 'COD payment recorded after verified collection.');
end;
$$;

-- Confirming a COD order for fulfillment (without marking paid) can commit reservations when you choose:
create or replace function public.confirm_cod_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  select * into target_order from public.orders where id = p_order_id for update;
  if target_order.payment_method <> 'cod' or target_order.payment_status <> 'unpaid' then
    raise exception 'COD order is not eligible for confirmation';
  end if;
  update public.orders
    set fulfillment_status = case
      when fulfillment_status = 'pending' then 'confirmed'
      else fulfillment_status
    end,
    updated_at = now()
  where id = p_order_id;
  perform public.commit_inventory_reservation(p_order_id);
end;
$$;

comment on function public.confirm_cod_order is
  'Commits stock for COD once the store accepts the order. Payment stays unpaid until mark_cod_collected.';

-- ---------------------------------------------------------------------------
-- 11. RLS
-- ---------------------------------------------------------------------------

alter table public.payment_verification_events enable row level security;
alter table public.inventory_reservations enable row level security;

drop policy if exists proofs_admin on public.payment_proofs;
create policy proofs_customer_insert on public.payment_proofs
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = auth.uid() or public.is_admin())
  )
);
create policy proofs_select on public.payment_proofs
for select
using (
  public.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy proofs_admin_write on public.payment_proofs
for update
using (public.is_admin())
with check (public.is_admin());

create policy payment_events_select on public.payment_verification_events
for select
using (
  public.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy payment_events_admin on public.payment_verification_events
for all
using (public.is_admin())
with check (public.is_admin());

create policy reservations_admin on public.inventory_reservations
for select
using (public.is_admin());
create policy reservations_customer_read on public.inventory_reservations
for select
using (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- Customers cannot insert orders directly; place_order runs as security definer.
-- After review, grant execute to authenticated (and anon only if you add guest checkout RPC later):
-- grant execute on function public.place_order(jsonb) to authenticated;
-- grant execute on function public.submit_payment_proof(jsonb) to authenticated;
-- grant execute on function public.verify_payment(jsonb) to authenticated;
-- grant execute on function public.mark_cod_collected(jsonb) to authenticated;
-- grant execute on function public.confirm_cod_order(uuid) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Storage (dashboard — not SQL):
-- 1. Bucket `payment-proofs` (PRIVATE) — customer uploads, admin signed URLs only.
-- 2. Bucket `payment-qr` (PRIVATE recommended) — admin QR images; expose to checkout via signed URL or edge function.
-- Do not make either bucket public.
