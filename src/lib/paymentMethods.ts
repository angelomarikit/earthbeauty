import type { PaymentMethod } from '@/types'
import { manualPaymentLabel } from '@/services/payments/manualPaymentService'

/** Values accepted by `place_order` in Supabase (0002_manual_payments.sql). */
export type DbPaymentMethod = 'cod' | 'gcash_manual' | 'maya_manual' | 'qrph_manual'

export function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  switch (method) {
    case 'cod':
      return 'cod'
    case 'gcash':
    case 'gcash_manual':
      return 'gcash_manual'
    case 'maya_manual':
      return 'maya_manual'
    case 'qrph_manual':
      return 'qrph_manual'
    case 'xendit':
      return 'qrph_manual'
    default:
      return 'gcash_manual'
  }
}

export function paymentMethodLabel(method: PaymentMethod | string): string {
  if (method === 'gcash') return 'GCash'
  if (method === 'paymongo') return 'PayMongo'
  if (method === 'xendit') return 'Xendit'
  if (isDbPaymentMethod(method)) return manualPaymentLabel(method)
  return String(method)
}

function isDbPaymentMethod(method: string): method is DbPaymentMethod {
  return ['cod', 'gcash_manual', 'maya_manual', 'qrph_manual'].includes(method)
}

export function manualMethodsRequireProof(method: PaymentMethod): boolean {
  return method === 'gcash_manual' || method === 'maya_manual' || method === 'qrph_manual' || method === 'gcash'
}
