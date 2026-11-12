export type PackStyle = 'bottle' | 'jar' | 'tall' | 'tube'

export type Category = {
  id: string
  name: string
  slug: string
  symbol: string
  tint: string
  imageUrl: string | null
  active: boolean
  sortOrder: number
  showOnHomepage: boolean
  showInNav: boolean
  blurb: string
}

export type Brand = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  tint: string
  active: boolean
  sortOrder: number
  showOnHomepage: boolean
  blurb: string
}

export type Variant = {
  id: string
  label: string
  sku: string
  priceCentavos: number
  compareAtCentavos: number | null
  stock: number
  active: boolean
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  howToUse: string
  shippingNote: string
  categoryId: string
  brandId: string | null
  sku: string
  priceCentavos: number
  compareAtCentavos: number | null
  stock: number
  badge: string | null
  pack: PackStyle
  gallery: PackStyle[]
  imageUrl: string | null
  featured: boolean
  isNew: boolean
  bestSeller: boolean
  active: boolean
  variants: Variant[]
  demoReviewCount: number
  demoSoldLabel: string
  demoUnitsSold: number
  createdAt: string
  demo: true
}

export type Address = {
  id: string
  label: string
  fullName: string
  phone: string
  street: string
  region: string
  province: string
  city: string
  barangay: string
  postalCode: string
  isDefault: boolean
}

export type DemoUser = {
  id: string
  name: string
  email: string
  phone: string
  password: string
  role: 'customer' | 'admin'
  memberSince: string
  addresses: Address[]
  demo: true
}

export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'refunded' | 'rejected'
export type PaymentMethod =
  | 'cod'
  | 'gcash_manual'
  | 'maya_manual'
  | 'qrph_manual'
  | 'xendit'
  | 'gcash'
  | 'paymongo'

export type PaymentProof = {
  id: string
  orderId: string
  storagePath: string
  fileName: string
  mimeType: string
  referenceNumber: string
  verificationStatus: string
  attemptNumber: number
  createdAt: string
}

export type OrderItem = {
  productId: string
  variantId: string | null
  name: string
  variantLabel: string
  sku: string
  pack: PackStyle
  imageUrl: string | null
  unitPriceCentavos: number
  quantity: number
}

export type StatusEvent = {
  at: string
  fulfillment: FulfillmentStatus
  payment: PaymentStatus
  note: string
}

export type Order = {
  id: string
  orderNumber: string
  createdAt: string
  customerId: string | null
  customerName: string
  email: string
  phone: string
  address: Address
  items: OrderItem[]
  subtotalCentavos: number
  discountCentavos: number
  shippingCentavos: number
  totalCentavos: number
  couponCode: string | null
  shippingMethodId: string
  shippingMethodName: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  notes: string
  trackingNumber: string
  proofName: string | null
  latestProofId: string | null
  history: StatusEvent[]
  demo: true
}

export type Banner = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  buttonLabel: string
  href: string
  active: boolean
  sortOrder: number
  imageNote: string
}

export type Coupon = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  amount: number
  active: boolean
  minSubtotalCentavos: number
  label: string
}

export type ShippingMethod = {
  id: string
  name: string
  feeCentavos: number
  detail: string
  active: boolean
}

export type StoreSettings = {
  businessName: string
  legalName: string
  address: string
  phone: string
  email: string
  announcement: string
  heroEyebrow: string
  about: string
  instagram: string
  facebook: string
  tiktok: string
  lowStockThreshold: number
  gcashAccountName: string
  gcashNumber: string
  gcashInstructions: string
  codEnabled: boolean
  gcashEnabled: boolean
  mayaEnabled: boolean
  mayaAccountName: string
  mayaNumber: string
  mayaInstructions: string
  qrphEnabled: boolean
  qrphDisplayName: string
  qrphRecipientInfo: string
  qrphInstructions: string
  xenditEnabled: boolean
  /** Footer notice that products/prices are preview placeholders. */
  showPreviewCatalogueNotice: boolean
  paymongoNote: string
  policies: {
    shipping: string
    returns: string
    privacy: string
    terms: string
  }
}

export type InventoryMovement = {
  id: string
  at: string
  productId: string
  variantId: string | null
  sku: string
  delta: number
  reason: string
  balanceAfter: number
}

export type AuditLog = {
  id: string
  at: string
  actor: string
  action: string
  detail: string
}

export type DemoState = {
  seedVersion: number
  nextOrderSeq: number
  categories: Category[]
  brands: Brand[]
  products: Product[]
  orders: Order[]
  users: DemoUser[]
  banners: Banner[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  settings: StoreSettings
  movements: InventoryMovement[]
  audit: AuditLog[]
  newsletter: string[]
}

export type CartLine = {
  productId: string
  variantId: string | null
  quantity: number
}

export type DataMode = 'demo' | 'production'
