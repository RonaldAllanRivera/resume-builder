import { google, type docs_v1 } from 'googleapis'

type ServiceAccountCredentials = {
  client_email: string
  private_key: string
  [key: string]: unknown
}

/**
 * Parse the base64-encoded service account JSON from env.
 */
const getCredentials = (): ServiceAccountCredentials => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 env var.')
  }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    return JSON.parse(decoded) as ServiceAccountCredentials
  } catch {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.')
  }
}

/**
 * Get an authenticated Google Auth client scoped to Drive + Docs.
 */
const getAuthClient = () => {
  const credentials = getCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive', // Full drive access (needed for shared folders)
      'https://www.googleapis.com/auth/documents',
    ],
  })
  return auth
}

/**
 * Sanitize a string for use as a Google Doc title.
 */
const sanitizeDocTitle = (value: string): string => {
  return value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'Untitled'
}

// ---------------------------------------------------------------------------
// Markdown → Google Docs requests helpers
// ---------------------------------------------------------------------------

type DocRequest = {
  insertText?: {
    location: { index: number }
    text: string
  }
  updateParagraphStyle?: {
    range: { startIndex: number; endIndex: number }
    paragraphStyle: Record<string, unknown>
    fields: string
  }
  updateTextStyle?: {
    range: { startIndex: number; endIndex: number }
    textStyle: Record<string, unknown>
    fields: string
  }
}

/**
 * Parse markdown and compute inline formatting ranges on the *stripped* text.
 */
const parseMarkdownWithFormatting = (
  markdown: string,
): {
  segments: Array<{
    cleanText: string
    heading?: 'HEADING_1' | 'HEADING_2' | 'HEADING_3'
    bullet?: boolean
    boldRanges: Array<{ start: number; end: number }>
    italicRanges: Array<{ start: number; end: number }>
  }>
} => {
  const lines = markdown.split('\n')
  const segments: Array<{
    cleanText: string
    heading?: 'HEADING_1' | 'HEADING_2' | 'HEADING_3'
    bullet?: boolean
    boldRanges: Array<{ start: number; end: number }>
    italicRanges: Array<{ start: number; end: number }>
  }> = []

  for (const line of lines) {
    const trimmed = line.trimEnd()

    let rawText = trimmed
    let heading: 'HEADING_1' | 'HEADING_2' | 'HEADING_3' | undefined
    let bullet = false

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3
      const headingMap = { 1: 'HEADING_1', 2: 'HEADING_2', 3: 'HEADING_3' } as const
      heading = headingMap[level]
      rawText = headingMatch[2]
    }

    // Bullet list items
    if (!heading) {
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)
      if (bulletMatch) {
        bullet = true
        rawText = bulletMatch[1]
      }
    }

    // Compute bold/italic ranges on the stripped text
    const boldRanges: Array<{ start: number; end: number }> = []
    const italicRanges: Array<{ start: number; end: number }> = []

    // Process bold first (**text**)
    let processedText = ''
    const remaining = rawText
    let offset = 0

    // Bold
    const boldRegex = /\*\*(.+?)\*\*/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = boldRegex.exec(remaining)) !== null) {
      // Text before the match
      const before = remaining.slice(lastIndex, match.index)
      processedText += before
      offset = processedText.length

      const inner = match[1]
      boldRanges.push({ start: offset, end: offset + inner.length })
      processedText += inner
      lastIndex = match.index + match[0].length
    }
    processedText += remaining.slice(lastIndex)

    // Italic (on the already-bold-stripped text)
    const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
    let finalText = ''
    lastIndex = 0

    while ((match = italicRegex.exec(processedText)) !== null) {
      const before = processedText.slice(lastIndex, match.index)
      finalText += before
      offset = finalText.length

      const inner = match[1]
      italicRanges.push({ start: offset, end: offset + inner.length })
      finalText += inner
      lastIndex = match.index + match[0].length
    }
    finalText += processedText.slice(lastIndex)

    segments.push({
      cleanText: finalText,
      heading,
      bullet,
      boldRanges,
      italicRanges,
    })
  }

  return { segments }
}

/**
 * Build Google Docs batchUpdate requests from parsed segments with proper formatting.
 * Text is inserted clean (no markdown markers), and bold/italic are applied via ranges.
 */
