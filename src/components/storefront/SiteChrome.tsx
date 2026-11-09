import { Heart, LayoutGrid, MapPin, Search, ShoppingBag, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo, BrandSurface, type BrandLogoSize, type BrandLogoVariant } from '@/components/branding/BrandLogo'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'

export function BrandMark({
  variant = 'auto',
  size = 'lg',
  priority = false,
}: {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  priority?: boolean
}) {
  return (
    <Link to="/" className="brand" aria-label="Earth Beauty & Wellness home">
      <BrandLogo variant={variant} size={size} priority={priority} />
    </Link>
  )
}

function navActive(to: string, pathname: string, search: string) {
  if (to === '/') return pathname === '/'
  const [path, query] = to.split('?')
  if (query) return pathname === path && search === `?${query}`
  if (path === '/shop') return pathname === '/shop' && search === ''
  return pathname === path
}

export function SiteHeader() {
  const { state } = useStore()
  const { count } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const nav = [
    { to: '/', label: 'HOME' },
    { to: '/shop', label: 'SHOP ALL' },
    ...state.categories
      .filter((category) => category.active && category.showInNav)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ to: `/shop?category=${category.slug}`, label: category.name.toUpperCase() })),
    { to: '/shop?collection=best-sellers', label: 'BEST SELLERS' },
    { to: '/shop?collection=sale', label: 'SALE' },
  ]

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/shop?q=${encodeURIComponent(value)}` : '/shop')
  }

  return (
    <>
      <div className="promo">{state.settings.announcement}</div>
      <div className="store-sticky">
        <header className="main-header">
          <div className="wrap">
            <div className="topbar">
              <div className="topbar-left">
                <span className="row" style={{ gap: 6 }}>
                  <Sparkles size={12} /> Authentic beauty & wellness essentials
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <MapPin size={12} /> Santa Rosa, Laguna
                </span>
              </div>
              <div className="topbar-right">
                <Link to="/track">Track Your Order</Link>
                <span>|</span>
                <Link to="/help">Help Center</Link>
                <span>|</span>
                <Link to="/contact">Contact Us</Link>
              </div>
            </div>
            <div className="header-inner">
              <Link to="/" className="brand" aria-label="Earth Beauty & Wellness home">
                <BrandLogo className="logo-desk" variant="light" size="md" symbol priority />
                <BrandLogo className="logo-mob" variant="light" size="sm" symbol priority />
              </Link>
              <form className="search" onSubmit={onSearch} role="search">
                <Search size={16} />
                <input
                  aria-label="Search products"
                  placeholder="Search skincare, wellness, beauty products..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button className="searchbtn" type="submit">
                  SEARCH
                </button>
              </form>
              <div className="head-actions">
                <Link to="/account" className="action">
                  <span className="ico">
                    <UserRound size={22} strokeWidth={1.5} />
                  </span>
                  <span className="label">My Account</span>
                </Link>
                <Link to="/wishlist" className="action">
                  <span className="ico">
                    <Heart size={22} strokeWidth={1.5} />
                  </span>
                  <span className="label">Wishlist</span>
                </Link>
                <Link to="/cart" className="action">
                  <span className="ico">
                    <ShoppingBag size={22} strokeWidth={1.5} />
                  </span>
                  <span className="label">My Cart</span>
                  {count > 0 ? <span className="bubble">{count}</span> : null}
                </Link>
              </div>
            </div>
          </div>
        </header>
        <nav className="nav" aria-label="Primary">
          <div className="wrap">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navActive(item.to, location.pathname, location.search) ? 'active' : undefined}
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/shop" className="right">
              <Sparkles size={12} /> Discover Your Glow
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}

export function SiteFooter() {
  const { state, addNewsletter } = useStore()
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  return (
    <footer className="footer">
      <div className="wrap footgrid">
        <div>
          <BrandSurface tone="dark">
            <BrandMark variant="auto" size="lg" />
          </BrandSurface>
          <p style={{ marginTop: 18 }}>{state.settings.about}</p>
          <p>
            {state.settings.address}
            <br />
            {state.settings.phone}
          </p>
          {state.settings.showPreviewCatalogueNotice ? (
            <p>Preview catalogue — products and prices are demonstration placeholders.</p>
          ) : null}
        </div>
        <div>
          <h4>SHOP</h4>
          <ul>
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to="/shop?category=skincare">Skincare</Link></li>
            <li><Link to="/shop?category=body-care">Body Care</Link></li>
            <li><Link to="/shop?category=wellness">Wellness</Link></li>
            <li><Link to="/shop?collection=best-sellers">Best Sellers</Link></li>
          </ul>
        </div>
        <div>
          <h4>HELP</h4>
          <ul>
            <li><Link to="/track">Track My Order</Link></li>
            <li><Link to="/policies/shipping">Shipping Information</Link></li>
            <li><Link to="/policies/returns">Returns & Refunds</Link></li>
            <li><Link to="/policies/privacy">Privacy Policy</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4>STAY IN THE LOOP</h4>
          <p>Be first to know about product launches and special offers.</p>
          <form
            className="newsletter"
            onSubmit={(event) => {
              event.preventDefault()
              if (!email.includes('@')) {
                setNote('Enter a valid email.')
                return
              }
              addNewsletter(email.trim())
              setNote('Saved in this browser preview.')
              setEmail('')
            }}
          >
            <input
              aria-label="Email address"
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" aria-label="Subscribe">
              →
            </button>
          </form>
          {note ? <p>{note}</p> : null}
        </div>
      </div>
    </footer>
  )
}

export function MobileBottomNav({ onCategories }: { onCategories: () => void }) {
  const location = useLocation()
  const { count } = useCart()
  return (
    <nav className="mobile-bar" aria-label="Mobile">
      <NavLink to="/" className={location.pathname === '/' ? 'active' : undefined}>
        <Sparkles size={18} />
        Home
      </NavLink>
      <button onClick={onCategories} style={{ background: 'none', border: 0, color: '#8e7e85', fontSize: 10 }}>
        <LayoutGrid size={18} style={{ display: 'block', margin: '0 auto 3px' }} />
        Categories
      </button>
      <NavLink to="/shop">
        <Search size={18} />
        Search
      </NavLink>
      <NavLink to="/cart" className={location.pathname === '/cart' ? 'active' : undefined}>
        <ShoppingBag size={18} />
        Cart{count > 0 ? ` (${count})` : ''}
      </NavLink>
      <NavLink to="/account" className={location.pathname.startsWith('/account') ? 'active' : undefined}>
        <UserRound size={18} />
        Account
      </NavLink>
    </nav>
  )
}

export function CategoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore()
  if (!open) return null
  return (
    <>
      <button className="drawer-backdrop" aria-label="Close categories" onClick={onClose} />
      <div className="drawer bottom" role="dialog" aria-label="Categories">
        <div className="between">
          <strong>Categories</strong>
          <button className="text-link" onClick={onClose} style={{ background: 'none', border: 0 }}>
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          {state.categories
            .filter((category) => category.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((category) => (
              <Link key={category.id} to={category.slug === 'new-arrivals' ? '/shop?collection=new' : `/shop?category=${category.slug}`} onClick={onClose} className="sideitem">
                {category.name}
              </Link>
            ))}
        </div>
      </div>
    </>
  )
}
