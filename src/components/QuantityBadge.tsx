'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const UNITS = [
  { value: '', label: '' },
  { value: 'יח׳', label: 'יח׳' },
  { value: 'ק״ג', label: 'ק״ג' },
  { value: 'גרם', label: 'גרם' },
  { value: 'ליטר', label: 'ליטר' },
  { value: 'מ״ל', label: 'מ״ל' },
  { value: 'חבילות', label: 'חבילות' },
] as const

function parseQuantity(quantity: string | null): { amount: string; unit: string } {
  if (!quantity) return { amount: '', unit: '' }
  const match = quantity.match(/^([\d.]+)\s*(.*)$/)
  if (match) return { amount: match[1], unit: match[2] }
  return { amount: quantity, unit: '' }
}

function formatQuantity(amount: string, unit: string): string | null {
  const trimmedAmount = amount.trim()
  if (!trimmedAmount) return null
  if (!/^\d+(\.\d+)?$/.test(trimmedAmount)) return null
  const trimmedUnit = unit.trim()
  return trimmedUnit ? `${trimmedAmount} ${trimmedUnit}` : trimmedAmount
}

interface QuantityBadgeProps {
  quantity: string | null
  onUpdate: (quantity: string | null) => void
}

export function QuantityBadge({ quantity, onUpdate }: QuantityBadgeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = useCallback(() => {
    const newQuantity = formatQuantity(editAmount, editUnit)
    onUpdate(newQuantity)
    setIsEditing(false)
  }, [editAmount, editUnit, onUpdate])

  useEffect(() => {
    if (!isEditing) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, handleSave])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    const parsed = parseQuantity(quantity)
    setEditAmount(parsed.amount)
    setEditUnit(parsed.unit)
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-1 bg-green-50 border border-green-300 rounded-lg px-2 py-1"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="w-12 text-sm text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-green-500"
          placeholder="#"
          dir="ltr"
          aria-label="כמות"
        />
        <select
          value={editUnit}
          onChange={(e) => setEditUnit(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-green-500"
          dir="rtl"
          aria-label="יחידת מידה"
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label || '—'}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          aria-label="שמור כמות"
          className="text-green-600 p-0.5"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    )
  }

  if (quantity) {
    return (
      <button
        onClick={handleOpen}
        aria-label={`כמות: ${quantity}`}
        className="text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
      >
        {quantity}
      </button>
    )
  }

  return (
    <button
      onClick={handleOpen}
      aria-label="הוסף כמות"
      className="text-xs text-gray-400 border border-dashed border-gray-300 px-2 py-0.5 rounded-lg hover:border-gray-400 hover:text-gray-500 transition-colors"
    >
      כמות
    </button>
  )
}
