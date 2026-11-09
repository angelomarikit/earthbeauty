import { Link, useParams } from 'react-router-dom'
import { useStore } from '@/features/store/StoreContext'
import { usePageMeta } from '@/lib/seo'

export function HelpPage() {
  const { state } = useStore()
  usePageMeta('Help Center · Earth Beauty & Wellness', 'Help for the Earth Beauty & Wellness preview.')
  return (
    <div className="page">
      <div className="wrap">
        <h1 className="page-title">Help Center</h1>
        <div className="grid2" style={{ marginTop: 22 }}>
          <Link className="whitepanel" to="/track"><b>Track an order</b><p className="muted small">Use an order number from this preview.</p></Link>
          <Link className="whitepanel" to="/policies/shipping"><b>Shipping</b><p className="muted small">{state.settings.policies.shipping}</p></Link>
          <Link className="whitepanel" to="/policies/returns"><b>Returns</b><p className="muted small">{state.settings.policies.returns}</p></Link>
          <Link className="whitepanel" to="/contact"><b>Contact</b><p className="muted small">{state.settings.phone}</p></Link>
        </div>
      </div>
    </div>
  )
}

export function ContactPage() {
  const { state } = useStore()
  usePageMeta('Contact · Earth Beauty & Wellness', state.settings.address)
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <h1 className="page-title">Contact Us</h1>
        <div className="whitepanel" style={{ marginTop: 18 }}>
          <p><b>{state.settings.legalName}</b></p>
          <p className="muted" style={{ marginTop: 8, lineHeight: 1.8 }}>{state.settings.address}<br />{state.settings.phone}</p>
          <p className="small" style={{ marginTop: 12 }}>Social links can be updated in store settings. Current preview links are placeholders until the merchant supplies the real profiles.</p>
        </div>
      </div>
    </div>
  )
}

export function PolicyPage() {
  const { slug } = useParams()
  const { state } = useStore()
  const map = {
    shipping: ['Shipping Information', state.settings.policies.shipping],
    returns: ['Returns & Refunds', state.settings.policies.returns],
    privacy: ['Privacy Policy', state.settings.policies.privacy],
    terms: ['Terms of Service', state.settings.policies.terms],
  } as const
  const entry = map[(slug as keyof typeof map) ?? 'terms'] ?? map.terms
  usePageMeta(`${entry[0]} · Earth Beauty & Wellness`, entry[1])
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="breadcrumb"><Link to="/">Home</Link> / <b>{entry[0]}</b></div>
        <div className="whitepanel">
          <div className="eyebrow">DRAFT</div>
          <h1 className="page-title">{entry[0]}</h1>
          <p style={{ marginTop: 16, lineHeight: 1.8 }}>{entry[1]}</p>
        </div>
      </div>
    </div>
  )
}
