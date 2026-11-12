//admin qwe
import {
  BarChart3,
  Bell,
  Boxes,
  Tags,
  ExternalLink,
  Flag,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Warehouse,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/branding/BrandLogo'
import { useAuth } from '@/features/auth/AuthContext'
import { useStore } from '@/features/store/StoreContext'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Boxes },
  { to: '/admin/brands', label: 'Brands', icon: Tags },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/marketing', label: 'Promotions', icon: Sparkles },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export function AdminSidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { logout } = useAuth()
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link to="/admin" className="brand" aria-label="Earth Beauty admin">
        <BrandLogo variant="light" size="lg" priority />
      </Link>
      <div className="sidelabel">WORKSPACE</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `sideitem ${isActive ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}
      <div className="sidelabel">CONFIGURATION</div>
      <NavLink to="/admin/settings" className={({ isActive }) => `sideitem ${isActive ? 'active' : ''}`} onClick={onNavigate}>
        <Settings size={16} /> Store Settings
      </NavLink>
      <Link to="/" className="sideitem" onClick={onNavigate}>
        <ExternalLink size={16} /> View Storefront
      </Link>
      <button
        className="sideitem"
        onClick={() => {
          void logout()
          onNavigate()
        }}
      >
        <LogOut size={16} /> Logout
      </button>
      <div className="side-foot">Earth Beauty Admin · v1.0</div>
    </aside>
  )
}

export function AdminTopbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { user } = useAuth()
  const { state } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<'notes' | 'account' | null>(null)
  const low = state.products.filter((product) => product.active && product.stock <= state.settings.lowStockThreshold)
  const initials = user?.name === 'Store Administrator'
    ? 'AM'
    : (user?.name ?? 'Admin')
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()

  return (
    <div className="admin-head">
      <div className="row">
        <button className="icon-btn admin-menu-btn" aria-label="Open menu" onClick={onMenu}>
          <Menu size={18} />
        </button>
        <div style={{ fontSize: 12, color: '#8b7e84' }}>
          Home / <b style={{ color: 'var(--ink)' }}>{title}</b>
        </div>
      </div>
      <div className="row">
        <form
          className="pill admin-search"
          onSubmit={(event) => {
            event.preventDefault()
            navigate(`/admin/orders?q=${encodeURIComponent(query.trim())}`)
          }}
        >
          <Search size={14} />
          <input
            aria-label="Search orders and customers"
            placeholder="Search orders, customers..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ border: 0, outline: 'none', background: 'transparent', width: '100%' }}
          />
        </form>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen(open === 'notes' ? null : 'notes')}>
            <Bell size={18} />
            {low.length ? <span className="dot-alert" /> : null}
          </button>
          {open === 'notes' ? (
            <div className="menu-pop">
              <div className="tiny muted" style={{ padding: '8px 12px' }}>
                Demonstration notices
              </div>
              <div style={{ padding: '8px 12px', fontSize: 12 }}>
                <Flag size={12} /> {low.length} products are at or below the sample low-stock threshold.
              </div>
            </div>
          ) : null}
        </div>
        <button className="row" style={{ background: 'none', border: 0 }} onClick={() => setOpen(open === 'account' ? null : 'account')}>
          <span className="avatar">{initials || 'AM'}</span>
          <b className="small">{user?.role === 'admin' ? 'Store Administrator' : user?.name}</b>
        </button>
        {open === 'account' ? (
          <div className="menu-pop" style={{ top: 56 }}>
            <Link to="/admin/settings" onClick={() => setOpen(null)}>
              Store settings
            </Link>
            <Link to="/" onClick={() => setOpen(null)}>
              View storefront
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
