'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { Button, toast, useAuth, useDocumentInfo } from '@payloadcms/ui'

import './index.scss'

type PdfType = 'resume' | 'letter'

const parseContentDispositionFilename = (value: string | null): string | null => {
  if (!value) return null

  // Prefer RFC 5987 filename*=UTF-8''...
  const starMatch = value.match(/filename\*=(?:UTF-8''|utf-8''|)([^;]+)/)
  if (starMatch?.[1]) {
    const raw = starMatch[1].trim().replace(/^"|"$/g, '')
    try {
      const decoded = decodeURIComponent(raw)
      return decoded.trim() || null
    } catch {
      return raw.trim() || null
    }
  }

  const match = value.match(/filename=([^;]+)/)
  if (!match?.[1]) return null

  const filename = match[1].trim().replace(/^"|"$/g, '')
  return filename.trim() || null
}

const downloadBlob = async (res: Response, filename: string) => {
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)

  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    window.URL.revokeObjectURL(url)
  }
}

export const DownloadGenerationPDFButtons: React.FC = () => {
  const { user } = useAuth()
  const { collectionSlug, id } = useDocumentInfo()

  const [downloading, setDownloading] = useState<null | PdfType>(null)

  const isAdminOrEditor = useMemo(() => {
    const roles = (user as { roles?: unknown })?.roles
    return Array.isArray(roles) && (roles.includes('admin') || roles.includes('editor'))
  }, [user])

  const canShow = Boolean(isAdminOrEditor && collectionSlug === 'generations' && id)

  const download = useCallback(
    async (type: PdfType) => {
      if (!id) return

      setDownloading(type)

      try {
        const url = `/next/generations/${encodeURIComponent(String(id))}/pdf?type=${encodeURIComponent(type)}`

        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `Download failed (${res.status})`)
        }

        const contentDisposition = res.headers.get('content-disposition')
        const serverFilename = parseContentDispositionFilename(contentDisposition)
        const fallbackFilename =
          type === 'resume' ? `generation-${id}-resume.pdf` : `generation-${id}-letter.pdf`

        await downloadBlob(res, serverFilename || fallbackFilename)

        toast.success(type === 'resume' ? 'Resume PDF downloaded.' : 'Letter PDF downloaded.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to download PDF')
      } finally {
        setDownloading(null)
      }
    },
    [id],
  )

  if (!canShow) return null

  return (
    <div className="downloadGenerationPDFButtons">
      <div className="downloadGenerationPDFButtons__row">
        <Button
          className="downloadGenerationPDFButtons__button"
          disabled={downloading !== null}
          onClick={(e) => {
            e.preventDefault()
            void download('resume')
          }}
          type="button"
          buttonStyle="secondary"
          size="small"
        >
          {downloading === 'resume' ? 'Downloading resume…' : 'Download resume PDF'}
        </Button>

        <Button
          className="downloadGenerationPDFButtons__button"
          disabled={downloading !== null}
          onClick={(e) => {
            e.preventDefault()
            void download('letter')
          }}
          type="button"
          buttonStyle="secondary"
          size="small"
        >
          {downloading === 'letter' ? 'Downloading letter…' : 'Download letter PDF'}
        </Button>
      </div>
    </div>
  )
}
