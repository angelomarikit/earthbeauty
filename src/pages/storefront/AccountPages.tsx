import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '@/components/branding/BrandLogo'
import { PackArt } from '@/components/product/ProductCard'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'
import { formatDate, formatPeso, fulfillmentClass, fulfillmentLabel } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'
import { PhilippinesAddressFields } from '@/components/forms/PhilippinesAddressFields'
import type { Address } from '@/types'

export function AccountPage() {
  const { user, logout } = useAuth()
  const { state, updateUser } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'profile'
  usePageMeta('My Account · Earth Beauty & Wellness', 'Manage your demonstration account.')
  if (!user) return <Navigate to="/login?next=/account" replace />
  const orders = state.orders.filter((order) => order.email.toLowerCase() === user.email.toLowerCase() || order.customerId === user.id)
  const toShip = orders.filter((order) => order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'processing').length
  const completed = orders.filter((order) => order.fulfillmentStatus === 'delivered').length

  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb"><Link to="/">Home</Link> / <b>My Account</b></div>
        {user.demo ? <div className="notice">Sample account data stays in this browser. It is not a live customer record.</div> : null}
        <div className="account-layout">
          <aside className="whitepanel profile-side">
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 19 }}>
              <div style={{ width: 65, height: 65, borderRadius: '50%', background: 'var(--blush)', color: 'var(--primary)', fontSize: 28, display: 'grid', placeItems: 'center', margin: 'auto' }}>{user.name.slice(0, 1)}</div>
              <h3 style={{ margin: '10px 0 3px' }}>{user.name}</h3>
              <span className="muted tiny">Member since {user.memberSince}</span>
            </div>
            <button className={tab === 'profile' ? 'chosen' : undefined} onClick={() => setParams({})}>My Profile</button>
            <button className={tab === 'orders' ? 'chosen' : undefined} onClick={() => setParams({ tab: 'orders' })}>My Orders</button>
            <button className={tab === 'addresses' ? 'chosen' : undefined} onClick={() => setParams({ tab: 'addresses' })}>Saved Addresses</button>
            <Link className="navbtn" to="/wishlist">My Wishlist</Link>
            <button className={tab === 'settings' ? 'chosen' : undefined} onClick={() => setParams({ tab: 'settings' })}>Account Settings</button>
            <button onClick={() => void logout()}>Log Out</button>
          </aside>
          <section className="whitepanel">
            {tab === 'orders' ? (
              <OrdersTable orders={orders} />
            ) : tab === 'addresses' ? (
              <AddressBook userId={user.id} addresses={user.addresses} onChange={(addresses) => updateUser({ ...user, addresses })} />
            ) : tab === 'settings' ? (
              <ProfileForm user={user} onSave={(next) => updateUser({ ...user, ...next })} />
            ) : (
              <>
                <div className="between">
                  <div>
                    <h2 style={{ font: '27px Georgia, serif', margin: '0 0 6px' }}>My Account</h2>
                    <p className="muted small">Manage your details and check the latest updates on your orders.</p>
                  </div>
                  <button className="btn outline" onClick={() => setParams({ tab: 'settings' })}>EDIT PROFILE</button>
                </div>
                <div className="line" />
                <div className="grid3">
                  <div className="stat"><div className="small muted">All Orders</div><div className="val">{String(orders.length).padStart(2, '0')}</div></div>
                  <div className="stat"><div className="small muted">To Ship</div><div className="val">{String(toShip).padStart(2, '0')}</div></div>
                  <div className="stat"><div className="small muted">Completed</div><div className="val">{String(completed).padStart(2, '0')}</div></div>
                </div>
                <h3 style={{ marginTop: 32 }}>Recent Orders</h3>
                <OrdersTable orders={orders.slice(0, 4)} />
                <div className="between" style={{ marginTop: 29, alignItems: 'flex-start' }}>
                  <div>
                    <b>Saved Delivery Address</b>
                    {user.addresses[0] ? (
                      <p className="muted small" style={{ lineHeight: 1.8 }}>
                        {user.addresses[0].fullName}<br />
                        {user.addresses[0].city}, {user.addresses[0].province}<br />
                        {user.addresses[0].phone}
                      </p>
                    ) : (
                      <p className="muted small">No saved address yet.</p>
                    )}
                  </div>
                  <button className="btn outline" onClick={() => setParams({ tab: 'addresses' })}>MANAGE ADDRESSES</button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function OrdersTable({ orders }: { orders: { id: string; orderNumber: string; createdAt: string; totalCentavos: number; fulfillmentStatus: string }[] }) {
  if (!orders.length) return <div className="empty">No orders yet. Orders placed in this preview will appear here.</div>
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><b>#{order.orderNumber}</b></td>
              <td>{formatDate(order.createdAt)}</td>
              <td>{formatPeso(order.totalCentavos)}</td>
              <td><span className={fulfillmentClass(order.fulfillmentStatus)}>{fulfillmentLabel(order.fulfillmentStatus)}</span></td>
              <td><Link to={`/orders/${order.orderNumber}`} style={{ color: 'var(--primary)' }}>View →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProfileForm({ user, onSave }: { user: { name: string; phone: string; email: string }; onSave: (next: { name: string; phone: string }) => void }) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ name, phone })
      }}
    >
      <h2 style={{ font: '27px Georgia, serif' }}>Account Settings</h2>
      <div className="line" />
      <div className="form-group"><label className="fieldlabel">Name</label><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="form-group"><label className="fieldlabel">Email</label><input className="field-input" value={user.email} disabled /></div>
      <div className="form-group"><label className="fieldlabel">Mobile</label><input className="field-input" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
      <button className="btn" type="submit">SAVE CHANGES</button>
    </form>
  )
}

