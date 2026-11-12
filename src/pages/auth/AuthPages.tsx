import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { BrandLogo } from '@/components/branding/BrandLogo'
import { useAuth } from '@/features/auth/AuthContext'
import { usePageMeta } from '@/lib/seo'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(4, 'Enter your password'),
})

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  usePageMeta('Sign in · Earth Beauty & Wellness', 'Sign in to your account.')
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="whitepanel">
          <div className="auth-logo"><BrandLogo size="lg" variant="light" priority /></div>
          <div className="eyebrow">ACCOUNT</div>
          <h1 className="page-title">Sign in</h1>
          <form
            style={{ marginTop: 16 }}
            onSubmit={form.handleSubmit(async (values) => {
              const result = await login(values.email, values.password)
              if (!result.ok || !result.role) {
                setError(result.error ?? 'Sign-in failed.')
                return
              }
              const next = params.get('next') || (result.role === 'admin' ? '/admin' : '/account')
              navigate(next)
            })}
          >
            <div className="form-group"><label className="fieldlabel">Email</label><input className="field-input" {...form.register('email')} /></div>
            <div className="form-group"><label className="fieldlabel">Password</label><input className="field-input" type="password" {...form.register('password')} /></div>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn wide" type="submit">SIGN IN</button>
          </form>
          <p className="small" style={{ marginTop: 16 }}>
            <Link to="/forgot-password" className="text-link">Forgot password</Link> · <Link to="/register" className="text-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6, 'Use at least 6 characters'),
})

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', phone: '', password: '' } })
  usePageMeta('Create account · Earth Beauty & Wellness', 'Create a demonstration account.')
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="whitepanel">
          <div className="auth-logo"><BrandLogo size="lg" variant="light" /></div>
          <h1 className="page-title">Create account</h1>
          <p className="muted small" style={{ margin: '8px 0 16px' }}>Saved in this browser until Supabase Auth is connected.</p>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const result = await register(values)
              if (result) setError(result)
              else navigate('/account')
            })}
          >
            <div className="form-group"><label className="fieldlabel">Full name</label><input className="field-input" {...form.register('name')} /></div>
            <div className="form-group"><label className="fieldlabel">Email</label><input className="field-input" {...form.register('email')} /></div>
            <div className="form-group"><label className="fieldlabel">Mobile</label><input className="field-input" {...form.register('phone')} /></div>
            <div className="form-group"><label className="fieldlabel">Password</label><input className="field-input" type="password" {...form.register('password')} /></div>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn wide" type="submit">CREATE ACCOUNT</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export function ForgotPasswordPage() {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  usePageMeta('Forgot password · Earth Beauty & Wellness', 'Password help for the demonstration store.')
  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="whitepanel">
          <h1 className="page-title">Forgot password</h1>
          <p className="muted small" style={{ margin: '8px 0 16px' }}>Email delivery starts only after Supabase Auth is connected.</p>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setMessage(await requestReset(email))
            }}
          >
            <div className="form-group"><label className="fieldlabel">Email</label><input className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            {message ? <div className="notice">{message}</div> : null}
            <button className="btn" type="submit">CONTINUE</button>
          </form>
          <p style={{ marginTop: 14 }}><Link to="/login" className="text-link">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
