import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { BrandLogo } from '@/components/branding/BrandLogo'
import { PackArt } from '@/components/product/ProductCard'
import { cartDetailed, couponDiscount } from '@/features/catalog/pricing'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/store/StoreContext'
import { regions } from '@/data/demo/locations'
import { formatPeso } from '@/lib/format'
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
  payment: z.enum(['cod', 'gcash']),
  voucher: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CheckoutPage() {
  const { state, placeOrder } = useStore()
  const { lines, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [proofName, setProofName] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const detailed = cartDetailed(state, lines).filter((line) => line.quantity > 0)
  const subtotal = detailed.reduce((sum, line) => sum + line.lineCentavos, 0)
  usePageMeta('Checkout · Earth Beauty & Wellness', 'Demonstration checkout. No real payment is captured.')

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
      payment: state.settings.gcashEnabled ? 'gcash' : 'cod',
      voucher: sessionStorage.getItem('ebw-voucher') ?? '',
    },
  })

  const regionName = form.watch('region')
  const provinceName = form.watch('province')
  const cityName = form.watch('city')
  const shippingMethodId = form.watch('shippingMethodId')
  const voucher = form.watch('voucher')
  const payment = form.watch('payment')
  const region = regions.find((entry) => entry.name === regionName)
  const province = region?.provinces.find((entry) => entry.name === provinceName)
  const city = province?.cities.find((entry) => entry.name === cityName)
  const method = state.shippingMethods.find((entry) => entry.id === shippingMethodId)
  const coupon = state.coupons.find((entry) => entry.active && entry.code.toLowerCase() === (voucher ?? '').trim().toLowerCase())
  const discount = couponDiscount(coupon, subtotal)
  const shipping = method?.feeCentavos ?? 0
  const total = Math.max(0, subtotal - discount + shipping)
  const methods = useMemo(() => state.shippingMethods.filter((entry) => entry.active), [state.shippingMethods])

  const onSubmit = form.handleSubmit((values) => {
    if (!detailed.length) {
      setFormError('Your cart is empty.')
      return
    }
    const result = placeOrder({
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
      paymentMethod: values.payment,
      notes: values.notes ?? '',
      proofName,
    })
    if (typeof result === 'string') {
      setFormError(result)
      return
    }
    clear()
    sessionStorage.removeItem('ebw-voucher')
    navigate(`/order-confirmation/${result.orderNumber}`)
  })

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
        <div className="notice">Demonstration checkout. Cash on delivery and GCash are simulated. No payment is processed and no order is sent to the store.</div>
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
                <div className="grid2">
                  <Field label="Region *" error={form.formState.errors.region?.message}>
                    <select className="field-input" {...form.register('region')} onChange={(event) => { form.setValue('region', event.target.value); form.setValue('province', ''); form.setValue('city', ''); form.setValue('barangay', '') }}>
                      <option value="">Select region</option>
                      {regions.map((entry) => <option key={entry.name}>{entry.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Province *" error={form.formState.errors.province?.message}>
                    <select className="field-input" {...form.register('province')} onChange={(event) => { form.setValue('province', event.target.value); form.setValue('city', ''); form.setValue('barangay', '') }}>
                      <option value="">Select province</option>
                      {region?.provinces.map((entry) => <option key={entry.name}>{entry.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid2">
                  <Field label="City / Municipality *" error={form.formState.errors.city?.message}>
                    <select className="field-input" {...form.register('city')} onChange={(event) => { form.setValue('city', event.target.value); form.setValue('barangay', '') }}>
                      <option value="">Select city</option>
                      {province?.cities.map((entry) => <option key={entry.name}>{entry.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Barangay *" error={form.formState.errors.barangay?.message}>
                    <select className="field-input" {...form.register('barangay')}>
                      <option value="">Select barangay</option>
                      {city?.barangays.map((entry) => <option key={entry}>{entry}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Postal Code *" error={form.formState.errors.postalCode?.message}>
                  <input className="field-input" style={{ width: '50%' }} {...form.register('postalCode')} />
                </Field>
                <Field label="Delivery notes">
                  <textarea className="field-input" {...form.register('notes')} placeholder="Optional note for the demonstration order" />
                </Field>
                <div className="form-group">
                  <div className="fieldlabel">Delivery method</div>
                  {methods.map((entry) => (
                    <label key={entry.id} className={`pay-option ${shippingMethodId === entry.id ? 'on' : ''}`}>
                      <input type="radio" value={entry.id} {...form.register('shippingMethodId')} /> <b>{entry.name}</b>
                      <span className="muted small"> · {entry.feeCentavos === 0 ? 'No fee' : formatPeso(entry.feeCentavos)}</span>
                      <p className="muted small">{entry.detail}</p>
                    </label>
                  ))}
                </div>
              </div>
              <div className="whitepanel" style={{ marginTop: 20 }}>
                <h2 style={{ font: '24px Georgia, serif', margin: '0 0 22px' }}>Payment Method</h2>
                {state.settings.gcashEnabled ? (
                  <label className={`pay-option ${payment === 'gcash' ? 'on' : ''}`}>
                    <input type="radio" value="gcash" {...form.register('payment')} /> <b>GCash / Manual E-Wallet Payment</b>
                    <p className="muted small">Simulated. {state.settings.gcashInstructions}</p>
                    {payment === 'gcash' ? (
                      <div style={{ marginTop: 10 }}>
                        <div className="small">Send the order total to {state.settings.gcashNumber} ({state.settings.gcashAccountName}), then attach a receipt name for the preview.</div>
                        <input className="field-input" style={{ marginTop: 8 }} type="file" accept="image/*,.pdf" onChange={(event) => setProofName(event.target.files?.[0]?.name ?? null)} />
                      </div>
                    ) : null}
                  </label>
                ) : null}
                {state.settings.codEnabled ? (
                  <label className={`pay-option ${payment === 'cod' ? 'on' : ''}`}>
                    <input type="radio" value="cod" {...form.register('payment')} /> <b>Cash on Delivery</b> <span className="muted small">(simulated, where available)</span>
                  </label>
                ) : null}
                <div className="pay-option" style={{ marginTop: 12, opacity: 0.7 }}>
                  <b>PayMongo</b>
                  <p className="muted small">{state.settings.paymongoNote}</p>
                </div>
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
              <p className="muted tiny">Totals are calculated from the catalogue, delivery method, and voucher in this preview.</p>
              {formError ? <p className="form-error">{formError}</p> : null}
              <button className="btn wide" style={{ marginTop: 25 }} type="submit">PLACE ORDER →</button>
              <p className="muted tiny" style={{ lineHeight: 1.7, textAlign: 'center' }}>
                By placing this demonstration order you agree to the draft <Link to="/policies/terms">Terms</Link> and <Link to="/policies/privacy">Privacy Policy</Link>.
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
