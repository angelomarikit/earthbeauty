import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useStore } from '@/features/store/StoreContext'
import { getSupabase } from '@/lib/supabase'
import type { DemoUser } from '@/types'

const SESSION_KEY = 'ebw-session-v1'

type AuthValue = {
  user: DemoUser | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<string | null>
  requestReset: (email: string) => Promise<string | null>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { state, mode, registerUser } = useStore()
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))
  const [remoteEmail, setRemoteEmail] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'production') return
    const supabase = getSupabase()
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setRemoteEmail(data.session?.user.email ?? null)
    })
  }, [mode])

  const user = useMemo(() => {
    const local = state.users.find((entry) => entry.id === userId) ?? null
    if (local) return local
    if (remoteEmail) {
      return {
        id: 'remote',
        name: remoteEmail,
        email: remoteEmail,
        phone: '',
        password: '',
        role: 'customer' as const,
        memberSince: '2026',
        addresses: [],
        demo: true as const,
      }
    }
    return null
  }, [remoteEmail, state.users, userId])

  const api = useMemo<AuthValue>(
    () => ({
      user,
      login: async (email, password) => {
        if (mode === 'production') {
          const supabase = getSupabase()
          if (!supabase) return 'Supabase is not configured.'
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) return error.message
          setRemoteEmail(email)
          return null
        }
        const found = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password)
        if (!found) return 'Those sign-in details were not recognized.'
        localStorage.setItem(SESSION_KEY, found.id)
        flushSync(() => setUserId(found.id))
        return null
      },
      logout: async () => {
        if (mode === 'production') await getSupabase()?.auth.signOut()
        setUserId(null)
        setRemoteEmail(null)
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
