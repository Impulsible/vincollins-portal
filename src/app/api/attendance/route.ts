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
interface StudentPresence {
  id?: string
  student_id: string
  status: 'online' | 'offline' | 'away'
  last_seen: string
  updated_at?: string
  student?: {
    id: string
    class?: string
    profiles?: {
      full_name: string
      photo_url?: string
    }
  }
}

interface PresenceStats {
  total: number
  online: number
  attendance_rate: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const classParam = searchParams.get('class')
    const status = searchParams.get('status')
    
    let query = supabase
      .from('student_presence')
      .select(`*, student:students(*, profiles(*))`)
      .order('last_seen', { ascending: false })
    
    if (classParam && classParam !== 'all') {
      query = query.eq('student.class', classParam)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    const presenceData = data as StudentPresence[]
    const total = presenceData?.length || 0
    const online = presenceData?.filter((p: StudentPresence) => p.status === 'online').length || 0
    
    const stats: PresenceStats = {
      total,
      online,
      attendance_rate: total > 0 ? (online / total) * 100 : 0
    }
    
    return NextResponse.json({
      data: presenceData,
      stats
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    // Validate required fields
    if (!body.student_id) {
      return NextResponse.json({ 
        error: 'Missing required field: student_id' 
      }, { status: 400 })
    }
    
    const presenceData = {
      ...body,
      updated_at: new Date().toISOString(),
      last_seen: body.last_seen || new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('student_presence')
      .upsert(presenceData, { onConflict: 'student_id' })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Presence updated successfully' 
    })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const body = await request.json()
    
    if (!body.student_id) {
      return NextResponse.json({ 
        error: 'Missing required field: student_id' 
      }, { status: 400 })
    }
    
    const { student_id, ...updates } = body
    
    const { data, error } = await supabase
      .from('student_presence')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString(),
        last_seen: updates.status === 'online' ? new Date().toISOString() : undefined
      })
      .eq('student_id', student_id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      data, 
      message: 'Presence updated successfully' 
    })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const action = searchParams.get('action')
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }
    
    let updateData: any = { updated_at: new Date().toISOString() }
    let message = ''
    
    switch (action) {
      case 'online':
        updateData.status = 'online'
        updateData.last_seen = new Date().toISOString()
        message = 'Student marked as online'
        break
      case 'offline':
        updateData.status = 'offline'
        updateData.last_seen = new Date().toISOString()
        message = 'Student marked as offline'
        break
      case 'away':
        updateData.status = 'away'
        updateData.last_seen = new Date().toISOString()
        message = 'Student marked as away'
        break
      case 'heartbeat':
        updateData.last_seen = new Date().toISOString()
        updateData.status = 'online'
        message = 'Heartbeat updated'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('student_presence')
      .update(updateData)
      .eq('student_id', studentId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ data, message })
  } catch (error) {
    console.error('Error updating presence status:', error)
    return NextResponse.json({ error: 'Failed to update presence status' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('student_presence')
      .delete()
      .eq('student_id', studentId)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'Presence record deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting presence:', error)
    return NextResponse.json({ error: 'Failed to delete presence' }, { status: 500 })
  }
}