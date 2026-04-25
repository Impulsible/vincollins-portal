// app/student/page.tsx - Clean professional version
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  Award
} from 'lucide-react'

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <Skeleton className="h-40 sm:h-48 md:h-56 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <Skeleton className="h-64 sm:h-72 w-full rounded-xl" />
          <Skeleton className="h-64 sm:h-72 w-full rounded-xl" />
        </div>
        <div className="space-y-6 sm:space-y-8">
          <Skeleton className="h-80 sm:h-96 w-full rounded-xl" />
          <Skeleton className="h-64 sm:h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    availableExams: [],
    classmates: [],
    recentAttempts: [],
    allAssignments: [],
    recentAssignments: [],
    allNotes: [],
    recentNotes: [],
    passedExams: 0,
    failedExams: 0,
    completedExams: 0
  })
  const [reportCardStatus, setReportCardStatus] = useState<any>(null)

  useEffect(() => {
    loadProfileAndData()
  }, [])

  const loadProfileAndData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Load classmates from same class
        const { data: classmates } = await supabase
          .from('profiles')
          .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
          .eq('class', profileData.class)
          .eq('role', 'student')
          .neq('id', profileData.id)
          .limit(6)

        // Load available exams FILTERED BY STUDENT'S CLASS
        const { data: exams } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .eq('class', profileData.class)
          .limit(10)

        // Load exam attempts for this student
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profileData.id)
          .order('created_at', { ascending: false })

        // Calculate exam stats
        const passedExams = attempts?.filter(a => 
          a.status === 'passed' || (a.score && a.total_points && (a.score / a.total_points) * 100 >= 50)
        ).length || 0
        
        const failedExams = attempts?.filter(a => 
          a.status === 'failed' || (a.score && a.total_points && (a.score / a.total_points) * 100 < 50)
        ).length || 0
        
        const completedExams = attempts?.length || 0

        // Load assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('class', profileData.class)
          .order('created_at', { ascending: false })
          .limit(10)

        // Load notes
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('class', profileData.class)
          .order('created_at', { ascending: false })
          .limit(10)

        setStats({
          availableExams: exams || [],
          classmates: classmates || [],
          recentAttempts: attempts?.slice(0, 5) || [],
          allAssignments: assignments || [],
          recentAssignments: assignments?.slice(0, 5) || [],
          allNotes: notes || [],
          recentNotes: notes?.slice(0, 5) || [],
          passedExams,
          failedExams,
          completedExams
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const formatProfileForHeader = () => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <main className="pt-20 sm:pt-24 lg:pt-28 pb-8">
              <DashboardSkeleton />
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-slate-500">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-x-hidden w-full">
      <Header user={formatProfileForHeader()} onLogout={handleLogout} />
      
      <div className="flex flex-1 w-full overflow-x-hidden">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeSection}
          setActiveTab={setActiveSection}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {activeSection === 'overview' && (
                <OverviewTab 
                  profile={profile}
                  stats={stats}
                  bannerStats={{
                    availableExams: stats.availableExams?.length || 0,
                    totalExams: stats.availableExams?.length || 0,
                    completedExams: stats.completedExams || 0,
                    averageScore: 0
                  }}
                  reportCardStatus={reportCardStatus}
                  welcomeBannerProfile={profile}
                  handleTabChange={setActiveSection}
                  router={router}
                />
              )}

              {activeSection === 'exams' && (
                <Card className="border-0 shadow-md">
                  <CardContent className="py-12 sm:py-16 text-center">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">My Exams</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Your exams will appear here</p>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'results' && (
                <Card className="border-0 shadow-md">
                  <CardContent className="py-12 sm:py-16 text-center">
                    <Award className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">My Results</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Your results will appear here</p>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'classmates' && (
                <ClassmatesTab 
                  profile={profile}
                  stats={stats}
                  handleTabChange={setActiveSection}
                  router={router}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}