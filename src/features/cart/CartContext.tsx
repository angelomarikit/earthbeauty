import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { availableStock, findVariant } from '@/features/catalog/pricing'
import { useStore } from '@/features/store/StoreContext'
import type { CartLine } from '@/types'

const CART_KEY = 'ebw-cart-v1'
const WISH_KEY = 'ebw-wish-v1'

const starterCart: CartLine[] = [
  { productId: 'p-serum', variantId: 'p-serum-v1', quantity: 1 },
  { productId: 'p-butter', variantId: 'p-butter-v1', quantity: 2 },
  { productId: 'p-rose', variantId: 'p-rose-std', quantity: 1 },
]

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

type CartValue = {
  lines: CartLine[]
  saved: string[]
  count: number
  add: (productId: string, variantId: string | null, quantity: number) => string | null
  setQty: (productId: string, variantId: string | null, quantity: number) => string | null
  remove: (productId: string, variantId: string | null) => void
  toggleSaved: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const [lines, setLines] = useState<CartLine[]>(() => read(CART_KEY, starterCart))
  const [saved, setSaved] = useState<string[]>(() => read(WISH_KEY, [] as string[]))

  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(lines)), [lines])
  useEffect(() => localStorage.setItem(WISH_KEY, JSON.stringify(saved)), [saved])

  const api = useMemo<CartValue>(() => {
    const same = (line: CartLine, productId: string, variantId: string | null) =>
      line.productId === productId && line.variantId === variantId

    const stockFor = (productId: string, variantId: string | null) => {
      const product = state.products.find((entry) => entry.id === productId)
      if (!product) return 0
      return availableStock(product, findVariant(product, variantId))
    }

    return {
      lines,
      saved,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: (productId, variantId, quantity) => {
        if (quantity < 1) return 'Choose at least 1.'
        const stock = stockFor(productId, variantId)
        const existing = lines.find((line) => same(line, productId, variantId))?.quantity ?? 0
        if (existing + quantity > stock) return 'That quantity is more than the available stock.'
        setLines((current) => {
          const found = current.find((line) => same(line, productId, variantId))
          if (!found) return [...current, { productId, variantId, quantity }]
          return current.map((line) => (same(line, productId, variantId) ? { ...line, quantity: line.quantity + quantity } : line))
        })
        return null
      },
      setQty: (productId, variantId, quantity) => {
        if (quantity < 1) return 'Quantity cannot be less than 1.'
        const stock = stockFor(productId, variantId)
        if (quantity > stock) return 'That quantity is more than the available stock.'
        setLines((current) => current.map((line) => (same(line, productId, variantId) ? { ...line, quantity } : line)))
        return null
      },
      remove: (productId, variantId) => setLines((current) => current.filter((line) => !same(line, productId, variantId))),
      toggleSaved: (productId) =>
        setSaved((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])),
      clear: () => setLines([]),
    }
  }, [lines, saved, state.products])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used within CartProvider')
  return value
}
