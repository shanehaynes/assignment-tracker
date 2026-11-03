import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Assignment, Progress, ProgressEntry, Quote, Semester } from './types.ts'
import { ASSIGNMENTS, QUOTES, SEMESTER } from './data.ts'
import { createServerStore, type ProgressStore } from './progress.ts'
import { dayKey, formatLongDate } from './lib/dates.ts'
import { DEFAULT_FILTERS, applyFilters, type FilterState } from './lib/filters.ts'
import { setDone, workCounts } from './lib/progress.ts'
import { quoteForDate } from './lib/quotes.ts'
import AssignmentList from './components/AssignmentList.tsx'
import DetailPanel from './components/DetailPanel.tsx'
import Filters from './components/Filters.tsx'
import ProgressStrip from './components/ProgressStrip.tsx'

export type AppProps = {
  assignments?: Assignment[]
  semester?: Semester
  now?: Date
  store?: ProgressStore
  quotes?: readonly Quote[]
}

type FocusRequest =
  { kind: 'done' | 'title'; id: string } | { kind: 'undo' } | { kind: 'list' } | null

const CLOCK_TICK_MS = 60_000

function sameProgress(a: Progress, b: Progress | null): boolean {
  if (!b) return false
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((k) => b[k]?.done === a[k].done && b[k]?.at === a[k].at)
  )
}

function useClock(fixed: Date | undefined): Date {
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    if (fixed) return
    const tick = () => setClock(new Date())
    const timer = setInterval(tick, CLOCK_TICK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fixed])
  return fixed ?? clock
}

