import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Semester } from '../types.ts'
import { daysBetween, formatMonthDay, formatMonthDayRange, startOfDay } from '../lib/dates.ts'
import { layoutTickLabels, shortenings, type TickLabelInput } from '../lib/milestones.ts'
import { termFraction, termPercent } from '../lib/progress.ts'

type Props = {
  semester: Semester
  now: Date
  done: number
  total: number
  saveFailed: boolean
}

const FALLBACK_TRACK_WIDTH = 560

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setWidth(w)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** "Spring break (International Experience …)" → "Spring break". */
const plainLabel = (label: string) => label.replace(/\s*\(.*\)\s*$/, '').trim()

export default function ProgressStrip({ semester, now, done, total, saveFailed }: Props) {
  const termId = useId()
  const workId = useId()
  const [ticksRef, trackWidth] = useWidth<HTMLOListElement>(FALLBACK_TRACK_WIDTH)

  const pct = termPercent(now, semester)
  const todayAt = termFraction(now.getTime(), semester)
  const workShare = total > 0 ? done / total : 0
  const workPct = Math.round(workShare * 100)

  const ticks = useMemo(
    () =>
      semester.milestones.map((m) => {
        const at = termFraction(startOfDay(m.date).getTime(), semester)
        const when = formatMonthDayRange(m.date, m.end)
        const priority = m.end ? daysBetween(m.date, m.end) : 0
        return { key: `${m.date}-${m.label}`, at, label: m.label, when, priority }
      }),
    [semester],
  )

  const labels = useMemo(() => {
    const endText = semester.end_label ? plainLabel(semester.end_label) : ''
    const inputs: TickLabelInput[] = [
      { key: 'start', x: 0, texts: [formatMonthDay(semester.start)], pin: 'start', reserved: true },
      {
        key: 'end',
        x: trackWidth,
        texts: endText
          ? [`${endText}, ${formatMonthDay(semester.end)}`, endText]
          : [formatMonthDay(semester.end)],
        pin: 'end',
        reserved: true,
      },
      ...ticks.map((t) => ({
        key: t.key,
        x: t.at * trackWidth,
        texts: shortenings(t.label),
        priority: t.priority,
      })),
    ]
    const placed = layoutTickLabels(inputs, trackWidth)
    return new Map(placed.map((p) => [p.key, p]))
  }, [semester, ticks, trackWidth])

  const start = labels.get('start')
  const end = labels.get('end')
  const lanesUsed = Math.max(0, ...[...labels.values()].map((p) => (p.text ? p.lane + 1 : 0)))
  const endName = semester.end_label ? plainLabel(semester.end_label) : 'the end of term'

  return (
    <section aria-label="Progress" className="progress">
      <div className="meter-row">
        <span className="meter-label" id={termId}>
          Term
        </span>
        <div className="meter-body">
          <div
            className="meter"
            role="progressbar"
            aria-labelledby={termId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct}% of the term, ${formatMonthDay(semester.start)} to ${endName} on ${formatMonthDay(semester.end)}`}
          >
            <span className="meter-fill" style={{ width: `${todayAt * 100}%` }} />
          </div>
          <span className="today-tick" aria-hidden="true" style={{ left: `${todayAt * 100}%` }} />
          <ol className="ticks" ref={ticksRef} aria-hidden="true">
            {ticks.map((t) => {
              const placed = labels.get(t.key)
              const lane = placed?.text ? placed.lane : -1
              return (
                <li
                  key={t.key}
                  className="tick"
                  data-lane={lane}
                  style={{ left: `${t.at * 100}%` }}
                />
              )
            })}
          </ol>
          <div className="tick-labels" aria-hidden="true" data-lanes={lanesUsed}>
            {[start, end, ...ticks.map((t) => labels.get(t.key))].map((p) =>
              p?.text ? (
                <span
                  key={p.key}
                  className="tick-label"
                  data-lane={p.lane}
                  style={
                    p.key === 'end' ? { right: 0 } : { left: `${(p.left / trackWidth) * 100}%` }
                  }
                >
                  {p.text}
                </span>
              ) : null,
            )}
          </div>
          {ticks.length > 0 ? (
            <details className="milestones">
              <summary>Milestones</summary>
              <ol>
                {ticks.map((t) => (
                  <li key={t.key}>{`${t.when}: ${t.label}`}</li>
                ))}
              </ol>
            </details>
          ) : null}
        </div>
        <span className="meter-value" data-testid="progress-time">
          {pct}% of the term
        </span>
      </div>

      <div className="meter-row">
        <span className="meter-label" id={workId}>
          Work
        </span>
        <div className="meter-body">
          <div
            className="meter"
            role="progressbar"
            aria-labelledby={workId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={workPct}
            aria-valuetext={`${done} of ${total} done`}
          >
            <span className="meter-fill" style={{ width: `${workShare * 100}%` }} />
          </div>
        </div>
        <span className="meter-value" data-testid="progress-work">
          {done} of {total} done
        </span>
      </div>

      <p className="save-note" role="status">
        {saveFailed ? 'Not saved' : ''}
      </p>

      {semester.motto ? (
        <p className="motto" data-testid="motto">
          <span className="motto-text">{semester.motto}</span>
          {semester.motto_attribution ? (
            <span className="motto-by"> — {semester.motto_attribution}</span>
          ) : null}
        </p>
      ) : null}
    </section>
  )
}
