'use client'

import { usePathname } from 'next/navigation'
import { BottomTabBar } from '@/components/ui/BottomTabBar'

type Tab = 'list' | 'history' | 'settings'

function getActiveTab(pathname: string): Tab {
  if (pathname.startsWith('/manager/history')) return 'history'
  if (pathname.startsWith('/manager/settings')) return 'settings'
  return 'list'
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeTab = getActiveTab(pathname)

  return (
    <div className="pb-tab-bar">
      {children}
      <BottomTabBar activeTab={activeTab} />
    </div>
  )
}
