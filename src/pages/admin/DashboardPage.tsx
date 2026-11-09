import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flag, PhilippinePeso, ShoppingBag, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sampleKpis, sampleOrderStatus, sampleSales } from '@/data/demo/dashboard'
import { useStore } from '@/features/store/StoreContext'
import { formatPeso, formatShortDate, fulfillmentClass, fulfillmentLabel } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'

export function DashboardPage() {
  const { state } = useStore()
  const low = state.products.filter((product) => product.active && product.stock <= state.settings.lowStockThreshold).length
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', state.nextOrderSeq, state.orders.length],
    queryFn: async () => state.orders,
    initialData: state.orders,
  })
  const recent = [...ordersQuery.data].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4)
  usePageMeta('Dashboard · Earth Beauty Admin', 'Demonstration store overview.')

  return (
    <>
      <div className="between" style={{ marginBottom: 27, alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">STORE PERFORMANCE</div>
          <h1 style={{ font: '31px Georgia, serif', margin: '8px 0' }}>Dashboard Overview</h1>
          <p className="muted small">Welcome back. Here is what is happening at your store.</p>
        </div>
        <Link className="btn" to="/admin/products/new">＋ ADD NEW PRODUCT</Link>
      </div>
      <div className="kpi-grid">
        <Kpi label="Total Sales" value={formatPeso(sampleKpis.totalSalesCentavos)} note={sampleKpis.salesNote} icon={<PhilippinePeso size={20} />} />
        <Kpi label="Total Orders" value={String(sampleKpis.totalOrders)} note={sampleKpis.ordersNote} icon={<ShoppingBag size={20} />} />
        <Kpi label="Pending Orders" value={String(sampleKpis.pendingOrders)} note={sampleKpis.pendingNote} icon={<Timer size={20} />} />
        <Kpi label="Low Stock Items" value={String(low).padStart(2, '0')} note={sampleKpis.lowStockNote} icon={<Flag size={20} />} />
      </div>
      <div className="dash-charts">
        <div className="whitepanel sales-panel">
          <div className="between">
            <div>
              <h3 style={{ margin: 0 }}>Sales Overview</h3>
              <p className="muted tiny">Sample revenue data · Last 7 days</p>
            </div>
            <span className="pill">This Week ⌄</span>
          </div>
          <div className="sales-bars" aria-hidden="true">
            {sampleSales.map((point) => (
              <i key={point.day} style={{ height: point.bar }} />
            ))}
          </div>
          <div className="between muted tiny sales-days">
            {sampleSales.map((point) => (
              <span key={point.day}>{point.day}</span>
            ))}
          </div>
        </div>
        <div className="whitepanel donut-panel">
          <div className="between">
            <h3 style={{ margin: 0 }}>Order Status</h3>
            <span className="muted tiny">This month</span>
          </div>
          <div className="donut" aria-hidden="true">
            <div className="donut-hole">
              <div>
                <b style={{ fontSize: 25 }}>{sampleKpis.totalOrders}</b>
                <div className="muted tiny">orders</div>
              </div>
            </div>
          </div>
          <div className="status-key tiny muted">
            {sampleOrderStatus.map((entry) => (
              <span key={entry.name}><i style={{ color: entry.color }}>●</i>{entry.name}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="whitepanel" style={{ marginTop: 20 }}>
        <div className="between">
          <h3>Recent Orders</h3>
          <Link to="/admin/orders" className="small" style={{ color: 'var(--primary)', fontWeight: 700 }}>VIEW ALL ORDERS →</Link>
        </div>
        <div className="table-wrap">
          <table className="table" style={{ marginTop: 18 }}>
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.map((order) => (
                <tr key={order.id}>
                  <td><b>#{order.orderNumber}</b></td>
                  <td>{order.customerName}</td>
                  <td>{formatShortDate(order.createdAt)}</td>
                  <td>{formatPeso(order.totalCentavos)}</td>
                  <td>{order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'cod' ? 'COD' : 'PayMongo'}</td>
                  <td><span className={fulfillmentClass(order.fulfillmentStatus)}>{fulfillmentLabel(order.fulfillmentStatus)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Kpi({ label, value, note, icon }: { label: string; value: string; note: string; icon: ReactNode }) {
  return (
    <div className="stat">
      <div className="between"><span className="muted small">{label}</span><span style={{ color: 'var(--primary)', fontSize: 20, display: 'grid' }}>{icon}</span></div>
      <div className="val">{value}</div>
      <div className="delta">{note}</div>
    </div>
  )
}