export default function App({
  assignments = ASSIGNMENTS,
  semester = SEMESTER,
  now: fixedNow,
  store: storeProp,
  quotes = QUOTES,
}: AppProps) {
  const now = useClock(fixedNow)
  const [ownStore] = useState(() => (storeProp ? null : createServerStore()))
  const store = storeProp ?? ownStore!

  const [progress, setProgress] = useState<Progress>({})
  const progressRef = useRef<Progress>(progress)
  const [saveFailed, setSaveFailed] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastDone, setLastDone] = useState<{ id: string; title: string } | null>(null)
  const [undoArmedAt, setUndoArmedAt] = useState(0)

  const detailId = useId()
  const listRef = useRef<HTMLElement>(null)
  const undoRef = useRef<HTMLButtonElement>(null)
  const focusRequest = useRef<FocusRequest>(null)

  // Toggles made before load resolves are saved at once and replayed onto the loaded state.
  const loadState = useRef<'idle' | 'loading' | 'ready'>('idle')
  const pending = useRef(new Map<string, ProgressEntry | null>())
  const lastSaved = useRef<Progress | null>(null)
  const saveSeq = useRef(0)

  const persist = useCallback(
    (next: Progress) => {
      lastSaved.current = next
      const seq = ++saveSeq.current
      let task: Promise<void>
      try {
        task = store.save(next)
      } catch (error) {
        task = Promise.reject(error)
      }
      task.then(
        () => {
          if (seq === saveSeq.current) setSaveFailed(false)
        },
        () => {
          if (seq === saveSeq.current) setSaveFailed(true)
        },
      )
    },
    [store],
  )

  useEffect(() => {
    if (loadState.current !== 'idle') return
    loadState.current = 'loading'
    const settle = (loaded: Progress) => {
      const next = { ...loaded }
      for (const [id, entry] of pending.current) {
        if (entry) next[id] = entry
        else delete next[id]
      }
      const replay = pending.current.size > 0
      pending.current.clear()
      loadState.current = 'ready'
      progressRef.current = next
      setProgress(next)
      if (replay && !sameProgress(next, lastSaved.current)) persist(next)
    }
    store.load().then(settle, () => settle(progressRef.current))
  }, [store, persist])

  const todayKey = dayKey(now)
  const quote = useMemo(() => quoteForDate(quotes, semester, now), [quotes, semester, now])
  const visible = useMemo(
    () => applyFilters(assignments, filters, progress, now),
    [assignments, filters, progress, now],
  )
  const counts = useMemo(() => workCounts(assignments, progress), [assignments, progress])
  const selected = useMemo(
    () => (selectedId ? (assignments.find((a) => a.id === selectedId) ?? null) : null),
    [assignments, selectedId],
  )

  const toggle = useCallback(
    (id: string, done: boolean, hadFocus = false) => {
      const next = setDone(progressRef.current, id, done, fixedNow ?? new Date())
      progressRef.current = next
      setProgress(next)
      if (loadState.current !== 'ready') pending.current.set(id, next[id] ?? null)
      persist(next)

      if (done && filters.hideDone) {
        const title = assignments.find((a) => a.id === id)?.title ?? ''
        setLastDone({ id, title })
        if (hadFocus) {
          const i = visible.findIndex((a) => a.id === id)
          const neighbour = visible[i + 1] ?? visible[i - 1]
          focusRequest.current = neighbour ? { kind: 'done', id: neighbour.id } : { kind: 'undo' }
        }
      } else {
        setLastDone(null)
      }
    },
    [assignments, filters.hideDone, fixedNow, persist, visible],
  )

  const undo = useCallback(() => {
    if (!lastDone) return
    const { id } = lastDone
    setLastDone(null)
    toggle(id, false)
    focusRequest.current = { kind: 'done', id }
  }, [lastDone, toggle])

  const close = useCallback(() => {
    if (selectedId) focusRequest.current = { kind: 'title', id: selectedId }
    setSelectedId(null)
  }, [selectedId])

  const changeFilters = useCallback((next: FilterState) => {
    setLastDone(null)
    setFilters(next)
  }, [])

  // Escape closes the panel and dismisses the "Marked done" note.
  useEffect(() => {
    if (!selectedId && !lastDone) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (lastDone) {
        if (undoRef.current && document.activeElement === undoRef.current)
          focusRequest.current = { kind: 'list' }
        setLastDone(null)
      }
      if (selectedId) close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedId, lastDone, close])

  // The "Marked done" note fades out on its own after a while, but never while Undo has focus;
  // leaving the Undo button re-arms the timer.
  useEffect(() => {
    if (!lastDone) return
    const timer = setTimeout(() => {
      if (undoRef.current && document.activeElement === undoRef.current) return
      setLastDone(null)
    }, 12_000)
    return () => clearTimeout(timer)
  }, [lastDone, undoArmedAt])

  useEffect(() => {
    const request = focusRequest.current
    if (!request) return
    focusRequest.current = null
    if (request.kind === 'undo' || request.kind === 'list') {
      const target = request.kind === 'undo' ? undoRef.current : null
      ;(target ?? listRef.current)?.focus()
      return
    }
    const row = [
      ...(listRef.current?.querySelectorAll<HTMLElement>('li[data-assignment-id]') ?? []),
    ].find((li) => li.dataset.assignmentId === request.id)
    const target = row?.querySelector<HTMLElement>(
      request.kind === 'done' ? 'input[type="checkbox"]' : 'button.row-title',
    )
    // The row may be gone (filtered out, or hidden once done): land on the list, not on <body>.
    ;(target ?? listRef.current)?.focus()
  })

  return (
    <div className={selected ? 'page has-detail' : 'page'}>
      <header className="masthead">
        <div className="masthead-line">
          <h1>Assignments</h1>
          <p className="masthead-today">{formatLongDate(todayKey)}</p>
        </div>
        <p className="masthead-term">
          {semester.label} · {semester.cohort === 'silver' ? 'Silver' : semester.cohort} cohort
        </p>
      </header>

      <main className="layout">
        <div className="primary">
          <ProgressStrip
            semester={semester}
            now={now}
            done={counts.done}
            total={counts.total}
            saveFailed={saveFailed}
            quote={quote}
          />
          <Filters
            value={filters}
            onChange={changeFilters}
            onReset={() => changeFilters(DEFAULT_FILTERS)}
            shown={visible.length}
            total={assignments.length}
          />
          <div className="undo-line" role="status">
            {lastDone ? (
              <>
                <span className="undo-text">Marked “{lastDone.title}” done.</span>
                <button
                  type="button"
                  className="text-button"
                  ref={undoRef}
                  onClick={undo}
                  onBlur={() => setUndoArmedAt(Date.now())}
                >
                  Undo
                </button>
              </>
            ) : null}
          </div>
          <AssignmentList
            items={visible}
            progress={progress}
            now={now}
            todayKey={todayKey}
            selectedId={selected?.id ?? null}
            detailId={detailId}
            listRef={listRef}
            onOpen={(id) => (id === selectedId ? close() : setSelectedId(id))}
            onToggle={toggle}
          />
        </div>
        {selected ? (
          <DetailPanel id={detailId} assignment={selected} todayKey={todayKey} onClose={close} />
        ) : (
          <div className="detail-placeholder" aria-hidden="true">
            Select an assignment to read its description, sources and Canvas link.
          </div>
        )}
      </main>
    </div>
  )
}
