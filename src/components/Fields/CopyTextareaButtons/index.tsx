'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { Button, toast, useDocumentInfo, useField } from '@payloadcms/ui'
import { CopyIcon } from '@payloadcms/ui/icons/Copy'

import './index.scss'

type Props = {
  field?: {
    admin?: {
      custom?: {
        targetField?: string
        variant?: 'resume' | 'letter'
      }
    }
  }
}

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

const toPlainTextFromMarkdown = (input: string): string => {
  let out = String(input ?? '')

  out = out.replace(/```[\s\S]*?```/g, (block) => {
    return block.replace(/```[a-zA-Z0-9_-]*\n?/g, '').replace(/```\s*$/g, '')
  })

  out = out
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}(?:[-*+]\s+)/gm, '')
    .replace(/^\s{0,3}\d+\.\s+/gm, '')

  out = out
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  out = out.replace(/\r\n/g, '\n')
  out = out.replace(/\n{3,}/g, '\n\n')

  return out.trim()
}

export const CopyTextareaButtons: React.FC<Props> = ({ field }) => {
  const { collectionSlug, id } = useDocumentInfo()

  const targetField = (field?.admin?.custom?.targetField ?? '').trim()
  const variant = field?.admin?.custom?.variant === 'letter' ? 'letter' : 'resume'

  const [copying, setCopying] = useState<null | 'plain' | 'markdown'>(null)
  const [downloading, setDownloading] = useState(false)

  const safePath = targetField || '__copyTextareaButtons__missingTargetField'
  const { value: targetValue } = useField<string>({ path: safePath })

  const rawValue = useMemo(() => {
    if (typeof targetValue === 'string') return targetValue
    return targetValue == null ? '' : String(targetValue)
  }, [targetValue])

  const hasValue = useMemo(() => {
    return Boolean(rawValue.trim())
  }, [rawValue])

  const canDownloadPdf = useMemo(() => {
    return Boolean(collectionSlug === 'generations' && id)
  }, [collectionSlug, id])

  const copy = useCallback(
    async (mode: 'plain' | 'markdown') => {
      try {
        setCopying(mode)
        const value = mode === 'plain' ? toPlainTextFromMarkdown(rawValue) : rawValue

        if (!value.trim()) {
          toast.info('Nothing to copy.')
          return
        }

        await navigator.clipboard.writeText(value)
        toast.success(mode === 'plain' ? 'Copied as plain text.' : 'Copied as markdown.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to copy')
      } finally {
        setCopying(null)
      }
    },
    [rawValue],
  )

  const downloadPdf = useCallback(async () => {
    if (!id) return
    if (!hasValue) {
      toast.info('Nothing to download.')
      return
    }

    const type = variant === 'letter' ? 'letter' : 'resume'
    setDownloading(true)

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }, [hasValue, id, variant])

  if (!targetField) return null

  return (
    <div className="copyTextareaButtons">
      <div className="copyTextareaButtons__row">
        <Button
          className="copyTextareaButtons__button"
          disabled={!hasValue || copying !== null || downloading}
          onClick={(e) => {
            e.preventDefault()
            void copy('plain')
          }}
          type="button"
          buttonStyle="secondary"
          size="small"
        >
          Copy plain text <CopyIcon />
        </Button>

        {variant === 'resume' && (
          <Button
            className="copyTextareaButtons__button"
            disabled={!hasValue || copying !== null || downloading}
            onClick={(e) => {
              e.preventDefault()
              void copy('markdown')
            }}
            type="button"
            buttonStyle="secondary"
            size="small"
          >
            Copy markdown <CopyIcon />
          </Button>
        )}

        {canDownloadPdf && (
          <Button
            className="copyTextareaButtons__button"
            disabled={!hasValue || copying !== null || downloading}
            onClick={(e) => {
              e.preventDefault()
              void downloadPdf()
            }}
            type="button"
            buttonStyle="secondary"
            size="small"
          >
            {downloading
              ? 'Downloading…'
              : variant === 'letter'
                ? 'Download letter PDF'
                : 'Download resume PDF'}
          </Button>
        )}
      </div>
    </div>
  )
}
