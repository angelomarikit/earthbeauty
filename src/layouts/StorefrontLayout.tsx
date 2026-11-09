import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CategoryDrawer, MobileBottomNav, SiteFooter, SiteHeader } from '@/components/storefront/SiteChrome'

export function StorefrontLayout() {
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
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav onCategories={() => setCategoriesOpen(true)} />
      <CategoryDrawer open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </>
  )
}
