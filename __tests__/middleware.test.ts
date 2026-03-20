import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

function createRequest(path: string, role?: string): NextRequest {
  const url = `http://localhost:3000${path}`
  const request = new NextRequest(url)
  if (role) {
    request.cookies.set('role', role)
  }
  return request
}

describe('middleware', () => {
  describe('public routes', () => {
    it('allows /login without cookie', () => {
      const response = middleware(createRequest('/login'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('allows /api/* without cookie', () => {
      const response = middleware(createRequest('/api/auth'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('allows /api/generate-list without cookie', () => {
      const response = middleware(createRequest('/api/generate-list'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('unauthenticated access', () => {
    it('redirects /manager to /login when no cookie', () => {
      const response = middleware(createRequest('/manager'))
      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
    })

    it('redirects /shopper to /login when no cookie', () => {
      const response = middleware(createRequest('/shopper'))
      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
    })
  })

  describe('authorized access', () => {
    it('allows manager on /manager', () => {
      const response = middleware(createRequest('/manager', 'manager'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('allows shopper on /shopper', () => {
      const response = middleware(createRequest('/shopper', 'shopper'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('allows any role on /', () => {
      const responseManager = middleware(createRequest('/', 'manager'))
      expect(responseManager.headers.get('x-middleware-next')).toBe('1')

      const responseShopper = middleware(createRequest('/', 'shopper'))
      expect(responseShopper.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('cross-role redirect', () => {
    it('redirects shopper trying /manager to /shopper', () => {
      const response = middleware(createRequest('/manager', 'shopper'))
      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/shopper')
    })

    it('redirects manager trying /shopper to /manager', () => {
      const response = middleware(createRequest('/shopper', 'manager'))
      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/manager')
    })
  })

  describe('nested routes', () => {
    it('allows manager on /manager/history', () => {
      const response = middleware(createRequest('/manager/history', 'manager'))
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('redirects shopper on /manager/history to /shopper', () => {
      const response = middleware(createRequest('/manager/history', 'shopper'))
      expect(response.status).toBe(307)
      expect(new URL(response.headers.get('location')!).pathname).toBe('/shopper')
    })
  })
})
