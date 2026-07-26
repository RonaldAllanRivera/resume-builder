import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { markdownToLexical, stripFrontmatter } from '@/lib/markdown-to-lexical'

/**
 * The load-bearing test for seeding blog posts from markdown.
 *
 * Posts.content is a Lexical richText field. This proves markdownToLexical
 * against the REAL field config (not a guessed one) and round-trips the result
 * through Payload's own create/read, so a passing run means the seed script
 * will produce content the Posts editor and the frontend renderer both accept.
 */

let payload: Payload
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lexical: any

const MARKDOWN = `---
title: 'Fixture'
slug: fixture
---

## A heading

A paragraph with **bold**, *italic*, \`inline code\`, and a [link](https://example.com).

- first item
- second item

1. ordered one
2. ordered two

\`\`\`ts
const answer = 42
\`\`\`

> A block quote.

---

Final paragraph.
`

/** Collect every node \`type\` present anywhere in the tree. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nodeTypes(node: any, acc = new Set<string>()): Set<string> {
  if (!node || typeof node !== 'object') return acc
  if (typeof node.type === 'string') acc.add(node.type)
  if (typeof node.blockType === 'string') acc.add(`block:${node.blockType}`)
  if (node.fields?.blockType) acc.add(`block:${node.fields.blockType}`)
  if (Array.isArray(node.children)) node.children.forEach((c: unknown) => nodeTypes(c, acc))
  return acc
}

/** Flatten all text content, so we can assert nothing was silently dropped. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allText(node: any, acc: string[] = []): string[] {
  if (!node || typeof node !== 'object') return acc
  if (typeof node.text === 'string') acc.push(node.text)
  if (Array.isArray(node.children)) node.children.forEach((c: unknown) => allText(c, acc))
  return acc
}

/** Walk tabs/rows/groups to find a named richText field. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findRichTextField(fields: any[], name: string): any | undefined {
  for (const field of fields ?? []) {
    if (field?.name === name && field?.type === 'richText') return field
    if (Array.isArray(field?.fields)) {
      const found = findRichTextField(field.fields, name)
      if (found) return found
    }
    if (Array.isArray(field?.tabs)) {
      for (const tab of field.tabs) {
        const found = findRichTextField(tab.fields ?? [], name)
        if (found) return found
      }
    }
  }
  return undefined
}

describe('markdownToLexical, against the real Posts editor config', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const { editorConfigFactory } = await import('@payloadcms/richtext-lexical')
    const field = findRichTextField(payload.collections.posts.config.fields, 'content')
    expect(field, 'Posts.content richText field not found').toBeTruthy()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorConfig = editorConfigFactory.fromField({ field: field as any })
    lexical = markdownToLexical(MARKDOWN, editorConfig)
  })

  it('strips YAML frontmatter from the body', () => {
    expect(stripFrontmatter(MARKDOWN)).not.toContain('slug: fixture')
    const text = allText(lexical.root).join(' ')
    expect(text).not.toContain('title:')
    expect(text).not.toContain('slug:')
  })

  it('produces a Lexical document with a root', () => {
    expect(lexical.root?.type).toBe('root')
    expect(Array.isArray(lexical.root.children)).toBe(true)
    expect(lexical.root.children.length).toBeGreaterThan(0)
  })

  it('converts headings, lists, and quotes into real nodes — not flat paragraphs', () => {
    const types = nodeTypes(lexical.root)
    const got = [...types].join(', ')
    expect(types, got).toContain('heading')
    expect(types, got).toContain('list')
    expect(types, got).toContain('listitem')
    expect(types, got).toContain('quote')
    expect(types, got).toContain('paragraph')
    expect(types, got).toContain('horizontalrule')
  })

  it('turns fenced code into the site Code block, not a dropped node', () => {
    const types = nodeTypes(lexical.root)
    expect(types, [...types].join(', ')).toContain('block:code')

    const codeBlock = lexical.root.children.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c?.type === 'block' && c?.fields?.blockType === 'code',
    )
    expect(codeBlock).toBeTruthy()
    expect(codeBlock.fields.language).toBe('typescript') // 'ts' alias normalized
    expect(codeBlock.fields.code).toBe('const answer = 42')
  })

  it('preserves links and inline formatting rather than literal markdown syntax', () => {
    const text = allText(lexical.root).join(' ')
    expect(text).not.toContain('**bold**')
    expect(text).not.toContain('[link]')
    expect(JSON.stringify(lexical)).toContain('https://example.com')
  })

  it('drops no visible prose', () => {
    const text = allText(lexical.root).join(' ')
    expect(text).toContain('A heading')
    expect(text).toContain('first item')
    expect(text).toContain('ordered one')
    expect(text).toContain('A block quote')
    expect(text).toContain('Final paragraph')
  })

  it('round-trips into a real Post that Payload accepts and stores', async () => {
    const slug = 'markdown-to-lexical-fixture'

    await payload.delete({
      collection: 'posts',
      where: { slug: { equals: slug } },
      context: { disableRevalidate: true },
    })

    const created = await payload.create({
      collection: 'posts',
      draft: true,
      context: { disableRevalidate: true },
      data: {
        title: 'Markdown To Lexical Fixture',
        slug,
        _status: 'draft',
        content: lexical,
      } as never,
    })

    expect(created.id).toBeTruthy()

    const read = await payload.findByID({ collection: 'posts', id: created.id, depth: 0 })
    const readTypes = nodeTypes((read.content as { root?: unknown })?.root)
    expect(readTypes).toContain('heading')
    expect(readTypes).toContain('list')
    expect(readTypes).toContain('block:code')

    await payload.delete({
      collection: 'posts',
      where: { slug: { equals: slug } },
      context: { disableRevalidate: true },
    })
  })
})
