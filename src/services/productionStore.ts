import { defaultShippingMethods } from '@/data/shipping/defaultMethods'
import { isUuid } from '@/lib/ids'
import { normalizeProductPricing } from '@/features/catalog/pricing'
import { getSupabase } from '@/lib/supabase'
import { entityUuid } from '@/lib/format'
import { toDbPaymentMethod } from '@/lib/paymentMethods'
import type {
  Brand,
  Category,
  Coupon,
  DemoState,
  Order,
  PackStyle,
  PaymentProof,
  Product,
  ProductImage,
  ShippingMethod,
  StoreSettings,
} from '@/types'

type Row = Record<string, unknown>

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' ? value : fallback
}

function mapShippingRows(rows: Row[]): ShippingMethod[] {
  const mapped = rows.map((row) => ({
    id: asText(row.id),
    name: asText(row.name),
    feeCentavos: asNumber(row.fee_centavos),
    detail: asText(row.detail, ''),
    active: Boolean(row.active),
    carrier: (asText(row.carrier) || undefined) as ShippingMethod['carrier'],
    jntZone: row.jnt_zone == null || row.jnt_zone === '' ? null : (asText(row.jnt_zone) as NonNullable<ShippingMethod['jntZone']>),
  }))
  return mapped.length ? mapped : defaultShippingMethods('production')
}

function mapPaymentMethod(value: string): Order['paymentMethod'] {
  if (value === 'gcash_manual' || value === 'maya_manual' || value === 'qrph_manual') return value
  if (value === 'cod') return 'cod'
  if (value === 'gcash') return 'gcash_manual'
  return 'cod'
}

function mapProductImage(row: Row): ProductImage {
  const sortOrder = asNumber(row.sort_order)
  return {
    id: asText(row.id),
    url: asText(row.url),
    altText: asText(row.alt_text, ''),
    sortOrder,
    isHero: row.is_hero === undefined || row.is_hero === null ? sortOrder === 0 : Boolean(row.is_hero),
    isThumbnail:
      row.is_thumbnail === undefined || row.is_thumbnail === null ? sortOrder === 0 : Boolean(row.is_thumbnail),
  }
}

function mapProduct(row: Row): Product {
  const variants = Array.isArray(row.product_variants) ? row.product_variants : []
  const imageRows = Array.isArray(row.product_images) ? row.product_images : []
  const images = imageRows
    .map((entry) => mapProductImage(entry as Row))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return normalizeProductPricing({
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
    images,
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
    demo: false,
  })
}

function mapPolicies(row: Row, base: StoreSettings['policies']): StoreSettings['policies'] {
  const raw = row.policies
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const policies = raw as Record<string, unknown>
  return {
    shipping: asText(policies.shipping, base.shipping),
    returns: asText(policies.returns, base.returns),
    privacy: asText(policies.privacy, base.privacy),
    terms: asText(policies.terms, base.terms),
  }
}

function storeSettingsSaveError(message: string): Error {
  if (/show_preview_catalogue_notice/i.test(message)) {
    return new Error(
      `${message} Run supabase/migrations/0003_preview_catalogue_notice.sql in the Supabase SQL Editor, then save again.`,
    )
  }
  if (/column of 'store_settings'/i.test(message)) {
    return new Error(
      `${message} Run pending files in supabase/migrations/ (0002_manual_payments.sql, 0003_preview_catalogue_notice.sql, 0004_xendit_gateway_flags.sql) in the Supabase SQL Editor.`,
    )
  }
  return new Error(message)
}

