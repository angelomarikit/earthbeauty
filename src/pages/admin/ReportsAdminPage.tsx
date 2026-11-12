import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownToLine, CalendarRange, Flag, Package, PhilippinePeso, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sampleSales } from '@/data/demo/dashboard'
import { dashboardKpis, fulfillmentBreakdown, paidOrders } from '@/features/admin/dashboardMetrics'
import { useStore } from '@/features/store/StoreContext'
import { formatPeso, fulfillmentLabel } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'
import type { Order } from '@/types'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function paidRevenueByDay(orders: Order[], from: string, to: string) {
  const paid = paidOrders(orders)
  const map = new Map<string, number>()
  for (const order of paid) {
    const key = order.createdAt.slice(0, 10)
    if (key < from || key > to) continue
    map.set(key, (map.get(key) ?? 0) + order.totalCentavos)
  }
  const keys = [...map.keys()].sort()
  if (!keys.length) return []
  const max = Math.max(...map.values(), 1)
  return keys.map((key) => ({
    day: new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    amount: map.get(key) ?? 0,
    bar: Math.max(8, Math.round(((map.get(key) ?? 0) / max) * 100)),
  }))
}

export function ReportsAdminPage() {
  const { state, mode } = useStore()
  const [from, setFrom] = useState(daysAgoIso(30))
  const [to, setTo] = useState(todayIso)

  usePageMeta('Reports · Earth Beauty Admin', mode === 'production' ? 'Sales and order analytics.' : 'Demonstration reports.')

  const ordersInRange = useMemo(
    () => state.orders.filter((order) => order.createdAt.slice(0, 10) >= from && order.createdAt.slice(0, 10) <= to),
    [state.orders, from, to],
  )
  const paidInRange = useMemo(() => paidOrders(ordersInRange), [ordersInRange])
  const paidTotal = paidInRange.reduce((sum, order) => sum + order.totalCentavos, 0)
  const previewTotal = ordersInRange.reduce((sum, order) => sum + order.totalCentavos, 0)
  const displayTotal = mode === 'production' ? paidTotal : previewTotal
  const avgPaid = paidInRange.length ? Math.round(paidTotal / paidInRange.length) : 0
  const lowCount = state.products.filter((product) => product.active && product.stock <= state.settings.lowStockThreshold).length
  const liveKpis = dashboardKpis(ordersInRange, lowCount)

  const chartData = useMemo(() => {
    if (mode === 'demo') return sampleSales.map((point) => ({ ...point, label: point.day }))
    const daily = paidRevenueByDay(state.orders, from, to)
    if (daily.length) return daily.map((point) => ({ ...point, day: point.day, label: point.day }))
    return []
  }, [mode, state.orders, from, to])

  const statusSlices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const order of ordersInRange) {
      counts.set(order.fulfillmentStatus, (counts.get(order.fulfillmentStatus) ?? 0) + 1)
    }
    const max = Math.max(...counts.values(), 1)
    return (['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => ({
      status,
      label: fulfillmentLabel(status),
      count: counts.get(status) ?? 0,
      pct: Math.round(((counts.get(status) ?? 0) / max) * 100),
    }))
  }, [ordersInRange])

  const donutSlices = mode === 'production' ? fulfillmentBreakdown(ordersInRange) : []

  function exportCsv() {
    const header = 'order,date,customer,total_centavos,payment,fulfillment'
    const body = ordersInRange.map((order) =>
      [order.orderNumber, order.createdAt, order.customerName, order.totalCentavos, order.paymentStatus, order.fulfillmentStatus].join(','),
    )
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
      <div className="between reports-hero" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow">INSIGHTS</div>
          <h1 style={{ font: '31px Georgia, serif', margin: '8px 0' }}>Reports</h1>
          <p className="muted small" style={{ margin: 0, maxWidth: 480 }}>
            {mode === 'production'
              ? 'Paid revenue and fulfilment for the dates you select.'
              : 'Sample charts — connect production data for live numbers.'}
          </p>
        </div>
        <button className="btn outline" type="button" onClick={exportCsv}>
          <ArrowDownToLine size={16} style={{ marginRight: 8, verticalAlign: -3 }} />
          EXPORT CSV
        </button>
      </div>

      {mode === 'demo' ? (
        <div className="notice" style={{ marginTop: 16 }}>
          Demonstration orders only — not real revenue.
        </div>
      ) : null}

      <div className="reports-filter whitepanel">
        <div className="reports-filter__icon" aria-hidden>
          <CalendarRange size={22} />
        </div>
        <div className="reports-filter__fields">
          <label className="reports-filter__field">
            <span className="fieldlabel">From</span>
            <input className="field-input" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="reports-filter__field">
            <span className="fieldlabel">To</span>
            <input className="field-input" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
          </label>
        </div>
        <p className="muted tiny reports-filter__hint">{ordersInRange.length} order{ordersInRange.length === 1 ? '' : 's'} in this range</p>
      </div>

      <div className="kpi-grid" style={{ marginTop: 18 }}>
        <ReportKpi icon={<PhilippinePeso size={20} />} label="Paid revenue" value={formatPeso(paidTotal)} note={liveKpis.salesNote} accent />
        <ReportKpi icon={<ShoppingBag size={20} />} label="Orders in range" value={String(ordersInRange.length)} note={liveKpis.ordersNote} />
        <ReportKpi icon={<Package size={20} />} label="Average paid order" value={paidInRange.length ? formatPeso(avgPaid) : '—'} note={paidInRange.length ? `${paidInRange.length} paid` : 'No paid orders'} />
        <ReportKpi icon={<Flag size={20} />} label="Low stock SKUs" value={String(lowCount).padStart(2, '0')} note={liveKpis.lowStockNote} warn={lowCount > 0} />
      </div>

      <div className="dash-charts reports-charts">
        <div className="whitepanel sales-panel">
          <div className="between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>Paid revenue</h3>
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>
                {mode === 'production' ? 'By day · paid orders only' : 'Sample weekly shape'}
              </p>
            </div>
            <span className="pill">{from} → {to}</span>
          </div>
          {mode === 'production' && !chartData.length ? (
            <div className="reports-empty">
              <p>No paid orders in this range yet.</p>
              <Link to="/admin/orders" className="btn outline" style={{ marginTop: 12 }}>
                VIEW ORDERS
              </Link>
            </div>
          ) : (
            <div className="reports-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8a737a' }} interval={chartData.length > 10 ? 'preserveStartEnd' : 0} />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    cursor={{ fill: 'rgba(242, 10, 135, 0.06)' }}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="reports-tooltip">
                          <b>{formatPeso(payload[0].value as number)}</b>
                          <span className="muted tiny">{payload[0].payload.day}</span>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill="url(#reportsBarGradient)" />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="reportsBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f20a87" />
                      <stop offset="100%" stopColor="#ffd0e6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="whitepanel donut-panel reports-status-panel">
          <div className="between">
            <div>
              <h3 style={{ margin: 0 }}>Fulfilment mix</h3>
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>Orders in selected range</p>
            </div>
          </div>
          {mode === 'production' && ordersInRange.length === 0 ? (
            <div className="reports-empty compact">
              <p className="muted small">No orders in this date range.</p>
            </div>
          ) : (
            <ul className="reports-status-list">
              {statusSlices.map((row) => (
                <li key={row.status} className="reports-status-row">
                  <div className="between small" style={{ marginBottom: 6 }}>
                    <span>{row.label}</span>
                    <b>{row.count}</b>
                  </div>
                  <div className="reports-status-track" aria-hidden>
                    <i style={{ width: `${row.count ? Math.max(row.pct, 6) : 0}%`, background: statusColor(row.status) }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="reports-total-line">
            <span>{mode === 'production' ? 'Paid total in range' : 'Preview total'}</span>
            <b className="price">{formatPeso(displayTotal)}</b>
          </div>
          {donutSlices.length > 0 ? (
            <div className="reports-legend tiny muted" style={{ marginTop: 14 }}>
              {donutSlices.map((slice) => (
                <span key={slice.name} className="reports-legend__item">
                  <i style={{ background: slice.color }} />
                  {slice.name} ({slice.count})
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="whitepanel reports-inventory" style={{ marginTop: 18 }}>
        <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Inventory watch</h3>
            <p className="muted small" style={{ margin: '8px 0 0', lineHeight: 1.55 }}>
              {lowCount > 0 ? (
                <>
                  <b>{lowCount}</b> active product{lowCount === 1 ? '' : 's'} at or below{' '}
                  <b>{state.settings.lowStockThreshold}</b> units.
                </>
              ) : (
                <>All active products are above your low-stock threshold ({state.settings.lowStockThreshold} units).</>
              )}
            </p>
          </div>
          <Link className="btn outline" to="/admin/products">
            MANAGE PRODUCTS
          </Link>
        </div>
      </div>
    </>
  )
}

function statusColor(status: string) {
  switch (status) {
    case 'pending':
      return '#f5c451'
    case 'confirmed':
      return '#7a9fb8'
    case 'processing':
      return '#7cc7a5'
    case 'shipped':
      return '#4aa3e0'
    case 'delivered':
      return '#3f9d68'
    case 'cancelled':
      return '#c9b0b3'
    default:
      return 'var(--primary)'
  }
}

function ReportKpi({
  label,
  value,
  note,
  icon,
  accent,
  warn,
}: {
  label: string
  value: string
  note: string
  icon: ReactNode
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className={`stat reports-kpi${accent ? ' accent' : ''}${warn ? ' warn' : ''}`}>
      <div className="between">
        <span className="muted small">{label}</span>
        <span className="reports-kpi__icon">{icon}</span>
      </div>
      <div className="val">{value}</div>
      <div className="delta">{note}</div>
    </div>
  )
}
