// The dev-server port for THIS checkout. vite.config.ts reads it, and it
// delegates to parallel-agents' lane.sh so lane creation reports the same port.
// Primary checkout → 5173; a worktree → a port hashed from its directory.
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

export function devPort(): number {
  const override = process.env.APP_PORT
  if (override) {
    const n = Number(override)
    if (!Number.isInteger(n) || n < 1024 || n > 65535)
      throw new Error(`APP_PORT must be 1024–65535, got "${override}"`)
    return n
  }
  const lane = join(root, '.claude/skills/parallel-agents/scripts/lane.sh')
  return Number(execFileSync('bash', [lane, 'port', root], { encoding: 'utf8' }).trim())
}
