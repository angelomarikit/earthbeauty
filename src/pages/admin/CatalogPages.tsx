import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminConfirmModal, AdminTextPromptModal } from '@/components/admin/AdminModal'
import { FileUploadField } from '@/components/forms/FileUploadField'
import { PackArt } from '@/components/product/ProductCard'
import { brandName, categoryName } from '@/features/catalog/pricing'
import { useStore } from '@/features/store/StoreContext'
import { entityUuid, formatPeso, slugify, uid } from '@/lib/format'
import { uploadBrandLogo, uploadCategoryImage, uploadProductImage } from '@/services/storageUpload'
import type { Brand, Category, Product, Variant } from '@/types'

export function ProductsAdminPage() {
  const { state, saveProduct, deleteProduct, mode } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('name')
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const products = useMemo(() => {
    let items = state.products.filter((product) => product.name.toLowerCase().includes(q.toLowerCase()) || product.sku.toLowerCase().includes(q.toLowerCase()))
    if (status === 'active') items = items.filter((product) => product.active)
    if (status === 'hidden') items = items.filter((product) => !product.active)
    items = [...items].sort((a, b) => (sort === 'price' ? a.priceCentavos - b.priceCentavos : sort === 'stock' ? a.stock - b.stock : a.name.localeCompare(b.name)))
    return items
  }, [q, sort, state.products, status])

  return (
    <>
      <div className="between" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow">CATALOGUE</div>
          <h1 style={{ font: '31px Georgia, serif' }}>Products</h1>
          <p className="muted small">
            {mode === 'production' ? 'Live catalogue synced with Supabase.' : 'Demonstration products. Changes stay in this browser.'}
          </p>
        </div>
        <Link className="btn" to="/admin/products/new">＋ ADD NEW PRODUCT</Link>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="field-input" style={{ maxWidth: 280 }} placeholder="Search name or SKU" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="field-input" style={{ maxWidth: 160 }} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
        <select className="field-input" style={{ maxWidth: 160 }} value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="stock">Stock</option>
        </select>
      </div>
      <div className="whitepanel" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th></th><th>Product</th><th>SKU</th><th>Brand</th><th>Category</th><th>Regular</th><th>Sale</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><div className="thumb" style={{ width: 54, height: 54 }}>{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <PackArt type={product.pack} />}</div></td>
                  <td><b>{product.name}</b></td>
                  <td>{product.sku}</td>
                  <td className="small">{brandName(state, product.brandId, '—')}</td>
                  <td>{categoryName(state, product.categoryId)}</td>
                  <td>{formatPeso(product.compareAtCentavos ?? product.priceCentavos)}</td>
                  <td>{formatPeso(product.priceCentavos)}</td>
                  <td>{product.stock}</td>
                  <td><span className={product.active ? 'status' : 'status muted'}>{product.active ? 'Active' : 'Hidden'}</span></td>
                  <td>
                    <div className="action-row">
                      <Link to={`/admin/products/${product.id}`} className="btn-action">Edit</Link>
                      <button type="button" className="btn-action ghost" onClick={() => saveProduct({ ...product, active: !product.active })}>{product.active ? 'Hide' : 'Activate'}</button>
                      <button type="button" className="btn-action danger" onClick={() => setPendingDelete(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete product?'}
        description={
          mode === 'production'
            ? 'This permanently removes the product from your catalogue.'
            : 'This removes it from the demonstration catalogue in this browser.'
        }
        confirmLabel="DELETE"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteProduct(pendingDelete.id)
        }}
      />
    </>
  )
}

