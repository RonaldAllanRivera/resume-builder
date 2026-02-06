import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import {
  DEFAULT_AI_GENERATION_COVER_LETTER_PROMPT,
  DEFAULT_AI_GENERATION_COVER_LETTER_STYLE,
  DEFAULT_AI_GENERATION_MODEL,
  DEFAULT_AI_GENERATION_PROMPT_VERSION,
  DEFAULT_AI_GENERATION_RESUME_PROMPT,
  DEFAULT_AI_GENERATION_SYSTEM_PROMPT,
  DEFAULT_AI_GENERATION_TEMPERATURE,
} from '@/AIGenerationSettings/config'
import { isAdmin } from '../../../../access/adminOnly'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdmin(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)

    await payload.updateGlobal({
      slug: 'aiGenerationSettings',
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
      data: {
        promptVersion: DEFAULT_AI_GENERATION_PROMPT_VERSION,
        model: DEFAULT_AI_GENERATION_MODEL,
        temperature: DEFAULT_AI_GENERATION_TEMPERATURE,
        systemPrompt: DEFAULT_AI_GENERATION_SYSTEM_PROMPT,
        resumePrompt: DEFAULT_AI_GENERATION_RESUME_PROMPT,
        coverLetterStyle: DEFAULT_AI_GENERATION_COVER_LETTER_STYLE,
        coverLetterPrompt: DEFAULT_AI_GENERATION_COVER_LETTER_PROMPT,
      },
    })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error resetting AI Generation Settings' })
    return new Response('Error resetting AI Generation Settings.', { status: 500 })
  }
}
