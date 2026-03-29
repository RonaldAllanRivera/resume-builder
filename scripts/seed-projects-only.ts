import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { seedResumeComplete } from '../src/endpoints/seed-resume-complete'

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const req = await createLocalReq(
    {
      req: {
        headers: new Headers(),
      },
    },
    payload,
  )

  // Delete all existing projects first
  console.log('Deleting existing projects...')
  const { docs: existingProjects } = await payload.find({
    collection: 'projects',
    limit: 1000,
  })

  for (const project of existingProjects) {
    await payload.delete({
      collection: 'projects',
      id: project.id,
      req,
    })
  }

  console.log(`Deleted ${existingProjects.length} existing projects`)

  // Seed new projects with categories
  await seedResumeComplete({
    payload,
    req,
    overrideAccess: true,
    skipProjects: false,
  })

  await payload.destroy()
  console.log('✅ Projects seeding complete!')
}

await run()
