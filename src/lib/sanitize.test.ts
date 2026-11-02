import { describe, expect, it } from 'vitest'
import { sanitizeDescription } from './sanitize.ts'

describe('sanitizeDescription', () => {
  it('drops scripts, handlers and inline styles', () => {
    const out = sanitizeDescription(
      '<p style="color:red" onclick="x()">Hi<script>alert(1)</script><img src="x" onerror="y()"></p>',
    )
    expect(out).not.toMatch(/script|onclick|onerror|style=/)
    expect(out).toContain('<p>Hi')
  })

  it('opens links in a new tab and absolutizes Canvas paths', () => {
    const out = sanitizeDescription(
      '<a href="/courses/1/files/2">file</a> <a href="https://example.com">ext</a>',
      'https://yale.instructure.com/courses/1/assignments/9',
    )
    const doc = new DOMParser().parseFromString(out, 'text/html')
    const [file, ext] = [...doc.querySelectorAll('a')]
    expect(file.getAttribute('href')).toBe('https://yale.instructure.com/courses/1/files/2')
    expect(ext.getAttribute('href')).toBe('https://example.com')
    for (const a of [file, ext]) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noreferrer')
    }
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeDescription(undefined)).toBe('')
    expect(sanitizeDescription('  ')).toBe('')
  })
})
