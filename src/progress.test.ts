import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  createMemoryStore,
  createServerStore,
  normalizeProgress,
  type ServerStoreOptions,
} from './progress.ts'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  }
}

const entry = { done: true as const, at: '2026-11-02T17:00:00.000Z' }

describe('normalizeProgress', () => {
  it('keeps only done entries', () => {
    expect(normalizeProgress({ a: entry, b: { done: false }, c: 3 })).toEqual({ a: entry })
    expect(normalizeProgress([1, 2])).toEqual({})
    expect(normalizeProgress(null)).toEqual({})
  })
})

describe('createMemoryStore', () => {
  it('round-trips copies', async () => {
    const store = createMemoryStore({ a: entry })
    const loaded = await store.load()
    delete loaded.a
    expect(await store.load()).toEqual({ a: entry })
    await store.save({ b: entry })
    expect(await store.load()).toEqual({ b: entry })
  })
})

describe('createServerStore', () => {
  const make = (fetchImpl: ServerStoreOptions['fetch'], storage = memoryStorage()) => ({
    store: createServerStore({ fetch: fetchImpl, storage }),
    storage,
  })

  it('loads from the endpoint and mirrors to localStorage', async () => {
    const { store, storage } = make(vi.fn(async () => json({ a: entry })))
    expect(await store.load()).toEqual({ a: entry })
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual({ a: entry })
  })

  it('falls back to localStorage when the endpoint fails or is not JSON', async () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ b: entry }) })
    const failing = make(
      vi.fn(async () => {
        throw new TypeError('offline')
      }),
      storage,
    )
    expect(await failing.store.load()).toEqual({ b: entry })
    const html = make(
      vi.fn(
        async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
      ),
      storage,
    )
    expect(await html.store.load()).toEqual({ b: entry })
  })

  it('PUTs the whole object once the endpoint is known to work', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PUT' ? new Response(null, { status: 204 }) : json({}),
    )
    const { store } = make(fetchImpl)
    await store.load()
    await store.save({ a: entry })
    const [url, init] = fetchImpl.mock.calls[1]
    expect(url).toBe('/__progress')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(String(init?.body))).toEqual({ a: entry })
  })

  it('rejects when the file store fails, even though a local copy was kept', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PUT' ? new Response('', { status: 500 }) : json({}),
    )
    const { store, storage } = make(fetchImpl)
    await store.load()
    await expect(store.save({ a: entry })).rejects.toThrow()
    expect(storage.data.get(STORAGE_KEY)).toContain('"a"')
  })

  it('uses only localStorage after the endpoint failed to load', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }))
    const { store, storage } = make(fetchImpl)
    await store.load()
    await store.save({ a: entry })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual({ a: entry })
  })

  it('rejects when nothing could be written', async () => {
    const store = createServerStore({
      fetch: vi.fn(async () => new Response('', { status: 404 })),
      storage: null,
    })
    await store.load()
    await expect(store.save({ a: entry })).rejects.toThrow()
  })

  it('reads the file before any save issued while the first load is in flight', async () => {
    const calls: string[] = []
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init?.method ?? 'GET')
      return init?.method === 'PUT' ? new Response(null, { status: 204 }) : json({ a: entry })
    })
    const { store } = make(fetchImpl)
    const loading = store.load()
    const saving = store.save({ b: entry })
    expect(await loading).toEqual({ a: entry })
    await saving
    expect(calls).toEqual(['GET', 'PUT'])
  })

  it('sends saves in order', async () => {
    const bodies: string[] = []
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method !== 'PUT') return json({})
      bodies.push(String(init.body))
      if (bodies.length === 1) await gate
      return new Response(null, { status: 204 })
    })
    const { store } = make(fetchImpl)
    await store.load()
    const first = store.save({ a: entry })
    const second = store.save({})
    await Promise.resolve()
    expect(bodies).toHaveLength(1)
    release()
    await Promise.all([first, second])
    expect(bodies.map((b) => JSON.parse(b))).toEqual([{ a: entry }, {}])
  })
})