function mapSettingsRow(row: Row, base: StoreSettings): StoreSettings {
  return {
    ...base,
    businessName: asText(row.business_name, base.businessName),
    legalName: asText(row.legal_name, base.legalName),
    address: asText(row.address, base.address),
    phone: asText(row.phone, base.phone),
    email: asText(row.email, base.email),
    announcement: asText(row.announcement, base.announcement),
    about: asText(row.about, base.about),
    instagram: asText(row.instagram, base.instagram),
    facebook: asText(row.facebook, base.facebook),
    tiktok: asText(row.tiktok, base.tiktok),
    lowStockThreshold: asNumber(row.low_stock_threshold, base.lowStockThreshold),
    policies: mapPolicies(row, base.policies),
    showPreviewCatalogueNotice:
      row.show_preview_catalogue_notice == null
        ? base.showPreviewCatalogueNotice
        : Boolean(row.show_preview_catalogue_notice),
    codEnabled: row.cod_enabled == null ? base.codEnabled : Boolean(row.cod_enabled),
    gcashEnabled: row.gcash_enabled == null ? base.gcashEnabled : Boolean(row.gcash_enabled),
    gcashAccountName: asText(row.gcash_account_name, base.gcashAccountName),
    gcashNumber: asText(row.gcash_number, base.gcashNumber),
    gcashInstructions: asText(row.gcash_instructions, base.gcashInstructions),
    mayaEnabled: Boolean(row.maya_enabled),
    mayaAccountName: asText(row.maya_account_name, ''),
    mayaNumber: asText(row.maya_number, ''),
    mayaInstructions: asText(row.maya_instructions, ''),
    qrphEnabled: Boolean(row.qrph_enabled),
    qrphDisplayName: asText(row.qrph_display_name, 'QR Ph'),
    qrphRecipientInfo: asText(row.qrph_recipient_info, ''),
    qrphInstructions: asText(row.qrph_instructions, ''),
    xenditEnabled: Boolean(row.xendit_enabled),
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
    paymentMethod: mapPaymentMethod(asText(row.payment_method, 'cod')),
    paymentStatus: (asText(row.payment_status, 'unpaid') as Order['paymentStatus']) || 'unpaid',
    fulfillmentStatus: (asText(row.fulfillment_status, 'pending') as Order['fulfillmentStatus']) || 'pending',
    notes: asText(row.notes),
    trackingNumber: asText(row.tracking_number),
    proofName: null,
    latestProofId: null,
    history: [],
    demo: false,
  }
}

const defaultPolicies: StoreSettings['policies'] = {
  shipping: '',
  returns: '',
  privacy: '',
  terms: '',
}

export async function loadProductionState(settingsBase?: StoreSettings): Promise<DemoState> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using production mode.')

  const settingsFallback: StoreSettings = settingsBase ?? {
    businessName: 'Earth Beauty & Wellness',
    legalName: 'Earth Beauty & Wellness, OPC',
    address: '',
    phone: '',
    email: '',
    announcement: '',
    heroEyebrow: '',
    about: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    lowStockThreshold: 8,
    gcashAccountName: '',
    gcashNumber: '',
    gcashInstructions: '',
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
    showPreviewCatalogueNotice: false,
    paymongoNote: '',
    policies: defaultPolicies,
  }

  const [categories, brands, products, orders, settings, shipping, coupons, banners] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('products').select('*, product_variants(*), product_images(*)').order('created_at', { ascending: false }),
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
    supabase.from('store_settings').select('*').limit(1).maybeSingle(),
    supabase.from('shipping_methods').select('*').order('name'),
    supabase.from('coupons').select('*').order('code'),
    supabase.from('banners').select('*').order('sort_order'),
  ])

  for (const result of [categories, brands, products, orders, shipping, coupons, banners]) {
    if (result.error) throw new Error(result.error.message)
  }

  return {
    seedVersion: 1,
    nextOrderSeq: 1,
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
    settings: settings.data ? mapSettingsRow(settings.data as Row, settingsFallback) : settingsFallback,
    shippingMethods: mapShippingRows(shipping.data ?? []),
    coupons: (coupons.data ?? []).map((row) => ({
      id: asText(row.id),
      code: asText(row.code),
      type: (asText(row.type, 'percent') as Coupon['type']) || 'percent',
      amount: asNumber(row.amount),
      active: Boolean(row.active),
      minSubtotalCentavos: asNumber(row.min_subtotal_centavos),
      label: asText(row.label, asText(row.code)),
    })),
    banners: (banners.data ?? []).map((row) => ({
      id: asText(row.id),
      eyebrow: asText(row.eyebrow, ''),
      title: asText(row.title),
      subtitle: asText(row.subtitle, ''),
      buttonLabel: asText(row.button_label, 'SHOP NOW'),
      href: asText(row.href, '/shop'),
      active: Boolean(row.active),
      sortOrder: asNumber(row.sort_order),
      imageNote: asText(row.image_url, ''),
    })),
    users: [],
    movements: [],
    audit: [],
    newsletter: [],
  }
}

