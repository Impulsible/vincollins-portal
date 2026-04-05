/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get exam to check if shuffle is enabled
    const { data: exam } = await supabase
      .from('exams')
      .select('shuffle_questions, shuffle_options')
      .eq('id', params.examId)
      .single()

    const query = supabase
      .from('questions')
      .select('*')
      .eq('exam_id', params.examId)

    const { data: questions, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    let processedQuestions = [...questions]

    // Shuffle questions if enabled
    if (exam?.shuffle_questions) {
      processedQuestions = processedQuestions.sort(() => Math.random() - 0.5)
    }

    // Shuffle options if enabled
    if (exam?.shuffle_options) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : q.options
      }))
    }

    // Remove correct_answer from response for security
    const sanitizedQuestions = processedQuestions.map(({ correct_answer, ...q }) => q)

    return NextResponse.json(sanitizedQuestions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}