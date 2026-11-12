/** J&T Express list rates shipping from Luzon (seller: Santa Rosa, Laguna). Source: J&T Luzon-origin table, ~2025. */
export type JntZone = 'luzon' | 'manila' | 'visayas' | 'mindanao' | 'island'

export const JNT_SHIP_FROM = 'Santa Rosa, Laguna'

type WeightBracket = '0_500g' | '500g_1kg' | '1_3kg'

const RATES_PESOS: Record<JntZone, Record<WeightBracket, number>> = {
  luzon: { '0_500g': 85, '500g_1kg': 155, '1_3kg': 180 },
  manila: { '0_500g': 95, '500g_1kg': 165, '1_3kg': 190 },
  visayas: { '0_500g': 100, '500g_1kg': 180, '1_3kg': 200 },
  mindanao: { '0_500g': 105, '500g_1kg': 195, '1_3kg': 220 },
  island: { '0_500g': 115, '500g_1kg': 205, '1_3kg': 230 },
}

/** Maps PSA region names (PSGC) to J&T rate columns for shipments from Luzon. */
export function regionToJntZone(regionName: string): JntZone {
  const r = regionName.toLowerCase()
  if (r.includes('national capital') || r.includes('(ncr)')) return 'manila'
  if (r.includes('visayas') || r.includes('region vi') || r.includes('region vii') || r.includes('region viii')) {
    return 'visayas'
  }
  if (
    r.includes('mindanao') ||
    r.includes('barmm') ||
    r.includes('bangsamoro') ||
    r.includes('region ix') ||
    r.includes('region x') ||
    r.includes('region xi') ||
    r.includes('region xii')
  ) {
    return 'mindanao'
  }
  if (r.includes('mimaropa') || r.includes('region iv-b') || r.includes('caraga') || r.includes('region xiii')) {
    return 'island'
  }
  return 'luzon'
}

export function estimateParcelWeightGrams(itemCount: number): number {
  if (itemCount <= 1) return 450
  if (itemCount <= 3) return 1100
  return 2500
}

function weightToBracket(grams: number): WeightBracket {
  if (grams <= 500) return '0_500g'
  if (grams <= 1000) return '500g_1kg'
  return '1_3kg'
}

export function jntFeeCentavos(zone: JntZone, weightGrams: number): number {
  const bracket = weightToBracket(weightGrams)
  return RATES_PESOS[zone][bracket] * 100
}

export function jntBracketLabel(bracket: WeightBracket): string {
  switch (bracket) {
    case '0_500g':
      return 'up to 500 g'
    case '500g_1kg':
      return '500 g – 1 kg'
    default:
      return '1 – 3 kg'
  }
}

export function jntRateSummary(zone: JntZone, weightGrams: number): string {
  const bracket = weightToBracket(weightGrams)
  const pesos = RATES_PESOS[zone][bracket]
  return `J&T est. ₱${pesos} (${jntBracketLabel(bracket)}) · ships from ${JNT_SHIP_FROM}`
}
