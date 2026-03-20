'use client'

interface FloatingActionButtonProps {
  onClick: () => void
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-4 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-10 hover:bg-green-700"
      aria-label="הוסף מוצר"
    >
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
