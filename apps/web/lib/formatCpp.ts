type ScanState = {
  inBlockComment: boolean
}

function scanCppLine(line: string, state: ScanState) {
  let structuralCode = ''
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (state.inBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        state.inBlockComment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === '/' && nextCharacter === '/') break
    if (character === '/' && nextCharacter === '*') {
      state.inBlockComment = true
      index += 1
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    structuralCode += character
  }

  return structuralCode
}

/**
 * A conservative C++ formatter for the browser editor. Monaco does not ship a
 * C++ formatting provider, so this normalizes indentation without rewriting
 * expressions or otherwise changing the program's meaning.
 */
export function formatCppCode(source: string, tabSize = 4) {
  const lines = source.split(/\r?\n/)
  const state: ScanState = { inBlockComment: false }
  const indentUnit = ' '.repeat(tabSize)
  let indentLevel = 0
  let inPreprocessorContinuation = false

  const formattedLines = lines.map((line) => {
    const content = line.trim()
    if (!content) return ''

    const isPreprocessor = inPreprocessorContinuation || content.startsWith('#')
    if (isPreprocessor) {
      inPreprocessorContinuation = line.trimEnd().endsWith('\\')
      return content
    }

    const structuralCode = scanCppLine(content, state).trim()
    const leadingClosingBraces = structuralCode.match(/^}+/)?.[0].length ?? 0
    const isLabel = /^(case\b.*:|default\s*:|(?:public|protected|private)\s*:)/.test(structuralCode)
    const lineIndent = Math.max(0, indentLevel - leadingClosingBraces - (isLabel ? 1 : 0))

    let openingBraces = 0
    let closingBraces = 0
    for (const character of structuralCode) {
      if (character === '{') openingBraces += 1
      if (character === '}') closingBraces += 1
    }
    indentLevel = Math.max(0, indentLevel + openingBraces - closingBraces)

    return `${indentUnit.repeat(lineIndent)}${content}`
  })

  return formattedLines.join('\n')
}
