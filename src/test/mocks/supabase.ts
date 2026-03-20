import { vi } from 'vitest'

type QueryResult<T = unknown> = { data: T | null; error: null | { message: string } }

interface ChainableMock {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
}

/**
 * Creates a chainable Supabase mock that mimics the query builder pattern.
 * Configure results per table using `setResult(table, data, error?)`.
 */
export function createSupabaseMock() {
  const results = new Map<string, QueryResult>()

  function setResult<T>(table: string, data: T, error: QueryResult['error'] = null) {
    results.set(table, { data, error })
  }

  let currentTable = ''

  const chain: ChainableMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation(() => {
      return Promise.resolve(results.get(currentTable) ?? { data: null, error: null })
    }),
    upsert: vi.fn().mockImplementation(() => {
      return Promise.resolve(results.get(currentTable) ?? { data: null, error: null })
    }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation(() => {
      return Promise.resolve(results.get(currentTable) ?? { data: null, error: null })
    }),
    in: vi.fn().mockImplementation(() => {
      return Promise.resolve(results.get(currentTable) ?? { data: null, error: null })
    }),
    order: vi.fn().mockImplementation(() => {
      return Promise.resolve(results.get(currentTable) ?? { data: null, error: null })
    }),
  }

  // Make all chain methods return the chain object for chaining
  chain.select.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    return chain
  })

  const channelCallbacks: Array<() => void> = []
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  const channel = vi.fn().mockReturnValue(channelMock)
  const removeChannel = vi.fn()

  const client = {
    from,
    channel,
    removeChannel,
  }

  return { client, chain, setResult, channelMock, channelCallbacks }
}
