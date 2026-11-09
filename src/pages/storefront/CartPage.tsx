import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PackArt } from '@/components/product/ProductCard'
import { cartDetailed } from '@/features/catalog/pricing'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'
import { formatPeso } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'

export function CartPage() {
  const { state } = useStore()
  const { lines, setQty, remove } = useCart()
  const navigate = useNavigate()
  const [voucher, setVoucher] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const detailed = cartDetailed(state, lines).filter((line) => line.quantity > 0)
  const units = detailed.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = detailed.reduce((sum, line) => sum + line.lineCentavos, 0)
  usePageMeta('Shopping Cart · Earth Beauty & Wellness', 'Review demonstration cart items before checkout.')

  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <b>Shopping Cart</b>
        </div>
        <h1 className="page-title" style={{ marginBottom: 26 }}>
          Your Shopping Cart <span className="muted" style={{ font: 'normal 16px Arial' }}>({units} items)</span>
        </h1>
        {detailed.length === 0 ? (
          <div className="whitepanel empty">
            <p>Your cart is empty.</p>
            <Link className="btn" to="/shop" style={{ marginTop: 16 }}>Continue shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="whitepanel">
              <div className="between" style={{ paddingBottom: 10 }}>
                <b>Products</b>
                <span className="muted small">Quantity / Total</span>
              </div>
              {detailed.map((line) => (
                <div className="cartrow" key={`${line.productId}-${line.variantId}`}>
                  <div className="thumb">{line.product.imageUrl ? <img src={line.product.imageUrl} alt="" /> : <PackArt type={line.product.pack} />}</div>
                  <div>
                    <b style={{ fontSize: 13 }}>{line.product.name}</b>
                    <p className="muted small">{line.variant?.label} · {line.stock > 0 ? 'In stock' : 'Out of stock'}</p>
                    <button className="small" style={{ color: 'var(--primary)', background: 'none', border: 0, padding: 0 }} onClick={() => remove(line.productId, line.variantId)}>
                      Remove
                    </button>
                  </div>
                  <b className="unit">{formatPeso(line.unitPriceCentavos)}</b>
                  <div className="stepper">
                    <button aria-label="Decrease" onClick={() => line.quantity <= 1 ? remove(line.productId, line.variantId) : setQty(line.productId, line.variantId, line.quantity - 1)}>−</button>
                    <span>{line.quantity}</span>
                    <button
                      aria-label="Increase"
                      onClick={() => {
                        const error = setQty(line.productId, line.variantId, line.quantity + 1)
                        setNote(error)
                      }}
                    >
                      +
                    </button>
                  </div>
                  <b className="line-total">{formatPeso(line.lineCentavos)}</b>
                </div>
              ))}
              {note ? <p className="form-error">{note}</p> : null}
              <Link to="/shop" style={{ marginTop: 23, color: 'var(--primary)', fontWeight: 700, fontSize: 12, display: 'inline-block' }}>
                ← CONTINUE SHOPPING
              </Link>
            </div>
            <aside className="whitepanel">
              <h2 style={{ marginTop: 0, font: '24px Georgia, serif' }}>Order Summary</h2>
              <div className="line" />
              <div className="between small">
                <span>Subtotal ({units} items)</span>
                <b>{formatPeso(subtotal)}</b>
              </div>
              <div className="between small" style={{ marginTop: 18 }}>
                <span>Shipping</span>
                <span className="muted">Calculated at checkout</span>
              </div>
              <div className="line" />
              <form
                className="row"
                onSubmit={(event) => {
                  event.preventDefault()
                  const coupon = state.coupons.find((entry) => entry.code.toLowerCase() === voucher.trim().toLowerCase() && entry.active)
                  setNote(coupon ? `${coupon.label} will apply at checkout.` : 'That voucher is not active in this preview.')
                  if (coupon) sessionStorage.setItem('ebw-voucher', coupon.code)
                }}
              >
                <input className="field-input" placeholder="Enter voucher code" value={voucher} onChange={(event) => setVoucher(event.target.value)} aria-label="Voucher code" />
                <button className="btn" type="submit">→</button>
              </form>
              <div className="line" />
              <div className="between">
                <b>Total</b>
                <b className="price" style={{ fontSize: 24 }}>{formatPeso(subtotal)}</b>
              </div>
              <p className="muted tiny">Excluding shipping fee, calculated at checkout.</p>
              <button className="btn wide" style={{ marginTop: 25 }} onClick={() => navigate('/checkout')}>
                PROCEED TO CHECKOUT →
              </button>
              <p className="muted tiny" style={{ textAlign: 'center' }}>Secure checkout · Easy order management</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
