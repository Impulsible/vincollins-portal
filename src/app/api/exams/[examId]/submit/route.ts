/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { answers, timeSpent } = body

    // Get student
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get exam and questions
    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('id', params.examId)
      .single()

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', params.examId)

    // Calculate score
    let totalPoints = 0
    let earnedPoints = 0
    let correctCount = 0
    const detailedAnswers: Record<string, unknown> = {}

    for (const question of questions || []) {
      totalPoints += question.points
      const studentAnswer = answers[question.id]
      const isCorrect = studentAnswer === question.correct_answer

      if (isCorrect) {
        correctCount++
        earnedPoints += question.points
      }

      detailedAnswers[question.id] = {
        student_answer: studentAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_awarded: isCorrect ? question.points : 0,
        max_points: question.points
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    let grade = 'F'
    if (percentage >= 80) grade = 'A'
    else if (percentage >= 70) grade = 'B'
    else if (percentage >= 60) grade = 'C'
    else if (percentage >= 50) grade = 'D'

    // Save submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        exam_id: params.examId,
        student_id: student.id,
        answers: detailedAnswers,
        score: earnedPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        submitted_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || ''
      })
      .select()
      .single()

    if (submissionError) throw submissionError

    // Update student_exams record
    await supabase
      .from('student_exams')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score: earnedPoints
      })
      .eq('exam_id', params.examId)
      .eq('student_id', student.id)

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        score: earnedPoints,
        total: totalPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        correct_answers: correctCount,
        wrong_answers: (questions?.length || 0) - correctCount,
        submitted_at: submission.submitted_at,
        answers: detailedAnswers
      }
    })
  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}