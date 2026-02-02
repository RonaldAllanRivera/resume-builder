import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { seedResume } from '../src/endpoints/seed-resume'

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

  await seedResume({ payload, req, overrideAccess: true })

  await payload.destroy()
}

await run()
