export async function streamLLMResponse(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  if (!process.env.LLM_API_KEY) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: AI không khả dụng lúc này (chưa cấu hình LLM_API_KEY).\n\n`))
        controller.close()
      },
    })
  }

  const provider = process.env.LLM_PROVIDER ?? 'openai'
  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini'

  if (provider === 'anthropic') {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.LLM_API_KEY })
    return new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          })
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${event.delta.text}\n\n`))
            }
          }
        } catch (e) {
          console.error('Anthropic stream error:', e)
        } finally {
          controller.close()
        }
      },
    })
  }

  // OpenAI / compatible
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || undefined,
  })

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.chat.completions.create({
          model,
          max_tokens: 1024,
          stream: true,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        })
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(`data: ${text}\n\n`))
        }
      } catch (e) {
        console.error('OpenAI stream error:', e)
      } finally {
        controller.close()
      }
    },
  })
}
