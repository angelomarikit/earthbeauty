import { jntFeeCentavos } from '@/features/shipping/jntRates'
import type { ShippingMethod } from '@/types'

/** Stable IDs for demo mode; production uses UUIDs from migration 0008. */
export const DEMO_JNT_IDS: Record<string, string> = {
  luzon: 'ship-jnt-luzon',
  manila: 'ship-jnt-manila',
  visayas: 'ship-jnt-visayas',
  mindanao: 'ship-jnt-mindanao',
  island: 'ship-jnt-island',
  pickup: 'ship-pickup-santa-rosa',
}

const ESTIMATE_GRAMS = 1100

function jntMethod(zone: 'luzon' | 'manila' | 'visayas' | 'mindanao' | 'island', label: string): ShippingMethod {
  return {
    id: DEMO_JNT_IDS[zone],
    name: `J&T Express — ${label}`,
    feeCentavos: jntFeeCentavos(zone, ESTIMATE_GRAMS),
    detail: `Courier delivery from Santa Rosa, Laguna. Rate shown is J&T’s typical 1–3 kg bracket; final fee may vary by actual weight.`,
    active: true,
    carrier: 'jnt',
    jntZone: zone,
  }
}

export function defaultShippingMethods(): ShippingMethod[] {
  return [
    jntMethod('luzon', 'Luzon'),
    jntMethod('manila', 'Metro Manila'),
    jntMethod('visayas', 'Visayas'),
    jntMethod('mindanao', 'Mindanao'),
    jntMethod('island', 'Island'),
    {
      id: DEMO_JNT_IDS.pickup,
      name: 'Store pickup — Santa Rosa',
      feeCentavos: 0,
      detail: 'Pick up at Gran Esperanza Building, Balibago, City of Santa Rosa, Laguna.',
      active: true,
      carrier: 'pickup',
      jntZone: null,
    },
  ]
}
