-- Supplier brands (Brilliant Skin, You Glow Babe, etc.) — separate from product categories.
-- Run after 0001_init.sql. Manual execution only.

begin;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  tint text not null default '#fff0f7',
  blurb text not null default 'View products →',
  active boolean not null default true,
  sort_order integer not null default 0,
  show_on_homepage boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists brand_id uuid references public.brands(id) on delete restrict;

create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists brands_slug_idx on public.brands (slug);
create index if not exists brands_homepage_idx on public.brands (active, sort_order) where show_on_homepage = true;

drop trigger if exists brands_updated on public.brands;
create trigger brands_updated before update on public.brands for each row execute function public.set_updated_at();

alter table public.brands enable row level security;

create policy brands_public_read on public.brands for select using (active = true or public.is_admin());
create policy brands_admin on public.brands for all using (public.is_admin()) with check (public.is_admin());

commit;
