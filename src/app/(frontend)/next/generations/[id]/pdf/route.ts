import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { marked } from 'marked'

type RelIdValue = number | string | { id?: number | string } | null | undefined

const parseNumericID = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return null
    if (!/^[0-9]+$/.test(t)) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const toID = (value: unknown): number | string | null => {
  const n = parseNumericID(value)
  if (typeof n === 'number') return n
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

const getRelIdAsString = (value: RelIdValue): string | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null
  if (typeof value === 'string') {
    const t = value.trim()
    return t ? t : null
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return getRelIdAsString((value as { id?: number | string }).id)
  }
  return null
}

const extractFullNameFromResumeDraft = (resumeDraft: string): string | null => {
  const input = String(resumeDraft ?? '')
  const firstChunk = input.split(/\r?\n/).slice(0, 20).join('\n')

  // Expected format: # **Full Name**
  // Also allow: # Full Name
  const m = firstChunk.match(/^\s*#\s*(.+?)\s*$/m)
  if (!m) return null

  let name = m[1] ?? ''
  name = name.replace(/^\*\*|\*\*$/g, '').replace(/^__|__$/g, '')
  name = name.replace(/\s+/g, ' ').trim()

  return name ? name : null
}

const sanitizeFilenamePart = (value: string): string => {
  let out = String(value ?? '')
  out = out.replace(/[\r\n\t]+/g, ' ')

  // Windows + common unsafe filename chars
  out = out.replace(/[\\/\?%\*:|"<>]/g, ' ')
  out = out.replace(/\s+/g, ' ').trim()

  // Avoid empty or dot-only filenames.
  if (!out || out === '.' || out === '..') return ''

  // Keep filenames reasonably short.
  if (out.length > 160) out = out.slice(0, 160).trim()
  return out
}

const buildPdfFilename = (args: {
  type: 'resume' | 'letter'
  id: string
  fullName: string | null
  jobTitle: string | null
}): string => {
  const safeName = sanitizeFilenamePart(args.fullName ?? '')
  const safeTitle = sanitizeFilenamePart(args.jobTitle ?? '')

  if (args.type === 'resume') {
    if (safeName && safeTitle) return `${safeName} Resume for ${safeTitle}.pdf`
    if (safeName) return `${safeName} Resume.pdf`
    return `generation-${args.id}-resume.pdf`
  }

  if (safeName && safeTitle) return `${safeName} Application Letter for ${safeTitle}.pdf`
  if (safeName) return `${safeName} Application Letter.pdf`
  return `generation-${args.id}-letter.pdf`
}

const buildContentDisposition = (filename: string): string => {
  const safe = sanitizeFilenamePart(filename.replace(/\.pdf$/i, ''))
  const finalName = (safe ? `${safe}.pdf` : 'download.pdf').replace(/\s+/g, ' ').trim()
  const encoded = encodeURIComponent(finalName)
  return `attachment; filename="${finalName}"; filename*=UTF-8''${encoded}`
}

const isAdminOrEditor = (user: unknown): boolean => {
  const roles = (user as { roles?: unknown })?.roles
  return Array.isArray(roles) && (roles.includes('admin') || roles.includes('editor'))
}

const toPlainTextFromMarkdownInline = (input: string): string => {
  let out = String(input ?? '')

  out = out.replace(/`([^`]+)`/g, '$1')
  out = out.replace(/\*\*(.*?)\*\*/g, '$1')
  out = out.replace(/__(.*?)__/g, '$1')
  out = out.replace(/\*(.*?)\*/g, '$1')
  out = out.replace(/_(.*?)_/g, '$1')

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  return out.trim()
}

type PdfState = {
  pdf: PDFDocument
  page: import('pdf-lib').PDFPage
  y: number
  fontRegular: import('pdf-lib').PDFFont
  fontBold: import('pdf-lib').PDFFont
  fontMono: import('pdf-lib').PDFFont
}

const LETTER_WIDTH = 612
const LETTER_HEIGHT = 792
const MARGIN = 54

const newPage = (state: PdfState): void => {
  state.page = state.pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT])
  state.y = LETTER_HEIGHT - MARGIN
}

const wrapText = (
  text: string,
  opts: { font: import('pdf-lib').PDFFont; size: number; maxWidth: number },
): string[] => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const words = cleaned.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    const width = opts.font.widthOfTextAtSize(next, opts.size)
    if (width <= opts.maxWidth) {
      current = next
      continue
    }

    if (current) lines.push(current)
    current = word
  }

  if (current) lines.push(current)
  return lines
}

const ensureRoom = (state: PdfState, minHeight: number): void => {
  if (state.y - minHeight < MARGIN) {
    newPage(state)
  }
}

const drawLines = (
  state: PdfState,
  lines: string[],
  opts: { font: import('pdf-lib').PDFFont; size: number; lineHeight: number; indent?: number },
): void => {
  const x = MARGIN + (opts.indent ?? 0)
  const maxWidth = LETTER_WIDTH - MARGIN - x

  for (const line of lines) {
    ensureRoom(state, opts.lineHeight)
    state.page.drawText(line, {
      x,
      y: state.y - opts.size,
      font: opts.font,
      size: opts.size,
      color: rgb(0.07, 0.07, 0.07),
      maxWidth,
    })
    state.y -= opts.lineHeight
  }
}

const drawParagraph = (
  state: PdfState,
  text: string,
  opts: { font: import('pdf-lib').PDFFont; size: number },
) => {
  const maxWidth = LETTER_WIDTH - MARGIN * 2
  const lines = wrapText(text, { font: opts.font, size: opts.size, maxWidth })
  drawLines(state, lines, { font: opts.font, size: opts.size, lineHeight: opts.size + 4 })
  state.y -= 6
}

const drawHr = (state: PdfState): void => {
  ensureRoom(state, 18)
  const y = state.y - 10
  state.page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LETTER_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  })
  state.y -= 18
}

const renderResumeMarkdownToPdf = (state: PdfState, markdown: string): void => {
  const tokens = marked.lexer(String(markdown ?? '')) as unknown as Array<Record<string, unknown>>

  for (const token of tokens) {
    const type = String(token.type ?? '')
    if (type === 'space') continue

    if (type === 'hr') {
      drawHr(state)
      continue
    }

    if (type === 'heading') {
      const depth = Number(token.depth ?? 0)
      const text = toPlainTextFromMarkdownInline(String(token.text ?? ''))
      if (!text) continue

      const size = depth === 1 ? 18 : depth === 2 ? 14 : 12
      const lineHeight = size + (depth === 1 ? 8 : 6)
      const lines = wrapText(text, {
        font: state.fontBold,
        size,
        maxWidth: LETTER_WIDTH - MARGIN * 2,
      })
      drawLines(state, lines, { font: state.fontBold, size, lineHeight })
      state.y -= depth === 1 ? 8 : 4
      continue
    }

    if (type === 'paragraph') {
      const cleaned = toPlainTextFromMarkdownInline(String(token.text ?? ''))
      if (cleaned) drawParagraph(state, cleaned, { font: state.fontRegular, size: 11 })
      continue
    }

    if (type === 'list') {
      const items = Array.isArray(token.items)
        ? (token.items as Array<Record<string, unknown>>)
        : []

      for (const item of items) {
        const itemText = toPlainTextFromMarkdownInline(String(item.text ?? ''))
        if (!itemText) continue

        const bulletText = `• ${itemText}`
        const lines = wrapText(bulletText, {
          font: state.fontRegular,
          size: 11,
          maxWidth: LETTER_WIDTH - MARGIN * 2 - 12,
        })
        drawLines(state, lines, {
          font: state.fontRegular,
          size: 11,
          lineHeight: 15,
          indent: 12,
        })
      }

      state.y -= 6
      continue
    }

    if (type === 'blockquote') {
      const quoteText = toPlainTextFromMarkdownInline(String(token.text ?? ''))
      if (quoteText) {
        drawParagraph(state, quoteText, { font: state.fontRegular, size: 11 })
      }
      continue
    }

    if (type === 'code') {
      const codeText = String(token.text ?? '')
        .replace(/\r\n/g, '\n')
        .trim()
      if (codeText) {
        const maxWidth = LETTER_WIDTH - MARGIN * 2
        const lines = codeText
          .split('\n')
          .flatMap((l) => wrapText(l, { font: state.fontMono, size: 9, maxWidth }))
        drawLines(state, lines, { font: state.fontMono, size: 9, lineHeight: 12 })
        state.y -= 6
      }
      continue
    }

    const rawText = (token as unknown as { raw?: string; text?: string })?.text
    if (rawText) {
      const cleaned = toPlainTextFromMarkdownInline(String(rawText))
      if (cleaned) drawParagraph(state, cleaned, { font: state.fontRegular, size: 11 })
    }
  }
}

const renderLetterToPdf = (state: PdfState, text: string): void => {
  const out = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (!out) return

  const paragraphs = out.split(/\n{2,}/g)
  for (const p of paragraphs) {
    const cleaned = p.replace(/\n+/g, ' ').trim()
    if (!cleaned) continue
    drawParagraph(state, cleaned, { font: state.fontRegular, size: 11 })
  }
}

const makePdfBytes = async (render: (state: PdfState) => void): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create()

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontMono = await pdf.embedFont(StandardFonts.Courier)

  const state: PdfState = {
    pdf,
    page: pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]),
    y: LETTER_HEIGHT - MARGIN,
    fontRegular,
    fontBold,
    fontMono,
  }

  render(state)

  return await pdf.save()
}

const parseTypeParam = (value: unknown): 'resume' | 'letter' => {
  return value === 'letter' ? 'letter' : 'resume'
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdminOrEditor(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  const { id } = await ctx.params
  const generationID = toID(id)

  if (!generationID) {
    return new Response('Invalid request.', { status: 400 })
  }

  const url = new URL(req.url)
  const type = parseTypeParam(url.searchParams.get('type'))

  try {
    const payloadReq = await createLocalReq({ user }, payload)

    const generation = await payload.findByID({
      collection: 'generations',
      id: generationID,
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })

    const jobAdIdRaw = getRelIdAsString((generation as { jobAd?: RelIdValue })?.jobAd)
    const jobAdID = toID(jobAdIdRaw)

    let jobAdTitle: string | null = null
    if (jobAdID) {
      try {
        const jobAd = await payload.findByID({
          collection: 'jobAds',
          id: jobAdID,
          depth: 0,
          overrideAccess: false,
          req: payloadReq,
        })
        jobAdTitle = typeof jobAd?.title === 'string' ? jobAd.title : null
      } catch {
        jobAdTitle = null
      }
    }

    const resumeDraft = (generation as { resumeDraft?: unknown })?.resumeDraft
    const applicationLetter = (generation as { applicationLetter?: unknown })?.applicationLetter

    const fullName = extractFullNameFromResumeDraft(
      typeof resumeDraft === 'string' ? resumeDraft : String(resumeDraft ?? ''),
    )

    const pdfBytes = await makePdfBytes((state) => {
      if (type === 'letter') {
        renderLetterToPdf(
          state,
          typeof applicationLetter === 'string'
            ? applicationLetter
            : String(applicationLetter ?? ''),
        )
      } else {
        renderResumeMarkdownToPdf(
          state,
          typeof resumeDraft === 'string' ? resumeDraft : String(resumeDraft ?? ''),
        )
      }
    })

    const filename = buildPdfFilename({
      type,
      id: String(generationID),
      fullName,
      jobTitle: typeof jobAdTitle === 'string' ? jobAdTitle : null,
    })

    // Ensure a plain ArrayBuffer-backed typed array for Response's BodyInit typing.
    const body = new Uint8Array(pdfBytes)

    return new Response(body, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': buildContentDisposition(filename),
        'cache-control': 'no-store',
      },
    })
  } catch (e: unknown) {
    payload.logger.error({ err: e, message: 'Error generating generation PDF' })

    const message = e instanceof Error ? e.message : 'Error generating PDF.'
    const isProd = process.env.NODE_ENV === 'production'
    return new Response(isProd ? 'Error generating PDF.' : message, { status: 500 })
  }
}
