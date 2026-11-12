import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CategoryDrawer, MobileBottomNav, SiteFooter, SiteHeader } from '@/components/storefront/SiteChrome'
import { PageLoading } from '@/components/ui/PageLoading'
import { useStore } from '@/features/store/StoreContext'

export function StorefrontLayout() {
  const { loading, error, mode } = useStore()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    setCategoriesOpen(false)
  }, [location.pathname, location.search])

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="content">
        {loading && mode === 'production' ? (
          <PageLoading message="Loading the store…" />
        ) : error && mode === 'production' ? (
          <div className="page">
            <div className="wrap">
              <div className="whitepanel form-error" style={{ marginTop: 24, padding: 20 }}>
                <b>Could not load the store.</b>
                <p className="small" style={{ marginTop: 8 }}>{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav onCategories={() => setCategoriesOpen(true)} />
      <CategoryDrawer open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </>
  )
}
