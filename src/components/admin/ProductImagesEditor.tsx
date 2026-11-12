import { useId } from 'react'
import { PackArt } from '@/components/product/ProductCard'
import type { PackStyle, ProductImage } from '@/types'
import { entityUuid, uid } from '@/lib/format'
import { setUniqueHero, setUniqueThumbnail } from '@/lib/productImages'

type ProductImagesEditorProps = {
  images: ProductImage[]
  pack: PackStyle
  production: boolean
  onChange: (images: ProductImage[]) => void
  onPickFile: (imageId: string, file: File) => void
  onTooLarge?: () => void
}

export function ProductImagesEditor({
  images,
  pack,
  production,
  onChange,
  onPickFile,
  onTooLarge,
}: ProductImagesEditorProps) {
  const inputId = useId()

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    let next = [...images]
    for (const file of Array.from(files)) {
      if (!production && file.size > 400_000) {
        onTooLarge?.()
        continue
      }
      const id = production ? entityUuid() : uid('img')
      const url = production
        ? URL.createObjectURL(file)
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error('Could not read file.'))
            reader.readAsDataURL(file)
          })
      next = [
        ...next,
        {
          id,
          url,
          altText: '',
          sortOrder: next.length,
          isHero: next.length === 0,
          isThumbnail: next.length === 0,
        },
      ]
      onPickFile(id, file)
    }
    onChange(next)
  }

  function remove(id: string) {
    const next = images.filter((image) => image.id !== id).map((image, index) => ({ ...image, sortOrder: index }))
    if (next.length && !next.some((image) => image.isHero)) next[0] = { ...next[0], isHero: true }
    if (next.length && !next.some((image) => image.isThumbnail)) next[0] = { ...next[0], isThumbnail: true }
    onChange(next)
  }

  return (
    <section className="product-images-editor">
      <div className="fieldlabel">Product images</div>
      <p className="muted tiny" style={{ margin: '6px 0 14px', lineHeight: 1.55 }}>
        Upload several photos. Choose which image is the <b>main product photo</b> (large image on the product page) and which is the{' '}
        <b>shop thumbnail</b> (small image in catalogue and cart).
      </p>
      {images.length ? (
        <div className="product-images-editor__grid">
          {images.map((image) => (
            <article key={image.id} className="product-images-editor__card">
              <div className="thumb product-images-editor__preview">
                {image.url ? <img src={image.url} alt="" /> : <PackArt type={pack} />}
              </div>
              <div className="product-images-editor__actions">
                <button
                  type="button"
                  className={`btn outline compact${image.isHero ? ' on' : ''}`}
                  onClick={() => onChange(setUniqueHero(images, image.id))}
                >
                  Main photo
                </button>
                <button
                  type="button"
                  className={`btn outline compact${image.isThumbnail ? ' on' : ''}`}
                  onClick={() => onChange(setUniqueThumbnail(images, image.id))}
                >
                  Thumbnail
                </button>
                <button type="button" className="btn-action danger" onClick={() => remove(image.id)}>
                  Remove
                </button>
              </div>
              {(image.isHero || image.isThumbnail) && (
                <div className="product-images-editor__tags tiny">
                  {image.isHero ? <span className="pill">Main</span> : null}
                  {image.isThumbnail ? <span className="pill">Thumbnail</span> : null}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="product-images-editor__empty muted small">No images yet. Add at least one for the shop and product page.</div>
      )}
      <div className="file-upload" style={{ marginTop: 14 }}>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="file-upload__input"
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <label htmlFor={inputId} className="btn outline file-upload__trigger">
          ↑ Add product images
        </label>
        <span className="file-upload__name small">JPG, PNG, or WebP · max 5 MB each in production</span>
      </div>
    </section>
  )
}
