import { buildSeed } from '@/data/demo/seed'
import { getSupabase } from '@/lib/supabase'
import type { Brand, DemoState, Order, PackStyle, Product } from '@/types'

type Row = Record<string, unknown>

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' ? value : fallback
}

function mapProduct(row: Row): Product {
  const variants = Array.isArray(row.product_variants) ? row.product_variants : []
  return {
    id: asText(row.id),
    name: asText(row.name),
    slug: asText(row.slug),
    description: asText(row.description),
    howToUse: asText(row.how_to_use),
    shippingNote: asText(row.shipping_note),
    categoryId: asText(row.category_id),
    brandId: row.brand_id == null ? null : asText(row.brand_id),
    sku: asText(row.sku),
    priceCentavos: asNumber(row.price_centavos),
    compareAtCentavos: row.compare_at_centavos == null ? null : asNumber(row.compare_at_centavos),
    stock: asNumber(row.stock),
    badge: row.badge == null ? null : asText(row.badge),
    pack: (asText(row.pack, 'bottle') as PackStyle) || 'bottle',
    gallery: Array.isArray(row.gallery) ? (row.gallery as PackStyle[]) : ['bottle'],
    imageUrl: row.image_url == null ? null : asText(row.image_url),
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    bestSeller: Boolean(row.best_seller),
    active: Boolean(row.active),
    variants: variants.map((variant) => {
      const item = variant as Row
      return {
        id: asText(item.id),
        label: asText(item.label),
        sku: asText(item.sku),
        priceCentavos: asNumber(item.price_centavos),
        compareAtCentavos: item.compare_at_centavos == null ? null : asNumber(item.compare_at_centavos),
        stock: asNumber(item.stock),
        active: Boolean(item.active),
      }
    }),
    demoReviewCount: 0,
    demoSoldLabel: '',
    demoUnitsSold: 0,
    createdAt: asText(row.created_at, new Date().toISOString()),
    demo: true,
  }
}

export async function loadProductionState(): Promise<DemoState> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using production mode.')
  const base = buildSeed()
  const [categories, brands, products, orders, settings] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('products').select('*, product_variants(*)').order('created_at', { ascending: false }),
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
    supabase.from('store_settings').select('*').limit(1).maybeSingle(),
  ])
  if (categories.error) throw new Error(categories.error.message)
  if (brands.error) throw new Error(brands.error.message)
  if (products.error) throw new Error(products.error.message)
  if (orders.error) throw new Error(orders.error.message)

  return {
    ...base,
    categories: (categories.data ?? []).map((row) => ({
      id: asText(row.id),
      name: asText(row.name),
      slug: asText(row.slug),
      symbol: asText(row.symbol, '✦'),
      tint: asText(row.tint, '#faeaf0'),
      imageUrl: row.image_url == null ? null : asText(row.image_url),
      active: Boolean(row.active),
      sortOrder: asNumber(row.sort_order),
      showOnHomepage: Boolean(row.show_on_homepage),
      showInNav: Boolean(row.show_in_nav),
      blurb: asText(row.blurb, 'Shop collection →'),
    })),
    brands: (brands.data ?? []).map((row) => ({
      id: asText(row.id),
      name: asText(row.name),
      slug: asText(row.slug),
      logoUrl: row.logo_url == null ? null : asText(row.logo_url),
      tint: asText(row.tint, '#fff0f7'),
      active: Boolean(row.active),
      sortOrder: asNumber(row.sort_order),
      showOnHomepage: Boolean(row.show_on_homepage),
      blurb: asText(row.blurb, 'View products →'),
    })),
    products: (products.data ?? []).map((row) => mapProduct(row as Row)),
    orders: (orders.data ?? []).map((row) => mapOrder(row as Row)),
    settings: settings.data
      ? {
          ...base.settings,
          businessName: asText(settings.data.business_name, base.settings.businessName),
          legalName: asText(settings.data.legal_name, base.settings.legalName),
          address: asText(settings.data.address, base.settings.address),
          phone: asText(settings.data.phone, base.settings.phone),
          announcement: asText(settings.data.announcement, base.settings.announcement),
          lowStockThreshold: asNumber(settings.data.low_stock_threshold, base.settings.lowStockThreshold),
          showPreviewCatalogueNotice:
            settings.data.show_preview_catalogue_notice == null
              ? base.settings.showPreviewCatalogueNotice
              : Boolean(settings.data.show_preview_catalogue_notice),
        }
      : base.settings,
    users: [],
    banners: base.banners,
  }
}

