-- Storefront footer: optional preview catalogue disclaimer (admin toggle)
-- Run after 0001_init.sql. Safe if run before or after 0002_manual_payments.sql.

alter table public.store_settings
  add column if not exists show_preview_catalogue_notice boolean not null default true;

comment on column public.store_settings.show_preview_catalogue_notice is
  'When true, the storefront footer shows the preview catalogue placeholder disclaimer.';
