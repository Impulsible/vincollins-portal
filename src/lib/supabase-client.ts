// src/lib/supabase-client.ts
import { supabase } from './supabase'

export async function fetchStudentDashboardData(
  studentId: string,
  className: string
) {
  try {
    const [reportCardRes, assignmentsRes, notesRes] = await Promise.allSettled([
      // ── Report card ─────────────────────────────────────────────────────
      supabase
        .from('report_cards')
        .select('id, status, term, academic_year, average_score')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // ── Assignments ──────────────────────────────────────────────────────
      supabase
        .from('assignments')
        .select('*')
        .eq('class', className)
        .order('created_at', { ascending: false })
        .limit(3),

      // ── Notes — only columns that actually exist ──────────────────────────
      // No: term filter removed if session_year doesn't exist
      supabase
        .from('notes')
        .select(
          'id, title, subject, description, file_url, file_name, ' +
          'teacher_name, class, status, created_at'
        )
        .eq('class', className)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    // ── Report card ────────────────────────────────────────────────────────
    const reportCard = reportCardRes.status === 'fulfilled'
      ? { data: reportCardRes.value.data ?? null, error: reportCardRes.value.error, success: !reportCardRes.value.error }
      : { data: null, error: reportCardRes.reason, success: false }

    // ── Assignments ────────────────────────────────────────────────────────
    const assignments = assignmentsRes.status === 'fulfilled'
      ? { data: assignmentsRes.value.data ?? [], error: assignmentsRes.value.error, success: !assignmentsRes.value.error }
      : { data: [], error: assignmentsRes.reason, success: false }

    // ── Notes ──────────────────────────────────────────────────────────────
    let notes: { data: any[]; error: any; success: boolean }

    if (notesRes.status === 'fulfilled') {
      if (notesRes.value.error) {
        console.error('[supabase-client] Notes query error:', notesRes.value.error.message)
        notes = { data: [], error: notesRes.value.error, success: false }
      } else {
        notes = { data: notesRes.value.data ?? [], error: null, success: true }
      }
    } else {
      console.error('[supabase-client] Notes query rejected:', notesRes.reason)
      notes = { data: [], error: notesRes.reason, success: false }
    }

    return { reportCard, assignments, notes }

  } catch (error) {
    console.error('[supabase-client] Unexpected error:', error)
    return {
      reportCard: { data: null, error, success: false },
      assignments: { data: [], error, success: false },
      notes: { data: [], error, success: false },
    }
  }
}