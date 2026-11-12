-- Guest-friendly order lookup: order number + email (no login required).
create or replace function public.track_order(p_order_number text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  result jsonb;
begin
  if coalesce(trim(p_order_number), '') = '' or coalesce(trim(p_email), '') = '' then
    return null;
  end if;

  select * into o
  from public.orders
  where upper(trim(order_number)) = upper(trim(p_order_number))
    and lower(trim(email)) = lower(trim(p_email))
  limit 1;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'order', to_jsonb(o),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(i) order by i.name)
        from public.order_items i
        where i.order_id = o.id
      ),
      '[]'::jsonb
    ),
    'history', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'at', h.created_at,
            'fulfillment', h.fulfillment_status,
            'payment', h.payment_status,
            'note', h.note
          )
          order by h.created_at asc
        )
        from public.order_status_history h
        where h.order_id = o.id
      ),
      '[]'::jsonb
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;
