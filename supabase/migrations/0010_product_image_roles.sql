-- Hero (product page) vs thumbnail (shop cards) flags for product gallery rows.
alter table public.product_images
  add column if not exists is_hero boolean not null default false,
  add column if not exists is_thumbnail boolean not null default false;

create index if not exists product_images_product_id_sort_idx
  on public.product_images (product_id, sort_order);
