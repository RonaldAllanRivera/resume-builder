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

export const GenerateDraftsMenuItem: React.FC = () => {
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
    return `generate-drafts-${collectionSlug ?? 'unknown'}-${id ?? 'unknown'}`
  }, [collectionSlug, id])

  const handleGenerate = useCallback(async () => {
    if (!id) return

    setIsLoading(true)

    try {
      const res = await fetch('/next/generate-drafts', {
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
        const text = await res.text().catch(() => '')
        throw new Error(text || `Generate drafts failed (${res.status})`)
      }

      toast.success('Drafts generated.')
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
        id="action-generate-drafts"
        onClick={() => {
          openModal(modalSlug)
        }}
      >
        Generate drafts…
      </PopupList.Button>

      <ConfirmationModal
        body={<div>This will generate a tailored resume and cover letter for this attempt.</div>}
        confirmingLabel={isLoading ? 'Generating…' : 'Generating'}
        confirmLabel="Generate"
        heading="Generate drafts"
        modalSlug={modalSlug}
        onConfirm={handleGenerate}
      />
    </>
  )
}
