import type { FulfillmentStatus, Order } from '@/types'

const DAY_MS = 86_400_000

export type SalesBar = { day: string; amount: number; bar: string }
export type StatusSlice = { name: string; count: number; color: string }

const statusColors: Record<string, string> = {
  pending: '#f5c451',
  confirmed: '#7a9fb8',
  processing: '#7cc7a5',
  shipped: '#4aa3e0',
  delivered: '#3f9d68',
  cancelled: '#c9b0b3',
}

/** Paid orders count toward revenue KPIs (manual verify / COD collection / gateway webhook). */
export function paidOrders(orders: Order[]) {
  return orders.filter((order) => order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'cancelled')
}

export function dashboardKpis(orders: Order[], lowStock: number) {
  const paid = paidOrders(orders)
  const totalSalesCentavos = paid.reduce((sum, order) => sum + order.totalCentavos, 0)
  const totalOrders = orders.length
  const pendingOrders = orders.filter(
    (order) => order.fulfillmentStatus === 'pending' || order.fulfillmentStatus === 'confirmed',
  ).length
  return {
    totalSalesCentavos,
    totalOrders,
    pendingOrders,
    lowStock,
    salesNote: paid.length ? `${paid.length} paid order${paid.length === 1 ? '' : 's'}` : 'No paid orders yet',
    ordersNote: totalOrders ? 'All recorded orders' : 'No orders yet',
    pendingNote: pendingOrders ? 'Awaiting fulfillment' : 'Nothing pending',
    lowStockNote: lowStock ? 'Below threshold' : 'Stock levels OK',
  }
}

export function lastSevenDaySales(orders: Order[]): SalesBar[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getTime() - (6 - index) * DAY_MS)
    const key = day.toISOString().slice(0, 10)
    return { key, label: labels[day.getDay()], amount: 0 }
  })
  for (const order of paidOrders(orders)) {
    const key = order.createdAt.slice(0, 10)
    const bucket = buckets.find((entry) => entry.key === key)
    if (bucket) bucket.amount += order.totalCentavos
  }
  const max = Math.max(...buckets.map((b) => b.amount), 1)
  return buckets.map((bucket) => ({
    day: bucket.label,
    amount: bucket.amount,
    bar: `${Math.max(8, Math.round((bucket.amount / max) * 100))}%`,
  }))
}

export function fulfillmentBreakdown(orders: Order[]): StatusSlice[] {
  const counts = new Map<FulfillmentStatus, number>()
  for (const order of orders) {
    counts.set(order.fulfillmentStatus, (counts.get(order.fulfillmentStatus) ?? 0) + 1)
  }
  return (['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as FulfillmentStatus[])
    .map((status) => ({
      name: status.replace('_', ' '),
      count: counts.get(status) ?? 0,
      color: statusColors[status] ?? '#ccc',
    }))
    .filter((entry) => entry.count > 0)
}
