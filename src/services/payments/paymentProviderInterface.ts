import type { CreateGatewayPaymentInput, CreateGatewayPaymentResult } from '@/services/payments/paymentTypes'

/** Server-side gateway implementations (Edge Function, backend). Never call Xendit from the browser with a secret key. */
export interface PaymentProvider {
  readonly id: 'manual' | 'xendit'
  createCheckoutSession?(input: CreateGatewayPaymentInput): Promise<CreateGatewayPaymentResult>
}
