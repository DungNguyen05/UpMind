const { Worker } = require('bullmq')
const { Redis } = require('ioredis')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
const redisPublisher = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })

function createLLMClient() {
  const provider = process.env.LLM_PROVIDER || 'openai'
  if (provider === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk')
    return { provider: 'anthropic', client: new Anthropic.default({ apiKey: process.env.LLM_API_KEY }) }
  }
  const OpenAI = require('openai')
  return {
    provider: 'openai',
    client: new OpenAI.default({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL || undefined,
    }),
  }
}

async function callLLM(systemPrompt, userMessage) {
  const { provider, client } = createLLMClient()
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  if (provider === 'anthropic') {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    return response.content[0].text
  }
  const response = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
  })
  return response.choices[0].message.content
}

function buildPrompt(data) {
  const base = `Bạn là AI Mentor cho học sinh học C++ Competitive Programming.
Trả lời bằng tiếng Việt, format Markdown.
Luôn chia phản hồi thành các mục ngắn:
1. Root cause
2. Patch đề xuất
3. Test nên thử
4. Câu hỏi follow-up
Không đưa full lời giải hoàn chỉnh; chỉ đưa snippet nhỏ khi thật cần để sửa lỗi.`

  switch (data.verdict) {
    case 'WA':
      return {
        system: `${base}\nVới Wrong Answer: chỉ ra logic sai và test tái hiện, không viết lại toàn bộ lời giải.`,
        user: `Bài:\n${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nInput bị sai:\n${data.failedTestInput}\n\nOutput của code:\n${data.failedTestOutput}`,
      }
    case 'TLE':
      return {
        system: `${base}\nVới TLE: chỉ ra đoạn/chỗ có khả năng gây chậm, gợi ý giảm độ phức tạp.`,
        user: `Bài:\n${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nTime limit: ${data.timeLimitMs}ms`,
      }
    case 'MLE':
      return {
        system: `${base}\nVới MLE: chỉ ra cấu trúc dữ liệu hoặc cấp phát có khả năng dùng quá nhiều bộ nhớ.`,
        user: `Bài:\n${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'RE':
      return {
        system: `${base}\nVới Runtime Error: phân tích out-of-bound, chia cho 0, recursion sâu, overflow hoặc input edge case.`,
        user: `Bài:\n${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'CE':
      return {
        system: `${base}\nVới Compile Error: giải thích lỗi compile đầu tiên rõ ràng cho học sinh.`,
        user: `Code:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nLỗi compile:\n${data.compileError}`,
      }
    case 'AC':
      return {
        system: `${base}\nVới Accepted: review code style C++, readability, edge cases và cách chứng minh.`,
        user: `Bài:\n${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    default:
      return null
  }
}

const feedbackTypeMap = {
  WA: 'wa_hint',
  TLE: 'tle_hint',
  MLE: 'tle_hint',
  RE: 'wa_hint',
  CE: 'ce_explain',
  AC: 'ac_review',
}

if (process.env.LLM_API_KEY) {
  const aiWorker = new Worker(
    'ai-queue',
    async (job) => {
      const data = job.data
      const prompt = buildPrompt(data)
      if (!prompt) return
      try {
        const content = await callLLM(prompt.system, prompt.user)
        await prisma.aiFeedback.upsert({
          where: { submissionId: data.submissionId },
          create: {
            submissionId: data.submissionId,
            feedbackType: feedbackTypeMap[data.verdict] || 'wa_hint',
            content,
            llmProvider: process.env.LLM_PROVIDER || 'openai',
          },
          update: { content },
        })
        await redisPublisher.publish(
          `submission:${data.submissionId}`,
          JSON.stringify({ aiFeedbackReady: true, feedbackType: feedbackTypeMap[data.verdict] })
        )
      } catch (error) {
        console.error('AI feedback failed:', error.message)
        await redisPublisher.publish(
          `submission:${data.submissionId}`,
          JSON.stringify({ aiFeedbackFailed: true })
        )
      }
    },
    { connection: redis }
  )
  console.log('AI feedback worker started')
} else {
  console.log('LLM_API_KEY not set - AI feedback worker skipped')
}
