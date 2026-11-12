import { getSupabaseClient } from '@/lib/supabase'
import { uid } from '@/lib/format'

const PRODUCT_BUCKET = 'product-images'
const PROOF_BUCKET = 'payment-proofs'
const QR_BUCKET = 'payment-qr'

const MAX_IMAGE_BYTES = 5_000_000

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'application/pdf') return 'pdf'
  return 'bin'
}

async function uploadFile(bucket: string, path: string, file: File, upsert: boolean) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('File is too large. Use an image under 5 MB.')
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  if (bucket === PRODUCT_BUCKET) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { path, publicUrl: data.publicUrl }
  }
  return { path, publicUrl: null as string | null }
}

export async function uploadProductImage(file: File, productId: string) {
  const path = `products/${productId}/${uid('img')}.${extensionFor(file)}`
  const result = await uploadFile(PRODUCT_BUCKET, path, file, false)
  return result.publicUrl!
}

export async function uploadBrandLogo(file: File, brandId: string) {
  const path = `brands/${brandId}/${uid('logo')}.${extensionFor(file)}`
  const result = await uploadFile(PRODUCT_BUCKET, path, file, true)
  return result.publicUrl!
}

export async function uploadCategoryImage(file: File, categoryId: string) {
  const path = `categories/${categoryId}/${uid('cat')}.${extensionFor(file)}`
  const result = await uploadFile(PRODUCT_BUCKET, path, file, true)
  return result.publicUrl!
}

export async function uploadPaymentProof(file: File, orderId: string) {
  const path = `orders/${orderId}/${uid('proof')}.${extensionFor(file)}`
  const result = await uploadFile(PROOF_BUCKET, path, file, false)
  return result.path
}

export async function uploadPaymentQr(file: File, kind: 'gcash' | 'maya' | 'qrph') {
  const path = `${kind}/${uid('qr')}.${extensionFor(file)}`
  const result = await uploadFile(QR_BUCKET, path, file, true)
  return result.path
}

export async function signedProofUrl(storagePath: string, expiresIn = 3600) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(storagePath, expiresIn)
  if (error) return null
  return data.signedUrl
}
