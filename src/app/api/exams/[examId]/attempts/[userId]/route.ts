/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string; userId: string }> }
) {
  try {
    const { examId, userId } = await params
    
    // Check if user has already taken this exam
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('exam_id', examId)
      .eq('student_id', userId)
      .eq('status', 'completed')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return NextResponse.json({ hasAttempted: !!data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check attempts' }, { status: 500 })
  }
}