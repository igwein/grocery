import '@testing-library/jest-dom/vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54331'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.MANAGER_PIN = '1234'
process.env.SHOPPER_PIN = '5678'
process.env.GEMINI_API_KEY = 'test-gemini-key'
