type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export const openAIChat = async ({
  apiKey,
  model,
  messages,
  temperature,
  responseFormat,
  maxTokens,
}: {
  apiKey: string
  model: string
  messages: OpenAIChatMessage[]
  temperature: number
  responseFormat?: { type: 'json_object' | 'text' }
  maxTokens?: number
}): Promise<string> => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: responseFormat,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `OpenAI request failed (${res.status})`)
  }

  const json = (await res.json()) as OpenAIChatResponse
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI response missing content')
  return content
}

export const parseJsonFromString = <T>(raw: string): T => {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    const first = trimmed.indexOf('{')
    const last = trimmed.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1)) as T
    }
    throw new Error('Failed to parse JSON')
  }
}
