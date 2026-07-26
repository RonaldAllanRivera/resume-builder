import 'dotenv/config'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import { markdownToLexical } from '../src/lib/markdown-to-lexical'

/**
 * Seed the markdown blog drafts in docs/blog-drafts/ into the Posts collection.
 *
 * - Always creates DRAFTS. Nothing is auto-published; the whole point is to
 *   review each post in the admin (and via the frontend preview) before it goes
 *   live. Publishing stays a manual, deliberate click.
 * - Idempotent: upserts by slug, so re-running updates in place rather than
 *   creating duplicates.
 * - Safe to run against production — it only ever writes drafts and never
 *   touches a post that isn't one of these slugs.
 *
 * Run: pnpm seed:blog
 *
 * Optional publish date: add `publishedAt: 2026-07-20` to a draft's frontmatter
 * to back-date it. It's stored on the draft, so when you publish, the post shows
 * that date instead of the publish moment.
 */

const DRAFTS_DIR = join(process.cwd(), 'docs', 'blog-drafts')

interface Frontmatter {
  title?: string
  slug?: string
  metaDescription?: string
  publishedAt?: string
}

/** Minimal frontmatter parser — the drafts use flat `key: value` pairs only. */
function parseFrontmatter(raw: string): Frontmatter {
  if (!raw.startsWith('---')) return {}
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return {}
  const block = raw.slice(3, end)
  const fm: Record<string, string> = {}
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    // strip a single wrapping pair of quotes, if present, and unescape the
    // YAML doubled-quote form ('' → ' inside single quotes, "" → " inside
    // double). Without this, a title like 'Polylang''s' renders literally as
    // "Polylang''s".
    if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1).replace(/''/g, "'")
    } else if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/""/g, '"')
    }
    fm[m[1]] = value
  }
  return fm
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })
  const req = await createLocalReq({ req: { headers: new Headers() } }, payload)

  // Resolve the editor config from the real Posts.content field, so conversion
  // uses the exact feature set the field has.
  const contentField = findRichTextField(payload.collections.posts.config.fields, 'content')
  if (!contentField) throw new Error('Posts.content richText field not found')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorConfig = editorConfigFactory.fromField({ field: contentField as any })

  const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.md'))
  if (files.length === 0) {
    console.log(`No .md drafts found in ${DRAFTS_DIR}`)
    return
  }

  console.log(`Found ${files.length} draft(s) in ${DRAFTS_DIR}\n`)

  for (const file of files) {
    const raw = readFileSync(join(DRAFTS_DIR, file), 'utf8')
    const fm = parseFrontmatter(raw)

    const title = fm.title || file.replace(/\.md$/, '')
    const slug = fm.slug
    if (!slug) {
      console.warn(`  ⚠ ${file}: no slug in frontmatter — skipped`)
      continue
    }

    const content = markdownToLexical(raw, editorConfig)

    const data: Record<string, unknown> = {
      title,
      slug,
      _status: 'draft',
      content,
    }
    if (fm.metaDescription) data.meta = { title, description: fm.metaDescription }
    if (fm.publishedAt) data.publishedAt = fm.publishedAt

    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      req,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data: data as never,
        draft: true,
        req,
      })
      console.log(`  ↻ updated draft: ${slug}`)
    } else {
      await payload.create({
        collection: 'posts',
        data: data as never,
        draft: true,
        req,
      })
      console.log(`  + created draft: ${slug}`)
    }
  }

  console.log('\nDone. Review each post in the admin, then publish the ones you want.')
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

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
