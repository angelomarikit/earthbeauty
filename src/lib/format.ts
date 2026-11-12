export function pesosToCentavos(pesos: number) {
  return Math.round(pesos * 100)
}

export function formatPeso(centavos: number, withSpace = true) {
  const pesos = centavos / 100
  const formatted = pesos.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return withSpace ? `₱ ${formatted}` : `₱${formatted}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function fulfillmentLabel(status: string) {
  if (status === 'shipped') return 'To Ship'
  if (status === 'processing') return 'Processing'
  if (status === 'delivered') return 'Delivered'
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'cancelled') return 'Cancelled'
  return 'Pending'
}

export function fulfillmentClass(status: string) {
  if (status === 'delivered' || status === 'confirmed') return 'status'
  if (status === 'shipped') return 'status ship'
  if (status === 'cancelled') return 'status bad'
  if (status === 'processing' || status === 'pending') return 'status pending'
  return 'status muted'
}

export function paymentLabel(status: string) {
  if (status === 'pending_verification') return 'Pending verification'
  if (status === 'paid') return 'Paid'
  if (status === 'rejected') return 'Rejected'
  if (status === 'failed') return 'Failed'
  if (status === 'refunded') return 'Refunded'
  return 'Unpaid'
}

export function paymentClass(status: string) {
  if (status === 'paid') return 'status'
  if (status === 'failed' || status === 'refunded') return 'status bad'
  if (status === 'pending_verification') return 'status pending'
  return 'status muted'
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function entityUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return uid('id')
}
