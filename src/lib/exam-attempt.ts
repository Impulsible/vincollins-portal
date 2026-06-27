// lib/exam-attempt.ts
import { supabase } from '@/lib/supabase'

export async function getOrCreateExamAttempt({
  studentId,
  examId,
  studentName,
  studentEmail,
  studentClass,
  term,
  sessionYear,
  objectiveMax = 20,
  theoryMax    = 40,
}: {
  studentId:     string
  examId:        string
  studentName:   string
  studentEmail:  string
  studentClass:  string
  term:          string
  sessionYear:   string
  objectiveMax?: number
  theoryMax?:    number
}) {
  // ✅ FIRST: Check if attempt already exists
  const { data: existing, error: checkError } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('student_id', studentId)
    .eq('exam_id', examId)
    .maybeSingle()

  if (checkError) {
    console.error('[getOrCreateExamAttempt] check error:', checkError)
    throw checkError
  }

  // ✅ Already exists — return it, do NOT create another
  if (existing) {
    console.log(
      '[getOrCreateExamAttempt] Found existing attempt:',
      existing.id,
      '|',
      existing.status,
    )
    return existing
  }

  // ✅ Does not exist — create one using the safe DB function
  const { data: newAttempt, error: rpcError } = await supabase
    .rpc('start_exam_attempt', {
      p_student_id:    studentId,
      p_exam_id:       examId,
      p_student_name:  studentName,
      p_student_email: studentEmail,
      p_student_class: studentClass,
      p_term:          term,
      p_session_year:  sessionYear,
      p_objective_max: objectiveMax,
      p_theory_max:    theoryMax,
    })

  if (rpcError) {
    console.error('[getOrCreateExamAttempt] rpc error:', rpcError)
    throw rpcError
  }

  console.log(
    '[getOrCreateExamAttempt] Created new attempt:',
    newAttempt.id,
  )
  return newAttempt
}