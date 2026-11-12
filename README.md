# Earth Beauty & Wellness

Single-vendor storefront and admin for Earth Beauty & Wellness, OPC. The layout follows `design-reference/screens` and `design-reference/source`.

The catalogue, prices, reviews, and dashboard totals in the browser are **demonstration data**. They are not live inventory or revenue. Real products are meant to be entered from the admin once Supabase is connected.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/

If Windows rejects `npm run` because the folder name contains `&`, run the tools directly:

```bash
node .\node_modules\vite\bin\vite.js
node .\node_modules\typescript\bin\tsc -b --pretty false
node .\node_modules\vite\bin\vite.js build
```

### Demonstration sign-in

- Customer: `alexandra@example.com` / `demo1234`
- Admin: `admin@earthbeauty.demo` / `demo-admin`

Admin lives at `/admin`. Demo edits stay in this browser. Store settings include **Reset demonstration data**.

## Supabase

Do not put a service-role key in the frontend. Copy `.env.example` to `.env` only when you are ready:

```
VITE_DATA_MODE=production
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Leave `VITE_DATA_MODE=demo` until the migration has been applied. The app will not mix demonstration orders into a live project while demo mode is on.

### Apply the schema yourself

Run these in order in the Supabase SQL Editor. Do not skip ahead.

1. `supabase/migrations/0001_init.sql` — core catalogue, orders, RLS, initial `place_order`.
2. `supabase/migrations/0002_manual_payments.sql` — COD + manual GCash/Maya/QR Ph, proof verification, inventory reservations, updated `place_order`.
3. `supabase/migrations/0003_preview_catalogue_notice.sql` — admin toggle for the footer preview disclaimer (optional anytime after 0001).
4. `supabase/migrations/0005_brands.sql` — supplier `brands` table, `products.brand_id`, RLS (run before production brand assignments).
5. *(Optional)* `supabase/migrations/0005_brands_seed.sql` — inserts the 16 client supplier brands (safe to re-run).

6. In Storage, create:
   - `product-images` (public)
   - `payment-proofs` (private — customer proof uploads)
   - `payment-qr` (private recommended — admin QR images for GCash/Maya/QR Ph)

7. Create an Auth user for the merchant, then insert an admin role:

```sql
insert into public.user_roles (user_id, role)
values ('PASTE-USER-UUID', 'admin');
```

8. Copy `.env.example` to `.env`, set `VITE_DATA_MODE=production`, and add your project URL and **anon/publishable** key only. Never put the service-role key in the frontend.

9. After the SQL files you need have succeeded, confirm here (or paste any SQL error). Live checkout stays off until that confirmation. `place_order` recalculates prices server-side, **reserves** stock, and never marks a payment as paid. Manual methods become `paid` only through `verify_payment` or `mark_cod_collected`.

**Preview catalogue notice:** In **Admin → Store Settings**, uncheck *Show preview catalogue notice in storefront footer* when real inventory is live. In demo mode the setting is saved in this browser; in production it is stored in `store_settings.show_preview_catalogue_notice` (migration 0003).

### Xendit (when you enable it)

Manual GCash / Maya / QR Ph checkout stays as-is until you turn on the gateway. Xendit secrets **never** go in the React app or in `store_settings` (that table is public read).

1. In [Xendit Dashboard → Settings → Developers → API keys](https://dashboard.xendit.co/settings/developers#api-keys), copy the **full** secret key (`xnd_development_...` or `xnd_production_...`). Short alphanumeric codes from onboarding emails are not the API key.
2. Supabase → **Edge Functions → Secrets**: set `XENDIT_SECRET_KEY` and `XENDIT_WEBHOOK_TOKEN`.
3. Deploy `supabase/functions/xendit-create-invoice` and run `supabase/migrations/0004_xendit_gateway_flags.sql`.
4. Enable in DB: `xendit_enabled = true` on `store_settings` when webhooks are ready. Payment becomes `paid` only from verified webhooks, not from the client.

Fonts are Georgia and Arial, as named in the design system. No webfont substitution.