const buildFormattedDocRequests = (
  markdown: string,
): { requests: DocRequest[]; bulletRequests: DocRequest[] } => {
  const { segments } = parseMarkdownWithFormatting(markdown)
  const requests: DocRequest[] = []

  // Build full text
  const fullText = segments.map((s) => s.cleanText + '\n').join('')

  if (!fullText.trim()) {
    return { requests: [], bulletRequests: [] }
  }

  // Insert all text at once
  requests.push({
    insertText: {
      location: { index: 1 },
      text: fullText,
    },
  })

  // Apply formatting
  let cursor = 1
  const bulletRequests: DocRequest[] = []

  for (const segment of segments) {
    const lineLen = segment.cleanText.length + 1 // +1 for \n
    const startIndex = cursor
    const endIndex = cursor + lineLen

    // Heading style
    if (segment.heading) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex },
          paragraphStyle: { namedStyleType: segment.heading },
          fields: 'namedStyleType',
        },
      })
    }

    // Bullet
    if (segment.bullet) {
      bulletRequests.push({
        createParagraphBullets: {
          range: { startIndex, endIndex: endIndex - 1 },
          bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
        },
      } as unknown as DocRequest)
    }

    // Bold ranges
    for (const range of segment.boldRanges) {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: startIndex + range.start,
            endIndex: startIndex + range.end,
          },
          textStyle: { bold: true },
          fields: 'bold',
        },
      })
    }

    // Italic ranges
    for (const range of segment.italicRanges) {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: startIndex + range.start,
            endIndex: startIndex + range.end,
          },
          textStyle: { italic: true },
          fields: 'italic',
        },
      })
    }

    cursor = endIndex
  }

  return { requests, bulletRequests }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ExportResult = {
  documentId: string
  documentUrl: string
}

/**
 * Create a Google Doc from markdown content in the configured Drive folder.
 *
 * @param title - Document title (will be sanitized)
 * @param markdownContent - Markdown content to render into the doc
 * @returns The created document's ID and URL
 */
export const createGoogleDoc = async (
  title: string,
  markdownContent: string,
): Promise<ExportResult> => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID env var.')
  }

  const auth = getAuthClient()
  const docs = google.docs({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })

  const safeTitle = sanitizeDocTitle(title)

  // Strategy: Create a blank document, then use Docs API to add content
  // We create it directly in the target folder so it inherits folder ownership
  // This avoids service account quota issues

  const createRes = await drive.files.create({
    requestBody: {
      name: safeTitle,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    },
    fields: 'id,webViewLink,owners',
    supportsAllDrives: true,
  })

  const documentId = createRes.data.id
  if (!documentId) {
    throw new Error('Drive API did not return a document id.')
  }

  // Check if file was created successfully
  // If the service account owns it, we need to transfer ownership
  const isServiceAccountOwned = createRes.data.owners?.some((owner) =>
    owner.emailAddress?.includes('gserviceaccount.com'),
  )

  if (isServiceAccountOwned) {
    // Get folder owner for ownership transfer
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: 'owners',
      supportsAllDrives: true,
    })

    const folderOwnerEmail = folderInfo.data.owners?.[0]?.emailAddress
    if (!folderOwnerEmail) {
      // Clean up and fail
      try {
        await drive.files.delete({ fileId: documentId, supportsAllDrives: true })
      } catch {
        // Ignore
      }
      throw new Error('Could not determine folder owner for ownership transfer')
    }

    // Transfer ownership
    try {
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          type: 'user',
          role: 'owner',
          emailAddress: folderOwnerEmail,
        },
        transferOwnership: true,
        supportsAllDrives: true,
        sendNotificationEmail: false,
      })
    } catch (error) {
      // Clean up and fail
      try {
        await drive.files.delete({ fileId: documentId, supportsAllDrives: true })
      } catch {
        // Ignore
      }
      throw new Error(`Failed to transfer ownership: ${error}`)
    }
  }

  // 3. Insert formatted content
  if (markdownContent.trim()) {
    const { requests, bulletRequests } = buildFormattedDocRequests(markdownContent)

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: requests as docs_v1.Schema$Request[] },
      })
    }

    // Bullet formatting must be applied in a separate batchUpdate
    if (bulletRequests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: bulletRequests as docs_v1.Schema$Request[] },
      })
    }
  }

  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`

  return { documentId, documentUrl }
}
