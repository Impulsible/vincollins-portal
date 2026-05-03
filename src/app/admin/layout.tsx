// app/admin/layout.tsx - SIDEBAR + HEADER FOR ALL ADMIN PAGES
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AdminProfile {
  id: string
  full_name?: string
  name?: string
  email?: string
  photo_url?: string
  avatar_url?: string
  role?: string
}

const routeToTabMap: Record<string, string> = {
  '/admin': 'overview',
  '/admin/broad-sheet': 'broad-sheet',
  '/admin/students': 'students',
  '/admin/staff': 'staff',
  '/admin/exams': 'exams',
  '/admin/report-cards': 'report-cards',
  '/admin/inquiries': 'inquiries',
  '/admin/monitor': 'cbt-monitor',
}

const tabToRouteMap: Record<string, string> = {
  'overview': '/admin',
  'broad-sheet': '/admin/broad-sheet',
  'students': '/admin/students',
  'staff': '/admin/staff',
  'exams': '/admin/exams',
  'report-cards': '/admin/report-cards',
  'inquiries': '/admin/inquiries',
  'cbt-monitor': '/admin/monitor',
}

const getTabFromPathname = (pathname: string): string => {
  if (routeToTabMap[pathname]) return routeToTabMap[pathname]
  for (const [route, tab] of Object.entries(routeToTabMap)) {
    if (pathname?.startsWith(route + '/')) return tab
  }
  return 'overview'
}

function formatProfileForHeader(profile: AdminProfile | null) {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name || profile.name || 'Administrator',
    email: profile.email || '',
    role: profile.role === 'staff' ? 'teacher' as const : 'admin' as const,
    avatar: profile.photo_url || profile.avatar_url,
    isAuthenticated: true
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)

  // Sync active tab with pathname
  useEffect(() => {
    setActiveTab(getTabFromPathname(pathname || '/admin'))
  }, [pathname])

  // Load profile and counts
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)

      // Load counts silently
      try {
        const { count: n } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('read', false)
        if (n) setNotificationCount(n)

        const { count: e } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        if (e) setPendingExamsCount(e)

        const { count: r } = await supabase.from('report_cards').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        if (r) setPendingReports(r)

        const { count: i } = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        if (i) setPendingInquiries(i)
      } catch { /* silent */ }
    }
    init()
  }, [router])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />

      <div className="flex overflow-x-hidden">
        {/* Sidebar - desktop only */}
        <div className="hidden lg:block flex-shrink-0">
          <AdminSidebar
            profile={profile}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            pendingExams={pendingExamsCount}
            pendingReports={pendingReports}
            pendingInquiries={pendingInquiries}
          />
        </div>

        {/* Page Content */}
        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <MobileBottomNav
        role="admin"
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profile={profile}
        onLogout={handleLogout}
        notificationCount={notificationCount}
      />
    </div>
  )
}