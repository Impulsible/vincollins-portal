// src/app/student/exams/hooks/useExamsData.ts - COMPLETE FIXED VERSION

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Exam, StudentProfile, ExamAttempt, TermOption, TermSession, StatsState } from "../types"
import { getSubjectCountForClass, getTermLabel } from "../utils"
import { TERM_NAMES } from "../constants"

type LocalStatsState = StatsState & { pendingTheoryCount: number }

// ✅ Extract year from class name
const extractYear = (className: string): string => {
  if (!className) return ''
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  // Exact matches
  if (['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].includes(normalized)) {
    return normalized
  }
  
  // Partial matches (e.g., "SS1 Science", "JSS 2 Arts")
  if (normalized.includes('JSS1')) return 'JSS1'
  if (normalized.includes('JSS2')) return 'JSS2'
  if (normalized.includes('JSS3')) return 'JSS3'
  if (normalized.includes('SS1')) return 'SS1'
  if (normalized.includes('SS2')) return 'SS2'
  if (normalized.includes('SS3')) return 'SS3'
  
  // Check if it starts with SS or JSS
  if (normalized.startsWith('SS1') && !normalized.startsWith('JSS')) return 'SS1'
  if (normalized.startsWith('SS2') && !normalized.startsWith('JSS')) return 'SS2'
  if (normalized.startsWith('SS3') && !normalized.startsWith('JSS')) return 'SS3'
  
  return className
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

export function useExamsData(router: ReturnType<typeof useRouter>) {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({})
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([])
  const [selectedTermSession, setSelectedTermSession] = useState<TermSession | null>(null)
  const [stats, setStats] = useState<LocalStatsState>({
    available: 0, completed: 0, upcoming: 0, averageScore: 0,
    currentGrade: "F", gradeColor: "text-red-600",
    totalSubjects: 17, termName: "Third Term", sessionYear: "2025/2026",
    pendingTheoryCount: 0
  })
  
  const hasLoaded = useRef(false)
  const currentTerm = { term: "third", session_year: "2025/2026" }

  const loadData = useCallback(async (term?: string, session?: string) => {
    setLoading(true)
    try {
      // ✅ Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { 
        router.push("/portal")
        setLoading(false)
        return 
      }

      // ✅ Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      
      if (profileError || !profileData) { 
        toast.error("Profile not found")
        setLoading(false)
        return 
      }
      
      if (profileData.role !== "student") { 
        router.push("/portal")
        setLoading(false)
        return 
      }

      // ✅ Set profile
      const totalSubjects = profileData.subject_count || getSubjectCountForClass(profileData.class || "")
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
      setProfile(sp)

      // ✅ Load available terms (only once)
      if (!hasLoaded.current) {
        hasLoaded.current = true
        try {
          const termsMap = new Map<string, TermOption>()
          
          // Get terms from student_term_progress
          const { data: progressData, error: progressError } = await supabase
            .from("student_term_progress")
            .select("term, session_year")
            .eq("student_id", sp.id)
          
          if (progressError) {
            console.warn("Error loading progress terms:", progressError)
          }
          
          if (progressData) {
            progressData.forEach((p: any) => {
              if (p.term && p.session_year) {
                const key = `${p.term}|${p.session_year}`
                if (!termsMap.has(key)) {
                  termsMap.set(key, { 
                    term: p.term, 
                    session_year: p.session_year, 
                    label: getTermLabel(p.term, p.session_year) 
                  })
                }
              }
            })
          }
          
          // Get terms from exams
          const { data: examTerms, error: examTermsError } = await supabase
            .from("exams")
            .select("term, session_year")
            .eq("status", "published")
            .not("term", "is", null)
            .not("session_year", "is", null)
          
          if (examTermsError) {
            console.warn("Error loading exam terms:", examTermsError)
          }
          
          if (examTerms) {
            examTerms.forEach((t: any) => {
              if (t.term && t.session_year) {
                const key = `${t.term}|${t.session_year}`
                if (!termsMap.has(key)) {
                  termsMap.set(key, { 
                    term: t.term, 
                    session_year: t.session_year, 
                    label: getTermLabel(t.term, t.session_year) 
                  })
                }
              }
            })
          }
          
          // Ensure current term is included
          const currentKey = `${currentTerm.term}|${currentTerm.session_year}`
          if (!termsMap.has(currentKey)) {
            termsMap.set(currentKey, {
              term: currentTerm.term,
              session_year: currentTerm.session_year,
              label: getTermLabel(currentTerm.term, currentTerm.session_year)
            })
          }
          
          // Sort terms
          const terms = Array.from(termsMap.values())
          terms.sort((a, b) => {
            if (a.session_year !== b.session_year) {
              return b.session_year.localeCompare(a.session_year)
            }
            const termOrder = { third: 3, second: 2, first: 1 }
            return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0)
          })
          
          setAvailableTerms(terms)
          
          // ✅ Set default selected term
          if (terms.length > 0 && !selectedTermSession) {
            const currentTermObj = terms.find(t => t.term === currentTerm.term && t.session_year === currentTerm.session_year)
            if (currentTermObj) {
              setSelectedTermSession({ term: currentTermObj.term, session_year: currentTermObj.session_year })
            } else {
              const defaultTerm = terms[0]
              setSelectedTermSession({ term: defaultTerm.term, session_year: defaultTerm.session_year })
            }
          }
        } catch (e) { 
          console.error("Error loading terms:", e) 
        }
      }

      // ✅ Get target term/session
      const targetTerm = term || selectedTermSession?.term || currentTerm.term
      const targetSession = session || selectedTermSession?.session_year || currentTerm.session_year

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

      // ✅ Filter exams by class year
      const studentYear = extractYear(sp.class)
      const filteredExams = (examsData || []).filter((exam: any) => {
        if (!exam.class) return false
        const examYear = extractYear(exam.class)
        return studentYear === examYear
      })
      
      setExams(filteredExams)

      // ✅ Fetch exam attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
      
      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError)
      }
      
      const am: Record<string, ExamAttempt> = {}
      attemptsData?.forEach((a: any) => {
        am[a.exam_id] = { 
          id: a.id, 
          exam_id: a.exam_id, 
          status: a.status, 
          percentage: a.percentage || 0, 
          total_score: a.total_score || 0, 
          total_marks: a.total_marks || 0,
          objective_score: a.objective_score || 0,
          theory_score: a.theory_score || 0,
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
        }
      })

      // ✅ Fetch CA scores
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

      // ✅ Enrich attempts with CA data
      const enrichedAm: Record<string, ExamAttempt> = {}
      Object.entries(am).forEach(([examId, attempt]) => {
        const ca = caMap[examId]
        const ca1 = ca?.ca1_score || 0
        const ca2 = ca?.ca2_score || 0
        const caTotal = calculateCATotal(ca1, ca2)
        
        enrichedAm[examId] = {
          ...attempt,
          ca1_score: ca1,
          ca2_score: ca2,
          ca_total_score: caTotal,
        }
      })
      setExamAttempts(enrichedAm)

      // ✅ Get term progress from database
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

      // ✅ Calculate pending theory count
      const pendingTheoryAttempts = Object.values(enrichedAm).filter(a => a.status === 'pending_theory')
      const pendingTheoryCount = pendingTheoryAttempts.length

      // ✅ Use database values or fallback to calculated values
      const dbGrade = termProgressData?.grade || 'F'
      const dbAverageScore = termProgressData?.average_score ?? 0
      const dbCompleted = termProgressData?.completed_exams ?? 0
      const dbTotalSubjects = termProgressData?.total_subjects ?? totalSubjects

      // ✅ Calculate available and upcoming counts
      const availableCount = filteredExams.filter((e: Exam) => {
        const a = enrichedAm[e.id]
        if (!a) return true
        return a.status === 'in_progress'
      }).length

      const upcomingCount = filteredExams.filter((e: Exam) => 
        e.starts_at && new Date(e.starts_at) > new Date()
      ).length

      // ✅ Set stats with database values
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
      }

      console.log('📊 Stats from DB:', newStats)
      setStats(newStats)

    } catch (e) { 
      console.error("Error loading exams data:", e)
      toast.error("Failed to load exams")
    } finally { 
      setLoading(false) 
    }
  }, [router, selectedTermSession])

  // ✅ Load data on mount
  useEffect(() => { 
    loadData() 
  }, [loadData])

  // ✅ Handle term/session change
  const handleTermSessionChange = async (value: string) => {
    const [term, session] = value.split("|")
    setSelectedTermSession({ term, session_year: session })
    await loadData(term, session)
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