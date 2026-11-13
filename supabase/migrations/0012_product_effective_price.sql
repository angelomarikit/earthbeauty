-- Fix catalogue rows where only "regular" (compare_at) was filled and sale price stayed 0.
-- Also ensures place_order charges the same effective price as the storefront.

create or replace function public.effective_variant_price_centavos(
  variant_price integer,
  variant_compare integer,
  product_price integer,
  product_compare integer
) returns integer
language sql
immutable
as $$
  select case
    when coalesce(variant_price, 0) > 0 then variant_price
    when coalesce(product_price, 0) > 0 then product_price
    when coalesce(variant_compare, 0) > 0 then variant_compare
    when coalesce(product_compare, 0) > 0 then product_compare
    else greatest(coalesce(variant_price, 0), coalesce(product_price, 0))
  end;
$$;

update public.products
set
  price_centavos = compare_at_centavos,
  compare_at_centavos = null
where price_centavos = 0
  and compare_at_centavos is not null
  and compare_at_centavos > 0;

update public.product_variants
set
  price_centavos = compare_at_centavos,
  compare_at_centavos = null
where price_centavos = 0
  and compare_at_centavos is not null
  and compare_at_centavos > 0;

update public.product_variants v
set price_centavos = p.price_centavos
from public.products p
where v.product_id = p.id
  and v.price_centavos = 0
  and p.price_centavos > 0;

-- Patch place_order line pricing (full body from 0002_manual_payments.sql with one line changed).
do $patch$
declare
  fn_def text;
begin
  select pg_get_functiondef('public.place_order(jsonb)'::regprocedure) into fn_def;
  if fn_def is null then
    raise notice 'place_order not found — skip runtime patch';
    return;
  end if;
  fn_def := replace(
    fn_def,
    'line_price := variant_row.price_centavos;',
    $r$line_price := public.effective_variant_price_centavos(
      variant_row.price_centavos,
      variant_row.compare_at_centavos,
      product_row.price_centavos,
      product_row.compare_at_centavos
    );$r$
  );
  execute fn_def;
end;
$patch$;
