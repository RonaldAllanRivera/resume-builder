import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Database migration script to add booking system collections
 * This script safely adds new collections without affecting existing data
 */

async function migrateDatabase() {
  console.log('Starting database migration for booking system...')
  
  try {
    const payload = await getPayload({ config })
    
    // Check if packages collection exists
    const packagesCheck = await payload.db.driver.query('SELECT to_regclass(\'packages\') as exists')
    const packagesExists = packagesCheck.rows[0]?.exists
    
    if (!packagesExists) {
      console.log('Creating booking system collections...')
      
      // Create the collections using Payload's internal migration system
      await payload.db.migrate({
        migrations: [
          // Packages collection
          {
            name: 'create_packages_collection',
            up: async (db) => {
              await db.query(`
                CREATE TABLE IF NOT EXISTS "packages" (
                  "id" SERIAL PRIMARY KEY,
                  "name" VARCHAR(255) NOT NULL,
                  "slug" VARCHAR(255) UNIQUE NOT NULL,
                  "description" TEXT,
                  "shortDescription" TEXT,
                  "price" INTEGER NOT NULL,
                  "currency" VARCHAR(3) DEFAULT 'USD',
                  "duration" INTEGER,
                  "durationUnit" VARCHAR(20),
                  "active" BOOLEAN DEFAULT true,
                  "features" JSONB,
                  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `)
              
              // Create indexes
              await db.query('CREATE INDEX IF NOT EXISTS "packages_slug_idx" ON "packages" ("slug")')
              await db.query('CREATE INDEX IF NOT EXISTS "packages_active_idx" ON "packages" ("active")')
            }
          },
          
          // Customers collection
          {
            name: 'create_customers_collection',
            up: async (db) => {
              await db.query(`
                CREATE TABLE IF NOT EXISTS "customers" (
                  "id" SERIAL PRIMARY KEY,
                  "name" VARCHAR(255) NOT NULL,
                  "email" VARCHAR(255) UNIQUE NOT NULL,
                  "phone" VARCHAR(50),
                  "company" VARCHAR(255),
                  "notes" TEXT,
                  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `)
              
              await db.query('CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" ("email")')
            }
          },
          
          // Availability Rules collection
          {
            name: 'create_availability_rules_collection',
            up: async (db) => {
              await db.query(`
                CREATE TABLE IF NOT EXISTS "availability_rules" (
                  "id" SERIAL PRIMARY KEY,
                  "name" VARCHAR(255) NOT NULL,
                  "rules" JSONB NOT NULL,
                  "timezone" VARCHAR(50) DEFAULT 'UTC',
                  "active" BOOLEAN DEFAULT true,
                  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `)
            }
          },
          
          // Bookings collection
          {
            name: 'create_bookings_collection',
            up: async (db) => {
              await db.query(`
                CREATE TABLE IF NOT EXISTS "bookings" (
                  "id" SERIAL PRIMARY KEY,
                  "customer" INTEGER REFERENCES "customers"("id"),
                  "package" INTEGER REFERENCES "packages"("id"),
                  "status" VARCHAR(50) DEFAULT 'pending',
                  "startTime" TIMESTAMP WITH TIME ZONE,
                  "endTime" TIMESTAMP WITH TIME ZONE,
                  "duration" INTEGER,
                  "durationUnit" VARCHAR(20),
                  "price" INTEGER,
                  "currency" VARCHAR(3) DEFAULT 'USD',
                  "paymentMode" VARCHAR(50) DEFAULT 'pay_before',
                  "depositAmount" INTEGER,
                  "notes" TEXT,
                  "stripeCheckoutId" VARCHAR(255),
                  "stripePaymentIntentId" VARCHAR(255),
                  "paidAt" TIMESTAMP WITH TIME ZONE,
                  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `)
              
              await db.query('CREATE INDEX IF NOT EXISTS "bookings_customer_idx" ON "bookings" ("customer")')
              await db.query('CREATE INDEX IF NOT EXISTS "bookings_package_idx" ON "bookings" ("package")')
              await db.query('CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status")')
              await db.query('CREATE INDEX IF NOT EXISTS "bookings_startTime_idx" ON "bookings" ("startTime")')
            }
          }
        ]
      })
      
      console.log('Booking system collections created successfully')
    } else {
      console.log('Booking system collections already exist')
    }
    
    // Update Payload metadata tables to include new collections
    console.log('Updating Payload metadata...')
    
    // This will trigger Payload to update its internal metadata
    await payload.db.query(`
      INSERT INTO "payload_collections" ("slug", "labels", "admin", "fields", "timestamps")
      VALUES 
        ('packages', '{"singular": "Package", "plural": "Packages"}', '{"group": "Booking"}', '[]', true)
      ON CONFLICT ("slug") DO NOTHING
    `)
    
    await payload.db.query(`
      INSERT INTO "payload_collections" ("slug", "labels", "admin", "fields", "timestamps")
      VALUES 
        ('customers', '{"singular": "Customer", "plural": "Customers"}', '{"group": "Booking"}', '[]', true)
      ON CONFLICT ("slug") DO NOTHING
    `)
    
    await payload.db.query(`
      INSERT INTO "payload_collections" ("slug", "labels", "admin", "fields", "timestamps")
      VALUES 
        ('availability_rules', '{"singular": "Availability Rule", "plural": "Availability Rules"}', '{"group": "Booking"}', '[]', true)
      ON CONFLICT ("slug") DO NOTHING
    `)
    
    await payload.db.query(`
      INSERT INTO "payload_collections" ("slug", "labels", "admin", "fields", "timestamps")
      VALUES 
        ('bookings', '{"singular": "Booking", "plural": "Bookings"}', '{"group": "Booking"}', '[]', true)
      ON CONFLICT ("slug") DO NOTHING
    `)
    
    console.log('Database migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateDatabase().then(() => {
  console.log('Migration completed')
  process.exit(0)
}).catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
