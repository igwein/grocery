import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const role = request.cookies.get('role')?.value
  const path = request.nextUrl.pathname

  // Public routes
  if (path === '/login' || path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // No role cookie -> redirect to login
  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Root page -> redirect based on role
  if (path === '/') {
    return NextResponse.next()
  }

  // Manager routes require manager role
  if (path.startsWith('/manager') && role !== 'manager') {
    return NextResponse.redirect(new URL('/shopper', request.url))
  }

  // Shopper routes require shopper role
  if (path.startsWith('/shopper') && role !== 'shopper') {
    return NextResponse.redirect(new URL('/manager', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
