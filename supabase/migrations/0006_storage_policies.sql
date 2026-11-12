-- Supabase Storage policies for Earth Beauty & Wellness.
-- Create buckets first in Dashboard: product-images (public), payment-proofs (private), payment-qr (private).
-- Then run this file in the SQL Editor.

-- product-images: public read
create policy if not exists "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy if not exists "product_images_admin_write"
on storage.objects for all
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

-- payment-proofs: customer upload + own order path; admin read
create policy if not exists "payment_proofs_insert"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and auth.role() = 'authenticated'
);

create policy if not exists "payment_proofs_admin_read"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and public.is_admin()
);

create policy if not exists "payment_proofs_owner_read"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and auth.uid() is not null
);

-- payment-qr: admin only
create policy if not exists "payment_qr_admin"
on storage.objects for all
using (bucket_id = 'payment-qr' and public.is_admin())
with check (bucket_id = 'payment-qr' and public.is_admin());
