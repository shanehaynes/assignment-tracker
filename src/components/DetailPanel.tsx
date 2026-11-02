import { useEffect, useMemo, useRef } from 'react'
import type { Assignment } from '../types.ts'
import { dayKey, formatDue, formatRelativeDue } from '../lib/dates.ts'
import { COURSE_LABEL, KIND_LABEL, SOURCE_LABEL } from '../lib/labels.ts'
import { sanitizeDescription } from '../lib/sanitize.ts'

type Props = {
  id: string
  assignment: Assignment
  todayKey: string
  onClose: () => void
}

const isUrl = (s: string) => /^https?:\/\//i.test(s)

const wideLayout = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(min-width: 960px)').matches
    : false

export default function DetailPanel({ id, assignment: a, todayKey, onClose }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const html = useMemo(
    () => sanitizeDescription(a.description_html, a.canvas_url),
    [a.description_html, a.canvas_url],
  )

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: wideLayout() })
  }, [a.id])

  const work = [
    a.work === 'group' ? 'Group work' : 'Individual work',
    a.points != null && a.points > 0 ? `${a.points} points` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <aside aria-label="Assignment detail" id={id} className="detail" data-course={a.course}>
      <div className="detail-top">
        <p className="detail-course">
          <span className="tint-dot" aria-hidden="true" />
          {COURSE_LABEL[a.course]} · {KIND_LABEL[a.kind]}
        </p>
        <button type="button" className="text-button detail-close" onClick={onClose}>
          Close
        </button>
      </div>

      <h2 className="detail-title" tabIndex={-1} ref={headingRef}>
        {a.title}
      </h2>

      <p className="detail-due">
        <time dateTime={a.due_at}>{formatDue(a)}</time>
        <span className="detail-relative">
          {formatRelativeDue(dayKey(new Date(a.due_at)), todayKey)}
        </span>
      </p>
      <p className="detail-work">{work}</p>
      {a.group_note ? <p className="detail-work">{a.group_note}</p> : null}

      <div
        className="detail-description prose"
        data-testid="description"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {html ? null : <p className="detail-empty">No description recorded.</p>}

      {a.notes ? (
        <div className="detail-section">
          <p className="detail-subhead">Notes</p>
          <p className="detail-notes">{a.notes}</p>
        </div>
      ) : null}

      <div className="detail-section">
        <p className="detail-subhead" aria-hidden="true">
          Sources
        </p>
        <ul aria-label="Sources" className="sources">
          {a.sources.map((s, i) => (
            <li key={`${s.type}-${i}`}>
              <span className="source-type">{SOURCE_LABEL[s.type]}</span>
              {isUrl(s.ref) ? (
                <a href={s.ref} target="_blank" rel="noreferrer" className="source-ref">
                  {s.ref}
                </a>
              ) : (
                <span className="source-ref">{s.ref}</span>
              )}
              {s.quote ? <q className="source-quote">{s.quote}</q> : null}
            </li>
          ))}
        </ul>
      </div>

      {a.canvas_url ? (
        <p className="detail-canvas">
          <a href={a.canvas_url} target="_blank" rel="noreferrer">
            Open in Canvas
          </a>
        </p>
      ) : null}
    </aside>
  )
}
