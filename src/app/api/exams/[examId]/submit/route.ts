import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const supabase = await createClient()
  const { examId } = await params  // Await and destructure params
  const body = await req.json()
  
  const { data, error } = await supabase
    .from('exam_submissions')
    .insert({
      exam_id: examId,  // Use examId instead of params.examId
      student_id: body.student_id,
      answers: body.answers,
      score: body.score,
      submitted_at: new Date().toISOString(),
    })
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}