export async function productionSave(kind: string, payload: unknown) {
  const supabase = getSupabase()
  if (!supabase) return

  if (kind === 'category') {
    const category = payload as Category
    const { error } = await supabase.from('categories').upsert({
      id: category.id,
      name: category.name,
      slug: category.slug,
      symbol: category.symbol,
      tint: category.tint,
      image_url: category.imageUrl,
      blurb: category.blurb,
      active: category.active,
      sort_order: category.sortOrder,
      show_on_homepage: category.showOnHomepage,
      show_in_nav: category.showInNav,
    })
    if (error) throw new Error(error.message)
    return
  }

  if (kind === 'delete-category') {
    const { id } = payload as { id: string }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }

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
    const product = normalizeProductPricing(payload as Product)
    const { error: productError } = await supabase.from('products').upsert({
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
    if (productError) throw new Error(productError.message)
    const savedImageIds = new Set<string>()
    for (let index = 0; index < product.images.length; index++) {
      const image = product.images[index]
      const imageId = isUuid(image.id) ? image.id : entityUuid()
      savedImageIds.add(imageId)
      const { error: imageError } = await supabase.from('product_images').upsert({
        id: imageId,
        product_id: product.id,
        url: image.url,
        alt_text: image.altText || product.name,
        sort_order: index,
        is_hero: image.isHero,
        is_thumbnail: image.isThumbnail,
      })
      if (imageError) {
        if (/is_hero|is_thumbnail/i.test(imageError.message)) {
          throw new Error(
            `${imageError.message} Run supabase/migrations/0010_product_image_roles.sql in the Supabase SQL Editor.`,
          )
        }
        throw new Error(imageError.message)
      }
    }
    const { data: existingImages, error: listImagesError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', product.id)
    if (listImagesError) throw new Error(listImagesError.message)
    for (const row of existingImages ?? []) {
      const rowId = asText((row as Row).id)
      if (!savedImageIds.has(rowId)) {
        const { error: deleteError } = await supabase.from('product_images').delete().eq('id', rowId)
        if (deleteError) throw new Error(deleteError.message)
      }
    }
    const variants =
      product.variants.length > 0
        ? product.variants
        : [
            {
              id: entityUuid(),
              label: 'Standard',
              sku: product.sku,
              priceCentavos: product.priceCentavos,
              compareAtCentavos: product.compareAtCentavos,
              stock: product.stock,
              active: true,
            },
          ]
    for (const variant of variants) {
      const variantId = isUuid(variant.id) ? variant.id : entityUuid()
      const { error } = await supabase.from('product_variants').upsert({
        id: variantId,
        product_id: product.id,
        label: variant.label,
        sku: variant.sku,
        price_centavos: variant.priceCentavos,
        compare_at_centavos: variant.compareAtCentavos,
        stock: variant.stock,
        active: variant.active,
      })
      if (error) throw new Error(error.message)
    }
    return
  }

  if (kind === 'delete-product') {
    const { id } = payload as { id: string }
    await supabase.from('product_variants').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return
  }

  if (kind === 'shipping') {
    const method = payload as ShippingMethod
    const { error } = await supabase.from('shipping_methods').upsert({
      id: method.id,
      name: method.name,
      fee_centavos: method.feeCentavos,
      detail: method.detail,
      active: method.active,
      carrier: method.carrier ?? '',
      jnt_zone: method.jntZone ?? null,
    })
    if (error) throw new Error(error.message)
    return
  }

  if (kind === 'settings') {
    const settings = payload as StoreSettings
    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      business_name: settings.businessName,
      legal_name: settings.legalName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      announcement: settings.announcement,
      about: settings.about,
      instagram: settings.instagram,
      facebook: settings.facebook,
      tiktok: settings.tiktok,
      low_stock_threshold: settings.lowStockThreshold,
      policies: settings.policies,
      show_preview_catalogue_notice: settings.showPreviewCatalogueNotice,
      cod_enabled: settings.codEnabled,
      gcash_enabled: settings.gcashEnabled,
      gcash_account_name: settings.gcashAccountName,
      gcash_number: settings.gcashNumber,
      gcash_instructions: settings.gcashInstructions,
      maya_enabled: settings.mayaEnabled,
      maya_account_name: settings.mayaAccountName,
      maya_number: settings.mayaNumber,
      maya_instructions: settings.mayaInstructions,
      qrph_enabled: settings.qrphEnabled,
      qrph_display_name: settings.qrphDisplayName,
      qrph_recipient_info: settings.qrphRecipientInfo,
      qrph_instructions: settings.qrphInstructions,
      xendit_enabled: settings.xenditEnabled,
    })
    if (error) throw storeSettingsSaveError(error.message)
    return
  }

  if (kind === 'order') {
    const { orderId, patch } = payload as { orderId: string; patch: Partial<Order> }
    const { error } = await supabase
      .from('orders')
      .update({
        fulfillment_status: patch.fulfillmentStatus,
        payment_status: patch.paymentStatus,
        tracking_number: patch.trackingNumber,
        notes: patch.notes,
      })
      .eq('id', orderId)
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

export type PlaceOrderPayload = {
  customerName: string
  email: string
  phone: string
  address: Order['address']
  lines: { productId: string; variantId: string | null; quantity: number }[]
  couponCode: string | null
  shippingMethodId: string
  paymentMethod: Order['paymentMethod']
  notes: string
  idempotencyKey?: string
}

export async function productionPlaceOrder(input: PlaceOrderPayload): Promise<string> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.rpc('place_order', {
    payload: {
      customer_name: input.customerName,
      email: input.email,
      phone: input.phone,
      address: {
        street: input.address.street,
        region: input.address.region,
        province: input.address.province,
        city: input.address.city,
        barangay: input.address.barangay,
        postalCode: input.address.postalCode,
      },
      items: input.lines.map((line) => ({
        product_id: line.productId,
        variant_id: line.variantId && isUuid(line.variantId) ? line.variantId : null,
        quantity: line.quantity,
      })),
      shipping_method_id: input.shippingMethodId,
      coupon_code: input.couponCode,
      payment_method: toDbPaymentMethod(input.paymentMethod),
      notes: input.notes,
      idempotency_key: input.idempotencyKey,
    },
  })
  if (error) throw new Error(error.message)
  return String(data)
}

export async function productionSubmitPaymentProof(payload: {
  orderId: string
  email: string
  storagePath: string
  referenceNumber: string
  fileName: string
  mimeType: string
}) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.rpc('submit_payment_proof', {
    payload: {
      order_id: payload.orderId,
      email: payload.email,
      storage_path: payload.storagePath,
      reference_number: payload.referenceNumber,
      file_name: payload.fileName,
      mime_type: payload.mimeType,
    },
  })
  if (error) throw new Error(error.message)
}

