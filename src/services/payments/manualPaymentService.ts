import type { PaymentMethodId } from '@/services/payments/paymentTypes'

export const MANUAL_PAYMENT_METHODS: PaymentMethodId[] = [
  'cod',
  'gcash_manual',
  'maya_manual',
  'qrph_manual',
]

export function isManualPaymentMethod(method: string): method is PaymentMethodId {
  return (MANUAL_PAYMENT_METHODS as string[]).includes(method)
}

export function manualPaymentLabel(method: PaymentMethodId): string {
  switch (method) {
    case 'cod':
      return 'Cash on Delivery'
    case 'gcash_manual':
      return 'GCash (manual verification)'
    case 'maya_manual':
      return 'Maya (manual verification)'
    case 'qrph_manual':
      return 'QR Ph (manual verification)'
    default:
      return method
  }
}
