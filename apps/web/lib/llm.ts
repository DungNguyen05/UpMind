function encodeSse(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => `data: ${line}`)
    .join('\n') + '\n\n'
}

function enqueueSse(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  text: string
) {
  try {
    controller.enqueue(encoder.encode(encodeSse(text)))
    return true
  } catch {
    return false
  }
}

function closeController(controller: ReadableStreamDefaultController) {
  try {
    controller.close()
  } catch {}
}

export async function streamLLMResponse(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  if (!process.env.LLM_API_KEY) {
    return new ReadableStream({
      start(controller) {
        enqueueSse(controller, encoder, 'AI không khả dụng lúc này vì chưa cấu hình LLM_API_KEY.')
        closeController(controller)
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
              if (!enqueueSse(controller, encoder, event.delta.text)) return
            }
          }
        } catch (error) {
          console.error('Anthropic stream error:', error)
          enqueueSse(controller, encoder, 'Mentor gặp lỗi khi gọi Anthropic. Hãy thử lại sau.')
        } finally {
          closeController(controller)
        }
      },
    })
  }

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
          if (text && !enqueueSse(controller, encoder, text)) return
        }
      } catch (error) {
        console.error('OpenAI stream error:', error)
        enqueueSse(controller, encoder, 'Mentor gặp lỗi khi gọi LLM. Hãy thử lại sau.')
      } finally {
        closeController(controller)
      }
    },
  })
}
