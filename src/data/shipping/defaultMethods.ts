import { jntFeeCentavos } from '@/features/shipping/jntRates'
import type { DataMode } from '@/types'
import type { ShippingMethod } from '@/types'

/** Demo browser catalogue only. */
export const DEMO_JNT_IDS: Record<string, string> = {
  luzon: 'ship-jnt-luzon',
  manila: 'ship-jnt-manila',
  visayas: 'ship-jnt-visayas',
  mindanao: 'ship-jnt-mindanao',
  island: 'ship-jnt-island',
  pickup: 'ship-pickup-santa-rosa',
}

/** Matches supabase/migrations/0008_jnt_shipping_methods.sql */
export const PRODUCTION_SHIPPING_IDS: Record<string, string> = {
  luzon: 'a1000001-0001-4000-8000-000000000001',
  manila: 'a1000001-0001-4000-8000-000000000002',
  visayas: 'a1000001-0001-4000-8000-000000000003',
  mindanao: 'a1000001-0001-4000-8000-000000000004',
  island: 'a1000001-0001-4000-8000-000000000005',
  pickup: 'a1000001-0001-4000-8000-000000000010',
}

const ESTIMATE_GRAMS = 1100

function jntMethod(
  ids: Record<string, string>,
  zone: 'luzon' | 'manila' | 'visayas' | 'mindanao' | 'island',
  label: string,
): ShippingMethod {
  return {
    id: ids[zone],
    name: `J&T Express — ${label}`,
    feeCentavos: jntFeeCentavos(zone, ESTIMATE_GRAMS),
    detail: `Courier delivery from Santa Rosa, Laguna. Rate shown is J&T’s typical 1–3 kg bracket; final fee may vary by actual weight.`,
    active: true,
    carrier: 'jnt',
    jntZone: zone,
  }
}

export function defaultShippingMethods(mode: DataMode = 'demo'): ShippingMethod[] {
  const ids = mode === 'production' ? PRODUCTION_SHIPPING_IDS : DEMO_JNT_IDS
  return [
    jntMethod(ids, 'luzon', 'Luzon'),
    jntMethod(ids, 'manila', 'Metro Manila'),
    jntMethod(ids, 'visayas', 'Visayas'),
    jntMethod(ids, 'mindanao', 'Mindanao'),
    jntMethod(ids, 'island', 'Island'),
    {
      id: ids.pickup,
      name: 'Store pickup — Santa Rosa',
      feeCentavos: 0,
      detail: 'Pick up at Gran Esperanza Building, Balibago, City of Santa Rosa, Laguna.',
      active: true,
      carrier: 'pickup',
      jntZone: null,
    },
  ]
}
