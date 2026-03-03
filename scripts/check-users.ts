import { getPayload } from 'payload'
import config from '@payload-config'

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
    limit: 100,
    overrideAccess: true,
  })

  console.log(`\n📊 User Count: ${users.totalDocs}`)
  
  if (users.totalDocs === 0) {
    console.log('✅ No users exist - /admin/create-first-user is accessible')
  } else {
    console.log('🔒 Users exist - /admin/create-first-user should redirect to login')
    console.log('\nUsers:')
    users.docs.forEach((user: any) => {
      console.log(`  - ${user.email} (roles: ${user.roles?.join(', ') || 'none'})`)
    })
  }

  await payload.destroy()
}

await run()
