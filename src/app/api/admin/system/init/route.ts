// app/api/admin/system/init/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if settings already exist
    const { data: existing } = await supabase
      .from('school_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Settings already exist',
        settings: existing
      })
    }

    // ============================================
    // DYNAMICALLY CALCULATE CURRENT SESSION
    // ============================================
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Determine academic session
    let sessionStartYear, sessionEndYear
    
    if (currentMonth >= 8) {
      sessionStartYear = currentYear
      sessionEndYear = currentYear + 1
    } else {
      sessionStartYear = currentYear - 1
      sessionEndYear = currentYear
    }
    
    const currentSession = `${sessionStartYear}/${sessionEndYear}`
    
    // ============================================
    // SET CURRENT TERM TO THIRD
    // ============================================
    const currentTerm = 'third'
    
    // Third term dates
    const termStart = new Date(sessionEndYear, 3, 1)
    const termEnd = new Date(sessionEndYear, 6, 15)
    const yearStart = new Date(sessionStartYear, 8, 1)
    const yearEnd = new Date(sessionEndYear, 6, 15)
    const nextTermBegins = new Date(sessionEndYear, 8, 1)
    
    // ============================================
    // INSERT SETTINGS
    // ============================================
    const { data: settings, error } = await supabase
      .from('school_settings')
      .insert({
        current_term: currentTerm,
        current_session: currentSession,
        academic_year_start: yearStart.toISOString().split('T')[0],
        academic_year_end: yearEnd.toISOString().split('T')[0],
        term_start_date: termStart.toISOString().split('T')[0],
        term_end_date: termEnd.toISOString().split('T')[0],
        next_term_begins: nextTermBegins.toISOString().split('T')[0],
        is_term_active: true,
        promotion_status: 'pending',
        promotion_type: 'session',
        last_processed_term: null,
        last_processed_session: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating settings:', error)
      return NextResponse.json(
        { error: 'Failed to create settings: ' + error.message },
        { status: 500 }
      )
    }

    // ============================================
    // UPDATE ALL STUDENTS
    // ============================================
    await supabase
      .from('students')
      .update({
        current_term: currentTerm,
        current_session: currentSession,
        promotion_history: []
      })
      .neq('id', '')

    return NextResponse.json({
      success: true,
      message: `System initialized with ${currentTerm} term (${currentSession})`,
      settings
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}