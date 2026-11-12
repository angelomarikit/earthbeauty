type PageLoadingProps = {
  message?: string
  admin?: boolean
}

export function PageLoading({ message = 'Loading…', admin = false }: PageLoadingProps) {
  return (
    <div className={`page-loading${admin ? ' page-loading--admin' : ''}`} role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading__spinner" aria-hidden="true" />
      <p className="page-loading__message">{message}</p>
      <p className="muted tiny">Please wait a moment.</p>
    </div>
  )
}
