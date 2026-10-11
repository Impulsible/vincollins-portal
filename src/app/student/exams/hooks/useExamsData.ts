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

// ✅ Flexible term matcher - handles 'third' vs 'Third Term' vs '3rd Term'
const isTermMatch = (term1?: string, term2?: string) => {
  if (!term1 || !term2) return false
  const t1 = term1.toLowerCase().trim()
  const t2 = term2.toLowerCase().trim()
  if (t1 === t2) return true
  if (t1.includes('third') || t1.includes('3rd') || t1 === '3') return t2.includes('third') || t2.includes('3rd') || t2 === '3'
  if (t1.includes('second') || t1.includes('2nd') || t1 === '2') return t2.includes('second') || t2.includes('2nd') || t2 === '2'
  if (t1.includes('first') || t1.includes('1st') || t1 === '1') return t2.includes('first') || t2.includes('1st') || t2 === '1'
  return false
}

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
  if (normalizedClass.includes('JSS1') || normalizedClass.includes('JSS2') || normalizedClass.includes('JSS3')) return 17
  if (normalizedClass.includes('SS1') || normalizedClass.includes('SS2') || normalizedClass.includes('SS3')) return 10
  return 0
}

// ✅ WAEC Grade Calculator
const getWAECGrade = (p: number): string => {
  const percentage = Number(p) || 0
  if (percentage >= 75) return 'A1'
  if (percentage >= 70) return 'B2'
  if (percentage >= 65) return 'B3'
  if (percentage >= 60) return 'C4'
  if (percentage >= 55) return 'C5'
  if (percentage >= 50) return 'C6'
  if (percentage >= 45) return 'D7'
  if (percentage >= 40) return 'E8'
  return 'F9'
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

// ✅ Get current term from database
async function fetchCurrentTermFromDB(): Promise<{ term: string; session: string } | null> {
  try {
    const { data: termData, error: termError } = await supabase
      .from('terms')
      .select('term_code, session_year')
      .eq('is_current', true)
      .maybeSingle()

    if (!termError && termData) {
      return { term: termData.term_code, session: termData.session_year }
    }

    const { data: settings, error: settingsError } = await supabase
      .from('school_settings')
      .select('current_term, current_session')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!settingsError && settings?.current_term && settings?.current_session) {
      return { term: settings.current_term, session: settings.current_session }
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

    // Normalized keyword for .ilike queries ("third" / "second" / "first")
    const termKeyword = targetTerm.toLowerCase().includes('third') ? 'third' : 
                        targetTerm.toLowerCase().includes('second') ? 'second' : 'first'

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

      const isCurrentTerm = isTermMatch(targetTerm, currentTerm.term) && targetSession === currentTerm.session
      console.log('🎯 Target term:', { targetTerm, targetSession, isCurrentTerm })

      // ✅ Load available terms (only once)
      if (!hasLoaded.current && sp.id) {
        hasLoaded.current = true
        try {
          const termsMap = new Map<string, TermOption>()
          
          const { data: progressData } = await supabase
            .from("student_term_progress")
            .select("term, session_year")
            .eq("student_id", sp.id)
          
          progressData?.forEach((p: any) => {
            if (p.term && p.session_year) {
              const key = `${p.term}|${p.session_year}`
              if (!termsMap.has(key)) {
                const isCurrent = isTermMatch(p.term, currentTerm.term) && p.session_year === currentTerm.session
                termsMap.set(key, { 
                  term: p.term, 
                  session_year: p.session_year, 
                  label: getTermLabel(p.term, p.session_year),
                  is_current: isCurrent
                })
              }
            }
          })
          
          const { data: examTerms } = await supabase
            .from("exams")
            .select("term, session_year, class")
            .eq("status", "published")
            .not("term", "is", null)
            .not("session_year", "is", null)
          
          const studentYear = extractYear(sp.class)
          examTerms?.forEach((t: any) => {
            if (t.term && t.session_year) {
              const examYear = extractYear(t.class)
              if (examYear === studentYear) {
                const key = `${t.term}|${t.session_year}`
                if (!termsMap.has(key)) {
                  const isCurrent = isTermMatch(t.term, currentTerm.term) && t.session_year === currentTerm.session
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
          
          // Also populate dropdown from report_cards (so previous terms show up)
          const { data: reportCardTerms } = await supabase
            .from("report_cards")
            .select("term, academic_year, session_year, class")
            .eq("student_id", sp.id)

          reportCardTerms?.forEach((rc: any) => {
            const session = rc.academic_year || rc.session_year
            if (rc.term && session) {
              const key = `${rc.term}|${session}`
              if (!termsMap.has(key)) {
                const isCurrent = isTermMatch(rc.term, currentTerm.term) && session === currentTerm.session
                termsMap.set(key, {
                  term: rc.term,
                  session_year: session,
                  label: getTermLabel(rc.term, session),
                  is_current: isCurrent
                })
              }
            }
          })
          
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

      // ✅ Fetch Online Exam Attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("student_id", sp.id)
      
      if (attemptsError) {
        console.error("Error fetching attempts:", attemptsError)
      }

      // ✅ Fetch Online Exams (flexible term matching via ilike)
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "published")
        .ilike("term", `%${termKeyword}%`)
        .eq("session_year", targetSession)
        .order("created_at", { ascending: false })

      if (examsError) {
        console.error("Error fetching exams:", examsError)
      }

      // Build exam map so we can read objective_max / theory_max from the exam definition
      const examDefMap: Record<string, any> = {}
      ;(examsData || []).forEach((e: any) => { examDefMap[e.id] = e })

      const studentYear = extractYear(sp.class)
      const seenIds = new Set<string>()
      
      const filteredExams: Exam[] = (examsData || []).filter((exam: any) => {
        if (!exam.class) return false
        if (seenIds.has(exam.id)) return false
        seenIds.add(exam.id)
        
        const examYear = extractYear(exam.class)
        
        if (isCurrentTerm) {
          return studentYear === examYear
        }
        
        const hasAttempt = attemptsData?.some((a: any) => a.exam_id === exam.id) || false
        return hasAttempt
      })

      console.log('📚 Filtered online exams:', filteredExams.length)
      
      // ✅ Fetch CA Scores
      const { data: caScoresData } = await supabase
        .from("ca_scores")
        .select("*")
        .eq("student_id", sp.id)
        .ilike("term", `%${termKeyword}%`)

      const caMap: Record<string, any> = {}
      caScoresData?.filter(c => c.academic_year === targetSession || c.session_year === targetSession)
        .forEach((ca: any) => { 
          if (ca.exam_id) caMap[ca.exam_id] = ca 
        })

      // ✅ Process Online CBT Attempts
      // RULE: Exam total = 60. Theory Max = 60 - Objective Max (set by teacher).
      const am: Record<string, ExamAttempt> = {}
      const attemptsForTerm = attemptsData?.filter((a: any) => 
        isTermMatch(a.term, targetTerm) && 
        (a.session_year === targetSession || a.academic_year === targetSession)
      ) || []

      attemptsForTerm.forEach((a: any) => {
        const examDef = examDefMap[a.exam_id]
        const ca = caMap[a.exam_id]
        const hasCA = ca && (ca.ca1_score || ca.ca2_score || ca.ca_total)

        // ── Dynamic Objective / Theory max ──
        // Prefer values stored on the exam definition, then the attempt, then safe defaults.
        let objectiveMax = Number(examDef?.objective_max) || Number(a.objective_total) || 0
        if (objectiveMax <= 0 || objectiveMax > 60) objectiveMax = 30 // sensible default
        const theoryMax = Math.max(0, 60 - objectiveMax) // ← Theory Max = 60 − Obj Max

        const objectiveScore = Number(a.objective_score) || 0
        const theoryScore = Number(a.theory_score) || 0
        const ca1 = ca?.ca1_score || 0
        const ca2 = ca?.ca2_score || 0
        const caTotal = ca?.ca_total || (ca1 + ca2)

        let percentage: number
        let totalScore: number

        if (hasCA) {
          // CA (40) + Obj + Theory = out of 100
          totalScore = caTotal + objectiveScore + theoryScore
          percentage = Math.round((totalScore / 100) * 100)
        } else if (theoryScore > 0 || theoryMax > 0) {
          // No CA yet: Obj + Theory = out of 60
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

        percentage = Math.min(Math.max(Number(percentage) || 0, 0), 100)

        const attemptObj: any = { 
          id: a.id, 
          exam_id: a.exam_id, 
          status: a.status, 
          percentage: percentage,
          total_score: totalScore,
          total_marks: 100,
          objective_score: objectiveScore,
          objective_total: objectiveMax,       // dynamic
          theory_score: theoryScore,
          theory_total: theoryMax,             // = 60 - objectiveMax
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
          ca1_score: ca1,
          ca2_score: ca2,
          ca_total_score: caTotal,
          ca_percentage: hasCA ? Math.round((caTotal / 40) * 100) : 0,
          hasCA,
          has_ca: hasCA,
          grade: getWAECGrade(percentage),
          is_passed: percentage >= 40,
        }
        am[a.exam_id] = attemptObj as ExamAttempt
      })

      // ✅ FALLBACK: Fetch Report Cards for offline/uploaded subjects
      // Offline report cards store a single "Exam" score out of 60 (obj+theory combined).
      // So: objective_total = 60, theory_total = 0 (no separate theory row).
      const { data: reportCards } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', sp.id)

      if (reportCards && reportCards.length > 0) {
        const matchingReport = reportCards.find(r => 
          isTermMatch(r.term, targetTerm) && 
          (r.academic_year === targetSession || r.session_year === targetSession)
        )

        if (matchingReport) {
          const subjects = (matchingReport.subject_scores?.length > 0 
            ? matchingReport.subject_scores 
            : matchingReport.subjects_data) || []
          
          subjects.forEach((subj: any, index: number) => {
            const subjectName = subj.name || subj.subject || 'Subject'
            
            // Skip if an online CBT exam already covered this subject
            if (filteredExams.some((e: any) => e.subject?.toLowerCase() === subjectName.toLowerCase())) return
            
            const total = Number(subj.total || subj.score || 0)
            const caScore = Number(subj.ca || subj.ca_score || 0)
            const examScore = Number(subj.exam || subj.exam_score || 0) // out of 60
            const dummyExamId = `rc-exam-${matchingReport.id}-${index}`

            // Add complete exam object (prevents undefined on card)
            filteredExams.push({
              id: dummyExamId,
              title: `${subjectName} Assessment`,
              subject: subjectName,
              class: sp.class,
              term: targetTerm,
              session_year: targetSession,
              status: 'published',
              duration: 0,
              duration_minutes: 0,
              total_questions: 0,
              questions_count: 0,
              question_count: 0,
              num_questions: 0,
              total_marks: 100,
              passing_percentage: 40,
              objective_max: 60,   // full exam portion
              theory_max: 0,      // no separate theory for offline uploads
              exam_type: 'offline',
              is_offline: true,
              created_at: matchingReport.created_at || new Date().toISOString(),
            } as any)

            // Add complete attempt object
            // CA out of 40 + Exam out of 60 = Total out of 100
            am[dummyExamId] = {
              id: `rc-att-${matchingReport.id}-${index}`,
              exam_id: dummyExamId,
              status: 'graded',
              percentage: total,
              total_score: total,
              total_marks: 100,
              objective_score: examScore,
              objective_total: 60,   // exam portion is out of 60
              theory_score: 0,
              theory_total: 0,      // hide theory row (combined into exam score)
              theory_feedback: null,
              term: targetTerm,
              session_year: targetSession,
              attempted_at: matchingReport.created_at || new Date().toISOString(),
              started_at: matchingReport.created_at || new Date().toISOString(),
              submitted_at: matchingReport.created_at || new Date().toISOString(),
              completed_at: matchingReport.created_at || new Date().toISOString(),
              attempt_number: 1,
              is_auto_submitted: false,
              auto_submit_reason: null,
              ca1_score: caScore,
              ca2_score: 0,
              ca_total_score: caScore,
              ca_percentage: Math.round((caScore / 40) * 100),
              hasCA: true,
              has_ca: true,
              grade: subj.grade || getWAECGrade(total),
              is_passed: total >= 40,
            } as any
          })
        }
      }

      setExams(filteredExams)
      setExamAttempts(am)

      // ✅ Get term progress stats
      const { data: termProgressData } = await supabase
        .from("student_term_progress")
        .select("total_subjects, completed_exams, average_score, grade, pending_theory_count")
        .eq("student_id", sp.id)
        .ilike("term", `%${termKeyword}%`)
        .eq("session_year", targetSession)
        .maybeSingle()

      const pendingTheoryAttempts = Object.values(am).filter(a => a.status === 'pending_theory')
      const pendingTheoryCount = pendingTheoryAttempts.length

      const subjectStats = buildSubjectStats(filteredExams, am)
      const completedCount = filteredExams.filter((e: any) => {
        const att = am[e.id]
        return att && ['completed', 'graded', 'pending_theory'].includes(att.status)
      }).length

      const dbGrade = termProgressData?.grade || (subjectStats.length > 0 ? subjectStats[0].grade : 'N/A')
      const dbAverageScore = termProgressData?.average_score ?? (
        subjectStats.length > 0 
          ? Math.round(subjectStats.reduce((acc, s) => acc + s.score, 0) / subjectStats.length)
          : 0
      )
      const dbCompleted = termProgressData?.completed_exams ?? completedCount
      const dbTotalSubjects = termProgressData?.total_subjects ?? totalSubjects

      const availableCount = filteredExams.filter((e: any) => {
        const a = am[e.id]
        if (!a) return true
        return a.status === 'in_progress'
      }).length

      const upcomingCount = filteredExams.filter((e: any) => 
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

      console.log('📊 Stats:', newStats)
      setStats(newStats)

    } catch (e) { 
      console.error("Error loading exams data:", e)
      toast.error("Failed to load exams")
    } finally { 
      setLoading(false)
      isFetching.current = false
    }
  }, [router, selectedTermSession, currentTerm, buildSubjectStats, profile])

  useEffect(() => {
    if (currentTerm.term && currentTerm.session && !isFetching.current) {
      loadData()
    }
  }, [currentTerm, loadData])

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