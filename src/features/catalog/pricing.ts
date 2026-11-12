import type { CartLine, Coupon, DemoState, Product, Variant } from '@/types'

export function activeProducts(state: DemoState) {
  return state.products.filter((product) => product.active)
}

export function findProduct(state: DemoState, idOrSlug: string) {
  return state.products.find((product) => product.id === idOrSlug || product.slug === idOrSlug)
}

export function findVariant(product: Product, variantId: string | null) {
  if (variantId) {
    const match = product.variants.find((variant) => variant.id === variantId && variant.active)
    if (match) return match
  }
  return product.variants.find((variant) => variant.active) ?? product.variants[0]
}

export function unitPrice(product: Product, variant?: Variant | null) {
  return variant?.priceCentavos ?? product.priceCentavos
}

export function comparePrice(product: Product, variant?: Variant | null) {
  return variant?.compareAtCentavos ?? product.compareAtCentavos
}

export function availableStock(product: Product, variant?: Variant | null) {
  if (!product.active) return 0
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
      const variant = findVariant(product, line.variantId)
      const stock = availableStock(product, variant)
      const quantity = Math.max(0, Math.min(line.quantity, stock))
      return {
        ...line,
        quantity,
        product,
        variant,
        unitPriceCentavos: unitPrice(product, variant),
        lineCentavos: unitPrice(product, variant) * quantity,
        stock,
      }
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line && line.quantity >= 0 && line.product))
}

export function couponDiscount(coupon: Coupon | undefined, subtotalCentavos: number) {
  if (!coupon || !coupon.active) return 0
  if (subtotalCentavos < coupon.minSubtotalCentavos) return 0
  if (coupon.type === 'percent') return Math.round(subtotalCentavos * (coupon.amount / 100))
  return Math.min(coupon.amount, subtotalCentavos)
}
