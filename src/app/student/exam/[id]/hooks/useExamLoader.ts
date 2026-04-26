"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Fisher-Yates shuffle for objectives only
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
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
  const loadedRef = useRef(false)

  const loadExam = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/portal"); return }

      const { data: ud } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
      if (ud) setProfile(ud)

      const { data: ed, error: ee } = await supabase.from("exams").select("*").eq("id", examId).single()
      if (ee || !ed) { setLoadError("Exam not found"); setLoading(false); return }
      setExam(ed)

      const maxAttempts = ed.max_attempts || 1
      const mcqQuestions = ed.questions || []
      const theoryQuestions = ed.theory_questions || []

      // ===== PROCESS MCQ QUESTIONS =====
      // Shuffle options per question
      // Then shuffle question order (for new attempts)
      let mcqList = mcqQuestions.map((q: any, i: number) => ({
        id: q.id,
        question_text: q.question,
        type: q.type === "mcq" ? "objective" : q.type,
        options: shuffleArray(q.options || []), // ✅ Options shuffled
        correct_answer: q.correct_answer || "",
        points: Number(q.marks || 0.5),
        order_number: i + 1, // Sequential for MCQs
        is_theory: false,
      }))

      // ===== PROCESS THEORY QUESTIONS =====
      // NO shuffle for theory
      // Numbering starts from 1 (independent of MCQs)
      let theoryList = theoryQuestions.map((q: any, i: number) => ({
        id: q.id,
        question_text: q.question,
        type: "theory" as const,
        options: [],
        correct_answer: "",
        points: Number(q.marks || 10),
        order_number: i + 1, // ✅ Theory starts from 1
        is_theory: true,
      }))

      // ===== CHECK EXISTING ATTEMPTS =====
      const { data: existingAttempts } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", ud.id)
        .order("created_at", { ascending: false })

      const completedAttempts = (existingAttempts || []).filter(
        (a: any) => ["completed", "pending_theory", "graded", "terminated"].includes(a.status)
      )
      const totalAttemptsUsed = existingAttempts?.length || 0
      const hasActiveAttempt = (existingAttempts || []).some((a: any) => a.status === "in-progress")

      // ===== MAX ATTEMPTS CHECK =====
      if (completedAttempts.length >= maxAttempts && !hasActiveAttempt) {
        setHasCompletedAttempt(true)
        setAttemptsUsed(totalAttemptsUsed)
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
          objective_score: latest.objective_score || 0,
          objective_total: latest.objective_total || 0,
          theory_score: latest.theory_score || 0,
          theory_total: latest.theory_total || 0,
          is_passed: latest.is_passed || false,
          passing_percentage: ed.passing_percentage || 50,
          status: latest.status,
          attempts_used: totalAttemptsUsed,
          max_attempts: maxAttempts,
          submitted_at: latest.submitted_at,
        })
        setLoading(false)
        return
      }

      // ===== HANDLE ATTEMPTS =====
      if (existingAttempts && existingAttempts.length > 0) {
        const latest = existingAttempts[0]
        setAttemptsUsed(totalAttemptsUsed)

        if (latest.status === "terminated" || latest.is_auto_submitted) {
          setHasCompletedAttempt(true)
          setExamTerminated(true)
          setExamResult({
            score: 0, total: 0, percentage: 0,
            correct: 0, incorrect: 0, unanswered: 0,
            is_passed: false,
            passing_percentage: ed.passing_percentage || 50,
            status: "terminated",
            attempts_used: totalAttemptsUsed,
            max_attempts: maxAttempts,
            submitted_at: latest.submitted_at,
          })
        }
        // RESUME - Keep original order
        else if (latest.status === "in-progress") {
          setAllQuestions([...mcqList, ...theoryList])
          const elapsed = Math.floor((Date.now() - new Date(latest.started_at).getTime()) / 1000)
          setResumeData({
            attemptId: latest.id,
            answers: latest.answers || {},
            timeLeft: Math.max(0, (ed.duration * 60) - elapsed),
            tabSwitches: latest.tab_switches || 0,
            fullscreenExits: latest.fullscreen_exits || 0,
          })
          setShowResumeDialog(true)
        }
        // COMPLETED
        else if (["completed", "pending_theory", "graded"].includes(latest.status)) {
          setHasCompletedAttempt(true)
          const ts = (latest.objective_score || 0) + (latest.theory_score || 0)
          const tp = (latest.objective_total || 0) + (latest.theory_total || 0)
          setExamResult({
            score: ts, total: tp,
            percentage: tp > 0 ? Math.round((ts / tp) * 100) : 0,
            correct: latest.correct_count || 0,
            incorrect: latest.incorrect_count || 0,
            unanswered: latest.unanswered_count || 0,
            objective_score: latest.objective_score || 0,
            objective_total: latest.objective_total || 0,
            theory_score: latest.theory_score || 0,
            theory_total: latest.theory_total || 0,
            is_passed: latest.is_passed || false,
            passing_percentage: ed.passing_percentage || 50,
            status: latest.status,
            attempts_used: totalAttemptsUsed,
            max_attempts: maxAttempts,
            graded_by: latest.graded_by,
            graded_at: latest.graded_at,
            submitted_at: latest.submitted_at,
          })
        }
      } else {
        // ===== NEW ATTEMPT =====
        // Shuffle ONLY MCQs (questions AND options already shuffled)
        // Theory stays in original order
        setAllQuestions([...shuffleArray(mcqList), ...theoryList])
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
    toast.success("Exam resumed!")
    return resumeData
  }

  return {
    loading, loadError, exam, profile, allQuestions,
    hasCompletedAttempt, examResult, setExamResult,
    attemptId, setAttemptId, attemptsUsed,
    resumeData, showResumeDialog, setShowResumeDialog,
    examTerminated, setExamTerminated,
    noAttemptsLeft,
    handleResumeExam,
    handleStartNewAttempt: () => setShowResumeDialog(false),
    handleDiscardAndStart: () => setShowResumeDialog(false),
  }
}