function AddressBook({ addresses, onChange }: { userId: string; addresses: Address[]; onChange: (addresses: Address[]) => void }) {
  const [draft, setDraft] = useState<Address>({ id: '', label: 'Home', fullName: '', phone: '', street: '', region: '', province: '', city: '', barangay: '', postalCode: '', isDefault: addresses.length === 0 })
  return (
    <div>
      <h2 style={{ font: '27px Georgia, serif' }}>Saved Addresses</h2>
      <div className="line" />
      {addresses.length === 0 ? <p className="muted">No addresses saved yet.</p> : addresses.map((address) => (
        <div key={address.id} className="between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <b>{address.label}</b>
            <p className="muted small">{address.fullName}, {address.street}, {address.barangay}, {address.city}</p>
          </div>
          <button className="text-link" style={{ background: 'none', border: 0 }} onClick={() => onChange(addresses.filter((entry) => entry.id !== address.id))}>Remove</button>
        </div>
      ))}
      <div className="grid2" style={{ marginTop: 18 }}>
        {(['label', 'fullName', 'phone', 'street', 'postalCode'] as const).map((key) => (
          <div className="form-group" key={key}>
            <label className="fieldlabel">{key}</label>
            <input className="field-input" value={draft[key] as string} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
          </div>
        ))}
      </div>
      <PhilippinesAddressFields
        region={draft.region}
        province={draft.province}
        city={draft.city}
        barangay={draft.barangay}
        setValue={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
      />
      <button
        className="btn"
        type="button"
        onClick={() => {
          if (!draft.fullName || !draft.street || !draft.region || !draft.province || !draft.city || !draft.barangay) return
          onChange([...addresses, { ...draft, id: `addr-${Date.now()}` }])
          setDraft({ ...draft, fullName: '', street: '' })
        }}
      >
        SAVE ADDRESS
      </button>
    </div>
  )
}

export function WishlistPage() {
  const { state } = useStore()
  const { saved } = useCart()
  const products = state.products.filter((product) => saved.includes(product.id))
  usePageMeta('Wishlist · Earth Beauty & Wellness', 'Saved demonstration products.')
  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb"><Link to="/">Home</Link> / <b>Wishlist</b></div>
        <h1 className="page-title">My Wishlist</h1>
        <div style={{ height: 18 }} />
        {products.length === 0 ? <div className="whitepanel empty">No saved products yet.</div> : (
          <div className="product-grid">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className="product">
                <div className="pimg"><PackArt type={product.pack} /></div>
                <div className="pbody"><h3>{product.name}</h3><div className="price">{formatPeso(product.priceCentavos)}</div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TrackLookupPage() {
  const [number, setNumber] = useState('EBW-2026-1024')
  const navigate = useNavigate()
  usePageMeta('Track Order · Earth Beauty & Wellness', 'Look up a demonstration order.')
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <h1 className="page-title">Track Your Order</h1>
        <p className="muted" style={{ margin: '10px 0 18px' }}>Enter an order number from this browser preview. Sample number: EBW-2026-1024.</p>
        <form className="row" onSubmit={(event) => { event.preventDefault(); navigate(`/orders/${number.trim()}`) }}>
          <input className="field-input" value={number} onChange={(event) => setNumber(event.target.value)} aria-label="Order number" />
          <button className="btn" type="submit">TRACK</button>
        </form>
      </div>
    </div>
  )
}

export function OrderTrackingPage() {
  const { orderNumber } = useParams()
  const { state } = useStore()
  const { user } = useAuth()
  const order = state.orders.find((entry) => entry.orderNumber === orderNumber)
  usePageMeta(order ? `${order.orderNumber} · Earth Beauty & Wellness` : 'Order', 'Order tracking')
  if (!order) {
    return <div className="page"><div className="wrap empty whitepanel">No order matches that number in this preview.</div></div>
  }
  const owns = !user || user.role === 'admin' || user.email.toLowerCase() === order.email.toLowerCase() || user.id === order.customerId
  if (user && !owns) return <div className="page"><div className="wrap empty whitepanel">This order belongs to another account.</div></div>
  const steps = [
    { key: 'pending', label: 'Order Placed', done: true },
    { key: 'confirmed', label: 'Confirmed', done: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.fulfillmentStatus) },
    { key: 'processing', label: 'Preparing', done: ['processing', 'shipped', 'delivered'].includes(order.fulfillmentStatus) },
    { key: 'delivered', label: 'Delivered', done: order.fulfillmentStatus === 'delivered' },
  ]
  const latest = order.history[order.history.length - 1]
  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb"><Link to="/">Home</Link> / <Link to="/account?tab=orders">My Orders</Link> / <b>Track Order</b></div>
        <div className="section-title">
          <div>
            <div className="eyebrow">SHOP WITH CONFIDENCE</div>
            <h2>Track Your Order</h2>
          </div>
          <Link to="/contact">CONTACT SUPPORT →</Link>
        </div>
        <div className="notice">Timeline reflects demonstration status updates, not a live courier.</div>
        <div className="whitepanel">
          <div className="between">
            <div>
              <div className="eyebrow">ORDER STATUS</div>
              <h2 style={{ font: '27px Georgia, serif', margin: '8px 0' }}>Order #{order.orderNumber}</h2>
              <div className="muted small">Placed on {formatDate(order.createdAt)}</div>
            </div>
            <span className={fulfillmentClass(order.fulfillmentStatus)} style={{ fontSize: 12 }}>{order.fulfillmentStatus === 'processing' ? 'Preparing Your Order' : fulfillmentLabel(order.fulfillmentStatus)}</span>
          </div>
          <div className="line" />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '28px 10px', gap: 8 }}>
            {steps.map((step, index) => (
              <div key={step.key} style={{ display: 'contents' }}>
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <div className="trackcircle" style={step.done ? { background: '#eff8ea', color: '#4FAD0A' } : undefined}>{step.done ? '✓' : index + 1}</div>
                  <b className="small">{step.label}</b>
                </div>
                {index < steps.length - 1 ? <div className="trackline" /> : null}
              </div>
            ))}
          </div>
          <div style={{ background: '#faf5f7', padding: '17px 21px', borderRadius: 8 }}>
            <b>Latest Update:</b> <span className="muted">{latest?.note ?? 'Waiting for a store update.'}</span>
          </div>
        </div>
        <div className="grid2" style={{ marginTop: 22 }}>
          <div className="whitepanel">
            <h3>Items Ordered</h3>
            {order.items.map((item) => (
              <div className="row" key={`${item.productId}-${item.sku}`} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                <div className="thumb" style={{ width: 64, height: 65 }}><PackArt type={item.pack} /></div>
                <div style={{ flex: 1 }}><b className="small">{item.name}</b><div className="muted tiny">Qty: {item.quantity}</div></div>
                <b>{formatPeso(item.unitPriceCentavos * item.quantity)}</b>
              </div>
            ))}
            <div className="between" style={{ marginTop: 20 }}><b>Order Total</b><b className="price">{formatPeso(order.totalCentavos)}</b></div>
          </div>
          <div className="whitepanel">
            <h3 style={{ marginTop: 0 }}>Delivery Details</h3>
            <div className="line" />
            <div className="small muted">RECIPIENT</div>
            <p><b>{order.customerName}</b><br /><span className="small muted">{order.address.street}, {order.address.barangay}, {order.address.city}<br />{order.phone}</span></p>
            <div className="line" />
            <div className="small muted">SHIPPING METHOD</div>
            <p className="small">{order.shippingMethodName}</p>
            <div className="line" />
            <div className="small muted">PAYMENT</div>
            <p className="small">{order.paymentMethod === 'gcash' ? 'GCash — awaiting manual verification' : order.paymentMethod === 'cod' ? 'Cash on delivery — simulated' : order.paymentMethod}</p>
            <div className="line" />
            <div className="small muted">TRACKING NUMBER</div>
            <p className="small">{order.trackingNumber || 'To be assigned by the store'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const { state } = useStore()
  const order = state.orders.find((entry) => entry.orderNumber === orderNumber)
  usePageMeta('Order received · Earth Beauty & Wellness', 'Demonstration order confirmation.')
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="steps"><span className="on">1　Shopping Cart</span><i>—</i><span className="on">2　Checkout</span><i>—</i><span className="on">3　Order Confirmation</span></div>
        <div className="whitepanel">
          <div className="auth-logo"><BrandLogo size="lg" variant="light" /></div>
          <div className="eyebrow">DEMONSTRATION ONLY</div>
          <h1 className="page-title">Order recorded in this preview</h1>
          <p className="muted" style={{ marginTop: 12, lineHeight: 1.7 }}>
            {order ? `${order.orderNumber} is saved in this browser. No payment was captured and the store was not charged.` : 'The order number was not found in this preview.'}
          </p>
          {order ? <p style={{ marginTop: 12 }}>Payment status: <b>{order.paymentStatus === 'pending_verification' ? 'Pending verification' : 'Unpaid'}</b></p> : null}
          <div className="row" style={{ marginTop: 20 }}>
            {order ? <Link className="btn" to={`/orders/${order.orderNumber}`}>VIEW TRACKING</Link> : null}
            <Link className="btn light" to="/shop">CONTINUE SHOPPING</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
