import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      studentId, 
      class_name, 
      term_code, 
      session_year, 
      date, 
      status,
      teacher_id 
    } = body

    // Validate required fields
    if (!studentId || !class_name || !term_code || !session_year || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if attendance already exists
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id, locked')
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('term_code', term_code)
      .eq('session_year', session_year)
      .maybeSingle()

    if (existing?.locked) {
      return NextResponse.json(
        { error: 'Attendance is locked and cannot be modified' },
        { status: 403 }
      )
    }

    let result
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance_records')
        .update({ 
          status, 
          teacher_id: teacher_id || session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          student_id: studentId,
          class_name,
          term_code,
          session_year,
          date,
          status,
          teacher_id: teacher_id || session.user.id,
          marked_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save attendance' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const class_name = searchParams.get('class')
    const date = searchParams.get('date')
    const term_code = searchParams.get('term')
    const session_year = searchParams.get('session')

    if (!class_name || !date || !term_code || !session_year) {
      return NextResponse.json(
        { error: 'Missing required parameters: class, date, term, session' },
        { status: 400 }
      )
    }

    // Get students with their attendance status
    const { data: students, error } = await supabase
      .rpc('get_class_attendance', {
        p_class_name: class_name,
        p_date: date,
        p_term_code: term_code,
        p_session_year: session_year
      })

    if (error) {
      // Fallback: If RPC fails, get data directly
      console.warn('RPC failed, using fallback query:', error)
      
      // Get all students in the class
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'student')
        .eq('class', class_name)
        .eq('is_active', true)
        .order('display_name')

      // Get attendance records
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('student_id, status, locked')
        .eq('date', date)
        .eq('class_name', class_name)
        .eq('term_code', term_code)
        .eq('session_year', session_year)

      // Combine data
      const combinedData = allStudents?.map(student => {
        const record = attendanceRecords?.find(a => a.student_id === student.id)
        return {
          student_id: student.id,
          student_name: student.display_name,
          status: record?.status || null,
          locked: record?.locked || false
        }
      }) || []

      return NextResponse.json({ success: true, data: combinedData })
    }

    return NextResponse.json({ success: true, data: students })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, lock } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing record ID' },
        { status: 400 }
      )
    }

    const updateData: any = { 
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
    }

    if (lock) {
      updateData.locked = true
      updateData.locked_at = new Date().toISOString()
      updateData.locked_by = session.user.id
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Attendance PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update attendance' },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint if needed
export async function DELETE(request: Request) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing record ID' },
        { status: 400 }
      )
    }

    // Check if locked
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('locked')
      .eq('id', id)
      .single()

    if (existing?.locked) {
      return NextResponse.json(
        { error: 'Cannot delete locked attendance record' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Attendance DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete attendance' },
      { status: 500 }
    )
  }
}