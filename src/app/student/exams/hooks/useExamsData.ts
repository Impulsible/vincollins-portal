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

// Extract year from class name
const extractYear = (className: string): string => {
  if (!className) return ''
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  if (normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS3') return 'JSS3'
  if (normalized === 'SS1') return 'SS1'
  if (normalized === 'SS2') return 'SS2'
  if (normalized === 'SS3') return 'SS3'
  
  if (normalized.startsWith('SS1') && !normalized.startsWith('JSS')) return 'SS1'
  if (normalized.startsWith('SS2') && !normalized.startsWith('JSS')) return 'SS2'
  if (normalized.startsWith('SS3') && !normalized.startsWith('JSS')) return 'SS3'
  
  return className
}

// ✅ FIXED: Grade calculation - matches database grade mapping
const calculateLetterGrade = (percentage: number): { grade: string; color: string } => {
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
  if (percentage >= 50) return { grade: 'P', color: 'text-purple-500' }
  return { grade: 'F', color: 'text-red-600' }
}

// ✅ FIXED: Calculate score including CA for ALL statuses
const calculateSubjectPercentage = (attempt: any, caScores: any): number => {
  // Objective score (max 20)
  const objectiveScore = attempt.objective_score || 0
  const objectiveMax = attempt.objective_total || 20
  
  // CA scores (max 40 total - CA1 + CA2)
  const ca1 = caScores?.ca1_score || 0
  const ca2 = caScores?.ca2_score || 0
  const caTotal = ca1 + ca2  // Max 40
  
  // Check if theory is graded
  let theoryScore = 0
  let hasTheoryGraded = false
  
  if (attempt.theory_feedback) {
    try {
      const feedback = typeof attempt.theory_feedback === 'string' 
        ? JSON.parse(attempt.theory_feedback) 
        : attempt.theory_feedback
      if (feedback?.total?.score !== undefined && feedback?.total?.score > 0) {
        theoryScore = Number(feedback.total.score)
        hasTheoryGraded = true
      }
    } catch {}
  }
  
  // Determine what's available and calculate accordingly
  const hasCA = caTotal > 0
  const hasTheory = hasTheoryGraded || theoryScore > 0
  
  let totalScore = objectiveScore
  let totalMarks = objectiveMax
  
  // Add CA if available
  if (hasCA) {
    totalScore += caTotal
    totalMarks += 40  // CA max
  }
  
  // Add Theory if available
  if (hasTheory) {
    totalScore += theoryScore
    totalMarks += 40  // Theory max
  }
  
  // Calculate percentage
  return totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        router.push("/portal")
        return 
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      
      if (!profileData) { 
        toast.error("Profile not found")
        setLoading(false)
        return 
      }
      
      if (profileData.role !== "student") { 
        router.push("/portal")
        return 
      }

      const totalSubjects = profileData.subject_count || getSubjectCountForClass(profileData.class || "")
      const sp: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.email?.split("@")[0] || "Student",
        email: profileData.email,
        class: profileData.class || "Not Assigned",
        department: profileData.department || "General",
        photo_url: profileData.photo_url,
        subject_count: totalSubjects
      }
      setProfile(sp)

      // Load available terms (only once)
      if (!hasLoaded.current) {
        hasLoaded.current = true
        try {
          const termsMap = new Map<string, TermOption>()
          const { data: progressData } = await supabase
            .from("student_term_progress")
            .select("term, session_year")
            .eq("student_id", sp.id)
          
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
          
          const { data: examTerms } = await supabase
            .from("exams")
            .select("term, session_year")
            .eq("status", "published")
            .or(`session_year.not.is.null,session_year.is.null`)
          
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
          
          const currentKey = `${currentTerm.term}|${currentTerm.session_year}`
          if (!termsMap.has(currentKey)) {
            termsMap.set(currentKey, {
              term: currentTerm.term,
              session_year: currentTerm.session_year,
              label: getTermLabel(currentTerm.term, currentTerm.session_year)
            })
          }
          
          const terms = Array.from(termsMap.values())
          terms.sort((a, b) => {
            if (a.session_year !== b.session_year) {
              return b.session_year.localeCompare(a.session_year)
            }
            const termOrder = { third: 3, second: 2, first: 1 }
            return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0)
          })
          
          setAvailableTerms(terms)
          
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

      const targetTerm = term || selectedTermSession?.term || currentTerm.term
      const targetSession = session || selectedTermSession?.session_year || currentTerm.session_year

      // Fetch exams
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "published")
        .eq("term", targetTerm)
        .or(`session_year.eq.${targetSession},session_year.is.null`)
        .order("created_at", { ascending: false })

      if (examsError) {
        console.error("Error fetching exams:", examsError)
      }

      // Filter exams by class year
      const studentYear = extractYear(sp.class)
      const isJSS = studentYear?.startsWith('JSS') || false
      const isSS = studentYear?.startsWith('SS') || false
      
      const filteredExams = (examsData || []).filter((exam: any) => {
        if (!exam.class) return false
        const examYear = extractYear(exam.class)
        
        if (isJSS) {
          const examIsJSS = examYear?.startsWith('JSS') || false
          if (!examIsJSS) return false
          return studentYear === examYear
        }
        
        if (isSS) {
          const examIsSS = examYear?.startsWith('SS') || false
          if (!examIsSS) return false
          return studentYear === examYear
        }
        
        return studentYear === examYear
      })
      
      setExams(filteredExams)

      // Fetch exam attempts
      const { data: attemptsData } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
      
      const am: Record<string, ExamAttempt> = {}
      attemptsData?.forEach((a: any) => {
        am[a.exam_id] = { 
          id: a.id, 
          exam_id: a.exam_id, 
          status: a.status, 
          percentage: a.percentage, 
          total_score: a.total_score, 
          total_marks: a.total_marks,
          objective_score: a.objective_score || 0,
          theory_feedback: a.theory_feedback,
          term: a.term,
          session_year: a.session_year,
        }
      })

      // Load CA scores
      const { data: caScoresData } = await supabase
        .from("ca_scores")
        .select("*")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("academic_year", targetSession)
      
      const caMap: Record<string, any> = {}
      caScoresData?.forEach((ca: any) => { 
        if (ca.exam_id) caMap[ca.exam_id] = ca 
      })

      // Enrich attempts with CA data
      const enrichedAm: Record<string, ExamAttempt> = {}
      Object.entries(am).forEach(([examId, attempt]) => {
        const ca = caMap[examId]
        enrichedAm[examId] = {
          ...attempt,
          objective_total: 20,
          ca1_score: ca?.ca1_score || null,
          ca2_score: ca?.ca2_score || null,
          ca_total_score: ca?.total_score || undefined,
          ca_percentage: ca?.total_score || undefined
        }
      })
      setExamAttempts(enrichedAm)

      // Get term progress from database
      const { data: termProgressData } = await supabase
        .from("student_term_progress")
        .select("total_subjects, completed_exams, average_score, grade")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
        .maybeSingle()

      // ALL attempts that count toward completion (including pending_theory)
      const allCompletedAttempts = Object.values(enrichedAm).filter(a => 
        ['completed', 'graded', 'pending_theory'].includes(a.status)
      )
      const pendingTheoryAttempts = Object.values(enrichedAm).filter(a => a.status === 'pending_theory')

      // ✅ Calculate average score from completed exams
      let avgScore = 0
      if (allCompletedAttempts.length > 0) {
        let totalPercentage = 0
        let validAttempts = 0
        
        allCompletedAttempts.forEach((attempt) => {
          const ca = {
            ca1_score: attempt.ca1_score || 0,
            ca2_score: attempt.ca2_score || 0
          }
          const percentage = calculateSubjectPercentage(attempt, ca)
          if (percentage > 0) {
            totalPercentage += percentage
            validAttempts++
          }
        })
        
        if (validAttempts > 0) {
          avgScore = Math.round(totalPercentage / validAttempts)
        }
      }

      // ✅ Calculate grade based on avgScore
      const gradeInfo = avgScore > 0 
        ? calculateLetterGrade(avgScore)
        : { grade: 'F', color: 'text-red-600' }

      // ✅ Debug log
      console.log('📊 Grade Calculation:', {
        avgScore,
        gradeInfo,
        completedExams: allCompletedAttempts.length
      })

      // Completed count includes pending_theory
      const actualCompleted = termProgressData?.completed_exams || allCompletedAttempts.length
      const actualTotalSubjects = termProgressData?.total_subjects || totalSubjects
      const displayAverageScore = termProgressData?.average_score || avgScore

      // Available exams
      const availableCount = filteredExams.filter((e: Exam) => {
        const a = enrichedAm[e.id]
        if (!a) return true
        return a.status === 'in_progress'
      }).length

      const upcomingCount = filteredExams.filter((e: Exam) => 
        e.starts_at && new Date(e.starts_at) > new Date()
      ).length

      // ✅ Set stats with correct grade
      const newStats: LocalStatsState = {
        available: availableCount,
        completed: actualCompleted,
        upcoming: upcomingCount,
        averageScore: displayAverageScore,
        currentGrade: gradeInfo.grade,  // ✅ This will be 'A' for 80%
        gradeColor: gradeInfo.color,
        totalSubjects: actualTotalSubjects,
        termName: TERM_NAMES[targetTerm] || targetTerm,
        sessionYear: targetSession,
        pendingTheoryCount: pendingTheoryAttempts.length,
      }

      console.log('📊 Final Stats:', newStats)
      setStats(newStats)

    } catch (e) { 
      console.error("Error loading exams data:", e)
      toast.error("Failed to load exams")
    } finally { 
      setLoading(false) 
    }
  }, [router, selectedTermSession])

  useEffect(() => { 
    loadData() 
  }, [loadData])

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