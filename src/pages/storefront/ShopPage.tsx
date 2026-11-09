import { LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductGrid } from '@/components/product/ProductCard'
import { isOnSale } from '@/features/catalog/pricing'
import { useStore } from '@/features/store/StoreContext'
import { usePageMeta } from '@/lib/seo'
import type { Product } from '@/types'

const PAGE_SIZE = 6

function titleFor(categoryName: string, collection: string, query: string) {
  if (query) return `Search results`
  if (collection === 'best-sellers') return 'Best Sellers'
  if (collection === 'sale') return 'Sale'
  if (collection === 'new') return 'New Arrivals'
  if (categoryName) return categoryName
  return 'Shop All Products'
}

export function ShopPage() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const categorySlug = params.get('category') ?? ''
  const collection = params.get('collection') ?? ''
  const sort = params.get('sort') ?? 'featured'
  const max = Number(params.get('max') ?? 2000)
  const inStock = params.get('stock') !== '0'
  const onSale = params.get('sale') === '1'
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const category = state.categories.find((entry) => entry.slug === categorySlug)

  usePageMeta(`${titleFor(category?.name ?? '', collection, q)} · Earth Beauty & Wellness`, 'Browse the demonstration beauty and wellness catalogue.')

  function update(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) merged.delete(key)
      else merged.set(key, value)
    })
    if (!('page' in next)) merged.delete('page')
    setParams(merged)
  }

  const filtered = useMemo(() => {
    let items = state.products.filter((product) => product.active)
    if (q) items = items.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(q))
    if (category) items = items.filter((product) => product.categoryId === category.id)
    if (collection === 'best-sellers') items = items.filter((product) => product.bestSeller)
    if (collection === 'sale') items = items.filter((product) => isOnSale(product))
    if (collection === 'new') items = items.filter((product) => product.isNew)
    if (inStock) items = items.filter((product) => product.stock > 0)
    if (onSale) items = items.filter((product) => isOnSale(product))
    items = items.filter((product) => product.priceCentavos <= max * 100)
    const sorted = [...items]
    sorted.sort((a, b) => compareProducts(a, b, sort))
    return sorted
  }, [category, collection, inStock, max, onSale, q, sort, state.products])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const heading = titleFor(category?.name ?? '', collection, q)

  const filters = (
    <div className="whitepanel" style={{ padding: 20 }}>
      <b>FILTER PRODUCTS</b>
      <div className="line" />
      <b className="small">Categories</b>
      <label className="checkline">
        <input type="checkbox" checked={!categorySlug && !collection} onChange={() => update({ category: null, collection: null })} /> All Products
      </label>
      {state.categories
        .filter((entry) => entry.active && entry.slug !== 'new-arrivals')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((entry) => (
          <label key={entry.id} className="checkline">
            <input
              type="checkbox"
              checked={categorySlug === entry.slug}
              onChange={() => update({ category: categorySlug === entry.slug ? null : entry.slug, collection: null })}
            />
            {entry.name}
          </label>
        ))}
      <div className="line" />
      <b className="small">Price Range</b>
      <input
        className="range"
        style={{ ['--pct' as string]: `${(max / 2000) * 100}%` }}
        type="range"
        min={0}
        max={2000}
        step={50}
        value={max}
        aria-label="Maximum price"
        onChange={(event) => update({ max: event.target.value === '2000' ? null : event.target.value })}
      />
      <div className="between tiny muted">
        <span>₱ 0</span>
        <span>₱ {max.toLocaleString('en-PH')}{max >= 2000 ? '+' : ''}</span>
      </div>
      <div className="line" />
      <b className="small">Availability</b>
      <label className="checkline">
        <input type="checkbox" checked={inStock} onChange={() => update({ stock: inStock ? '0' : null })} /> In Stock
      </label>
      <label className="checkline">
        <input type="checkbox" checked={onSale} onChange={() => update({ sale: onSale ? null : '1' })} /> On Sale
      </label>
      <button className="btn outline wide" style={{ marginTop: 16 }} onClick={() => setParams(new URLSearchParams())}>
        CLEAR FILTERS
      </button>
    </div>
  )

  return (
    <div className="page">
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <b>{heading}</b>
        </div>
        <div className="shop-layout">
          <div className="filter-desktop">{filters}</div>
          <div>
            <div className="between" style={{ marginBottom: 21, gap: 16, alignItems: 'flex-end' }}>
              <div>
                <h1 className="page-title">{heading}</h1>
                <p className="muted small">{q ? `Matches for “${params.get('q')}”.` : 'Explore beauty and wellness essentials curated for you.'}</p>
              </div>
              <label className="pill">
                Sort by:
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(event) => update({ sort: event.target.value === 'featured' ? null : event.target.value })}
                  style={{ border: 0, background: 'transparent', fontWeight: 600 }}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                  <option value="best">Best selling</option>
                </select>
              </label>
            </div>
            <div className="between small" style={{ marginBottom: 15 }}>
              <span className="muted">
                Showing {from}–{to} of {filtered.length} products
              </span>
              <span className="muted">
                <LayoutGrid size={14} /> 
              </span>
            </div>
            <div className="mobile-tools" style={{ marginBottom: 14 }}>
              <button className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={14} /> Filter
              </button>
            </div>
            <ProductGrid products={visible} columns={3} />
            <div className="pager">
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <button key={number} className={`pill ${number === safePage ? 'selected' : ''}`} onClick={() => update({ page: String(number) })}>
                  {number}
                </button>
              ))}
              {safePage < pages ? (
                <button className="text-link" style={{ background: 'none', border: 0 }} onClick={() => update({ page: String(safePage + 1) })}>
                  Next →
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {filtersOpen ? (
        <>
          <button className="drawer-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
          <div className="drawer left">{filters}</div>
        </>
      ) : null}
    </div>
  )
}

function compareProducts(a: Product, b: Product, sort: string) {
  if (sort === 'newest') return +new Date(b.createdAt) - +new Date(a.createdAt)
  if (sort === 'price-asc') return a.priceCentavos - b.priceCentavos
  if (sort === 'price-desc') return b.priceCentavos - a.priceCentavos
  if (sort === 'best') return b.demoUnitsSold - a.demoUnitsSold
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  return b.demoUnitsSold - a.demoUnitsSold
}
