'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { Button, toast, useField } from '@payloadcms/ui'
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
  const targetField = (field?.admin?.custom?.targetField ?? '').trim()
  const variant = field?.admin?.custom?.variant === 'letter' ? 'letter' : 'resume'

  const [copying, setCopying] = useState<null | 'plain' | 'markdown'>(null)

  const safePath = targetField || '__copyTextareaButtons__missingTargetField'
  const { value: targetValue } = useField<string>({ path: safePath })

  const rawValue = useMemo(() => {
    if (typeof targetValue === 'string') return targetValue
    return targetValue == null ? '' : String(targetValue)
  }, [targetValue])

  const hasValue = useMemo(() => {
    return Boolean(rawValue.trim())
  }, [rawValue])

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

  if (!targetField) return null

  return (
    <div className="copyTextareaButtons">
      <div className="copyTextareaButtons__row">
        <Button
          className="copyTextareaButtons__button"
          disabled={!hasValue || copying !== null}
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
            disabled={!hasValue || copying !== null}
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
      </div>
    </div>
  )
}
