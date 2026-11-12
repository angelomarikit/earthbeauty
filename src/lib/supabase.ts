import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDataMode } from '@/lib/mode'

let client: SupabaseClient | null = null

export function getSupabase() {
  if (getDataMode() !== 'production') return null
  return getSupabaseClient()
}

/** Supabase client when URL + anon key exist (used for auth even during misconfigured builds). */
export function getSupabaseClient() {
  if (client) return client
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}
