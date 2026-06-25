// src/hooks/student/useDashboardData.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string
  full_name: string
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  display_name?: string | null
  email: string
  class: string
  department?: string | null
  photo_url?: string | null
  vin_id?: string | null
  admission_year?: number | null
  subject_count?: number | null
  role?: string
}

export interface ExamAttempt {
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

export interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  availableExams: any[]
  recentAssignments: any[]
  recentNotes: any[]
  allAssignments: any[]
  allNotes: any[]
  classmates: any[]
}

export interface BannerStats {
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

export interface TermProgressData {
  completed_exams: number
  average_score: number
  grade: string
  total_subjects: number
  term: string
  session_year: string
  student_id: string
}

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions?: number
  total_marks?: number
  pass_mark?: number
  starts_at?: string
  ends_at?: string
  created_at: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  description?: string
  due_date: string
  total_marks?: number
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface StudyNote {
  id: string
  title: string
  subject: string
  description?: string
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface Classmate {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  display_name?: string | null
  email: string
  class: string
  vin_id?: string
  photo_url?: string | null
  department?: string
  admission_year?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
  fallback = 'Student',
): string {
  if (firstName && lastName) {
    return [firstName, middleName, lastName].filter(Boolean).join(' ')
  }
  return fallback
}

function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
): string {
  if (firstName && lastName) {
    return [lastName, firstName, middleName].filter(Boolean).join(' ')
  }
  return firstName ?? lastName ?? 'Student'
}

const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
}

