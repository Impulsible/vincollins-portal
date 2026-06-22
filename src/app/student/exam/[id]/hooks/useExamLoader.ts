// src/app/student/exam/[id]/hooks/useExamLoader.ts
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

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    try {
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

      const { data: ud } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
      if (ud) setProfile(ud)

      const { data: ed, error: ee } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (ee || !ed) { 
        setLoadError("Exam not found")
        setLoading(false)
        return 
      }
      setExam(ed)

      // ✅ Get flexible scoring from exam
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

      console.log(`📊 Scoring Distribution:`, {
        objectiveMax,
        theoryMax,
        theoryQuestionsTotal,
        theoryQuestionsToAnswer,
        theoryMarksPerQuestion,
        scoringRule,
        examMax,
        caMax,
        grandMax
      })

      const maxAttempts = ed.max_attempts || 1
      const allQuestionsFromDB = ed.questions || []
      const theoryQuestionsFromDB = ed.theory_questions || []

      // Separate MCQ and Theory questions
      let objectiveQuestionsRaw: any[] = []
      let theoryQuestionsRaw: any[] = []

      if (theoryQuestionsFromDB.length > 0) {
        theoryQuestionsRaw = theoryQuestionsFromDB
        objectiveQuestionsRaw = allQuestionsFromDB.filter((q: any) => q.type !== 'theory')
      } else {
        objectiveQuestionsRaw = allQuestionsFromDB.filter((q: any) => q.type === 'mcq' || q.type === 'objective')
        theoryQuestionsRaw = allQuestionsFromDB.filter((q: any) => q.type === 'theory')
      }

      console.log(`📊 Exam: ${ed.title}`)
      console.log(`   - Objective/MCQ questions: ${objectiveQuestionsRaw.length}`)
      console.log(`   - Theory questions: ${theoryQuestionsRaw.length}`)

      // Build MCQ/Objective questions
      let mcqList = objectiveQuestionsRaw.map((q: any, i: number) => ({
        id: q.id,
        question: q.question || q.question_text || '',
        question_text: q.question_text || q.question || '',
        type: "objective",
        options: q.options || [],
        correct_answer: q.correct_answer || "",
        marks: Number(q.marks || 0.5),
        points: Number(q.marks || 0.5),
        order_number: q.order || i + 1,
        is_theory: false,
      }))

      // Build Theory questions (preserve original order)
      let theoryList = theoryQuestionsRaw.map((q: any, i: number) => ({
        id: q.id,
        question: q.question || q.question_text || '',
        question_text: q.question_text || q.question || '',
        type: "theory",
        options: [],
        correct_answer: "",
        marks: Number(q.marks || theoryMarksPerQuestion),
        points: Number(q.marks || theoryMarksPerQuestion),
        order_number: q.order || i + 1,
        is_theory: true,
        sub_questions: q.sub_questions || [],
        image_url: q.image_url || null,
        image_caption: q.image_caption || null,
      }))

      // Shuffle ONLY MCQ questions
      const shuffledMcq = shuffleArray(mcqList)
      
      // Combine: Shuffled MCQ first, then Theory in original order
      const allQ = [...shuffledMcq, ...theoryList]
      
      console.log(`   - Final order: ${shuffledMcq.length} MCQ (indices 0-${shuffledMcq.length - 1})`)
      console.log(`   - Then ${theoryList.length} Theory (indices ${shuffledMcq.length}-${allQ.length - 1})`)
      console.log(`   - Total questions: ${allQ.length}`)
      
      setAllQuestions(allQ)

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

      if (completedCount >= maxAttempts && !hasActiveAttempt) {
        setHasCompletedAttempt(true)
        setAttemptsUsed(completedCount)
        setNoAttemptsLeft(true)
        const latest = completedAttempts[0]
        if (latest.status === "terminated") setExamTerminated(true)
        const ts = (latest.objective_score || 0) + (latest.theory_score || 0)
        const tp = (latest.objective_total || 0) + (latest.theory_total || 0)
        // ✅ FIXED: Calculate percentage from stored scores
        const calcPct = tp > 0 ? Math.round((ts / tp) * 100) : 0
        setExamResult({
          score: ts, total: tp,
          percentage: calcPct || latest.percentage || 0,
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
          attempts_used: completedCount, max_attempts: maxAttempts,
          submitted_at: latest.submitted_at,
        })
        setLoading(false)
        return
      }

      if (existingAttempts && existingAttempts.length > 0) {
        const latest = existingAttempts[0]
        setAttemptsUsed(completedCount)

        if (latest.status === "terminated" || latest.is_auto_submitted) {
          setHasCompletedAttempt(true)
          setExamTerminated(true)
          const ts = (latest.objective_score || 0) + (latest.theory_score || 0)
          const tp = (latest.objective_total || 0) + (latest.theory_total || 0)
          const calcPct = tp > 0 ? Math.round((ts / tp) * 100) : 0
          setExamResult({
            score: ts, total: tp,
            percentage: calcPct || latest.percentage || 0,
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
            attempts_used: completedCount, max_attempts: maxAttempts,
            submitted_at: latest.submitted_at,
          })
        } else if (latest.status === "in_progress") {
          const newUnloadCount = (latest.unload_count || 0) + 1
          setUnloadCount(newUnloadCount)

          if (newUnloadCount >= MAX_UNLOADS) {
            const existingAnswers = latest.answers || {}
            const result = calcScore(allQ, existingAnswers)
            
            // Calculate theory score based on scoring rule
            let theoryScore = 0
            let theoryTotal = 0
            if (theoryList.length > 0) {
              const theoryAnswersData = latest.theory_answers || {}
              
              if (scoringRule === 'best_of' && theoryQuestionsToAnswer) {
                theoryTotal = theoryQuestionsToAnswer * theoryMarksPerQuestion
              } else if (scoringRule === 'choose_any' && theoryQuestionsToAnswer) {
                theoryTotal = theoryQuestionsToAnswer * theoryMarksPerQuestion
              } else {
                theoryTotal = theoryList.length * theoryMarksPerQuestion
              }
            }
            
            // ✅ FIXED: Calculate percentage based on objective score / objective max
            const objectivePct = objectiveMax > 0 ? Math.round((result.score / objectiveMax) * 100) : 0
            const passingScore = ed.passing_percentage || 50
            const isPassed = objectivePct >= passingScore

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
              theory_score: theoryScore,
              theory_total: theoryTotal,
              total_score: result.score + theoryScore,
              total_marks: objectiveMax + theoryTotal,
              percentage: objectivePct, // ✅ FIXED: Use objective percentage
              is_passed: isPassed,
              correct_count: result.correct,
              incorrect_count: result.incorrect,
              unanswered_count: result.unanswered,
            }).eq('id', latest.id)

            setHasCompletedAttempt(true)
            setAttemptsUsed(completedCount + 1)
            setExamResult({
              score: result.score + theoryScore, total: objectiveMax + theoryTotal,
              percentage: objectivePct, // ✅ FIXED
              correct: result.correct, incorrect: result.incorrect,
              unanswered: result.unanswered,
              is_passed: isPassed,
              passing_percentage: passingScore,
              status: ed.has_theory ? 'pending_theory' : 'completed',
              objective_score: result.score,
              objective_total: objectiveMax,
              theory_score: theoryScore,
              theory_total: theoryTotal,
              attempts_used: completedCount + 1, max_attempts: maxAttempts,
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
          const ts = (latest.objective_score || 0) + (latest.theory_score || 0)
          const tp = (latest.objective_total || 0) + (latest.theory_total || 0)
          const calcPct = tp > 0 ? Math.round((ts / tp) * 100) : 0
          setExamResult({
            score: ts, total: tp,
            percentage: calcPct || latest.percentage || 0, // ✅ FIXED
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
            attempts_used: completedCount, max_attempts: maxAttempts,
            graded_by: latest.graded_by, graded_at: latest.graded_at,
            submitted_at: latest.submitted_at,
          })
        }
      } else {
        // ✅ NO EXISTING ATTEMPT - CREATE NEW ONE
        setAttemptsUsed(0)
        setHasCompletedAttempt(false)
        
        const { error: createError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            student_id: ud.id,
            status: 'in_progress',
            objective_max: objectiveMax,
            theory_max: theoryMax,
            exam_max: examMax,
            ca_max: caMax,
            grand_max: grandMax,
            theory_questions_to_answer: theoryQuestionsToAnswer,
            theory_marks_per_question: theoryMarksPerQuestion,
            scoring_rule: scoringRule,
            term: ed.term || 'third',
            session_year: ed.session_year || '2025/2026',
            started_at: new Date().toISOString(),
            unload_count: 0,
            tab_switches: 0,
            fullscreen_exits: 0,
            answers: {},
            theory_answers: {}
          })
        
        if (createError) {
          console.error('Error creating attempt:', createError)
          toast.error('Failed to start exam')
        } else {
          console.log('✅ Created new attempt with flexible scoring')
        }
      }
    } catch (error) {
      console.error("Load error:", error)
      setLoadError("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { 
    loadExam() 
  }, [loadExam])

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
    handleStartNewAttempt: () => setShowResumeDialog(false),
    handleDiscardAndStart: () => setShowResumeDialog(false),
  }
}