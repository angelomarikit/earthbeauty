import { CircleCheck, CreditCard, FileText, Package, Truck } from 'lucide-react'
import type { FulfillmentStatus, Order, StatusEvent } from '@/types'
import { formatDateTime, fulfillmentClass, fulfillmentLabel, paymentClass, paymentLabel } from '@/lib/format'

const fulfillmentDot: Record<FulfillmentStatus, string> = {
  pending: '#f5c451',
  confirmed: '#7a9fb8',
  processing: '#7cc7a5',
  shipped: '#4aa3e0',
  delivered: '#3f9d68',
  cancelled: '#c9b0b3',
}

function historyIcon(event: StatusEvent) {
  const note = event.note.toLowerCase()
  if (note.includes('payment') || note.includes('proof') || note.includes('cod')) return CreditCard
  if (note.includes('tracking') || note.includes('notes')) return FileText
  if (event.fulfillment === 'delivered') return CircleCheck
  if (event.fulfillment === 'shipped') return Truck
  return Package
}

function eventsForDisplay(order: Order): StatusEvent[] {
  if (order.history.length) return order.history
  return [
    {
      at: order.createdAt,
      fulfillment: 'pending',
      payment: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      note: 'Order placed.',
    },
  ]
}

export function OrderStatusHistory({ order }: { order: Order }) {
  const events = eventsForDisplay(order)

  return (
    <section className="order-history" aria-label="Status history">
      <div className="between" style={{ alignItems: 'baseline', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Status history</h3>
        <span className="muted tiny">{events.length} update{events.length === 1 ? '' : 's'}</span>
      </div>
      <ol className="order-timeline">
        {events.map((event, index) => {
          const Icon = historyIcon(event)
          const isLatest = index === events.length - 1
          return (
            <li key={`${event.at}-${index}`} className={`order-timeline__item${isLatest ? ' latest' : ''}`}>
              <span className="order-timeline__rail" aria-hidden>
                <i className="order-timeline__dot" style={{ background: fulfillmentDot[event.fulfillment] }} />
                <span className="order-timeline__icon">
                  <Icon size={14} strokeWidth={2.25} />
                </span>
              </span>
              <div className="order-timeline__body">
                <div className="order-timeline__meta">
                  <time className="order-timeline__time" dateTime={event.at}>
                    {formatDateTime(event.at)}
                  </time>
                  {isLatest ? <span className="pill" style={{ padding: '4px 10px', fontSize: 9 }}>Latest</span> : null}
                </div>
                <div className="order-timeline__badges">
                  <span className={fulfillmentClass(event.fulfillment)}>{fulfillmentLabel(event.fulfillment)}</span>
                  <span className={paymentClass(event.payment)}>{paymentLabel(event.payment)}</span>
                </div>
                <p className="order-timeline__note">{event.note}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
