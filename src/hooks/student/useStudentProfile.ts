// src/hooks/student/useDashboardData.ts - COMPLETE FIXED VERSION
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Define all types inline to avoid import issues
interface StudentProfile {
  id: string
  full_name: string
  class: string
  email: string
  subject_count?: number | null
  photo_url?: string | null
}

interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: any[]
  availableExams: any[]
  recentAssignments: any[]
  recentNotes: any[]
  allAssignments: any[]
  allNotes: any[]
  classmates: any[]
}

interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
  currentTerm: string
  sessionYear: string
}

interface TermProgressData {
  completed_exams: number
  average_score: number
  grade: string
  total_subjects: number
  term: string
  session_year: string
  student_id: string
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  starts_at?: string
  ends_at?: string
  created_at: string
}

interface ExamAttempt {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  status: string
  percentage: number
  is_passed: boolean
  total_score: number
  term: string
  session_year: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  due_date: string
  created_at: string
  class?: string | null
  file_url?: string | null
}

interface StudyNote {
  id: string
  title: string
  subject: string
  created_at: string
  class?: string | null
  file_url?: string | null
}

interface Classmate {
  id: string
  full_name: string
  display_name?: string | null
  email: string
  photo_url?: string | null
  class: string
  vin_id?: string
}

function formatFullName(firstName?: string | null, lastName?: string | null, middleName?: string | null, fallback?: string): string {
  if (firstName && lastName) {
    const parts = [firstName]
    if (middleName) parts.push(middleName)
    parts.push(lastName)
    return parts.filter(Boolean).join(' ')
  }
  return fallback || 'Student'
}

function formatDisplayName(firstName?: string | null, lastName?: string | null, middleName?: string | null): string {
  if (firstName && lastName) {
    const parts = [lastName, firstName]
    if (middleName) parts.push(middleName)
    return parts.filter(Boolean).join(' ')
  }
  return firstName || lastName || 'Student'
}

const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

