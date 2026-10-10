// app/api/admin/monitor/clear-term/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  console.log('📦 API called: Clear Term Records')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { 
      action = 'archive', // 'archive' | 'delete' | 'archive_and_delete'
      term,               // e.g. 'First Term 2024/2025'
      session,            // e.g. '2024/2025'
      before_date,        // ISO date — clear anything before this
      confirmation        // must equal 'CLEAR_TERM_RECORDS'
    } = body

    // Safety check
    if (confirmation !== 'CLEAR_TERM_RECORDS') {
      return NextResponse.json({ 
        error: 'Invalid confirmation. Must pass confirmation: "CLEAR_TERM_RECORDS"' 
      }, { status: 400 })
    }

    const cutoffDate = before_date ? new Date(before_date).toISOString() : null

    // ── STEP 1: FETCH RECORDS TO ARCHIVE ─────────────────────────
    let fetchQuery = supabaseAdmin.from('exam_attempts').select('*')
    if (cutoffDate) {
      fetchQuery = fetchQuery.lt('created_at', cutoffDate)
    }

    const { data: recordsToClear, error: fetchError } = await fetchQuery

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const recordCount = recordsToClear?.length || 0
    if (recordCount === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No records found matching criteria',
        archived: 0,
        deleted: 0
      })
    }

    console.log(`📊 Found ${recordCount} records to process`)

    // ── STEP 2: ARCHIVE (if requested) ───────────────────────────
    let archivedCount = 0
    if (action === 'archive' || action === 'archive_and_delete') {
      try {
        // Ensure archive table exists (optional)
        const archiveRows = recordsToClear.map(r => ({
          ...r,
          original_id: r.id,
          archived_at: new Date().toISOString(),
          archived_term: term || 'Unknown',
          archived_session: session || 'Unknown',
          id: undefined // Let archive table auto-generate new ID
        }))

        // Remove undefined IDs
        archiveRows.forEach(r => delete r.id)

        const { error: archiveError } = await supabaseAdmin
          .from('exam_attempts_archive')
          .insert(archiveRows)

        if (archiveError) {
          console.warn('⚠️ Archive table missing or failed:', archiveError.message)
          if (action === 'archive') {
            return NextResponse.json({ 
              error: `Archive failed: ${archiveError.message}. Create the exam_attempts_archive table first or use action: "delete".` 
            }, { status: 500 })
          }
        } else {
          archivedCount = archiveRows.length
          console.log(`✅ Archived ${archivedCount} records`)
        }
      } catch (err: any) {
        console.warn('⚠️ Archive exception:', err.message)
      }
    }

    // ── STEP 3: DELETE (if requested) ────────────────────────────
    let deletedCount = 0
    if (action === 'delete' || action === 'archive_and_delete') {
      const idsToDelete = recordsToClear.map(r => r.id)

      // Delete in batches of 500
      const BATCH_SIZE = 500
      for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + BATCH_SIZE)
        const { error: deleteError } = await supabaseAdmin
          .from('exam_attempts')
          .delete()
          .in('id', batch)

        if (deleteError) {
          console.error('❌ Delete batch failed:', deleteError)
          return NextResponse.json({ 
            error: `Delete failed: ${deleteError.message}`,
            archived: archivedCount,
            deleted: deletedCount
          }, { status: 500 })
        }
        deletedCount += batch.length
      }

      console.log(`✅ Deleted ${deletedCount} records`)
    }

    // ── STEP 4: LOG THE ACTION ───────────────────────────────────
    try {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'clear_term_records',
        details: {
          term,
          session,
          before_date: cutoffDate,
          action_type: action,
          archived: archivedCount,
          deleted: deletedCount,
          total_records: recordCount
        },
        created_at: new Date().toISOString()
      })
    } catch (err) {
      // audit_logs table might not exist; non-fatal
    }

    return NextResponse.json({
      success: true,
      message: `Term records cleared successfully`,
      total: recordCount,
      archived: archivedCount,
      deleted: deletedCount,
      action
    })
  } catch (error: any) {
    console.error('❌ API FATAL ERROR:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}