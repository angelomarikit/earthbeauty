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
        successRedirectUrl: input.successRedirectUrl,
        failureRedirectUrl: input.failureRedirectUrl,
      },
    })

    const payload = data as {
      checkoutUrl?: string
      externalId?: string
      error?: string
      code?: string
      secretPresent?: boolean
    } | null

    if (error || payload?.error) {
      const detail = payload?.error
      if (payload?.code === 'missing_secret') {
        return {
          ok: false,
          message:
            detail ??
            'XENDIT_SECRET_KEY is missing. Supabase Dashboard → Edge Functions → Secrets → add XENDIT_SECRET_KEY, then redeploy is not required.',
        }
      }
      if (payload?.code === 'invalid_secret_format') {
        return {
          ok: false,
          message:
            detail ??
            'The stored Xendit key is not a secret API key. Replace it with the full key from Xendit → Developers → API keys (starts with xnd_development_ or xnd_production_).',
        }
      }
      return { ok: false, message: detail || error?.message || 'Xendit checkout could not be started.' }
    }

    if (!payload?.checkoutUrl || !payload.externalId) {
      return {
        ok: false,
        message:
          payload?.error ||
          'Xendit did not return a checkout URL. Check that the Edge Function is deployed and the secret key is valid.',
      }
    }

    return {
      ok: true,
      provider: 'xendit',
      checkoutUrl: payload.checkoutUrl,
      externalId: payload.externalId,
    }
  },
}