export function ProductFormPage() {
  const { id } = useParams()
  const { state, saveProduct, mode } = useStore()
  const navigate = useNavigate()
  const existing = state.products.find((product) => product.id === id)
  const [form, setForm] = useState<Product>(() => existing ?? blankProduct(state.categories[0]?.id ?? '', state.brands[0]?.id ?? null, mode === 'production'))
  useEffect(() => {
    setForm(existing ?? blankProduct(state.categories[0]?.id ?? '', state.brands[0]?.id ?? null, mode === 'production'))
    // Reload the form only when the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  const [error, setError] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void (async () => {
          if (!form.name.trim()) return setError('Enter a product name.')
          if (!form.categoryId) return setError('Choose a category.')
          if (!form.brandId) return setError('Choose a brand.')
          const slug = slugify(form.slug || form.name)
          if (state.products.some((product) => product.slug === slug && product.id !== form.id)) return setError('That link is already used.')
          const variants = form.variants.map((variant) => ({ ...variant, stock: Math.max(0, variant.stock), priceCentavos: Math.max(0, variant.priceCentavos) }))
          const stock = variants.reduce((sum, variant) => sum + variant.stock, 0)
          setSaving(true)
          setError(null)
          try {
            let imageUrl = form.imageUrl
            if (mode === 'production' && pendingImage) {
              imageUrl = await uploadProductImage(pendingImage, form.id)
            }
            saveProduct({
              ...form,
              slug,
              variants,
              stock,
              imageUrl,
              priceCentavos: variants[0]?.priceCentavos ?? form.priceCentavos,
              demo: true,
            })
            navigate('/admin/products')
          } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'Could not save the product.')
          } finally {
            setSaving(false)
          }
        })()
      }}
    >
      <div className="between" style={{ marginBottom: 18 }}>
        <h1 style={{ font: '31px Georgia, serif' }}>{existing ? 'Edit product' : 'Add product'}</h1>
        <button className="btn" type="submit" disabled={saving}>{saving ? 'SAVING…' : 'SAVE PRODUCT'}</button>
      </div>
      {error ? <div className="form-error" style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#fff5f8' }}>{error}</div> : null}
      <div className="grid2">
        <div className="whitepanel">
          <Field label="Product name"><input className="field-input" value={form.name} onChange={(event) => { update('name', event.target.value); if (!existing) update('slug', slugify(event.target.value)) }} /></Field>
          <Field label="Slug"><input className="field-input" value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} /></Field>
          <Field label="Description"><textarea className="field-input" value={form.description} onChange={(event) => update('description', event.target.value)} /></Field>
          <Field label="Category">
            <select className="field-input" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
              {state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Brand">
            <select className="field-input" value={form.brandId ?? ''} onChange={(event) => update('brandId', event.target.value || null)} required>
              <option value="">Select brand…</option>
              {state.brands.filter((brand) => brand.active).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </Field>
          <Field label="SKU"><input className="field-input" value={form.sku} onChange={(event) => update('sku', event.target.value)} /></Field>
          <div className="grid2">
            <Field label="Sale price (₱)"><input className="field-input" type="number" min={0} value={form.priceCentavos / 100} onChange={(event) => update('priceCentavos', Math.round(Number(event.target.value) * 100))} /></Field>
            <Field label="Regular price (₱)"><input className="field-input" type="number" min={0} value={(form.compareAtCentavos ?? 0) / 100} onChange={(event) => update('compareAtCentavos', Math.round(Number(event.target.value) * 100) || null)} /></Field>
          </div>
          <Field label="Badge"><input className="field-input" value={form.badge ?? ''} onChange={(event) => update('badge', event.target.value || null)} /></Field>
          <label className="checkline"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> Featured on homepage</label>
          <label className="checkline"><input type="checkbox" checked={form.isNew} onChange={(event) => update('isNew', event.target.checked)} /> New arrival</label>
          <label className="checkline"><input type="checkbox" checked={form.bestSeller} onChange={(event) => update('bestSeller', event.target.checked)} /> Best seller</label>
          <label className="checkline"><input type="checkbox" checked={form.active} onChange={(event) => update('active', event.target.checked)} /> Active</label>
        </div>
        <div>
          <div className="whitepanel">
            <div className="fieldlabel">Product image</div>
            <div className="pimg" style={{ borderRadius: 10 }}>{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <PackArt type={form.pack} />}</div>
            <FileUploadField
              buttonLabel="Upload product image"
              fileName={pendingImage?.name ?? (form.imageUrl ? 'Image selected' : null)}
              hint="JPG, PNG, or WebP · max 5 MB in production"
              onChange={(file) => {
                if (!file) return
                if (mode === 'production') {
                  setPendingImage(file)
                  update('imageUrl', URL.createObjectURL(file))
                  return
                }
                if (file.size > 400_000) {
                  setError('Choose an image under 400 KB for this browser preview.')
                  return
                }
                const reader = new FileReader()
                reader.onload = () => update('imageUrl', String(reader.result))
                reader.readAsDataURL(file)
              }}
            />
          </div>
          <div className="whitepanel" style={{ marginTop: 16 }}>
            <div className="between"><b>Variations</b><button type="button" className="btn outline compact" onClick={() => update('variants', [...form.variants, blankVariant(form)])}>＋ Add variation</button></div>
            {form.variants.map((variant, index) => (
              <div key={variant.id} className="grid2" style={{ marginTop: 12 }}>
                <input className="field-input" value={variant.label} aria-label="Variation name" onChange={(event) => updateVariant(setForm, index, { label: event.target.value })} />
                <input className="field-input" type="number" min={0} value={variant.priceCentavos / 100} aria-label="Variation price" onChange={(event) => updateVariant(setForm, index, { priceCentavos: Math.round(Number(event.target.value) * 100) })} />
                <input className="field-input" value={variant.sku} aria-label="Variation SKU" onChange={(event) => updateVariant(setForm, index, { sku: event.target.value })} />
                <input className="field-input" type="number" min={0} value={variant.stock} aria-label="Variation stock" onChange={(event) => updateVariant(setForm, index, { stock: Math.max(0, Number(event.target.value)) })} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}

function updateVariant(setForm: Dispatch<SetStateAction<Product>>, index: number, patch: Partial<Variant>) {
  setForm((current) => ({
    ...current,
    variants: current.variants.map((variant, itemIndex) => (itemIndex === index ? { ...variant, ...patch } : variant)),
  }))
}

function blankVariant(product: Product): Variant {
  return { id: uid('var'), label: 'New size', sku: `${product.sku}-NEW`, priceCentavos: product.priceCentavos, compareAtCentavos: product.compareAtCentavos, stock: 0, active: true }
}

function blankProduct(categoryId: string, brandId: string | null, production = false): Product {
  const id = production ? entityUuid() : uid('p')
  return {
    id,
    name: '',
    slug: '',
    description: 'Demonstration product — not live inventory.',
    howToUse: 'Replace this text with the real directions.',
    shippingNote: 'Shipping is confirmed at checkout.',
    categoryId,
    brandId,
    sku: `EBW-${id.slice(-4).toUpperCase()}`,
    priceCentavos: 0,
    compareAtCentavos: null,
    stock: 0,
    badge: null,
    pack: 'bottle',
    gallery: ['bottle', 'jar', 'tube', 'tall'],
    imageUrl: null,
    featured: false,
    isNew: true,
    bestSeller: false,
    active: true,
    variants: [{ id: uid('var'), label: 'Standard', sku: `EBW-${id.slice(-4).toUpperCase()}`, priceCentavos: 0, compareAtCentavos: null, stock: 0, active: true }],
    demoReviewCount: 0,
    demoSoldLabel: '',
    demoUnitsSold: 0,
    createdAt: new Date().toISOString(),
    demo: true,
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="form-group"><label className="fieldlabel">{label}</label>{children}</div>
}

export function BrandsAdminPage() {
  const { state, saveBrand, deleteBrand, moveBrand, mode } = useStore()
  const [message, setMessage] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDeleteBrand, setPendingDeleteBrand] = useState<Brand | null>(null)
  const brands = [...state.brands].sort((a, b) => a.sortOrder - b.sortOrder)

  function edit(brand: Brand, patch: Partial<Brand>) {
    const error = saveBrand({ ...brand, ...patch })
    setMessage(error)
  }

  return (
    <>
      <div className="between">
        <div>
          <div className="eyebrow">CATALOGUE</div>
          <h1 style={{ font: '31px Georgia, serif' }}>Brands</h1>
        </div>
        <button type="button" className="btn" onClick={() => setAddOpen(true)}>
          ADD BRAND
        </button>
      </div>
      {message ? <div className="notice">{message}</div> : null}
      <div className="whitepanel" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead><tr><th>Logo</th><th>Name</th><th>Homepage</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td style={{ width: 120, verticalAlign: 'top' }}>
                  <div className="thumb" style={{ width: 64, height: 64, borderRadius: '100%', marginBottom: 8, background: brand.tint }}>
                    {brand.logoUrl ? <img src={brand.logoUrl} alt="" style={{ objectFit: 'contain', padding: 6 }} /> : <span className="small muted" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>{brand.name.trim().charAt(0) || '?'}</span>}
                  </div>
                  <FileUploadField
                    buttonLabel="Upload logo"
                    fileName={brand.logoUrl ? 'Logo on file' : null}
                    hint="No logo yet"
                    onChange={(file) => {
                      if (!file) return
                      void (async () => {
                        try {
                          if (mode === 'production') {
                            const url = await uploadBrandLogo(file, brand.id)
                            edit(brand, { logoUrl: url })
                          } else {
                            if (file.size > 400_000) {
                              setMessage('Choose a logo under 400 KB for this browser preview.')
                              return
                            }
                            const reader = new FileReader()
                            reader.onload = () => edit(brand, { logoUrl: String(reader.result) })
                            reader.readAsDataURL(file)
                          }
                        } catch (reason: unknown) {
                          setMessage(reason instanceof Error ? reason.message : 'Upload failed.')
                        }
                      })()
                    }}
                  />
                  {brand.logoUrl ? (
                    <button type="button" className="btn-action danger" style={{ marginTop: 8 }} onClick={() => edit(brand, { logoUrl: null })}>
                      Remove logo
                    </button>
                  ) : null}
                </td>
                <td>
                  <input className="field-input" value={brand.name} onChange={(event) => edit(brand, { name: event.target.value, slug: slugify(event.target.value) })} />
                  <input className="field-input" style={{ marginTop: 8 }} placeholder="Or paste logo URL (https://…)" value={brand.logoUrl ?? ''} onChange={(event) => edit(brand, { logoUrl: event.target.value || null })} />
                  <p className="tiny muted" style={{ marginTop: 6 }}>Shown on the homepage brand slider and shop filters. Slug: {brand.slug}</p>
                </td>
                <td><input type="checkbox" checked={brand.showOnHomepage} onChange={(event) => edit(brand, { showOnHomepage: event.target.checked })} /></td>
                <td><input type="checkbox" checked={brand.active} onChange={(event) => edit(brand, { active: event.target.checked })} /></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="pill" onClick={() => moveBrand(brand.id, -1)}>Up</button>
                    <button type="button" className="pill" onClick={() => moveBrand(brand.id, 1)}>Down</button>
                    <button type="button" className="btn-action danger" onClick={() => setPendingDeleteBrand(brand)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminTextPromptModal
        open={addOpen}
        title="Add brand"
        label="Brand name"
        placeholder="e.g. Brilliant Skin"
        submitLabel="ADD BRAND"
        onClose={() => setAddOpen(false)}
        onSubmit={(name) => {
          const error = saveBrand({
            id: mode === 'production' ? entityUuid() : uid('brand'),
            name,
            slug: slugify(name),
            logoUrl: null,
            tint: '#fff0f7',
            active: true,
            sortOrder: brands.length + 1,
            showOnHomepage: true,
            blurb: 'View products →',
          })
          setMessage(error)
        }}
      />
      <AdminConfirmModal
        open={Boolean(pendingDeleteBrand)}
        title={pendingDeleteBrand ? `Delete ${pendingDeleteBrand.name}?` : 'Delete brand?'}
        description="Products still linked to this brand must be moved or removed first."
        confirmLabel="DELETE"
        danger
        onClose={() => setPendingDeleteBrand(null)}
        onConfirm={() => {
          if (pendingDeleteBrand) setMessage(deleteBrand(pendingDeleteBrand.id))
        }}
      />
    </>
  )
}

export function CategoriesAdminPage() {
  const { state, saveCategory, deleteCategory, moveCategory, mode } = useStore()
  const [message, setMessage] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<Category | null>(null)
  const categories = [...state.categories].sort((a, b) => a.sortOrder - b.sortOrder)

  function edit(category: Category, patch: Partial<Category>) {
    const error = saveCategory({ ...category, ...patch })
    setMessage(error)
  }

  return (
    <>
      <div className="between">
        <div>
          <div className="eyebrow">CATALOGUE</div>
          <h1 style={{ font: '31px Georgia, serif' }}>Categories</h1>
        </div>
        <button type="button" className="btn" onClick={() => setAddOpen(true)}>
          ADD CATEGORY
        </button>
      </div>
      {message ? <div className="notice">{message}</div> : null}
      <div className="whitepanel" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Homepage</th><th>Navigation</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <input className="field-input" value={category.name} onChange={(event) => edit(category, { name: event.target.value, slug: slugify(event.target.value) })} />
                  <FileUploadField
                    buttonLabel="Upload category image"
                    fileName={category.imageUrl ? 'Image on file' : null}
                    hint="Optional category artwork"
                    onChange={(file) => {
                      if (!file) return
                      void (async () => {
                        try {
                          if (mode === 'production') {
                            const url = await uploadCategoryImage(file, category.id)
                            edit(category, { imageUrl: url })
                          } else if (file.size <= 400_000) {
                            const reader = new FileReader()
                            reader.onload = () => edit(category, { imageUrl: String(reader.result) })
                            reader.readAsDataURL(file)
                          }
                        } catch (reason: unknown) {
                          setMessage(reason instanceof Error ? reason.message : 'Upload failed.')
                        }
                      })()
                    }}
                  />
                </td>
                <td><input type="checkbox" checked={category.showOnHomepage} onChange={(event) => edit(category, { showOnHomepage: event.target.checked })} /></td>
                <td><input type="checkbox" checked={category.showInNav} onChange={(event) => edit(category, { showInNav: event.target.checked })} /></td>
                <td><input type="checkbox" checked={category.active} onChange={(event) => edit(category, { active: event.target.checked })} /></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="pill" onClick={() => moveCategory(category.id, -1)}>Up</button>
                    <button type="button" className="pill" onClick={() => moveCategory(category.id, 1)}>Down</button>
                    <button type="button" className="btn-action danger" onClick={() => setPendingDeleteCategory(category)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminTextPromptModal
        open={addOpen}
        title="Add category"
        label="Category name"
        placeholder="e.g. Skincare"
        submitLabel="ADD CATEGORY"
        onClose={() => setAddOpen(false)}
        onSubmit={(name) => {
          const error = saveCategory({
            id: mode === 'production' ? entityUuid() : uid('cat'),
            name,
            slug: slugify(name),
            symbol: '✦',
            tint: '#faeaf0',
            imageUrl: null,
            active: true,
            sortOrder: categories.length + 1,
            showOnHomepage: false,
            showInNav: false,
            blurb: 'Shop collection →',
          })
          setMessage(error)
        }}
      />
      <AdminConfirmModal
        open={Boolean(pendingDeleteCategory)}
        title={pendingDeleteCategory ? `Delete ${pendingDeleteCategory.name}?` : 'Delete category?'}
        description="Move or delete products in this category before removing it."
        confirmLabel="DELETE"
        danger
        onClose={() => setPendingDeleteCategory(null)}
        onConfirm={() => {
          if (pendingDeleteCategory) setMessage(deleteCategory(pendingDeleteCategory.id))
        }}
      />
    </>
  )
}

export function InventoryAdminPage() {
  const { state, adjustStock } = useStore()
  const [productId, setProductId] = useState(state.products[0]?.id ?? '')
  const [delta, setDelta] = useState(1)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const threshold = state.settings.lowStockThreshold
  return (
    <>
      <div className="eyebrow">STOCK</div>
      <h1 style={{ font: '31px Georgia, serif' }}>Inventory</h1>
      <p className="muted small">Counts cannot go below zero. Adjustments are demonstration records.</p>
      <div className="whitepanel" style={{ marginTop: 16 }}>
        <div className="grid3">
          <select className="field-input" value={productId} onChange={(event) => setProductId(event.target.value)}>
            {state.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <input className="field-input" type="number" value={delta} onChange={(event) => setDelta(Number(event.target.value))} aria-label="Adjustment" />
          <input className="field-input" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        {message ? <p className="form-error">{message}</p> : null}
        <button className="btn" style={{ marginTop: 12 }} onClick={() => setMessage(adjustStock(productId, null, delta, reason))}>APPLY ADJUSTMENT</button>
      </div>
      <div className="whitepanel" style={{ marginTop: 16, padding: 0 }}>
        <table className="table">
          <thead><tr><th>Product</th><th>SKU</th><th>Available</th><th>Status</th></tr></thead>
          <tbody>
            {state.products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.stock}</td>
                <td>{product.stock <= threshold ? <span className="status pending">Low stock</span> : <span className="status">In stock</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="whitepanel" style={{ marginTop: 16 }}>
        <h3>Stock history</h3>
        {state.movements.length === 0 ? <p className="muted">No adjustments yet.</p> : state.movements.slice(0, 12).map((movement) => (
          <div key={movement.id} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="small">{movement.sku} · {movement.reason}</span>
            <b className="small">{movement.delta > 0 ? '+' : ''}{movement.delta}</b>
          </div>
        ))}
      </div>
    </>
  )
}
