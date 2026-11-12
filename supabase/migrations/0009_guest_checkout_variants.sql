-- Guest checkout + products missing product_variants rows (common after first catalog upload).

-- 1. Ensure every product has at least one sellable variant
insert into public.product_variants (id, product_id, label, sku, price_centavos, compare_at_centavos, stock, active)
select gen_random_uuid(), p.id, 'Standard', p.sku, p.price_centavos, p.compare_at_centavos, p.stock, true
from public.products p
where not exists (select 1 from public.product_variants v where v.product_id = p.id);

-- 2. Allow guest (anon) checkout RPCs
grant execute on function public.place_order(jsonb) to anon;
grant execute on function public.submit_payment_proof(jsonb) to anon;

-- 3. Guest payment proof: verify checkout email when customer_id is null
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
  if target_order.customer_id is not null and target_order.customer_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if target_order.customer_id is null then
    if lower(trim(coalesce(payload->>'email', ''))) <> lower(trim(target_order.email)) then
      raise exception 'Not allowed';
    end if;
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
