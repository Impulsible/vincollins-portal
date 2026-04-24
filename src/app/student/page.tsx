/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/student/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'

// Hooks
import { useStudentProfile } from './hooks/useStudentProfile'
import { useDashboardData } from './hooks/useDashboardData'

// Components
import { OverviewTab } from '@/components/student/OverviewTab'
import { ExamsTab } from '@/components/student/ExamsTab'
import { ResultsTab } from '@/components/student/ResultsTab'
import { AssignmentsTab } from '@/components/student/AssignmentsTab'
import { NotesTab } from '@/components/student/NotesTab'
import { ClassmatesTab } from '@/components/student/ClassmatesTab'
import { ProfileTab } from '@/components/student/ProfileTab'
import { ReportCardTab } from '@/components/student/ReportCardTab'
import { MobileBottomNav } from '@/components/student/MobileBottomNav'
import { LoadingState } from '@/components/student/LoadingState'

// Types
import { WelcomeBannerProfile, ReportCardStatus, StudentProfile } from './types'

// Utils
import { getBestDisplayName } from './utils/nameFormatter'
import { getSubjectCountForClass } from './utils/constants'

function StudentDashboardContent() {
  const router = useRouter()
  const { profile, authChecking, setProfile } = useStudentProfile()
  const { 
    loading, 
    stats, 
    bannerStats, 
    termProgress, 
    loadDashboardData,
    setStats,
    setBannerStats 
  } = useDashboardData(profile)
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reportCardStatus, setReportCardStatus] = useState<ReportCardStatus | null>(null)

  const displayTotalSubjects = useMemo(() => {
    if (termProgress?.total_subjects) return termProgress.total_subjects
    if (!profile?.class) return 17
    return getSubjectCountForClass(profile.class)
  }, [profile?.class, termProgress])

  const profileDisplayName = useMemo(() => {
    if (!profile) return 'Student'
    return getBestDisplayName(profile, 'Student')
  }, [profile])

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.display_name || profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const checkReportCardStatus = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('id, status, term, academic_year, average_score')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (error) {
        if (error.code === '42703') {
          const { data: basicData } = await supabase
            .from('report_cards')
            .select('id, status')
            .eq('student_id', profile.id)
            .limit(1)
            .maybeSingle()
          if (basicData) {
            setReportCardStatus({
              id: basicData.id,
              status: basicData.status,
              term: 'Current Term',
              academic_year: '2025/2026'
            })
          }
          return
        }
        throw error
      }
      if (data) {
        const grade = data.average_score && data.average_score >= 75 ? 'A1' : 
                     data.average_score && data.average_score >= 70 ? 'B2' :
                     data.average_score && data.average_score >= 65 ? 'B3' :
                     data.average_score && data.average_score >= 60 ? 'C4' :
                     data.average_score && data.average_score >= 55 ? 'C5' :
                     data.average_score && data.average_score >= 50 ? 'C6' :
                     data.average_score && data.average_score >= 45 ? 'D7' :
                     data.average_score && data.average_score >= 40 ? 'E8' : 'F9'
        setReportCardStatus({
          id: data.id,
          status: data.status,
          term: data.term,
          academic_year: data.academic_year,
          average_score: data.average_score,
          grade
        })
      } else {
        setReportCardStatus(null)
      }
    } catch (error: any) {
      console.warn('Error checking report card status:', error.message)
      setReportCardStatus(null)
    }
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel('student-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `student_id=eq.${profile.id}` }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_term_progress', filter: `student_id=eq.${profile.id}` }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `class=eq.${profile.class}` }, () => loadDashboardData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'report_cards', filter: `student_id=eq.${profile.id}` }, () => checkReportCardStatus())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` }, (payload) => {
        if (payload.new.photo_url) {
          setProfile(prev => prev ? { ...prev, photo_url: payload.new.photo_url } : null)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id, profile?.class, loadDashboardData, checkReportCardStatus, setProfile])

  useEffect(() => {
    if (!authChecking && profile) {
      loadDashboardData()
      checkReportCardStatus()
    }
  }, [authChecking, profile, loadDashboardData, checkReportCardStatus])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const getWelcomeBannerProfile = (): WelcomeBannerProfile | null => {
    if (!profile) return null
    return {
      full_name: profile.full_name,
      display_name: profile.display_name,
      class: profile.class,
      department: profile.department || undefined,
      photo_url: profile.photo_url || undefined,
      subject_count: displayTotalSubjects
    }
  }

  const finalBannerStats = {
    ...bannerStats,
    totalSubjects: displayTotalSubjects || bannerStats.totalSubjects
  }

  if (authChecking || loading) {
    return <LoadingState profile={profile} onLogout={handleLogout} />
  }

  const tabProps = {
    profile,
    stats,
    bannerStats: finalBannerStats,
    reportCardStatus,
    displayTotalSubjects,
    profileDisplayName,
    handleTabChange,
    router,
    setStats,
    setBannerStats,
    checkReportCardStatus
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-x-hidden w-full">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab={activeTab} setActiveTab={handleTabChange} />
        <main className={cn("flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300 w-full overflow-x-hidden", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && <OverviewTab {...tabProps} welcomeBannerProfile={getWelcomeBannerProfile()} />}
              {activeTab === 'exams' && <ExamsTab {...tabProps} />}
              {activeTab === 'results' && <ResultsTab {...tabProps} />}
              {activeTab === 'assignments' && <AssignmentsTab {...tabProps} />}
              {activeTab === 'notes' && <NotesTab {...tabProps} />}
              {activeTab === 'classmates' && <ClassmatesTab {...tabProps} />}
              {activeTab === 'profile' && <ProfileTab {...tabProps} />}
              {activeTab === 'report-card' && <ReportCardTab {...tabProps} />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <GraduationCap className="h-12 w-12 text-emerald-600 mx-auto" />
          </motion.div>
          <p className="mt-4 text-slate-600 text-lg font-medium">Loading Student Dashboard...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-emerald-400" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}