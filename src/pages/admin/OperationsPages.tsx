import { AdminConfirmModal } from '@/components/admin/AdminModal'
import { PaymentSettingsCards } from '@/components/admin/PaymentSettingsCards'
import { PolicySettingsEditor } from '@/components/admin/PolicySettingsEditor'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts'
import { sampleSales } from '@/data/demo/dashboard'
import { lastSevenDaySales, paidOrders } from '@/features/admin/dashboardMetrics'
import { useStore } from '@/features/store/StoreContext'
import { productionFetchOrderProofs, productionMarkCodCollected, productionVerifyPayment } from '@/services/productionStore'
import { signedProofUrl } from '@/services/storageUpload'
import { formatDate, formatPeso, fulfillmentClass, fulfillmentLabel, paymentClass, paymentLabel, uid } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import type { Banner, Coupon, FulfillmentStatus, PaymentProof, PaymentStatus, StoreSettings } from '@/types'

const fulfillmentOptions: FulfillmentStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentOptions: PaymentStatus[] = ['unpaid', 'pending_verification', 'paid', 'failed', 'refunded']

export function OrdersAdminPage() {
  const { state, mode } = useStore()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').toLowerCase()
  const status = params.get('status') ?? 'all'
  const orders = state.orders.filter((order) => {
    const text = `${order.orderNumber} ${order.customerName} ${order.email}`.toLowerCase()
    if (q && !text.includes(q)) return false
    if (status !== 'all' && order.fulfillmentStatus !== status) return false
    return true
  })
  return (
    <>
      <div className="eyebrow">ORDERS</div>
      <h1 style={{ font: '31px Georgia, serif' }}>Orders</h1>
      <p className="muted small">
        {mode === 'production'
          ? 'Payment verification and fulfillment are tracked separately.'
          : 'Payment status stays separate from fulfillment. These are demonstration records.'}
      </p>
      <div className="row" style={{ margin: '16px 0' }}>
        <input className="field-input" style={{ maxWidth: 280 }} placeholder="Search orders" value={params.get('q') ?? ''} onChange={(event) => {
          const next = new URLSearchParams(params)
          if (event.target.value) next.set('q', event.target.value)
          else next.delete('q')
          setParams(next)
        }} />
        <select className="field-input" style={{ maxWidth: 200 }} value={status} onChange={(event) => {
          const next = new URLSearchParams(params)
          if (event.target.value === 'all') next.delete('status')
          else next.set('status', event.target.value)
          setParams(next)
        }}>
          <option value="all">All fulfillment</option>
          {fulfillmentOptions.map((option) => <option key={option} value={option}>{fulfillmentLabel(option)}</option>)}
        </select>
      </div>
      <div className="whitepanel" style={{ padding: 0 }}>
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th></th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><b>#{order.orderNumber}</b></td>
                <td>{order.customerName}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatPeso(order.totalCentavos)}</td>
                <td><span className={paymentClass(order.paymentStatus)}>{paymentLabel(order.paymentStatus)}</span></td>
                <td><span className={fulfillmentClass(order.fulfillmentStatus)}>{fulfillmentLabel(order.fulfillmentStatus)}</span></td>
                <td><Link className="btn-action" to={`/admin/orders/${order.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function OrderAdminDetailPage() {
  const { id } = useParams()
  const { state, updateOrder, mode, refreshState } = useStore()
  const order = state.orders.find((entry) => entry.id === id)
  const [tracking, setTracking] = useState(order?.trackingNumber ?? '')
  const [notes, setNotes] = useState(order?.notes ?? '')
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTracking(order?.trackingNumber ?? '')
    setNotes(order?.notes ?? '')
  }, [order?.id, order?.notes, order?.trackingNumber])

  useEffect(() => {
    if (!order || mode !== 'production') return
    let cancelled = false
    void productionFetchOrderProofs(order.id).then(async (rows) => {
      if (cancelled) return
      setProofs(rows)
      const latest = rows[0]
      if (latest?.storagePath) {
        const url = await signedProofUrl(latest.storagePath)
        if (!cancelled) setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [mode, order])

  async function runPaymentAction(action: 'approve' | 'reject' | 'cod') {
    if (!order) return
    setBusy(true)
    setActionError(null)
    try {
      if (action === 'cod') {
        await productionMarkCodCollected(order.id)
      } else {
        const proof = proofs[0]
        if (!proof) throw new Error('No payment proof on file.')
        await productionVerifyPayment({
          orderId: order.id,
          proofId: proof.id,
          decision: action === 'approve' ? 'approve' : 'reject',
          adminNotes: action === 'approve' ? 'Payment approved.' : 'Payment rejected.',
        })
      }
      await refreshState()
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!order) return <div className="whitepanel">Order not found.</div>
  return (
    <>
      <div className="eyebrow">ORDER</div>
      <h1 style={{ font: '31px Georgia, serif' }}>#{order.orderNumber}</h1>
      {mode === 'demo' ? (
        <div className="notice">Demonstration order. Do not treat the payment state as money received by the business.</div>
      ) : null}
      <div className="grid2">
        <div className="whitepanel">
          <h3>Customer</h3>
          <p>{order.customerName}<br />{order.email}<br />{order.phone}</p>
          <p className="muted small" style={{ marginTop: 8 }}>{order.address.street}, {order.address.barangay}, {order.address.city}, {order.address.province}, {order.address.postalCode}</p>
          <div className="line" />
          {order.items.map((item) => (
            <div key={item.sku} className="between" style={{ padding: '8px 0' }}>
              <span>{item.name} · {item.variantLabel} × {item.quantity}</span>
              <b>{formatPeso(item.unitPriceCentavos * item.quantity)}</b>
            </div>
          ))}
          <div className="between"><span>Total</span><b>{formatPeso(order.totalCentavos)}</b></div>
          <p className="small" style={{ marginTop: 8 }}>
            Payment method: <b>{paymentMethodLabel(order.paymentMethod)}</b> ·{' '}
            <span className={paymentClass(order.paymentStatus)}>{paymentLabel(order.paymentStatus)}</span>
          </p>
          {mode === 'production' && proofs.length ? (
            <div style={{ marginTop: 12 }}>
              <p className="small">Latest proof: {proofs[0].fileName} · ref {proofs[0].referenceNumber || '—'}</p>
              {previewUrl ? <img src={previewUrl} alt="Payment proof" style={{ maxWidth: '100%', marginTop: 8, borderRadius: 8 }} /> : null}
            </div>
          ) : order.proofName ? (
            <p className="small">Proof file name: {order.proofName}</p>
          ) : (
            <p className="muted small">No proof of payment attached.</p>
          )}
        </div>
        <div className="whitepanel">
          {actionError ? <div className="form-error" style={{ marginBottom: 12 }}>{actionError}</div> : null}
          {mode === 'production' && order.paymentMethod !== 'cod' && order.paymentStatus === 'pending_verification' && proofs.length ? (
            <div className="row" style={{ marginBottom: 16, gap: 8 }}>
              <button type="button" className="btn" disabled={busy} onClick={() => void runPaymentAction('approve')}>APPROVE PAYMENT</button>
              <button type="button" className="btn outline" disabled={busy} onClick={() => void runPaymentAction('reject')}>REJECT</button>
            </div>
          ) : null}
          {mode === 'production' && order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? (
            <button type="button" className="btn" style={{ marginBottom: 16 }} disabled={busy} onClick={() => void runPaymentAction('cod')}>
              MARK COD COLLECTED
            </button>
          ) : null}
          <label className="fieldlabel">Fulfillment</label>
          <select className="field-input" value={order.fulfillmentStatus} onChange={(event) => updateOrder(order.id, { fulfillmentStatus: event.target.value as FulfillmentStatus, historyNote: 'Fulfillment updated.' })}>
            {fulfillmentOptions.map((option) => <option key={option} value={option}>{fulfillmentLabel(option)}</option>)}
          </select>
          {mode === 'demo' ? (
            <>
              <label className="fieldlabel" style={{ marginTop: 14 }}>Payment status</label>
              <select className="field-input" value={order.paymentStatus} onChange={(event) => updateOrder(order.id, { paymentStatus: event.target.value as PaymentStatus, historyNote: 'Payment status updated by an administrator.' })}>
                {paymentOptions.map((option) => <option key={option} value={option}>{paymentLabel(option)}</option>)}
              </select>
            </>
          ) : (
            <p className="muted small" style={{ marginTop: 14 }}>
              Payment status is updated via proof verification or COD collection, not manual edits.
            </p>
          )}
          <label className="fieldlabel" style={{ marginTop: 14 }}>Tracking number</label>
          <input className="field-input" value={tracking} onChange={(event) => setTracking(event.target.value)} />
          <label className="fieldlabel" style={{ marginTop: 14 }}>Order notes</label>
          <textarea className="field-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} onClick={() => updateOrder(order.id, { trackingNumber: tracking, notes, historyNote: 'Tracking or notes updated.' })}>SAVE FULFILLMENT</button>
          <div className="line" />
          <h3>Status history</h3>
          {order.history.map((event, index) => (
            <p key={`${event.at}-${index}`} className="small muted">{formatDate(event.at)} · {fulfillmentLabel(event.fulfillment)} · {paymentLabel(event.payment)} · {event.note}</p>
          ))}
        </div>
      </div>
    </>
  )
}

export function CustomersAdminPage() {
  const { state } = useStore()
  const rows = useMemo(() => {
    return state.users
      .filter((user) => user.role === 'customer')
      .map((user) => {
        const orders = state.orders.filter((order) => order.customerId === user.id || order.email.toLowerCase() === user.email.toLowerCase())
        return { user, orders: orders.length, spend: orders.reduce((sum, order) => sum + order.totalCentavos, 0) }
      })
  }, [state.orders, state.users])
  return (
    <>
      <div className="eyebrow">CUSTOMERS</div>
      <h1 style={{ font: '31px Georgia, serif' }}>Customers</h1>
      <p className="muted small">Demonstration profiles only. Do not treat spend as real revenue.</p>
      <div className="whitepanel" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Sample spend</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user.id}>
                <td>{row.user.name}</td>
                <td>{row.user.email}</td>
                <td>{row.user.phone}</td>
                <td>{row.orders}</td>
                <td>{formatPeso(row.spend)}</td>
                <td><span className="status">Demo account</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function MarketingAdminPage() {
  const { state, saveBanner, deleteBanner, saveCoupon, deleteCoupon, saveProduct } = useStore()
  const [pendingDeleteBanner, setPendingDeleteBanner] = useState<Banner | null>(null)
  const [pendingDeleteCoupon, setPendingDeleteCoupon] = useState<Coupon | null>(null)
  return (
    <>
      <div className="eyebrow">PROMOTIONS</div>
      <h1 style={{ font: '31px Georgia, serif' }}>Marketing</h1>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="whitepanel">
          <div className="between"><h3>Homepage banners</h3><button type="button" className="btn outline compact" onClick={() => saveBanner(blankBanner(state.banners.length + 1))}>＋ Add banner</button></div>
          {state.banners.sort((a, b) => a.sortOrder - b.sortOrder).map((banner) => (
            <div key={banner.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <input className="field-input" value={banner.title} onChange={(event) => saveBanner({ ...banner, title: event.target.value })} />
              <input className="field-input" style={{ marginTop: 8 }} value={banner.subtitle} onChange={(event) => saveBanner({ ...banner, subtitle: event.target.value })} />
              <input className="field-input" style={{ marginTop: 8 }} value={banner.buttonLabel} onChange={(event) => saveBanner({ ...banner, buttonLabel: event.target.value })} />
              <input className="field-input" style={{ marginTop: 8 }} value={banner.href} onChange={(event) => saveBanner({ ...banner, href: event.target.value })} />
              <label className="checkline"><input type="checkbox" checked={banner.active} onChange={(event) => saveBanner({ ...banner, active: event.target.checked })} /> Active</label>
              <button type="button" className="btn-action danger" onClick={() => setPendingDeleteBanner(banner)}>Remove</button>
            </div>
          ))}
        </div>
        <div>
          <div className="whitepanel">
            <div className="between"><h3>Coupon codes</h3><button type="button" className="btn outline compact" onClick={() => saveCoupon(blankCoupon())}>＋ Add coupon</button></div>
            {state.coupons.map((coupon) => (
              <div key={coupon.id} className="between" style={{ marginTop: 10 }}>
                <input className="field-input" value={coupon.code} onChange={(event) => saveCoupon({ ...coupon, code: event.target.value.toUpperCase() })} />
                <label className="checkline"><input type="checkbox" checked={coupon.active} onChange={(event) => saveCoupon({ ...coupon, active: event.target.checked })} /> Active</label>
                <button type="button" className="btn-action danger" onClick={() => setPendingDeleteCoupon(coupon)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="whitepanel" style={{ marginTop: 16 }}>
            <h3>Featured products</h3>
            {state.products.slice(0, 8).map((product) => (
              <label key={product.id} className="checkline">
                <input type="checkbox" checked={product.featured} onChange={(event) => saveProduct({ ...product, featured: event.target.checked })} /> {product.name}
              </label>
            ))}
          </div>
        </div>
      </div>
      <AdminConfirmModal
        open={Boolean(pendingDeleteBanner)}
        title={pendingDeleteBanner ? `Remove banner “${pendingDeleteBanner.title}”?` : 'Remove banner?'}
        description="This removes the banner from the homepage rotation."
        confirmLabel="REMOVE"
        danger
        onClose={() => setPendingDeleteBanner(null)}
        onConfirm={() => {
          if (pendingDeleteBanner) deleteBanner(pendingDeleteBanner.id)
        }}
      />
      <AdminConfirmModal
        open={Boolean(pendingDeleteCoupon)}
        title={pendingDeleteCoupon ? `Remove coupon ${pendingDeleteCoupon.code}?` : 'Remove coupon?'}
        description="Shoppers will no longer be able to use this code."
        confirmLabel="REMOVE"
        danger
        onClose={() => setPendingDeleteCoupon(null)}
        onConfirm={() => {
          if (pendingDeleteCoupon) deleteCoupon(pendingDeleteCoupon.id)
        }}
      />
    </>
  )
}

function blankBanner(order: number): Banner {
  return { id: uid('ban'), eyebrow: 'NEW', title: 'New banner', subtitle: 'Demonstration banner', buttonLabel: 'SHOP NOW', href: '/shop', active: false, sortOrder: order, imageNote: 'No uploaded artwork yet.' }
}

function blankCoupon(): Coupon {
  return { id: uid('cp'), code: 'NEWCODE', type: 'percent', amount: 10, active: false, minSubtotalCentavos: 0, label: 'Demonstration voucher' }
}

export function ReportsAdminPage() {
  const { state, mode } = useStore()
  const [from, setFrom] = useState('2026-10-01')
  const [to, setTo] = useState('2026-11-30')
  const orders = state.orders.filter((order) => order.createdAt.slice(0, 10) >= from && order.createdAt.slice(0, 10) <= to)
  const paidInRange = paidOrders(orders)
  const chartData =
    mode === 'production'
      ? lastSevenDaySales(state.orders).map((point) => ({ day: point.day, amount: point.amount, bar: Number.parseInt(point.bar, 10) || 0 }))
      : sampleSales
  const byStatus = fulfillmentOptions.map((status) => ({ status, count: orders.filter((order) => order.fulfillmentStatus === status).length }))
  function exportCsv() {
    const header = 'order,date,customer,total_centavos,payment,fulfillment,demo'
    const body = orders.map((order) => [order.orderNumber, order.createdAt, order.customerName, order.totalCentavos, order.paymentStatus, order.fulfillmentStatus, 'yes'].join(','))
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = mode === 'production' ? 'earth-beauty-orders.csv' : 'earth-beauty-demo-orders.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <div className="between">
        <div>
          <div className="eyebrow">REPORTS</div>
          <h1 style={{ font: '31px Georgia, serif' }}>Reports</h1>
        </div>
        <button className="btn outline" onClick={exportCsv}>EXPORT CSV</button>
      </div>
      {mode === 'demo' ? (
        <div className="notice">These rows are fictional demonstration orders. They are not Earth Beauty & Wellness revenue.</div>
      ) : null}
      <div className="row">
        <input className="field-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className="field-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="whitepanel">
          <h3>{mode === 'production' ? 'Paid revenue (last 7 days)' : 'Sample weekly shape'}</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <Bar dataKey="amount" fill="#F20A87" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="whitepanel">
          <h3>Orders by status in range</h3>
          {byStatus.map((row) => <div key={row.status} className="between" style={{ padding: '8px 0' }}><span>{fulfillmentLabel(row.status)}</span><b>{row.count}</b></div>)}
          <div className="line" />
          <div className="between">
            <span>{mode === 'production' ? 'Paid total in range' : 'Preview total'}</span>
            <b>{formatPeso((mode === 'production' ? paidInRange : orders).reduce((sum, order) => sum + order.totalCentavos, 0))}</b>
          </div>
        </div>
      </div>
      <div className="whitepanel" style={{ marginTop: 16 }}>
        <h3>Inventory summary</h3>
        <p className="muted small">{state.products.filter((product) => product.stock <= state.settings.lowStockThreshold).length} products are at or below {state.settings.lowStockThreshold} units.</p>
      </div>
    </>
  )
}

export function SettingsAdminPage() {
  const { state, saveSettings, saveShipping, resetDemo, mode } = useStore()
  const [form, setForm] = useState<StoreSettings>(state.settings)
  const [resetOpen, setResetOpen] = useState(false)
  useEffect(() => {
    setForm(state.settings)
  }, [state.settings])
  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  return (
    <>
      <div className="eyebrow">CONFIGURATION</div>
      <h1 style={{ font: '31px Georgia, serif' }}>Store Settings</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          saveSettings(form)
        }}
      >
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="whitepanel">
            <h3>Store identity</h3>
            <Field label="Business name"><input className="field-input" value={form.businessName} onChange={(event) => set('businessName', event.target.value)} /></Field>
            <Field label="Legal name"><input className="field-input" value={form.legalName} onChange={(event) => set('legalName', event.target.value)} /></Field>
            <Field label="Address"><textarea className="field-input" value={form.address} onChange={(event) => set('address', event.target.value)} /></Field>
            <Field label="Phone"><input className="field-input" value={form.phone} onChange={(event) => set('phone', event.target.value)} /></Field>
            <Field label="Announcement"><input className="field-input" value={form.announcement} onChange={(event) => set('announcement', event.target.value)} /></Field>
            <Field label="About"><textarea className="field-input" value={form.about} onChange={(event) => set('about', event.target.value)} /></Field>
            <label className="checkline" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.showPreviewCatalogueNotice}
                onChange={(event) => set('showPreviewCatalogueNotice', event.target.checked)}
              />
              Show preview catalogue notice in storefront footer
            </label>
            <p className="muted small" style={{ marginTop: 6 }}>
              Turn this off after real products and prices are live so shoppers no longer see the demonstration disclaimer.
            </p>
          </div>
          <div className="whitepanel">
            <h3>Social links</h3>
            <Field label="Instagram"><input className="field-input" value={form.instagram} onChange={(event) => set('instagram', event.target.value)} placeholder="https://instagram.com/…" /></Field>
            <Field label="Facebook"><input className="field-input" value={form.facebook} onChange={(event) => set('facebook', event.target.value)} placeholder="https://facebook.com/…" /></Field>
            <Field label="TikTok"><input className="field-input" value={form.tiktok} onChange={(event) => set('tiktok', event.target.value)} placeholder="https://tiktok.com/@…" /></Field>
            <Field label="Low stock threshold"><input className="field-input" type="number" min={0} value={form.lowStockThreshold} onChange={(event) => set('lowStockThreshold', Number(event.target.value))} /></Field>
          </div>
        </div>
        <div className="whitepanel" style={{ marginTop: 16 }}>
          <div className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Payment methods</h3>
              <div className="eyebrow" style={{ marginTop: 6 }}>CHECKOUT</div>
            </div>
          </div>
          <PaymentSettingsCards form={form} set={set} />
        </div>
        <div className="whitepanel" style={{ marginTop: 16 }}>
          <div className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Store policies</h3>
              <div className="eyebrow" style={{ marginTop: 6 }}>LEGAL &amp; HELP</div>
            </div>
          </div>
          <PolicySettingsEditor policies={form.policies} onChange={(policies) => set('policies', policies)} />
        </div>
        <button className="btn" style={{ marginTop: 16 }} type="submit">SAVE SETTINGS</button>
      </form>
      <div className="whitepanel" style={{ marginTop: 16 }}>
        <h3>Shipping methods</h3>
        {state.shippingMethods.map((method) => (
          <div key={method.id} className="grid3" style={{ marginTop: 10 }}>
            <input className="field-input" value={method.name} onChange={(event) => saveShipping({ ...method, name: event.target.value })} />
            <input className="field-input" type="number" value={method.feeCentavos / 100} onChange={(event) => saveShipping({ ...method, feeCentavos: Math.round(Number(event.target.value) * 100) })} />
            <label className="checkline"><input type="checkbox" checked={method.active} onChange={(event) => saveShipping({ ...method, active: event.target.checked })} /> Active</label>
          </div>
        ))}
      </div>
      {mode === 'demo' ? (
        <button type="button" className="btn outline" style={{ marginTop: 16 }} onClick={() => setResetOpen(true)}>
          RESET DEMONSTRATION DATA
        </button>
      ) : null}
      <AdminConfirmModal
        open={resetOpen}
        title="Reset demonstration data?"
        description="This reloads the sample catalogue, orders, and settings in this browser. This cannot be undone."
        confirmLabel="RESET"
        danger
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetDemo()}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="form-group"><label className="fieldlabel">{label}</label>{children}</div>
}
