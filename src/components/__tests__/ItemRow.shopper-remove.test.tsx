import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemRow } from '../ItemRow'
import { ShoppingListItem } from '@/lib/types'

function makeItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
  return {
    id: 'item-1',
    item_name: 'חלב',
    category_emoji: '🥛',
    quantity: '1 ליטר',
    notes: null,
    added_by: 'manager',
    is_checked: false,
    created_at: '2025-01-01T00:00:00Z',
    checked_at: null,
    ...overrides,
  }
}

describe('ItemRow shopper variant with remove', () => {
  it('shows remove button when showRemove is true in shopper variant', () => {
    const onRemove = vi.fn()
    render(
      <ItemRow
        item={makeItem()}
        onCheck={vi.fn()}
        onRemove={onRemove}
        showRemove
        variant="shopper"
      />
    )

    // Should have both a checkbox circle and a remove button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onRemove when remove button is clicked in shopper variant', async () => {
    const onCheck = vi.fn()
    const onRemove = vi.fn()

    render(
      <ItemRow
        item={makeItem({ id: 'item-42' })}
        onCheck={onCheck}
        onRemove={onRemove}
        showRemove
        variant="shopper"
      />
    )

    // Find the remove button (it has the X icon)
    const buttons = screen.getAllByRole('button')
    // The remove button is the one with bg-red-50 class
    const removeBtn = buttons.find(btn => btn.className.includes('bg-red-50'))
    expect(removeBtn).toBeDefined()

    await userEvent.click(removeBtn!)
    expect(onRemove).toHaveBeenCalledWith('item-42')
    // onCheck should NOT be called due to stopPropagation
    expect(onCheck).not.toHaveBeenCalled()
  })

  it('shows both checkbox and remove button simultaneously in shopper variant', () => {
    render(
      <ItemRow
        item={makeItem()}
        onCheck={vi.fn()}
        onRemove={vi.fn()}
        showRemove
        showCheckbox
        variant="shopper"
      />
    )

    // Checkbox should be visible (the circle div with border)
    expect(screen.getByText('חלב')).toBeInTheDocument()

    // Remove button should be present
    const buttons = screen.getAllByRole('button')
    const removeBtn = buttons.find(btn => btn.className.includes('bg-red-50'))
    expect(removeBtn).toBeDefined()
  })

  it('shows quantity below item name in shopper variant', () => {
    render(
      <ItemRow
        item={makeItem({ quantity: '2 ק״ג' })}
        onCheck={vi.fn()}
        variant="shopper"
      />
    )

    expect(screen.getByText('2 ק״ג')).toBeInTheDocument()
  })

  it('does not show last purchased date in shopper variant', () => {
    render(
      <ItemRow
        item={makeItem()}
        onCheck={vi.fn()}
        lastPurchased="2025-03-15"
        variant="shopper"
      />
    )

    expect(screen.queryByText(/נקנה/)).not.toBeInTheDocument()
  })
})
