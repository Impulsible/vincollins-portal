// src/app/student/exams/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useExamsData } from './hooks/useExamsData'
import { useExamFilters } from './hooks/useExamFilters'
import { ExamsHeader } from '@/components/student/exams/ExamsHeader'
import { TermProgressCard } from '@/components/student/exams/TermProgressCard'
import { SubjectFilter } from '@/components/student/exams/SubjectFilter'
import { ExamTabs } from '@/components/student/exams/ExamTabs'
import { ExamList } from '@/components/student/exams/ExamList'
import { EmptyExamsState } from '@/components/student/exams/EmptyExamsState'
import { BookMarked, Loader2 } from 'lucide-react'

export default function StudentExamsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const {
    loading, exams, profile, examAttempts, availableTerms,
    selectedTermSession, stats, loadData, handleTermSessionChange,
  } = useExamsData(router)

  const {
    searchQuery, setSearchQuery, selectedSubject, setSelectedSubject,
    viewMode, setViewMode, activeTab, setActiveTab, filteredExams,
    availableSubjects, getExamStatus, getSubjectConfig,
  } = useExamFilters(exams, examAttempts)

  useEffect(() => { setMounted(true) }, [])

  const handleTakeExam = (examId: string) => {
    const attempt = examAttempts[examId]
    router.push(attempt?.status === 'in_progress' ? `/student/exam/${examId}?resume=true` : `/student/exam/${examId}`)
  }
  const handleViewResult = (examId: string) => router.push(`/student/results/${examId}`)
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }
  const handleTabChange = (tab: string) => {
    if (tab === 'overview') router.push('/student')
    if (tab === 'results') router.push('/student/results')
    if (tab === 'classmates') router.push('/student/classmates')
  }
  const handleRefresh = useCallback(() => {
    if (selectedTermSession) loadData(selectedTermSession.term, selectedTermSession.session_year)
    else loadData()
  }, [loadData, selectedTermSession])

  const displayedExams = filteredExams.filter((exam) => {
    switch (activeTab) {
      case 'available': return getExamStatus(exam) === 'available'
      case 'completed': return getExamStatus(exam) === 'completed'
      case 'upcoming': return getExamStatus(exam) === 'upcoming'
      default: return true
    }
  })

  const availableCount = filteredExams.filter(e => getExamStatus(e) === 'available').length
  const upcomingCount = filteredExams.filter(e => getExamStatus(e) === 'upcoming').length
  const completedCount = filteredExams.filter(e => getExamStatus(e) === 'completed').length

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block">
            <StudentSidebar profile={null} onLogout={handleLogout} collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="exams" setActiveTab={handleTabChange} />
          </div>
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Loading Exams</p>
                <p className="text-sm text-slate-400 mt-1">Fetching your exam schedule...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <Header onLogout={handleLogout} />
      <div className="flex overflow-x-hidden">
        <StudentSidebar profile={profile} onLogout={handleLogout} collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeTab="exams" setActiveTab={handleTabChange} />
        <div className={cn('flex-1 transition-all duration-300 overflow-x-hidden', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
          <main className="pt-[72px] lg:pt-24 pb-20 px-3 sm:px-5 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <ExamsHeader profile={profile} stats={stats} onBackToDashboard={() => router.push('/student')} />
              <TermProgressCard stats={stats} availableTerms={availableTerms} selectedTermSession={selectedTermSession} onTermChange={handleTermSessionChange} onRefresh={handleRefresh} />
              <SubjectFilter availableSubjects={availableSubjects} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} searchQuery={searchQuery} onSearchChange={setSearchQuery} viewMode={viewMode} onViewModeChange={setViewMode} exams={exams} examAttempts={examAttempts} getSubjectConfig={getSubjectConfig} />
              <ExamTabs activeTab={activeTab} onTabChange={setActiveTab} availableCount={availableCount} upcomingCount={upcomingCount} completedCount={completedCount} />
              {displayedExams.length === 0
                ? <EmptyExamsState activeTab={activeTab} stats={stats} />
                : <ExamList exams={displayedExams} examAttempts={examAttempts} viewMode={viewMode} getExamStatus={getExamStatus} getSubjectConfig={getSubjectConfig} onTakeExam={handleTakeExam} onViewResult={handleViewResult} />
              }
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}