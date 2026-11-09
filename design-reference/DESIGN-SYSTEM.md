# Design System — Earth Beauty & Wellness

## Core brand tokens

| Token | Value | Use |
|---|---|---|
| `--primary` | `#A6476A` | CTAs, active links, sale labels, highlights |
| `--primary-dark` | `#873551` | Hover/pressed CTA state |
| `--blush` | `#F8E8EF` | Soft pink surfaces, secondary buttons |
| `--bg` | `#FAF7F4` | Storefront page background |
| `--ink` | `#242124` | Body and headings |
| `--muted` | `#81767B` | Metadata, descriptions |
| `--border` | `#EEE5E6` | Dividers and card outlines |
| `--gold` | `#C38B4C` | Rating star decoration; show only real reviews |
| `--green` | `#298468` | Successful state |
| `--white` | `#FFFFFF` | Main cards and header |

**Brand colors are proposed, not yet client-approved.** Use customer's logo and true brand colors as soon as supplied.

## Typography

- Display/headings: Georgia or licensed serif alternative; desktop section title 29px, hero 49px, page title 29px.
- UI/body: Arial / Segoe UI or modern sans-serif fallback; body 14px, interface labels 11–13px.
- Section eyebrow: 10px bold uppercase with wide tracking.
- Product price: ~17px bold primary. Regular price smaller, struck through only when valid.

## Layout and components

- Desktop reference viewport: **1440px**, centered max content width **1220px** with 22px padding.
- Mobile reference viewport: **390px**, 15px side padding.
- Primary horizontal spacing: 18–26px; main section gap 40px desktop / 29px mobile.
- Cards: 10–12px radius, subtle warm shadow, 1px border.
- Button: 7px radius, 12px bold label, 14px vertical padding.
- Product grid: 4 columns desktop homepage; 3 shop columns with sidebar; 2 columns on mobile.
- Product gallery: substantial main image, smaller clickable thumbnails.
- Desktop navigation: announcement strip; utility header; search/header; category links.
- Mobile navigation: compact top header and fixed 5-item bottom bar with safe-area inset.
- Buttons, filters, tabs, nav and other visually interactive controls must be real working React components.

## Responsive implementation

- Desktop 1440: follow desktop PNG layout.
- Tablet 768–1024: collapse catalog sidebar into a filter drawer; 2 or 3 product columns according to width; wrap header layout appropriately.
- Mobile 390: follow mobile PNGs. Header and search stack, nav links replaced by compact menu/bottom bar.
- Desktop-only cart rows / checkout / tracking / admin reference views must be adapted for touch-friendly mobile, even if the mobile version was not separately rendered.
- On mobile, never allow the fixed bottom bar to obscure content, button labels or checkout CTA.

## Asset notes

CSS-produced mock product bottles and jars are design placeholders (see `source/styles.css` class `.pack`). For production use uploaded product photos from Supabase Storage, proper `alt` text, aspect-ratio-safe `object-fit`, responsive loading. Hero images must use client-approved assets rather than arbitrary brands. The provisional brandmark is not a supplied official logo.
