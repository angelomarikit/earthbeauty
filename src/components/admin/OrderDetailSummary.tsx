import { Mail, MapPin, Package, Phone, Receipt, Truck } from 'lucide-react'
import type { Order, PaymentProof } from '@/types'
import { formatDate, formatPeso, fulfillmentClass, fulfillmentLabel, paymentClass, paymentLabel } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import { isJntShipping } from '@/lib/jntTracking'

type OrderDetailSummaryProps = {
  order: Order
  mode: 'demo' | 'production'
  proofs: PaymentProof[]
  previewUrl: string | null
}

export function OrderDetailSummary({ order, mode, proofs, previewUrl }: OrderDetailSummaryProps) {
  const jnt = isJntShipping(order.shippingMethodName)

  return (
    <div className="whitepanel order-detail-card">
      <div className="between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>Order summary</h3>
          <p className="muted tiny" style={{ margin: '6px 0 0' }}>
            Placed {formatDate(order.createdAt)}
            {order.shippingMethodName ? ` · ${order.shippingMethodName}` : ''}
          </p>
        </div>
        <div className="order-detail-badges">
          <span className={fulfillmentClass(order.fulfillmentStatus)}>{fulfillmentLabel(order.fulfillmentStatus)}</span>
          <span className={paymentClass(order.paymentStatus)}>{paymentLabel(order.paymentStatus)}</span>
        </div>
      </div>

      <section className="order-detail-section">
        <div className="order-detail-section__title">
          <Mail size={16} aria-hidden />
          <span>Customer</span>
        </div>
        <p className="order-detail-customer-name">{order.customerName}</p>
        <ul className="order-detail-meta">
          <li>
            <Mail size={14} aria-hidden />
            <a href={`mailto:${order.email}`}>{order.email}</a>
          </li>
          <li>
            <Phone size={14} aria-hidden />
            <a href={`tel:${order.phone}`}>{order.phone}</a>
          </li>
          <li>
            <MapPin size={14} aria-hidden />
            <span>
              {order.address.street}, {order.address.barangay}, {order.address.city}, {order.address.province}{' '}
              {order.address.postalCode}
            </span>
          </li>
        </ul>
      </section>

      <section className="order-detail-section">
        <div className="order-detail-section__title">
          <Package size={16} aria-hidden />
          <span>Items</span>
        </div>
        <ul className="order-detail-lines">
          {order.items.map((item) => (
            <li key={`${item.sku}-${item.variantLabel}`} className="order-detail-line">
              <div>
                <b className="small">{item.name}</b>
                <p className="muted tiny" style={{ margin: '4px 0 0' }}>
                  {item.variantLabel} · SKU {item.sku} · Qty {item.quantity}
                </p>
              </div>
              <b>{formatPeso(item.unitPriceCentavos * item.quantity)}</b>
            </li>
          ))}
        </ul>
      </section>

      <div className="order-detail-totals">
        <div className="between small">
          <span className="muted">Subtotal</span>
          <span>{formatPeso(order.subtotalCentavos)}</span>
        </div>
        {order.discountCentavos > 0 ? (
          <div className="between small">
            <span className="muted">Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>−{formatPeso(order.discountCentavos)}</span>
          </div>
        ) : null}
        <div className="between small">
          <span className="muted">Shipping</span>
          <span>{formatPeso(order.shippingCentavos)}</span>
        </div>
        <div className="between order-detail-totals__grand">
          <span>Order total</span>
          <b className="price">{formatPeso(order.totalCentavos)}</b>
        </div>
      </div>

      <section className="order-detail-section order-detail-payment">
        <div className="order-detail-section__title">
          <Receipt size={16} aria-hidden />
          <span>Payment</span>
        </div>
        <p className="small" style={{ margin: '0 0 10px' }}>
          <b>{paymentMethodLabel(order.paymentMethod)}</b>
        </p>
        {mode === 'production' && proofs.length ? (
          <div className="order-proof-preview">
            <p className="small">
              Latest proof: <b>{proofs[0].fileName}</b>
              {proofs[0].referenceNumber ? (
                <>
                  {' '}
                  · ref <b>{proofs[0].referenceNumber}</b>
                </>
              ) : null}
            </p>
            {previewUrl ? <img src={previewUrl} alt="Payment proof" /> : null}
          </div>
        ) : order.proofName ? (
          <p className="small">Proof on file: {order.proofName}</p>
        ) : (
          <p className="muted small order-detail-payment-empty">No proof of payment attached yet.</p>
        )}
      </section>

      {(order.trackingNumber || jnt) && (
        <section className="order-detail-section order-detail-ship-hint">
          <div className="order-detail-section__title">
            <Truck size={16} aria-hidden />
            <span>Courier</span>
          </div>
          {jnt ? (
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <img src="/assets/shipping/jnt.svg" alt="" width={72} height={24} />
              <span className="small muted">J&amp;T shipment</span>
            </div>
          ) : null}
          <p className="small" style={{ marginTop: 8 }}>
            {order.trackingNumber ? (
              <>
                Tracking: <b>{order.trackingNumber}</b>
              </>
            ) : (
              <span className="muted">Add a waybill in Fulfillment when you dispatch.</span>
            )}
          </p>
        </section>
      )}
    </div>
  )
}
