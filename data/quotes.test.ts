import { describe, expect, it } from 'vitest'
import quotes from './quotes.json'
import type { Quote } from '../src/types.ts'

const ANCHOR = "The struggle itself toward the heights is enough to fill a man's heart."
const words = (text: string) => text.trim().split(/\s+/).length
const key = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

describe('data/quotes.json', () => {
  const bank = quotes as Quote[]

  it('is a non-empty bank of complete, sourced quotes', () => {
    expect(bank.length).toBeGreaterThan(0)
    for (const q of bank) {
      expect(q.text, q.text).toBe(q.text.trim())
      expect(q.text.length, q.text).toBeGreaterThan(0)
      expect(q.author, q.text).toBe(q.author.trim())
      expect(q.author.length, q.text).toBeGreaterThan(0)
      expect(q.work, q.text).toBe(q.work.trim())
      expect(q.work.length, q.text).toBeGreaterThan(0)
      expect(q.source_url, q.text).toMatch(/^https:\/\/\S+$/)
      if (q.locator !== undefined) {
        expect(q.locator, q.text).toBe(q.locator.trim())
        expect(q.locator.length, q.text).toBeGreaterThan(0)
      }
    }
  })

  it('keeps every quote to forty words and free of surrounding quotation marks', () => {
    for (const q of bank) {
      expect(words(q.text), q.text).toBeLessThanOrEqual(40)
      // A line may end inside a quotation (Zarathustra's "Once more!"); it must not open with one.
      expect(q.text, q.text).not.toMatch(/^["“”'‘’]/)
    }
  })

  it('has no duplicate texts and at most three quotes per author', () => {
    const keys = bank.map((q) => key(q.text))
    expect(new Set(keys).size).toBe(keys.length)
    const perAuthor = new Map<string, number>()
    for (const q of bank) perAuthor.set(key(q.author), (perAuthor.get(key(q.author)) ?? 0) + 1)
    for (const [author, n] of perAuthor) expect(n, author).toBeLessThanOrEqual(3)
  })

  it('includes the Camus line the bank grew from', () => {
    expect(bank.some((q) => q.text === ANCHOR)).toBe(true)
  })
})
