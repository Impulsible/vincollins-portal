// src/app/student/exams/hooks/useExamsData.ts - COMPLETE FIXED VERSION
"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Exam, StudentProfile, ExamAttempt, TermOption, TermSession, StatsState } from "../types"
import { getSubjectCountForClass, calculateGrade, getTermLabel } from "../utils"
import { TERM_NAMES } from "../constants"

type LocalStatsState = StatsState & { pendingTheoryCount: number }

// ✅ FIXED: Extract year from class name - PREVENTS JSS1 from matching SS1
const extractYear = (className: string): string => {
  if (!className) return ''
  
  // Remove spaces and convert to uppercase
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  // JSS Classes - check these FIRST (before SS)
  if (normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS3') return 'JSS3'
  
  // SS Classes - exact match
  if (normalized === 'SS1') return 'SS1'
  if (normalized === 'SS2') return 'SS2'
  if (normalized === 'SS3') return 'SS3'
  
  // Handle subject-specific SS classes (SS1SCIENCE -> SS1)
  if (normalized.startsWith('SS1') && !normalized.startsWith('JSS')) return 'SS1'
  if (normalized.startsWith('SS2') && !normalized.startsWith('JSS')) return 'SS2'
  if (normalized.startsWith('SS3') && !normalized.startsWith('JSS')) return 'SS3'
  
  return className
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
    currentGrade: "N/A", gradeColor: "text-gray-400",
    totalSubjects: 17, termName: "Third Term", sessionYear: "2025/2026",
    pendingTheoryCount: 0
  })
  
  const hasLoaded = useRef(false)

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
            const defaultTerm = terms[0]
            setSelectedTermSession({ 
              term: defaultTerm.term, 
              session_year: defaultTerm.session_year 
            })
          }
        } catch (e) { 
          console.error("Error loading terms:", e) 
        }
      }

      const targetTerm = term || selectedTermSession?.term || "third"
      const targetSession = session || selectedTermSession?.session_year || "2025/2026"

      // Fetch exams
      const { data: examsData } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "published")
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
        .order("created_at", { ascending: false })

      // Extract year from student's class
      const studentYear = extractYear(sp.class)
      const isJSS = studentYear?.startsWith('JSS') || false
      const isSS = studentYear?.startsWith('SS') || false
      
      // ✅ Filter exams by YEAR using exact matching (prevents JSS1 matching SS1)
      const filteredExams = (examsData || []).filter((exam: any) => {
        // If no class assigned to exam, skip
        if (!exam.class) return false
        
        // Extract year from exam class
        const examYear = extractYear(exam.class)
        
        // For JSS students, only match exact JSS level
        if (isJSS) {
          // JSS1 only matches exams with JSS1, not SS1
          const examIsJSS = examYear?.startsWith('JSS') || false
          if (!examIsJSS) return false
          return studentYear === examYear
        }
        
        // For SS students, match by year (SS1 matches SS1 across departments)
        if (isSS) {
          const examIsSS = examYear?.startsWith('SS') || false
          if (!examIsSS) return false
          return studentYear === examYear
        }
        
        // Fallback: exact match
        return studentYear === examYear
      })
      
      console.log(`📚 Student: ${sp.class} (year: ${studentYear}, type: ${isJSS ? 'JSS' : isSS ? 'SS' : 'Other'})`)
      console.log(`📚 Found ${filteredExams.length} exams after filtering`)
      
      setExams(filteredExams)

      // Fetch exam attempts for this student
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
          objective_score: a.objective_score, 
          theory_feedback: a.theory_feedback,
        }
      })

      // Load CA scores and enrich attempts
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
          ca_total_score: ca?.total_score || undefined,
          ca_percentage: ca?.total_score || undefined
        }
      })
      setExamAttempts(enrichedAm)

      // Get term progress
      const { data: termProgressData } = await supabase
        .from("student_term_progress")
        .select("total_subjects, completed_exams, average_score, grade")
        .eq("student_id", sp.id)
        .eq("term", targetTerm)
        .eq("session_year", targetSession)
        .maybeSingle()

      const completedAttempts = Object.values(enrichedAm).filter(a => ['completed', 'graded'].includes(a.status))
      const pendingTheoryAttempts = Object.values(enrichedAm).filter(a => a.status === 'pending_theory')

      // Calculate average using CA scores when available
      const avgScore = completedAttempts.length > 0 
        ? Math.round(completedAttempts.reduce((s, a) => {
            if (a.ca_total_score) return s + Number(a.ca_total_score)
            let totalScore = a.total_score || 0
            if (a.theory_feedback) {
              try {
                const feedback = typeof a.theory_feedback === 'string' ? JSON.parse(a.theory_feedback) : a.theory_feedback
                if (feedback?.total?.score !== undefined) totalScore = (a.objective_score || 0) + Number(feedback.total.score)
              } catch {}
            }
            const marks = a.total_marks || 60
            return s + (marks > 0 ? (totalScore / marks) * 100 : (a.percentage || 0))
          }, 0) / completedAttempts.length) : 0

      const gi = calculateGrade(avgScore)
      const actualCompleted = termProgressData?.completed_exams || completedAttempts.length
      const actualTotalSubjects = termProgressData?.total_subjects || totalSubjects
      const actualAverageScore = termProgressData?.average_score || avgScore
      const actualGrade = termProgressData?.grade || (completedAttempts.length > 0 ? gi.grade : "N/A")

      // Count available exams (not completed)
      const availableCount = filteredExams.filter((e: Exam) => {
        const a = enrichedAm[e.id]
        if (!a) return true
        return !['completed', 'graded'].includes(a.status)
      }).length

      const upcomingCount = filteredExams.filter((e: Exam) => 
        e.starts_at && new Date(e.starts_at) > new Date()
      ).length

      setStats({
        available: availableCount,
        completed: actualCompleted,
        upcoming: upcomingCount,
        averageScore: actualAverageScore,
        currentGrade: actualGrade,
        gradeColor: completedAttempts.length > 0 ? gi.color : "text-gray-400",
        totalSubjects: actualTotalSubjects,
        termName: TERM_NAMES[targetTerm] || targetTerm,
        sessionYear: targetSession,
        pendingTheoryCount: pendingTheoryAttempts.length,
      })
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