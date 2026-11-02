import { describe, expect, it } from 'vitest'
import { layoutTickLabels, shortenings, type TickLabelInput } from './milestones.ts'

const overlaps = (a: { left: number; width: number }, b: { left: number; width: number }) =>
  a.left < b.left + b.width && b.left < a.left + a.width

describe('milestone labels', () => {
  it('shortens by dropping trailing words', () => {
    expect(shortenings('Final exam period')).toEqual(['Final exam period', 'Final exam', 'Final'])
  })

  it('never overlaps two labels in one lane, and keeps leaders clear of labels above them', () => {
    const items: TickLabelInput[] = [
      { key: 'start', x: 0, texts: ['Oct 26'], pin: 'start', reserved: true },
      {
        key: 'end',
        x: 400,
        texts: ['Spring break, Mar 8', 'Spring break'],
        pin: 'end',
        reserved: true,
      },
      { key: 'a', x: 84, texts: shortenings('November recess') },
      { key: 'b', x: 150, texts: shortenings('Fall-2 classes end') },
      { key: 'c', x: 153, texts: shortenings('Final exam period') },
      { key: 'd', x: 175, texts: shortenings('Winter recess') },
      { key: 'e', x: 255, texts: shortenings('Spring-1 classes begin') },
      { key: 'f', x: 382, texts: shortenings('Spring-1 classes end') },
    ]
    const placed = layoutTickLabels(items, 400)
    const shown = placed.filter((p) => p.text)
    for (const p of shown) {
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.left + p.width).toBeLessThanOrEqual(400)
      for (const q of shown) if (p !== q && p.lane === q.lane) expect(overlaps(p, q)).toBe(false)
    }
    for (const p of shown.filter((p) => p.lane > 0)) {
      const x = items.find((i) => i.key === p.key)!.x
      for (const q of shown.filter((q) => q.lane < p.lane))
        expect(x < q.left || x > q.left + q.width).toBe(true)
    }
    expect(placed.find((p) => p.key === 'start')?.text).toBe('Oct 26')
    expect(placed.find((p) => p.key === 'end')?.left).toBeCloseTo(
      400 - placed.find((p) => p.key === 'end')!.width,
    )
  })

  it('drops a label that cannot fit anywhere but still returns its slot', () => {
    const placed = layoutTickLabels(
      [
        { key: 'a', x: 10, texts: ['Long label here'] },
        { key: 'b', x: 12, texts: ['Another long one'] },
        { key: 'c', x: 14, texts: ['Third'] },
      ],
      200,
    )
    expect(placed.map((p) => p.key)).toEqual(['a', 'b', 'c'])
    expect(placed.filter((p) => p.text).length).toBeLessThan(3)
  })
})
