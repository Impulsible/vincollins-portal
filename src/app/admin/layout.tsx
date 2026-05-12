// app/admin/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { instantLogout } from '@/lib/auth-utils'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { cn } from '@/lib/utils'

interface AdminProfile {
  id: string
  full_name?: string
  display_name?: string
  first_name?: string
  last_name?: string
  middle_name?: string
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
  '/admin/settings': 'settings',
  '/admin/help': 'help',
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
  'settings': '/admin/settings',
  'help': '/admin/help',
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

  const displayName = profile.display_name || profile.full_name || 'Administrator'
  const nameParts = displayName.split(' ')
  const firstName = nameParts.length >= 2 ? nameParts[1] : nameParts[0]

  return {
    id: profile.id,
    name: displayName,
    firstName: firstName,
    email: profile.email || '',
    role: profile.role === 'staff' ? 'teacher' as const : 'admin' as const,
    avatar: profile.photo_url || profile.avatar_url,
    isAuthenticated: true
  }
}

// Cache counts for 2 minutes
let countsCache: { data: any; timestamp: number } | null = null
const COUNTS_CACHE_DURATION = 120000

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(() => getTabFromPathname(pathname || '/admin'))
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [pendingExamsCount, setPendingExamsCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingInquiries, setPendingInquiries] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, first_name, last_name, middle_name, email, photo_url, avatar_url, role')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)

      // Use cached counts if available
      if (countsCache && Date.now() - countsCache.timestamp < COUNTS_CACHE_DURATION) {
        const c = countsCache.data
        setNotificationCount(c.notificationCount)
        setPendingExamsCount(c.pendingExamsCount)
        setPendingReports(c.pendingReports)
        setPendingInquiries(c.pendingInquiries)
        return
      }

      // Fetch counts (only when cache expired)
      try {
        const { count: n } = await supabase.from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('read', false)
        const { count: e } = await supabase.from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        const { count: r } = await supabase.from('report_cards')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        const { count: i } = await supabase.from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const counts = {
          notificationCount: n || 0,
          pendingExamsCount: e || 0,
          pendingReports: r || 0,
          pendingInquiries: i || 0
        }
        countsCache = { data: counts, timestamp: Date.now() }

        setNotificationCount(counts.notificationCount)
        setPendingExamsCount(counts.pendingExamsCount)
        setPendingReports(counts.pendingReports)
        setPendingInquiries(counts.pendingInquiries)
      } catch {
        // Silently fail - counts just stay at 0
      }
    }
    init()
  }, [router, pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const targetRoute = tabToRouteMap[tab]
    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute)
    }
  }

  // Single source of truth for sign out
  const handleLogout = () => {
    instantLogout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />

      <div className="flex overflow-x-hidden">
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

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

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