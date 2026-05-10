// app/admin/layout.tsx - FIXED WITH DISPLAY NAME
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

// ✅ FIXED: Format profile with firstName for Header
function formatProfileForHeader(profile: AdminProfile | null) {
  if (!profile) return undefined

  // Build name in LastName FirstName MiddleName order
  let fullName = ''
  let firstName = ''

  if (profile?.first_name) {
    const parts: string[] = []
    if (profile?.last_name) parts.push(profile.last_name)
    parts.push(profile.first_name)
    if (profile?.middle_name) parts.push(profile.middle_name)
    fullName = parts.join(' ').trim()
    firstName = profile.first_name.trim()
  }
  if (!fullName && profile?.display_name?.trim()) {
    fullName = profile.display_name.trim()
    firstName = fullName.split(' ')[0]
  }
  if (!fullName && profile?.full_name?.trim()) {
    fullName = profile.full_name.trim()
    firstName = fullName.split(' ')[0]
  }
  if (!fullName && profile?.name?.trim()) {
    fullName = profile.name.trim()
    firstName = fullName.split(' ')[0]
  }
  if (!fullName) {
    firstName = profile?.email?.split('@')[0] || 'User'
    fullName = firstName
  }

  return {
    id: profile.id,
    name: fullName,
    firstName: firstName,  // ✅ REQUIRED by User interface
    email: profile.email || '',
    role: profile.role === 'staff' ? 'teacher' as const : 'admin' as const,
    avatar: profile.photo_url || profile.avatar_url,
    isAuthenticated: true
  }
}

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
        .select('id, full_name, display_name, first_name, last_name, middle_name, name, email, photo_url, avatar_url, role')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)

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

  const handleLogout = () => {
    window.location.href = '/portal'
    supabase.auth.signOut({ scope: 'local' }).catch(() => {})
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