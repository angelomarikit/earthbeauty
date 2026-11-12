-- Supabase Storage buckets + policies for Earth Beauty & Wellness.
-- Run this entire file in the SQL Editor (creates buckets if missing, then policies).
-- Or create buckets in Dashboard → Storage first, then run from "-- product-images: public read" onward.

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', false),
  ('payment-qr', 'payment-qr', false)
on conflict (id) do update
set public = excluded.public;

-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS; policies are dropped and recreated.

-- product-images: public read
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write"
on storage.objects for all
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

-- payment-proofs: customer upload; admin and authenticated read (signed URLs / own uploads)
drop policy if exists "payment_proofs_insert" on storage.objects;
create policy "payment_proofs_insert"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and auth.role() = 'authenticated'
);

drop policy if exists "payment_proofs_admin_read" on storage.objects;
create policy "payment_proofs_admin_read"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and public.is_admin()
);

drop policy if exists "payment_proofs_owner_read" on storage.objects;
create policy "payment_proofs_owner_read"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and auth.uid() is not null
);

-- payment-qr: admin only
drop policy if exists "payment_qr_admin" on storage.objects;
create policy "payment_qr_admin"
on storage.objects for all
using (bucket_id = 'payment-qr' and public.is_admin())
with check (bucket_id = 'payment-qr' and public.is_admin());
