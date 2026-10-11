// app/student/classmates/page.tsx - PROFESSIONAL VERSION WITH DARK MODE
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { instantLogout, getCachedHeaderUser } from '@/lib/auth-utils'
import { Header, HeaderUser } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentClassRoster } from '@/components/student/StudentClassRoster'
import { cn } from '@/lib/utils'
import { ArrowLeft, Home, ChevronRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const cachedHeaderUser = getCachedHeaderUser()

// Helper to extract year from class name
function extractYear(className: string): string {
  if (!className) return ''
  
  const normalized = className.trim().replace(/\s+/g, ' ')
  
  // JSS Classes
  if (normalized === 'JSS 1' || normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS 2' || normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS 3' || normalized === 'JSS3') return 'JSS3'
  
  // SS Classes
  if (normalized === 'SS 1' || normalized === 'SS1') return 'SS1'
  if (normalized === 'SS 2' || normalized === 'SS2') return 'SS2'
  if (normalized === 'SS 3' || normalized === 'SS3') return 'SS3'
  
  // Subject-specific SS classes
  if (normalized.startsWith('SS1')) return 'SS1'
  if (normalized.startsWith('SS2')) return 'SS2'
  if (normalized.startsWith('SS3')) return 'SS3'
  
  return className
}

export default function StudentClassmatesPage() {
  const router = useRouter()
  const { user: contextUser, loading: authLoading, isAuthenticated } = useUser()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const headerUser: HeaderUser | undefined = useMemo(() => {
    if (contextUser) {
      return {
        id: contextUser.id,
        name: contextUser.full_name || contextUser.first_name || 'Student',
        firstName: contextUser.first_name || contextUser.full_name?.split(' ')[0] || 'Student',
        email: contextUser.email || '',
        role: 'student' as const,
        avatar: contextUser.avatar_url || contextUser.photo_url || undefined,
        isAuthenticated: true
      }
    }
    return cachedHeaderUser || undefined
  }, [contextUser])

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!contextUser?.id) return

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', contextUser.id)
          .single()

        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfile()
  }, [contextUser?.id])

  const handleLogout = () => instantLogout()

  // Auth checks
  if (!authLoading && (!isAuthenticated || !contextUser)) {
    if (!cachedHeaderUser) {
      router.replace('/portal')
      return null
    }
  }
  
  if (!authLoading && contextUser?.role?.toLowerCase() !== 'student') {
    router.replace('/portal')
    return null
  }

  const userClass = profile?.class || contextUser?.class || ''
  const userYear = extractYear(userClass)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Header user={headerUser} onLogout={handleLogout} />
      
      <div className="flex">
        <StudentSidebar 
          profile={profile || contextUser}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="classmates"
          setActiveTab={() => {}}
        />

        <div className={cn(
          "flex-1 min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-[72px] lg:pt-24 pb-12">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                
                {/* Breadcrumb */}
                <nav 
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6"
                  aria-label="Breadcrumb"
                >
                  <Link 
                    href="/student" 
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Classmates</span>
                </nav>

                {/* Page Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Classmates
                      </h1>
                      {userClass && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 sm:ml-12">
                          {userYear} • All departments
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/student')}
                      className="h-9 text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer w-full sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>

                {/* Classmates Roster */}
                <StudentClassRoster 
                  studentClass={profile?.class || contextUser?.class}
                  studentId={contextUser?.id}
                  compact={false}
                  onClassmateClick={(classmate) => {
                    console.log('Clicked classmate:', classmate)
                  }}
                />
                
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}