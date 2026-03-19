'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    const data = await res.json()

    if (data.success) {
      router.push(data.data.role === 'manager' ? '/manager' : '/shopper')
    } else {
      setError('קוד שגוי')
      setPin('')
    }
  }

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          setPin(newPin)
          handleSubmitPin(newPin)
        }, 100)
      }
    }
  }

  const handleSubmitPin = async (pinValue: string) => {
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinValue }),
    })

    const data = await res.json()

    if (data.success) {
      router.push(data.data.role === 'manager' ? '/manager' : '/shopper')
    } else {
      setError('קוד שגוי')
      setPin('')
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-green-50">
      <h1 className="text-3xl font-bold text-green-800 mb-2">רשימת קניות</h1>
      <p className="text-gray-500 mb-8">הכנס קוד כניסה</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              i < pin.length ? 'bg-green-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
          <button
            key={key || 'empty'}
            onClick={() => {
              if (key === 'del') handleDelete()
              else if (key) handleKeyPress(key)
            }}
            disabled={!key}
            className={`w-20 h-16 rounded-2xl text-2xl font-semibold transition-colors ${
              key === 'del'
                ? 'text-gray-500 hover:bg-gray-200'
                : key
                ? 'bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100'
                : ''
            }`}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  )
}
