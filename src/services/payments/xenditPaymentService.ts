import { getSupabase } from '@/lib/supabase'
import type { CreateGatewayPaymentInput, CreateGatewayPaymentResult } from '@/services/payments/paymentTypes'
import type { PaymentProvider } from '@/services/payments/paymentProviderInterface'

/**
 * Xendit secret keys must start with `xnd_development_` or `xnd_production_`.
 * Store them only in Supabase Edge Function secrets (Dashboard → Edge Functions → Secrets),
 * never in VITE_* env vars, never in `store_settings` (that table is readable by the storefront).
 *
 * The browser calls a secured Edge Function; the function calls Xendit with Basic auth.
 */
export const xenditPaymentProvider: PaymentProvider = {
  id: 'xendit',
  async createCheckoutSession(input: CreateGatewayPaymentInput): Promise<CreateGatewayPaymentResult> {
    const supabase = getSupabase()
    if (!supabase) {
      return { ok: false, message: 'Connect Supabase before using Xendit checkout.' }
    }

    const { data, error } = await supabase.functions.invoke('xendit-create-invoice', {
      body: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        amountCentavos: input.amountCentavos,
        currency: input.currency,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        description: input.description,
      },
    })

    if (error) {
      return { ok: false, message: error.message || 'Xendit checkout could not be started.' }
    }

    const payload = data as { checkoutUrl?: string; externalId?: string; error?: string } | null
    if (!payload?.checkoutUrl || !payload.externalId) {
      return { ok: false, message: payload?.error || 'Xendit did not return a checkout URL.' }
    }

    return {
      ok: true,
      provider: 'xendit',
      checkoutUrl: payload.checkoutUrl,
      externalId: payload.externalId,
    }
  },
}
