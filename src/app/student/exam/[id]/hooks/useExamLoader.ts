// src/app/student/exam/[id]/hooks/useExamLoader.ts - FIXED MISSING TYPE FIELD

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const MAX_UNLOADS = 3

function calcScore(questions: any[], answers: Record<string, string>) {
  const obj = questions.filter((q: any) => q.type !== "theory")
  let score = 0, tp = 0, correct = 0, incorrect = 0, unanswered = 0
  obj.forEach((q: any) => {
    const pts = Number(q.points || q.marks || 1)
    tp += pts
    const ans = answers[q.id]
    const ca = String(q.correct_answer || "").trim()
    if (ans?.trim()) {
      if (ans.trim().toLowerCase() === ca.toLowerCase()) { 
        score += pts; 
        correct++ 
      } else { 
        incorrect++ 
      }
    } else { 
      unanswered++ 
    }
  })
  return { score, total: tp, percentage: tp > 0 ? Math.round((score / tp) * 100) : 0, correct, incorrect, unanswered }
}

export function useExamLoader(examId: string, router: ReturnType<typeof useRouter>) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exam, setExam] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [examResult, setExamResult] = useState<any>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [resumeData, setResumeData] = useState<any>(null)
  const [examTerminated, setExamTerminated] = useState(false)
  const [noAttemptsLeft, setNoAttemptsLeft] = useState(false)
  const [unloadCount, setUnloadCount] = useState(0)
  const loadedRef = useRef(false)

  // ✅ Calculate flexible percentage
  const calculateFlexiblePercentage = useCallback((attempt: any) => {
    const objectiveMax = attempt.objective_max || exam?.objective_max || 20
    const theoryMax = attempt.theory_max || exam?.theory_max || 40
    const objectiveScore = attempt.objective_score || 0
    const theoryScore = attempt.theory_score || 0
    const caScore = attempt.ca_total_score || 0

    if (attempt.status === 'pending_theory') {
      const totalScore = objectiveScore + caScore
      const totalMax = objectiveMax + (caScore > 0 ? 40 : 0)
      return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
    }

    if (attempt.status === 'graded' || attempt.status === 'completed') {
      const totalScore = objectiveScore + theoryScore + caScore
      const totalMax = objectiveMax + theoryMax + 40
      return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
    }

    return attempt.percentage || 0
  }, [exam])

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    
    try {
      // Get session
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
        if (!session) { 
          router.push("/portal")
          return 
        }
      }

      // Get student profile
      const { data: ud } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
      if (ud) setProfile(ud)

      // Get exam details
      const { data: ed, error: ee } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (ee || !ed) { 
        setLoadError("Exam not found")
        setLoading(false)
        return 
      }
      setExam(ed)

      // Build questions
      const objectiveMax = ed.objective_max || 20
      const theoryMax = ed.theory_max || 40
      const theoryQuestionsTotal = ed.theory_questions_total || 0
      const theoryQuestionsToAnswer = ed.theory_questions_to_answer || null
      const theoryMarksPerQuestion = ed.theory_marks_per_question || 10
      const scoringRule = ed.scoring_rule || 'standard'
      
      const examMax = objectiveMax + (scoringRule !== 'standard' && theoryQuestionsToAnswer 
        ? theoryQuestionsToAnswer * theoryMarksPerQuestion 
        : theoryQuestionsTotal * theoryMarksPerQuestion)
      const caMax = 40
      const grandMax = caMax + examMax

      console.log(`📊 Exam Configuration:`, { objectiveMax, theoryMax, examMax, caMax, grandMax })

      const allQuestionsFromDB = ed.questions || []
      const theoryQuestionsFromDB = ed.theory_questions || []

      // Separate questions - ✅ FIXED: Handle missing type field (defaults to objective)
      let objectiveQuestionsRaw: any[] = []
      let theoryQuestionsRaw: any[] = []

      if (theoryQuestionsFromDB.length > 0) {
        theoryQuestionsRaw = theoryQuestionsFromDB
        objectiveQuestionsRaw = allQuestionsFromDB.filter((q: any) => q.type !== 'theory')
      } else {
        // ✅ Include questions without type as objective (fixes Yoruba, French, etc.)
        objectiveQuestionsRaw = allQuestionsFromDB.filter((q: any) => 
          q.type === 'mcq' || q.type === 'objective' || !q.type || q.type === null
        )
        theoryQuestionsRaw = allQuestionsFromDB.filter((q: any) => q.type === 'theory')
      }

      console.log(`📊 Questions found: ${objectiveQuestionsRaw.length} objective, ${theoryQuestionsRaw.length} theory`)

      // Build MCQ/Objective questions
      let mcqList = objectiveQuestionsRaw.map((q: any, i: number) => ({
        id: q.id,
        question: q.question || q.question_text || '',
        question_text: q.question_text || q.question || '',
        type: "objective",
        options: q.options || [],
        correct_answer: q.correct_answer || "",
        marks: Number(q.marks || q.points || 0.5),
        points: Number(q.points || q.marks || 0.5),
        order_number: q.order || q.order_number || i + 1,
        is_theory: false,
      }))

      // Build Theory questions
      let theoryList = theoryQuestionsRaw.map((q: any, i: number) => ({
        id: q.id,
        question: q.question || q.question_text || '',
        question_text: q.question_text || q.question || '',
        type: "theory",
        options: [],
        correct_answer: "",
        marks: Number(q.marks || q.points || theoryMarksPerQuestion),
        points: Number(q.points || q.marks || theoryMarksPerQuestion),
        order_number: q.order || q.order_number || i + 1,
        is_theory: true,
        sub_questions: q.sub_questions || [],
        image_url: q.image_url || null,
        image_caption: q.image_caption || null,
      }))

      // ✅ Respect exam shuffle setting
      const shouldShuffle = ed.shuffle_questions !== false && ed.randomize_questions !== false
      const orderedMcq = shouldShuffle ? shuffleArray(mcqList) : mcqList
      const allQ = [...orderedMcq, ...theoryList]
      setAllQuestions(allQ)

      // ✅ Determine if exam has theory questions
      const hasTheoryQuestions = ed.has_theory && theoryQuestionsFromDB.length > 0
      const actualTheoryTotal = hasTheoryQuestions ? theoryMax : 0
      const actualTotalMarks = objectiveMax + actualTheoryTotal

      // Check existing attempts - INCLUDE pending_theory as completed
      const { data: existingAttempts } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", ud.id)
        .order("created_at", { ascending: false })

      const completedAttempts = (existingAttempts || []).filter(
        (a: any) => ["completed", "pending_theory", "graded", "terminated"].includes(a.status)
      )
      const hasActiveAttempt = (existingAttempts || []).some((a: any) => a.status === "in_progress")
      const completedCount = completedAttempts.length

      // Check if no attempts left
      if (completedCount >= (ed.max_attempts || 1) && !hasActiveAttempt) {
        setHasCompletedAttempt(true)
        setAttemptsUsed(completedCount)
        setNoAttemptsLeft(true)
        const latest = completedAttempts[0]
        if (latest.status === "terminated") setExamTerminated(true)
        
        const displayPercentage = calculateFlexiblePercentage(latest)
        setExamResult({
          score: latest.total_score || 0, 
          total: latest.total_marks || actualTotalMarks,
          percentage: displayPercentage,
          correct: latest.correct_count || 0,
          incorrect: latest.incorrect_count || 0,
          unanswered: latest.unanswered_count || 0,
          is_passed: latest.is_passed || false,
          passing_percentage: ed.passing_percentage || 50,
          status: latest.status,
          objective_score: latest.objective_score,
          objective_total: latest.objective_total,
          theory_score: latest.theory_score,
          theory_total: latest.theory_total,
          attempts_used: completedCount, 
          max_attempts: ed.max_attempts || 1,
          submitted_at: latest.submitted_at,
        })
        setLoading(false)
        return
      }

      // Handle existing attempts
      if (existingAttempts && existingAttempts.length > 0) {
        const latest = existingAttempts[0]
        setAttemptsUsed(completedCount)

        if (latest.status === "terminated" || latest.is_auto_submitted) {
          setHasCompletedAttempt(true)
          setExamTerminated(true)
          const displayPercentage = calculateFlexiblePercentage(latest)
          setExamResult({
            score: latest.total_score || 0, 
            total: latest.total_marks || actualTotalMarks,
            percentage: displayPercentage,
            correct: latest.correct_count || 0,
            incorrect: latest.incorrect_count || 0,
            unanswered: latest.unanswered_count || 0,
            is_passed: latest.is_passed || false,
            passing_percentage: ed.passing_percentage || 50,
            status: latest.status,
            objective_score: latest.objective_score,
            objective_total: latest.objective_total,
            theory_score: latest.theory_score,
            theory_total: latest.theory_total,
            attempts_used: completedCount, 
            max_attempts: ed.max_attempts || 1,
            submitted_at: latest.submitted_at,
          })
        } else if (latest.status === "in_progress") {
          // Resume exam
          const newUnloadCount = (latest.unload_count || 0) + 1
          setUnloadCount(newUnloadCount)

          if (newUnloadCount >= MAX_UNLOADS) {
            // Auto-submit due to excessive refreshes
            const existingAnswers = latest.answers || {}
            const result = calcScore(allQ, existingAnswers)
            
            // ✅ DYNAMIC: Calculate correct totals for auto-submit
            const autoSubmitPercentage = actualTotalMarks > 0 ? Math.round((result.score / actualTotalMarks) * 100) : 0

            const objectiveAnswers: Record<string, string> = {}
            const theoryAnswers: Record<string, string> = {}
            allQ.forEach((q: any) => {
              if (q.type === "theory") theoryAnswers[q.id] = existingAnswers[q.id] || ""
              else objectiveAnswers[q.id] = existingAnswers[q.id] || ""
            })

            await supabase.from('exam_attempts').update({
              status: ed.has_theory ? 'pending_theory' : 'completed',
              submitted_at: new Date().toISOString(),
              is_auto_submitted: true,
              auto_submit_reason: 'Excessive page refreshes - suspicious activity',
              unload_count: newUnloadCount,
              answers: objectiveAnswers,
              theory_answers: theoryAnswers,
              objective_score: result.score,
              objective_total: objectiveMax,
              theory_score: 0,
              theory_total: actualTheoryTotal,
              total_score: result.score,
              total_marks: actualTotalMarks,
              percentage: autoSubmitPercentage,
              is_passed: autoSubmitPercentage >= (ed.passing_percentage || 50),
              correct_count: result.correct,
              incorrect_count: result.incorrect,
              unanswered_count: result.unanswered,
            }).eq('id', latest.id)

            setHasCompletedAttempt(true)
            setAttemptsUsed(completedCount + 1)
            setExamResult({
              score: result.score, 
              total: actualTotalMarks,
              percentage: autoSubmitPercentage,
              correct: result.correct, 
              incorrect: result.incorrect,
              unanswered: result.unanswered,
              is_passed: autoSubmitPercentage >= (ed.passing_percentage || 50),
              passing_percentage: ed.passing_percentage || 50,
              status: ed.has_theory ? 'pending_theory' : 'completed',
              objective_score: result.score,
              objective_total: objectiveMax,
              theory_score: 0,
              theory_total: actualTheoryTotal,
              attempts_used: completedCount + 1, 
              max_attempts: ed.max_attempts || 1,
              submitted_at: new Date().toISOString(),
            })
            setLoading(false)
            return
          }

          await supabase.from('exam_attempts').update({ unload_count: newUnloadCount }).eq('id', latest.id)

          const elapsed = Math.floor((Date.now() - new Date(latest.started_at).getTime()) / 1000)
          setResumeData({
            attemptId: latest.id,
            answers: latest.answers || {},
            timeLeft: Math.max(0, (ed.duration * 60) - elapsed),
            tabSwitches: latest.tab_switches || 0,
            fullscreenExits: latest.fullscreen_exits || 0,
            unloadCount: newUnloadCount,
          })
          setShowResumeDialog(true)
        } else if (["completed", "pending_theory", "graded"].includes(latest.status)) {
          setHasCompletedAttempt(true)
          const displayPercentage = calculateFlexiblePercentage(latest)
          setExamResult({
            score: latest.total_score || 0, 
            total: latest.total_marks || actualTotalMarks,
            percentage: displayPercentage,
            correct: latest.correct_count || 0,
            incorrect: latest.incorrect_count || 0,
            unanswered: latest.unanswered_count || 0,
            is_passed: latest.is_passed || false,
            passing_percentage: ed.passing_percentage || 50,
            status: latest.status,
            objective_score: latest.objective_score,
            objective_total: latest.objective_total,
            theory_score: latest.theory_score,
            theory_total: latest.theory_total,
            attempts_used: completedCount, 
            max_attempts: ed.max_attempts || 1,
            graded_by: latest.graded_by, 
            graded_at: latest.graded_at,
            submitted_at: latest.submitted_at,
          })
        }
      } else {
        setAttemptsUsed(0)
        setHasCompletedAttempt(false)
        setAttemptId(null)
        console.log('📝 No existing attempt, showing instructions')
      }
    } catch (error) {
      console.error("Load error:", error)
      setLoadError("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }, [examId, router, calculateFlexiblePercentage])

  useEffect(() => { 
    loadExam() 
  }, [loadExam])

  // ============================================
  // ✅ START NEW ATTEMPT - DYNAMIC TOTALS
  // ============================================
  const startNewAttempt = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        toast.error('Please log in again')
        return null
      }

      // Check for existing in_progress attempt
      const { data: existingAttempt } = await supabase
        .from('exam_attempts')
        .select('id, attempt_number')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)
        .eq('status', 'in_progress')
        .maybeSingle()

      if (existingAttempt) {
        console.log('✅ Using existing in_progress attempt:', existingAttempt.id)
        setAttemptId(existingAttempt.id)
        return { attemptId: existingAttempt.id, isResuming: true, attemptNumber: existingAttempt.attempt_number }
      }

      // Count ALL previous attempts
      const { data: previousAttempts } = await supabase
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', examId)
        .eq('student_id', session.user.id)
        .in('status', ['completed', 'graded', 'pending_theory', 'terminated'])

      const attemptNumber = (previousAttempts?.length || 0) + 1

      console.log(`📝 Attempt #${attemptNumber} - Previous attempts: ${previousAttempts?.length || 0}`)

      // Get exam configuration
      const objectiveMax = exam?.objective_max || 20
      const theoryMax = exam?.theory_max || 40
      const theoryQuestionsTotal = exam?.theory_questions_total || 0
      const theoryQuestionsToAnswer = exam?.theory_questions_to_answer || null
      const theoryMarksPerQuestion = exam?.theory_marks_per_question || 10
      const scoringRule = exam?.scoring_rule || 'standard'
      
      // ✅ DYNAMIC: Calculate correct totals
      const hasTheoryQuestions = exam?.has_theory && theoryQuestionsTotal > 0
      const actualTheoryTotal = hasTheoryQuestions ? theoryMax : 0
      const actualTotalMarks = objectiveMax + actualTheoryTotal
      
      const examMax = objectiveMax + (scoringRule !== 'standard' && theoryQuestionsToAnswer 
        ? theoryQuestionsToAnswer * theoryMarksPerQuestion 
        : theoryQuestionsTotal * theoryMarksPerQuestion)
      const caMax = 40
      const grandMax = caMax + examMax

      console.log(`📊 Creating attempt #${attemptNumber} with config:`, {
        objectiveMax, theoryMax, actualTheoryTotal, actualTotalMarks, examMax, caMax, grandMax
      })

      // ✅ Create new attempt with DYNAMIC totals
      const { data: newAttempt, error: insertError } = await supabase
        .from('exam_attempts')
        .insert({
          id: crypto.randomUUID(),
          exam_id: examId,
          student_id: session.user.id,
          student_name: profile?.full_name || session.user.email?.split('@')[0] || 'Student',
          student_email: session.user.email || '',
          student_class: profile?.class || '',
          status: 'in_progress',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tab_switches: 0,
          fullscreen_exits: 0,
          unload_count: 0,
          attempt_number: attemptNumber,
          term: exam?.term || 'third',
          session_year: exam?.session_year || '2025/2026',
          objective_max: objectiveMax,
          objective_total: objectiveMax,
          theory_max: theoryMax,
          theory_total: actualTheoryTotal,
          exam_max: examMax,
          ca_max: caMax,
          grand_max: grandMax,
          theory_questions_to_answer: theoryQuestionsToAnswer,
          theory_marks_per_question: theoryMarksPerQuestion,
          scoring_rule: scoringRule,
          answers: {},
          theory_answers: {},
          answer_results: {},
          total_marks: actualTotalMarks,
          total_score: 0,
          percentage: 0,
          percentage_score: 0,
          is_passed: false,
          correct_count: 0,
          incorrect_count: 0,
          unanswered_count: 0
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        toast.error('Failed to start exam. Please try again.')
        return null
      }

      if (newAttempt) {
        setAttemptId(newAttempt.id)
        console.log(`✅ Created attempt #${attemptNumber}:`, newAttempt.id)
        return { attemptId: newAttempt.id, isResuming: false, attemptNumber }
      }

      return null
    } catch (error: any) {
      console.error('Error starting exam:', error)
      toast.error('Failed to start exam')
      return null
    }
  }, [examId, exam, profile])

  const handleResumeExam = async () => {
    if (!resumeData) return null
    if (examTerminated) {
      toast.error("This exam was terminated due to security violations")
      router.push("/student")
      return null
    }
    setAttemptId(resumeData.attemptId)
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) await elem.requestFullscreen()
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen()
    } catch (e) {
      console.warn("Fullscreen not supported:", e)
    }
    toast.success("Exam resumed!")
    return resumeData
  }

  return {
    loading, 
    loadError, 
    exam, 
    profile, 
    allQuestions,
    hasCompletedAttempt, 
    examResult, 
    setExamResult,
    attemptId, 
    setAttemptId, 
    attemptsUsed,
    resumeData, 
    showResumeDialog, 
    setShowResumeDialog,
    examTerminated, 
    setExamTerminated,
    noAttemptsLeft, 
    unloadCount,
    handleResumeExam,
    startNewAttempt,
    handleStartNewAttempt: () => setShowResumeDialog(false),
    handleDiscardAndStart: () => setShowResumeDialog(false),
    calculateFlexiblePercentage,
  }
}