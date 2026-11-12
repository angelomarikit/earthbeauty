import type { Product, ProductImage } from '@/types'

export function productHeroUrl(product: Pick<Product, 'images' | 'imageUrl'>) {
  const images = product.images ?? []
  const hero = images.find((image) => image.isHero) ?? images[0]
  return hero?.url ?? product.imageUrl
}

export function productThumbnailUrl(product: Pick<Product, 'images' | 'imageUrl'>) {
  const images = product.images ?? []
  const thumb = images.find((image) => image.isThumbnail)
  if (thumb) return thumb.url
  const hero = images.find((image) => image.isHero)
  if (hero) return hero.url
  return images[0]?.url ?? product.imageUrl
}

export function syncProductImageUrl<T extends Product>(product: T): T {
  return { ...product, imageUrl: productThumbnailUrl(product) }
}

export function normalizeProductImages(product: Product): Product {
  const images = product.images ?? []
  if (images.length) return { ...product, images }
  if (product.imageUrl) {
    return {
      ...product,
      images: [
        {
          id: `legacy-${product.id}`,
          url: product.imageUrl,
          altText: product.name,
          sortOrder: 0,
          isHero: true,
          isThumbnail: true,
        },
      ],
    }
  }
  return { ...product, images: [] }
}

export function setUniqueHero(images: ProductImage[], id: string): ProductImage[] {
  return images.map((image) => ({ ...image, isHero: image.id === id }))
}

export function setUniqueThumbnail(images: ProductImage[], id: string): ProductImage[] {
  return images.map((image) => ({ ...image, isThumbnail: image.id === id }))
}
