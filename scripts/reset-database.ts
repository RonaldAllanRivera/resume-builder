import { getPayload } from 'payload'
import config from '@payload-config'

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  console.log('🗑️  Resetting database content...')

  // Collections to reset
  const collections = [
    'experiences',
    'projects',
    'educations',
    'certifications',
    'companies',
    'jobAds',
    'generations',
    'resumeProfiles',
    'categories',
    'pages',
    'posts',
    'media',
  ] as const

  for (const collection of collections) {
    try {
      // First find all documents
      const docs = await payload.find({
        collection,
        limit: 1000,
        overrideAccess: true,
      })

      // Delete each document individually
      let deletedCount = 0
      for (const doc of docs.docs) {
        await payload.delete({
          collection,
          id: doc.id,
          overrideAccess: true,
        })
        deletedCount++
      }

      console.log(`✅ Deleted ${deletedCount} items from ${collection}`)
    } catch (error) {
      console.log(`⚠️  Could not delete from ${collection}: ${error}`)
    }
  }

  console.log('🎉 Database reset completed!')
  await payload.destroy()
}

await run()
