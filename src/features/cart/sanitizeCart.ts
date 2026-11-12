import { orderLineVariantId } from '@/features/catalog/pricing'
import { isUuid } from '@/lib/ids'
import type { CartLine, DemoState } from '@/types'

export function sanitizeCartLines(lines: CartLine[], state: DemoState): CartLine[] {
  const next: CartLine[] = []
  for (const line of lines) {
    const product = state.products.find((entry) => entry.id === line.productId)
    if (!product || !isUuid(line.productId)) continue
    const variantId = orderLineVariantId(product, line.variantId)
    if (!variantId && product.variants.length > 0) continue
    const key = `${line.productId}:${variantId}`
    const existing = next.find((entry) => `${entry.productId}:${entry.variantId}` === key)
    if (existing) existing.quantity += line.quantity
    else next.push({ productId: line.productId, variantId: variantId ?? null, quantity: line.quantity })
  }
  return next
}
