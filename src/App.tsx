import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { CartProvider } from '@/features/cart/CartContext'
import { StoreProvider } from '@/features/store/StoreContext'
import { queryClient } from '@/lib/queryClient'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StorefrontLayout } from '@/layouts/StorefrontLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { BrandsAdminPage, CategoriesAdminPage, InventoryAdminPage, ProductFormPage, ProductsAdminPage } from '@/pages/admin/CatalogPages'
import { CustomersAdminPage, MarketingAdminPage, OrderAdminDetailPage, OrdersAdminPage, ReportsAdminPage, SettingsAdminPage } from '@/pages/admin/OperationsPages'
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/pages/auth/AuthPages'
import { AccountPage, OrderConfirmationPage, OrderTrackingPage, TrackLookupPage, WishlistPage } from '@/pages/storefront/AccountPages'
import { CartPage } from '@/pages/storefront/CartPage'
import { CheckoutPage } from '@/pages/storefront/CheckoutPage'
import { HomePage } from '@/pages/storefront/HomePage'
import { ContactPage, HelpPage, PolicyPage } from '@/pages/storefront/InfoPages'
import { ProductPage } from '@/pages/storefront/ProductPage'
import { ShopPage } from '@/pages/storefront/ShopPage'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="product/:slug" element={<ProductPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="track" element={<TrackLookupPage />} />
                  <Route path="orders/:orderNumber" element={<OrderTrackingPage />} />
                  <Route path="help" element={<HelpPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="policies/:slug" element={<PolicyPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                </Route>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="products" element={<ProductsAdminPage />} />
                  <Route path="products/new" element={<ProductFormPage />} />
                  <Route path="products/:id" element={<ProductFormPage />} />
                  <Route path="categories" element={<CategoriesAdminPage />} />
                  <Route path="brands" element={<BrandsAdminPage />} />
                  <Route path="inventory" element={<InventoryAdminPage />} />
                  <Route path="orders" element={<OrdersAdminPage />} />
                  <Route path="orders/:id" element={<OrderAdminDetailPage />} />
                  <Route path="customers" element={<CustomersAdminPage />} />
                  <Route path="marketing" element={<MarketingAdminPage />} />
                  <Route path="reports" element={<ReportsAdminPage />} />
                  <Route path="settings" element={<SettingsAdminPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </QueryClientProvider>
  )
}
