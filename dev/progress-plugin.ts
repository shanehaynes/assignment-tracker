// Dev-server middleware that persists done-marks to data/progress.json.
//   GET /__progress  -> the JSON object (or {} when the file is missing)
//   PUT /__progress  -> replaces the file with the request body (must be a JSON object)
// Only the dev server has this; the static build falls back to localStorage.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
export const PROGRESS_PATH = join(root, 'data', 'progress.json')

export function readProgress(path = PROGRESS_PATH): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function writeProgress(value: Record<string, unknown>, path = PROGRESS_PATH): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
}

export function progressPlugin(path = PROGRESS_PATH): Plugin {
  return {
    name: 'assignment-tracker:progress',
    configureServer(server) {
      server.middlewares.use('/__progress', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'GET') {
          res.end(JSON.stringify(readProgress(path)))
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
              if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
              writeProgress(parsed as Record<string, unknown>, path)
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
      })
    },
  }
}
