// src/app/student/exams/page.tsx
'use client'

import { useEffect, useState } from 'react'
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
import { ExamsSkeleton } from '@/components/student/exams/ExamsSkeleton'

export default function StudentExamsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const {
    loading,
    exams,
    profile,
    examAttempts,
    availableTerms,
    selectedTermSession,
    stats,
    loadData,
    handleTermSessionChange,
  } = useExamsData(router)

  const {
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    filteredExams,
    availableSubjects,
    getExamStatus,
    getSubjectConfig,
  } = useExamFilters(exams, examAttempts)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTakeExam = (examId: string) => {
    const attempt = examAttempts[examId]
    router.push(
      attempt?.status === 'in_progress'
        ? `/student/exam/${examId}?resume=true`
        : `/student/exam/${examId}`
    )
  }

  const handleViewResult = (examId: string) => {
    router.push(`/student/results/${examId}`)
  }

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

  const displayedExams = filteredExams.filter((exam) => {
    switch (activeTab) {
      case 'available':
        return getExamStatus(exam) === 'available'
      case 'completed':
        return getExamStatus(exam) === 'completed'
      case 'upcoming':
        return getExamStatus(exam) === 'upcoming'
      default:
        return true
    }
  })

  const availableCount = filteredExams.filter(
    (e) => getExamStatus(e) === 'available'
  ).length
  const upcomingCount = filteredExams.filter(
    (e) => getExamStatus(e) === 'upcoming'
  ).length
  const completedCount = filteredExams.filter(
    (e) => getExamStatus(e) === 'completed'
  ).length

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className="hidden lg:block w-72" />
          <div className="flex-1">
            <ExamsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header onLogout={handleLogout} />

      <div className="flex w-full overflow-x-hidden">
        <StudentSidebar
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="exams"
          setActiveTab={handleTabChange}
        />

        <div className={cn(
          "flex-1 transition-all duration-300 w-full overflow-x-hidden",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <main className="pt-[72px] lg:pt-20 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
            <div className="max-w-[1600px] mx-auto">
              <ExamsHeader
                profile={profile}
                stats={stats}
                onBackToDashboard={() => router.push('/student')}
              />

              <TermProgressCard
                stats={stats}
                availableTerms={availableTerms}
                selectedTermSession={selectedTermSession}
                onTermChange={handleTermSessionChange}
                onRefresh={() => {
                  if (selectedTermSession) {
                    loadData(selectedTermSession.term, selectedTermSession.session_year)
                  } else {
                    loadData()
                  }
                }}
              />

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

              <ExamTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                availableCount={availableCount}
                upcomingCount={upcomingCount}
                completedCount={completedCount}
              />

              {displayedExams.length === 0 ? (
                <EmptyExamsState activeTab={activeTab} stats={stats} />
              ) : (
                <ExamList
                  exams={displayedExams}
                  examAttempts={examAttempts}
                  viewMode={viewMode}
                  getExamStatus={getExamStatus}
                  getSubjectConfig={getSubjectConfig}
                  onTakeExam={handleTakeExam}
                  onViewResult={handleViewResult}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}