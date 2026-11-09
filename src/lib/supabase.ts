import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDataMode } from '@/lib/mode'

let client: SupabaseClient | null = null

export function getSupabase() {
  if (getDataMode() !== 'production') return null
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}
