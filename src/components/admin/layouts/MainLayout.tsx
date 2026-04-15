/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/layouts/MainLayout.tsx
'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Sidebar } from '@/components/admin/common/Sidebar'
import { Header } from '@/components/admin/common/Header'
import { Footer } from '@/components/admin/layouts/Footer'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
  adminProfile: any
  schoolSettings: any
  notifications: any[]
  onMarkNotificationRead: (id: string) => void
  onProfileUpdate: (profile: any) => void
  pendingSubmissions: number
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function MainLayout({
  children,
  activeTab,
  setActiveTab,
  onSignOut,
  adminProfile,
  schoolSettings,
  notifications,
  onMarkNotificationRead,
  onProfileUpdate,
  pendingSubmissions,
  sidebarOpen,
  setSidebarOpen,
}: MainLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-close sidebar on mobile by default
      if (mobile) {
        setSidebarOpen(false)
      } else {
        // Auto-open on desktop
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={onSignOut}
        pendingSubmissions={pendingSubmissions}
        schoolSettings={schoolSettings}
        adminProfile={adminProfile}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          adminProfile={adminProfile}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
          onProfileUpdate={onProfileUpdate}
          onSignOut={onSignOut}  // ADD THIS LINE
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            "container mx-auto p-4 md:p-6 lg:p-8",
            isMobile && "pt-16"
          )}>
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default MainLayout