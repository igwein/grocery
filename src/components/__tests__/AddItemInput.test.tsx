import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddItemInput } from '../AddItemInput'

// Mock Supabase client
const mockSelect = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table)
      return {
        select: (...args: unknown[]) => {
          mockSelect(table, ...args)
          if (table === 'items_catalog') {
            return Promise.resolve({
              data: [
                { id: '1', name: 'חלב', category_emoji: '🧀', created_at: '2025-01-01' },
                { id: '2', name: 'לחם', category_emoji: '🥖', created_at: '2025-01-01' },
                { id: '3', name: 'עגבניות', category_emoji: '🥬', created_at: '2025-01-01' },
              ],
              error: null,
            })
          }
          // purchase_history
          return {
            order: (...orderArgs: unknown[]) => {
              mockOrder(table, ...orderArgs)
              return Promise.resolve({
                data: [
                  { item_name: 'חלב', purchased_at: '2025-03-01' },
                  { item_name: 'לחם', purchased_at: '2025-02-15' },
                ],
                error: null,
              })
            },
          }
        },
      }
    },
  },
}))

describe('AddItemInput', () => {
  const defaultProps = {
    onAdd: vi.fn(),
    onClose: vi.fn(),
    currentItemNames: [] as string[],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input', async () => {
    render(<AddItemInput {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('חפש מוצר...')).toBeInTheDocument()
    })
  })

  it('shows catalog items after loading', async () => {
    render(<AddItemInput {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect(screen.getByText('עגבניות')).toBeInTheDocument()
    })
  })

  it('filters catalog items based on search query', async () => {
    const user = userEvent.setup()
    render(<AddItemInput {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('חפש מוצר...'), 'חלב')

    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.queryByText('עגבניות')).not.toBeInTheDocument()
    })
  })

  it('excludes items already in currentItemNames', async () => {
    render(<AddItemInput {...defaultProps} currentItemNames={['חלב']} />)

    await waitFor(() => {
      expect(screen.queryByText('חלב')).not.toBeInTheDocument()
      expect(screen.getByText('לחם')).toBeInTheDocument()
    })
  })

  it('calls onAdd when catalog item is clicked', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddItemInput {...defaultProps} onAdd={onAdd} />)

    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    await user.click(screen.getByText('חלב'))
    expect(onAdd).toHaveBeenCalledWith('חלב', '🧀')
  })

  it('shows add button for new uncatalogued items', async () => {
    const user = userEvent.setup()
    render(<AddItemInput {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('חפש מוצר...'), 'מוצר חדש')

    await waitFor(() => {
      expect(screen.getByText(/הוסף.*מוצר חדש/)).toBeInTheDocument()
    })
  })

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddItemInput {...defaultProps} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('adds new item immediately with default category', async () => {
    const user = userEvent.setup()
    render(<AddItemInput {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('חפש מוצר...')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('חפש מוצר...'), 'מוצר חדש')

    await waitFor(() => {
      expect(screen.getByText(/הוסף.*מוצר חדש/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/הוסף.*מוצר חדש/))

    expect(defaultProps.onAdd).toHaveBeenCalledWith('מוצר חדש', '📦')
  })
})
