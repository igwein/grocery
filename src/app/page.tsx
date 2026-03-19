'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-green-50">
      <h1 className="text-3xl font-bold text-green-800 mb-2">רשימת קניות</h1>
      <p className="text-gray-500 mb-12">רשימת קניות משפחתית חכמה</p>

      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/manager"
          className="block w-full bg-white border-2 border-green-500 text-green-700 rounded-2xl py-5 text-center text-xl font-semibold shadow-sm hover:bg-green-50 transition-colors"
        >
          ניהול רשימה
        </Link>

        <Link
          href="/shopper"
          className="block w-full bg-green-600 text-white rounded-2xl py-5 text-center text-xl font-semibold shadow-sm hover:bg-green-700 transition-colors"
        >
          קניות בחנות
        </Link>
      </div>
    </div>
  )
}
