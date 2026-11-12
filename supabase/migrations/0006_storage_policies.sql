-- Supabase Storage policies for Earth Beauty & Wellness.
-- Create buckets first in Dashboard: product-images (public), payment-proofs (private), payment-qr (private).
-- Then run this file in the SQL Editor.
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
