import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantityBadge } from '../QuantityBadge'

describe('QuantityBadge', () => {
  it('shows "כמות" button when quantity is null', () => {
    render(<QuantityBadge quantity={null} onUpdate={vi.fn()} />)
    expect(screen.getByText('כמות')).toBeInTheDocument()
  })

  it('shows quantity value when set', () => {
    render(<QuantityBadge quantity="2 ק״ג" onUpdate={vi.fn()} />)
    expect(screen.getByText('2 ק״ג')).toBeInTheDocument()
  })

  it('opens editor on click', async () => {
    render(<QuantityBadge quantity={null} onUpdate={vi.fn()} />)
    await userEvent.click(screen.getByText('כמות'))
    expect(screen.getByPlaceholderText('#')).toBeInTheDocument()
  })

  it('pre-fills editor with existing quantity', async () => {
    render(<QuantityBadge quantity="3 ליטר" onUpdate={vi.fn()} />)
    await userEvent.click(screen.getByText('3 ליטר'))
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('saves on Enter key', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity={null} onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('כמות'))
    await userEvent.type(screen.getByPlaceholderText('#'), '5')
    await userEvent.keyboard('{Enter}')

    expect(onUpdate).toHaveBeenCalledWith('5')
  })

  it('saves with unit', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity={null} onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('כמות'))
    await userEvent.type(screen.getByPlaceholderText('#'), '2')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'ק״ג')
    await userEvent.click(screen.getByRole('button', { name: 'שמור כמות' }))

    expect(onUpdate).toHaveBeenCalledWith('2 ק״ג')
  })

  it('closes editor on Escape without saving', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity="1" onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('1'))
    await userEvent.type(screen.getByPlaceholderText('#'), '999')
    await userEvent.keyboard('{Escape}')

    // Should not call onUpdate on Escape
    expect(onUpdate).not.toHaveBeenCalled()
    // Should show original value again
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('saves null when amount is empty', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity="3" onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('3'))
    await userEvent.clear(screen.getByPlaceholderText('#'))
    await userEvent.keyboard('{Enter}')

    expect(onUpdate).toHaveBeenCalledWith(null)
  })

  it('rejects non-numeric input and saves null', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity={null} onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('כמות'))
    await userEvent.type(screen.getByPlaceholderText('#'), 'abc')
    await userEvent.keyboard('{Enter}')

    expect(onUpdate).toHaveBeenCalledWith(null)
  })

  it('saves on checkmark button click', async () => {
    const onUpdate = vi.fn()
    render(<QuantityBadge quantity={null} onUpdate={onUpdate} />)

    await userEvent.click(screen.getByText('כמות'))
    await userEvent.type(screen.getByPlaceholderText('#'), '4')
    await userEvent.click(screen.getByRole('button', { name: 'שמור כמות' }))

    expect(onUpdate).toHaveBeenCalledWith('4')
  })

  it('has accessible labels', () => {
    render(<QuantityBadge quantity="2 ק״ג" onUpdate={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'כמות: 2 ק״ג' })).toBeInTheDocument()
  })

  it('empty quantity button has accessible label', () => {
    render(<QuantityBadge quantity={null} onUpdate={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'הוסף כמות' })).toBeInTheDocument()
  })
})
