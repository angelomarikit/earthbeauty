import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildSeed, SEED_KEY, SEED_VERSION } from '@/data/demo/seed'
import { DATA_MODE } from '@/lib/mode'
import { uid } from '@/lib/format'
import { couponDiscount, findVariant, unitPrice } from '@/features/catalog/pricing'
import { defaultShippingMethods } from '@/data/shipping/defaultMethods'
import type { Address, Banner, Brand, Category, Coupon, DemoState, DemoUser, Order, PaymentMethod, Product, ShippingMethod, StoreSettings } from '@/types'

export type PlaceOrderInput = {
  customerId: string | null
  customerName: string
  email: string
  phone: string
  address: Address
  lines: { productId: string; variantId: string | null; quantity: number }[]
  couponCode: string | null
  shippingMethodId: string
  paymentMethod: PaymentMethod
  notes: string
  proofName: string | null
  proofFile?: File | null
  referenceNumber?: string
}
import { manualMethodsRequireProof } from '@/lib/paymentMethods'
import {
  loadProductionState,
  productionAdjustStock,
  productionFetchOrderById,
  productionPlaceOrder,
  productionSave,
  productionSubmitPaymentProof,
} from '@/services/productionStore'
import { uploadPaymentProof } from '@/services/storageUpload'
import { xenditPaymentProvider } from '@/services/payments/xenditPaymentService'

type StoreValue = {
  state: DemoState
  mode: 'demo' | 'production'
  loading: boolean
  error: string | null
  refreshState: () => Promise<void>
  resetDemo: () => void
  saveProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  saveCategory: (category: Category) => string | null
  deleteCategory: (id: string) => string | null
  moveCategory: (id: string, direction: -1 | 1) => void
  saveBrand: (brand: Brand) => string | null
  deleteBrand: (id: string) => string | null
  moveBrand: (id: string, direction: -1 | 1) => void
  adjustStock: (productId: string, variantId: string | null, delta: number, reason: string) => string | null
  updateOrder: (orderId: string, patch: Partial<Order> & { historyNote?: string }) => void
  placeOrder: (input: PlaceOrderInput) => Promise<Order | string>
  saveSettings: (settings: StoreSettings) => Promise<void>
  saveBanner: (banner: Banner) => void
  deleteBanner: (id: string) => void
  saveCoupon: (coupon: Coupon) => void
  deleteCoupon: (id: string) => void
  saveShipping: (method: ShippingMethod) => void
  addNewsletter: (email: string) => void
  registerUser: (user: Omit<DemoUser, 'id' | 'demo'>) => DemoUser | string
  updateUser: (user: DemoUser) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem(SEED_KEY)
    if (!raw) return buildSeed()
    const parsed = JSON.parse(raw) as DemoState
    if (parsed.seedVersion !== SEED_VERSION || !parsed.products?.length) return buildSeed()
    const seed = buildSeed()
    const seedProducts = new Map(seed.products.map((product) => [product.id, product]))
    return {
      ...parsed,
      brands: parsed.brands?.length ? parsed.brands : seed.brands,
      products: parsed.products.map((product) => ({
        ...product,
        brandId: product.brandId ?? seedProducts.get(product.id)?.brandId ?? null,
      })),
      settings: {
        ...seed.settings,
        ...parsed.settings,
        showPreviewCatalogueNotice: parsed.settings.showPreviewCatalogueNotice ?? true,
      },
    }
  } catch {
    return buildSeed()
  }
}

