const { execFile, spawn } = require('child_process')
const { writeFileSync, mkdirSync, rmSync } = require('fs')
const { join } = require('path')
const { v4: uuidv4 } = require('uuid')

async function runInSandbox({ code, input, expectedOutput, timeLimitMs, memoryLimitMb }) {
  const dir = join('/tmp', 'judge', uuidv4())
  mkdirSync(dir, { recursive: true })
  const srcPath = join(dir, 'solution.cpp')
  const binPath = join(dir, 'solution')
  const inputPath = join(dir, 'input.txt')

  try {
    writeFileSync(srcPath, code)
    writeFileSync(inputPath, input)

    // 1. Compile
    const compileResult = await new Promise((resolve) => {
      execFile(
        'g++',
        ['-O2', '-std=c++17', '-o', binPath, srcPath],
        { timeout: 10000 },
        (err, stdout, stderr) => resolve({ err, stderr })
      )
    })
    if (compileResult.err) {
      return { verdict: 'CE', compileError: compileResult.stderr, runtimeMs: null, memoryKb: null, actualOutput: null }
    }

    // 2. Run with ulimit
    const timeLimitSec = Math.ceil(timeLimitMs / 1000)
    const memLimitKb = memoryLimitMb * 1024

    const runResult = await new Promise((resolve) => {
      const startTime = Date.now()
      const child = spawn('bash', [
        '-c',
        `ulimit -v ${memLimitKb}; ulimit -t ${timeLimitSec}; "${binPath}" < "${inputPath}"`,
      ], { timeout: timeLimitMs + 1000 })

      let stdout = '', stderr = ''
      child.stdout.on('data', (d) => {
        stdout += d
        if (stdout.length > 1_000_000) child.kill('SIGKILL')
      })
      child.stderr.on('data', (d) => { stderr += d })

      child.on('close', (code, signal) => {
        const runtimeMs = Date.now() - startTime
        if (signal === 'SIGKILL' || runtimeMs >= timeLimitMs + 500) {
          resolve({ verdict: 'TLE', runtimeMs, memoryKb: null, actualOutput: stdout })
        } else if (code !== 0) {
          const verdict = code === 137 ? 'MLE' : 'RE'
          resolve({ verdict, runtimeMs, memoryKb: null, actualOutput: stdout })
        } else {
          resolve({ verdict: null, runtimeMs, memoryKb: null, actualOutput: stdout.trimEnd() })
        }
      })

      child.on('error', () => resolve({ verdict: 'RE', runtimeMs: 0, memoryKb: null, actualOutput: '' }))
    })

    if (runResult.verdict) return runResult

    // 3. Compare
    const normalize = (s) => s.replace(/\r\n/g, '\n').trimEnd()
    const verdict = normalize(runResult.actualOutput) === normalize(expectedOutput) ? 'AC' : 'WA'
    return { verdict, runtimeMs: runResult.runtimeMs, memoryKb: runResult.memoryKb, actualOutput: runResult.actualOutput }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

module.exports = { runInSandbox }
