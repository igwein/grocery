import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ApiResponse, UserRole } from '@/lib/types'

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ role: UserRole }>>> {
  const { pin } = await request.json()

  const managerPin = process.env.MANAGER_PIN
  const shopperPin = process.env.SHOPPER_PIN

  let role: UserRole | null = null

  if (pin === managerPin) {
    role = 'manager'
  } else if (pin === shopperPin) {
    role = 'shopper'
  }

  if (!role) {
    return NextResponse.json({
      success: false,
      error: 'Invalid PIN',
    })
  }

  const cookieStore = await cookies()
  cookieStore.set('role', role, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return NextResponse.json({
    success: true,
    data: { role },
  })
}
