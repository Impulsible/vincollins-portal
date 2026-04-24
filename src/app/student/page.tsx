// app/student/page.tsx - SIMPLIFIED VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { OverviewTab } from '@/components/student/OverviewTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  Users
} from 'lucide-react'

// Simple loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="w-full px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    availableExams: [],
    classmates: [],
    recentAttempts: [],
    passedExams: 0,
    failedExams: 0,
    completedExams: 0
  })
  const [bannerStats, setBannerStats] = useState<any>({
    availableExams: 0,
    totalExams: 0,
    completedExams: 0,
    averageScore: 0
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
        
        // Load classmates
        const { data: classmates } = await supabase
          .from('profiles')
          .select('id, full_name, email, photo_url, class, department, first_name, last_name, display_name, vin_id')
          .eq('class', profileData.class)
          .eq('role', 'student')
          .neq('id', profileData.id)
          .limit(6)

        // Load available exams
        const { data: exams } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .limit(10)

        setStats({
          availableExams: exams || [],
          classmates: classmates || [],
          recentAttempts: [],
          passedExams: 0,
          failedExams: 0,
          completedExams: 0
        })

        setBannerStats({
          availableExams: exams?.length || 0,
          totalExams: exams?.length || 0,
          completedExams: 0,
          averageScore: 0
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
            <main className="pt-20 lg:pt-24 pb-8">
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-16 lg:pt-20 pb-12 px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm">
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Exams
                  </TabsTrigger>
                  <TabsTrigger value="results" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm">
                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Results
                  </TabsTrigger>
                  <TabsTrigger value="classmates" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Classmates
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab 
                    profile={profile}
                    stats={stats}
                    bannerStats={bannerStats}
                    reportCardStatus={reportCardStatus}
                    welcomeBannerProfile={profile}
                    handleTabChange={setActiveTab}
                    router={router}
                  />
                </TabsContent>

                <TabsContent value="exams">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-semibold mb-2">My Exams</h3>
                      <p className="text-muted-foreground">Your exams will appear here</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="results">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-semibold mb-2">My Results</h3>
                      <p className="text-muted-foreground">Your results will appear here</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="classmates">
                  <ClassmatesTab 
                    profile={profile}
                    stats={stats}
                    handleTabChange={setActiveTab}
                    router={router}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}