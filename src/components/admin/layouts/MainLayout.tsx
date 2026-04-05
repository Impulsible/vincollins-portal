/* eslint-disable react-hooks/set-state-in-effect */
// components/admin/layouts/MainLayout.tsx
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'

interface AdminProfile {
  id?: string
  full_name?: string
  email?: string
  photo_url?: string
}

interface SchoolSettings {
  school_name?: string
  logo_url?: string
  [key: string]: unknown
}

interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  read: boolean
}

interface MainLayoutProps {
  children: ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
  adminProfile: AdminProfile | null
  schoolSettings: SchoolSettings | null
  notifications?: NotificationItem[]
  onMarkNotificationRead?: (id: string) => void
  onProfileUpdate?: (profile: AdminProfile) => void
}

export function MainLayout({
  children,
  activeTab,
  setActiveTab,
  onSignOut,
  adminProfile,
  schoolSettings,
  notifications = [],
  onMarkNotificationRead = () => {},
  onProfileUpdate = () => {},
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('darkMode', String(next))

      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      return next
    })
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-background via-background to-earth-soft/20">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignOut={onSignOut}
          schoolSettings={schoolSettings}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            adminProfile={adminProfile}
            onProfileUpdate={onProfileUpdate}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  )
}