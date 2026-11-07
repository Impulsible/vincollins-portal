// src/app/student/exam/[id]/services/examLoaderService.ts

import { supabase } from "@/lib/supabase"
import type {
  Exam,
  Profile,
  ExamAttempt,
  AttemptStatus,
  ExamResult,
  StartAttemptResult,
  Question,
} from "../types"

const TERMINAL_STATUSES: readonly AttemptStatus[] = [
  "completed",
  "pending_theory",
  "graded",
  "terminated",
]

// ── Auth ───────────────────────────────────────────────────────────────────

export async function requireSession(): Promise<{
  userId: string
  email: string
}> {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    return {
      userId: data.session.user.id,
      email: data.session.user.email ?? "",
    }
  }

  await new Promise((r) => setTimeout(r, 1500))
  const retry = await supabase.auth.getSession()
  if (retry.data.session) {
    return {
      userId: retry.data.session.user.id,
      email: retry.data.session.user.email ?? "",
    }
  }

  throw new Error("NO_SESSION")
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data as Profile | null
}

// ── Exam ───────────────────────────────────────────────────────────────────

export async function fetchExam(examId: string): Promise<Exam> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single()

  if (error || !data) throw new Error("EXAM_NOT_FOUND")
  return data as Exam
}

// ── Attempts ───────────────────────────────────────────────────────────────

export async function fetchAttempts(
  examId: string,
  studentId: string,
): Promise<ExamAttempt[]> {
  const { data } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  return (data ?? []) as ExamAttempt[]
}

export function getCompletedAttempts(attempts: ExamAttempt[]): ExamAttempt[] {
  return attempts.filter((a) =>
    (TERMINAL_STATUSES as readonly string[]).includes(a.status),
  )
}

export function getActiveAttempt(attempts: ExamAttempt[]): ExamAttempt | undefined {
  return attempts.find((a) => a.status === "in_progress")
}

// ── Percentage Calculator (pure) ──────────────────────────────────────────

export function calculateFlexiblePercentage(
  attempt: ExamAttempt,
  exam: Exam,
  objectiveMax: number,
  theoryMax: number,
): number {
  const objMax = attempt.objective_total || objectiveMax
  const theoMax = attempt.theory_total || theoryMax
  const objScore = attempt.objective_score || 0
  const theoScore = attempt.theory_score || 0
  const caScore = Math.max(
    0,
    Number(attempt.total_score ?? 0) - objScore - theoScore,
  )

  if (attempt.status === "pending_theory") {
    const totalMax = objMax + (caScore > 0 ? 40 : 0)
    return totalMax > 0
      ? Math.round(((objScore + caScore) / totalMax) * 100)
      : 0
  }

  if (attempt.status === "graded" || attempt.status === "completed") {
    const totalMax = objMax + theoMax + 40
    return totalMax > 0
      ? Math.round(((objScore + theoScore + caScore) / totalMax) * 100)
      : 0
  }

  return attempt.percentage || 0
}

// ── Result Builder ─────────────────────────────────────────────────────────

export interface BuildResultParams {
  attempt: ExamAttempt
  exam: Exam
  objectiveMax: number
  theoryMax: number
  actualTotalMarks: number
  completedCount: number
}

export function buildExamResult({
  attempt,
  exam,
  objectiveMax,
  theoryMax,
  actualTotalMarks,
  completedCount,
}: BuildResultParams): ExamResult {
  const percentage = calculateFlexiblePercentage(
    attempt,
    exam,
    objectiveMax,
    theoryMax,
  )

  return {
    score: attempt.total_score || 0,
    total: attempt.total_marks || actualTotalMarks,
    percentage,
    correct: attempt.correct_count || 0,
    incorrect: attempt.incorrect_count || 0,
    unanswered: attempt.unanswered_count || 0,
    is_passed: attempt.is_passed || false,
    passing_percentage: exam.passing_percentage || 50,
    status: attempt.status,
    objective_score: attempt.objective_score || 0,
    objective_total: attempt.objective_total || objectiveMax,
    theory_score: attempt.theory_score || 0,
    theory_total: attempt.theory_total || theoryMax,
    attempts_used: completedCount,
    max_attempts: exam.max_attempts || 1,
    submitted_at: attempt.submitted_at,
    graded_by: attempt.graded_by ?? null,
    graded_at: attempt.graded_at ?? null,
  }
}

// ── Auto-Submit on Excessive Unloads ──────────────────────────────────────

export interface AutoSubmitParams {
  attemptId: string
  answers: Record<string, string>
  allQuestions: Question[]
  exam: Exam
  objectiveMax: number
  theoryMax: number
  actualTotalMarks: number
  unloadCount: number
  calcScore: (
    questions: Question[],
    answers: Record<string, string>,
  ) => { score: number; correct: number; incorrect: number; unanswered: number }
}

