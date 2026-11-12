-- J&T Express zone rates from Santa Rosa, Laguna (1–3 kg bracket, centavos).
-- Safe to re-run: adds columns and seeds only when no shipping methods exist.

alter table public.shipping_methods
  add column if not exists carrier text not null default '',
  add column if not exists jnt_zone text;

insert into public.shipping_methods (id, name, fee_centavos, detail, active, carrier, jnt_zone)
select * from (values
  ('a1000001-0001-4000-8000-000000000001'::uuid, 'J&T Express — Luzon', 18000,
   'From Santa Rosa, Laguna. J&T list rate ~1–3 kg to Luzon; actual fee by weight.', true, 'jnt', 'luzon'),
  ('a1000001-0001-4000-8000-000000000002'::uuid, 'J&T Express — Metro Manila', 19000,
   'From Santa Rosa, Laguna. J&T list rate ~1–3 kg to NCR.', true, 'jnt', 'manila'),
  ('a1000001-0001-4000-8000-000000000003'::uuid, 'J&T Express — Visayas', 20000,
   'From Santa Rosa, Laguna. J&T list rate ~1–3 kg to Visayas.', true, 'jnt', 'visayas'),
  ('a1000001-0001-4000-8000-000000000004'::uuid, 'J&T Express — Mindanao', 22000,
   'From Santa Rosa, Laguna. J&T list rate ~1–3 kg to Mindanao.', true, 'jnt', 'mindanao'),
  ('a1000001-0001-4000-8000-000000000005'::uuid, 'J&T Express — Island', 23000,
   'From Santa Rosa, Laguna. J&T list rate ~1–3 kg to island areas.', true, 'jnt', 'island'),
  ('a1000001-0001-4000-8000-000000000010'::uuid, 'Store pickup — Santa Rosa', 0,
   'Gran Esperanza Building, Balibago, City of Santa Rosa, Laguna.', true, 'pickup', null)
) as v(id, name, fee_centavos, detail, active, carrier, jnt_zone)
where not exists (select 1 from public.shipping_methods limit 1);
