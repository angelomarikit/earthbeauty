// Deploy as a Supabase Edge Function. Set secrets in the Supabase dashboard:
//   XENDIT_SECRET_KEY = full key from Settings → Developers → API keys (xnd_development_... or xnd_production_...)
//   XENDIT_WEBHOOK_TOKEN = callback verification token (for a separate xendit-webhook function)
//
// Do NOT paste short merchant codes from onboarding emails — use the full secret API key only.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function loadXenditSecret(): { secret: string } | { error: string; code: string; secretPresent: boolean } {
  const raw =
    Deno.env.get('XENDIT_SECRET_KEY') ??
    Deno.env.get('XENDIT_SECRET') ??
    Deno.env.get('XENDIT_API_KEY') ??
    ''
  const secret = raw.trim()
  if (!secret) {
    return {
      error:
        'XENDIT_SECRET_KEY is not set for Edge Functions. Supabase Dashboard → Edge Functions → Secrets (project secrets, not Database). Name must be exactly XENDIT_SECRET_KEY.',
      code: 'missing_secret',
      secretPresent: false,
    }
  }
  if (!secret.startsWith('xnd_')) {
    return {
      error:
        'XENDIT_SECRET_KEY is set but is not a Xendit secret API key (must start with xnd_development_ or xnd_production_). Use Developers → API keys in the Xendit dashboard, not a merchant or public key.',
      code: 'invalid_secret_format',
      secretPresent: true,
    }
  }
  return { secret }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const loaded = loadXenditSecret()
  if ('error' in loaded) {
    return new Response(
      JSON.stringify({
        error: loaded.error,
        code: loaded.code,
        secretPresent: loaded.secretPresent,
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  const secret = loaded.secret

  try {
    const body = await req.json()
    const amountCentavos = Number(body.amountCentavos)
    if (!Number.isFinite(amountCentavos) || amountCentavos < 1) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const externalId = String(body.orderNumber || body.orderId)
    const amount = amountCentavos / 100

    const auth = btoa(`${secret}:`)
    const invoiceRes = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        amount,
        currency: 'PHP',
        payer_email: body.customerEmail,
        description: body.description || `Order ${externalId}`,
        success_redirect_url: body.successRedirectUrl,
        failure_redirect_url: body.failureRedirectUrl,
      }),
    })

    const invoice = await invoiceRes.json()
    if (!invoiceRes.ok) {
      return new Response(JSON.stringify({ error: invoice?.message || 'Xendit invoice failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        checkoutUrl: invoice.invoice_url,
        externalId: invoice.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
