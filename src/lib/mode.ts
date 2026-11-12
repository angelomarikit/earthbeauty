import type { DataMode } from '@/types'

export function getDataMode(): DataMode {
  const requested = (import.meta.env.VITE_DATA_MODE ?? '').trim().toLowerCase()
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (requested === 'demo') return 'demo'
  if (requested === 'production') return 'production'
  if (url && key) return 'production'
  return 'demo'
}

export const DATA_MODE = getDataMode()
