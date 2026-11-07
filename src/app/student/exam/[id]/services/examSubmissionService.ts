// src/app/student/exam/[id]/services/examSubmissionService.ts

import { supabase } from "@/lib/supabase"
import { calculateScore } from "../utils/scoring"
import { EXAM_CONFIG, TERMINAL_STATUSES } from "../constants"
import type { ExamResult, Question } from "../types"

// ── Types ──────────────────────────────────────────────────────────────────

export interface SubmitExamParams {
  attemptId: string
  examId: string
  studentId: string | undefined
  answers: Record<string, string>
  allQuestions: Question[]
  examDuration: number
  passingPercentage: number
  maxAttempts: number
  tabSwitches: number
  fullscreenExits: number
  isAuto: boolean
  reason: string
  theoryQuestionCount: number
}

export interface SubmitExamResult {
  success: boolean
  result?: ExamResult
  error?: string
}

export interface CanonicalStartInfo {
  startedAtMs: number | null
  extraTimeMinutes: number
}

export interface AttemptExtraSnapshot {
  extraTimeMinutes: number
  extraTimeUpdatedAt: string | null
  startedAtMs: number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function partitionAnswers(
  allQuestions: Question[],
  answers: Record<string, string>,
) {
  const objective: Record<string, string> = {}
  const theory: Record<string, string> = {}

  for (const q of allQuestions) {
    if (q.type === "theory") {
      theory[q.id] = answers[q.id] ?? ""
    } else {
      objective[q.id] = answers[q.id] ?? ""
    }
  }

  return { objective, theory }
}

function computeScores(params: {
  objectiveScore: number
  theoryScore: number
  caScore: number
  actualObjectiveMax: number
  status: string
  passingPercentage: number
}) {
  const {
    objectiveScore,
    theoryScore,
    caScore,
    actualObjectiveMax,
    status,
    passingPercentage,
  } = params

  const { EXAM_PORTION_MAX, CA_PORTION_MAX } = EXAM_CONFIG
  const grandTotalMax = EXAM_PORTION_MAX + CA_PORTION_MAX

  let percentage = 0
  let isPassed = false

  if (status === "pending_theory") {
    percentage =
      actualObjectiveMax > 0
        ? Math.round((objectiveScore / actualObjectiveMax) * 100)
        : 0
  } else if (status === "completed") {
    const numerator = caScore + objectiveScore + theoryScore
    const denominator = caScore > 0 ? grandTotalMax : EXAM_PORTION_MAX
    percentage =
      denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
    isPassed = percentage >= passingPercentage
  }

  return { percentage, isPassed, grandTotalMax }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function checkAttemptAlreadySubmitted(
  attemptId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("submitted_at, status")
    .eq("id", attemptId)
    .single()

  if (error || !data) return false

  return (
    !!data.submitted_at ||
    (TERMINAL_STATUSES as readonly string[]).includes(String(data.status))
  )
}

/**
 * Fetches the canonical start ms + extra minutes in ONE call.
 * Used on initial entry and resume.
 */
export async function fetchCanonicalStartInfo(
  attemptId: string,
): Promise<CanonicalStartInfo> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("started_at, created_at, extra_time_minutes")
    .eq("id", attemptId)
    .single()

  if (error || !data) {
    return { startedAtMs: null, extraTimeMinutes: 0 }
  }

  const raw = data.started_at ?? data.created_at
  const ms = raw ? new Date(raw).getTime() : NaN
  const startedAtMs = Number.isFinite(ms) ? ms : null
  const extraTimeMinutes = Number(data.extra_time_minutes) || 0

  return { startedAtMs, extraTimeMinutes }
}

/**
 * Backwards-compatible shim.
 */
export async function fetchCanonicalStartMs(
  attemptId: string,
): Promise<number | null> {
  const info = await fetchCanonicalStartInfo(attemptId)
  return info.startedAtMs
}

/**
 * ✅ NEW: snapshot for useExtraTimeSync — used by Realtime AND polling.
 * Includes `extra_time_updated_at` so we can distinguish "no change" from
 * "value changed but happens to be the same number".
 */
export async function fetchAttemptExtraSnapshot(
  attemptId: string,
): Promise<AttemptExtraSnapshot> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("started_at, created_at, extra_time_minutes, extra_time_updated_at")
    .eq("id", attemptId)
    .single()

