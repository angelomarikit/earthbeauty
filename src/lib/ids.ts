/** UUID v4 (Postgres-compatible). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/** Demo-only synthetic variant ids (never valid in Supabase). */
export function isSyntheticVariantId(id: string): boolean {
  return !isUuid(id)
}

export function isDemoCatalogId(id: string): boolean {
  return !isUuid(id)
}
