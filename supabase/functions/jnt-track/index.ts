import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts'
import { Md5 } from 'https://deno.land/std@0.224.0/hash/md5.ts'

const JNT_PH_TRACK_URL = 'https://www.jtexpress.ph/trajectoryQuery'

type TraceBody = {
  billCode?: string
}

function digestFor(bizContent: string, privateKey: string) {
  const md5 = new Md5()
  md5.update(bizContent + privateKey)
  return encodeBase64(md5.digest())
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  let body: TraceBody
  try {
    body = (await req.json()) as TraceBody
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const billCode = String(body.billCode ?? '').trim().replace(/\s+/g, '')
  if (!billCode) return json({ error: 'missing_bill_code' }, 400)

  const apiAccount = Deno.env.get('JNT_API_ACCOUNT')?.trim()
  const privateKey = Deno.env.get('JNT_PRIVATE_KEY')?.trim()
  const customerCode = Deno.env.get('JNT_CUSTOMER_CODE')?.trim()
  const apiHost = Deno.env.get('JNT_OPENAPI_HOST')?.trim()?.replace(/\/$/, '')

  if (!apiAccount || !privateKey || !customerCode || !apiHost) {
    return json({
      mode: 'link',
      trackUrl: JNT_PH_TRACK_URL,
      billCode,
      events: [],
      message:
        'Live J&T scans on this page need your merchant Open Platform credentials in Edge Function secrets (JNT_API_ACCOUNT, JNT_PRIVATE_KEY, JNT_CUSTOMER_CODE, JNT_OPENAPI_HOST). Until then, use Track on J&T below.',
    })
  }

  const bizContent = JSON.stringify({
    billCodes: billCode,
    customerCode,
    lang: 'en',
  })

  const tracePath = Deno.env.get('JNT_TRACE_PATH')?.trim() || '/webopenplatformapi/api/logistics/trace'
  const timestamp = Date.now().toString()

  try {
    const form = new URLSearchParams({ bizContent })
    const upstream = await fetch(`${apiHost}${tracePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiAccount,
        digest: digestFor(bizContent, privateKey),
        timestamp,
      },
      body: form.toString(),
    })

    const payload = (await upstream.json()) as {
      code?: string
      msg?: string
      data?: Array<{
        billCode?: string
        details?: Array<{ scanTime?: string; desc?: string; scanNetworkName?: string }>
      }>
    }

    const details = payload.data?.[0]?.details ?? []
    const events = details.map((row) => ({
      at: row.scanTime ?? '',
      status: row.desc ?? 'Update',
      location: row.scanNetworkName ?? undefined,
    }))

    if (payload.code !== '1' && !events.length) {
      return json({
        mode: 'link',
        trackUrl: JNT_PH_TRACK_URL,
        billCode,
        events: [],
        message: payload.msg ?? 'Could not load J&T scans. Track on the J&T website instead.',
      })
    }

    return json({
      mode: events.length ? 'live' : 'link',
      trackUrl: JNT_PH_TRACK_URL,
      billCode,
      events,
    })
  } catch {
    return json({
      mode: 'link',
      trackUrl: JNT_PH_TRACK_URL,
      billCode,
      events: [],
      message: 'Courier tracking is temporarily unavailable. Use the J&T link below.',
    })
  }
})
