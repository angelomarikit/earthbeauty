import type {
  Banner,
  Brand,
  Category,
  Coupon,
  DemoState,
  DemoUser,
  Order,
  PackStyle,
  Product,
  StoreSettings,
  Variant,
} from '@/types'
import { defaultShippingMethods } from '@/data/shipping/defaultMethods'
import { pesosToCentavos } from '@/lib/format'

const SEED_VERSION = 1

const categories: Category[] = [
  { id: 'cat-skin', name: 'Skincare', slug: 'skincare', symbol: '✦', tint: '#faeaf0', imageUrl: null, active: true, sortOrder: 1, showOnHomepage: true, showInNav: true, blurb: 'Shop collection →' },
  { id: 'cat-body', name: 'Body Care', slug: 'body-care', symbol: '❀', tint: '#f5ece1', imageUrl: null, active: true, sortOrder: 2, showOnHomepage: true, showInNav: true, blurb: 'Shop collection →' },
  { id: 'cat-well', name: 'Wellness', slug: 'wellness', symbol: '☘', tint: '#ebf1e9', imageUrl: null, active: true, sortOrder: 3, showOnHomepage: true, showInNav: true, blurb: 'Shop collection →' },
  { id: 'cat-face', name: 'Face Care', slug: 'face-care', symbol: '◇', tint: '#f2e7ed', imageUrl: null, active: true, sortOrder: 4, showOnHomepage: true, showInNav: false, blurb: 'Shop collection →' },
  { id: 'cat-sets', name: 'Beauty Sets', slug: 'beauty-sets', symbol: '♡', tint: '#faeede', imageUrl: null, active: true, sortOrder: 5, showOnHomepage: true, showInNav: false, blurb: 'Shop collection →' },
  { id: 'cat-new', name: 'New Arrivals', slug: 'new-arrivals', symbol: '✧', tint: '#e9edef', imageUrl: null, active: true, sortOrder: 6, showOnHomepage: true, showInNav: false, blurb: 'Shop collection →' },
  { id: 'cat-hair', name: 'Hair Care', slug: 'hair-care', symbol: '✶', tint: '#e7eef2', imageUrl: null, active: true, sortOrder: 7, showOnHomepage: false, showInNav: false, blurb: 'Shop collection →' },
  { id: 'cat-acc', name: 'Accessories', slug: 'accessories', symbol: '◈', tint: '#f3eee8', imageUrl: null, active: true, sortOrder: 8, showOnHomepage: false, showInNav: false, blurb: 'Shop collection →' },
]

