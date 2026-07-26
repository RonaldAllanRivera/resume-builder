import {
  convertMarkdownToLexical,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'

// No `import "server-only"` guard: this module imports the server-heavy
// richtext-lexical package and is used only by the seed script (Node) and
// server code, and `server-only` isn't a dependency this repo carries — adding
// it would break `payload run` under tsx, which is how the seed script runs.

/**
 * Markdown → Lexical for seeding blog posts.
 *
 * Two things this does that a bare convertMarkdownToLexical call does not:
 *
 * 1. Fenced code blocks (```lang) are lifted OUT before conversion and
 *    re-inserted as the site's own `code` Block — the one with Prism
 *    highlighting, a language label, and a copy button. Left to the markdown
 *    converter they'd become a plain lexical `code` node the frontend renderer
 *    doesn't style, or get dropped entirely.
 *
 * 2. Frontmatter is stripped, so a draft file's YAML header never leaks into
 *    the body.
 *
 * Everything else (headings, lists, quotes, inline code, links, bold/italic,
 * horizontal rules) is converted by the real Posts editor config — the caller
 * passes it in, so the conversion is validated against the exact feature set
 * the field actually has rather than a guessed one.
 */

// Languages the Code block's select accepts. Anything else falls back to
// 'text' so a seed never fails select validation on an unknown language.
const CODE_LANGS = new Set([
  'typescript',
  'javascript',
  'css',
  'php',
  'bash',
  'json',
  'sql',
  'markup',
  'text',
])

// Common markdown fence aliases → the Code block's option values.
const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  yml: 'text',
  yaml: 'text',
  '': 'text',
}

function normalizeLang(raw: string): string {
  const lower = raw.trim().toLowerCase()
  const mapped = LANG_ALIASES[lower] ?? lower
  return CODE_LANGS.has(mapped) ? mapped : 'text'
}

/** A Payload lexical Block node for the site's Code block. */
function codeBlockNode(language: string, code: string) {
  return {
    type: 'block',
    fields: {
      blockType: 'code',
      language,
      // Trailing newline from the fence close adds a blank final line in the
      // rendered block — trim just the trailing newlines, keep internal ones.
      code: code.replace(/\n+$/, ''),
    },
    format: '',
    version: 2,
  }
}

/** Strip a leading YAML frontmatter block if present. */
export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith('---')) return markdown
  const end = markdown.indexOf('\n---', 3)
  if (end === -1) return markdown
  const after = markdown.indexOf('\n', end + 1)
  return after === -1 ? '' : markdown.slice(after + 1).replace(/^\s+/, '')
}

type LexicalRoot = {
  root: {
    type: 'root'
    children: unknown[]
    direction: 'ltr' | 'rtl' | null
    format: ''
    indent: 0
    version: 1
  }
}

/**
 * Convert a markdown string to a Lexical document for `Posts.content`.
 *
 * @param markdown   raw markdown (frontmatter is stripped for you)
 * @param editorConfig the sanitized config from the Posts `content` field
 */
export function markdownToLexical(
  markdown: string,
  editorConfig: SanitizedServerEditorConfig,
): LexicalRoot {
  const body = stripFrontmatter(markdown)

  // Split on fenced code blocks, capturing language + body. The [\s\S] class
  // matches across newlines without the `s` flag (which older TS libs reject).
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g

  const children: unknown[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const pushProse = (chunk: string) => {
    const trimmed = chunk.trim()
    if (!trimmed) return
    const converted = convertMarkdownToLexical({ editorConfig, markdown: trimmed })
    const kids = (converted as LexicalRoot)?.root?.children
    if (Array.isArray(kids)) children.push(...kids)
  }

  while ((match = fence.exec(body)) !== null) {
    pushProse(body.slice(lastIndex, match.index))
    children.push(codeBlockNode(normalizeLang(match[1]), match[2]))
    lastIndex = fence.lastIndex
  }
  pushProse(body.slice(lastIndex))

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
