import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { comparePrice, unitPrice } from '@/features/catalog/pricing'
import { useCart } from '@/features/cart/CartContext'
import { formatPeso } from '@/lib/format'
import type { PackStyle, Product } from '@/types'

export function PackArt({ type }: { type: PackStyle }) {
  return <span className={`pack ${type === 'bottle' ? 'bottle' : type}`} aria-hidden="true" />
}

export function PriceDisplay({
  price,
  compare,
  size,
}: {
  price: number
  compare?: number | null
  size?: number
}) {
  const showCompare = Boolean(compare && compare > price)
  return (
    <div className="price" style={size ? { fontSize: size } : undefined}>
      {formatPeso(price)}
      {showCompare ? <span className="oldprice" style={size ? { fontSize: Math.round(size / 2) } : undefined}>{formatPeso(compare ?? 0)}</span> : null}
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const { add, saved, toggleSaved } = useCart()
  const [message, setMessage] = useState<string | null>(null)
  const variant = product.variants[0]
  const wished = saved.includes(product.id)

  return (
    <article className="product">
      <div className="pimg">
        <Link to={`/product/${product.slug}`} className="pimg-inner" aria-label={product.name}>
          {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <PackArt type={product.pack} />}
        </Link>
        {product.badge ? <span className="flag">{product.badge}</span> : null}
        <button
          className={`heart ${wished ? 'on' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={() => toggleSaved(product.id)}
        >
          <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button
          className="btn light add-hover"
          onClick={() => {
            const error = add(product.id, variant?.id ?? null, 1)
            setMessage(error ?? 'Added')
            window.setTimeout(() => setMessage(null), 1600)
          }}
        >
          <ShoppingBag size={14} /> {message ?? 'ADD TO CART'}
        </button>
      </div>
      <Link to={`/product/${product.slug}`} className="pbody">
        <div className="brand-label">EARTH BEAUTY & WELLNESS</div>
        <h3>{product.name}</h3>
        <PriceDisplay price={unitPrice(product, variant)} compare={comparePrice(product, variant)} />
        {product.demoSoldLabel ? (
          <div className="rating">
            ★★★★★ <span>{product.demoSoldLabel}</span>
          </div>
        ) : (
          <div className="rating">
            <span>Preview listing</span>
          </div>
        )}
      </Link>
    </article>
  )
}

export function ProductGrid({ products, columns = 4 }: { products: Product[]; columns?: 3 | 4 }) {
  if (!products.length) {
    return <div className="empty whitepanel">No products match these filters.</div>
  }
  return (
    <div className={`product-grid ${columns === 3 ? 'cols-3' : ''}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