function mapOrder(row: Row): Order {
  const items = Array.isArray(row.order_items) ? row.order_items : []
  return {
    id: asText(row.id),
    orderNumber: asText(row.order_number),
    createdAt: asText(row.created_at),
    customerId: row.customer_id == null ? null : asText(row.customer_id),
    customerName: asText(row.customer_name),
    email: asText(row.email),
    phone: asText(row.phone),
    address: {
      id: asText(row.id),
      label: 'Delivery',
      fullName: asText(row.customer_name),
      phone: asText(row.phone),
      street: asText(row.street),
      region: asText(row.region),
      province: asText(row.province),
      city: asText(row.city),
      barangay: asText(row.barangay),
      postalCode: asText(row.postal_code),
      isDefault: false,
    },
    items: items.map((item) => {
      const line = item as Row
      return {
        productId: asText(line.product_id),
        variantId: line.variant_id == null ? null : asText(line.variant_id),
        name: asText(line.name),
        variantLabel: asText(line.variant_label),
        sku: asText(line.sku),
        pack: 'bottle' as PackStyle,
        imageUrl: null,
        unitPriceCentavos: asNumber(line.unit_price_centavos),
        quantity: asNumber(line.quantity),
      }
    }),
    subtotalCentavos: asNumber(row.subtotal_centavos),
    discountCentavos: asNumber(row.discount_centavos),
    shippingCentavos: asNumber(row.shipping_centavos),
    totalCentavos: asNumber(row.total_centavos),
    couponCode: row.coupon_code == null ? null : asText(row.coupon_code),
    shippingMethodId: asText(row.shipping_method_id),
    shippingMethodName: asText(row.shipping_method_name, 'Delivery'),
    paymentMethod: (asText(row.payment_method, 'cod') as Order['paymentMethod']) || 'cod',
    paymentStatus: (asText(row.payment_status, 'unpaid') as Order['paymentStatus']) || 'unpaid',
    fulfillmentStatus: (asText(row.fulfillment_status, 'pending') as Order['fulfillmentStatus']) || 'pending',
    notes: asText(row.notes),
    trackingNumber: asText(row.tracking_number),
    proofName: null,
    history: [],
    demo: true,
  }
}

export async function productionSave(kind: string, payload: unknown) {
  const supabase = getSupabase()
  if (!supabase) return
  if (kind === 'brand') {
    const brand = payload as Brand
    const { error } = await supabase.from('brands').upsert({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logoUrl,
      tint: brand.tint,
      blurb: brand.blurb,
      active: brand.active,
      sort_order: brand.sortOrder,
      show_on_homepage: brand.showOnHomepage,
    })
    if (error) throw new Error(error.message)
    return
  }
  if (kind === 'delete-brand') {
    const { id } = payload as { id: string }
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }
  if (kind === 'product') {
    const product = payload as Product
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      how_to_use: product.howToUse,
      shipping_note: product.shippingNote,
      category_id: product.categoryId,
      brand_id: product.brandId,
      sku: product.sku,
      price_centavos: product.priceCentavos,
      compare_at_centavos: product.compareAtCentavos,
      stock: product.stock,
      badge: product.badge,
      pack: product.pack,
      gallery: product.gallery,
      image_url: product.imageUrl,
      featured: product.featured,
      is_new: product.isNew,
      best_seller: product.bestSeller,
      active: product.active,
    })
    if (error) throw new Error(error.message)
    return
  }
  if (kind === 'settings') {
    const settings = payload as DemoState['settings']
    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      business_name: settings.businessName,
      legal_name: settings.legalName,
      address: settings.address,
      phone: settings.phone,
      announcement: settings.announcement,
      low_stock_threshold: settings.lowStockThreshold,
      show_preview_catalogue_notice: settings.showPreviewCatalogueNotice,
    })
    if (error) throw new Error(error.message)
  }
}

export async function productionAdjustStock(productId: string, variantId: string | null, delta: number, reason: string) {
  const supabase = getSupabase()
  if (!supabase) return
  const { error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_delta: delta,
    p_reason: reason,
  })
  if (error) throw new Error(error.message)
}

export async function productionPlaceOrder(order: Order) {
  const supabase = getSupabase()
  if (!supabase) return
  const { error } = await supabase.rpc('place_order', {
    payload: {
      email: order.email,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      items: order.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      shipping_method_id: order.shippingMethodId,
      coupon_code: order.couponCode,
      payment_method: order.paymentMethod,
      notes: order.notes,
    },
  })
  if (error) throw new Error(error.message)
}
