import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShoppingList } from '../ShoppingList'
import { ShoppingListItem } from '@/lib/types'

function makeItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
  return {
    id: 'item-1',
    item_name: 'Test Item',
    category_emoji: '🥬',
    quantity: null,
    notes: null,
    added_by: 'manager',
    is_checked: false,
    created_at: '2025-01-01T00:00:00Z',
    checked_at: null,
    ...overrides,
  }
}

describe('ShoppingList', () => {
  it('shows empty message when no items', () => {
    render(<ShoppingList items={[]} onCheck={vi.fn()} />)
    expect(screen.getByText('הרשימה ריקה')).toBeInTheDocument()
  })

  it('groups items by category emoji', () => {
    const items = [
      makeItem({ id: '1', item_name: 'Tomato', category_emoji: '🥬' }),
      makeItem({ id: '2', item_name: 'Milk', category_emoji: '🧀' }),
      makeItem({ id: '3', item_name: 'Cucumber', category_emoji: '🥬' }),
    ]

    render(<ShoppingList items={items} onCheck={vi.fn()} />)

    expect(screen.getByText('Tomato')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Cucumber')).toBeInTheDocument()
  })

  it('sorts groups by aisle order (vegetables before dairy)', () => {
    const items = [
      makeItem({ id: '1', item_name: 'Milk', category_emoji: '🧀' }),  // order 3
      makeItem({ id: '2', item_name: 'Tomato', category_emoji: '🥬' }), // order 1
    ]

    const { container } = render(<ShoppingList items={items} onCheck={vi.fn()} />)

    const itemNames = Array.from(container.querySelectorAll('.text-lg'))
      .map(el => el.textContent)
    const tomatoIdx = itemNames.indexOf('Tomato')
    const milkIdx = itemNames.indexOf('Milk')

    expect(tomatoIdx).toBeLessThan(milkIdx)
  })

  it('calls onCheck with correct id when item clicked', async () => {
    const onCheck = vi.fn()
    const items = [makeItem({ id: 'abc-123', item_name: 'Milk' })]

    render(<ShoppingList items={items} onCheck={onCheck} />)

    await userEvent.click(screen.getByText('Milk'))
    expect(onCheck).toHaveBeenCalledWith('abc-123')
  })

  it('calls onRemove when remove button clicked', async () => {
    const onRemove = vi.fn()
    const items = [makeItem({ id: 'abc-123', item_name: 'Milk' })]

    const { container } = render(
      <ShoppingList items={items} onCheck={vi.fn()} onRemove={onRemove} showRemove />
    )

    const removeBtn = container.querySelector('.text-red-400')!
    await userEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith('abc-123')
  })

  it('hides remove buttons when showRemove is false', () => {
    const items = [makeItem({ id: '1', item_name: 'Milk' })]

    const { container } = render(
      <ShoppingList items={items} onCheck={vi.fn()} onRemove={vi.fn()} showRemove={false} />
    )

    expect(container.querySelector('.text-red-400')).not.toBeInTheDocument()
  })
})
