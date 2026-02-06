'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { ConfirmationModal, toast, useAuth, useModal } from '@payloadcms/ui'

import './index.scss'

export const AIGenerationSettingsResetButton: React.FC = () => {
  const { user } = useAuth()
  const { openModal } = useModal()

  const [isLoading, setIsLoading] = useState(false)

  const isAdmin = useMemo(() => {
    const roles = (user as { roles?: unknown })?.roles
    return Array.isArray(roles) && roles.includes('admin')
  }, [user])

  const modalSlug = 'reset-ai-generation-settings'

  const handleReset = useCallback(async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/next/reset-ai-generation-settings', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Reset failed (${res.status})`)
      }

      toast.success('AI Generation Settings reset to defaults.')
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (!isAdmin) return null

  return (
    <>
      <button
        className="seedButton"
        onClick={(e) => {
          e.preventDefault()
          openModal(modalSlug)
        }}
        type="button"
      >
        Reset to defaults…
      </button>

      <ConfirmationModal
        body={
          <div>
            This will overwrite AI Generation Settings fields with the code defaults (promptVersion, model,
            temperature, systemPrompt, resumePrompt, coverLetterStyle, coverLetterPrompt).
          </div>
        }
        confirmingLabel={isLoading ? 'Resetting…' : 'Resetting'}
        confirmLabel="Reset"
        heading="Reset AI Generation Settings"
        modalSlug={modalSlug}
        onConfirm={handleReset}
      />
    </>
  )
}