function emptyProduction(): DemoState {
  const seed = buildSeed()
  return {
    seedVersion: 1,
    nextOrderSeq: 1,
    categories: [],
    brands: [],
    products: [],
    orders: [],
    settings: { ...seed.settings, showPreviewCatalogueNotice: false },
    shippingMethods: defaultShippingMethods(),
    coupons: [],
    banners: [],
    users: [],
    movements: [],
    audit: [],
    newsletter: [],
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const mode = DATA_MODE
  const [state, setState] = useState<DemoState>(() => (mode === 'demo' ? loadDemo() : emptyProduction()))
  const [loading, setLoading] = useState(mode === 'production')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'demo') return
    localStorage.setItem(SEED_KEY, JSON.stringify(state))
  }, [mode, state])

  useEffect(() => {
    if (mode !== 'production') return
    let cancelled = false
    loadProductionState()
      .then((next) => {
        if (!cancelled) setState(next)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load the live store.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode])

  const api = useMemo<StoreValue>(() => {
    const audit = (current: DemoState, action: string, detail: string, actor = 'Demo admin'): DemoState => ({
      ...current,
      audit: [{ id: uid('aud'), at: new Date().toISOString(), actor, action, detail }, ...current.audit].slice(0, 200),
    })

    return {
      state,
      mode,
      loading,
      error,
      refreshState: async () => {
        if (mode !== 'production') return
        setLoading(true)
        try {
          const next = await loadProductionState(state.settings)
          setState(next)
          setError(null)
        } catch (reason: unknown) {
          setError(reason instanceof Error ? reason.message : 'Unable to reload the store.')
        } finally {
          setLoading(false)
        }
      },
      resetDemo: () => {
        if (mode !== 'demo') return
        localStorage.removeItem(SEED_KEY)
        setState(buildSeed())
      },
      saveProduct: (product) => {
        setState((current) => {
          const exists = current.products.some((entry) => entry.id === product.id)
          const products = exists
            ? current.products.map((entry) => (entry.id === product.id ? product : entry))
            : [product, ...current.products]
          const next = audit({ ...current, products }, exists ? 'update-product' : 'create-product', product.name)
          if (mode === 'production') void productionSave('product', product)
          return next
        })
      },
      deleteProduct: (id) => {
        setState((current) => {
          const product = current.products.find((entry) => entry.id === id)
          const next = audit(
            { ...current, products: current.products.filter((entry) => entry.id !== id) },
            'delete-product',
            product?.name ?? id,
          )
          if (mode === 'production') void productionSave('delete-product', { id })
          return next
        })
      },
      saveCategory: (category) => {
        const duplicate = state.categories.some((entry) => entry.slug === category.slug && entry.id !== category.id)
        if (duplicate) return 'Another category already uses that address.'
        setState((current) => {
          const exists = current.categories.some((entry) => entry.id === category.id)
          const categories = exists
            ? current.categories.map((entry) => (entry.id === category.id ? category : entry))
            : [...current.categories, category]
          return audit({ ...current, categories }, exists ? 'update-category' : 'create-category', category.name)
        })
        if (mode === 'production') void productionSave('category', category)
        return null
      },
      deleteCategory: (id) => {
        const used = state.products.some((product) => product.categoryId === id)
        if (used) return 'Move or delete the products in this category before deleting it.'
        setState((current) =>
          audit(
            { ...current, categories: current.categories.filter((entry) => entry.id !== id) },
            'delete-category',
            id,
          ),
        )
        if (mode === 'production') void productionSave('delete-category', { id })
        return null
      },
      moveCategory: (id, direction) => {
        setState((current) => {
          const ordered = [...current.categories].sort((a, b) => a.sortOrder - b.sortOrder)
          const index = ordered.findIndex((entry) => entry.id === id)
          const target = index + direction
          if (index < 0 || target < 0 || target >= ordered.length) return current
          const swap = ordered[index]
          ordered[index] = ordered[target]
          ordered[target] = swap
          return {
            ...current,
            categories: ordered.map((entry, order) => ({ ...entry, sortOrder: order + 1 })),
          }
        })
      },
      saveBrand: (brand) => {
        const duplicate = state.brands.some((entry) => entry.slug === brand.slug && entry.id !== brand.id)
        if (duplicate) return 'Another brand already uses that link.'
        setState((current) => {
          const exists = current.brands.some((entry) => entry.id === brand.id)
          const brands = exists
            ? current.brands.map((entry) => (entry.id === brand.id ? brand : entry))
            : [...current.brands, brand]
          return audit({ ...current, brands }, exists ? 'update-brand' : 'create-brand', brand.name)
        })
        if (mode === 'production') void productionSave('brand', brand)
        return null
      },
      deleteBrand: (id) => {
        const used = state.products.some((product) => product.brandId === id)
        if (used) return 'Move or delete the products for this brand before deleting it.'
        setState((current) =>
          audit(
            { ...current, brands: current.brands.filter((entry) => entry.id !== id) },
            'delete-brand',
            id,
          ),
        )
        if (mode === 'production') void productionSave('delete-brand', { id })
        return null
      },
      moveBrand: (id, direction) => {
        setState((current) => {
          const ordered = [...current.brands].sort((a, b) => a.sortOrder - b.sortOrder)
          const index = ordered.findIndex((entry) => entry.id === id)
          const target = index + direction
          if (index < 0 || target < 0 || target >= ordered.length) return current
          const swap = ordered[index]
          ordered[index] = ordered[target]
          ordered[target] = swap
          return {
            ...current,
            brands: ordered.map((entry, order) => ({ ...entry, sortOrder: order + 1 })),
          }
        })
      },
      adjustStock: (productId, variantId, delta, reason) => {
        const product = state.products.find((entry) => entry.id === productId)
        if (!product) return 'Product was not found.'
        if (!reason.trim()) return 'Add a reason for the adjustment.'
        const variant = variantId ? product.variants.find((entry) => entry.id === variantId) : product.variants[0]
        const currentStock = variant?.stock ?? product.stock
        const nextStock = currentStock + delta
        if (nextStock < 0) return 'Stock cannot go below zero.'
        setState((current) => {
          const products = current.products.map((entry) => {
            if (entry.id !== productId) return entry
            const variants = entry.variants.map((item) => {
              if (variant && item.id === variant.id) return { ...item, stock: nextStock }
              return item
            })
            const stock = variants.reduce((sum, item) => sum + item.stock, 0)
            return { ...entry, variants, stock }
          })
          const movements = [
            {
              id: uid('mov'),
              at: new Date().toISOString(),
              productId,
              variantId: variant?.id ?? null,
              sku: variant?.sku ?? product.sku,
              delta,
              reason: reason.trim(),
              balanceAfter: nextStock,
            },
            ...current.movements,
          ]
          return audit({ ...current, products, movements }, 'stock-adjust', `${product.name} ${delta > 0 ? '+' : ''}${delta}`)
        })
        if (mode === 'production') void productionAdjustStock(productId, variantId, delta, reason)
        return null
      },
      updateOrder: (orderId, patch) => {
        setState((current) => ({
          ...current,
          orders: current.orders.map((order) => {
            if (order.id !== orderId) return order
            const next = { ...order, ...patch }
            delete (next as { historyNote?: string }).historyNote
            if (patch.historyNote || patch.fulfillmentStatus || patch.paymentStatus) {
              next.history = [
                ...order.history,
                {
                  at: new Date().toISOString(),
                  fulfillment: patch.fulfillmentStatus ?? order.fulfillmentStatus,
                  payment: patch.paymentStatus ?? order.paymentStatus,
                  note: patch.historyNote || 'Status updated.',
                },
              ]
            }
            return next
          }),
        }))
        if (mode === 'production') void productionSave('order', { orderId, patch })
      },
      placeOrder: async (input) => {
        if (!input.lines.length) return 'Your cart is empty.'
        const built: Order['items'] = []
        for (const line of input.lines) {
          const product = state.products.find((entry) => entry.id === line.productId && entry.active)
          if (!product) return 'A product in the cart is no longer available.'
          const variant = findVariant(product, line.variantId)
          const stock = variant?.stock ?? product.stock
          if (line.quantity < 1 || line.quantity > stock) return `${product.name} does not have enough stock.`
          built.push({
            productId: product.id,
            variantId: variant?.id ?? null,
            name: product.name,
            variantLabel: variant?.label ?? 'Standard',
            sku: variant?.sku ?? product.sku,
            pack: product.pack,
            imageUrl: product.imageUrl,
            unitPriceCentavos: unitPrice(product, variant),
            quantity: line.quantity,
          })
        }
        const subtotalCentavos = built.reduce((sum, line) => sum + line.unitPriceCentavos * line.quantity, 0)
        const coupon = state.coupons.find((entry) => entry.code.toLowerCase() === (input.couponCode ?? '').trim().toLowerCase())
        const discountCentavos = couponDiscount(coupon, subtotalCentavos)
        const method = state.shippingMethods.find((entry) => entry.id === input.shippingMethodId && entry.active)
        if (!method) return 'Choose a delivery method.'
        if (input.paymentMethod === 'cod' && !state.settings.codEnabled) return 'Cash on delivery is not available.'
        if (
          (input.paymentMethod === 'gcash' || input.paymentMethod === 'gcash_manual') &&
          !state.settings.gcashEnabled
        ) {
          return 'GCash is not available.'
        }
        if (input.paymentMethod === 'maya_manual' && !state.settings.mayaEnabled) return 'Maya is not available.'
        if (input.paymentMethod === 'qrph_manual' && !state.settings.qrphEnabled) return 'QR Ph is not available.'
        if (input.paymentMethod === 'xendit' && !state.settings.xenditEnabled) return 'Online checkout is not available.'
        if (input.paymentMethod === 'paymongo') return 'PayMongo is not connected.'
        if (mode === 'production' && manualMethodsRequireProof(input.paymentMethod)) {
          if (!input.proofFile) return 'Upload your payment receipt.'
          if (!input.referenceNumber?.trim()) return 'Enter the payment reference number.'
        }
        const shippingCentavos = method.feeCentavos
        const totalCentavos = Math.max(0, subtotalCentavos - discountCentavos + shippingCentavos)
        const orderNumber = `EBW-2026-${state.nextOrderSeq}`
        const paymentStatus = manualMethodsRequireProof(input.paymentMethod) ? 'pending_verification' : 'unpaid'
        if (mode === 'production') {
          try {
            let rpcPaymentMethod = input.paymentMethod
            if (input.paymentMethod === 'xendit') {
              if (state.settings.qrphEnabled) rpcPaymentMethod = 'qrph_manual'
              else if (state.settings.gcashEnabled) rpcPaymentMethod = 'gcash_manual'
              else return 'Enable GCash or QR Ph in settings before using Xendit checkout.'
            }
            const orderId = await productionPlaceOrder({
              customerName: input.customerName,
              email: input.email,
              phone: input.phone,
              address: input.address,
              lines: input.lines,
              couponCode: input.couponCode,
              shippingMethodId: input.shippingMethodId,
              paymentMethod: rpcPaymentMethod,
              notes: input.notes,
              idempotencyKey: uid('idem'),
            })
            if (manualMethodsRequireProof(input.paymentMethod) && input.proofFile) {
              const storagePath = await uploadPaymentProof(input.proofFile, orderId)
              await productionSubmitPaymentProof({
                orderId,
                storagePath,
                referenceNumber: input.referenceNumber?.trim() ?? '',
                fileName: input.proofFile.name,
                mimeType: input.proofFile.type || 'application/octet-stream',
              })
            }
            if (input.paymentMethod === 'xendit' && state.settings.xenditEnabled) {
              const preview = await productionFetchOrderById(orderId)
              const startCheckout = xenditPaymentProvider.createCheckoutSession
              if (preview && startCheckout) {
                const gateway = await startCheckout({
                  orderId,
                  orderNumber: preview.orderNumber,
                  amountCentavos: preview.totalCentavos,
                  currency: 'PHP',
                  customerEmail: input.email,
                  customerName: input.customerName,
                  description: `Order ${preview.orderNumber}`,
                })
                if (gateway.ok && gateway.checkoutUrl) {
                  window.location.assign(gateway.checkoutUrl)
                  return preview
                }
                if (!gateway.ok) return gateway.message
              }
            }
            const next = await loadProductionState(state.settings)
            setState(next)
            const placed = next.orders.find((entry) => entry.id === orderId) ?? (await productionFetchOrderById(orderId))
            if (!placed) return 'Order placed, but details could not be loaded. Check your order history.'
            return placed
          } catch (reason: unknown) {
            return reason instanceof Error ? reason.message : 'Could not place the order.'
          }
        }

        const order: Order = {
          id: uid('ord'),
          orderNumber,
          createdAt: new Date().toISOString(),
          customerId: input.customerId,
          customerName: input.customerName,
          email: input.email,
          phone: input.phone,
          address: input.address,
          items: built,
          subtotalCentavos,
          discountCentavos,
          shippingCentavos,
          totalCentavos,
          couponCode: coupon?.code ?? null,
          shippingMethodId: method.id,
          shippingMethodName: method.name,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          fulfillmentStatus: 'pending',
          notes: input.notes,
          trackingNumber: '',
          proofName: input.proofName,
          latestProofId: null,
          history: [
            {
              at: new Date().toISOString(),
              fulfillment: 'pending',
              payment: paymentStatus,
              note: 'Demonstration order recorded. No real payment was captured.',
            },
          ],
          demo: true,
        }
        setState((current) => {
          const products = current.products.map((product) => {
            const lines = built.filter((line) => line.productId === product.id)
            if (!lines.length) return product
            const variants = product.variants.map((variant) => {
              const taken = lines.filter((line) => line.variantId === variant.id).reduce((sum, line) => sum + line.quantity, 0)
              return { ...variant, stock: Math.max(0, variant.stock - taken) }
            })
            const stock = variants.reduce((sum, variant) => sum + variant.stock, 0)
            return { ...product, variants, stock }
          })
          const movements = [
            ...built.map((line) => ({
              id: uid('mov'),
              at: new Date().toISOString(),
              productId: line.productId,
              variantId: line.variantId,
              sku: line.sku,
              delta: -line.quantity,
              reason: `Reserved for ${orderNumber}`,
              balanceAfter: products.find((product) => product.id === line.productId)?.variants.find((variant) => variant.id === line.variantId)?.stock ?? 0,
            })),
            ...current.movements,
          ]
          return audit(
            { ...current, products, movements, orders: [order, ...current.orders], nextOrderSeq: current.nextOrderSeq + 1 },
            'place-order',
            orderNumber,
            input.customerName,
          )
        })
        return order
      },
      saveSettings: async (settings) => {
        setState((current) => audit({ ...current, settings }, 'settings', 'Store settings updated'))
        if (mode === 'production') await productionSave('settings', settings)
      },
      saveBanner: (banner) => {
        setState((current) => {
          const exists = current.banners.some((entry) => entry.id === banner.id)
          const banners = exists ? current.banners.map((entry) => (entry.id === banner.id ? banner : entry)) : [...current.banners, banner]
          return audit({ ...current, banners }, 'banner', banner.title)
        })
      },
      deleteBanner: (id) => setState((current) => ({ ...current, banners: current.banners.filter((entry) => entry.id !== id) })),
      saveCoupon: (coupon) => {
        setState((current) => {
          const exists = current.coupons.some((entry) => entry.id === coupon.id)
          const coupons = exists ? current.coupons.map((entry) => (entry.id === coupon.id ? coupon : entry)) : [...current.coupons, coupon]
          return { ...current, coupons }
        })
      },
      deleteCoupon: (id) => setState((current) => ({ ...current, coupons: current.coupons.filter((entry) => entry.id !== id) })),
      saveShipping: (method) => {
        setState((current) => ({
          ...current,
          shippingMethods: current.shippingMethods.some((entry) => entry.id === method.id)
            ? current.shippingMethods.map((entry) => (entry.id === method.id ? method : entry))
            : [...current.shippingMethods, method],
        }))
        if (mode === 'production') void productionSave('shipping', method)
      },
      addNewsletter: (email) => {
        setState((current) => ({ ...current, newsletter: current.newsletter.includes(email) ? current.newsletter : [...current.newsletter, email] }))
      },
      registerUser: (user) => {
        if (state.users.some((entry) => entry.email.toLowerCase() === user.email.toLowerCase())) {
          return 'An account with that email already exists.'
        }
        const created: DemoUser = { ...user, id: uid('user'), demo: true }
        setState((current) => ({ ...current, users: [...current.users, created] }))
        return created
      },
      updateUser: (user) => {
        setState((current) => ({ ...current, users: current.users.map((entry) => (entry.id === user.id ? user : entry)) }))
      },
    }
  }, [error, loading, mode, state])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used within StoreProvider')
  return value
}
