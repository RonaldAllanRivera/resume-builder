'use client'

import React, { useCallback, useMemo, useState } from 'react'

import {
  ConfirmationModal,
  PopupList,
  toast,
  useAuth,
  useDocumentInfo,
  useModal,
} from '@payloadcms/ui'

export const ExportToGoogleDocsMenuItem: React.FC = () => {
  const { user } = useAuth()
  const { collectionSlug, id } = useDocumentInfo()
  const { openModal } = useModal()

  const [isLoading, setIsLoading] = useState(false)

  const isAdminOrEditor = useMemo(() => {
    const roles = (user as { roles?: unknown })?.roles
    return Array.isArray(roles) && (roles.includes('admin') || roles.includes('editor'))
  }, [user])

  const canShow = Boolean(isAdminOrEditor && collectionSlug === 'generations' && id)

  const modalSlug = useMemo(() => {
    return `export-google-docs-${collectionSlug ?? 'unknown'}-${id ?? 'unknown'}`
  }, [collectionSlug, id])

  const handleExport = useCallback(async () => {
    if (!id) return

    setIsLoading(true)

    try {
      const res = await fetch('/next/export-to-google-docs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          generationId: id,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { error?: string })?.error || `Export failed (${res.status})`,
        )
      }

      const data = (await res.json()) as {
        message?: string
        resume?: { documentUrl?: string } | null
        coverLetter?: { documentUrl?: string } | null
      }

      const links: string[] = []
      if (data.resume?.documentUrl) links.push('Resume')
      if (data.coverLetter?.documentUrl) links.push('Cover Letter')

      toast.success(`Exported ${links.join(' + ')} to Google Docs.`)

      // Open the resume doc in a new tab if available
      if (data.resume?.documentUrl) {
        window.open(data.resume.documentUrl, '_blank', 'noopener,noreferrer')
      }

      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  if (!canShow) return null

  return (
    <>
      <PopupList.Button
        id="action-export-google-docs"
        onClick={() => {
          openModal(modalSlug)
        }}
      >
        Export to Google Docs…
      </PopupList.Button>

      <ConfirmationModal
        body={
          <div>
            This will create separate Google Docs for the Resume and Cover Letter in the
            shared Drive folder. Existing export URLs will be overwritten.
          </div>
        }
        confirmingLabel={isLoading ? 'Exporting…' : 'Exporting'}
        confirmLabel="Export"
        heading="Export to Google Docs"
        modalSlug={modalSlug}
        onConfirm={handleExport}
      />
    </>
  )
}
