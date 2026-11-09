# EARTH BEAUTY & WELLNESS — DESIGN HANDOFF

**Purpose:** Visual and code references for implementing a single-store beauty and wellness e-commerce website. Inspired by familiar marketplace shopping patterns, but branded distinctly for Earth Beauty & Wellness, OPC.

## What's included

- `screens/` — 11 PNG page references (8 desktop, 3 mobile).
- `source/` — matching static HTML + shared `styles.css`. These are **visual prototypes, not working ecommerce code**. Use them as layout measurements and structural guidance. Do not copy inert sample controls into production.
- `DESIGN-SYSTEM.md` — exact colors, typography, components, responsiveness.
- `CURSOR-IMPLEMENTATION.md` — phased build instructions for Cursor, mapped to filenames.

## Screenshot index

1. `01-homepage-desktop.png` — full homepage: promotional bar, header, hero, categories, products, benefits, campaign, footer.
2. `02-shop-desktop.png` — catalog, filters, product grid, sorting, pagination.
3. `03-product-details-desktop.png` — product gallery, pricing, variants, quantity, CTA, details, related products.
4. `04-shopping-cart-desktop.png` — cart items and order summary.
5. `05-checkout-desktop.png` — Philippine shipping forms, payment, order summary.
6. `06-customer-account-desktop.png` — account overview and recent orders.
7. `07-order-tracking-desktop.png` — fulfillment timeline and delivery details.
8. `08-admin-dashboard-desktop.png` — store overview, analytics, recent orders.
9. `09-homepage-mobile.png` — responsive homepage + bottom navigation.
10. `10-shop-mobile.png` — mobile grid/filter/sort.
11. `11-product-details-mobile.png` — mobile product details.

## IMPORTANT — demonstration content only

The current logo is a **provisional typographic mark**, not the client's real logo. Product names, photos (CSS-created bottle/jar illustrations), product prices, review stars, review counts, number of orders, customer profiles, stock, dashboard revenue, sale percentages, and delivery copy are **fictional visual mock data**. Replace all with customer-approved real information from Supabase. Do not display made-up reviews, sales claims, or discount information on a live website. Confirm actual shipping promises and payment methods with the merchant.

## How to use

1. Unzip this folder into the project root as `design-reference/`.
2. Open PNGs to approve the look and layout.
3. Give Cursor `CURSOR-IMPLEMENTATION.md` and tell it to use `screens/01-homepage-desktop.png` + `screens/09-homepage-mobile.png` as the first visual source of truth.
4. It can read `source/01-homepage-desktop.html` and `source/styles.css` for specific CSS proportions.
5. After implementing the homepage, review actual browser screenshots at **1440px and 390px**. Fix visual differences before continuing to the next screen.
6. Implement real app behavior behind the visual design; static HTML here is not the backend or the final application.

## Client

Earth Beauty & Wellness, OPC — Santa Rosa, Laguna, Philippines. Contact 09778401931.
