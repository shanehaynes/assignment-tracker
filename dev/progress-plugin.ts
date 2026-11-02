// Vite middleware that persists done-marks to data/progress.json.
//   GET /__progress  -> the JSON object ({} when the file is missing; 500 when it cannot be read or parsed)
//   PUT /__progress  -> replaces the file with the request body (must be a JSON object)
// `npm run dev` and `npm run preview` both have it; a build served any other way falls back to localStorage.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
export const PROGRESS_PATH = join(root, 'data', 'progress.json')

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** {} only when the file does not exist; any other failure throws so a damaged file is never served as empty. */
export function readProgress(path = PROGRESS_PATH): Record<string, unknown> {
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
  const parsed: unknown = JSON.parse(raw)
  if (!isPlainObject(parsed)) throw new Error(`${path} does not hold a JSON object`)
  return parsed
}

export function writeProgress(value: Record<string, unknown>, path = PROGRESS_PATH): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
}

export function progressHandler(path = PROGRESS_PATH) {
  return (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method === 'GET') {
      let body: string
      try {
        body = JSON.stringify(readProgress(path))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'progress.json unreadable' }))
        return
      }
      res.end(body)
      return
    }
    if (req.method === 'PUT') {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString('utf8')
      })
      req.on('end', () => {
        try {
          const parsed: unknown = JSON.parse(body)
          if (!isPlainObject(parsed)) throw new Error()
          writeProgress(parsed, path)
          res.statusCode = 204
          res.end()
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'body must be a JSON object' }))
        }
      })
      return
    }
    res.statusCode = 405
    res.end()
  }
}

export function progressPlugin(path = PROGRESS_PATH): Plugin {
  const handler = progressHandler(path)
  return {
    name: 'assignment-tracker:progress',
    configureServer(server) {
      server.middlewares.use('/__progress', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/__progress', handler)
    },
  }
}
