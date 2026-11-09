# Design audit — Earth Beauty & Wellness

Visual source of truth: `design-reference/screens/`. Geometry source: `design-reference/source/styles.css` and the matching HTML prototypes. Where a screenshot and a prototype differ, the screenshot wins for appearance.

## Screens

| File | Surface |
|---|---|
| 01-homepage-desktop.png | Promo, utility bar, header, category nav, hero, 6 categories, perks, favorites, campaign, new arrivals, footer |
| 02-shop-desktop.png | Breadcrumb, 245px filter column, 3-column grid, sort, pagination |
| 03-product-details-desktop.png | Gallery, title, price, variants, quantity, CTAs, tabs, related products |
| 04-shopping-cart-desktop.png | Line items and order summary |
| 05-checkout-desktop.png | Stepped checkout, PH address, payment, summary |
| 06-customer-account-desktop.png | 255px account menu, stats, recent orders |
| 07-order-tracking-desktop.png | Timeline and delivery details |
| 08-admin-dashboard-desktop.png | 242px sidebar, 4 KPIs, bar chart, donut, recent orders |
| 09-homepage-mobile.png | Stacked header, hero, 3-column categories, 2-column products, bottom nav |
| 10-shop-mobile.png | Filter/sort row, 2-column grid |
| 11-product-details-mobile.png | Stacked gallery, size, quantity, CTAs |

There is no separate admin screen beyond the dashboard. Later admin pages reuse the same sidebar, table, panel, and button styles.

## Shared pieces

Announcement bar, brand mark, search, account/wishlist/cart, category nav, mobile bottom bar, product card, price, category tile, perk row, footer, white panel, pill, field, status chip, data table, admin sidebar, KPI card.

## Header and navigation

- Promo: `#A6476A`, white, 12px, centered, about 10px padding.
- Utility row: 12px, `#796A70`, 13px vertical padding. Left: sparkle line and Santa Rosa. Right: Track, Help, Contact.
- Main row: 80px min height, 26px gap. Brand block min 245px. Search 46px, radius 7px, border `#E8D5DB`, SEARCH button 40×92.
- Actions: 11px labels under 22px outline icons. Cart badge `#A6476A`.
- Category bar: 44px, 12px bold, 34px gap. Active link `#A6476A`. Right label “Discover Your Glow”.
- Sticky group is the white header plus category bar. Height does not change on scroll.
- Mobile under 650px: utility row and category bar hide. Logo and icons share a row. Search drops full width. Fixed 65px, 5-item bottom bar.

## Typography

- Headings: Georgia. Hero 49px / 1.1, section and page titles 29px weight 500, product title on the detail page 40px.
- UI: Arial, with Segoe UI as the Windows fallback. Body 14px. Eyebrow 10px, bold, uppercase, tracking 2.4px.
- Product name 13px / 1.5. Price 17px extra-bold `#A6476A`. Struck regular price 11px `#AFA0A5`.
- These are the faces named in the design system. No webfont substitution was required.

## Color

| Token | Value | Use |
|---|---|---|
| Primary | `#A6476A` | Promo, buttons, price, active nav, badges |
| Primary dark | `#873551` | Button hover |
| Blush | `#F8E8EF` | Secondary buttons, active admin item |
| Background | `#FAF7F4` | Storefront page |
| Ink | `#242124` | Text |
| Muted | `#81767B` | Meta copy |
| Border | `#EEE5E6` | Cards, dividers, tables |
| Gold | `#C38B4C` | Sample star row on demo products |
| Green | `#298468` | Positive status |
| White | `#FFFFFF` | Header, cards |
| Footer | `#30292E` | Footer ground |
| Admin canvas | `#F7F5F6` | Dashboard background |
| Hero wash | `#F5E4E9` → `#F1D3D9` | Banner |
| Campaign | `#6C4857` → `#B7788E` | Mid-page banner |

## Product cards

White, 1px `#EEE5E6`, 10px radius, shadow `0 10px 30px rgba(73,38,55,.065)`. Image area 210px (168px on mobile) with alternating warm gradients. Badge top-left, heart top-right. Body padding 14px 15px 16px. Four columns on the homepage, three beside the shop filter, two on mobile. Gap 18px desktop, 10px mobile.

## Buttons, radius, shadow

- Primary button: 7px radius, 12px bold, 14px × 22px padding.
- Secondary: blush ground, primary text. Outline: 1px primary border.
- Cards and panels: 10px. Category tiles: 12px. Hero: 13px. Pills: 6px. Status chips: 20px.
- Shadow is the single warm card shadow above. Borders are 1px `#EEE5E6` unless a selected control uses the primary color.

## Layout numbers

- Content max width 1220px, side padding 22px desktop and 15px mobile.
- Section gap 40px desktop, 29px mobile.
- Hero 365px desktop, 440px mobile, columns 1.06 / 0.94.
- Shop filter column 245px, gap 26px.
- Account menu 255px. Admin sidebar 242px. Admin top bar 74px. Admin content padding 33px 38px.
- Cart columns 1.9fr / 1fr. Checkout 1.65fr / 1fr. Product detail two equal columns, 55px gap.
- Breakpoints used: 1100px collapses side columns, 900px drawers the admin sidebar, 650px matches the mobile prototypes. Checked targets: 1440, 1280, 768, 390, 360.

## Admin

Sidebar white, labels 9px tracked, items 12px with 16px icons, active item blush with primary text. KPI row is four cards. Sales chart is a 7-day bar. Order status is a donut. Recent orders use a blush header row and pill statuses: Processing (amber), Delivered (green), To Ship (blue).

## Forms and tables

Fields are 45px, radius 6px, border `#E9DEE2`, 12px type. Labels 11px bold. Tables: header `#FCF8F9`, 10px uppercase, cell padding 16–17px, 12px body type.

## Checklist

- [x] Tokens centralized in `src/styles/globals.css` and `src/styles/reference.css`
- [x] Storefront and admin use separate layouts
- [x] Homepage, shop, product, cart, checkout, account, tracking, and dashboard follow the screens above
- [x] Demo catalogue is labeled and is not presented as live inventory
- [x] Browser check at 1440 and 390. Homepage hero, category row, and admin KPI/chart/table structure match the screens. Hero footnote padding was tightened so it stays inside the 365px banner. Mobile footer columns no longer force horizontal scroll.