function calculateGrade(pct: number) {
  if (pct >= 80) return { grade: 'A', color: 'text-green-600' }
  if (pct >= 70) return { grade: 'B', color: 'text-blue-600' }
  if (pct >= 60) return { grade: 'C', color: 'text-yellow-600' }
  if (pct >= 50) return { grade: 'P', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-red-600' }
}

function getSubjectCount(className: string): number {
  const n = (className ?? '').toUpperCase().replace(/\s+/g, '')
  if (n.startsWith('JSS')) return 17
  if (n.startsWith('SS')) return 10
  return 17
}

// ── Notes safe columns ────────────────────────────────────────────────────────
// ✅ No session_year — does not exist in notes table
// ✅ No select('*') — prevents 400 on unknown columns
const NOTES_SELECT =
  'id, title, subject, description, file_url, file_name, ' +
  'teacher_name, class, status, created_at, topic, department'

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useDashboardData(profile: StudentProfile | null) {
  const [loading, setLoading] = useState(true)
  const [termProgress, setTermProgress] = useState<TermProgressData | null>(null)
  const [currentTermSession, setCurrentTermSession] = useState<{
    term: string
    session_year: string
  } | null>(null)

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
    classmates: [],
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
    sessionYear: '2025/2026',
  })

  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    try {
      const studentClass = profile.class
      const totalSubjects =
        profile.subject_count ?? getSubjectCount(studentClass)

      // ── Current term ─────────────────────────────────────────────────────
      let currentTerm = { term: 'third', session_year: '2025/2026' }
      try {
        const { data: termData } = await supabase
          .from('terms')
          .select('term_code, session_year')
          .eq('is_current', true)
          .single()
        if (termData) {
          currentTerm = {
            term: termData.term_code,
            session_year: termData.session_year,
          }
          setCurrentTermSession(currentTerm)
        }
      } catch {
        // terms table may not exist — use default
      }

      // ── Term progress ─────────────────────────────────────────────────────
      let progressData: TermProgressData | null = null
      try {
        const { data } = await supabase
          .from('student_term_progress')
          .select('*')
          .eq('student_id', profile.id)
          .eq('term', currentTerm.term)
          .eq('session_year', currentTerm.session_year)
          .maybeSingle()
        progressData = data ?? null
        if (progressData) setTermProgress(progressData)
      } catch {
        // table may not exist yet
      }

      const completedExamsFromDB = progressData?.completed_exams ?? 0
      const averageScoreFromDB = progressData?.average_score ?? 0
      const gradeFromDB = progressData?.grade ?? 'N/A'
      const totalSubjectsFromDB = progressData?.total_subjects ?? totalSubjects

      // ── All published exams ───────────────────────────────────────────────
      let allExams: Exam[] = []
      try {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        allExams = (examsData ?? []).filter((exam: any) => {
          if (!exam.class || exam.class === 'all') return true
          return (
            exam.class.replace(/\s+/g, '').toUpperCase() ===
            studentClass.replace(/\s+/g, '').toUpperCase()
          )
        })
      } catch {
        console.warn('[useDashboardData] Exams query failed')
      }

      // ── Exam attempts ─────────────────────────────────────────────────────
      const attempts: ExamAttempt[] = []
      try {
        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })

        for (const att of attemptsData ?? []) {
          const exam = allExams.find((e) => e.id === att.exam_id)
          attempts.push({
            id: att.id,
            exam_id: att.exam_id,
            exam_title: exam?.title ?? 'Unknown Exam',
            exam_subject: exam?.subject ?? 'Unknown Subject',
            status: att.status ?? 'pending',
            percentage: att.percentage ?? att.percentage_score ?? 0,
            is_passed: att.is_passed ?? false,
            total_score: att.total_score ?? 0,
            term: att.term,
            session_year: att.session_year,
          })
        }
      } catch {
        console.warn('[useDashboardData] Exam attempts query failed')
      }

      const completedAttempts = attempts.filter((a) =>
        ['completed', 'graded', 'pending_theory', 'submitted'].includes(a.status)
      )
      const pendingAttempts = attempts.filter((a) =>
        ['pending_theory', 'submitted'].includes(a.status)
      )
      const passedAttempts = completedAttempts.filter((a) => a.is_passed)

      const takenIds = new Set(completedAttempts.map((a) => a.exam_id))
      const now = new Date()
      const availableExams = allExams.filter((exam) => {
        if (takenIds.has(exam.id)) return false
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      })

      // ── Assignments ───────────────────────────────────────────────────────
      let mappedAssignments: Assignment[] = []
      try {
        const { data: assignData } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false })

        mappedAssignments = (assignData ?? [])
          .filter(
            (a: any) =>
              a.class === undefined || a.class === null || a.class === studentClass
          )
          .map((a: any) => ({
            id: a.id,
            title: a.title ?? 'Untitled',
            subject: a.subject ?? 'General',
            description: a.description ?? '',
            due_date: a.due_date ?? a.created_at,
            total_marks: a.total_marks ?? 0,
            file_url: a.file_url ?? null,
            created_at: a.created_at,
            teacher_name: a.teacher_name ?? null,
            class: a.class ?? null,
          }))
      } catch {
        console.warn('[useDashboardData] Assignments query failed')
      }

      // ── Notes ─────────────────────────────────────────────────────────────
      // ✅ Explicit safe columns — no session_year filter
      // ✅ Fallback chain if first query fails
      let mappedNotes: StudyNote[] = []
      try {
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select(NOTES_SELECT)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (notesError) {
          console.error('[useDashboardData] Notes error:', notesError.message)

          // Fallback — remove status filter
          const { data: fallback } = await supabase
            .from('notes')
            .select('id, title, subject, class, created_at, file_url, teacher_name')
            .order('created_at', { ascending: false })

          mappedNotes = (fallback ?? [])
            .filter(
              (n: any) =>
                n.class === undefined || n.class === null || n.class === studentClass
            )
            .map((n: any) => ({
              id: n.id,
              title: n.title ?? 'Untitled',
              subject: n.subject ?? 'General',
              description: '',
              file_url: n.file_url ?? null,
              created_at: n.created_at,
              teacher_name: n.teacher_name ?? null,
              class: n.class ?? null,
            }))
        } else {
          mappedNotes = (notesData ?? [])
            .filter(
              (n: any) =>
                n.class === undefined || n.class === null || n.class === studentClass
            )
            .map((n: any) => ({
              id: n.id,
              title: n.title ?? 'Untitled',
              subject: n.subject ?? 'General',
              description: n.description ?? '',
              file_url: n.file_url ?? null,
              created_at: n.created_at,
              teacher_name: n.teacher_name ?? null,
              class: n.class ?? null,
            }))
        }
      } catch {
        console.warn('[useDashboardData] Notes query failed entirely')
      }

      // ── Classmates ────────────────────────────────────────────────────────
      let mappedClassmates: Classmate[] = []
      try {
        const { data: classmatesData } = await supabase
          .from('profiles')
          .select(
            'id, first_name, middle_name, last_name, full_name, ' +
            'display_name, email, photo_url, vin_id, class'
          )
          .eq('class', studentClass)
          .neq('id', profile.id)
          .order('full_name', { ascending: true })

        mappedClassmates = (classmatesData ?? []).map((c: any) => ({
          id: c.id,
          first_name: c.first_name,
          middle_name: c.middle_name,
          last_name: c.last_name,
          full_name:
            c.full_name ??
            formatFullName(c.first_name, c.last_name, c.middle_name),
          display_name:
            c.display_name ??
            formatDisplayName(c.first_name, c.last_name, c.middle_name),
          email: c.email,
          photo_url: c.photo_url,
          vin_id: c.vin_id,
          class: c.class,
        }))
      } catch {
        console.warn('[useDashboardData] Classmates query failed')
      }

      // ── Set stats ─────────────────────────────────────────────────────────
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
        classmates: mappedClassmates,
      })

      const gradeInfo = calculateGrade(averageScoreFromDB)
      setBannerStats({
        completedExams: completedExamsFromDB,
        averageScore: averageScoreFromDB,
        availableExams: availableExams.length,
        totalExams: allExams.length,
        totalSubjects: totalSubjectsFromDB,
        currentGrade: gradeFromDB,
        gradeColor:
          completedExamsFromDB > 0 ? gradeInfo.color : 'text-gray-400',
        currentTerm: TERM_NAMES[currentTerm.term] ?? currentTerm.term,
        sessionYear: currentTerm.session_year,
      })
    } catch (error) {
      console.error('[useDashboardData] Unexpected error:', error)
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
    setBannerStats,
  }
}