import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const { examId, answers, timeSpent, tabSwitches, isAutoSubmitted } = await req.json()

  try {
    // Get exam details
    const { data: exam } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Calculate score
    let totalPoints = 0
    let earnedPoints = 0
    let correctCount = 0

    for (const question of exam.questions) {
      totalPoints += question.points
      const answer = answers[question.id]
      
      if (question.question_type === 'objective') {
        if (answer === question.correct_answer) {
          correctCount++
          earnedPoints += question.points
        } else if (exam.negative_marking && answer) {
          earnedPoints -= exam.negative_marking_value
        }
      } else {
        // Store theory answer for manual grading
        await supabase.from('theory_answers').insert({
          attempt_id: 'temp',
          question_id: question.id,
          answer_text: answer
        })
      }
    }

    const percentage = (earnedPoints / totalPoints) * 100
    let grade = 'F'
    if (percentage >= 80) grade = 'A'
    else if (percentage >= 70) grade = 'B'
    else if (percentage >= 60) grade = 'C'
    else if (percentage >= 50) grade = 'D'

    // Create exam attempt
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        student_id: session.user.id,
        answers,
        score: Math.max(0, earnedPoints),
        total_points: totalPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        tab_switches: tabSwitches,
        status: exam.questions.some(q => q.question_type === 'theory') ? 'grading' : 'graded',
        is_auto_submitted: isAutoSubmitted,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Notify teacher
    await supabase.from('notifications').insert({
      user_id: exam.created_by,
      type: 'submission_received',
      title: 'New Submission',
      message: `${session.user.user_metadata?.full_name} submitted ${exam.title}`,
      metadata: { examId, attemptId: attempt.id, studentId: session.user.id }
    })

    // Notify student if no theory questions
    if (!exam.questions.some(q => q.question_type === 'theory')) {
      await supabase.from('notifications').insert({
        user_id: session.user.id,
        type: 'result_ready',
        title: 'Result Ready',
        message: `Your result for ${exam.title} is ready`,
        metadata: { examId, attemptId: attempt.id }
      })
    }

    return NextResponse.json({ success: true, attemptId: attempt.id })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
  }
}