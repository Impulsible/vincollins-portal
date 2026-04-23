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
interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  academic_year: string
  session_year: string
  subject_scores: SubjectScore[]
  total_score: number
  average_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  admin_comments: string
  status: 'draft' | 'pending' | 'approved' | 'published'
  published_at: string | null
  generated_by: string
  generated_at: string
  attendance_summary: { total_days: number; present: number; absent: number }
  affective_traits: Record<string, string>
  psychomotor_skills: Record<string, string>
  student?: {
    id: string
    profiles?: {
      full_name: string
    }
    vin_id?: string
    class?: string
  }
}

interface CreateReportCardDto {
  student_id: string
  class: string
  term: string
  academic_year: string
  session_year: string
  subject_scores: SubjectScore[]
  total_score: number
  average_score: number
  grade: string
  teacher_comments?: string
  principal_comments?: string
  admin_comments?: string
  status?: 'draft' | 'pending' | 'approved' | 'published'
  attendance_summary?: { total_days: number; present: number; absent: number }
  affective_traits?: Record<string, string>
  psychomotor_skills?: Record<string, string>
  generated_by: string
  class_teacher?: string
  school_name?: string
}

interface UpdateReportCardDto {
  id: string
  teacher_comments?: string
  principal_comments?: string
  admin_comments?: string
  status?: 'draft' | 'pending' | 'approved' | 'published'
  published_at?: string | null
  subject_scores?: SubjectScore[]
  total_score?: number
  average_score?: number
  grade?: string
  attendance_summary?: { total_days: number; present: number; absent: number }
  affective_traits?: Record<string, string>
  psychomotor_skills?: Record<string, string>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const classParam = searchParams.get('class')
    const term = searchParams.get('term')
    const academicYear = searchParams.get('academic_year')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page')
    
    let query = supabase
      .from('report_cards')
      .select(`*, student:students(*, profiles(*))`, { count: 'exact' })
      .order('generated_at', { ascending: false })
    
    if (studentId) query = query.eq('student_id', studentId)
    if (classParam) query = query.eq('class', classParam)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)
    if (status) query = query.eq('status', status)
    
    // Pagination
    if (limit) {
      const pageNum = page ? parseInt(page) : 1
      const limitNum = parseInt(limit)
      const start = (pageNum - 1) * limitNum
      const end = start + limitNum - 1
      query = query.range(start, end)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    const formattedData = data?.map((r: any) => ({
      ...r,
      student: {
        ...r.student,
        full_name: r.student?.profiles?.full_name || 'Unknown'
      }
    })) || []
    
    return NextResponse.json({ 
      data: formattedData, 
      total: count || formattedData.length,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : formattedData.length
    })
  } catch (error) {
    console.error('Error fetching report cards:', error)
    return NextResponse.json({ error: 'Failed to fetch report cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body: CreateReportCardDto = await request.json()
    
    // Validate required fields
    if (!body.student_id || !body.class || !body.term || !body.academic_year) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_id, class, term, academic_year' 
      }, { status: 400 })
    }
    
    const reportCardData = {
      ...body,
      generated_at: new Date().toISOString(),
      status: body.status || 'draft',
      teacher_comments: body.teacher_comments || '',
      principal_comments: body.principal_comments || '',
      admin_comments: body.admin_comments || '',
      attendance_summary: body.attendance_summary || { total_days: 90, present: 85, absent: 5 },
      affective_traits: body.affective_traits || {
        punctuality: 'Good',
        neatness: 'Good',
        politeness: 'Good',
        cooperation: 'Good',
        leadership: 'Good'
      },
      psychomotor_skills: body.psychomotor_skills || {
        handwriting: 'Good',
        sports: 'Active',
        crafts: 'Good',
        fluency: 'Good'
      }
    }
    
    const { data, error } = await supabase
      .from('report_cards')
      .insert(reportCardData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Report card created successfully' 
    })
  } catch (error) {
    console.error('Error creating report card:', error)
    return NextResponse.json({ error: 'Failed to create report card' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { id, ...updates }: UpdateReportCardDto = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Report card ID is required' }, { status: 400 })
    }
    
    // If status is being updated to published, set published_at
    const updateData: any = { ...updates }
    if (updates.status === 'published') {
      updateData.published_at = new Date().toISOString()
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('report_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Report card updated successfully' 
    })
  } catch (error) {
    console.error('Error updating report card:', error)
    return NextResponse.json({ error: 'Failed to update report card' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Report card ID is required' }, { status: 400 })
    }
    
    // Check if report card exists
    const { data: existing, error: checkError } = await supabase
      .from('report_cards')
      .select('id, status')
      .eq('id', id)
      .single()
    
    if (checkError || !existing) {
      return NextResponse.json({ error: 'Report card not found' }, { status: 404 })
    }
    
    // Prevent deletion of published report cards
    if (existing.status === 'published') {
      return NextResponse.json({ 
        error: 'Cannot delete a published report card. Archive it instead.' 
      }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('report_cards')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report card deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting report card:', error)
    return NextResponse.json({ error: 'Failed to delete report card' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')
    
    if (!id) {
      return NextResponse.json({ error: 'Report card ID is required' }, { status: 400 })
    }
    
    let updateData: any = { updated_at: new Date().toISOString() }
    let message = ''
    
    switch (action) {
      case 'submit':
        updateData.status = 'pending'
        message = 'Report card submitted for approval'
        break
      case 'approve':
        updateData.status = 'approved'
        message = 'Report card approved'
        break
      case 'publish':
        updateData.status = 'published'
        updateData.published_at = new Date().toISOString()
        message = 'Report card published'
        break
      case 'archive':
        updateData.status = 'archived'
        message = 'Report card archived'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('report_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data, message })
  } catch (error) {
    console.error('Error updating report card status:', error)
    return NextResponse.json({ error: 'Failed to update report card status' }, { status: 500 })
  }
}