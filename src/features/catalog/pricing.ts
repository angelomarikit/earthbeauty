import { DATA_MODE } from '@/lib/mode'
import { isUuid } from '@/lib/ids'
import type { CartLine, Coupon, DemoState, Product, Variant } from '@/types'

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
  return DATA_MODE === 'demo' ? defaultVariant(product) : null
}

export function unitPrice(product: Product, variant?: Variant | null) {
  return variant?.priceCentavos ?? product.priceCentavos
}

export function comparePrice(product: Product, variant?: Variant | null) {
  return variant?.compareAtCentavos ?? product.compareAtCentavos
}

export function availableStock(product: Product, variant?: Variant | null) {
  if (!product.active) return 0
  if (!variant && DATA_MODE === 'production') return 0
  return variant?.stock ?? product.stock
}

export function isOnSale(product: Product) {
  const compare = product.compareAtCentavos
  return Boolean(compare && compare > product.priceCentavos)
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
