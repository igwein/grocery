'use client'

import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  const handleLogout = async () => {
    document.cookie = 'role=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-4 sticky top-0 z-20">
        <h1 className="text-xl font-bold">הגדרות</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Role card */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="text-sm text-gray-500 mb-1">תפקיד</h2>
          <p className="text-lg font-semibold text-gray-800">מנהל/ת רשימה</p>
        </div>

        {/* App info card */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="text-sm text-gray-500 mb-1">גרסה</h2>
          <p className="text-lg font-semibold text-gray-800">1.0.0</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 card-shadow text-red-500 font-semibold text-lg text-center"
        >
          התנתק
        </button>
      </div>
    </div>
  )
}
