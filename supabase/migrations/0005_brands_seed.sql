-- Optional: insert Earth Beauty & Wellness supplier brands.
-- Run after 0005_brands.sql. Safe to re-run with ON CONFLICT.

insert into public.brands (name, slug, tint, sort_order, show_on_homepage, active, blurb)
values
  ('BRILLIANT SKIN ESSENTIALS', 'brilliant-skin-essentials', '#fff0f7', 1, true, true, 'View products →'),
  ('YOU GLOW BABE', 'you-glow-babe', '#eff8ea', 2, true, true, 'View products →'),
  ('BMRS', 'bmrs', '#fff9fc', 3, true, true, 'View products →'),
  ('KSERENE', 'kserene', '#fff0f7', 4, true, true, 'View products →'),
  ('HAMISAN BY JOLINA', 'hamisan-by-jolina', '#eff8ea', 5, true, true, 'View products →'),
  ('PERFECT SKIN', 'perfect-skin', '#f7fbf4', 6, true, true, 'View products →'),
  ('HIKARI SKIN ESSENTIALS', 'hikari-skin-essentials', '#fff0f7', 7, true, true, 'View products →'),
  ('PERFECT FORMULA', 'perfect-formula', '#eff8ea', 8, true, true, 'View products →'),
  ('SASKIN', 'saskin', '#fff9fc', 9, true, true, 'View products →'),
  ('HYA GLOW', 'hya-glow', '#fff0f7', 10, true, true, 'View products →'),
  ('ESCENZIA PERFUMES', 'escenzia-perfumes', '#eff8ea', 11, true, true, 'View products →'),
  ('AROMAVERSE PERFUMES', 'aromaverse-perfumes', '#f7fbf4', 12, true, true, 'View products →'),
  ('SKEENCARE', 'skeencare', '#fff0f7', 13, true, true, 'View products →'),
  ('AAMARAH BEAUTY', 'aamarah-beauty', '#eff8ea', 14, true, true, 'View products →'),
  ('QUEEN WHITE', 'queen-white', '#fff9fc', 15, true, true, 'View products →'),
  ('BEAUTY VAULT', 'beauty-vault', '#fff0f7', 16, true, true, 'View products →')
on conflict (slug) do update set
  name = excluded.name,
  tint = excluded.tint,
  sort_order = excluded.sort_order,
  show_on_homepage = excluded.show_on_homepage,
  active = excluded.active,
  blurb = excluded.blurb,
  updated_at = now();
