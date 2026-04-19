// lib/supabase-client.ts
import { supabase } from './supabase'

export async function fetchStudentDashboardData(studentId: string, className: string) {
  try {
    // Fetch report card
    const { data: reportCard, error: reportCardError } = await supabase
      .from('report_cards')
      .select('id, status, term, academic_year, average_score')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reportCardError) {
      console.error('Report card error:', reportCardError)
    }

    // Fetch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('class', className)
      .order('created_at', { ascending: false })
      .limit(3)

    if (assignmentsError) {
      console.error('Assignments error:', assignmentsError)
    }

    // Fetch notes (with error handling for missing table)
    let notes = []
    let notesError = null
    
    try {
      const result = await supabase
        .from('notes')
        .select('*')
        .eq('class', className)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (result.error) {
        notesError = result.error
        console.error('Notes error:', result.error)
      } else {
        notes = result.data || []
      }
    } catch (err) {
      console.error('Notes table may not exist:', err)
      notesError = err
    }

    return {
      reportCard: {
        data: reportCard || null,
        error: reportCardError,
        success: !reportCardError
      },
      assignments: {
        data: assignments || [],
        error: assignmentsError,
        success: !assignmentsError
      },
      notes: {
        data: notes,
        error: notesError,
        success: !notesError
      }
    }
  } catch (error) {
    console.error('Unexpected error fetching dashboard data:', error)
    return {
      reportCard: { data: null, error: error, success: false },
      assignments: { data: [], error: error, success: false },
      notes: { data: [], error: error, success: false }
    }
  }
}