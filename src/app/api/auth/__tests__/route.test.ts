import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers cookies — must use vi.hoisted since vi.mock is hoisted
const { mockSet } = vi.hoisted(() => ({
  mockSet: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockSet,
  }),
}))

import { POST } from '../route'

describe('POST /api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MANAGER_PIN = '1234'
    process.env.SHOPPER_PIN = '5678'
  })

  it('returns manager role for correct manager PIN', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toEqual({ success: true, data: { role: 'manager' } })
    expect(mockSet).toHaveBeenCalledWith('role', 'manager', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  })

  it('returns shopper role for correct shopper PIN', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin: '5678' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toEqual({ success: true, data: { role: 'shopper' } })
    expect(mockSet).toHaveBeenCalledWith('role', 'shopper', expect.any(Object))
  })

  it('returns error for wrong PIN', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin: '0000' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toEqual({ success: false, error: 'Invalid PIN' })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('returns error for empty PIN', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data).toEqual({ success: false, error: 'Invalid PIN' })
  })
})
