-- Xendit gateway flags only (no secrets — store_settings is publicly readable).
-- Secret API key lives in Supabase Edge Function secrets: XENDIT_SECRET_KEY

alter table public.store_settings
  add column if not exists xendit_enabled boolean not null default false,
  add column if not exists xendit_mode text not null default 'test'
    check (xendit_mode in ('test', 'live'));

comment on column public.store_settings.xendit_enabled is
  'When true, checkout may offer Xendit after Edge Function + webhook are deployed. Manual GCash/Maya/QR Ph remain available separately.';
