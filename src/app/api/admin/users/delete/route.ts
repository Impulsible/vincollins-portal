// app/api/admin/users/delete/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function handleDelete(req: NextRequest) {
  console.log('📦 API called: Delete User (Strict Cascade Protection)')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    // Initialize Supabase Admin with Service Role (Bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id') || searchParams.get('userId')
    
    if (!id) {
      try {
        const body = await req.json()
        id = body?.id || body?.userId
      } catch { /* ignored */ }
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🗑️ Commencing cascading deletion sequence for ID:', id)

    // ── STEP 1: UNLINK TEACHER ASSIGNMENTS (SET NULL) ──
    // Don't delete classes/subjects, just unlink the teacher so foreign keys don't fail
    const nullifyTables = [
      { name: 'classes', column: 'form_teacher_id' },
      { name: 'classes', column: 'class_teacher_id' },
      { name: 'classes', column: 'teacher_id' },
      { name: 'subjects', column: 'teacher_id' }
    ]

    for (const item of nullifyTables) {
      try {
        await supabaseAdmin
          .from(item.name)
          .update({ [item.column]: null })
          .eq(item.column, id)
      } catch (err: any) {
        // Table or column might not exist; safe to ignore
      }
    }

    // ── STEP 2: CASCADE DELETE FROM DEPENDENT TABLES ──
    const targetTables = [
      { name: 'teacher_classes', key: 'teacher_id' },
      { name: 'teacher_subjects', key: 'teacher_id' },
      { name: 'lesson_notes', key: 'teacher_id' },
      { name: 'assignments', key: 'teacher_id' },
      { name: 'exam_attempts', key: 'student_id' },
      { name: 'ca_scores', key: 'student_id' },
      { name: 'ca_scores', key: 'teacher_id' },
      { name: 'report_cards', key: 'student_id' },
      { name: 'attendance_records', key: 'student_id' },
      { name: 'attendance_records', key: 'recorded_by' },
      { name: 'student_term_progress', key: 'student_id' },
      { name: 'notifications', key: 'user_id' },
      { name: 'audit_logs', key: 'user_id' }
    ]

    for (const table of targetTables) {
      try {
        await supabaseAdmin
          .from(table.name)
          .delete()
          .eq(table.key, id)
      } catch (err: any) {
        console.warn(`⚠️ Non-fatal cascade skip for "${table.name}":`, err.message)
      }
    }

    // ── STEP 3: DELETE FROM PUBLIC PROFILES ──
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileErr && profileErr.code !== 'PGRST116') {
      console.error('❌ Base profile delete failed:', profileErr)
      return NextResponse.json({ error: `Profile deletion error: ${profileErr.message}` }, { status: 500 })
    }

    // ── STEP 4: DELETE FROM AUTHENTICATION (auth.users) ──
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authErr) {
      console.warn('⚠️ auth.admin.deleteUser warning:', authErr.message)
      // Even if auth user doesn't exist anymore, database profile is deleted
      return NextResponse.json({
        success: true,
        warning: `Database profile removed, Auth status: ${authErr.message}`,
      })
    }

    console.log('✅ User and all associated datasets permanently deleted:', id)
    return NextResponse.json({ success: true, message: 'User deleted successfully', id })
  } catch (e: any) {
    console.error('❌ DELETE FATAL ERROR:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) { return handleDelete(req) }
export async function POST(req: NextRequest) { return handleDelete(req) }