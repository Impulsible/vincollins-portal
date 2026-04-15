/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to get full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { examId, answers, timeSpent, tabSwitches, isAutoSubmitted } = await req.json()

    // Validate required fields
    if (!examId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get exam details with questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Check if student has already submitted
    const { data: existingAttempt } = await supabase
      .from('exam_attempts')
      .select('id')
      .eq('exam_id', examId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existingAttempt) {
      return NextResponse.json({ error: 'You have already submitted this exam' }, { status: 400 })
    }

    // Calculate score
    let totalPoints = 0
    let earnedPoints = 0
    let correctCount = 0
    const theoryQuestions: any[] = []

    for (const question of exam.questions) {
      totalPoints += question.points || 1
      const answer = answers[question.id]
      
      if (question.question_type === 'objective') {
        if (answer && answer.toString().toLowerCase() === question.correct_answer?.toString().toLowerCase()) {
          correctCount++
          earnedPoints += question.points || 1
        } else if (exam.negative_marking && answer) {
          earnedPoints -= (exam.negative_marking_value || 0.5)
        }
      } else if (question.question_type === 'theory') {
        theoryQuestions.push({
          question_id: question.id,
          answer_text: answer || '',
          points_awarded: 0
        })
      }
    }

    // Ensure score doesn't go negative
    earnedPoints = Math.max(0, earnedPoints)
    
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    let grade = 'F'
    if (percentage >= 80) grade = 'A'
    else if (percentage >= 70) grade = 'B'
    else if (percentage >= 60) grade = 'C'
    else if (percentage >= 50) grade = 'D'
    else if (percentage >= 45) grade = 'E'

    // Determine status
    const hasTheory = exam.questions.some((q: any) => q.question_type === 'theory')
    const status = hasTheory ? 'pending_grading' : 'graded'

    // Create exam attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        student_id: user.id,
        answers: answers,
        score: earnedPoints,
        total_points: totalPoints,
        percentage: percentage,
        grade: grade,
        correct_count: correctCount,
        time_spent: timeSpent || 0,
        tab_switches: tabSwitches || 0,
        status: status,
        is_auto_submitted: isAutoSubmitted || false,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error creating attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
    }

    // Insert theory answers if any
    if (theoryQuestions.length > 0) {
      const { error: theoryError } = await supabase
        .from('theory_answers')
        .insert(
          theoryQuestions.map((tq: any) => ({
            attempt_id: attempt.id,
            question_id: tq.question_id,
            answer_text: tq.answer_text,
            points_awarded: 0
          }))
        )

      if (theoryError) {
        console.error('Error saving theory answers:', theoryError)
      }
    }

    // Notify teacher (exam creator)
    if (exam.created_by) {
      await supabase.from('notifications').insert({
        user_id: exam.created_by,
        type: 'submission_received',
        title: 'New Exam Submission',
        message: `${profile?.full_name || user.email} submitted ${exam.title}`,
        metadata: { examId, attemptId: attempt.id, studentId: user.id },
        read: false,
        created_at: new Date().toISOString()
      })
    }

    // Notify student if no theory questions (result ready immediately)
    if (!hasTheory) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'result_ready',
        title: 'Exam Result Ready',
        message: `Your result for ${exam.title} is ready. Score: ${earnedPoints}/${totalPoints} (${percentage.toFixed(1)}%)`,
        metadata: { examId, attemptId: attempt.id, score: earnedPoints, total: totalPoints },
        read: false,
        created_at: new Date().toISOString()
      })
    } else {
      // Notify student that submission is received and awaiting grading
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'submission_received',
        title: 'Exam Submitted',
        message: `Your submission for ${exam.title} has been received. Results will be available after grading.`,
        metadata: { examId, attemptId: attempt.id },
        read: false,
        created_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      attemptId: attempt.id,
      score: earnedPoints,
      total: totalPoints,
      percentage: percentage,
      grade: grade,
      hasTheory: hasTheory
    })
    
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
  }
}