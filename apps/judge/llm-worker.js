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
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    return response.content[0].text
  }
  const response = await client.chat.completions.create({
    model,
    max_tokens: 300,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
  })
  return response.choices[0].message.content
}

function buildPrompt(data) {
  const base = `Nhận xét code C++ bằng tiếng Việt. Tối đa 3 câu. Không dùng tiêu đề, không đánh số, không bullet. Nói thẳng vào vấn đề.`

  switch (data.verdict) {
    case 'AC':
      return {
        system: `${base} Code đã AC — nhận xét kỹ thuật hoặc style. Khen nếu tốt, chỉ một điểm cải thiện nếu có.`,
        user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'WA':
      return {
        system: `${base} Code bị WA — chỉ đúng chỗ sai dựa trên test, giải thích tại sao, một gợi ý fix.`,
        user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nInput sai:\n\`\`\`\n${data.failedTestInput}\n\`\`\`\nOutput code:\n\`\`\`\n${data.failedTestOutput}\n\`\`\``,
      }
    case 'TLE':
      return {
        system: `${base} Code bị TLE (limit ${data.timeLimitMs}ms) — chỉ đoạn chậm nhất, O(?), một hướng tối ưu.`,
        user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'MLE':
      return {
        system: `${base} Code bị MLE — chỉ cấu trúc ngốn bộ nhớ nhất, một cách giảm.`,
        user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'RE':
      return {
        system: `${base} Code bị RE — xác định nguyên nhân, chỉ dòng nghi ngờ, gợi ý fix.`,
        user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``,
      }
    case 'CE':
      return {
        system: `${base} Code bị CE — dịch lỗi sang tiếng Việt thường, chỉ dòng lỗi, cách sửa.`,
        user: `Code:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nLỗi:\n\`\`\`\n${data.compileError}\n\`\`\``,
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
