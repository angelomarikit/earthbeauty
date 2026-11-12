import { useId, type ReactNode } from 'react'

type FileUploadFieldProps = {
  accept?: string
  buttonLabel?: string
  hint?: string
  fileName?: string | null
  onChange: (file: File | null) => void
  children?: ReactNode
}

/** Hidden native input + prominent outline button (admin / checkout uploads). */
export function FileUploadField({
  accept = 'image/*',
  buttonLabel = 'Choose file',
  hint = 'No file chosen',
  fileName,
  onChange,
  children,
}: FileUploadFieldProps) {
  const inputId = useId()
  const display = fileName?.trim() ? fileName : hint

  return (
    <div className="file-upload">
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="file-upload__input"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      <label htmlFor={inputId} className="btn outline file-upload__trigger">
        ↑ {buttonLabel}
      </label>
      <span className="file-upload__name small" title={display}>
        {display}
      </span>
      {children}
    </div>
  )
}
