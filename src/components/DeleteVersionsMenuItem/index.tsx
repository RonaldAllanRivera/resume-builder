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

type DeleteVersionsResponse = {
  deleted: boolean
  deletedCount?: number
}

export const DeleteVersionsMenuItem: React.FC = () => {
  const { user } = useAuth()
  const { collectionSlug, id, versionCount } = useDocumentInfo()
  const { openModal } = useModal()

  const [isLoading, setIsLoading] = useState(false)

  const isAdmin = useMemo(() => {
    const roles = (user as { roles?: unknown })?.roles
    return Array.isArray(roles) && roles.includes('admin')
  }, [user])

  const canShow = Boolean(isAdmin && collectionSlug && id && versionCount > 0)

  const modalSlug = useMemo(() => {
    return `delete-versions-${collectionSlug ?? 'unknown'}-${id ?? 'unknown'}`
  }, [collectionSlug, id])

  const handleDelete = useCallback(async () => {
    if (!collectionSlug || !id) return

    setIsLoading(true)

    try {
      const res = await fetch('/next/delete-versions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          collection: collectionSlug,
          id,
        }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Delete versions failed (${res.status})`)
      }

      const json = (await res.json()) as DeleteVersionsResponse

      if (json?.deleted) {
        toast.success('Versions deleted.')
        window.location.reload()
      } else {
        toast.error('Failed to delete versions.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [collectionSlug, id])

  if (!canShow) return null

  return (
    <>
      <PopupList.Button
        id="action-delete-versions"
        onClick={() => {
          openModal(modalSlug)
        }}
      >
        Delete versions…
      </PopupList.Button>

      <ConfirmationModal
        body={<div>This will permanently delete all versions for this document.</div>}
        confirmingLabel={isLoading ? 'Deleting…' : 'Deleting'}
        confirmLabel="Delete versions"
        heading="Confirm deletion"
        modalSlug={modalSlug}
        onConfirm={handleDelete}
      />
    </>
  )
}
