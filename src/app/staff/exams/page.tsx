// app/staff/exams/page.tsx - UPDATED WITH TERM FILTERING

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffContext } from '../layout'
import { useExams } from './hooks/useExams'
import { ExamList } from '@/components/staff/exams/ExamList'
import { CreateExamDialog } from '@/components/staff/CreateExamDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TermOption {
  value: string
  label: string
  session_year: string
  is_current: boolean
}

export default function StaffExamsPage() {
  const router = useRouter()
  const context = useStaffContext()
  const profile = context?.profile

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // ✅ Term filter state
  const [termOptions, setTermOptions] = useState<TermOption[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [isLoadingTerms, setIsLoadingTerms] = useState(true)

  // ✅ Pass term filters to useExams
  const {
    exams, filteredExams, loading, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, loadExams,
    handleDeleteExam, handleDuplicateExam, handleSubmitForApproval
  } = useExams(profile?.id, selectedTerm, selectedSession)

  // ✅ Fetch terms from database
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('terms')
          .select('term_code, term_name, session_year')
          .order('session_year', { ascending: false })
          .order('term_code', { ascending: true })

        if (error) {
          console.error('Error fetching terms:', error)
          return
        }

        if (data) {
          // Get current term from school_settings
          const { data: settings } = await supabase
            .from('school_settings')
            .select('current_term, current_session')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const options = data.map((t: any) => ({
            value: t.term_code,
            label: t.term_name,
            session_year: t.session_year,
            is_current: t.term_code === settings?.current_term && 
                        t.session_year === settings?.current_session
          }))
          
          setTermOptions(options)
          
          // Set default selection to current term
          if (settings?.current_term && settings?.current_session) {
            setSelectedTerm(settings.current_term)
            setSelectedSession(settings.current_session)
          } else if (options.length > 0) {
            setSelectedTerm(options[0].value)
            setSelectedSession(options[0].session_year)
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error)
      } finally {
        setIsLoadingTerms(false)
      }
    }

    fetchTerms()
  }, [])

  // ✅ Navigate to view exam
  const handleViewExam = (id: string) => {
    router.push(`/staff/exams/${id}`)
  }

  // ✅ Navigate to edit exam
  const handleEditExam = (id: string) => {
    router.push(`/staff/exams/${id}/edit`)
  }

  // ✅ Navigate to submissions
  const handleViewSubmissions = (id: string) => {
    router.push(`/staff/exams/${id}/submissions`)
  }

  // ✅ Navigate to scores
  const handleEnterScores = (id: string) => {
    router.push(`/staff/exams/${id}/scores`)
  }

  const handleCreateSuccess = () => {
    loadExams()
    setShowCreateDialog(false)
    toast.success('Exam created successfully!')
  }

  if (!profile) return null

  if (loading || isLoadingTerms) {
    return (
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 space-y-5">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // Get current term label
  const currentTermLabel = termOptions.find(t => t.value === selectedTerm)?.label || selectedTerm

  // Count exams by status
  const draftCount = exams.filter((e: any) => e.status === 'draft').length
  const pendingCount = exams.filter((e: any) => e.status === 'pending').length
  const publishedCount = exams.filter((e: any) => e.status === 'published').length

  return (
    <>
      <div className="mt-6 sm:mt-8 lg:mt-10 p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
        {/* ✅ Term Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium text-slate-700">{currentTermLabel || 'All Terms'}</span>
            <span className="text-slate-300">·</span>
            <span className="font-medium text-slate-700">{selectedSession || 'All Sessions'}</span>
            {termOptions.find(t => t.value === selectedTerm)?.is_current && (
              <Badge className="ml-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                Current
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <Select value={selectedTerm} onValueChange={(value) => {
              const term = termOptions.find(t => t.value === value)
              if (term) {
                setSelectedTerm(value)
                setSelectedSession(term.session_year)
              }
            }}>
              <SelectTrigger className="h-8 text-xs w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((term) => (
                  <SelectItem key={`${term.value}-${term.session_year}`} value={term.value}>
                    {term.label} {term.is_current ? '✓' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-white border-slate-200">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(termOptions.map(t => t.session_year))].map((session) => (
                  <SelectItem key={session} value={session}>
                    {session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ExamList
          exams={filteredExams}
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter} 
          onStatusFilterChange={setStatusFilter}
          onCreateExam={() => setShowCreateDialog(true)}
          onViewExam={handleViewExam}
          onEditExam={handleEditExam}
          onDeleteExam={handleDeleteExam} 
          onDuplicateExam={handleDuplicateExam}
          onSubmitForApproval={handleSubmitForApproval}
          onViewSubmissions={handleViewSubmissions}
          onEnterScores={handleEnterScores}
          totalExams={exams.length} 
          draftCount={draftCount}
          pendingCount={pendingCount} 
          publishedCount={publishedCount}
          termInfo={{
            termName: currentTermLabel,
            sessionYear: selectedSession,
            termCode: selectedTerm,
            isCurrent: termOptions.find(t => t.value === selectedTerm)?.is_current || false
          }}
        />
      </div>
      
      <CreateExamDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onSuccess={handleCreateSuccess}
        teacherProfile={profile}
        defaultTerm={selectedTerm}
        defaultSession={selectedSession}
      />
    </>
  )
}