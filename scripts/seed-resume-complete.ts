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

  await seedResumeComplete({ payload, req, overrideAccess: true })

  await payload.destroy()
}

await run()
