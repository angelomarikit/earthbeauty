import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useStore } from '@/features/store/StoreContext'
import { getSupabase } from '@/lib/supabase'
import type { DemoUser } from '@/types'

const SESSION_KEY = 'ebw-session-v1'

type ProductionSession = {
  id: string
  email: string
  name: string
  phone: string
  role: DemoUser['role']
}

async function loadProductionSession(): Promise<ProductionSession | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data: sessionData } = await supabase.auth.getSession()
  const authUser = sessionData.session?.user
  if (!authUser) return null
  const email = authUser.email ?? ''
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', authUser.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle(),
  ])
  const role = roleRow?.role === 'admin' ? 'admin' : 'customer'
  return {
    id: authUser.id,
    email,
    name: profile?.full_name?.trim() || email,
    phone: profile?.phone ?? '',
    role,
  }
}

export type LoginResult = { error: string } | { error: null; role: DemoUser['role'] }

type AuthValue = {
  user: DemoUser | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<string | null>
  requestReset: (email: string) => Promise<string | null>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { state, mode, registerUser } = useStore()
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))
  const [productionUser, setProductionUser] = useState<ProductionSession | null>(null)

  useEffect(() => {
    if (mode !== 'production') return
    localStorage.removeItem(SESSION_KEY)
    setUserId(null)
    const supabase = getSupabase()
    if (!supabase) return
    void loadProductionSession().then(setProductionUser)
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void loadProductionSession().then(setProductionUser)
    })
    return () => subscription.subscription.unsubscribe()
  }, [mode])

  const user = useMemo(() => {
    if (mode === 'production') {
      if (!productionUser) return null
      return {
        id: productionUser.id,
        name: productionUser.name,
        email: productionUser.email,
        phone: productionUser.phone,
        password: '',
        role: productionUser.role,
        memberSince: '2026',
        addresses: [],
        demo: true as const,
      }
    }
    const local = state.users.find((entry) => entry.id === userId) ?? null
    if (local) return local
    if (productionUser) {
      return {
        id: productionUser.id,
        name: productionUser.name,
        email: productionUser.email,
        phone: productionUser.phone,
        password: '',
        role: productionUser.role,
        memberSince: '2026',
        addresses: [],
        demo: true as const,
      }
    }
    return null
  }, [mode, productionUser, state.users, userId])

  const api = useMemo<AuthValue>(
    () => ({
      user,
      login: async (email, password) => {
        if (mode === 'production') {
          const supabase = getSupabase()
          if (!supabase) return { error: 'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.' }
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
          if (error) {
            const hint =
              error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials')
                ? ' If this account was just created, confirm the email in Supabase or enable Auto confirm user.'
                : ''
            return { error: `${error.message}${hint}` }
          }
          const session = await loadProductionSession()
          if (!session) return { error: 'Signed in but session could not be loaded. Refresh and try again.' }
          flushSync(() => setProductionUser(session))
          return { error: null, role: session.role }
        }
        const found = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password)
        if (!found) return { error: 'Those sign-in details were not recognized.' }
        localStorage.setItem(SESSION_KEY, found.id)
        flushSync(() => setUserId(found.id))
        return { error: null, role: found.role }
      },
      logout: async () => {
        if (mode === 'production') await getSupabase()?.auth.signOut()
        setUserId(null)
        setProductionUser(null)
        localStorage.removeItem(SESSION_KEY)
      },
      register: async (input) => {
        if (mode === 'production') {
          const supabase = getSupabase()
          if (!supabase) return 'Supabase is not configured.'
          const { error } = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { full_name: input.name, phone: input.phone } } })
          return error ? error.message : 'Check your email to confirm the account. No session was started in this step.'
        }
        const created = registerUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
          password: input.password,
          role: 'customer',
          memberSince: String(new Date().getFullYear()),
          addresses: [],
        })
        if (typeof created === 'string') return created
        setUserId(created.id)
        localStorage.setItem(SESSION_KEY, created.id)
        return null
      },
      requestReset: async (email) => {
        if (mode === 'production') {
          const supabase = getSupabase()
          if (!supabase) return 'Supabase is not configured.'
          const { error } = await supabase.auth.resetPasswordForEmail(email)
          return error ? error.message : 'If the account exists, Supabase will send a reset email.'
        }
        const found = state.users.some((entry) => entry.email.toLowerCase() === email.toLowerCase())
        if (!found) return 'No demonstration account uses that email.'
        return 'Demo mode does not send email. Use the sample password shown on the sign-in page.'
      },
    }),
    [mode, registerUser, state.users, user],
  )

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
