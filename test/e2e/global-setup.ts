import { createServer } from 'node:net'
import { once } from 'node:events'
import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('../..', import.meta.url))

let serverProcess: ChildProcess | null = null

const findFreePort = async (): Promise<number> => {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  server.close()
  await once(server, 'close')
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine free port')
  }
  return address.port
}

const waitForServer = async (url: string, timeoutMs = 30000): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.status < 500) return
    } catch {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  throw new Error(`E2E server at ${url} did not become ready within ${timeoutMs}ms`)
}

export const setup = async (): Promise<void> => {
  if (process.env.NUXT_TEST_HOST) {
    return
  }

  const port = await findFreePort()
  const host = `http://127.0.0.1:${port}`

  serverProcess = spawn('node', ['.output/server/index.mjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port),
      NUXT_TELEMETRY_DISABLED: '1'
    },
    stdio: 'ignore'
  })

  serverProcess.once('error', (err) => {
    throw new Error(`E2E server process error: ${err.message}`)
  })

  await waitForServer(host)

  process.env.NUXT_TEST_HOST = host
}

export const teardown = async (): Promise<void> => {
  if (!serverProcess || serverProcess.killed) return

  serverProcess.kill('SIGTERM')

  await Promise.race([
    once(serverProcess, 'exit'),
    new Promise(resolve => setTimeout(resolve, 10000))
  ])

  if (!serverProcess.killed) {
    serverProcess.kill('SIGKILL')
  }
}
