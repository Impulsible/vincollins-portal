// app/student/announcements/page.tsx - CLEAN, NO REDUNDANCY (UPDATED)
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { instantLogout, getCachedHeaderUser } from '@/lib/auth-utils'
import { Header, HeaderUser } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentAnnouncements } from '@/components/student/StudentAnnouncements'
import { cn } from '@/lib/utils'
import { ArrowLeft, Home, Megaphone, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Get cached user synchronously
const cachedHeaderUser = getCachedHeaderUser()

// Loading Component
function AnnouncementsLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header placeholder */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0A2472] to-[#1e3a8a] h-16 sm:h-[72px] flex items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-24 sm:h-5 sm:w-32 bg-white/20 rounded animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 rounded-full animate-pulse" />
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-white/20 rounded-full animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 sm:pt-[72px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-3 sm:border-4 border-emerald-200 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 sm:mt-4 text-slate-600 text-base sm:text-lg font-medium">
            Loading Announcements...
          </p>
          <p className="mt-1 sm:mt-2 text-slate-500 text-xs sm:text-sm">
            Fetching latest updates 📢
          </p>
        </div>
      </div>
    </div>
  )
}

export default function StudentAnnouncementsPage() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  // Build header user
  const headerUser: HeaderUser | undefined = useMemo(() => {
    if (contextUser) {
      return {
        id: contextUser.id,
        name: contextUser.full_name || contextUser.first_name || 'Student',
        firstName: contextUser.first_name || contextUser.full_name?.split(' ')[0] || 'Student',
        email: contextUser.email || '',
        role: 'student' as const,
        avatar: contextUser.photo_url || contextUser.avatar_url || undefined,
        isAuthenticated: true
      }
    }
    return cachedHeaderUser || undefined
  }, [contextUser])

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!contextUser?.id) {
        setLoading(false)
        return
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', contextUser.id)
          .single()

        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [contextUser?.id])

  // Wait for auth to resolve
  useEffect(() => {
    if (!authLoading && (isAuthenticated !== undefined)) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated])

  // Auth redirect check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !contextUser) {
        if (!cachedHeaderUser) {
          router.replace('/portal')
        }
        return
      }
      
      const userRole = contextUser.role?.toLowerCase()
      if (userRole !== 'student') {
        router.replace('/portal')
        return
      }
    }
  }, [authLoading, isAuthenticated, contextUser, router])

  const handleLogout = () => instantLogout()

  // Show loading screen
  if (!showContent || authLoading || loading) {
    return <AnnouncementsLoadingScreen />
  }

  // Auth checks
  if (!isAuthenticated || !contextUser) return null
  if (contextUser.role?.toLowerCase() !== 'student') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header user={headerUser} onLogout={handleLogout} />
      
      <div className="flex">
        {/* Sidebar */}
        <StudentSidebar 
          profile={profile || contextUser}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="announcements"
          setActiveTab={() => {}}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-[72px] lg:pt-24 pb-8 sm:pb-12">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  <Link 
                    href="/student" 
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">Announcements</span>
                </nav>

                {/* Back Button */}
                <div className="mb-5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/student')}
                    className="h-8 text-xs"
                  >
                    <ArrowLeft className="mr-1.5 h-3 w-3" />
                    Back to Dashboard
                  </Button>
                </div>

                {/* ✅ Announcements Component - HIDE the internal header to avoid duplication */}
                <StudentAnnouncements showBreadcrumb={false} hideHeader={true} />
                
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}