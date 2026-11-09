import type { DataMode } from '@/types'

export function getDataMode(): DataMode {
  const requested = import.meta.env.VITE_DATA_MODE
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (requested === 'production' && url && key) return 'production'
  return 'demo'
}

export const DATA_MODE = getDataMode()
