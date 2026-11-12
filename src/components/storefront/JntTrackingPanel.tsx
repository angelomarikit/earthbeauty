import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import type { JntTrackEvent, JntTrackResult } from '@/lib/jntTracking'
import { JNT_PH_TRACK_URL, normalizeBillCode } from '@/lib/jntTracking'

export function JntTrackingPanel({ billCode }: { billCode: string }) {
  const code = normalizeBillCode(billCode)
  const [result, setResult] = useState<JntTrackResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseClient()
    if (!supabase || !code) {
      setLoading(false)
      setResult({
        mode: 'link',
        trackUrl: JNT_PH_TRACK_URL,
        billCode: code,
        events: [],
      })
      return
    }

    void supabase.functions
      .invoke('jnt-track', { body: { billCode: code } })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setResult({
            mode: 'link',
            trackUrl: JNT_PH_TRACK_URL,
            billCode: code,
            events: [],
            message: 'Could not load courier updates. You can still track on J&T.',
          })
          return
        }
        setResult(data as JntTrackResult)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [code])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="whitepanel jnt-track-panel" style={{ marginTop: 22 }}>
      <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <img src="/assets/shipping/jnt.svg" alt="J&amp;T Express" width={96} height={32} />
          <div>
            <h3 style={{ margin: 0 }}>J&amp;T Express tracking</h3>
            <p className="muted tiny" style={{ margin: '6px 0 0' }}>
              Waybill / tracking number from your shipment
            </p>
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn outline compact" onClick={() => void copyCode()}>
            {copied ? 'COPIED' : `COPY ${code}`}
          </button>
          <a className="btn compact" href={JNT_PH_TRACK_URL} target="_blank" rel="noopener noreferrer">
            TRACK ON J&amp;T <ExternalLink size={14} style={{ marginLeft: 6 }} />
          </a>
        </div>
      </div>
      {loading ? <p className="muted small" style={{ marginTop: 16 }}>Loading courier updates…</p> : null}
      {result?.message ? <p className="muted small" style={{ marginTop: loading ? 8 : 16 }}>{result.message}</p> : null}
      {result?.events?.length ? (
        <ul className="jnt-track-events">
          {result.events.map((event: JntTrackEvent, index) => (
            <li key={`${event.at}-${index}`}>
              <b>{event.status}</b>
              {event.location ? <span className="muted tiny"> · {event.location}</span> : null}
              {event.at ? <div className="muted tiny">{event.at}</div> : null}
            </li>
          ))}
        </ul>
      ) : !loading && result?.mode === 'link' ? (
        <p className="small" style={{ marginTop: 12, lineHeight: 1.55 }}>
          Paste <b>{code}</b> on the J&amp;T track page to see the latest delivery scans.
        </p>
      ) : null}
    </div>
  )
}
