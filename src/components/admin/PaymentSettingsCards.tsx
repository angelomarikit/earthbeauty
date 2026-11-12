import type { ReactNode } from 'react'
import type { StoreSettings } from '@/types'

type PaymentSettingsCardsProps = {
  form: StoreSettings
  set: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void
}

function PaymentCard({
  enabled,
  onToggle,
  logo,
  logoAlt,
  badge,
  children,
}: {
  enabled: boolean
  onToggle: (next: boolean) => void
  logo?: string
  logoAlt?: string
  badge?: string
  children?: ReactNode
}) {
  return (
    <div className={`payment-setting-card${enabled ? ' on' : ''}`}>
      <div className="payment-setting-card__head">
        {logo ? <img className="pay-method-logo" src={logo} alt={logoAlt ?? ''} width={112} height={38} /> : badge ? <span className="payment-badge">{badge}</span> : null}
        <label className="payment-setting-toggle">
          <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
          {enabled ? 'Enabled' : 'Off'}
        </label>
      </div>
      {enabled ? <p className="payment-setting-live tiny">Shown at checkout</p> : <p className="muted tiny">Hidden from checkout</p>}
      {enabled && children ? <div className="payment-setting-card__body">{children}</div> : null}
    </div>
  )
}

export function PaymentSettingsCards({ form, set }: PaymentSettingsCardsProps) {
  return (
    <>
      <p className="muted small" style={{ marginTop: 4, maxWidth: 640 }}>
        Turn methods on or off and fill in account details. Shoppers only see enabled options.
      </p>
      <div className="payment-settings-grid">
        <PaymentCard enabled={form.codEnabled} onToggle={(next) => set('codEnabled', next)} badge="COD">
          <p className="muted tiny" style={{ margin: 0 }}>
            Customer pays when the order is delivered. No payment receipt upload.
          </p>
        </PaymentCard>

        <PaymentCard
          enabled={form.gcashEnabled}
          onToggle={(next) => set('gcashEnabled', next)}
          logo="/assets/payments/gcash.svg"
          logoAlt="GCash"
        >
          <Field label="Account name">
            <input className="field-input" value={form.gcashAccountName} onChange={(event) => set('gcashAccountName', event.target.value)} placeholder="Registered GCash name" />
          </Field>
          <Field label="Mobile number">
            <input className="field-input" value={form.gcashNumber} onChange={(event) => set('gcashNumber', event.target.value)} placeholder="09XX XXX XXXX" />
          </Field>
          <Field label="Instructions for customers">
            <textarea className="field-input" value={form.gcashInstructions} onChange={(event) => set('gcashInstructions', event.target.value)} placeholder="e.g. Send the exact order total, then upload your receipt." />
          </Field>
        </PaymentCard>

        <PaymentCard
          enabled={form.mayaEnabled}
          onToggle={(next) => set('mayaEnabled', next)}
          logo="/assets/payments/maya.svg"
          logoAlt="Maya"
        >
          <Field label="Account name">
            <input className="field-input" value={form.mayaAccountName} onChange={(event) => set('mayaAccountName', event.target.value)} />
          </Field>
          <Field label="Mobile number">
            <input className="field-input" value={form.mayaNumber} onChange={(event) => set('mayaNumber', event.target.value)} />
          </Field>
          <Field label="Instructions">
            <textarea className="field-input" value={form.mayaInstructions} onChange={(event) => set('mayaInstructions', event.target.value)} />
          </Field>
        </PaymentCard>

        <PaymentCard
          enabled={form.qrphEnabled}
          onToggle={(next) => set('qrphEnabled', next)}
          logo="/assets/payments/qrph.svg"
          logoAlt="QR Ph"
        >
          <Field label="Display name">
            <input className="field-input" value={form.qrphDisplayName} onChange={(event) => set('qrphDisplayName', event.target.value)} placeholder="QR Ph" />
          </Field>
          <Field label="Recipient info">
            <textarea className="field-input" value={form.qrphRecipientInfo} onChange={(event) => set('qrphRecipientInfo', event.target.value)} placeholder="Bank / merchant name shown to customer" />
          </Field>
          <Field label="Instructions">
            <textarea className="field-input" value={form.qrphInstructions} onChange={(event) => set('qrphInstructions', event.target.value)} />
          </Field>
        </PaymentCard>

        <PaymentCard
          enabled={form.xenditEnabled}
          onToggle={(next) => set('xenditEnabled', next)}
          logo="/assets/payments/xendit.svg"
          logoAlt="Xendit"
        >
          <p className="muted tiny" style={{ margin: '0 0 10px', lineHeight: 1.55 }}>
            Deploy <code>supabase/functions/xendit-create-invoice</code> to this project, then set Edge Function secret <b>XENDIT_SECRET_KEY</b> (full key from Xendit → Developers → API keys, starts with <code>xnd_</code>). A missing secret returns HTTP 503. Keep <b>GCash or QR Ph</b> enabled so the order is created before redirect.
          </p>
          <p className="muted tiny" style={{ margin: 0 }}>
            Run <code>0004_xendit_gateway_flags.sql</code> if saving fails.
          </p>
        </PaymentCard>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-group" style={{ marginTop: 12 }}>
      <label className="fieldlabel">{label}</label>
      {children}
    </div>
  )
}