function calculateGrade(percentage: number): { grade: string; color: string; description: string } {
  if (percentage >= 80) return { grade: 'A', color: 'text-green-600', description: 'Excellent' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', description: 'Very Good' }
  if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', description: 'Good' }
  if (percentage >= 50) return { grade: 'P', color: 'text-orange-600', description: 'Pass' }
  return { grade: 'F', color: 'text-red-600', description: 'Fail' }
}

function getSubjectCountForClass(className: string): number {
  if (!className) return 17
  const normalizedClass = className.toString().toUpperCase().replace(/\s+/g, '')
  if (normalizedClass.startsWith('JSS')) return 17
  if (normalizedClass.startsWith('SS')) return 10
  return 17
}

export function useDashboardData(profile: StudentProfile | null) {
  const [loading, setLoading] = useState(true)
  const [termProgress, setTermProgress] = useState<TermProgressData | null>(null)
  const [currentTermSession, setCurrentTermSession] = useState<{ term: string; session_year: string } | null>(null)
  
  const [stats, setStats] = useState<PerformanceStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
    failedExams: 0,
    pendingResults: 0,
    recentAttempts: [],
    availableExams: [],
    recentAssignments: [],
    recentNotes: [],
    allAssignments: [],
    allNotes: [],
    classmates: []
  })

  const [bannerStats, setBannerStats] = useState<BannerStats>({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    currentTerm: 'Third Term',
    sessionYear: '2025/2026'
  })

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const studentClass = profile.class
      const totalSubjects = profile.subject_count || getSubjectCountForClass(studentClass)

      let currentTerm = { term: 'third', session_year: '2025/2026' }
      
      try {
        const { data: currentTermData } = await supabase
          .from('terms')
          .select('*')
          .eq('is_current', true)
          .single()
        
        if (currentTermData) {
          currentTerm = { 
            term: currentTermData.term_code, 
            session_year: currentTermData.session_year 
          }
          setCurrentTermSession(currentTerm)
        }
      } catch (error) {
        console.warn('Terms table not available, using default term')
      }

      let progressData = null
      try {
        const { data } = await supabase
          .from('student_term_progress')
          .select('*')
          .eq('student_id', profile.id)
          .eq('term', currentTerm.term)
          .eq('session_year', currentTerm.session_year)
          .maybeSingle()
        progressData = data
      } catch (error) {
        console.warn('student_term_progress table not available:', error)
      }

      let completedExamsFromDB = progressData?.completed_exams || 0
      let averageScoreFromDB = progressData?.average_score || 0
      let gradeFromDB = progressData?.grade || 'N/A'
      const totalSubjectsFromDB = progressData?.total_subjects || totalSubjects

      if (progressData) {
        setTermProgress(progressData as TermProgressData)
      }

      let allExams: Exam[] = []
      try {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        allExams = (examsData || []).filter((exam: any) => {
          if (!exam.class || exam.class === 'all') return true
          const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
          const normalizedStudentClass = studentClass.replace(/\s+/g, '').toUpperCase()
          return normalizedExamClass === normalizedStudentClass
        })
      } catch (error) {
        console.warn('Exams table not available:', error)
      }

      const attempts: ExamAttempt[] = []
      try {
        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })

        if (attemptsData) {
          for (const att of attemptsData) {
            const exam = allExams.find(e => e.id === att.exam_id)
            attempts.push({
              id: att.id,
              exam_id: att.exam_id,
              exam_title: exam?.title || 'Unknown Exam',
              exam_subject: exam?.subject || 'Unknown Subject',
              status: att.status || 'pending',
              percentage: att.percentage || att.percentage_score || 0,
              is_passed: att.is_passed || false,
              total_score: att.total_score || 0,
              term: att.term,
              session_year: att.session_year
            })
          }
        }
      } catch (error) {
        console.warn('Exam attempts table not available:', error)
      }

      const completedAttempts = attempts.filter(a => 
        a.status === 'completed' || a.status === 'graded' || 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const pendingAttempts = attempts.filter(a => 
        a.status === 'pending_theory' || a.status === 'submitted'
      )
      
      const passedAttempts = completedAttempts.filter(a => a.is_passed)

      const takenExamIds = new Set(completedAttempts.map(a => a.exam_id))
      const now = new Date()
      
      const availableExams = allExams.filter(exam => {
        if (takenExamIds.has(exam.id)) return false
        if (!exam.starts_at && !exam.ends_at) return true
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      })

      let mappedAssignments: Assignment[] = []
      try {
        const { data: allAssignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false })

        if (allAssignmentsData) {
          mappedAssignments = allAssignmentsData
            .filter((a: any) => {
              if (a.class === undefined || a.class === null) return true
              return a.class === studentClass
            })
            .map((a: any) => ({
              id: a.id,
              title: a.title || 'Untitled',
              subject: a.subject || 'General',
              due_date: a.due_date || a.created_at,
              created_at: a.created_at,
              class: a.class || null,
              file_url: a.file_url || null
            }))
        }
      } catch (error) {
        console.warn('Assignments table not available:', error)
      }

      let mappedNotes: StudyNote[] = []
      try {
        const { data: allNotesData } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })

        if (allNotesData) {
          mappedNotes = allNotesData
            .filter((n: any) => {
              if (n.class === undefined || n.class === null) return true
              return n.class === studentClass
            })
            .map((n: any) => ({
              id: n.id,
              title: n.title || 'Untitled',
              subject: n.subject || 'General',
              created_at: n.created_at,
              class: n.class || null,
              file_url: n.file_url || null
            }))
        }
      } catch (error) {
        console.warn('Notes table not available:', error)
      }

      let mappedClassmates: Classmate[] = []
      try {
        const { data: classmatesData } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, email, photo_url, vin_id, class')
          .eq('class', studentClass)
          .neq('id', profile.id)
          .order('full_name', { ascending: true })

        mappedClassmates = (classmatesData || []).map((c: any) => ({
          id: c.id,
          full_name: c.full_name || formatFullName(c.first_name, c.last_name, c.middle_name, 'Student'),
          display_name: c.display_name || formatDisplayName(c.first_name, c.last_name, c.middle_name),
          email: c.email,
          photo_url: c.photo_url,
          class: c.class,
          vin_id: c.vin_id
        }))
      } catch (error) {
        console.warn('Profiles/classmates query failed:', error)
      }

      setStats({
        totalExams: allExams.length,
        completedExams: completedExamsFromDB,
        averageScore: averageScoreFromDB,
        passedExams: passedAttempts.length,
        failedExams: completedAttempts.length - passedAttempts.length,
        pendingResults: pendingAttempts.length,
        recentAttempts: attempts.slice(0, 4),
        availableExams: availableExams.slice(0, 6),
        recentAssignments: mappedAssignments.slice(0, 3),
        recentNotes: mappedNotes.slice(0, 3),
        allAssignments: mappedAssignments,
        allNotes: mappedNotes,
        classmates: mappedClassmates
      })

      const gradeInfo = calculateGrade(averageScoreFromDB)
      setBannerStats({
        completedExams: completedExamsFromDB,
        averageScore: averageScoreFromDB,
        availableExams: availableExams.length,
        totalExams: allExams.length,
        totalSubjects: totalSubjectsFromDB,
        currentGrade: gradeFromDB,
        gradeColor: completedExamsFromDB > 0 ? gradeInfo.color : 'text-gray-400',
        currentTerm: TERM_NAMES[currentTerm.term] || currentTerm.term,
        sessionYear: currentTerm.session_year
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.class])

  return {
    loading,
    stats,
    bannerStats,
    termProgress,
    currentTermSession,
    loadDashboardData,
    setStats,
    setBannerStats
  }
}