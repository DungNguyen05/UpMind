'use client'

import { useState } from 'react'

interface Example {
  input: string
  expectedOutput: string
}

export default function ProblemExamples({ examples }: { examples: Example[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (value: string, key: string) => {
    await navigator.clipboard?.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied((current) => current === key ? null : current), 1400)
  }

  return (
    <section className="problem-examples" aria-label="Ví dụ">
      {examples.map((example, index) => {
        const inputKey = `${index}-input`
        const outputKey = `${index}-output`

        return (
          <article key={index} className="problem-example">
            <h3>Ví dụ {index + 1}</h3>
            <div className="example-field">
              <div className="example-field-head">
                <span>Input</span>
                <button className="example-copy-btn ghost-btn" type="button"
                  aria-label={`Copy input ví dụ ${index + 1}`}
                  onClick={() => copy(example.input, inputKey)}>
                  {copied === inputKey ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <pre>{example.input}</pre>
            </div>

            <div className="example-field">
              <div className="example-field-head">
                <span>Output</span>
                <button className="example-copy-btn ghost-btn" type="button"
                  aria-label={`Copy output ví dụ ${index + 1}`}
                  onClick={() => copy(example.expectedOutput, outputKey)}>
                  {copied === outputKey ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <pre>{example.expectedOutput}</pre>
            </div>
          </article>
        )
      })}
    </section>
  )
}
