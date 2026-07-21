import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * First real migration for this project.
 *
 * Context: the schema had only ever been maintained by Payload's dev-mode
 * auto-push, which is disabled when NODE_ENV=production. `scripts/vercel-build.sh`
 * appeared to migrate but both of its steps were no-ops (init-db.ts only issues
 * find() queries; `payload migrate` had an empty src/migrations). So production
 * drifted behind the code until /admin 500'd on
 * `column payload_locked_documents__rels.payment_proofs_id does not exist`.
 *
 * `payload migrate:create` diffs against the previous migration's snapshot, not
 * the live DB — with no prior migration it emitted the ENTIRE schema (101 CREATE
 * TABLE / 101 DROP TABLE), which would fail on the first existing table and, in
 * down(), drop the database. This file is the hand-reduced delta instead.
 *
 * Every statement is guarded (IF NOT EXISTS / IF EXISTS) because the exact
 * baseline of each environment differs — local and production drifted apart
 * independently — so this must be safe to apply to either.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // --- Missing: the payment-proof upload collection (added in 37ec368) -------
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payment_proofs" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payment_proofs_updated_at_idx" ON "payment_proofs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payment_proofs_created_at_idx" ON "payment_proofs" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "payment_proofs_filename_idx" ON "payment_proofs" USING btree ("filename");
  `)

  // --- The column that actually broke /admin --------------------------------
  // The admin dashboard selects every collection's rel column from this table,
  // so one missing column 500s the whole panel, not just the booking screens.
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payment_proofs_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_payment_proofs_fk"
        FOREIGN KEY ("payment_proofs_id") REFERENCES "public"."payment_proofs"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payment_proofs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("payment_proofs_id");
  `)

  // --- Missing: the bookingSettings global table entirely --------------------
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "booking_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "booking_enabled" boolean DEFAULT true,
      "payment_terms_summary" varchar DEFAULT 'Payment is by invoice after I review and accept your request.',
      "payment_instructions" varchar,
      "notification_email" varchar,
      "deposit_percent" numeric DEFAULT 50,
      "deposit_due_days_before_start" numeric DEFAULT 3,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  // --- Booking payment/proof columns ----------------------------------------
  // ADD VALUE is safe inside a transaction on PG12+ as long as the new label is
  // not referenced in the same transaction — it is not, below.
  await db.execute(sql`
    ALTER TYPE "public"."enum_bookings_status" ADD VALUE IF NOT EXISTS 'payment_submitted' AFTER 'pending_payment';
  `)

  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_due_at" timestamp(3) with time zone;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_proof_id" integer;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_is_receipt" boolean;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_amount_minor" numeric;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_currency" varchar;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_reference_number" varchar;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_sender_name" varchar;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_paid_at" varchar;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_extracted_channel" varchar;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_amount_matches" boolean;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proof_token" varchar;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "bookings"
        ADD CONSTRAINT "bookings_payment_proof_id_payment_proofs_id_fk"
        FOREIGN KEY ("payment_proof_id") REFERENCES "public"."payment_proofs"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "bookings_payment_proof_idx" ON "bookings" USING btree ("payment_proof_id");
  `)

  // --- Per-package lead-time override ---------------------------------------
  await db.execute(sql`
    ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "advance_notice_days" numeric;
  `)

  // --- NOT dropped here, deliberately ---------------------------------------
  // The code no longer declares these five columns:
  //   bookings.stripe_checkout_session_id, bookings.stripe_payment_intent_id,
  //   packages.stripe_price_id, packages.stripe_product_id,
  //   availability_rules.confirmation_window_hours
  // (removed in 37ec368 and c394cf7). Dropping them is irreversible and would
  // remove this migration's rollback path, so it is held back as a separate
  // "contract" step to run after a verified production backup.
  //
  // Note this will NOT resurface on its own: migrate:create diffs new code
  // against the snapshot JSON, and both already lack these columns, so no
  // future migration will propose the drop. It has to be written by hand.
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Fully reverses up(), because up() is purely additive. The one exception is
  // the 'payment_submitted' enum label, left in place on purpose — removing an
  // enum value requires rewriting the type, and any row still holding that
  // status would be orphaned. An unused label is harmless.
  await db.execute(sql`
    ALTER TABLE "packages" DROP COLUMN IF EXISTS "advance_notice_days";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "payment_due_at";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "payment_proof_id";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_is_receipt";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_amount_minor";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_currency";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_reference_number";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_sender_name";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_paid_at";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_extracted_channel";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_amount_matches";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "proof_token";
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payment_proofs_id";
    DROP TABLE IF EXISTS "payment_proofs" CASCADE;
    DROP TABLE IF EXISTS "booking_settings";
  `)
}
