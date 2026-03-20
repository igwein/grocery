import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemRow } from '../ItemRow'
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

describe('ItemRow', () => {
  it('renders item name', () => {
    render(<ItemRow item={makeItem({ item_name: 'Banana' })} onCheck={vi.fn()} />)
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('shows quantity badge when present', () => {
    render(<ItemRow item={makeItem({ quantity: '2 kg' })} onCheck={vi.fn()} />)
    expect(screen.getByText('2 kg')).toBeInTheDocument()
  })

  it('does not show quantity when null', () => {
    const { container } = render(<ItemRow item={makeItem()} onCheck={vi.fn()} />)
    expect(container.querySelector('.bg-gray-100')).not.toBeInTheDocument()
  })

  it('shows notes when present', () => {
    render(<ItemRow item={makeItem({ notes: 'organic only' })} onCheck={vi.fn()} />)
    expect(screen.getByText('organic only')).toBeInTheDocument()
  })

  it('shows last purchased date in Hebrew locale', () => {
    render(
      <ItemRow
        item={makeItem()}
        onCheck={vi.fn()}
        lastPurchased="2025-03-15"
      />
    )

    // Hebrew locale formats as "נקנה DD.MM" or "נקנה DD/MM"
    const dateText = screen.getByText(/נקנה/)
    expect(dateText).toBeInTheDocument()
  })

  it('applies checked styling when is_checked is true', () => {
    const { container } = render(
      <ItemRow item={makeItem({ is_checked: true })} onCheck={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('item-checked')
  })

  it('calls onCheck with item id on row click', async () => {
    const onCheck = vi.fn()
    render(<ItemRow item={makeItem({ id: 'x-1' })} onCheck={onCheck} />)

    await userEvent.click(screen.getByText('Test Item'))
    expect(onCheck).toHaveBeenCalledWith('x-1')
  })

  it('remove button calls onRemove and stops propagation', async () => {
    const onCheck = vi.fn()
    const onRemove = vi.fn()

    render(
      <ItemRow
        item={makeItem({ id: 'x-1' })}
        onCheck={onCheck}
        onRemove={onRemove}
        showRemove
      />
    )

    const removeBtn = screen.getByRole('button')
    await userEvent.click(removeBtn)

    expect(onRemove).toHaveBeenCalledWith('x-1')
    // onCheck should NOT be called because stopPropagation
    expect(onCheck).not.toHaveBeenCalled()
  })

  it('hides checkbox when showCheckbox is false', () => {
    const { container } = render(
      <ItemRow item={makeItem()} onCheck={vi.fn()} showCheckbox={false} />
    )
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument()
  })

  it('does not call onCheck when showCheckbox is false', async () => {
    const onCheck = vi.fn()
    render(
      <ItemRow item={makeItem()} onCheck={onCheck} showCheckbox={false} />
    )

    await userEvent.click(screen.getByText('Test Item'))
    expect(onCheck).not.toHaveBeenCalled()
  })
})
