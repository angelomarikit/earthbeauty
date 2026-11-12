-- Checkout RPC execute permissions (required for signed-in customers).
-- Run in Supabase SQL Editor if Place Order fails with permission denied.

grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.submit_payment_proof(jsonb) to authenticated;
grant execute on function public.confirm_cod_order(uuid) to authenticated;
