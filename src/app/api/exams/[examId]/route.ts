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

    const { data: exam, error } = await supabase
      .from('exams')
      .select(`
        *,
        subject:subjects(*),
        teacher:teachers(full_name)
      `)
      .eq('id', params.examId)
      .single()

    if (error) throw error
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}