import { Link } from 'react-router-dom'
import type { Brand } from '@/types'

type BrandSliderProps = {
  brands: Brand[]
  brandMark: (name: string) => string
}

export function BrandSlider({ brands, brandMark }: BrandSliderProps) {
  if (brands.length === 0) return null

  const loop = [...brands, ...brands]

  return (
    <div className="brand-slider" aria-roledescription="carousel" aria-label="Brand collections">
      <div className="brand-slider-track">
        {loop.map((brand, index) => (
          <Link
            key={`${brand.id}-${index}`}
            className="cat brand-slide"
            to={`/shop?brand=${brand.slug}`}
            aria-hidden={index >= brands.length ? true : undefined}
            tabIndex={index >= brands.length ? -1 : undefined}
          >
            <div className="cat-img" style={{ background: brand.tint }}>
              {brand.logoUrl ? <img src={brand.logoUrl} alt="" /> : brandMark(brand.name)}
            </div>
            <strong>{brand.name}</strong>
            <small>{brand.blurb}</small>
          </Link>
        ))}
      </div>
    </div>
  )
}
