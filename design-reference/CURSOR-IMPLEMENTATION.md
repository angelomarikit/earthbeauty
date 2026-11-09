# Copy into Cursor — Earth Beauty & Wellness Storefront Build

You are implementing the Earth Beauty & Wellness, OPC, single-vendor e-commerce website. The root folder includes `design-reference/` with the approved layout blueprint.

## Critical instructions

1. Read `design-reference/README-FIRST.md` and `design-reference/DESIGN-SYSTEM.md` before coding.
2. Inspect the current application structure first. Use React, TypeScript, Tailwind CSS v4, Supabase and Vercel; preserve any existing customer assets and established conventions.
3. **Treat corresponding PNG screenshots as the visual source of truth.** Static HTML/CSS under `design-reference/source/` provides additional geometry and CSS guidance; it is not production code and interactions there do not work.
4. Make reusable components: AnnouncementBar, MainHeader, SearchBar, CategoryNav, MobileBottomNav, HeroBanner, CategoryCard, ProductCard, ProductGrid, PriceDisplay, CartLineItem, OrderSummary, ShippingAddressForm, OrderTimeline, AdminSidebar and DataTable.
5. Reproduce desktop and mobile composition, spacing, hierarchy, card shape, colors, typography and responsive behavior without copying Shopee logos or trademarks.
6. DO NOT launch fake values from mockups: no fabricated reviews, purchased counts, sales figures, fake customers, unverified discounts, or unsupported shipping promises. Replace these with real data or hide them until available.
7. Customer-provided images, product details, prices and logo should override all demo content. Demo names must be unmistakably labeled in developer-only mode.
8. For all production pages, controls must be functional, accessible and connected to the actual application state.
9. Test screenshots at 1440x900 and 390x844, including full-page captures. Compare each section with reference and correct differences before continuing.

## Work sequence and exact visual reference files

### Phase 1 — Shared shell + homepage
- `screens/01-homepage-desktop.png`
- `screens/09-homepage-mobile.png`
- `source/01-homepage-desktop.html` and `source/styles.css`
- Implement global design tokens, shared site header/navigation/footer, hero, category navigation, customer favorites, promo section, new arrivals and mobile bottom navigation.
- Start with UI and responsibly labeled development mock data; validate responsive rendering.

### Phase 2 — Catalog and products
- `screens/02-shop-desktop.png`, `screens/10-shop-mobile.png`
- `screens/03-product-details-desktop.png`, `screens/11-product-details-mobile.png`
- Build `/shop`, category listing, search query params, sort, price/category filters, pagination and product detail pages with variants, gallery, stock, quantity and related products.
- Use structured Supabase tables and admin-editable content. Never rely on client-supplied prices for checkout.

### Phase 3 — Cart and checkout
- `screens/04-shopping-cart-desktop.png`
- `screens/05-checkout-desktop.png`
- Build real cart state with quantity changes, remove, persistent cart/guest merge and server-side stock checks.
- Checkout needs customer contact, Philippine delivery address, order totals, shipping charges and payment selection.
- Support merchant-approved methods, e.g. COD where supported and manual GCash proof verification. PayMongo if required only after secure credentials/onboarding. No direct storage of payment card data.
- All totals are calculated in server-side functions from verified product/variant records, shipping, and valid coupon logic.
- Validate atomic inventory allocation and prevent order/payment replay issues.

### Phase 4 — Customer accounts and tracking
- `screens/06-customer-account-desktop.png`
- `screens/07-order-tracking-desktop.png`
- Add Supabase Auth, customer account details, addresses, order history, per-order status timeline and authorized order access.
- Tracking reflects genuine merchant status updates, not fake real-time courier tracking.

### Phase 5 — Admin dashboard
- `screens/08-admin-dashboard-desktop.png`
- Build role-protected `/admin` UI. Extend to functional product/category CRUD, image uploads, inventory, order management, manual payment review, customer directory, banners, and store configuration.
- Revenue analytics come from actual confirmed records; enforce RLS and server-side authorization.

### Phase 6 — QA and deployment
- Test login, guest checkout, product stock, price tampering, payment verification, order status changes and permissions.
- Implement graceful empty/loading/error states; replace illustrative assets and mock data.
- Optimize image loading, metadata, OG images, mobile accessibility and Vercel deployment.

## Ask for only essential missing external credentials/data

- Approved logo and brand colors, real catalog/product photos and pricing, shipping zones/rates, applicable taxes/fees, return policy, merchant payment instructions/API credentials.
- When migrations need to be run by the project owner, prepare complete SQL, provide instructions, and wait for explicit execution confirmation.

## Start now

Inspect the repository and reference files. Present a concise component plan, then build **Phase 1 only** to the visual reference. Run typecheck/build and report what actually works before starting the next phase.
