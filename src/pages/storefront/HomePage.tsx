import { Heart, Sparkles, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductGrid } from '@/components/product/ProductCard'
import { useStore } from '@/features/store/StoreContext'
import { usePageMeta } from '@/lib/seo'

export function HomePage() {
  const { state, loading } = useStore()
  usePageMeta('Earth Beauty & Wellness', 'Everyday beauty and wellness essentials from Santa Rosa, Laguna.')

  const favorites = state.products.filter((product) => product.active && product.featured).slice(0, 4)
  const arrivals = state.products.filter((product) => product.active && product.isNew).slice(0, 4)
  const categories = state.categories.filter((category) => category.active && category.showOnHomepage).sort((a, b) => a.sortOrder - b.sortOrder)

  if (loading) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="skeleton" style={{ height: 365 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="wrap">
        <section className="cover-banner" aria-label="Earth Beauty and Wellness">
          <img
            src="/assets/branding/earth-cover-banner.png"
            alt="Earth Beauty and Wellness cover with the company representative, partner brands, and the slogan Your reliable beauty supplier on Earth."
            width={2048}
            height={758}
          />
        </section>
        <div className="cover-cta">
          <Link className="btn" to="/shop">SHOP NOW</Link>
        </div>

        <section className="section">
          <div className="section-title">
            <div>
              <div className="eyebrow">EXPLORE BY COLLECTION</div>
              <h2>Shop by Category</h2>
            </div>
            <Link to="/shop">DISCOVER ALL →</Link>
          </div>
          <div className="categories">
            {categories.map((category) => (
              <Link
                key={category.id}
                className="cat"
                to={category.slug === 'new-arrivals' ? '/shop?collection=new' : `/shop?category=${category.slug}`}
              >
                <div className="cat-img" style={{ background: category.tint }}>
                  {category.imageUrl ? <img src={category.imageUrl} alt="" /> : category.symbol}
                </div>
                <strong>{category.name}</strong>
                <small>{category.blurb}</small>
              </Link>
            ))}
          </div>
        </section>

        <div className="perks">
          <div className="perk">
            <span className="ico"><Truck size={22} /></span>
            <div>
              <strong>Convenient Delivery</strong>
              <small>Nationwide shipping options</small>
            </div>
          </div>
          <div className="perk">
            <span className="ico"><Sparkles size={22} /></span>
            <div>
              <strong>Thoughtfully Curated</strong>
              <small>Quality products for everyday use</small>
            </div>
          </div>
          <div className="perk">
            <span className="ico"><Heart size={22} /></span>
            <div>
              <strong>Customer Care</strong>
              <small>We are happy to help you</small>
            </div>
          </div>
        </div>

        <section className="section">
          <div className="section-title">
            <div>
              <div className="eyebrow">HANDPICKED FOR YOU</div>
              <h2>Customer Favorites</h2>
            </div>
            <Link to="/shop">VIEW ALL PRODUCTS →</Link>
          </div>
          <ProductGrid products={favorites} />
        </section>

        <section className="campaign">
          <div>
            <div className="kicker">YOUR DAILY SELF-CARE RITUAL</div>
            <h3>A little care goes a long way.</h3>
            <p>Explore essential picks made for your beauty routine.</p>
          </div>
          <Link className="ghost" to="/shop">
            EXPLORE COLLECTION →
          </Link>
        </section>

        <section className="section">
          <div className="section-title">
            <div>
              <div className="eyebrow">FRESH FINDS</div>
              <h2>New Arrivals</h2>
            </div>
            <Link to="/shop?collection=new">VIEW ALL PRODUCTS →</Link>
          </div>
          <ProductGrid products={arrivals} />
        </section>
      </div>
    </div>
  )
}
