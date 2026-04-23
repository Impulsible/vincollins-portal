import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to create supabase client for route handlers
async function createRouteHandlerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: any) {
          await cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Type definitions
interface ExamResult {
  id: string
  exam_id: string
  student_id: string
  score: number
  total_marks: number
  percentage: number
  grade?: string
  status: string
  submitted_at?: string
  student?: {
    id: string
    profiles?: {
      full_name: string
    }
    vin_id?: string
  }
  exam?: {
    id: string
    title: string
    subject: string
    class: string
  }
}

interface ResultStats {
  totalStudents: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('exam_id')
    const studentId = searchParams.get('student_id')
    
    let query = supabase
      .from('exam_results')
      .select(`*, student:students(*, profiles(*)), exam:exams(*)`)
      .order('percentage', { ascending: false })
    
    if (examId) query = query.eq('exam_id', examId)
    if (studentId) query = query.eq('student_id', studentId)
    
    const { data, error } = await query
    
    if (error) throw error
    
    let stats: ResultStats | null = null
    
    if (data && data.length > 0) {
      const results = data as ExamResult[]
      const scores = results.map((r: ExamResult) => r.percentage || 0)
      const passCount = results.filter((r: ExamResult) => (r.percentage || 0) >= 50).length
      
      stats = {
        totalStudents: results.length,
        averageScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        passRate: (passCount / results.length) * 100
      }
    }
    
    return NextResponse.json({ data, stats })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('exam_results')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error creating result:', error)
    return NextResponse.json({ error: 'Failed to create result' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('exam_results')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating result:', error)
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: 'Result deleted successfully' })
  } catch (error) {
    console.error('Error deleting result:', error)
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 })
  }
}