import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { StoreSettings } from '@/types'

const POLICY_KEYS = ['shipping', 'returns', 'privacy', 'terms'] as const
type PolicyKey = (typeof POLICY_KEYS)[number]

const META: Record<PolicyKey, { title: string; hint: string; path: string }> = {
  shipping: {
    title: 'Shipping',
    hint: 'Explain delivery areas, timing, fees, and who to contact for delays.',
    path: '/policies/shipping',
  },
  returns: {
    title: 'Returns',
    hint: 'State eligibility, time window, condition of items, and how refunds are issued.',
    path: '/policies/returns',
  },
  privacy: {
    title: 'Privacy',
    hint: 'Describe what data you collect, how orders are stored, and customer rights.',
    path: '/policies/privacy',
  },
  terms: {
    title: 'Terms',
    hint: 'Cover order acceptance, pricing, liability, and rules for your store.',
    path: '/policies/terms',
  },
}

type PolicySettingsEditorProps = {
  policies: StoreSettings['policies']
  onChange: (policies: StoreSettings['policies']) => void
}

function hasContent(text: string) {
  return text.trim().length > 0
}

export function PolicySettingsEditor({ policies, onChange }: PolicySettingsEditorProps) {
  const [active, setActive] = useState<PolicyKey>('shipping')
  const meta = META[active]
  const value = policies[active]
  const words = value.trim() ? value.trim().split(/\s+/).length : 0
  const drafted = POLICY_KEYS.filter((key) => hasContent(policies[key])).length

  return (
    <div className="policy-settings">
      <div className="between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
        <p className="muted small" style={{ margin: 0, maxWidth: 520 }}>
          Linked from checkout and Help. Use clear, customer-friendly language.
        </p>
        <span className={`policy-settings__status${drafted === POLICY_KEYS.length ? ' complete' : ''}`}>
          {drafted} of {POLICY_KEYS.length} published
        </span>
      </div>
      <div className="policy-settings__nav" role="tablist" aria-label="Policy sections">
        {POLICY_KEYS.map((key) => {
          const filled = hasContent(policies[key])
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              className={`policy-tab${active === key ? ' on' : ''}${filled ? ' filled' : ''}`}
              onClick={() => setActive(key)}
            >
              <span className="policy-tab__dot" aria-hidden />
              {META[key].title}
            </button>
          )
        })}
      </div>
      <div className="policy-settings__editor" role="tabpanel">
        <div className="between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', font: '20px Georgia, serif' }}>{meta.title}</h4>
            <p className="muted tiny" style={{ margin: 0, maxWidth: 480, lineHeight: 1.55 }}>
              {meta.hint}
            </p>
          </div>
          <Link className="btn-action ghost" to={meta.path} target="_blank" rel="noreferrer">
            Preview page ↗
          </Link>
        </div>
        <textarea
          className="field-input policy-settings__textarea"
          value={value}
          onChange={(event) => onChange({ ...policies, [active]: event.target.value })}
          placeholder={`Write your ${meta.title.toLowerCase()} policy here…`}
        />
        <div className="between tiny muted" style={{ marginTop: 10 }}>
          <span>{words} word{words === 1 ? '' : 's'}</span>
          <span>Published on the storefront policy page.</span>
        </div>
      </div>
    </div>
  )
}
