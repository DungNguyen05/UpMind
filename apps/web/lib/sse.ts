type SseDataHandler = (data: string) => void

function dispatchSseEvent(rawEvent: string, onData: SseDataHandler) {
  const dataLines: string[] = []

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6))
    } else if (line === 'data:') {
      dataLines.push('')
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5))
    }
  }

  if (dataLines.length > 0) onData(dataLines.join('\n'))
}

export function createSseParser(onData: SseDataHandler) {
  let buffer = ''

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n/g, '\n')

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        dispatchSseEvent(rawEvent, onData)
        boundary = buffer.indexOf('\n\n')
      }
    },

    flush() {
      if (buffer.trim()) dispatchSseEvent(buffer, onData)
      buffer = ''
    },
  }
}

export async function readSseTextStream(
  stream: ReadableStream<Uint8Array>,
  onText: (text: string) => void
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let text = ''
  const parser = createSseParser((delta) => {
    text += delta
    onText(text)
  })

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parser.push(decoder.decode(value, { stream: true }))
  }

  const tail = decoder.decode()
  if (tail) parser.push(tail)
  parser.flush()

  return text
}

export async function collectSseTextStream(stream: ReadableStream<Uint8Array>) {
  return readSseTextStream(stream, () => {})
}