export async function productionVerifyPayment(payload: {
  orderId: string
  proofId: string
  decision: 'approve' | 'reject' | 'request_resubmit'
  adminNotes?: string
  rejectionReason?: string
}) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.rpc('verify_payment', {
    payload: {
      order_id: payload.orderId,
      proof_id: payload.proofId,
      decision: payload.decision,
      admin_notes: payload.adminNotes ?? '',
      rejection_reason: payload.rejectionReason ?? '',
    },
  })
  if (error) throw new Error(error.message)
}

export async function productionMarkCodCollected(orderId: string) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.rpc('mark_cod_collected', { payload: { order_id: orderId } })
  if (error) throw new Error(error.message)
}

export async function productionFetchOrderProofs(orderId: string): Promise<PaymentProof[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map((row) => ({
    id: asText(row.id),
    orderId: asText(row.order_id),
    storagePath: asText(row.storage_path),
    fileName: asText(row.file_name),
    mimeType: asText(row.mime_type),
    referenceNumber: asText(row.reference_number),
    verificationStatus: asText(row.verification_status),
    attemptNumber: asNumber(row.attempt_number),
    createdAt: asText(row.created_at),
  }))
}

function mapTrackOrderPayload(payload: Row): Order | null {
  const orderRow = payload.order as Row | undefined
  if (!orderRow) return null
  const items = Array.isArray(payload.items) ? payload.items : []
  const historyRows = Array.isArray(payload.history) ? payload.history : []
  const base = mapOrder({ ...orderRow, order_items: items })
  return {
    ...base,
    history: historyRows.map((row) => {
      const event = row as Row
      return {
        at: asText(event.at),
        fulfillment: (asText(event.fulfillment, 'pending') as Order['fulfillmentStatus']) || 'pending',
        payment: (asText(event.payment, 'unpaid') as Order['paymentStatus']) || 'unpaid',
        note: asText(event.note, ''),
      }
    }),
  }
}

export async function productionTrackOrder(orderNumber: string, email: string): Promise<Order | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('track_order', {
    p_order_number: orderNumber.trim(),
    p_email: email.trim(),
  })
  if (error) throw new Error(error.message.includes('track_order') ? `${error.message} Run supabase/migrations/0011_track_order_rpc.sql.` : error.message)
  if (!data || typeof data !== 'object') return null
  return mapTrackOrderPayload(data as Row)
}

export async function productionFetchOrderById(orderId: string): Promise<Order | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).maybeSingle()
  if (error || !data) return null
  return mapOrder(data as Row)
}