const brands: Brand[] = [
  { id: 'brand-brilliant', name: 'BRILLIANT SKIN ESSENTIALS', slug: 'brilliant-skin-essentials', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 1, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-you-glow', name: 'YOU GLOW BABE', slug: 'you-glow-babe', logoUrl: null, tint: '#eff8ea', active: true, sortOrder: 2, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-bmrs', name: 'BMRS', slug: 'bmrs', logoUrl: null, tint: '#fff9fc', active: true, sortOrder: 3, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-kserene', name: 'KSERENE', slug: 'kserene', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 4, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-hamisan', name: 'HAMISAN BY JOLINA', slug: 'hamisan-by-jolina', logoUrl: null, tint: '#eff8ea', active: true, sortOrder: 5, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-perfect-skin', name: 'PERFECT SKIN', slug: 'perfect-skin', logoUrl: null, tint: '#f7fbf4', active: true, sortOrder: 6, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-hikari', name: 'HIKARI SKIN ESSENTIALS', slug: 'hikari-skin-essentials', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 7, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-perfect-formula', name: 'PERFECT FORMULA', slug: 'perfect-formula', logoUrl: null, tint: '#eff8ea', active: true, sortOrder: 8, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-saskin', name: 'SASKIN', slug: 'saskin', logoUrl: null, tint: '#fff9fc', active: true, sortOrder: 9, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-hya-glow', name: 'HYA GLOW', slug: 'hya-glow', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 10, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-escenzia', name: 'ESCENZIA PERFUMES', slug: 'escenzia-perfumes', logoUrl: null, tint: '#eff8ea', active: true, sortOrder: 11, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-aromaverse', name: 'AROMAVERSE PERFUMES', slug: 'aromaverse-perfumes', logoUrl: null, tint: '#f7fbf4', active: true, sortOrder: 12, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-skeencare', name: 'SKEENCARE', slug: 'skeencare', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 13, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-aamarah', name: 'AAMARAH BEAUTY', slug: 'aamarah-beauty', logoUrl: null, tint: '#eff8ea', active: true, sortOrder: 14, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-queen-white', name: 'QUEEN WHITE', slug: 'queen-white', logoUrl: null, tint: '#fff9fc', active: true, sortOrder: 15, showOnHomepage: true, blurb: 'View products →' },
  { id: 'brand-beauty-vault', name: 'BEAUTY VAULT', slug: 'beauty-vault', logoUrl: null, tint: '#fff0f7', active: true, sortOrder: 16, showOnHomepage: true, blurb: 'View products →' },
]

type Draft = {
  id: string
  name: string
  slug: string
  categoryId: string
  brandId?: string
  price: number
  compare?: number
  stock: number
  pack: PackStyle
  badge?: string
  featured?: boolean
  isNew?: boolean
  bestSeller?: boolean
  sold?: number
  description: string
  variants?: { label: string; price?: number; stock: number }[]
}

function variantsFor(draft: Draft, sku: string): Variant[] {
  if (!draft.variants?.length) {
    return [
      {
        id: `${draft.id}-std`,
        label: 'Standard',
        sku,
        priceCentavos: pesosToCentavos(draft.price),
        compareAtCentavos: draft.compare ? pesosToCentavos(draft.compare) : null,
        stock: draft.stock,
        active: true,
      },
    ]
  }
  return draft.variants.map((variant, index) => ({
    id: `${draft.id}-v${index + 1}`,
    label: variant.label,
    sku: `${sku}-${variant.label.replace(/\s+/g, '').toUpperCase()}`,
    priceCentavos: pesosToCentavos(variant.price ?? draft.price),
    compareAtCentavos: draft.compare ? pesosToCentavos(draft.compare) : null,
    stock: variant.stock,
    active: true,
  }))
}

const drafts: Draft[] = [
  { id: 'p-serum', name: 'Radiance Glow Facial Serum', slug: 'radiance-glow-facial-serum', categoryId: 'cat-skin', brandId: 'brand-brilliant', price: 499, compare: 699, stock: 24, pack: 'bottle', badge: 'NEW', featured: true, sold: 120, description: 'A lightweight facial serum for a simple daily routine. Demonstration product — not live inventory.', variants: [{ label: '30 ml', stock: 16 }, { label: '50 ml', price: 699, stock: 8 }] },
  { id: 'p-butter', name: 'Nourishing Body Butter', slug: 'nourishing-body-butter', categoryId: 'cat-body', brandId: 'brand-you-glow', price: 349, compare: 449, stock: 40, pack: 'jar', badge: '-22%', featured: true, sold: 118, description: 'A rich body butter for after-bath moisture. Demonstration product — not live inventory.', variants: [{ label: 'Standard Size', stock: 28 }, { label: 'Travel Size', price: 199, stock: 12 }] },
  { id: 'p-cleanser', name: 'Daily Botanical Cleanser', slug: 'daily-botanical-cleanser', categoryId: 'cat-skin', brandId: 'brand-kserene', price: 299, compare: 399, stock: 36, pack: 'tall', badge: 'BEST', featured: true, bestSeller: true, sold: 132, description: 'A gentle daily cleanser with a soft lather. Demonstration product — not live inventory.' },
  { id: 'p-rose', name: 'Hydrating Rose Cream', slug: 'hydrating-rose-cream', categoryId: 'cat-face', brandId: 'brand-hamisan', price: 459, compare: 599, stock: 22, pack: 'tube', badge: 'SALE', featured: true, sold: 110, description: 'A cushiony face cream for the last step of a routine. Demonstration product — not live inventory.' },
  { id: 'p-sun', name: 'Glow Defense Sunscreen SPF50', slug: 'glow-defense-sunscreen-spf50', categoryId: 'cat-skin', price: 389, compare: 489, stock: 30, pack: 'tube', badge: 'NEW', isNew: true, sold: 96, description: 'A daily sunscreen for daytime wear. SPF figure is placeholder copy until the real label is supplied. Demonstration product — not live inventory.', variants: [{ label: '40 ml', stock: 18 }, { label: '60 ml', price: 489, stock: 12 }] },
  { id: 'p-toner', name: 'Calming Botanical Toner', slug: 'calming-botanical-toner', categoryId: 'cat-skin', price: 329, compare: 429, stock: 27, pack: 'tall', badge: '-20%', isNew: true, sold: 88, description: 'A watery toner used after cleansing. Demonstration product — not live inventory.' },
  { id: 'p-night', name: 'Rose Renewal Night Cream', slug: 'rose-renewal-night-cream', categoryId: 'cat-face', price: 529, compare: 679, stock: 18, pack: 'jar', badge: 'BEST', isNew: true, bestSeller: true, sold: 104, description: 'An evening face cream with a soft rose scent story. Demonstration product — not live inventory.' },
  { id: 'p-vitc', name: 'Vitamin C Brightening Serum', slug: 'vitamin-c-brightening-serum', categoryId: 'cat-skin', price: 549, compare: 749, stock: 16, pack: 'bottle', badge: 'SALE', isNew: true, sold: 101, description: 'A morning serum used before moisturizer. Demonstration product — not live inventory.' },
  { id: 'p-oil', name: 'Evening Body Oil', slug: 'evening-body-oil', categoryId: 'cat-body', price: 399, compare: 499, stock: 21, pack: 'bottle', badge: 'SALE', sold: 77, description: 'A lightweight body oil for evening care. Demonstration product — not live inventory.' },
  { id: 'p-wash', name: 'Soft Cloud Body Wash', slug: 'soft-cloud-body-wash', categoryId: 'cat-body', price: 259, compare: 329, stock: 44, pack: 'tall', badge: 'NEW', sold: 64, description: 'A mild body wash for everyday showers. Demonstration product — not live inventory.' },
  { id: 'p-soak', name: 'Herbal Bath Soak', slug: 'herbal-bath-soak', categoryId: 'cat-body', price: 369, compare: 459, stock: 6, pack: 'jar', sold: 41, description: 'A jar of bath salts for a quiet soak. Demonstration product — not live inventory.' },
  { id: 'p-tea', name: 'Calm Mind Wellness Tea', slug: 'calm-mind-wellness-tea', categoryId: 'cat-well', price: 319, compare: 399, stock: 33, pack: 'jar', badge: 'NEW', sold: 58, description: 'A caffeine-free herbal tea blend for winding down. Demonstration product — not live inventory.' },
  { id: 'p-drops', name: 'Daily Balance Drops', slug: 'daily-balance-drops', categoryId: 'cat-well', price: 589, compare: 699, stock: 14, pack: 'tall', badge: 'BEST', bestSeller: true, sold: 73, description: 'A small bottle for a daily wellness ritual. Not a supplement claim. Demonstration product — not live inventory.' },
  { id: 'p-mist', name: 'Restful Pillow Mist', slug: 'restful-pillow-mist', categoryId: 'cat-well', price: 349, compare: 429, stock: 5, pack: 'bottle', sold: 39, description: 'A light linen mist for the bedside. Demonstration product — not live inventory.' },
  { id: 'p-set', name: 'Glow Ritual Set', slug: 'glow-ritual-set', categoryId: 'cat-sets', price: 1299, compare: 1699, stock: 11, pack: 'jar', badge: 'SALE', sold: 54, description: 'A three-piece demonstration set. Contents will be replaced with the real bundle.', variants: [{ label: 'Full Set', stock: 7 }, { label: 'Mini Set', price: 799, stock: 4 }] },
  { id: 'p-travel', name: 'Travel Care Set', slug: 'travel-care-set', categoryId: 'cat-sets', price: 899, compare: 1099, stock: 2, pack: 'tube', badge: 'NEW', isNew: true, sold: 33, description: 'Compact sizes for a weekend bag. Demonstration product — not live inventory.' },
  { id: 'p-hair', name: 'Silk Veil Hair Oil', slug: 'silk-veil-hair-oil', categoryId: 'cat-hair', price: 429, compare: 529, stock: 19, pack: 'tall', badge: 'NEW', sold: 47, description: 'A few drops for the ends of dry hair. Demonstration product — not live inventory.', variants: [{ label: '30 ml', stock: 11 }, { label: '50 ml', price: 529, stock: 8 }] },
  { id: 'p-scalp', name: 'Gentle Scalp Rinse', slug: 'gentle-scalp-rinse', categoryId: 'cat-hair', price: 279, compare: 349, stock: 4, pack: 'bottle', sold: 29, description: 'A mild rinse used in the shower. Demonstration product — not live inventory.' },
  { id: 'p-haircream', name: 'Shine Soft Hair Cream', slug: 'shine-soft-hair-cream', categoryId: 'cat-hair', price: 339, compare: 429, stock: 8, pack: 'tube', sold: 36, description: 'A styling cream for soft finish. Demonstration product — not live inventory.' },
  { id: 'p-gua', name: 'Rose Quartz Gua Sha', slug: 'rose-quartz-gua-sha', categoryId: 'cat-acc', price: 459, compare: 559, stock: 15, pack: 'jar', badge: 'BEST', sold: 61, description: 'A facial massage tool. Demonstration product — not live inventory.' },
  { id: 'p-brush', name: 'Soft Bristle Face Brush', slug: 'soft-bristle-face-brush', categoryId: 'cat-acc', price: 249, compare: 299, stock: 3, pack: 'tube', sold: 22, description: 'A gentle cleansing brush. Demonstration product — not live inventory.' },
  { id: 'p-facemist', name: 'Moisture Lock Face Mist', slug: 'moisture-lock-face-mist', categoryId: 'cat-face', price: 279, compare: 359, stock: 7, pack: 'tall', badge: 'NEW', isNew: true, sold: 44, description: 'A face mist for a quick refresh. Demonstration product — not live inventory.' },
  { id: 'p-balm', name: 'Barrier Repair Balm', slug: 'barrier-repair-balm', categoryId: 'cat-face', price: 489, compare: 599, stock: 13, pack: 'jar', sold: 51, description: 'A thick balm for dry spots. Demonstration product — not live inventory.' },
  { id: 'p-faceoil', name: 'Morning Ritual Face Oil', slug: 'morning-ritual-face-oil', categoryId: 'cat-skin', price: 619, compare: 799, stock: 12, pack: 'bottle', badge: 'BEST', bestSeller: true, sold: 69, description: 'A few drops pressed over moisturizer. Demonstration product — not live inventory.' },
]

const galleryCycle: PackStyle[] = ['bottle', 'jar', 'tube', 'tall']

const products: Product[] = drafts.map((draft, index) => {
  const sku = `EBW-${String(index + 1).padStart(3, '0')}`
  const created = new Date(Date.UTC(2026, 8, 1 + index))
  return {
    id: draft.id,
    name: draft.name,
    slug: draft.slug,
    description: draft.description,
    howToUse: 'Use as directed on the final product label. This demonstration copy is not an instruction for a real formula.',
    shippingNote: 'Shipping fee and delivery timing are confirmed at checkout. This preview does not promise a delivery window.',
    categoryId: draft.categoryId,
    brandId: draft.brandId ?? null,
    sku,
    priceCentavos: pesosToCentavos(draft.price),
    compareAtCentavos: draft.compare ? pesosToCentavos(draft.compare) : null,
    stock: draft.stock,
    badge: draft.badge ?? null,
    pack: draft.pack,
    gallery: [draft.pack, ...galleryCycle.filter((item) => item !== draft.pack)].slice(0, 4),
    imageUrl: null,
    images: [],
    featured: Boolean(draft.featured),
    isNew: Boolean(draft.isNew),
    bestSeller: Boolean(draft.bestSeller),
    active: true,
    variants: variantsFor(draft, sku),
    demoReviewCount: 42,
    demoSoldLabel: '(42) · Sold 120+',
    demoUnitsSold: draft.sold ?? 20,
    createdAt: created.toISOString(),
    demo: true,
  }
})

const address = {
  id: 'addr-alex',
  label: 'Home',
  fullName: 'Alexandra Reyes',
  phone: '09XX XXX XXXX',
  street: 'Sample street, Santa Rosa',
  region: 'Region IV-A (CALABARZON)',
  province: 'Laguna',
  city: 'City of Santa Rosa',
  barangay: 'Balibago',
  postalCode: '4026',
  isDefault: true,
}

const users: DemoUser[] = [
  {
    id: 'user-admin',
    name: 'Store Administrator',
    email: 'admin@earthbeauty.demo',
    phone: '09778401931',
    password: 'demo-admin',
    role: 'admin',
    memberSince: '2026',
    addresses: [],
    demo: true,
  },
  {
    id: 'user-alex',
    name: 'Alexandra Reyes',
    email: 'alexandra@example.com',
    phone: '09XX XXX XXXX',
    password: 'demo1234',
    role: 'customer',
    memberSince: '2026',
    addresses: [address],
    demo: true,
  },
  {
    id: 'user-rina',
    name: 'Rina Santos',
    email: 'rina.santos@example.com',
    phone: '09XX XXX 1002',
    password: 'demo1234',
    role: 'customer',
    memberSince: '2026',
    addresses: [],
    demo: true,
  },
  {
    id: 'user-mae',
    name: 'Mae Villanueva',
    email: 'mae.villanueva@example.com',
    phone: '09XX XXX 1003',
    password: 'demo1234',
    role: 'customer',
    memberSince: '2026',
    addresses: [],
    demo: true,
  },
  {
    id: 'user-camille',
    name: 'Camille Cruz',
    email: 'camille.cruz@example.com',
    phone: '09XX XXX 1004',
    password: 'demo1234',
    role: 'customer',
    memberSince: '2026',
    addresses: [],
    demo: true,
  },
]

function item(
  productId: string,
  quantity: number,
  unitPesos: number,
  variantLabel = 'Standard',
): Order['items'][number] {
  const product = products.find((entry) => entry.id === productId)!
  return {
    productId,
    variantId: product.variants[0]?.id ?? null,
    name: product.name,
    variantLabel,
    sku: product.sku,
    pack: product.pack,
    imageUrl: product.imageUrl,
    unitPriceCentavos: pesosToCentavos(unitPesos),
    quantity,
  }
}

const orders: Order[] = [
  {
    id: 'ord-1024',
    orderNumber: 'EBW-2026-1024',
    createdAt: '2026-11-05T02:10:00.000Z',
    customerId: 'user-alex',
    customerName: 'Alexandra Reyes',
    email: 'alexandra@example.com',
    phone: '09XX XXX XXXX',
    address,
    items: [
      item('p-serum', 1, 499, '30 ml'),
      item('p-butter', 2, 349, 'Standard Size'),
      item('p-rose', 1, 459),
    ],
    subtotalCentavos: pesosToCentavos(1656),
    discountCentavos: 0,
    shippingCentavos: 0,
    totalCentavos: pesosToCentavos(1656),
    couponCode: null,
    shippingMethodId: 'ship-standard',
    shippingMethodName: 'Standard Delivery',
    paymentMethod: 'gcash',
    paymentStatus: 'pending_verification',
    fulfillmentStatus: 'processing',
    notes: 'Demonstration order. Payment has not been collected.',
    trackingNumber: '',
    proofName: null,
    latestProofId: null,
    history: [
      { at: '2026-11-05T02:10:00.000Z', fulfillment: 'pending', payment: 'pending_verification', note: 'Demonstration order placed.' },
      { at: '2026-11-05T04:00:00.000Z', fulfillment: 'confirmed', payment: 'pending_verification', note: 'Order confirmed for the sample timeline.' },
      { at: '2026-11-05T08:00:00.000Z', fulfillment: 'processing', payment: 'pending_verification', note: 'Your payment is being verified and the order is being prepared.' },
    ],
    demo: true,
  },
  {
    id: 'ord-1023',
    orderNumber: 'EBW-2026-1023',
    createdAt: '2026-11-05T01:00:00.000Z',
    customerId: 'user-rina',
    customerName: 'Rina Santos',
    email: 'rina.santos@example.com',
    phone: '09XX XXX 1002',
    address: { ...address, id: 'addr-rina', fullName: 'Rina Santos', phone: '09XX XXX 1002' },
    items: [item('p-travel', 1, 899)],
    subtotalCentavos: pesosToCentavos(899),
    discountCentavos: 0,
    shippingCentavos: 0,
    totalCentavos: pesosToCentavos(899),
    couponCode: null,
    shippingMethodId: 'ship-standard',
    shippingMethodName: 'Standard Delivery',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    notes: 'Demonstration record.',
    trackingNumber: 'DEMO-TRK-1023',
    proofName: null,
    latestProofId: null,
    history: [
      { at: '2026-11-05T01:00:00.000Z', fulfillment: 'pending', payment: 'unpaid', note: 'Demonstration order placed.' },
      { at: '2026-11-06T01:00:00.000Z', fulfillment: 'delivered', payment: 'paid', note: 'Marked delivered in the sample timeline.' },
    ],
    demo: true,
  },
  {
    id: 'ord-1022',
    orderNumber: 'EBW-2026-1022',
    createdAt: '2026-11-04T06:00:00.000Z',
    customerId: 'user-mae',
    customerName: 'Mae Villanueva',
    email: 'mae.villanueva@example.com',
    phone: '09XX XXX 1003',
    address: { ...address, id: 'addr-mae', fullName: 'Mae Villanueva', phone: '09XX XXX 1003' },
    items: [item('p-set', 1, 1299, 'Full Set'), item('p-faceoil', 1, 850)],
    subtotalCentavos: pesosToCentavos(2149),
    discountCentavos: 0,
    shippingCentavos: 0,
    totalCentavos: pesosToCentavos(2149),
    couponCode: null,
    shippingMethodId: 'ship-standard',
    shippingMethodName: 'Standard Delivery',
    paymentMethod: 'gcash',
    paymentStatus: 'pending_verification',
    fulfillmentStatus: 'shipped',
    notes: 'Demonstration record. The second line keeps a historical sample price.',
    trackingNumber: 'DEMO-TRK-1022',
    proofName: null,
    latestProofId: null,
    history: [
      { at: '2026-11-04T06:00:00.000Z', fulfillment: 'pending', payment: 'pending_verification', note: 'Demonstration order placed.' },
      { at: '2026-11-05T06:00:00.000Z', fulfillment: 'shipped', payment: 'pending_verification', note: 'Marked to ship in the sample timeline.' },
    ],
    demo: true,
  },
  {
    id: 'ord-1021',
    orderNumber: 'EBW-2026-1021',
    createdAt: '2026-11-04T03:00:00.000Z',
    customerId: 'user-camille',
    customerName: 'Camille Cruz',
    email: 'camille.cruz@example.com',
    phone: '09XX XXX 1004',
    address: { ...address, id: 'addr-camille', fullName: 'Camille Cruz', phone: '09XX XXX 1004' },
    items: [item('p-vitc', 1, 549)],
    subtotalCentavos: pesosToCentavos(549),
    discountCentavos: 0,
    shippingCentavos: 0,
    totalCentavos: pesosToCentavos(549),
    couponCode: null,
    shippingMethodId: 'ship-standard',
    shippingMethodName: 'Standard Delivery',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    notes: 'Demonstration record.',
    trackingNumber: 'DEMO-TRK-1021',
    proofName: null,
    latestProofId: null,
    history: [
      { at: '2026-11-04T03:00:00.000Z', fulfillment: 'delivered', payment: 'paid', note: 'Sample delivered order.' },
    ],
    demo: true,
  },
  {
    id: 'ord-1002',
    orderNumber: 'EBW-2026-1002',
    createdAt: '2026-10-28T03:00:00.000Z',
    customerId: 'user-alex',
    customerName: 'Alexandra Reyes',
    email: 'alexandra@example.com',
    phone: '09XX XXX XXXX',
    address,
    items: [item('p-vitc', 1, 549), item('p-oil', 1, 399)],
    subtotalCentavos: pesosToCentavos(948),
    discountCentavos: 0,
    shippingCentavos: 0,
    totalCentavos: pesosToCentavos(948),
    couponCode: null,
    shippingMethodId: 'ship-standard',
    shippingMethodName: 'Standard Delivery',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    notes: 'Demonstration record.',
    trackingNumber: 'DEMO-TRK-1002',
    proofName: null,
    latestProofId: null,
    history: [
      { at: '2026-10-28T03:00:00.000Z', fulfillment: 'delivered', payment: 'paid', note: 'Sample delivered order.' },
    ],
    demo: true,
  },
]

const banners: Banner[] = [
  {
    id: 'ban-1',
    eyebrow: 'NATURALLY BEAUTIFUL, EVERY DAY',
    title: 'Your glow,\nyour ritual.',
    subtitle: 'Feel good in your skin. Discover everyday beauty and wellness essentials made for your self-care moments.',
    buttonLabel: 'SHOP THE COLLECTION  →',
    href: '/shop',
    active: true,
    sortOrder: 1,
    imageNote: 'Illustrated bottles from the approved design reference.',
  },
  {
    id: 'ban-2',
    eyebrow: 'FRESH FINDS',
    title: 'New arrivals,\nquietly chosen.',
    subtitle: 'A demonstration banner for products marked new in this preview catalogue.',
    buttonLabel: 'SHOP NEW ARRIVALS  →',
    href: '/shop?collection=new',
    active: true,
    sortOrder: 2,
    imageNote: 'Same illustrated hero treatment.',
  },
  {
    id: 'ban-3',
    eyebrow: 'SELF-CARE ESSENTIALS',
    title: 'Care, kept\nsimple.',
    subtitle: 'Explore the preview collection. Live products will replace these placeholders.',
    buttonLabel: 'BROWSE THE SHOP  →',
    href: '/shop',
    active: true,
    sortOrder: 3,
    imageNote: 'Same illustrated hero treatment.',
  },
]

const coupons: Coupon[] = [
  { id: 'cp-welcome', code: 'WELCOME10', type: 'percent', amount: 10, active: true, minSubtotalCentavos: 0, label: 'Demonstration 10% voucher' },
  { id: 'cp-care', code: 'CARE150', type: 'fixed', amount: 15000, active: true, minSubtotalCentavos: 100000, label: 'Demonstration ₱150 voucher' },
]

const shippingMethods = defaultShippingMethods()

const settings: StoreSettings = {
  businessName: 'Earth Beauty & Wellness',
  legalName: 'Earth Beauty & Wellness, OPC',
  address: '3/F Gran Esperanza Building, Block C2 Lot 15 Villa Caceres Commercial, Balibago, City of Santa Rosa, Laguna',
  phone: '09778401931',
  email: 'hello@earthbeauty.demo',
  announcement: 'FREE SHIPPING ON SELECTED ORDERS · NEW ARRIVALS NOW AVAILABLE · SHOP YOUR SELF-CARE ESSENTIALS',
  heroEyebrow: 'NATURALLY BEAUTIFUL, EVERY DAY',
  about: 'Thoughtfully selected beauty and wellness products to make every day feel a little more beautiful.',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/',
  lowStockThreshold: 8,
  gcashAccountName: 'Earth Beauty & Wellness, OPC',
  gcashNumber: '09778401931',
  gcashInstructions: 'This is a demonstration instruction. Send the exact order total to the store GCash number and upload your receipt. An administrator will verify it manually. No payment is captured in this preview.',
  codEnabled: true,
  gcashEnabled: true,
  mayaEnabled: false,
  mayaAccountName: '',
  mayaNumber: '',
  mayaInstructions: '',
  qrphEnabled: false,
  qrphDisplayName: 'QR Ph',
  qrphRecipientInfo: '',
  qrphInstructions: '',
  xenditEnabled: false,
  showPreviewCatalogueNotice: true,
  paymongoNote: 'PayMongo is not connected. This option stays unavailable until the merchant completes onboarding.',
  policies: {
    shipping: 'Delivery fees and coverage are confirmed at checkout. The rates in this preview are demonstration values and are not a service promise.',
    returns: 'Return windows and conditions will be published by the store before launch. This page is a draft policy for the preview.',
    privacy: 'Account details and order information are used to fulfill orders. This preview stores demonstration data in your browser only.',
    terms: 'Orders in this preview are simulated. They do not create a purchase, reservation, or payment with Earth Beauty & Wellness, OPC.',
  },
}

export function buildSeed(): DemoState {
  return {
    seedVersion: SEED_VERSION,
    nextOrderSeq: 1025,
    categories,
    brands,
    products,
    orders,
    users,
    banners,
    coupons,
    shippingMethods,
    settings,
    movements: [
      { id: 'mov-1', at: '2026-11-01T00:00:00.000Z', productId: 'p-soak', variantId: null, sku: 'EBW-011', delta: -2, reason: 'Demonstration adjustment', balanceAfter: 6 },
      { id: 'mov-2', at: '2026-11-02T00:00:00.000Z', productId: 'p-brush', variantId: null, sku: 'EBW-021', delta: -1, reason: 'Demonstration count', balanceAfter: 3 },
    ],
    audit: [
      { id: 'aud-1', at: '2026-11-01T00:00:00.000Z', actor: 'System', action: 'seed', detail: 'Demonstration catalogue loaded.' },
    ],
    newsletter: [],
  }
}

export const SEED_KEY = 'ebw-demo-state-v1'
export { SEED_VERSION }
