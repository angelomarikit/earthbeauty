/** J&T public track page (customers paste the waybill there). */
export const JNT_PH_TRACK_URL = 'https://www.jtexpress.ph/trajectoryQuery'

export function isJntShipping(shippingMethodName: string) {
  return /j\s*&\s*t|jnt\s*express/i.test(shippingMethodName)
}

export function normalizeBillCode(value: string) {
  return value.trim().replace(/\s+/g, '')
}

export type JntTrackEvent = {
  at: string
  status: string
  location?: string
}

export type JntTrackResult = {
  mode: 'link' | 'live'
  trackUrl: string
  billCode: string
  events: JntTrackEvent[]
  message?: string
}
