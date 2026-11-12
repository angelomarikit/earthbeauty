import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { BrandLogo } from '@/components/branding/BrandLogo'
import { FileUploadField } from '@/components/forms/FileUploadField'
import { PackArt } from '@/components/product/ProductCard'
import { cartDetailed, couponDiscount } from '@/features/catalog/pricing'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'
import { PhilippinesAddressFields } from '@/components/forms/PhilippinesAddressFields'
import {
  estimateParcelWeightGrams,
  jntFeeCentavos,
  JNT_SHIP_FROM,
  jntRateSummary,
  regionToJntZone,
} from '@/features/shipping/jntRates'
import { formatPeso } from '@/lib/format'
import { manualMethodsRequireProof } from '@/lib/paymentMethods'
import type { PaymentMethod } from '@/types'
import { usePageMeta } from '@/lib/seo'

const schema = z.object({
  firstName: z.string().min(2, 'Enter a first name'),
  lastName: z.string().min(2, 'Enter a last name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a mobile number'),
  street: z.string().min(5, 'Enter the street address'),
  region: z.string().min(1, 'Select a region'),
  province: z.string().min(1, 'Select a province'),
  city: z.string().min(1, 'Select a city'),
  barangay: z.string().min(1, 'Select a barangay'),
  postalCode: z.string().min(4, 'Enter a postal code'),
  notes: z.string().optional(),
  shippingMethodId: z.string().min(1),
  payment: z.string().min(1),
  voucher: z.string().optional(),
  referenceNumber: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CheckoutPage() {
  const { state, placeOrder, mode } = useStore()
  const { lines, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const detailed = cartDetailed(state, lines).filter((line) => line.quantity > 0)
  const subtotal = detailed.reduce((sum, line) => sum + line.lineCentavos, 0)
  usePageMeta(
    'Checkout · Earth Beauty & Wellness',
    mode === 'production' ? 'Complete your order and payment.' : 'Demonstration checkout. No real payment is captured.',
  )

  const defaultPayment = useMemo((): PaymentMethod => {
    if (state.settings.gcashEnabled) return 'gcash_manual'
    if (state.settings.codEnabled) return 'cod'
    if (state.settings.mayaEnabled) return 'maya_manual'
    if (state.settings.qrphEnabled) return 'qrph_manual'
    if (state.settings.xenditEnabled) return 'xendit'
    return 'cod'
  }, [state.settings])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.name.split(' ')[0] ?? '',
      lastName: user?.name.split(' ').slice(1).join(' ') ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      street: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
      postalCode: '',
      notes: '',
      shippingMethodId: state.shippingMethods.find((method) => method.active)?.id ?? '',
      payment: defaultPayment,
      voucher: sessionStorage.getItem('ebw-voucher') ?? '',
      referenceNumber: '',
    },
  })

  const regionName = form.watch('region')
  const provinceName = form.watch('province')
  const cityName = form.watch('city')
  const shippingMethodId = form.watch('shippingMethodId')
  const voucher = form.watch('voucher')
  const payment = form.watch('payment') as PaymentMethod
  const barangayName = form.watch('barangay')
  const method = state.shippingMethods.find((entry) => entry.id === shippingMethodId)
  const coupon = state.coupons.find((entry) => entry.active && entry.code.toLowerCase() === (voucher ?? '').trim().toLowerCase())
  const discount = couponDiscount(coupon, subtotal)
  const itemQty = detailed.reduce((sum, line) => sum + line.quantity, 0)
  const parcelGrams = estimateParcelWeightGrams(itemQty)
  const shipping = method?.feeCentavos ?? 0
  const total = Math.max(0, subtotal - discount + shipping)
  const activeMethods = useMemo(() => state.shippingMethods.filter((entry) => entry.active), [state.shippingMethods])
  const deliveryZone = regionName ? regionToJntZone(regionName) : null
  const deliveryOptions = useMemo(() => {
    const pickup = activeMethods.filter((entry) => entry.carrier === 'pickup')
    if (!deliveryZone) return pickup
    const jnt = activeMethods.find((entry) => entry.carrier === 'jnt' && entry.jntZone === deliveryZone)
    return jnt ? [jnt, ...pickup] : pickup
  }, [activeMethods, deliveryZone])
  const needsProof = manualMethodsRequireProof(payment)
  const jntLightRate =
    deliveryZone != null ? formatPeso(jntFeeCentavos(deliveryZone, Math.min(parcelGrams, 500))) : null

  useEffect(() => {
    const currentShipping = form.getValues('shippingMethodId')
    if (!deliveryOptions.some((entry) => entry.id === currentShipping) && deliveryOptions[0]) {
      form.setValue('shippingMethodId', deliveryOptions[0].id, { shouldValidate: true })
    }
    const currentPayment = form.getValues('payment') as PaymentMethod
    const paymentOk =
      (currentPayment === 'cod' && state.settings.codEnabled) ||
      (currentPayment === 'gcash_manual' && state.settings.gcashEnabled) ||
      (currentPayment === 'maya_manual' && state.settings.mayaEnabled) ||
      (currentPayment === 'qrph_manual' && state.settings.qrphEnabled) ||
      (currentPayment === 'xendit' && state.settings.xenditEnabled)
    if (!paymentOk) {
      form.setValue('payment', defaultPayment, { shouldValidate: true })
    }
  }, [deliveryOptions, state.shippingMethods, state.settings, defaultPayment, form])

  useEffect(() => {
    if (!deliveryZone) return
    const jnt = activeMethods.find((entry) => entry.carrier === 'jnt' && entry.jntZone === deliveryZone)
    if (!jnt) return
    const current = state.shippingMethods.find((entry) => entry.id === form.getValues('shippingMethodId'))
    if (!current || current.carrier === 'jnt') {
      form.setValue('shippingMethodId', jnt.id, { shouldValidate: true })
    }
  }, [deliveryZone, activeMethods, state.shippingMethods, form])

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const first =
      errors.firstName?.message ??
      errors.lastName?.message ??
      errors.email?.message ??
      errors.phone?.message ??
      errors.street?.message ??
      errors.region?.message ??
      errors.province?.message ??
      errors.city?.message ??
      errors.barangay?.message ??
      errors.postalCode?.message ??
      errors.shippingMethodId?.message ??
      errors.payment?.message
    setFormError(first ?? 'Complete all required fields in Contact & Delivery Details and Payment.')
    const idMap: Record<string, keyof FormValues> = {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      phone: 'phone',
      street: 'street',
      region: 'region',
      province: 'province',
      city: 'city',
      barangay: 'barangay',
      postalCode: 'postalCode',
    }
    const key = (Object.keys(errors) as (keyof FormValues)[]).find((k) => errors[k])
    if (key && idMap[key]) {
      form.setFocus(idMap[key])
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!detailed.length) {
      setFormError('Your cart is empty.')
      return
    }
    if (mode === 'production' && !user) {
      setFormError('Sign in to place an order.')
      return
    }
    if (!deliveryOptions.length) {
      setFormError('Select your region to see J&T Express rates, or choose store pickup.')
      return
    }
    if (needsProof && !proofFile) {
      setFormError('Upload your payment receipt in the Payment section.')
      return
    }
    if (needsProof && !values.referenceNumber?.trim()) {
      setFormError('Enter the payment reference number in the Payment section.')
      form.setFocus('referenceNumber')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
    const result = await placeOrder({
      customerId: user?.id ?? null,
      customerName: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      phone: values.phone,
      address: {
        id: 'checkout',
        label: 'Delivery',
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        phone: values.phone,
        street: values.street,
        region: values.region,
        province: values.province,
        city: values.city,
        barangay: values.barangay,
        postalCode: values.postalCode,
        isDefault: false,
      },
      lines: detailed.map((line) => ({ productId: line.productId, variantId: line.variant?.id ?? line.variantId, quantity: line.quantity })),
      couponCode: values.voucher?.trim() || null,
      shippingMethodId: values.shippingMethodId,
      paymentMethod: values.payment as PaymentMethod,
      notes: values.notes ?? '',
      proofName: proofFile?.name ?? null,
      proofFile,
      referenceNumber: values.referenceNumber,
    })
    if (typeof result === 'string') {
      const hint = /permission denied|place_order/i.test(result)
        ? ' Run supabase/migrations/0007_checkout_rpc_grants.sql in the Supabase SQL Editor, then try again.'
        : ''
      setFormError(result + hint)
      return
    }
    clear()
    sessionStorage.removeItem('ebw-voucher')
    navigate(`/order-confirmation/${result.orderNumber}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not place the order.')
    } finally {
      setSubmitting(false)
    }
  }, onInvalid)

  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/cart">Cart</Link> / <b>Checkout</b>
        </div>
        <div className="auth-logo"><BrandLogo size="lg" variant="light" /></div>
        <h1 className="page-title">Secure Checkout</h1>
        <div className="steps">
          <span className="on">1　Shopping Cart</span>
          <i>—</i>
          <span className="on">2　Checkout</span>
          <i>—</i>
          <span>3　Order Confirmation</span>
        </div>
        {mode === 'demo' ? (
          <div className="notice">Demonstration checkout. Cash on delivery and manual e-wallet payments are simulated. No payment is processed.</div>
        ) : !user ? (
          <div className="notice">
            Sign in before checkout so your order and payment proof are linked to your account.{' '}
            <Link to="/login?next=/checkout" style={{ fontWeight: 700 }}>Sign in</Link>
          </div>
        ) : null}
        {!detailed.length ? (
          <div className="whitepanel empty">
            <p>Your cart is empty.</p>
            <Link className="btn" to="/shop">Return to shop</Link>
          </div>
        ) : (
          <form className="checkout-layout" onSubmit={onSubmit} noValidate>
            <div>
              <div className="whitepanel">
                <div className="between">
                  <h2 style={{ font: '24px Georgia, serif' }}>Contact & Delivery Details</h2>
                  <span className="small muted">
                    Already have an account? <Link to="/login?next=/checkout" style={{ color: 'var(--primary)', fontWeight: 700 }}>Login</Link>
                  </span>
                </div>
                <div className="line" />
                <div className="grid2">
                  <Field label="First Name *" error={form.formState.errors.firstName?.message}><input className="field-input" {...form.register('firstName')} /></Field>
                  <Field label="Last Name *" error={form.formState.errors.lastName?.message}><input className="field-input" {...form.register('lastName')} /></Field>
                </div>
                <div className="grid2">
                  <Field label="Email Address *" error={form.formState.errors.email?.message}><input className="field-input" type="email" {...form.register('email')} /></Field>
                  <Field label="Mobile Number *" error={form.formState.errors.phone?.message}><input className="field-input" {...form.register('phone')} placeholder="09XX XXX XXXX" /></Field>
                </div>
                <Field label="Complete Street Address *" error={form.formState.errors.street?.message}>
                  <input className="field-input" {...form.register('street')} placeholder="House no., street, subdivision / building" />
                </Field>
                <PhilippinesAddressFields
                  region={regionName}
                  province={provinceName}
                  city={cityName}
                  barangay={barangayName}
                  setValue={(field, value) => form.setValue(field, value, { shouldValidate: true })}
                  fieldRef={(name) => form.register(name)}
                  errors={{
                    region: form.formState.errors.region?.message,
                    province: form.formState.errors.province?.message,
                    city: form.formState.errors.city?.message,
                    barangay: form.formState.errors.barangay?.message,
                  }}
                />
                <Field label="Postal Code *" error={form.formState.errors.postalCode?.message}>
                  <input className="field-input" style={{ width: '50%' }} {...form.register('postalCode')} />
                </Field>
                <Field label="Delivery notes">
                  <textarea className="field-input" {...form.register('notes')} placeholder="Optional note for delivery" />
                </Field>
                <div className="form-group">
                  <div className="fieldlabel">Delivery method</div>
                  <p className="muted tiny" style={{ margin: '0 0 12px', lineHeight: 1.55 }}>
                    Courier rates from <b>{JNT_SHIP_FROM}</b> via J&amp;T Express (Philippines list rates).
                  </p>
                  {!regionName ? (
                    <p className="muted small" style={{ marginBottom: 12 }}>
                      Select your <b>region</b> above to load your J&amp;T zone rate, or choose store pickup below.
                    </p>
                  ) : null}
                  {deliveryOptions.map((entry) => (
                    <label key={entry.id} className={`pay-option ${shippingMethodId === entry.id ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value={entry.id} {...form.register('shippingMethodId')} />
                        {entry.carrier === 'jnt' ? (
                          <img className="pay-method-logo" src="/assets/shipping/jnt.svg" alt="J&amp;T Express" width={112} height={38} />
                        ) : (
                          <b>{entry.name}</b>
                        )}
                        <span className="muted small"> · {entry.feeCentavos === 0 ? 'Free' : formatPeso(entry.feeCentavos)}</span>
                      </div>
                      {entry.carrier === 'jnt' && deliveryZone ? (
                        <p className="muted small" style={{ lineHeight: 1.55 }}>
                          {jntRateSummary(deliveryZone, parcelGrams)}
                          {jntLightRate && parcelGrams <= 500 ? <> · Light orders from {jntLightRate}.</> : null}
                        </p>
                      ) : entry.detail ? (
                        <p className="muted small">{entry.detail}</p>
                      ) : null}
                    </label>
                  ))}
                </div>
              </div>
              <div className="whitepanel" style={{ marginTop: 20 }}>
                <h2 style={{ font: '24px Georgia, serif', margin: '0 0 22px' }}>Payment Method</h2>
                <div className="payment-methods">
                  {state.settings.gcashEnabled ? (
                    <label className={`pay-option ${payment === 'gcash_manual' ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value="gcash_manual" {...form.register('payment')} />
                        <div className="pay-option__brand">
                          <img className="pay-method-logo" src="/assets/payments/gcash.svg" alt="GCash" width={112} height={38} />
                        </div>
                      </div>
                      {state.settings.gcashInstructions ? (
                        <p className="muted small">{state.settings.gcashInstructions}</p>
                      ) : state.settings.gcashNumber ? (
                        <p className="muted small">
                          Send to <b>{state.settings.gcashNumber}</b>
                          {state.settings.gcashAccountName ? ` · ${state.settings.gcashAccountName}` : null}. Then upload your receipt below.
                        </p>
                      ) : (
                        <p className="muted small">Pay in the GCash app, then upload your receipt below.</p>
                      )}
                    </label>
                  ) : null}
                  {state.settings.mayaEnabled ? (
                    <label className={`pay-option ${payment === 'maya_manual' ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value="maya_manual" {...form.register('payment')} />
                        <b>Maya</b>
                      </div>
                      <p className="muted small">
                        {state.settings.mayaInstructions ||
                          (state.settings.mayaNumber
                            ? `Send to ${state.settings.mayaNumber}${state.settings.mayaAccountName ? ` (${state.settings.mayaAccountName})` : ''}.`
                            : 'Add Maya details in Admin → Store Settings.')}
                      </p>
                    </label>
                  ) : null}
                  {state.settings.qrphEnabled ? (
                    <label className={`pay-option ${payment === 'qrph_manual' ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value="qrph_manual" {...form.register('payment')} />
                        <b>{state.settings.qrphDisplayName || 'QR Ph'}</b>
                      </div>
                      <p className="muted small">{state.settings.qrphInstructions || state.settings.qrphRecipientInfo || 'Scan and pay using QR Ph, then upload proof.'}</p>
                    </label>
                  ) : null}
                  {state.settings.codEnabled ? (
                    <label className={`pay-option ${payment === 'cod' ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value="cod" {...form.register('payment')} />
                        <b>Cash on Delivery</b>
                      </div>
                      <p className="muted small">Pay when your order arrives.</p>
                    </label>
                  ) : null}
                  {state.settings.xenditEnabled ? (
                    <label className={`pay-option ${payment === 'xendit' ? 'on' : ''}`}>
                      <div className="pay-option__row">
                        <input type="radio" value="xendit" {...form.register('payment')} />
                        <div className="pay-option__brand">
                          <img className="pay-method-logo" src="/assets/payments/xendit.svg" alt="Xendit" width={112} height={38} />
                        </div>
                      </div>
                      <p className="muted small">Card, e-wallet, and other options on a secure Xendit page after you place the order.</p>
                    </label>
                  ) : null}
                </div>
                {needsProof ? (
                  <div className="payment-proof-panel">
                    <p className="small" style={{ marginBottom: 12, lineHeight: 1.6 }}>
                      Send <b>{formatPeso(total)}</b> via {payment === 'gcash_manual' ? 'GCash' : payment === 'maya_manual' ? 'Maya' : 'QR Ph'}, then upload your receipt below.
                      {payment === 'gcash_manual' && state.settings.gcashNumber ? (
                        <> GCash: <b>{state.settings.gcashNumber}</b>
                          {state.settings.gcashAccountName ? ` (${state.settings.gcashAccountName})` : null}.</>
                      ) : null}
                    </p>
                    <Field label="Payment reference number *">
                      <input className="field-input" {...form.register('referenceNumber')} placeholder="Reference or transaction number" />
                    </Field>
                    <Field label="Proof of payment *">
                      <FileUploadField
                        accept="image/*,.pdf"
                        buttonLabel="Upload receipt"
                        fileName={proofFile?.name ?? null}
                        hint="Image or PDF"
                        onChange={(file) => setProofFile(file)}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </div>
            <aside className="whitepanel">
              <h2 style={{ font: '24px Georgia, serif' }}>Your Order</h2>
              <div className="line" />
              {detailed.map((line) => (
                <div className="row" key={`${line.productId}-${line.variantId}`} style={{ marginBottom: 18 }}>
                  <div className="thumb" style={{ width: 62, height: 65 }}>{line.product.imageUrl ? <img src={line.product.imageUrl} alt="" /> : <PackArt type={line.product.pack} />}</div>
                  <div style={{ flex: 1 }}>
                    <b className="small">{line.product.name}</b>
                    <div className="muted tiny">Qty: {line.quantity} · {line.variant?.label}</div>
                  </div>
                  <b className="small">{formatPeso(line.lineCentavos)}</b>
                </div>
              ))}
              <label className="fieldlabel" htmlFor="voucher">Voucher</label>
              <input id="voucher" className="field-input" placeholder="WELCOME10" {...form.register('voucher')} />
              <div className="line" />
              <div className="between small"><span>Subtotal</span><b>{formatPeso(subtotal)}</b></div>
              <div className="between small" style={{ marginTop: 16 }}><span>Voucher</span><b>{discount ? `− ${formatPeso(discount)}` : '—'}</b></div>
              <div className="between small" style={{ marginTop: 16 }}><span>Shipping</span><b>{formatPeso(shipping)}</b></div>
              <div className="line" />
              <div className="between"><b>Order Total</b><b className="price" style={{ fontSize: 24 }}>{formatPeso(total)}</b></div>
              <p className="muted tiny">Totals use catalog prices, delivery, and any voucher applied at checkout.</p>
              {formError ? <p className="form-error" role="alert">{formError}</p> : null}
              <button
                className="btn wide"
                style={{ marginTop: 25 }}
                type="submit"
                disabled={submitting || !deliveryOptions.length || (mode === 'production' && !user)}
              >
                {submitting ? 'PLACING ORDER…' : 'PLACE ORDER →'}
              </button>
              {mode === 'production' && !user ? (
                <p className="form-error tiny" style={{ textAlign: 'center', marginTop: 10 }}>
                  <Link to="/login?next=/checkout" style={{ fontWeight: 700 }}>Sign in</Link> to place an order.
                </p>
              ) : null}
              <p className="muted tiny" style={{ lineHeight: 1.7, textAlign: 'center' }}>
                By placing this order you agree to the <Link to="/policies/terms">Terms</Link> and <Link to="/policies/privacy">Privacy Policy</Link>.
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="form-group">
      <label className="fieldlabel">{label}</label>
      {children}
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  )
}
