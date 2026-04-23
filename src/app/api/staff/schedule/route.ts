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
interface Schedule {
  id: string
  title: string
  description?: string
  type: 'class' | 'exam' | 'meeting' | 'event' | 'break' | 'other'
  class?: string
  subject?: string
  teacher_id?: string
  teacher_name?: string
  start_time: string
  end_time: string
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  venue?: string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'
  term?: string
  academic_year?: string
  status?: 'active' | 'cancelled' | 'completed'
  created_by?: string
  created_at?: string
  updated_at?: string
}

interface CreateScheduleDto {
  title: string
  description?: string
  type: 'class' | 'exam' | 'meeting' | 'event' | 'break' | 'other'
  class?: string
  subject?: string
  teacher_id?: string
  teacher_name?: string
  start_time: string
  end_time: string
  day?: string
  venue?: string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'
  term?: string
  academic_year?: string
  status?: 'active' | 'cancelled' | 'completed'
  created_by?: string
}

interface UpdateScheduleDto {
  id: string
  title?: string
  description?: string
  type?: 'class' | 'exam' | 'meeting' | 'event' | 'break' | 'other'
  class?: string
  subject?: string
  teacher_id?: string
  teacher_name?: string
  start_time?: string
  end_time?: string
  day?: string
  venue?: string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'
  term?: string
  academic_year?: string
  status?: 'active' | 'cancelled' | 'completed'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const classParam = searchParams.get('class')
    const type = searchParams.get('type')
    const day = searchParams.get('day')
    const teacherId = searchParams.get('teacher_id')
    const term = searchParams.get('term')
    const academicYear = searchParams.get('academic_year')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page')
    
    let query = supabase
      .from('schedules')
      .select('*', { count: 'exact' })
      .order('start_time', { ascending: true })
    
    if (classParam) query = query.eq('class', classParam)
    if (type) query = query.eq('type', type)
    if (day) query = query.eq('day', day)
    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (term) query = query.eq('term', term)
    if (academicYear) query = query.eq('academic_year', academicYear)
    if (status) query = query.eq('status', status)
    
    // Date range filter
    if (dateFrom) query = query.gte('start_time', dateFrom)
    if (dateTo) query = query.lte('end_time', dateTo)
    
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
    
    // Group schedules by day for calendar view
    const groupedByDay = data?.reduce((acc: Record<string, Schedule[]>, schedule: Schedule) => {
      const day = schedule.day || new Date(schedule.start_time).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      if (!acc[day]) acc[day] = []
      acc[day].push(schedule)
      return acc
    }, {}) || {}
    
    return NextResponse.json({ 
      data, 
      grouped: groupedByDay,
      total: count || data?.length || 0,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : data?.length || 0
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body: CreateScheduleDto = await request.json()
    
    // Validate required fields
    if (!body.title || !body.type || !body.start_time || !body.end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, start_time, end_time' 
      }, { status: 400 })
    }
    
    // Validate time range
    if (new Date(body.start_time) >= new Date(body.end_time)) {
      return NextResponse.json({ 
        error: 'Start time must be before end time' 
      }, { status: 400 })
    }
    
    const scheduleData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: body.status || 'active'
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Schedule created successfully' 
    })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { id, ...updates }: UpdateScheduleDto = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }
    
    // Validate time range if both times are provided
    if (updates.start_time && updates.end_time) {
      if (new Date(updates.start_time) >= new Date(updates.end_time)) {
        return NextResponse.json({ 
          error: 'Start time must be before end time' 
        }, { status: 400 })
      }
    }
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Schedule updated successfully' 
    })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }
    
    // Check if schedule exists
    const { data: existing, error: checkError } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', id)
      .single()
    
    if (checkError || !existing) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')
    
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }
    
    let updateData: any = { updated_at: new Date().toISOString() }
    let message = ''
    
    switch (action) {
      case 'cancel':
        updateData.status = 'cancelled'
        message = 'Schedule cancelled successfully'
        break
      case 'complete':
        updateData.status = 'completed'
        message = 'Schedule marked as completed'
        break
      case 'activate':
        updateData.status = 'active'
        message = 'Schedule activated'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data, message })
  } catch (error) {
    console.error('Error updating schedule status:', error)
    return NextResponse.json({ error: 'Failed to update schedule status' }, { status: 500 })
  }
}

// Get schedule for a specific date range (useful for calendar views)
export async function getScheduleByDateRange(dateFrom: string, dateTo: string, classParam?: string) {
  const supabase = await createRouteHandlerClient()
  
  let query = supabase
    .from('schedules')
    .select('*')
    .gte('start_time', dateFrom)
    .lte('end_time', dateTo)
    .order('start_time', { ascending: true })
  
  if (classParam) query = query.eq('class', classParam)
  
  const { data, error } = await query
  if (error) throw error
  return data
}