import { Heart, ShoppingBag, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PackArt, PriceDisplay, ProductGrid } from '@/components/product/ProductCard'
import { availableStock, brandName, comparePrice, unitPrice } from '@/features/catalog/pricing'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'
import { usePageMeta } from '@/lib/seo'
import type { PackStyle } from '@/types'

export function ProductPage() {
  const { slug } = useParams()
  const { state } = useStore()
  const { add, toggleSaved, saved } = useCart()
  const navigate = useNavigate()
  const product = state.products.find((entry) => entry.slug === slug && entry.active)
  const [pack, setPack] = useState<PackStyle | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<'description' | 'use' | 'shipping'>('description')
  const [message, setMessage] = useState<string | null>(null)
  const category = state.categories.find((entry) => entry.id === product?.categoryId)
  const supplierBrand = product ? brandName(state, product.brandId, state.settings.legalName) : state.settings.legalName
  const variant = product?.variants.find((entry) => entry.id === (variantId ?? product.variants[0]?.id)) ?? product?.variants[0]
  const stock = product && variant ? availableStock(product, variant) : 0
  const wished = product ? saved.includes(product.id) : false

  usePageMeta(product ? `${product.name} · ${supplierBrand}` : 'Product', product?.description ?? 'Product')

  const related = useMemo(() => {
    if (!product) return []
    return state.products.filter((entry) => entry.active && entry.categoryId === product.categoryId && entry.id !== product.id).slice(0, 4)
  }, [product, state.products])

  if (!product || !variant) {
    return (
      <div className="page">
        <div className="wrap empty whitepanel">
          <h1 className="page-title">Product unavailable</h1>
          <p className="muted">This demonstration item is inactive or missing.</p>
          <Link className="btn" to="/shop" style={{ marginTop: 16 }}>
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const shownPack = pack ?? product.pack
  const savePercent = variant.compareAtCentavos && variant.compareAtCentavos > unitPrice(product, variant)
    ? Math.round((1 - unitPrice(product, variant) / variant.compareAtCentavos) * 100)
    : 0

  function addLine(buyNow = false) {
    const error = add(product!.id, variant!.id, qty)
    setMessage(error)
    if (!error && buyNow) navigate('/checkout')
    if (!error && !buyNow) setMessage('Added to cart.')
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to={category ? `/shop?category=${category.slug}` : '/shop'}>{category?.name ?? 'Shop'}</Link> / <b>{product.name}</b>
        </div>
        <div className="detail-grid">
          <div>
            <div className={`pimg gallery-main ${product.imageUrl ? 'photo' : ''}`}>
              {product.imageUrl && !pack ? <img src={product.imageUrl} alt={product.name} /> : <PackArt type={shownPack} />}
              {product.badge ? <span className="flag">{product.badge === 'BEST' ? 'BEST SELLER' : product.badge}</span> : null}
            </div>
            <div className="thumbs">
              {(product.imageUrl ? [product.pack, ...product.gallery] : product.gallery).slice(0, 4).map((item) => (
                <button key={item} className={shownPack === item ? 'on' : undefined} onClick={() => setPack(item)} aria-label={`Show ${item} view`}>
                  <div className="pimg">
                    <PackArt type={item} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow">{supplierBrand} · {category?.name.toUpperCase()}</div>
            <h1 style={{ font: 'normal 40px/1.14 Georgia, serif', margin: '16px 0' }}>{product.name}</h1>
            <div className="small muted">SKU {variant.sku}</div>
            {product.demoSoldLabel ? (
              <div style={{ color: '#c38b4c', marginTop: 8 }}>
                ★★★★★ <span className="muted small">4.9 · {product.demoReviewCount} sample reviews · {product.demoSoldLabel}</span>
              </div>
            ) : null}
            <div className="line" />
            <div className="row">
              <PriceDisplay price={unitPrice(product, variant)} compare={comparePrice(product, variant)} size={32} />
              {savePercent > 0 ? <span className="pill selected" style={{ fontSize: 10 }}>SAVE {savePercent}%</span> : null}
            </div>
            <p className="muted" style={{ lineHeight: 1.9, marginTop: 17 }}>{product.description}</p>
            <div className="line" />
            {product.variants.length > 1 ? (
              <div className="form-group">
                <div className="fieldlabel">Size</div>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {product.variants.filter((entry) => entry.active).map((entry) => (
                    <button key={entry.id} className={`pill ${variant.id === entry.id ? 'selected' : ''}`} onClick={() => { setVariantId(entry.id); setQty(1) }}>
                      {entry.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="form-group">
              <div className="fieldlabel">
                Quantity <span className="muted" style={{ fontWeight: 400 }}>({stock} in stock)</span>
              </div>
              <div className="stepper">
                <button aria-label="Decrease quantity" onClick={() => setQty((current) => Math.max(1, current - 1))}>−</button>
                <span>{qty}</span>
                <button aria-label="Increase quantity" onClick={() => setQty((current) => Math.min(stock, current + 1))} disabled={qty >= stock}>+</button>
              </div>
            </div>
            {stock === 0 ? <p className="form-error">This option is out of stock.</p> : null}
            {message ? <p className={message.includes('stock') || message.includes('quantity') ? 'form-error' : 'small'} style={{ color: 'var(--green)' }}>{message}</p> : null}
            <div className="row" style={{ marginTop: 27 }}>
              <button className="btn light" style={{ flex: 1 }} disabled={stock === 0} onClick={() => addLine(false)}>
                <ShoppingBag size={14} /> ADD TO CART
              </button>
              <button className="btn" style={{ flex: 1 }} disabled={stock === 0} onClick={() => addLine(true)}>
                BUY NOW →
              </button>
              <button className={`pill ${wished ? 'selected' : ''}`} style={{ padding: 14 }} aria-label="Wishlist" onClick={() => toggleSaved(product.id)}>
                <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="perks" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 28 }}>
              <div className="perk" style={{ padding: 16 }}>
                <span className="ico"><Truck size={20} /></span>
                <div>
                  <strong>Shipping Available</strong>
                  <small>Rates shown at checkout</small>
                </div>
              </div>
              <div className="perk" style={{ padding: 16 }}>
                <span className="ico"><Heart size={20} /></span>
                <div>
                  <strong>Customer Support</strong>
                  <small>Questions? We're here.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="section">
          <div className="whitepanel">
            <div className="tabs">
              <button className={tab === 'description' ? 'on' : undefined} onClick={() => setTab('description')}>Product Description</button>
              <button className={tab === 'use' ? 'on' : undefined} onClick={() => setTab('use')}>How to Use</button>
              <button className={tab === 'shipping' ? 'on' : undefined} onClick={() => setTab('shipping')}>Shipping & Returns</button>
            </div>
            <div className="line" style={{ marginTop: 0 }} />
            <p style={{ lineHeight: 2, color: '#75696f' }}>
              {tab === 'description' ? product.description : tab === 'use' ? product.howToUse : product.shippingNote}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <div>
              <div className="eyebrow">YOU MAY ALSO LOVE</div>
              <h2>Similar Products</h2>
            </div>
            <Link to="/shop">VIEW ALL PRODUCTS →</Link>
          </div>
          <ProductGrid products={related} />
        </section>
      </div>
    </div>
  )
}
