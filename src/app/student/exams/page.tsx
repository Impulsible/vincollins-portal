/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/student/exams/page.tsx - COMPLETE FIXED VERSION WITH DARK MODE
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

  const normalizedStats = {
    ...stats,
    subjectStats: stats.subjectStats ?? [],
  }

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

  // Include all completion statuses for completed tab
  const displayedExams = filteredExams.filter((exam) => {
    const status = getExamStatus(exam)
    switch (activeTab) {
      case 'available': 
        return status === 'available' || status === 'in_progress'
      case 'completed': 
        // Include graded and pending_theory as completed
        return status === 'completed' || status === 'graded' || status === 'pending_theory'
      case 'upcoming': 
        return status === 'upcoming'
      case 'expired':
        return status === 'expired'
      default: 
        return true
    }
  })

  // Updated counts with all statuses
  const availableCount = filteredExams.filter(e => {
    const status = getExamStatus(e)
    return status === 'available' || status === 'in_progress'
  }).length

  const upcomingCount = filteredExams.filter(e => getExamStatus(e) === 'upcoming').length

  const completedCount = filteredExams.filter(e => {
    const status = getExamStatus(e)
    return status === 'completed' || status === 'graded' || status === 'pending_theory'
  }).length

  const expiredCount = filteredExams.filter(e => getExamStatus(e) === 'expired').length

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block">
            <StudentSidebar 
              profile={null} 
              onLogout={handleLogout} 
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
              activeTab="exams" 
              setActiveTab={handleTabChange} 
            />
          </div>
          <div className={cn('flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 p-0.5" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Loading Exams</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Fetching your exam schedule...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header onLogout={handleLogout} />
      <div className="flex overflow-x-hidden">
        <StudentSidebar 
          profile={profile} 
          onLogout={handleLogout} 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeTab="exams" 
          setActiveTab={handleTabChange} 
        />
        <div className={cn('flex-1 transition-all duration-300 overflow-x-hidden', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
          <main className="pt-[72px] lg:pt-24 pb-20 px-3 sm:px-5 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              <ExamsHeader 
                profile={profile} 
                stats={normalizedStats} 
                onBackToDashboard={() => router.push('/student')} 
              />
              
              <div className="mt-6 sm:mt-8">
                <TermProgressCard 
                  stats={normalizedStats} 
                  availableTerms={availableTerms} 
                  selectedTermSession={selectedTermSession} 
                  onTermChange={handleTermSessionChange} 
                  onRefresh={handleRefresh} 
                />
              </div>
              
              <div className="mt-6 sm:mt-8">
                <SubjectFilter 
                  availableSubjects={availableSubjects} 
                  selectedSubject={selectedSubject} 
                  onSubjectChange={setSelectedSubject} 
                  searchQuery={searchQuery} 
                  onSearchChange={setSearchQuery} 
                  viewMode={viewMode} 
                  onViewModeChange={setViewMode} 
                  exams={exams} 
                  examAttempts={examAttempts} 
                  getSubjectConfig={getSubjectConfig} 
                />
              </div>
              
              <div className="mt-4 sm:mt-6">
                {/* Pass all counts including expired */}
                <ExamTabs 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                  availableCount={availableCount} 
                  upcomingCount={upcomingCount} 
                  completedCount={completedCount}
                  expiredCount={expiredCount}
                />
              </div>
              
              <div className="mt-4 sm:mt-6">
                {displayedExams.length === 0
                  ? <EmptyExamsState activeTab={activeTab} stats={normalizedStats} />
                  : <ExamList 
                      exams={displayedExams} 
                      examAttempts={examAttempts} 
                      viewMode={viewMode} 
                      getExamStatus={getExamStatus} 
                      getSubjectConfig={getSubjectConfig} 
                      onTakeExam={handleTakeExam} 
                      onViewResult={handleViewResult} 
                    />
                }
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  )
}