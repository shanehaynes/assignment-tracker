// Places milestone labels under the term meter: up to `lanes` rows, longest
// text that fits first, then shorter forms, then no label (the tick stays).

export type TickLabelInput = {
  key: string
  /** Position along the track, in px from its start. */
  x: number
  /** Candidate texts, longest first. */
  texts: string[]
  /** Pin the label to one edge instead of hanging it off the tick. */
  pin?: 'start' | 'end'
  /** Placed before everything else. */
  reserved?: boolean
}

export type PlacedLabel = {
  key: string
  text: string | null
  lane: number
  /** Left edge of the label box, in px from the track start. */
  left: number
  width: number
}

export type LayoutOptions = {
  lanes?: number
  charWidth?: number
  /** Minimum air between two labels in one lane. */
  gap?: number
  /** Minimum air between a label and a leader line passing through its lane. */
  clearance?: number
}

/** "Spring-1 final exam period" → ["Spring-1 final exam period", "Spring-1 final exam", "Spring-1 final", "Spring-1"]. */
export function shortenings(label: string): string[] {
  const words = label.trim().split(/\s+/)
  const out: string[] = []
  for (let n = words.length; n >= 1; n--) out.push(words.slice(0, n).join(' '))
  return out
}

export function layoutTickLabels(
  items: readonly TickLabelInput[],
  width: number,
  { lanes = 2, charWidth = 6.2, gap = 10, clearance = 4 }: LayoutOptions = {},
): PlacedLabel[] {
  const occupied: Array<Array<[number, number]>> = Array.from({ length: lanes }, () => [])
  // A label in lane k hangs from a tick drawn down through lanes 0…k−1.
  const leaders: Array<{ x: number; lane: number }> = []
  const clear = (x: number, [l, r]: [number, number]) => x < l - clearance || x > r + clearance
  const fits = (lane: number, a: number, b: number, x: number | null) =>
    occupied[lane].every(([l, r]) => b + gap <= l || a >= r + gap) &&
    leaders.every((ld) => ld.lane <= lane || clear(ld.x, [a, b])) &&
    (x === null || occupied.slice(0, lane).every((iv) => iv.every((box) => clear(x, box))))

  const order = [...items.keys()].sort((i, j) => {
    const ri = items[i].reserved ? 0 : 1
    const rj = items[j].reserved ? 0 : 1
    return ri - rj || items[i].x - items[j].x
  })

  const placed = new Map<number, PlacedLabel>()
  for (const i of order) {
    const item = items[i]
    let result: PlacedLabel = { key: item.key, text: null, lane: 0, left: item.x, width: 0 }
    search: for (const text of item.texts) {
      const w = Math.ceil(text.length * charWidth)
      if (w > width) continue
      let left: number
      if (item.pin === 'start') left = 0
      else if (item.pin === 'end') left = width - w
      else left = item.x + w <= width ? item.x : item.x - w
      if (left < 0) continue
      const leaderX = item.pin ? null : item.x
      for (let lane = 0; lane < lanes; lane++) {
        if (fits(lane, left, left + w, leaderX)) {
          occupied[lane].push([left, left + w])
          if (leaderX !== null && lane > 0) leaders.push({ x: leaderX, lane })
          result = { key: item.key, text, lane, left, width: w }
          break search
        }
      }
    }
    placed.set(i, result)
  }
  return items.map((_, i) => placed.get(i)!)
}
