import { DATA_MODE } from '@/lib/mode'
import { isUuid } from '@/lib/ids'
import type { CartLine, Coupon, DemoState, Product, Variant } from '@/types'

/** In-memory only when `product_variants` row is missing — checkout uses `variant_id: null` until admin/SQL backfill. */
export const CATALOG_LEVEL_VARIANT_ID = '__catalog__'

export function activeProducts(state: DemoState) {
  return state.products.filter((product) => product.active)
}

export function findProduct(state: DemoState, idOrSlug: string) {
  return state.products.find((product) => product.id === idOrSlug || product.slug === idOrSlug)
}

/** Demo preview only — never sent to Supabase. */
export function defaultVariant(product: Product): Variant {
  return {
    id: `${product.id}-standard`,
    label: 'Standard',
    sku: product.sku,
    priceCentavos: product.priceCentavos,
    compareAtCentavos: product.compareAtCentavos,
    stock: product.stock,
    active: true,
  }
}

/** Real DB variant id for cart/checkout, or null when not persistable. */
export function cartVariantId(product: Product, variant: Variant | null): string | null {
  if (!variant) return null
  if (variant.id === CATALOG_LEVEL_VARIANT_ID) return null
  if (!product.variants.some((entry) => entry.id === variant.id)) return null
  return isUuid(variant.id) ? variant.id : null
}

/** Resolve variant for Supabase `place_order` (never demo ids like `…-standard` or `var-…`). */
export function orderLineVariantId(product: Product, variantId: string | null): string | null {
  const variant = findVariant(product, variantId)
  const resolved = cartVariantId(product, variant)
  if (resolved) return resolved
  const fallback =
    product.variants.find((entry) => entry.active && isUuid(entry.id)) ??
    product.variants.find((entry) => isUuid(entry.id))
  return fallback?.id ?? null
}

export function findVariant(product: Product, variantId: string | null): Variant | null {
  if (variantId) {
    if (isUuid(variantId)) {
      const match = product.variants.find((variant) => variant.id === variantId && variant.active)
      if (match) return match
      const any = product.variants.find((variant) => variant.id === variantId)
      if (any) return any
    } else if (DATA_MODE === 'demo') {
      const legacy = product.variants.find((variant) => variant.id === variantId)
      if (legacy) return legacy
    }
  }
  const fromList = product.variants.find((variant) => variant.active) ?? product.variants[0]
  if (fromList) return fromList
  if (DATA_MODE === 'production' && product.active) {
    return {
      id: CATALOG_LEVEL_VARIANT_ID,
      label: 'Standard',
      sku: product.sku,
      priceCentavos: product.priceCentavos,
      compareAtCentavos: product.compareAtCentavos,
      stock: product.stock,
      active: true,
    }
  }
  return DATA_MODE === 'demo' ? defaultVariant(product) : null
}

export function normalizeCentavosPricing(
  priceCentavos: number,
  compareAtCentavos: number | null,
): { priceCentavos: number; compareAtCentavos: number | null } {
  const price = Math.max(0, Math.round(priceCentavos))
  const compare =
    compareAtCentavos == null || compareAtCentavos <= 0 ? null : Math.round(compareAtCentavos)
  if (price > 0) {
    if (compare != null && compare <= price) return { priceCentavos: price, compareAtCentavos: null }
    return { priceCentavos: price, compareAtCentavos: compare }
  }
  if (compare != null) return { priceCentavos: compare, compareAtCentavos: null }
  return { priceCentavos: 0, compareAtCentavos: null }
}

/** Selling price shown in shop, cart, and checkout. Zero sale price falls back to regular (compare-at). */
export function unitPrice(product: Product, variant?: Variant | null) {
  if (variant && variant.priceCentavos > 0) {
    return normalizeCentavosPricing(variant.priceCentavos, variant.compareAtCentavos).priceCentavos
  }
  if (product.priceCentavos > 0) {
    return normalizeCentavosPricing(product.priceCentavos, product.compareAtCentavos).priceCentavos
  }
  const compare = variant?.compareAtCentavos ?? product.compareAtCentavos
  if (compare != null && compare > 0) return compare
  return variant?.priceCentavos ?? product.priceCentavos
}

/** Strikethrough “was” price — only when higher than the selling price. */
export function comparePrice(product: Product, variant?: Variant | null) {
  const sale = unitPrice(product, variant)
  const compare = variant?.compareAtCentavos ?? product.compareAtCentavos
  if (compare != null && compare > sale) return compare
  return null
}

export function storefrontVariant(product: Product): Variant | null {
  return product.variants.find((entry) => entry.active) ?? product.variants[0] ?? null
}

export function catalogUnitPrice(product: Product) {
  return unitPrice(product, storefrontVariant(product))
}

export function normalizeProductPricing(product: Product): Product {
  const base = normalizeCentavosPricing(product.priceCentavos, product.compareAtCentavos)
  const variants = product.variants.map((variant) => {
    if (variant.priceCentavos > 0) {
      const normalized = normalizeCentavosPricing(variant.priceCentavos, variant.compareAtCentavos)
      return { ...variant, ...normalized }
    }
    if (variant.compareAtCentavos != null && variant.compareAtCentavos > 0) {
      const normalized = normalizeCentavosPricing(variant.compareAtCentavos, null)
      return { ...variant, ...normalized }
    }
    if (base.priceCentavos > 0) {
      return { ...variant, priceCentavos: base.priceCentavos, compareAtCentavos: variant.compareAtCentavos ?? base.compareAtCentavos }
    }
    return variant
  })
  const stock = variants.reduce((sum, variant) => sum + variant.stock, 0)
  const lead = variants[0]
  return {
    ...product,
    ...base,
    stock,
    variants,
    priceCentavos: lead?.priceCentavos ?? base.priceCentavos,
    compareAtCentavos: lead?.compareAtCentavos ?? base.compareAtCentavos,
  }
}

export function availableStock(product: Product, variant?: Variant | null) {
  if (!product.active) return 0
  return variant?.stock ?? product.stock
}

export function isOnSale(product: Product) {
  const variant = storefrontVariant(product)
  return comparePrice(product, variant) != null
}

export function categoryName(state: DemoState, categoryId: string) {
  return state.categories.find((category) => category.id === categoryId)?.name ?? 'Unassigned'
}

export function brandName(state: DemoState, brandId: string | null, fallback: string) {
  if (!brandId) return fallback
  return state.brands.find((brand) => brand.id === brandId)?.name ?? fallback
}

export function cartDetailed(state: DemoState, lines: CartLine[]) {
  return lines
    .map((line) => {
      const product = state.products.find((entry) => entry.id === line.productId)
      if (!product) return null
      if (DATA_MODE === 'production' && !isUuid(line.productId)) return null
      const variant = findVariant(product, line.variantId)
      if (!variant) return null
      const stock = availableStock(product, variant)
      const quantity = Math.max(0, Math.min(line.quantity, stock))
      if (quantity < 1) return null
      return {
        ...line,
        variantId: orderLineVariantId(product, line.variantId),
        quantity,
        product,
        variant,
        unitPriceCentavos: unitPrice(product, variant),
        lineCentavos: unitPrice(product, variant) * quantity,
        stock,
      }
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
}

export function couponDiscount(coupon: Coupon | undefined, subtotalCentavos: number) {
  if (!coupon || !coupon.active) return 0
  if (subtotalCentavos < coupon.minSubtotalCentavos) return 0
  if (coupon.type === 'percent') return Math.round(subtotalCentavos * (coupon.amount / 100))
  return Math.min(coupon.amount, subtotalCentavos)
}
