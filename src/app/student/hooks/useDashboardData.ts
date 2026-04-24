// hooks/useDashboardData.ts - REMOVED HARDCODED TEST DATA
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { StudentProfile, PerformanceStats, BannerStats, TermProgressData, Exam, ExamAttempt, Assignment, StudyNote, Classmate } from '../types'
import { formatFullName, formatDisplayName } from '../utils/nameFormatter'
import { TERM_NAMES, calculateGrade, getSubjectCountForClass } from '../utils/constants'

// Helper function to get valid subject display
const getValidSubject = (subject: string | null | undefined): string => {
  if (!subject || subject === 'null' || subject === 'undefined' || subject === '') {
    return 'General Studies'
  }
  return subject
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

      // Fetch current term
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

      // Fetch term progress
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

      // ✅ Use REAL data from database, NOT hardcoded
      let completedExamsFromDB = progressData?.completed_exams || 0
      let averageScoreFromDB = progressData?.average_score || 0
      let gradeFromDB = progressData?.grade || 'N/A'
      const totalSubjectsFromDB = progressData?.total_subjects || totalSubjects

      // ❌ REMOVED hardcoded test data for Laila Yusuf
      // No more if (profile.id === '...') block

      if (progressData) {
        setTermProgress(progressData as TermProgressData)
      }

      // Load exams - filter out invalid subjects
      let allExams: Exam[] = []
      try {
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('status', 'published')
          .not('subject', 'is', null)
          .neq('subject', '')
          .order('created_at', { ascending: false })

        allExams = (examsData || []).filter((exam: any) => {
          if (!exam || !exam.id) return false
          if (!exam.subject || exam.subject === 'null' || exam.subject === '') return false
          
          if (!exam.class || exam.class === 'all') return true
          const normalizedExamClass = exam.class.replace(/\s+/g, '').toUpperCase()
          const normalizedStudentClass = studentClass.replace(/\s+/g, '').toUpperCase()
          return normalizedExamClass === normalizedStudentClass
        })
      } catch (error) {
        console.warn('Exams table not available:', error)
      }

      // Load attempts - skip deleted exams
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
            if (!exam) continue  // Skip deleted exams
            
            attempts.push({
              id: att.id,
              exam_id: att.exam_id,
              exam_title: exam?.title || 'Untitled Exam',
              exam_subject: getValidSubject(exam?.subject),
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
        if (!exam || !exam.id) return false
        if (!exam.subject || exam.subject === 'null' || exam.subject === '') return false
        if (takenExamIds.has(exam.id)) return false
        if (!exam.starts_at && !exam.ends_at) return true
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      })

      // Load assignments
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
              subject: getValidSubject(a.subject),
              description: a.description || '',
              due_date: a.due_date || a.created_at,
              total_marks: a.total_marks || 0,
              file_url: a.file_url || null,
              created_at: a.created_at,
              teacher_name: a.teacher_name || null,
              class: a.class || null
            }))
        }
      } catch (error) {
        console.warn('Assignments table not available:', error)
      }

      // Load notes
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
              subject: getValidSubject(n.subject),
              description: n.description || '',
              file_url: n.file_url || null,
              created_at: n.created_at,
              teacher_name: n.teacher_name || null,
              class: n.class || null
            }))
        }
      } catch (error) {
        console.warn('Notes table not available:', error)
      }

      // Load classmates
      let mappedClassmates: Classmate[] = []
      try {
        const { data: classmatesData } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, email, photo_url, vin_id')
          .eq('class', studentClass)
          .neq('id', profile.id)
          .order('full_name', { ascending: true })

        mappedClassmates = (classmatesData || []).map((c: any) => ({
          id: c.id,
          first_name: c.first_name,
          middle_name: c.middle_name,
          last_name: c.last_name,
          full_name: c.full_name || formatFullName(c.first_name, c.last_name, c.middle_name, 'Student'),
          display_name: c.display_name || formatDisplayName(c.first_name, c.last_name, c.middle_name),
          email: c.email,
          photo_url: c.photo_url,
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