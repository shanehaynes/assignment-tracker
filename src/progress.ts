// Where done-marks live. The dev server persists them to data/progress.json via
// /__progress; anywhere else (static build, tests) localStorage stands in.
import type { Progress } from './types.ts'

export type ProgressStore = { load(): Promise<Progress>; save(p: Progress): Promise<void> }

export const STORAGE_KEY = 'assignment-tracker:progress'
export const ENDPOINT = '/__progress'

/** Keeps only well-formed `{ done: true, at }` entries. */
export function normalizeProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Progress = {}
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') continue
    const { done, at } = entry as { done?: unknown; at?: unknown }
    if (done === true) out[id] = { done: true, at: typeof at === 'string' ? at : '' }
  }
  return out
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export type ServerStoreOptions = {
  endpoint?: string
  fetch?: typeof fetch
  storage?: StorageLike | null
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function createServerStore(options: ServerStoreOptions = {}): ProgressStore {
  const endpoint = options.endpoint ?? ENDPOINT
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => fetch(input, init))
  const storage = options.storage === undefined ? defaultStorage() : options.storage
  // undefined: not yet known; true: the endpoint answered; false: it did not, localStorage is the store.
  let server: boolean | undefined
  let queue: Promise<unknown> = Promise.resolve()

  const readLocal = (): Progress | null => {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      return raw ? normalizeProgress(JSON.parse(raw)) : null
    } catch {
      return null
    }
  }
  const writeLocal = (p: Progress): boolean => {
    try {
      if (!storage) return false
      storage.setItem(STORAGE_KEY, JSON.stringify(p))
      return true
    } catch {
      return false
    }
  }

  const put = async (p: Progress): Promise<void> => {
    const localOk = writeLocal(p)
    if (server === false) {
      if (!localOk) throw new Error('Progress not saved: localStorage unavailable')
      return
    }
    try {
      const res = await doFetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (!res.ok) throw new Error(`PUT ${endpoint} answered ${res.status}`)
      server = true
    } catch (error) {
      // When the file is the source of truth, a local copy alone would be lost on reload.
      if (server === true || !localOk) throw error
    }
  }

  const load = async (): Promise<Progress> => {
    try {
      const res = await doFetch(endpoint, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`GET ${endpoint} answered ${res.status}`)
      if (!(res.headers.get('content-type') ?? '').includes('json')) throw new Error('not JSON')
      const data = normalizeProgress(await res.json())
      server = true
      writeLocal(data)
      return data
    } catch {
      server = false
      return readLocal() ?? {}
    }
  }

  // One queue for reads and writes: a save issued while the first load is in flight
  // reaches the file only after that load has read it.
  return {
    load() {
      const task = queue.then(load)
      queue = task.catch(() => undefined)
      return task
    },
    save(p) {
      const task = queue.then(() => put(p))
      queue = task.catch(() => undefined)
      return task
    },
  }
}

export function createMemoryStore(initial: Progress = {}): ProgressStore {
  let state: Progress = structuredClone(initial)
  return {
    async load() {
      return structuredClone(state)
    },
    async save(p) {
      state = structuredClone(p)
    },
  }
}
