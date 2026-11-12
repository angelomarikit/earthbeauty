import { useEffect, useState, type ReactNode } from 'react'

type AdminModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export function AdminModal({ open, onClose, title, children, width = 440 }: AdminModalProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        className="admin-modal whitepanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        style={{ width }}
      >
        <h3 id="admin-modal-title" style={{ marginTop: 0, font: '22px Georgia, serif' }}>
          {title}
        </h3>
        {children}
      </div>
    </>
  )
}

type AdminTextPromptModalProps = {
  open: boolean
  title: string
  label: string
  placeholder?: string
  submitLabel?: string
  onClose: () => void
  onSubmit: (value: string) => void
}

export function AdminTextPromptModal({
  open,
  title,
  label,
  placeholder = '',
  submitLabel = 'ADD',
  onClose,
  onSubmit,
}: AdminTextPromptModalProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  return (
    <AdminModal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const next = value.trim()
          if (!next) return
          onSubmit(next)
          onClose()
        }}
      >
        <label className="fieldlabel" htmlFor="admin-prompt-input">
          {label}
        </label>
        <input
          id="admin-prompt-input"
          className="field-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="action-row" style={{ marginTop: 18 }}>
          <button type="submit" className="btn" disabled={!value.trim()}>
            {submitLabel}
          </button>
          <button type="button" className="btn outline" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </form>
    </AdminModal>
  )
}

type AdminConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  danger = false,
  onClose,
  onConfirm,
}: AdminConfirmModalProps) {
  return (
    <AdminModal open={open} onClose={onClose} title={title}>
      <p className="muted small" style={{ lineHeight: 1.6 }}>
        {description}
      </p>
      <div className="action-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          className={danger ? 'btn' : 'btn'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn outline" onClick={onClose}>
          {cancelLabel}
        </button>
      </div>
    </AdminModal>
  )
}
