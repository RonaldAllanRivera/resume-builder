'use client'

import React from 'react'

import { Collapsible } from '@payloadcms/ui'

type HelpSection = {
  heading: string
  lines: string[]
}

type Props = {
  field?: {
    admin?: {
      custom?: {
        helpTitle?: string
        helpSections?: HelpSection[]
      }
    }
  }
}

export const FieldHelpAccordionDescription: React.FC<Props> = ({ field }) => {
  const custom = field?.admin?.custom
  const sections = Array.isArray(custom?.helpSections) ? custom?.helpSections : []

  if (!sections.length) return null

  const title = custom?.helpTitle?.trim() || 'Help'

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <Collapsible header={title} initCollapsed>
        <div style={{ paddingTop: '0.5rem' }}>
          {sections.map((section) => (
            <div key={section.heading} style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontWeight: 600 }}>{section.heading}</div>
              <div>
                {section.lines.map((line, idx) => (
                  <div key={`${section.heading}-${idx}`}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  )
}