  if (error || !data) {
    return { extraTimeMinutes: 0, extraTimeUpdatedAt: null, startedAtMs: null }
  }

  const raw = data.started_at ?? data.created_at
  const ms = raw ? new Date(raw).getTime() : NaN

  return {
    extraTimeMinutes: Number(data.extra_time_minutes) || 0,
    extraTimeUpdatedAt: data.extra_time_updated_at ?? null,
    startedAtMs: Number.isFinite(ms) ? ms : null,
  }
}

async function fetchCaScores(
  studentId: string,
  examId: string,
): Promise<{ ca1: number; ca2: number; total: number }> {
  const { data } = await supabase
    .from("ca_scores")
    .select("ca1_score, ca2_score")
    .eq("student_id", studentId)
    .eq("exam_id", examId)
    .maybeSingle()

  const ca1 = Number(data?.ca1_score) || 0
  const ca2 = Number(data?.ca2_score) || 0
  return { ca1, ca2, total: ca1 + ca2 }
}

async function fetchCompletedAttemptCount(
  examId: string,
  studentId: string | undefined,
): Promise<number> {
  if (!studentId) return 1

  const { data } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .in("status", [...TERMINAL_STATUSES])

  return data?.length ?? 1
}

export async function submitExam(
  params: SubmitExamParams,
): Promise<SubmitExamResult> {
  const {
    attemptId,
    examId,
    studentId,
    answers,
    allQuestions,
    passingPercentage,
    maxAttempts,
    tabSwitches,
    fullscreenExits,
    isAuto,
    reason,
    theoryQuestionCount,
  } = params

  try {
    const scoreResult = calculateScore(allQuestions, answers)
    const objectiveQuestions = allQuestions.filter((q) => q.type !== "theory")
    const actualObjectiveMax = objectiveQuestions.reduce(
      (sum, q) => sum + Number(q.marks ?? q.points ?? 1),
      0,
    )
    const actualTheoryMax = Math.max(
      0,
      EXAM_CONFIG.EXAM_PORTION_MAX - actualObjectiveMax,
    )
    const hasTheory = actualTheoryMax > 0 && theoryQuestionCount > 0
    const status = hasTheory ? "pending_theory" : "completed"

    const { objective, theory } = partitionAnswers(allQuestions, answers)

    const ca = studentId
      ? await fetchCaScores(studentId, examId)
      : { ca1: 0, ca2: 0, total: 0 }

    const { percentage, isPassed, grandTotalMax } = computeScores({
      objectiveScore: scoreResult.score,
      theoryScore: 0,
      caScore: ca.total,
      actualObjectiveMax,
      status,
      passingPercentage,
    })

    const { error: updateError } = await supabase
      .from("exam_attempts")
      .update({
        status,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_auto_submitted: isAuto,
        auto_submit_reason: isAuto ? reason : null,
        tab_switches: tabSwitches,
        fullscreen_exits: fullscreenExits,
        answers: objective,
        theory_answers: theory,
        objective_score: scoreResult.score,
        objective_total: actualObjectiveMax,
        theory_score: 0,
        theory_total: actualTheoryMax,
        total_score: scoreResult.score + ca.total,
        total_marks: grandTotalMax,
        percentage,
        is_passed: isPassed,
        correct_count: scoreResult.correct,
        incorrect_count: scoreResult.incorrect,
        unanswered_count: scoreResult.unanswered,
      })
      .eq("id", attemptId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    const attemptsUsed = await fetchCompletedAttemptCount(examId, studentId)

    const result: ExamResult = {
      ...scoreResult,
      theory_score: 0,
      theory_total: actualTheoryMax,
      is_passed: isPassed,
      passing_percentage: passingPercentage,
      status,
      attempts_used: attemptsUsed,
      max_attempts: maxAttempts,
      submitted_at: new Date().toISOString(),
      percentage,
      total_score: scoreResult.score + ca.total,
      total_marks: grandTotalMax,
      objective_score: scoreResult.score,
      objective_total: actualObjectiveMax,
      ca_score: ca.total,
      ca1_score: ca.ca1,
      ca2_score: ca.ca2,
      grade: isPassed ? "P" : "F",
    }

    return { success: true, result }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown submission error"
    return { success: false, error: message }
  }
}