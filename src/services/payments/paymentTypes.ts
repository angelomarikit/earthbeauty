/** Stable checkout / database identifiers — manual methods stay until gateway is live. */
export type PaymentMethodId =
  | 'cod'
  | 'gcash_manual'
  | 'maya_manual'
  | 'qrph_manual'
  | 'xendit_invoice'

export type PaymentProviderId = 'manual' | 'xendit'

export type PaymentStatusId =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'rejected'
  | 'failed'
  | 'refund_pending'
  | 'refunded'

export type CreateGatewayPaymentInput = {
  orderId: string
  orderNumber: string
  amountCentavos: number
  currency: 'PHP'
  customerEmail: string
  customerName: string
  description: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
}

export type CreateGatewayPaymentResult =
  | { ok: true; provider: PaymentProviderId; checkoutUrl: string; externalId: string }
  | { ok: false; message: string }