export async function autoSubmitOnUnloadExceeded({
  attemptId,
  answers,
  allQuestions,
  exam,
  objectiveMax,
  theoryMax,
  actualTotalMarks,
  unloadCount,
  calcScore,
}: AutoSubmitParams): Promise<ExamResult> {
  const result = calcScore(allQuestions, answers)
  const autoPercentage =
    actualTotalMarks > 0
      ? Math.round((result.score / actualTotalMarks) * 100)
      : 0

  const objectiveAnswers: Record<string, string> = {}
  const theoryAnswers: Record<string, string> = {}
  for (const q of allQuestions) {
    if (q.type === "theory") {
      theoryAnswers[q.id] = answers[q.id] ?? ""
    } else {
      objectiveAnswers[q.id] = answers[q.id] ?? ""
    }
  }

  const status = exam.has_theory ? "pending_theory" : "completed"
  const passingPct = exam.passing_percentage || 50

  await supabase
    .from("exam_attempts")
    .update({
      status,
      submitted_at: new Date().toISOString(),
      is_auto_submitted: true,
      auto_submit_reason: "Excessive page refreshes - suspicious activity",
      unload_count: unloadCount,
      answers: objectiveAnswers,
      theory_answers: theoryAnswers,
      objective_score: result.score,
      objective_total: objectiveMax,
      theory_score: 0,
      theory_total: theoryMax,
      total_score: result.score,
      total_marks: actualTotalMarks,
      percentage: autoPercentage,
      is_passed: autoPercentage >= passingPct,
      correct_count: result.correct,
      incorrect_count: result.incorrect,
      unanswered_count: result.unanswered,
    })
    .eq("id", attemptId)

  return {
    score: result.score,
    total: actualTotalMarks,
    percentage: autoPercentage,
    correct: result.correct,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    is_passed: autoPercentage >= passingPct,
    passing_percentage: passingPct,
    status,
    objective_score: result.score,
    objective_total: objectiveMax,
    theory_score: 0,
    theory_total: theoryMax,
    attempts_used: 1,
    max_attempts: exam.max_attempts || 1,
    submitted_at: new Date().toISOString(),
  }
}

// ── Unload Count ───────────────────────────────────────────────────────────

export async function incrementUnloadCount(
  attemptId: string,
  newCount: number,
): Promise<void> {
  await supabase
    .from("exam_attempts")
    .update({ unload_count: newCount })
    .eq("id", attemptId)
}

// ── Start / Resume Attempt ────────────────────────────────────────────────

export async function findInProgressAttempt(
  examId: string,
  studentId: string,
): Promise<ExamAttempt | null> {
  const { data } = await supabase
    .from("exam_attempts")
    .select("id, attempt_number, started_at, status")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .maybeSingle()

  return data as ExamAttempt | null
}

export interface CreateAttemptParams {
  examId: string
  studentId: string
  studentName: string
  studentEmail: string
  studentClass: string
  attemptNumber: number
  exam: Exam
  objectiveMax: number
  theoryMax: number
  actualTotalMarks: number
}

export async function createAttempt({
  examId,
  studentId,
  studentName,
  studentEmail,
  studentClass,
  attemptNumber,
  exam,
  objectiveMax,
  theoryMax,
  actualTotalMarks,
}: CreateAttemptParams): Promise<StartAttemptResult> {
  const startedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({
      id: crypto.randomUUID(),
      exam_id: examId,
      student_id: studentId,
      student_name: studentName,
      student_email: studentEmail,
      student_class: studentClass,
      status: "in_progress",
      started_at: startedAt,
      created_at: startedAt,
      updated_at: startedAt,
      tab_switches: 0,
      fullscreen_exits: 0,
      unload_count: 0,
      attempt_number: attemptNumber,
      term: exam.term || "third",
      session_year: exam.session_year || "2025/2026",
      objective_max: objectiveMax,
      objective_total: objectiveMax,
      theory_max: theoryMax,
      theory_total: theoryMax,
      total_marks: actualTotalMarks,
      answers: {},
      theory_answers: {},
      answer_results: {},
      total_score: 0,
      percentage: 0,
      percentage_score: 0,
      is_passed: false,
      correct_count: 0,
      incorrect_count: 0,
      unanswered_count: 0,
    })
    .select("id")
    .single()

  if (error || !data) throw new Error("CREATE_ATTEMPT_FAILED")

  return {
    attemptId: data.id,
    isResuming: false,
    attemptNumber,
    started_at: startedAt,
  }
}