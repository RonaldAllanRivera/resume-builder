#!/usr/bin/env tsx
/**
 * Clears the `batch: -1` row from payload_migrations before migrations run.
 *
 * Why this exists: @payloadcms/drizzle's migrate() blocks on an interactive
 * confirm whenever it finds a row with batch === -1 (the marker Payload writes
 * when dev-mode schema push has been used):
 *
 *   if (migrationsInDB.find((m) => m.batch === -1)) {
 *     const { confirm } = await prompts({ ...initial: false },
 *       { onCancel: () => { process.exit(0) } })
 *     if (!confirm) { process.exit(0) }
 *   }
 *
 * It does NOT honour --force-accept-warning. In CI there is no TTY, so prompts
 * cancels immediately and calls process.exit(0) — a SUCCESS code. The build then
 * reports "migrations completed" having applied nothing, which is how production
 * shipped a schema missing payment_proofs and 500'd the admin panel on
 * `column payload_locked_documents__rels.payment_proofs_id does not exist`.
 *
 * The marker records only that push was used; it carries no schema information,
 * so deleting it is safe and simply lets migrations run unattended.
 *
 * Uses `pg` directly rather than booting Payload — this must work before the
 * schema is correct, and initialising Payload against a broken schema is exactly
 * what we are trying to fix.
 */

import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.log('No DATABASE_URL set — nothing to clear.')
  process.exit(0)
}

// Mirrors the SSL detection in src/payload.config.ts.
const ssl =
  connectionString.includes('.vercel-storage.com') ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('sslmode=verify-full') ||
  process.env.DATABASE_SSL === 'true'

const client = new Client({ connectionString, ssl: ssl ? { rejectUnauthorized: true } : false })

try {
  await client.connect()

  // Absent on a brand-new database; there is then nothing to clear.
  const { rows } = await client.query<{ exists: boolean }>(
    `select to_regclass('public.payload_migrations') is not null as exists`,
  )

  if (!rows[0]?.exists) {
    console.log('payload_migrations does not exist yet — nothing to clear.')
  } else {
    const res = await client.query(`delete from payload_migrations where batch = -1`)
    console.log(
      res.rowCount
        ? `Cleared ${res.rowCount} dev-push marker row(s) so migrations can run unattended.`
        : 'No dev-push marker found — migrations can already run unattended.',
    )
  }
} catch (err) {
  console.error('Failed to clear dev migration marker:', err)
  process.exit(1)
} finally {
  await client.end()
}
