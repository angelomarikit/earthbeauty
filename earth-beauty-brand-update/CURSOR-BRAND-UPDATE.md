# CURSOR — CLIENT BRAND UPDATE (priority over old color tokens)

## Objective
Update the EXISTING Earth Beauty & Wellness e-commerce storefront and admin dashboard to match the client's REAL logo and wide cover photo. Keep the existing approved Shopee-inspired layout, spacing, features and component structure. Do not redesign the pages.

## Source assets
- `assets/earth-logo-original.png` — original client logo, must not be redrawn/reinvented.
- `assets/earth-cover-banner-original.png` — client's REAL cover photo, used for primary homepage hero/banner.
- `assets/previous-hero-reference.png` — historical pink product-style hero reference only; do not use as the primary banner.
- `BRAND-TOKENS.css` — suggested updated color tokens.

Copy the logo and cover into the appropriate public assets folder (for example `public/brand/`) and reference them through stable local asset paths. Do not hotlink images, and do not modify the originals.

## Brand palette
Use vivid hot pink (`#F20A87`) as the primary retail CTA and highlight; darker pink (`#C90970`) on hover. Use fresh botanical green (`#4FAD0A`) for category highlights and brand accents, deep green (`#17672E`) for supporting labels/secondary actions, soft blush `#FFF0F7` and near-white `#FFF9FC` for backgrounds, text `#283329`. Keep pages predominantly white/light for readability. Do not use green and pink in every component; balance carefully. These are implementation starting values, not a claim of official HEX brand standards.

## Storefront
1. Header: show original logo prominently without cropping or stretching; preserve its aspect ratio; background white; prominent search with pink action; pink cart badge; subtle green category/utility accents.
2. Homepage hero: use `earth-cover-banner-original.png` as the PRIMARY banner. The cover is 2048×758 (~2.70:1) and contains text, brand marks, a person and partner logos — show the COMPLETE image, no aggressive center-crop. Recommended `width:100%; height:auto; object-fit:contain`. Where the aspect ratio does not fill a container, use complementary light neutral background. Do NOT overlay unrelated large text, buttons or decorative badges on top of the cover's existing text/logos/face. Add a separate, accessible CTA directly below the image (e.g. Shop All Products), if needed.
3. Mobile hero: show the entire original banner via responsive `<img>` with `height:auto`, optionally offer click-to-expand for readability. Don't crop away the person, partner logos, or text. Because the text is baked into the image and small on phones, provide accessible semantic supporting copy BELOW it and optionally a dedicated mobile crop only after approval.
4. Categories, product cards, flash sale, filter chips and footer: preserve existing geometry but update pink/green design tokens. Keep high-contrast readable prices and buttons; highlight sale prices in pink; green for availability / wellness category.
5. The embedded religious quote in the cover photo is part of the client-supplied image: retain it as-is, do not retype/edit it unless requested.

## Admin dashboard
Preserve exact approved sidebar, cards, tables, chart structure and component sizes. Replace prior muted mauve accents with branded pink and green. Use neutral white canvas and deep green or white sidebar as matches reference best; pink for active navigation and primary actions, green for inventory/positive statuses. Maintain meaningful status semantics: don't turn errors into pink/green; errors should remain red/critical, warnings amber. Display real logo in admin header/sidebar (using correct contain scaling).

## Visual QA
- Compare current screenshots against `design-reference/screens/` and original client assets.
- Desktop 1440px and mobile 390px, with no cropped logo, warped photo, text clipping or horizontal overflow.
- Respect existing working navigation, cart, checkout, CRUD and responsive behavior.
- Use placeholders for product data until client products are supplied.
- Report which components/files changed, screenshots you verified, and any unresolved visual mismatches.

## Do this now
Inspect existing files and design-reference first. Migrate the 2 actual brand images into public assets, update theme tokens centrally, replace homepage hero with the supplied cover, update storefront and admin colors, then check pages in-browser against approved references. No backend changes are required for this branding pass.
