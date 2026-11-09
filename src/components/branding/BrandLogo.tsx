import { createContext, useContext, type ReactNode } from 'react'

export type BrandSurfaceTone = 'light' | 'dark' | 'pink' | 'green'
export type BrandLogoVariant = 'auto' | 'light' | 'dark'
export type BrandLogoSize = 'sm' | 'md' | 'lg'

const BrandSurfaceContext = createContext<BrandSurfaceTone>('light')

const heights: Record<BrandLogoSize, number> = { sm: 56, md: 72, lg: 176 }
const fullAspect = 563 / 619
const symbolAspect = 563 / 437

export function BrandSurface({ tone, children }: { tone: BrandSurfaceTone; children: ReactNode }) {
  return <BrandSurfaceContext.Provider value={tone}>{children}</BrandSurfaceContext.Provider>
}

export function BrandLogo({
  variant = 'auto',
  size = 'md',
  className,
  priority = false,
  symbol = false,
}: {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  className?: string
  priority?: boolean
  symbol?: boolean
}) {
  const surface = useContext(BrandSurfaceContext)
  const tone: BrandSurfaceTone = variant === 'auto' ? surface : variant === 'dark' ? 'dark' : 'light'
  const plate = tone === 'dark' || tone === 'pink' || tone === 'green'
  const height = heights[size]
  const width = Math.round(height * (symbol ? symbolAspect : fullAspect))
  const png = symbol ? '/assets/branding/earth-logo-symbol.png' : '/assets/branding/earth-logo-transparent.png'
  const webp = symbol ? '/assets/branding/earth-logo-symbol.webp' : '/assets/branding/earth-logo-transparent.webp'

  return (
    <span className={`brand-logo${plate ? ' brand-logo-plate' : ''}${className ? ` ${className}` : ''}`}>
      <picture>
        <source srcSet={webp} type="image/webp" />
        <img
          src={png}
          alt="Earth Beauty and Wellness OPC"
          width={width}
          height={height}
          style={{ height, width: 'auto', objectFit: 'contain' }}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
    </span>
  )
}
