import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AdminSidebar, AdminTopbar } from '@/components/admin/AdminChrome'
import { PageLoading } from '@/components/ui/PageLoading'
import { useAuth } from '@/features/auth/AuthContext'
import { useStore } from '@/features/store/StoreContext'

const titles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/products/new': 'Add Product',
  '/admin/categories': 'Categories',
  '/admin/brands': 'Brands',
  '/admin/inventory': 'Inventory',
  '/admin/customers': 'Customers',
  '/admin/marketing': 'Promotions',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Store Settings',
}

export function AdminLayout() {
  const { user } = useAuth()
  const { loading, error, mode } = useStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  if (!user) return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== 'admin') return <Navigate to="/admin/login" replace />
  const title = titles[location.pathname] ?? (location.pathname.includes('/orders/') ? 'Order' : location.pathname.includes('/products/') ? 'Edit Product' : 'Admin')

  return (
    <div className="admin">
      <AdminSidebar open={open} onNavigate={() => setOpen(false)} />
      {open ? <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <div className="admin-main">
        <AdminTopbar title={title} onMenu={() => setOpen(true)} />
        <div className="admin-content">
          {loading && mode === 'production' ? (
            <PageLoading message="Loading your dashboard…" admin />
          ) : error && mode === 'production' ? (
            <div className="whitepanel form-error" style={{ padding: 20 }}>
              <b>Could not load store data.</b>
              <p className="small" style={{ marginTop: 8 }}>{error}</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  )
}
