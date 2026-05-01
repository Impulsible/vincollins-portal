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
    const pts = Number(q.points || 1)
    tp += pts
    const ans = answers[q.id]
    const ca = String(q.correct_answer || "").trim()
    if (ans?.trim()) {
      if (ans.trim().toLowerCase() === ca.toLowerCase()) { score += pts; correct++ }
      else { incorrect++ }
    } else { unanswered++ }
  })
  return { score, total: tp, percentage: tp > 0 ? Math.round((score / tp) * 100) : 0, correct, incorrect, unanswered }
}

function calcTheoryTotal(questions: any[]) {
  return questions.filter((q: any) => q.type === "theory").reduce((s: number, q: any) => s + Number(q.points || 1), 0)
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
      // ✅ RETRY ONCE if session is null (handles temporary rate limits)
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
        if (!session) { router.push("/portal"); return }
      }

      const { data: ud } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
      if (ud) setProfile(ud)

      const { data: ed, error: ee } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (ee || !ed) { setLoadError("Exam not found"); setLoading(false); return }
      setExam(ed)

      const maxAttempts = ed.max_attempts || 1
      const mcqQuestions = ed.questions || []
      const theoryQuestions = ed.theory_questions || []

      let mcqList = mcqQuestions.map((q: any, i: number) => ({
        id: q.id, question_text: q.question,
        type: q.type === "mcq" ? "objective" : q.type,
        options: shuffleArray(q.options || []),
        correct_answer: q.correct_answer || "",
        points: Number(q.marks || 0.5),
        order_number: i + 1, is_theory: false,
      }))

      let theoryList = theoryQuestions.map((q: any, i: number) => ({
        id: q.id, question_text: q.question,
        type: "theory" as const, options: [], correct_answer: "",
        points: Number(q.marks || 10),
        order_number: i + 1, is_theory: true,
      }))

      const allQ = [...mcqList, ...theoryList]
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
        setExamResult({
          score: ts, total: tp,
          percentage: tp > 0 ? Math.round((ts / tp) * 100) : 0,
          correct: latest.correct_count || 0,
          incorrect: latest.incorrect_count || 0,
          unanswered: latest.unanswered_count || 0,
          is_passed: latest.is_passed || false,
          passing_percentage: ed.passing_percentage || 50,
          status: latest.status,
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
          setExamResult({
            score: ts, total: tp,
            percentage: tp > 0 ? Math.round((ts / tp) * 100) : 0,
            correct: latest.correct_count || 0,
            incorrect: latest.incorrect_count || 0,
            unanswered: latest.unanswered_count || 0,
            is_passed: latest.is_passed || false,
            passing_percentage: ed.passing_percentage || 50,
            status: latest.status,
            attempts_used: completedCount, max_attempts: maxAttempts,
            submitted_at: latest.submitted_at,
          })
        } else if (latest.status === "in_progress") {
          const newUnloadCount = (latest.unload_count || 0) + 1
          setUnloadCount(newUnloadCount)

          if (newUnloadCount >= MAX_UNLOADS) {
            const existingAnswers = latest.answers || {}
            const result = calcScore(allQ, existingAnswers)
            const theoryTotal = calcTheoryTotal(allQ)
            const passingScore = ed.passing_percentage || 50
            const isPassed = result.percentage >= passingScore

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
              objective_total: result.total,
              theory_total: theoryTotal,
              total_score: result.score,
              total_marks: result.total + theoryTotal,
              percentage: result.percentage,
              is_passed: isPassed,
              correct_count: result.correct,
              incorrect_count: result.incorrect,
              unanswered_count: result.unanswered,
            }).eq('id', latest.id)

            setHasCompletedAttempt(true)
            setAttemptsUsed(completedCount + 1)
            setExamResult({
              score: result.score, total: result.total + theoryTotal,
              percentage: result.percentage,
              correct: result.correct, incorrect: result.incorrect,
              unanswered: result.unanswered,
              is_passed: isPassed,
              passing_percentage: passingScore,
              status: ed.has_theory ? 'pending_theory' : 'completed',
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
          setExamResult({
            score: ts, total: tp,
            percentage: tp > 0 ? Math.round((ts / tp) * 100) : 0,
            correct: latest.correct_count || 0,
            incorrect: latest.incorrect_count || 0,
            unanswered: latest.unanswered_count || 0,
            is_passed: latest.is_passed || false,
            passing_percentage: ed.passing_percentage || 50,
            status: latest.status,
            attempts_used: completedCount, max_attempts: maxAttempts,
            graded_by: latest.graded_by, graded_at: latest.graded_at,
            submitted_at: latest.submitted_at,
          })
        }
      } else {
        setAllQuestions(shuffleArray(allQ))
        setAttemptsUsed(0)
        setHasCompletedAttempt(false)
      }
    } catch (error) {
      console.error("Load error:", error)
      setLoadError("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => { loadExam() }, [loadExam])

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
    } catch (e) {}
    toast.success("Exam resumed!")
    return resumeData
  }

  return {
    loading, loadError, exam, profile, allQuestions,
    hasCompletedAttempt, examResult, setExamResult,
    attemptId, setAttemptId, attemptsUsed,
    resumeData, showResumeDialog, setShowResumeDialog,
    examTerminated, setExamTerminated,
    noAttemptsLeft, unloadCount,
    handleResumeExam,
    handleStartNewAttempt: () => setShowResumeDialog(false),
    handleDiscardAndStart: () => setShowResumeDialog(false),
  }
}