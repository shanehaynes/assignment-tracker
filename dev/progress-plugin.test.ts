// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { progressHandler, readProgress } from './progress-plugin.ts'

let dir: string
let file: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'progress-plugin-'))
  file = join(dir, 'progress.json')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function get(path: string) {
  const res = {
    statusCode: 200,
    body: '',
    setHeader() {},
    end(chunk?: string) {
      this.body = chunk ?? ''
    },
  }
  progressHandler(path)({ method: 'GET' } as IncomingMessage, res as unknown as ServerResponse)
  return res
}

describe('readProgress', () => {
  it('returns {} when the file is missing', () => {
    expect(readProgress(file)).toEqual({})
    expect(get(file)).toMatchObject({ statusCode: 200, body: '{}' })
  })

  it('throws on a malformed file, answers GET with 500, and leaves the file byte-identical', () => {
    const damaged = '{ "a": { "done": true, "at": "2026-11-01T12:00:00Z" }, }\n'
    writeFileSync(file, damaged)
    expect(() => readProgress(file)).toThrow()
    const res = get(file)
    expect(res.statusCode).toBe(500)
    expect(JSON.parse(res.body)).toEqual({ error: 'progress.json unreadable' })
    expect(readFileSync(file, 'utf8')).toBe(damaged)
  })

  it('throws when the file holds JSON that is not an object', () => {
    writeFileSync(file, '[]\n')
    expect(() => readProgress(file)).toThrow()
  })

  it('parses a valid file', () => {
    const progress = { a: { done: true, at: '2026-11-01T12:00:00Z' } }
    writeFileSync(file, JSON.stringify(progress))
    expect(readProgress(file)).toEqual(progress)
    expect(JSON.parse(get(file).body)).toEqual(progress)
  })
})
