// app/student/classmates/page.tsx - PROFESSIONAL VERSION
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
    <div className="min-h-screen bg-slate-50">
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
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                  <Link href="/student" className="hover:text-emerald-600 transition-colors">
                    Dashboard
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-slate-800 font-medium">Classmates</span>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-emerald-600" />
                        Classmates
                      </h1>
                      {userClass && (
                        <p className="text-sm text-slate-500 mt-1">
                          {userYear} • All departments
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/student')}
                      className="h-9 text-sm"
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