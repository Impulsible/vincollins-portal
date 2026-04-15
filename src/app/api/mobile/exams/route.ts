import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient() // ✅ Add await here
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const examId = searchParams.get('examId')

  if (examId) {
    // Get single exam with questions
    const { data: exam } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('id', examId)
      .single()
    
    return NextResponse.json(exam)
  }

  if (studentId) {
    // Get student's exams
    const { data: exams } = await supabase
      .from('exams')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    
    return NextResponse.json(exams)
  }

  return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
}

export async function POST(req: Request) {
  const supabase = await createClient() // ✅ Add await here
  const { examId, studentId, answers, timeSpent } = await req.json()

  // Submit exam results
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      student_id: studentId,
      answers,
      time_spent: timeSpent,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, attemptId: data.id })
}