// src/app/student/exams/hooks/useExamsData.ts - COMPLETE FIXED VERSION

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { 
  Exam, 
  StudentProfile, 
  ExamAttempt, 
  TermOption, 
  TermSession, 
  StatsState,
  SubjectStat 
} from "../types"
import { getSubjectCountForClass, getTermLabel } from "../utils"
import { TERM_NAMES } from "../constants"

type LocalStatsState = StatsState & { pendingTheoryCount: number }

// ✅ Extract year from class name
const extractYear = (className: string): string => {
  if (!className) return ''
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  if (['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].includes(normalized)) {
    return normalized
  }
  
  if (normalized.includes('JSS1')) return 'JSS1'
  if (normalized.includes('JSS2')) return 'JSS2'
  if (normalized.includes('JSS3')) return 'JSS3'
  if (normalized.includes('SS1')) return 'SS1'
  if (normalized.includes('SS2')) return 'SS2'
  if (normalized.includes('SS3')) return 'SS3'
  
  return className
}

// ✅ Get subject count based on class level (JSS = 17, SS = 10)
const getSubjectCountByClassLevel = (className: string): number => {
  if (!className) return 0
  
  const normalizedClass = className.trim().toUpperCase().replace(/\s/g, '')
  
  // JSS classes - 17 subjects
  if (normalizedClass.includes('JSS1') || 
      normalizedClass.includes('JSS2') || 
      normalizedClass.includes('JSS3')) {
    return 17
  }
  
  // SS classes - 10 subjects
  if (normalizedClass.includes('SS1') || 
      normalizedClass.includes('SS2') || 
      normalizedClass.includes('SS3')) {
    return 10
  }
  
  return 0
}

// ✅ Grade color mapping
const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-600'
    case 'B': return 'text-blue-600'
    case 'C': return 'text-amber-600'
    case 'P': return 'text-purple-500'
    case 'F': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// ✅ Calculate CA total from CA scores
const calculateCATotal = (ca1: number, ca2: number): number => {
  return (ca1 || 0) + (ca2 || 0)
}

// ✅ Get current term from database
async function fetchCurrentTermFromDB(): Promise<{ term: string; session: string } | null> {
  try {
    const { data: termData, error: termError } = await supabase
      .from('terms')
      .select('term_code, session_year')
      .eq('is_current', true)
      .single()

    if (!termError && termData) {
      return {
        term: termData.term_code,
        session: termData.session_year
      }
    }

    const { data: settings, error: settingsError } = await supabase
      .from('school_settings')
      .select('current_term, current_session')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!settingsError && settings) {
      if (settings.current_term && settings.current_session) {
        return {
          term: settings.current_term,
          session: settings.current_session
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching current term:', error)
    return null
  }
}

export function useExamsData(router: ReturnType<typeof useRouter>) {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({})
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([])
  const [selectedTermSession, setSelectedTermSession] = useState<TermSession | null>(null)
  const [stats, setStats] = useState<LocalStatsState>({
    available: 0, 
    completed: 0, 
    upcoming: 0, 
    averageScore: 0,
    currentGrade: "N/A", 
    gradeColor: "text-gray-400",
    totalSubjects: 0, 
    termName: "", 
    sessionYear: "",
    pendingTheoryCount: 0,
    subjectStats: []
  })
  
  const hasLoaded = useRef(false)
  const isFetching = useRef(false)
  const [currentTerm, setCurrentTerm] = useState({ term: "", session: "" })

  // ✅ Load current term from database
  useEffect(() => {
    const loadCurrentTerm = async () => {
      const termData = await fetchCurrentTermFromDB()
      if (termData) {
        setCurrentTerm(termData)
        console.log('📊 Current term from DB:', termData)
      }
    }
    loadCurrentTerm()
  }, [])

  // ✅ Build subject stats
  const buildSubjectStats = useCallback((examsData: Exam[], attemptsMap: Record<string, ExamAttempt>): SubjectStat[] => {
    const subjectMap = new Map<string, { scores: number[], status: 'completed' | 'pending' | 'not_started' }>()
    
    examsData.forEach(exam => {
      const subject = exam.subject
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { scores: [], status: 'not_started' })
      }
      
      const attempt = attemptsMap[exam.id]
      if (attempt) {
        const score = attempt.percentage || 0
        const subjectData = subjectMap.get(subject)!
        subjectData.scores.push(score)
        subjectData.status = 'completed'
      }
    })
    
    return Array.from(subjectMap.entries()).map(([subject, data]) => {
      const avgScore = data.scores.length > 0 
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) 
        : 0
      
      let grade = 'N/A'
      if (avgScore >= 75) grade = 'A'
      else if (avgScore >= 65) grade = 'B'
      else if (avgScore >= 50) grade = 'C'
      else if (avgScore >= 40) grade = 'P'
      else if (avgScore > 0) grade = 'F'
      
      return {
        subject,
        score: avgScore,
        grade,
        status: data.status
      }
    })
  }, [])

  const loadData = useCallback(async (term?: string, session?: string) => {
    // ✅ Prevent multiple simultaneous fetches
    if (isFetching.current) {
      console.log('⏳ Already fetching, skipping...')
      return
    }

    const targetTerm = term || selectedTermSession?.term || currentTerm.term
    const targetSession = session || selectedTermSession?.session_year || currentTerm.session

    if (!targetTerm || !targetSession) {
      console.log('⏳ Waiting for term to load...')
      return
    }

    isFetching.current = true
    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { 
        router.push("/portal")
        setLoading(false)
        isFetching.current = false
        return 
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      
      if (profileError || !profileData) { 
        toast.error("Profile not found")
        setLoading(false)
        isFetching.current = false
        return 
      }
      
      if (profileData.role !== "student") { 
        router.push("/portal")
        setLoading(false)
        isFetching.current = false
        return 
      }

      // ✅ Get subject count - use class-level fallback if subject_count is 0
      const profileSubjectCount = profileData.subject_count || 0
      const classLevelCount = getSubjectCountByClassLevel(profileData.class || "")
      const totalSubjects = profileSubjectCount || classLevelCount || 0

      const sp: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.email?.split("@")[0] || "Student",
        email: user.email || profileData.email || "",
        class: profileData.class || "Not Assigned",
        department: profileData.department || "General",
        photo_url: profileData.photo_url,
        subject_count: totalSubjects,
        display_name: profileData.display_name || profileData.full_name,
      }
      
      if (!profile || profile.id !== sp.id) {
        setProfile(sp)
      }

      const isCurrentTerm = targetTerm === currentTerm.term && targetSession === currentTerm.session
      console.log('🎯 Target term:', { targetTerm, targetSession, isCurrentTerm })

      // ✅ Load available terms (only once)
      if (!hasLoaded.current && sp.id) {
        hasLoaded.current = true
        try {
          const termsMap = new Map<string, TermOption>()
          
          const { data: progressData, error: progressError } = await supabase
            .from("student_term_progress")
            .select("term, session_year")
            .eq("student_id", sp.id)
          
          if (!progressError && progressData) {
            progressData.forEach((p: any) => {
              if (p.term && p.session_year) {
                const key = `${p.term}|${p.session_year}`
                if (!termsMap.has(key)) {
                  const isCurrent = p.term === currentTerm.term && p.session_year === currentTerm.session
                  termsMap.set(key, { 
                    term: p.term, 
                    session_year: p.session_year, 
                    label: getTermLabel(p.term, p.session_year),
                    is_current: isCurrent
                  })
                }
              }
            })
          }
          
          const { data: examTerms, error: examTermsError } = await supabase
            .from("exams")
            .select("term, session_year, class")
            .eq("status", "published")
            .not("term", "is", null)
            .not("session_year", "is", null)
          
          if (!examTermsError && examTerms) {
            const studentYear = extractYear(sp.class)
            examTerms.forEach((t: any) => {
              if (t.term && t.session_year) {
                const examYear = extractYear(t.class)
                if (examYear === studentYear) {
                  const key = `${t.term}|${t.session_year}`
                  if (!termsMap.has(key)) {
                    const isCurrent = t.term === currentTerm.term && t.session_year === currentTerm.session
                    termsMap.set(key, { 
                      term: t.term, 
                      session_year: t.session_year, 
                      label: getTermLabel(t.term, t.session_year),
                      is_current: isCurrent
                    })
                  }
                }
              }
            })
          }
          
          if (currentTerm.term && currentTerm.session) {
            const currentKey = `${currentTerm.term}|${currentTerm.session}`
            if (!termsMap.has(currentKey)) {
              termsMap.set(currentKey, {
                term: currentTerm.term,
                session_year: currentTerm.session,
                label: getTermLabel(currentTerm.term, currentTerm.session),
                is_current: true
              })
            }
          }
          
          const terms = Array.from(termsMap.values())
          terms.sort((a, b) => {
            if (a.is_current) return -1
            if (b.is_current) return 1
            if (a.session_year !== b.session_year) {
              return b.session_year.localeCompare(a.session_year)
            }
            const termOrder = { third: 3, second: 2, first: 1 }
            return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0)
          })
          
          setAvailableTerms(terms)
          
          if (terms.length > 0 && !selectedTermSession) {
            const currentTermObj = terms.find(t => t.is_current)
            if (currentTermObj) {
              setSelectedTermSession({ 
                term: currentTermObj.term, 
                session_year: currentTermObj.session_year 
              })
            } else {
              const defaultTerm = terms[0]
              setSelectedTermSession({ 
                term: defaultTerm.term, 
                session_year: defaultTerm.session_year 
              })
            }
          }
        } catch (e) { 
          console.error("Error loading terms:", e) 
        }
      }

      // ✅ Fetch attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("student_id", sp.id)
      
      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError)
      }

      // ✅ Fetch exams
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "published")
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
        .order("created_at", { ascending: false })

      if (examsError) {
        console.error("Error fetching exams:", examsError)
        toast.error("Failed to load exams")
      }

      // ✅ Filter exams - SINGLE PASS with deduplication
      const studentYear = extractYear(sp.class)
      const seenIds = new Set<string>()
      
      const filteredExams = (examsData || []).filter((exam: any) => {
        if (!exam.class) return false
        
        // ✅ Skip duplicates
        if (seenIds.has(exam.id)) {
          return false
        }
        seenIds.add(exam.id)
        
        const examYear = extractYear(exam.class)
        
        if (isCurrentTerm) {
          return studentYear === examYear
        }
        
        // ✅ For past terms: show exams the student has attempted
        const hasAttempt = attemptsData?.some((a: any) => a.exam_id === exam.id) || false
        return hasAttempt
      })

      console.log('📚 Filtered exams:', {
        studentYear,
        isCurrentTerm,
        totalExams: examsData?.length || 0,
        filteredCount: filteredExams.length,
        uniqueCount: seenIds.size
      })
      
      // ✅ Replace exams, don't append
      setExams(filteredExams)

      // ✅ Build CA scores map first
      const { data: caScoresData, error: caError } = await supabase
        .from("ca_scores")
        .select("*")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("academic_year", targetSession)

      if (caError) {
        console.warn("Error fetching CA scores:", caError)
      }

      const caMap: Record<string, any> = {}
      caScoresData?.forEach((ca: any) => { 
        if (ca.exam_id) caMap[ca.exam_id] = ca 
      })

      // ✅ Process attempts with proper percentage calculation (matching results page)
      const am: Record<string, ExamAttempt> = {}
      const attemptsForTerm = attemptsData?.filter((a: any) => 
        a.term === targetTerm && a.session_year === targetSession
      ) || []

      attemptsForTerm.forEach((a: any) => {
        const ca = caMap[a.exam_id]
        const hasCA = ca && (ca.ca1_score || ca.ca2_score)
        
        // ✅ Get scores
        const objectiveMax = a.objective_total || 30
        const objectiveScore = Number(a.objective_score) || 0
        const theoryScore = Number(a.theory_score) || 0
        const ca1 = ca?.ca1_score || 0
        const ca2 = ca?.ca2_score || 0
        const caTotal = ca1 + ca2

        // ✅ Calculate percentage using the SAME logic as results page
        let percentage: number
        let totalScore: number

        if (hasCA) {
          // With CA: CA1 + CA2 + Objective + Theory (max 100)
          totalScore = caTotal + objectiveScore + theoryScore
          percentage = Math.round((totalScore / 100) * 100)
        } else if (theoryScore > 0) {
          // Without CA but with Theory: Objective + Theory (max 60)
          const examTotal = objectiveScore + theoryScore
          totalScore = Math.round((examTotal / 60) * 100)
          percentage = totalScore
        } else if (objectiveScore > 0 && objectiveMax > 0) {
          // Objective only
          totalScore = Math.round((objectiveScore / objectiveMax) * 100)
          percentage = totalScore
        } else {
          totalScore = 0
          percentage = 0
        }

        // ✅ Clamp percentage
        percentage = Math.min(Math.max(Number(percentage) || 0, 0), 100)

        // ✅ Store the correct values
        const attemptObj: any = { 
          id: a.id, 
          exam_id: a.exam_id, 
          status: a.status, 
          percentage: percentage,
          total_score: totalScore,
          total_marks: 100,
          objective_score: objectiveScore,
          objective_total: objectiveMax,
          theory_score: theoryScore,
          theory_total: a.theory_total || 30,
          theory_feedback: a.theory_feedback || null,
          term: a.term || targetTerm,
          session_year: a.session_year || targetSession,
          attempted_at: a.created_at || new Date().toISOString(),
          started_at: a.started_at || a.created_at,
          submitted_at: a.submitted_at || null,
          completed_at: a.completed_at || null,
          attempt_number: a.attempt_number || 1,
          is_auto_submitted: a.is_auto_submitted || false,
          auto_submit_reason: a.auto_submit_reason || null,
          // ✅ Store CA info
          ca1_score: ca1,
          ca2_score: ca2,
          ca_total_score: caTotal,
          ca_percentage: hasCA ? Math.round(((ca1 + ca2) / 40) * 100) : 0,
        }
        // attach non-typed helper flag without violating ExamAttempt type
        attemptObj.hasCA = hasCA
        am[a.exam_id] = attemptObj as ExamAttempt
      })
      
      setExamAttempts(am)

      // ✅ Get term progress
      const { data: termProgressData, error: progressFetchError } = await supabase
        .from("student_term_progress")
        .select("total_subjects, completed_exams, average_score, grade, pending_theory_count")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
        .maybeSingle()

      if (progressFetchError) {
        console.warn("Error fetching term progress:", progressFetchError)
      }

      // ✅ Calculate stats
      const pendingTheoryAttempts = Object.values(am).filter(a => a.status === 'pending_theory')
      const pendingTheoryCount = pendingTheoryAttempts.length

      const dbGrade = termProgressData?.grade || 'N/A'
      const dbAverageScore = termProgressData?.average_score ?? 0
      const dbCompleted = termProgressData?.completed_exams ?? 0
      
      // ✅ Use totalSubjects from profile (which includes class-level fallback)
      const dbTotalSubjects = termProgressData?.total_subjects ?? totalSubjects

      const subjectStats = buildSubjectStats(filteredExams, am)

      const availableCount = filteredExams.filter((e: Exam) => {
        const a = am[e.id]
        if (!a) return true
        return a.status === 'in_progress'
      }).length

      const upcomingCount = filteredExams.filter((e: Exam) => 
        e.starts_at && new Date(e.starts_at) > new Date()
      ).length

      const newStats: LocalStatsState = {
        available: availableCount,
        completed: dbCompleted,
        upcoming: upcomingCount,
        averageScore: dbAverageScore,
        currentGrade: dbGrade,
        gradeColor: getGradeColor(dbGrade),
        totalSubjects: dbTotalSubjects,
        termName: TERM_NAMES[targetTerm as keyof typeof TERM_NAMES] || targetTerm,
        sessionYear: targetSession,
        pendingTheoryCount: pendingTheoryCount,
        subjectStats: subjectStats,
      }

      console.log('📊 Stats from DB:', newStats)
      setStats(newStats)

    } catch (e) { 
      console.error("Error loading exams data:", e)
      toast.error("Failed to load exams")
    } finally { 
      setLoading(false)
      isFetching.current = false
    }
  }, [router, selectedTermSession, currentTerm, buildSubjectStats, profile])

  // ✅ Load data once when current term is available
  useEffect(() => {
    if (currentTerm.term && currentTerm.session && !isFetching.current) {
      loadData()
    }
  }, [currentTerm, loadData])

  // ✅ Handle term/session change
  const handleTermSessionChange = async (value: string) => {
    const [term, session_year] = value.split("|")
    if (term && session_year) {
      setSelectedTermSession({ term, session_year })
      await loadData(term, session_year)
    }
  }

  return { 
    loading, 
    exams, 
    profile, 
    examAttempts, 
    availableTerms, 
    selectedTermSession, 
    stats, 
    loadData, 
    handleTermSessionChange 
  }
}