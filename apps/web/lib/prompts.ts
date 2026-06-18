const BASE = `Bạn là AI Mentor cho học sinh học C++ Competitive Programming.
Trả lời bằng tiếng Việt, format Markdown.
Không đưa lời giải hoàn chỉnh nếu học sinh chỉ cần gợi ý. Ưu tiên gợi mở hướng đi, giải thích khái niệm, chỉ ra lỗi sai và đề xuất test nhỏ để tự kiểm chứng.`

interface ChatPromptContext {
  currentCode?: string | null
  submission?: {
    verdict: string
    code: string
    language: string
    compileError?: string | null
    failedTestInput?: string | null
    failedTestOutput?: string | null
    aiFeedback?: string | null
  } | null
}

function clip(text: string | null | undefined, max = 6000) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}\n...` : text
}

export function buildChatSystemPrompt(
  problemTitle: string,
  problemDescription: string,
  context: ChatPromptContext = {}
): string {
  const codeContext = context.currentCode
    ? `\nCode hiện tại trong editor:\n\`\`\`cpp\n${clip(context.currentCode)}\n\`\`\`\n`
    : ''

  const submissionContext = context.submission
    ? `\nSubmission gần nhất / đang review:
- Verdict: ${context.submission.verdict}
- Language: ${context.submission.language}
${context.submission.compileError ? `\nCompile error:\n\`\`\`\n${clip(context.submission.compileError, 2500)}\n\`\`\`\n` : ''}
${context.submission.failedTestInput ? `\nInput sai hoặc test tái hiện:\n\`\`\`\n${clip(context.submission.failedTestInput, 2500)}\n\`\`\`\n` : ''}
${context.submission.failedTestOutput ? `\nOutput của code:\n\`\`\`\n${clip(context.submission.failedTestOutput, 2500)}\n\`\`\`\n` : ''}
${context.submission.aiFeedback ? `\nAI feedback đã có:\n${clip(context.submission.aiFeedback, 3500)}\n` : ''}
Code đã nộp:
\`\`\`cpp
${clip(context.submission.code)}
\`\`\`
`
    : ''

  return `${BASE}

Bài toán đang thảo luận: **${problemTitle}**

Đề bài:
${problemDescription}
${codeContext}
${submissionContext}
Hướng dẫn:
- Trả lời ngắn gọn, đúng trọng tâm câu hỏi của học sinh.
- Nếu học sinh hỏi về lỗi, nêu root cause trước, sau đó đưa thứ tự debug cụ thể.
- Nếu đề xuất patch, mô tả vị trí/ý tưởng sửa; chỉ đưa snippet nhỏ khi thật cần.
- Nếu học sinh hỏi xin test, tạo test có input rõ ràng và giải thích vì sao test đó hữu ích.`
}

export function buildWalkthroughSystemPrompt(problemTitle: string, problemDescription: string): string {
  return `${BASE}

Bài toán: **${problemTitle}**

Đề bài:
${problemDescription}

Nhiệm vụ: Giải thích dòng code mà học sinh chọn trong ngữ cảnh bài toán này.
- Giải thích mục đích của dòng code đó.
- Liên hệ với thuật toán/cấu trúc dữ liệu trong bài.
- Nếu dòng có rủi ro logic, chỉ ra test nhỏ có thể làm lộ vấn đề.
- Không viết lại toàn bộ lời giải.`
}
