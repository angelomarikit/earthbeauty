import { useEffect } from 'react'

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
    const og = document.querySelector('meta[property="og:title"]')
    if (og) og.setAttribute('content', title)
    const ogd = document.querySelector('meta[property="og:description"]')
    if (ogd) ogd.setAttribute('content', description)
  }, [title, description])
}
