'use client'

import React from 'react'

import { Collapsible } from '@payloadcms/ui'

type ShortcodeItem = {
  code: string
  description: string
}

type Props = {
  field?: {
    admin?: {
      custom?: {
        shortcodeTitle?: string
        shortcodes?: ShortcodeItem[]
      }
    }
  }
}

export const ShortcodeReferenceDescription: React.FC<Props> = ({ field }) => {
  const custom = field?.admin?.custom
  const items = Array.isArray(custom?.shortcodes) ? custom?.shortcodes : []

  if (!items.length) return null

  const title = custom?.shortcodeTitle?.trim() || 'Shortcodes'

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <Collapsible header={title} initCollapsed>
        <div style={{ paddingTop: '0.5rem' }}>
          {items.map((item) => (
            <div key={item.code} style={{ marginBottom: '0.6rem' }}>
              <div>
                <code>{item.code}</code>
              </div>
              <div>{item.description}</div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  )
}
