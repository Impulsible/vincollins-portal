// app/api/admin/end-of-term/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface StudentWithProfile {
  id: string
  class: string
  current_term: string
  current_session: string
  profiles: {
    display_name: string
    avatar_url: string
    photo_url: string
  }[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // ============================================
    // STEP 1: Get current settings
    // ============================================
    const { data: settings, error: settingsError } = await supabase
      .from('school_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingsError) {
      return NextResponse.json(
        { error: 'School settings not found. Please initialize system first.' },
        { status: 400 }
      )
    }

    // ============================================
    // STEP 2: Validate - Must be third term
    // ============================================
    if (settings.current_term !== 'third') {
      return NextResponse.json({
        success: false,
        message: `⚠️ End of session promotions can only be processed in the third term. Current term: ${settings.current_term}`,
        canProcess: false
      })
    }

    if (settings.promotion_status === 'completed') {
      return NextResponse.json({
        success: false,
        message: '⚠️ Promotions for this session have already been processed.',
        alreadyProcessed: true
      })
    }

    // ============================================
    // STEP 3: Update status to processing
    // ============================================
    await supabase
      .from('school_settings')
      .update({ 
        promotion_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)

    // ============================================
    // STEP 4: Fetch all students with their profiles
    // ============================================
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        class,
        current_term,
        current_session,
        profiles (
          display_name,
          avatar_url,
          photo_url
        )
      `)
      .order('class', { ascending: true })

    if (studentsError) {
      throw new Error('Failed to fetch students: ' + studentsError.message)
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No students found to promote.'
      })
    }

    // ============================================
    // STEP 5: Process promotions for all students
    // ============================================
    let promotionsCreated = 0
    let studentsPromoted = 0
    let skippedFinalClass = 0
    let alreadyExists = 0
    const errors: string[] = []
    const promotionHistory: any[] = []

    for (const student of students as StudentWithProfile[]) {
      try {
        const nextClass = getNextClass(student.class)
        
        if (!nextClass) {
          skippedFinalClass++
          console.log(`⏭️ Skipping ${student.profiles?.[0]?.display_name || 'Unknown'} - final class: ${student.class}`)
          continue
        }

        // Check if promotion already exists
        const { data: existing } = await supabase
          .from('pending_promotions')
          .select('id')
          .eq('student_id', student.id)
          .maybeSingle()

        if (existing) {
          alreadyExists++
          continue
        }

        const profile = student.profiles?.[0] || {}
        const studentName = profile.display_name || 'Unknown Student'
        const avatarUrl = profile.avatar_url || null
        const photoUrl = profile.photo_url || null
        
        // Create promotion record
        const { error: insertError } = await supabase
          .from('pending_promotions')
          .insert({
            student_id: student.id,
            student_name: studentName,
            current_class: student.class || 'Unknown',
            next_class: nextClass,
            status: 'pending',
            chosen_department: null,
            created_at: new Date().toISOString(),
            term: settings.current_term,
            session: settings.current_session,
            promotion_type: 'session',
            avatar_url: avatarUrl,
            photo_url: photoUrl
          })

        if (insertError) {
          errors.push(`Failed for ${studentName}: ${insertError.message}`)
          console.error('Insert error:', insertError)
        } else {
          promotionsCreated++
          promotionHistory.push({
            student_id: student.id,
            student_name: studentName,
            from_class: student.class,
            to_class: nextClass,
            term: settings.current_term,
            session: settings.current_session,
            promoted_at: new Date().toISOString()
          })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Error processing student: ${errorMsg}`)
      }
    }

    // ============================================
    // STEP 6: Update ALL students to new class, term, and session
    // ============================================
    const nextTerm = 'first'
    const nextSession = getNextSession(settings.current_session)

    console.log(`🔄 Moving from ${settings.current_term} term to ${nextTerm} term`)
    console.log(`🔄 Moving from ${settings.current_session} to ${nextSession}`)

    let studentsUpdated = 0

    for (const student of students as StudentWithProfile[]) {
      try {
        const nextClass = getNextClass(student.class)
        
        if (!nextClass) {
          continue
        }

        // Update student's class, term, and session
        const { error: updateError } = await supabase
          .from('students')
          .update({
            class: nextClass,
            current_term: nextTerm,
            current_session: nextSession,
            updated_at: new Date().toISOString()
          })
          .eq('id', student.id)

        if (updateError) {
          errors.push(`Error updating student ${student.id}: ${updateError.message}`)
        } else {
          studentsUpdated++
        }

        // Update exam attempts with new class
        await supabase
          .from('exam_attempts')
          .update({
            student_class: nextClass,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', student.id)

        // Update attendance with new class
        await supabase
          .from('attendance')
          .update({
            student_class: nextClass,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', student.id)

        // Update promotion history
        const { data: currentStudent } = await supabase
          .from('students')
          .select('promotion_history')
          .eq('id', student.id)
          .single()

        let currentHistory = currentStudent?.promotion_history || []
        if (typeof currentHistory === 'string') {
          try {
            currentHistory = JSON.parse(currentHistory)
          } catch {
            currentHistory = []
          }
        }

        const updatedHistory = [
          ...(Array.isArray(currentHistory) ? currentHistory : []),
          {
            from_class: student.class,
            to_class: nextClass,
            term: settings.current_term,
            session: settings.current_session,
            promoted_at: new Date().toISOString()
          }
        ]

        await supabase
          .from('students')
          .update({
            promotion_history: updatedHistory
          })
          .eq('id', student.id)

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Error processing student ${student.id}: ${errorMsg}`)
      }
    }

    // ============================================
    // STEP 7: Update ALL promotions to approved
    // ============================================
    const { error: approveAllError } = await supabase
      .from('pending_promotions')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')

    if (approveAllError) {
      errors.push(`Error approving all promotions: ${approveAllError.message}`)
    }

    // ============================================
    // STEP 8: Calculate next session dates
    // ============================================
    const sessionParts = settings.current_session.split('/')
    const endYear = parseInt(sessionParts[1])
    
    const nextSessionStart = new Date(endYear, 8, 1) // September 1
    const nextSessionEnd = new Date(endYear + 1, 6, 15) // July 15
    const nextTermStart = new Date(endYear, 8, 1) // September 1 (first term)
    const nextTermEnd = new Date(endYear, 11, 15) // December 15 (first term)
    const nextNextTermBegins = new Date(endYear + 1, 0, 10) // January 10

    // ============================================
    // STEP 9: Update school settings to first term and new session
    // ============================================
    await supabase
      .from('school_settings')
      .update({ 
        current_term: nextTerm,
        current_session: nextSession,
        academic_year_start: nextSessionStart.toISOString().split('T')[0],
        academic_year_end: nextSessionEnd.toISOString().split('T')[0],
        term_start_date: nextTermStart.toISOString().split('T')[0],
        term_end_date: nextTermEnd.toISOString().split('T')[0],
        next_term_begins: nextNextTermBegins.toISOString().split('T')[0],
        promotion_status: 'completed',
        promotion_date: new Date().toISOString(),
        last_processed_term: settings.current_term,
        last_processed_session: settings.current_session,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)

    // ============================================
    // STEP 10: Create notification
    // ============================================
    await supabase
      .from('notifications')
      .insert({
        title: `🎓 End of Session Promotions ${settings.current_session}`,
        message: `${studentsPromoted} students promoted. New session: ${nextSession}, New term: ${nextTerm}`,
        type: 'promotion',
        status: 'unread',
        created_at: new Date().toISOString()
      })

    // ============================================
    // STEP 11: Return success
    // ============================================
    return NextResponse.json({
      success: true,
      message: `✅ End of session promotions completed successfully!`,
      data: {
        promotionsCreated,
        studentsPromoted,
        skippedFinalClass,
        alreadyExists,
        previousTerm: settings.current_term,
        previousSession: settings.current_session,
        newTerm: nextTerm,
        newSession: nextSession,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNextClass(currentClass: string): string | undefined {
  if (!currentClass) return undefined
  
  const normalized = currentClass.trim()
  
  if (normalized === 'SS 3' || normalized === 'SS3') {
    return undefined
  }
  
  const classMapping: Record<string, string> = {
    'JSS 1': 'JSS 2',
    'JSS1': 'JSS 2',
    'JSS 2': 'JSS 3',
    'JSS2': 'JSS 3',
    'JSS 3': 'SS 1',
    'JSS3': 'SS 1',
    'SS 1': 'SS 2',
    'SS1': 'SS 2',
    'SS 2': 'SS 3',
    'SS2': 'SS 3'
  }
  
  return classMapping[normalized]
}

function getNextSession(currentSession: string): string {
  const parts = currentSession.split('/')
  if (parts.length === 2) {
    const startYear = parseInt(parts[0])
    const endYear = parseInt(parts[1])
    return `${startYear + 1}/${endYear + 1}`
  }
  return currentSession
}